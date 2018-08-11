import { easings, waitMs, queue, parallel, makeIterable } from "./Animation";
import { App } from "./App";
import { Avatar } from "./Avatar";
import { Coord } from "./Coord";
import { Dropper } from "./Dropper";
import { DropperQueue } from "./DropperQueue";
import { GameMode } from "./GameMode";
import { Piece } from "./Piece";
import { PieceSprite } from "./PieceSprite";
import { PieceCycle } from "./PieceCycle";
import { UnlockingEffect } from "./UnlockingEffect";

interface FallMove {
	piece: PieceSprite;
	from: Coord;
	distance: number;
	numConsecutive: number;
}

interface PunishMove {
	sprite: PieceSprite;
	to: Coord;
}

export class Board {
	gameMode: GameMode;
	frameCoroutine: IterableIterator<void>;

	pieces: Array<Piece | undefined>;
	piecesSprites: Set<PieceSprite>;

	unlockingEffects: Array<UnlockingEffect>;
	pieceCycle: PieceCycle;
	dropperQueue: DropperQueue;

	dropper: Dropper;
	slateRandomExp: number;

	constructor(options: {
		gameMode: GameMode;
		pieceCycle: PieceCycle;
		dropperSide: "left" | "right";
	}) {
		this.gameMode = options.gameMode;
		this.frameCoroutine = this.makeFrameCoroutine();

		this.pieces = [];
		this.piecesSprites = new Set();

		this.unlockingEffects = [];
		this.pieceCycle = options.pieceCycle;
		this.dropperQueue = new DropperQueue(
			{ pieceCycle: this.pieceCycle, board: this },
			options.dropperSide,
		);
		this.dropper = new Dropper(this.dropperQueue);
		this.slateRandomExp = 2 + Math.random();

		// var colors = [
		// 	undefined, undefined, {color: 1}, undefined, undefined, undefined, undefined, undefined,
		// 	undefined, undefined, {color: 0}, undefined, undefined, undefined, undefined, undefined
		// ];
		// for (var i = colors.length - 1; i >= 0; i--) {
		// 	if (colors[i])
		// 		this.pieces[i] = this.makePiece(colors[i]);
		// };
		// this.makePiecesFall(0);
		// options.pieceCycle[0] = this.makePiece({color: 0, key:true});
		// options.pieceCycle[1] = this.makePiece({color: 0, key:false});
	}

	makePiece(options: { color: number; key: boolean; position: Coord }) {
		const sprite = new PieceSprite(options);
		this.piecesSprites.add(sprite);
		const piece: Piece = { color: options.color, key: options.key, sprite };
		return piece;
	}

	static size: Coord = new Coord({ x: 8, y: 18 });

	static gameOverUnlockEffectDelayPerPieceWidth: number = 100;

	static xyToIndex(x: number, y: number) {
		return x + y * Board.size.x;
	}

	static coordToIndex(coord: Coord) {
		return Board.xyToIndex(coord.x, coord.y);
	}

	static indexToCoord(index: number) {
		return new Coord({
			x: index % Board.size.x,
			y: Math.floor(index / Board.size.x),
		});
	}

	static getWidth() {
		return (Board.size.x + 2) * PieceSprite.size;
	}

	static getHeight() {
		return (Board.size.y + 2) * PieceSprite.size;
	}

	*makeGameLogicCoroutine(): IterableIterator<void> {
		for (;;) {
			yield;

			let foundChains = true;

			while (foundChains) {
				const moves = this.makePiecesFall();

				const timePerPieceHeight = 100;
				yield* parallel(
					moves.map(move =>
						queue([
							waitMs(move.numConsecutive * 50),
							move.piece.makeMoveCoroutine({
								to: new Coord({
									x: move.from.x,
									y: move.from.y + move.distance,
								}),
								duration: Math.sqrt(move.distance) * timePerPieceHeight,
								easing: easings.easeInQuad,
							}),
						]),
					),
				);

				const unlockedPieces = this.unlockChains();
				foundChains = !!unlockedPieces.length;

				yield* parallel(
					unlockedPieces.map((piece, i) => {
						const unlockingEffect = new UnlockingEffect(
							piece.color,
							piece.sprite.position,
						);
						this.unlockingEffects.push(unlockingEffect);
						const unlockingEffectCoroutine = unlockingEffect.makeFrameCoroutine();
						return queue([
							waitMs(i * 50),
							makeIterable(() => {
								// Remove the graphical representation.
								this.piecesSprites.delete(piece.sprite);
							}),
							unlockingEffectCoroutine,
							makeIterable(() => {
								// Remove the unlockingEffect.
								const index = this.unlockingEffects.indexOf(unlockingEffect);
								this.unlockingEffects.splice(index, 1);
							}),
						]);
					}),
				);

				if (foundChains) {
					// The player scored, so punish opponents.
					this.gameMode.onUnlockedChains(this);
				}
			}

			const gameOver = this.checkForGameOver();
			if (gameOver) {
				yield* this.startGameOverEffect();

				break;
			}
		}
	}

