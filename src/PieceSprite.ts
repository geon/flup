import { Coord } from "./Coord";
import { PieceCycle } from "./PieceCycle";
import { SpriteSet, SpriteSheet } from "./SpriteSheet";
import { animateInterpolation, queue } from "./Animation";

export class PieceSprite {
	spriteName: string;
	position: Coord;
	frameCoroutine: IterableIterator<void>;
	animationCoroutine?: IterableIterator<void>;
	accumulatedDeltaTime: number;

	constructor(options: { color: number; key: boolean; position: Coord }) {
		this.spriteName = (options.key ? "key" : "piece") + options.color;
		this.position = options.position;
		this.accumulatedDeltaTime = 0;
		this.frameCoroutine = this.makeFrameCoroutine();
	}

	static size = 32;
	static sprites: SpriteSet | undefined;
	static spriteSheet: SpriteSheet | undefined;

	static getSprites() {
		if (!PieceSprite.sprites) {
			PieceSprite.sprites = PieceSprite.getSpriteSheet().getSprites();
		}

		return PieceSprite.sprites;
	}

	static getSpriteSheet() {
		if (!PieceSprite.spriteSheet) {
			PieceSprite.spriteSheet = new SpriteSheet(
				PieceSprite.getSpriteSheetSettings(),
			);
		}

		return PieceSprite.spriteSheet;
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

			this.accumulatedDeltaTime += deltaTime;

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

	draw(
		context: CanvasRenderingContext2D,
		boardCenter: Coord,
		boardScale: number,
		disturbance: number,
		boardSize: Coord,
	) {
		const jitterX =
			disturbance *
			(PieceSprite.size *
				boardScale *
				0.05 *
				Math.sin(
					this.accumulatedDeltaTime / 1000 * 27 +
						this.position.x +
						this.position.y * 3,
				));
		const jitterY =
			disturbance *
			(PieceSprite.size *
				boardScale *
				0.05 *
				Math.sin(
					this.accumulatedDeltaTime / 1000 * 21 +
						this.position.y +
						this.position.x * 2,
				));
		const jitterZ =
			disturbance *
			(PieceSprite.size *
				boardScale *
				0.1 *
				Math.sin(
					this.accumulatedDeltaTime / 1000 * 13 +
						this.position.y +
						this.position.x * 5,
				));

		PieceSprite.getSprites()[this.spriteName].draw(
			context,
			new Coord({
				x:
					boardCenter.x +
					(this.position.x / boardSize.x - 0.5) *
						boardSize.x *
						PieceSprite.size *
						boardScale +
					PieceSprite.size / 2 -
					0.5 * (PieceSprite.size + jitterZ) +
					jitterX,
				y:
					boardCenter.y +
					(this.position.y / boardSize.y - 0.5) *
						boardSize.y *
						PieceSprite.size *
						boardScale +
					PieceSprite.size / 2 -
					0.5 * (PieceSprite.size + jitterZ) +
					jitterY,
			}),
			new Coord({
				x: PieceSprite.size * boardScale,
				y: PieceSprite.size * boardScale,
			}),
		);
	}
}
