import { easings, waitMs, queue, parallel, makeIterable } from "./Animation";
import { App } from "./App";
import { Avatar } from "./Avatar";
import { Coord } from "./Coord";
import { DropperQueue } from "./DropperQueue";
import { GameMode } from "./GameMode";
import { Piece } from "./Piece";
import { PieceSprite } from "./PieceSprite";
import { PieceCycle } from "./PieceCycle";
import { UnlockingEffect } from "./UnlockingEffect";
import { BoardLogic, Event } from "./BoardLogic";

export class Board {
	gameMode: GameMode;
	frameCoroutine: IterableIterator<void>;

	boardLogic: BoardLogic;

	piecesSprites: Set<PieceSprite>;
	unlockingEffects: Set<UnlockingEffect>;
	eventQueue: Array<Event>;

	slateRandomExp: number;

	constructor(options: {
		gameMode: GameMode;
		pieceCycle: PieceCycle;
		dropperSide: "left" | "right";
	}) {
		this.gameMode = options.gameMode;
		this.frameCoroutine = this.makeFrameCoroutine();

		this.piecesSprites = new Set();

		const dropperQueue = new DropperQueue(
			{ pieceCycle: options.pieceCycle, board: this },
			options.dropperSide,
		);

		this.boardLogic = new BoardLogic({
			pieceCycle: options.pieceCycle,
			dropperQueue,
		});

		this.unlockingEffects = new Set();
		this.eventQueue = [];

		this.slateRandomExp = 2 + Math.random();
	}

	makePiece(options: { color: number; key: boolean; position: Coord }) {
		const sprite = new PieceSprite(options);
		this.piecesSprites.add(sprite);
		const piece: Piece = { color: options.color, key: options.key, sprite };
		return piece;
	}

	*makeGameLogicCoroutine(): IterableIterator<void> {
		for (;;) {
			const event = this.eventQueue.shift();

			if (!event) {
				yield;
				continue;
			}

			let chainCount = 0;

			switch (event.type) {
				case "fall":
					const timePerPieceHeight = 100;
					yield* parallel(
						event.movements.map(collumn =>
							parallel(
								collumn.map((movement, index) =>
									queue([
										waitMs(index * 50),
										movement.sprite.makeMoveCoroutine({
											to: movement.to,
											duration:
												Math.sqrt(
													Coord.distance(movement.sprite.position, movement.to),
												) * timePerPieceHeight,
											easing: easings.easeInQuad,
										}),
									]),
								),
							),
						),
					);
					break;

				case "unlocking":
					++chainCount;
					yield* parallel(
						event.unlockings.map(unlocking =>
							queue([
								waitMs(unlocking.depth * 50),
								makeIterable(() => {
									// Remove the graphical representation.
									this.piecesSprites.delete(unlocking.sprite);

									// Replace with the unlocking effect.
									this.unlockingEffects.add(
										new UnlockingEffect(
											unlocking.color,
											unlocking.sprite.position,
										),
									);
								}),
							]),
						),
					);
					break;
			}

			// The player scored, so punish opponents.
			if (chainCount) {
				this.gameMode.onUnlockedChains(this, chainCount);
			}

			const gameOver = this.boardLogic.checkForGameOver();
			if (gameOver) {
				yield* this.startGameOverEffect();
				break;
			}
		}
	}

	moveLeft() {
		this.boardLogic.moveLeft();
	}

	moveRight() {
		this.boardLogic.moveRight();
	}

	rotate() {
		this.boardLogic.rotate();
	}

	drop() {
		this.eventQueue.push(...this.boardLogic.drop());
	}

	*startGameOverEffect() {
		yield* parallel(
			// TODO: Use the piece set instead?
			this.boardLogic.pieces
				.filter((piece): piece is Piece => !!piece)
				.map(piece => {
					return queue([
						// Unlock all pieces, from the center and out.
						waitMs(
							Coord.distance(
								piece.sprite.position,
								Coord.scale(BoardLogic.size, 0.5),
							) * 100,
						),
						makeIterable(() => {
							// Remove the graphical representation.
							this.piecesSprites.delete(piece.sprite);

							// Replace with the unlocking effect.
							this.unlockingEffects.add(
								new UnlockingEffect(piece.color, piece.sprite.position),
							);
						}),
					]);
				}),
		);
	}

	punish(avatar: Avatar) {
		// Add pieces.
		const row = avatar.getPunishColors();

		const pieces = row.map((color, x): Piece => {
			const key = false;
			const position = new Coord({
				x,
				// Start the animation just outside the Board.
				y: BoardLogic.size.y,
			});

			return this.makePiece({
				color,
				key,
				position,
			});
		});

		const movements = this.boardLogic.punishLogic(pieces);

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

			for (const unlockingEffect of this.unlockingEffects) {
				const done = unlockingEffect.frameCoroutine.next(deltaTime).done;
				if (done) {
					// Remove the unlockingEffect.
					this.unlockingEffects.delete(unlockingEffect);
				}
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
		for (let y = 0; y < BoardLogic.size.y; ++y) {
			for (let x = 0; x < BoardLogic.size.x; ++x) {
				const numTiles = 8;
				const numBaseTiles = 2;

				// This is just BS. The magic munber don't mean anything.
				const pseudoRandomByXY = Math.floor(
					Math.pow(113 + x + y * BoardLogic.size.y, this.slateRandomExp),
				);
				const basePattern = pseudoRandomByXY % numBaseTiles;
				const details =
					pseudoRandomByXY % numTiles - numBaseTiles + numBaseTiles;
				const useDetail = !(Math.floor(pseudoRandomByXY / 13) % 10);

				slateSprites[useDetail ? details : basePattern].draw(
					context,
					new Coord({
						x:
							center.x + (x - BoardLogic.size.x / 2) * scale * PieceSprite.size,
						y:
							center.y + (y - BoardLogic.size.y / 2) * scale * PieceSprite.size,
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
		// TODO: Move ratio calculation to BoardLogic.
		let height = 0;
		for (let i = 0; i < this.boardLogic.pieces.length; i++) {
			if (this.boardLogic.pieces[i]) {
				const position = BoardLogic.indexToCoord(i);
				height = BoardLogic.size.y - 1 - position.y;
				break;
			}
		}
		const ratio = height / (BoardLogic.size.y - 2 - 1);
		const cutOffPoint = 0.65;
		const disturbance =
			ratio < cutOffPoint ? 0 : (ratio - cutOffPoint) / (1 - cutOffPoint);

		// Draw the unlocking effects.
		for (const unlockingEffect of this.unlockingEffects) {
			unlockingEffect.draw(context, deltaTime, center, scale, BoardLogic.size);
		}

		// Draw all pieces.
		for (const sprite of this.piecesSprites) {
			sprite.draw(
				context,
				deltaTime,
				center,
				scale,
				disturbance,
				BoardLogic.size,
			);
		}
	}
}
