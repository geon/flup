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
import { Dropper } from "./Dropper";

export class Board {
	gameMode: GameMode;
	frameCoroutine: Generator<void, void, number>;

	dropper: Dropper;
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
		this.dropper = new Dropper(dropperQueue);

		this.boardLogic = new BoardLogic();

		this.unlockingEffects = new Set();
		this.eventQueue = [];

		// The first charge must be done here, where the event can be handled.
		this.eventQueue.push(this.dropper.charge());

		this.slateRandomExp = 2 + Math.random();
	}

	makePiece(options: { color: number; key: boolean; position: Coord }) {
		const sprite = new PieceSprite(options);
		this.piecesSprites.add(sprite);
		const piece: Piece = { color: options.color, key: options.key, sprite };
		return piece;
	}

	*makeGameLogicCoroutine(): Generator<void, void, number> {
		for (;;) {
			let chainCount = 0;

			let event: Event | undefined;
			while ((event = this.eventQueue.shift())) {
				switch (event.type) {
					case "charge":
						yield* parallel([
							event.a.sprite.makeMoveCoroutine({
								to: event.a.to,
								duration:
									Coord.distance(event.a.sprite.position, event.a.to) * 50,
								easing: easings.sine,
							}),
							event.b.sprite.makeMoveCoroutine({
								to: event.b.to,
								duration:
									Coord.distance(event.b.sprite.position, event.b.to) * 50,
								easing: easings.sine,
							}),
							...event.queueMovements.map((movement) =>
								movement.sprite.makeMoveCoroutine({
									to: movement.to,
									duration: 150,
									easing: easings.sine,
								}),
							),
						]);
						break;

					case "move":
						yield* parallel(
							event.movements.map((movement) =>
								movement.sprite.makeMoveCoroutine({
									to: movement.to,
									duration: 50,
									easing: easings.sine,
								}),
							),
						);
						break;

					case "fall":
						const timePerPieceHeight = 100;
						yield* parallel(
							event.movements.map((collumn) =>
								parallel(
									collumn.map((movement, index) =>
										queue([
											waitMs(index * 50),
											movement.sprite.makeMoveCoroutine({
												to: movement.to,
												duration:
													Math.sqrt(
														Coord.distance(
															movement.sprite.position,
															movement.to,
														),
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
							event.unlockings.map((unlocking) =>
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

					case "punish":
						yield* queue(
							event.movements.map((collumn) =>
								parallel(
									collumn.map((movement) =>
										movement.sprite.makeMoveCoroutine({
											to: movement.to,
											duration: 100,
											easing: easings.sine,
										}),
									),
								),
							),
						);
						break;

					default:
						exhaustionChecker(event);
						break;
				}
			}

			// The player scored, so punish opponents.
			if (chainCount) {
				this.gameMode.onUnlockedChains(this, chainCount);
			}

			const gameOver = this.boardLogic.checkForGameOver();
			if (gameOver) {
				this.gameMode.onGameOver(this);
				yield* this.startGameOverEffect();
				break;
			}

			yield;
		}
	}

	moveLeft() {
		this.eventQueue.push(this.dropper.moveLeft());
	}

	moveRight() {
		this.eventQueue.push(this.dropper.moveRight());
	}

	rotate() {
		this.eventQueue.push(this.dropper.rotate());
	}

	drop() {
		const drops = this.dropper.getDrops();
		this.eventQueue.push(...this.boardLogic.drop(drops));
		this.eventQueue.push(this.dropper.charge());
	}

	*startGameOverEffect() {
		yield* parallel(
			// TODO: Use the piece set instead?
			this.boardLogic.pieces
				.filter((piece): piece is Piece => !!piece)
				.map((piece) => {
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

	punish(avatar: Avatar, punishCount: number) {
		// Add pieces.
		const movements = [];
		for (let i = 0; i < punishCount; ++i) {
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

			const rowMovements = this.boardLogic.punishLogic(pieces);

			movements.push(rowMovements);
		}

		this.eventQueue.push({ type: "punish", movements });
	}

	*makeFrameCoroutine(): Generator<void, void, number> {
		const gameLogicCoroutine = this.makeGameLogicCoroutine();

		// Run pieces coroutines concurrently.
		for (;;) {
			const deltaTime = yield;

			gameLogicCoroutine.next(deltaTime);

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

	draw(context: CanvasRenderingContext2D, center: Coord, scale: number) {
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
					(pseudoRandomByXY % numTiles) - numBaseTiles + numBaseTiles;
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
			unlockingEffect.draw(context, center, scale, BoardLogic.size);
		}

		// Draw all pieces.
		for (const sprite of this.piecesSprites) {
			sprite.draw(context, center, scale, disturbance, BoardLogic.size);
		}
	}
}

function exhaustionChecker(_unknownCase: never) {
	throw new Error("Unknown case.");
}