	moveLeft() {
		this.dropper.moveLeft();
	}

	moveRight() {
		this.dropper.moveRight();
	}

	rotate() {
		this.dropper.rotate();
	}

	drop() {
		const drops = this.dropper.getDrops();

		// Make sure the board space is not used.
		if (drops.some(drop => !!this.pieces[Board.coordToIndex(drop.coord)])) {
		}

		for (const drop of drops) {
			// Add the pieces.
			this.pieces[Board.coordToIndex(drop.coord)] = drop.piece;
		}

		this.dropper.charge();
	}

	makePiecesFall(): ReadonlyArray<FallMove> {
		/*

		This might seem like an awful lot of code for something as simple as
		making the pieces fall.

		Turns out it isn't that simple...

		I need to set the animation properly so it is initiated only when a
		piece *starts* falling. That makes it tricky to do it in multiple
		passes. I also want a slight delay in the animation for each
		consecutive piece in a falling block. That means I need to keep track
		of wether the line of pieces is broken.

		If you have a better solution, I'm happy to see it.

		*/

		const moves: Array<FallMove> = [];

		// For each collumn.
		for (let x = 0; x < Board.size.x; ++x) {
			// Start at the bottom.
			let yPut = Board.size.y - 1;

			// Search for a space that can be filled from above.
			while (yPut && this.pieces[Board.xyToIndex(x, yPut)]) {
				--yPut;
			}

			let yGet = yPut - 1;

			let numConsecutive = 0;

			// For the whole collumn...
			collumnLoop: while (yGet >= 0) {
				// Search for a piece to put in the empty space.
				while (!this.pieces[Board.xyToIndex(x, yGet)]) {
					--yGet;

					numConsecutive = 0;

					if (yGet < 0) {
						break collumnLoop;
					}
				}

				const getPos = Board.xyToIndex(x, yGet);
				const putPos = Board.xyToIndex(x, yPut);

				// Move the piece.
				this.pieces[putPos] = this.pieces[getPos];
				this.pieces[getPos] = undefined;
				const piece = this.pieces[putPos]!;

				// Record moves.
				moves.push({
					piece: piece.sprite,
					from: Board.indexToCoord(getPos),
					distance: yPut - yGet,
					numConsecutive,
				});
				++numConsecutive;

				// Raise the put/put-positions.
				--yGet;
				--yPut;
			}
		}

		return moves;
	}

	unlockChains(): Array<Piece> {
		return this.pieces
			.map((_piece, position) => position)
			.filter(position => {
				const piece = this.pieces[position];
				return (
					piece &&
					piece.key &&
					this.matchingNeighborsOfPosition(position).length
				);
			})
			.map(position => this.unLockChainRecursively(position))
			.reduce((soFar, current) => [...soFar, ...current], [] as Array<Piece>);
	}

	unLockChainRecursively(position: number): Array<Piece> {
		// Must search for neighbors before removing the piece matching against.
		const matchingNeighborPositions = this.matchingNeighborsOfPosition(
			position,
		);

		const unlockedPiece = this.pieces[position];
		this.pieces[position] = undefined;

		// Another branch of the chain might have reached here before.
		if (!unlockedPiece) {
			return [];
		}

		// For all matching neighbors, recurse.
		const unlockedChainsFromNeighbors = matchingNeighborPositions.map(
			neighborPosition => this.unLockChainRecursively(neighborPosition),
		);

		return [
			unlockedPiece,
			...unlockedChainsFromNeighbors.reduce(
				(soFar, current) => [...soFar, ...current],
				[] as Array<Piece>,
			),
		];
	}

	matchingNeighborsOfPosition(position: number) {
		const piece = this.pieces[position];

		if (!piece) {
			return [];
		}

		const neighborPositions = [];

		const coord = Board.indexToCoord(position);

		// Right
		if (coord.x < Board.size.x - 1) {
			neighborPositions.push(position + 1);
		}

		// Left
		if (coord.x > 0) {
			neighborPositions.push(position - 1);
		}

		// Down
		if (coord.y < Board.size.y - 1) {
			neighborPositions.push(position + Board.size.x);
		}

		// Up
		if (coord.y > 0) {
			neighborPositions.push(position - Board.size.x);
		}

		const matchingNeighborPositions = [];
		const color = piece.color;
		for (let i = neighborPositions.length - 1; i >= 0; i--) {
			const neighborPosition = neighborPositions[i];
			const neighborPiece = this.pieces[neighborPosition];

			if (neighborPiece && neighborPiece.color === color) {
				matchingNeighborPositions.push(neighborPosition);
			}
		}

		return matchingNeighborPositions;
	}

	checkForGameOver() {
		// Check if there are any pieces sticking up into the top 2 rows of the board.
		return this.pieces.slice(0, Board.size.x * 2).some(piece => !!piece);
	}

