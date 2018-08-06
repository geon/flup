import { Coord } from "./Coord";
import { PieceCycle } from "./PieceCycle";
import { SpriteSet, SpriteSheet } from "./SpriteSheet";
import { animateInterpolation, queue, waitMs } from "./Animation";

export class Piece {
	color: number;
	key: boolean;
	position: Coord;
	frameCoroutine: IterableIterator<void>;
	animationCoroutine?: IterableIterator<void>;
	unlockEffectDelay: number;
	accumulatedDeltaTime: number;

	constructor(options: { color: number; key: boolean; position: Coord }) {
		this.color = options.color;
		this.key = options.key;
		this.position = options.position;
		this.unlockEffectDelay = 0;
		this.accumulatedDeltaTime = 0;
		this.frameCoroutine = this.makeFrameCoroutine();
	}

	static size = 32;
	static sprites: SpriteSet | undefined;
	static spriteSheet: SpriteSheet | undefined;

	static getSprites() {
		if (!Piece.sprites) {
			Piece.sprites = Piece.getSpriteSheet().getSprites();
		}

		return Piece.sprites;
	}

	static getSpriteSheet() {
		if (!Piece.spriteSheet) {
			Piece.spriteSheet = new SpriteSheet(Piece.getSpriteSheetSettings());
		}

		return Piece.spriteSheet;
	}

	static getSpriteSheetSettings() {
		const sprites: Array<{
			name: string;
			sheetPosition: Coord;
			sheetSize: Coord;
		}> = [];

		for (let i = 0; i < PieceCycle.numColors; ++i) {
			sprites.push({
				name: "piece" + i,
				sheetPosition: new Coord({ x: 0, y: i }),
				sheetSize: new Coord({ x: 1, y: 1 }),
			});

			sprites.push({
				name: "key" + i,
				sheetPosition: new Coord({ x: 1, y: i }),
				sheetSize: new Coord({ x: 1, y: 1 }),
			});
		}

		return {
			imageFileName: "pieces.png",
			gridSize: new Coord({ x: 4, y: 4 }),
			spriteSettings: sprites,
		};
	}

	*makeFrameCoroutine(): IterableIterator<void> {
		// I would just `yield*`, but `animationCoroutine` may be replaced at any frame.
		for (;;) {
			const deltaTime: number = yield;

			if (this.animationCoroutine) {
				const done = this.animationCoroutine.next(deltaTime).done;
				if (done) {
					this.animationCoroutine = undefined;
				}
			}
		}
	}

	queueUpAnimation(newPart: IterableIterator<void>) {
		this.animationCoroutine = this.animationCoroutine
			? queue([this.animationCoroutine, newPart])
			: newPart;
	}

	*makeMoveCoroutine({
		to,
		duration,
		easing,
	}: {
		to: Coord;
		duration: number;
		easing: (t: number) => number;
	}): IterableIterator<void> {
		const from = this.position;

		yield* animateInterpolation(duration, timeFactor => {
			this.position = Coord.interpolate(from, to, easing(timeFactor));
		});
	}

	move(options: {
		to: Coord;
		duration: number;
		easing: (t: number) => number;
		delay: number;
	}) {
		this.queueUpAnimation(waitMs(options.delay));
		this.queueUpAnimation(this.makeMoveCoroutine(options));
	}

	draw(
		context: CanvasRenderingContext2D,
		deltaTime: number,
		boardCenter: Coord,
		boardScale: number,
		disturbance: number,
		boardSize: Coord,
	) {
		this.accumulatedDeltaTime += deltaTime;

		const jitterX =
			disturbance *
			(Piece.size *
				boardScale *
				0.05 *
				Math.sin(
					this.accumulatedDeltaTime / 1000 * 27 +
						this.position.x +
						this.position.y * 3,
				));
		const jitterY =
			disturbance *
			(Piece.size *
				boardScale *
				0.05 *
				Math.sin(
					this.accumulatedDeltaTime / 1000 * 21 +
						this.position.y +
						this.position.x * 2,
				));
		const jitterZ =
			disturbance *
			(Piece.size *
				boardScale *
				0.1 *
				Math.sin(
					this.accumulatedDeltaTime / 1000 * 13 +
						this.position.y +
						this.position.x * 5,
				));

		Piece.getSprites()[(this.key ? "key" : "piece") + this.color].draw(
			context,
			new Coord({
				x:
					boardCenter.x +
					(this.position.x / boardSize.x - 0.5) *
						boardSize.x *
						Piece.size *
						boardScale +
					Piece.size / 2 -
					0.5 * (Piece.size + jitterZ) +
					jitterX,
				y:
					boardCenter.y +
					(this.position.y / boardSize.y - 0.5) *
						boardSize.y *
						Piece.size *
						boardScale +
					Piece.size / 2 -
					0.5 * (Piece.size + jitterZ) +
					jitterY,
			}),
			new Coord({
				x: Piece.size * boardScale,
				y: Piece.size * boardScale,
			}),
		);
	}
}
