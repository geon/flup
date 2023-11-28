import { Avatar } from "./Avatar";
import { BoardLogic } from "./BoardLogic";
import { Coord } from "./Coord";
import { PieceCycle } from "./PieceCycle";
import { SpriteSet, SpriteSheet } from "./SpriteSheet";
import { waitMs } from "./Animation";

type BaseSpriteName = "base" | "glass";

export class AvatarMonolith extends Avatar {
	currentBaseSprite: BaseSpriteName;
	hasWriting: boolean;
	hasGalaxy: boolean;
	animationQueue: Array<Generator<void, void, number>>;

	constructor() {
		super();
		this.currentBaseSprite = "base";
		this.hasWriting = false;
		this.hasGalaxy = false;
		this.animationQueue = [];
	}

	static size: number = 256;
	static sprites: SpriteSet;
	static spriteSheet: SpriteSheet;

	getSize() {
		return AvatarMonolith.size;
	}

	static getSprites() {
		if (!AvatarMonolith.sprites) {
			AvatarMonolith.sprites = AvatarMonolith.getSpriteSheet().getSprites();
		}

		return AvatarMonolith.sprites;
	}

	static getSpriteSheet() {
		if (!AvatarMonolith.spriteSheet) {
			AvatarMonolith.spriteSheet = new SpriteSheet(
				AvatarMonolith.getSpriteSheetSettings(),
			);
		}

		return AvatarMonolith.spriteSheet;
	}

	static getSpriteSheetSettings() {
		const sprites = [
			{
				name: "base",
				sheetPosition: new Coord({ x: 0, y: 0 }),
				sheetSize: new Coord({ x: 1, y: 1 }),
			},
			{
				name: "writing",
				sheetPosition: new Coord({ x: 1, y: 0 }),
				sheetSize: new Coord({ x: 1, y: 1 }),
			},
			{
				name: "glass",
				sheetPosition: new Coord({ x: 2, y: 0 }),
				sheetSize: new Coord({ x: 1, y: 1 }),
			},
			{
				name: "galaxy",
				sheetPosition: new Coord({ x: 3, y: 0 }),
				sheetSize: new Coord({ x: 1, y: 1 }),
			},
		];

		return {
			imageFileName: "monolith.png",
			gridSize: new Coord({ x: 4, y: 1 }),
			spriteSettings: sprites,
		};
	}

	onUnlock() {
		this.animationQueue.push(this.makeUnlockCoroutine());
	}
	onPunish() {
		this.animationQueue.push(this.makePunishCoroutine());
	}
	onWin() {
		this.animationQueue.push(this.makeWinCoroutine());
	}
	onLose() {
		this.animationQueue.push(this.makeLoseCoroutine());
	}

	*generatePunishColors(): Generator<Array<number>, never, void> {
		let cycleShift = 0;
		for (;;) {
			for (let i = 0; i < 2; ++i) {
				const colors = [];
				for (let x = 0; x < BoardLogic.size.x; x++) {
					colors.push(Math.floor((cycleShift + x) / 2) % PieceCycle.numColors);
				}
				yield colors;
			}
			cycleShift += 2;
		}
	}

	*makeFrameCoroutine(): Generator<void, void, number> {
		for (;;) {
			const animation = this.animationQueue.shift() || this.makeIdleCoroutine();
			yield* animation;
		}
	}

	*makeUnlockCoroutine(): Generator<void, void, number> {
		const blinkTime = 50;
		for (let i = 0; i < 3; ++i) {
			this.hasGalaxy = true;
			yield* waitMs(blinkTime);
			this.hasGalaxy = false;
			yield* waitMs(blinkTime);
		}
		this.hasGalaxy = true;
		yield* waitMs(1000);
		this.hasGalaxy = false;
	}

	*makePunishCoroutine(): Generator<void, void, number> {
		const blinkTime = 50;
		for (let i = 0; i < 3; ++i) {
			this.hasWriting = true;
			yield* waitMs(blinkTime);
			this.hasWriting = false;
			yield* waitMs(blinkTime);
		}
		this.hasWriting = true;
		yield* waitMs(1000);
		this.hasWriting = false;
	}

	*makeWinCoroutine(): Generator<void, void, number> {
		this.hasGalaxy = true;
		this.currentBaseSprite = "glass";
	}

	*makeLoseCoroutine(): Generator<void, void, number> {
		this.hasWriting = true;
	}

	*makeIdleCoroutine(): Generator<void, void, number> {
		yield;
	}

	draw(context: CanvasRenderingContext2D, avatarCenter: Coord) {
		const sprites = AvatarMonolith.getSprites();

		const size = new Coord({
			x: AvatarMonolith.size,
			y: AvatarMonolith.size,
		});

		if (this.hasGalaxy) {
			sprites.galaxy.draw(
				context,
				Coord.subtract(avatarCenter, Coord.scale(size, 0.5)),
				size,
			);
		}

		sprites[this.currentBaseSprite].draw(
			context,
			Coord.subtract(avatarCenter, Coord.scale(size, 0.5)),
			size,
		);

		if (this.hasWriting) {
			sprites.writing.draw(
				context,
				Coord.subtract(avatarCenter, Coord.scale(size, 0.5)),
				size,
			);
		}
	}
}