	*startGameOverEffect() {
		yield* parallel(
			this.pieces.filter((piece): piece is Piece => !!piece).map(piece => {
				const unlockingEffect = new UnlockingEffect(
					piece.color,
					piece.sprite.position,
				);
				this.unlockingEffects.push(unlockingEffect);
				const unlockingEffectCoroutine = unlockingEffect.makeFrameCoroutine();
				return queue([
					// Unlock all pieces, from the center and out.
					waitMs(
						Coord.distance(
							piece.sprite.position,
							Coord.scale(Board.size, 0.5),
						) * Board.gameOverUnlockEffectDelayPerPieceWidth,
					),
					makeIterable(() => {
						// Remove the graphical representation.
						this.piecesSprites.delete(piece.sprite);
					}),
					unlockingEffectCoroutine,
					makeIterable(() => {
						// Remove the unlockingEffect.
						const index = this.unlockingEffects.indexOf(unlockingEffect);
						this.unlockingEffects.splice(index, 1);
					}),
				]);
			}),
		);
	}

	punishLogic(row: ReadonlyArray<Piece>): ReadonlyArray<PunishMove> {
		const movements: Array<PunishMove> = [];

		// Make room. Move everything 1 step up.
		for (let y = 0; y < Board.size.y - 1; y++) {
			for (let x = 0; x < Board.size.x; x++) {
				const from = Board.xyToIndex(x, y + 1);
				const to = Board.xyToIndex(x, y);

				const movedPiece = this.pieces[from];
				this.pieces[to] = movedPiece;

				if (movedPiece) {
					movements.push({
						to: Board.indexToCoord(to),
						sprite: movedPiece.sprite,
					});
				}
			}
		}

		// Add a row of pieces at the bottom.
		row.forEach((piece, x) => {
			const to = Board.xyToIndex(x, Board.size.y - 1);
			this.pieces[to] = piece;
			movements.push({
				to: Board.indexToCoord(to),
				sprite: piece.sprite,
			});
		});

		return movements;
	}

	punish(avatar: Avatar) {
		// Add pieces.
		const row = avatar.getPunishColors();

		const pieces = row.map((color, x): Piece => {
			const key = false;
			const position = new Coord({
				x,
				// Start the animation just outside the Board.
				y: Board.size.y,
			});

			return this.makePiece({
				color,
				key,
				position,
			});
		});

		const movements = this.punishLogic(pieces);

		// Animate.
		for (const movement of movements) {
			movement.sprite.move({
				to: movement.to,
				duration: DropperQueue.dropperQueueTimePerPieceWidth,
				easing: easings.sine,
				delay: 0,
			});
		}
	}

	*makeFrameCoroutine(): IterableIterator<void> {
		const gameLogicCoroutine = this.makeGameLogicCoroutine();

		// Run pieces coroutines concurrently.
		for (;;) {
			const deltaTime: number = yield;

			const done = gameLogicCoroutine.next(deltaTime).done;
			if (done) {
				break;
			}

			for (const sprite of this.piecesSprites) {
				sprite.frameCoroutine.next(deltaTime);
			}
		}
	}

	draw(
		context: CanvasRenderingContext2D,
		deltaTime: number,
		center: Coord,
		scale: number,
	) {
		// Draw the board background.

		const slateSprites = App.getSprites();
		for (let y = 0; y < Board.size.y; ++y) {
			for (let x = 0; x < Board.size.x; ++x) {
				const numTiles = 8;
				const numBaseTiles = 2;

				// This is just BS. The magic munber don't mean anything.
				const pseudoRandomByXY = Math.floor(
					Math.pow(113 + x + y * Board.size.y, this.slateRandomExp),
				);
				const basePattern = pseudoRandomByXY % numBaseTiles;
				const details =
					pseudoRandomByXY % numTiles - numBaseTiles + numBaseTiles;
				const useDetail = !(Math.floor(pseudoRandomByXY / 13) % 10);

				slateSprites[useDetail ? details : basePattern].draw(
					context,
					new Coord({
						x: center.x + (x - Board.size.x / 2) * scale * PieceSprite.size,
						y: center.y + (y - Board.size.y / 2) * scale * PieceSprite.size,
					}),
					new Coord({
						x: PieceSprite.size * scale,
						y: PieceSprite.size * scale,
					}),
				);
			}
		}

		// Calculate how much to stress the player. (Piece wobbling increases as
		// they approach the maximum height before game over.)
		let height = 0;
		for (let i = 0; i < this.pieces.length; i++) {
			if (this.pieces[i]) {
				const position = Board.indexToCoord(i);
				height = Board.size.y - 1 - position.y;
				break;
			}
		}
		const ratio = height / (Board.size.y - 2 - 1);
		const cutOffPoint = 0.65;
		const disturbance =
			ratio < cutOffPoint ? 0 : (ratio - cutOffPoint) / (1 - cutOffPoint);

		// Draw the unlocking effects.
		for (const unlockingEffect of this.unlockingEffects) {
			unlockingEffect.draw(context, deltaTime, center, scale, Board.size);
		}

		// Draw all pieces.
		for (const sprite of this.piecesSprites) {
			sprite.draw(context, deltaTime, center, scale, disturbance, Board.size);
		}
	}
}
