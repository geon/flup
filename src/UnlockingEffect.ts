import { AnimationGenerator } from "./Animation";
import { Coord } from "./Coord";
import { PieceColor } from "./Piece";
import { PieceSprite } from "./PieceSprite";
import { SpriteSet, SpriteSheet } from "./SpriteSheet";

type Variation = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export class UnlockingEffect {
	color: PieceColor;
	coord: Coord;
	accumulatedDeltaTime: number;
	particles: {
		readonly variation: Variation;
		readonly initialVelocity: Coord;
	}[];
	frameCoroutine: AnimationGenerator;

	constructor(color: PieceColor, position: Coord) {
		this.color = color;
		this.coord = position;
		this.accumulatedDeltaTime = 0;

		this.particles = [];
		for (let i = 0; i < 8; i++) {
			this.particles.push({
				variation: i as Variation,
				initialVelocity: new Coord({
					// Spread a little less sideways.
					x: (Math.random() * 2 - 1) * 1.5,
					// Spray up a bit more than down.
					y: (Math.random() * 2 - 1) * 2 - 0.4,
				}).scaled(0.35),
			});
		}

		this.frameCoroutine = this.makeFrameCoroutine();
	}

	static size: number = 16;
	static gravity: number = 0.001;
	static duration: number = 3000;
	static sprites:
		| SpriteSet<`color ${PieceColor}, variation ${Variation}`>
		| undefined;
	static spriteSheet: SpriteSheet | undefined;

	static getSprites = () => {
		if (!UnlockingEffect.sprites) {
			UnlockingEffect.sprites = UnlockingEffect.getSpriteSheet().getSprites();
		}

		return UnlockingEffect.sprites;
	};

	static getSpriteSheet = () => {
		if (!UnlockingEffect.spriteSheet) {
			const sprites: Array<{
				name: string;
				sheetPosition: Coord;
				sheetSize: Coord;
			}> = [];

			for (let i = 0; i < 4; ++i) {
				for (let j = 0; j < 8; ++j) {
					sprites.push({
						name: "color " + i + ", variation " + j,
						sheetPosition: new Coord({
							x: 4 + (j % 4),
							y: i * 2 + Math.floor(j / 4),
						}),
						sheetSize: new Coord({ x: 1, y: 1 }),
					});
				}
			}

			UnlockingEffect.spriteSheet = new SpriteSheet({
				imageFileName: "pieces.png",
				gridSize: new Coord({ x: 8, y: 8 }),
				spriteSettings: sprites,
			});
		}

		return UnlockingEffect.spriteSheet;
	};

	*makeFrameCoroutine(): AnimationGenerator {
		// TODO: Move the animation here.

		for (;;) {
			const deltaTime = yield;
			this.accumulatedDeltaTime += deltaTime;

			if (this.accumulatedDeltaTime > UnlockingEffect.duration) {
				return;
			}
		}
	}

	draw(
		context: CanvasRenderingContext2D,
		boardCenter: Coord,
		boardScale: number,
		boardSize: Coord,
	) {
		const origin = new Coord({
			x:
				boardCenter.x +
				(this.coord.x / boardSize.x - 0.5) *
					boardSize.x *
					PieceSprite.size *
					boardScale +
				PieceSprite.size / 2 -
				0.5 * UnlockingEffect.size,
			y:
				boardCenter.y +
				(this.coord.y / boardSize.y - 0.5) *
					boardSize.y *
					PieceSprite.size *
					boardScale +
				PieceSprite.size / 2 -
				0.5 * UnlockingEffect.size,
		});

		for (const particle of this.particles) {
			UnlockingEffect.getSprites()[
				`color ${this.color}, variation ${particle.variation}`
			].draw(
				context,
				new Coord({
					x: origin.x + particle.initialVelocity.x * this.accumulatedDeltaTime,
					y:
						origin.y +
						particle.initialVelocity.y * this.accumulatedDeltaTime +
						UnlockingEffect.gravity *
							this.accumulatedDeltaTime *
							this.accumulatedDeltaTime,
				}),
				new Coord({
					x: UnlockingEffect.size * boardScale,
					y: UnlockingEffect.size * boardScale,
				}),
			);
		}
	}
}
