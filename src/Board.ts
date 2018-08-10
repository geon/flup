import { easings, waitMs, queue, parallel, makeIterable } from "./Animation";
import { App } from "./App";
import { Avatar } from "./Avatar";
import { Coord } from "./Coord";
import { Dropper } from "./Dropper";
import { DropperQueue } from "./DropperQueue";
import { GameMode } from "./GameMode";
import { Piece } from "./Piece";
import { PieceCycle } from "./PieceCycle";
import { UnlockingEffect } from "./UnlockingEffect";

interface FallMove {
	piece: Piece;
	from: Coord;
	distance: number;
	numConsecutive: number;
}

export class Board {
	gameMode: GameMode;
	frameCoroutine: IterableIterator<void>;

	pieces: Array<Piece | undefined>;
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
		this.unlockingEffects = [];
		this.pieceCycle = options.pieceCycle;
		this.dropperQueue = new DropperQueue(
			{ pieceCycle: this.pieceCycle },
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
		// 		this.pieces[i] = new Piece(colors[i]);
		// };
		// this.makePiecesFall(0);
		// options.pieceCycle[0] = new Piece({color: 0, key:true});
		// options.pieceCycle[1] = new Piece({color: 0, key:false});
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
		return (Board.size.x + 2) * Piece.size;
	}

	static getHeight() {
		return (Board.size.y + 2) * Piece.size;
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
						const unlockingEffect = new UnlockingEffect(piece);
						this.unlockingEffects.push(unlockingEffect);
						const unlockingEffectCoroutine = unlockingEffect.makeFrameCoroutine();
						return queue([
							waitMs(i * 50),
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
					piece,
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
			this.pieces
				.map((piece, position) => ({ piece: piece!, position }))
				.filter(({ piece }) => !!piece)
				.map(({ piece, position }) => {
					const unlockingEffect = new UnlockingEffect(piece);
					this.unlockingEffects.push(unlockingEffect);
					const unlockingEffectCoroutine = unlockingEffect.makeFrameCoroutine();
					return queue([
						// Unlock all pieces, from the center and out.
						waitMs(
							Coord.distance(piece.position, Coord.scale(Board.size, 0.5)) *
								Board.gameOverUnlockEffectDelayPerPieceWidth,
						),
						makeIterable(() => {
							// Remove the piece.
							this.pieces.splice(position, 1);
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

	punish(avatar: Avatar) {
		// Make room.
		for (let y = 0; y < Board.size.y - 1; y++) {
			for (let x = 0; x < Board.size.x; x++) {
				this.pieces[Board.xyToIndex(x, y)] = this.pieces[
					Board.xyToIndex(x, y + 1)
				];
			}
		}

		// Add pieces.
		const row = avatar.getPunishColors();

		for (let x = 0; x < row.length; x++) {
			const piece = new Piece({
				color: row[x],
				key: false,
				position: new Coord({
					x,
					// Start the animation just outside the Board.
					y: Board.size.y,
				}),
			});

			this.pieces[Board.xyToIndex(x, Board.size.y - 1)] = piece;
		}

		// Animate.
		for (let i = 0; i < this.pieces.length; i++) {
			const piece = this.pieces[i];
			if (piece) {
				piece.move({
					to: Board.indexToCoord(i),
					duration: DropperQueue.dropperQueueTimePerPieceWidth,
					easing: easings.sine,
					delay: 0,
				});
			}
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

			[
				...this.pieces,
				...this.dropperQueue.pieces,
				this.dropper.pieceA,
				this.dropper.pieceB,
			]
				.filter((piece): piece is Piece => !!piece)
				.map(piece => piece.frameCoroutine)
				.forEach(coroutine => coroutine.next(deltaTime));
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
						x: center.x + (x - Board.size.x / 2) * scale * Piece.size,
						y: center.y + (y - Board.size.y / 2) * scale * Piece.size,
					}),
					new Coord({
						x: Piece.size * scale,
						y: Piece.size * scale,
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

		// Draw the board pieces.
		for (let i = 0, length = this.pieces.length; i < length; ++i) {
			const piece = this.pieces[i];
			if (piece !== undefined) {
				piece.draw(context, deltaTime, center, scale, disturbance, Board.size);
			}
		}

		// Draw the dropper queue.
		this.dropperQueue.draw(context, deltaTime, center, scale, Board.size);

		// Draw the dropper pieces.
		this.dropper.draw(context, deltaTime, center, scale, Board.size);
	}
}
