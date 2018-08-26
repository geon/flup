import { Avatar } from "./Avatar";
import { BoardLogic } from "./BoardLogic";
import { Coord } from "./Coord";
import { PieceCycle } from "./PieceCycle";
import { SpriteSet, SpriteSheet } from "./SpriteSheet";
import { waitMs, animateInterpolation, easings } from "./Animation";

type WingSpriteName =
	| "wingsClosed"
	| "wingsTransition1"
	| "wingsTransition2"
	| "wingsTransition3"
	| "wingsOpen";

export class AvatarOwl extends Avatar {
	bobFactor: number;
	currentWingSprite: WingSpriteName;
	animationQueue: Array<IterableIterator<void>>;

	constructor() {
		super();
		this.bobFactor = 0;
		this.currentWingSprite = "wingsClosed";
		this.animationQueue = [];
	}

	static size: number = 256;
	static sprites: SpriteSet;
	static spriteSheet: SpriteSheet;

	getSize() {
		return AvatarOwl.size;
	}

	static getSprites() {
		if (!AvatarOwl.sprites) {
			AvatarOwl.sprites = AvatarOwl.getSpriteSheet().getSprites();
		}

		return AvatarOwl.sprites;
	}

	static getSpriteSheet() {
		if (!AvatarOwl.spriteSheet) {
			AvatarOwl.spriteSheet = new SpriteSheet(
				AvatarOwl.getSpriteSheetSettings(),
			);
		}

		return AvatarOwl.spriteSheet;
	}

	static getSpriteSheetSettings() {
		const sprites = [
			{
				name: "head",
				sheetPosition: new Coord({ x: 0, y: 0 }),
				sheetSize: new Coord({ x: 1, y: 1 }),
			},
			{
				name: "headSpin1",
				sheetPosition: new Coord({ x: 0, y: 0 }),
				sheetSize: new Coord({ x: 1, y: 1 }),
			},
			{
				name: "headSpin2",
				sheetPosition: new Coord({ x: 0, y: 0 }),
				sheetSize: new Coord({ x: 2, y: 1 }),
			},
			{
				name: "headSpin3",
				sheetPosition: new Coord({ x: 0, y: 0 }),
				sheetSize: new Coord({ x: 3, y: 1 }),
			},
			{
				name: "headSpin4",
				sheetPosition: new Coord({ x: 0, y: 0 }),
				sheetSize: new Coord({ x: 4, y: 1 }),
			},
			{
				name: "headSpin5",
				sheetPosition: new Coord({ x: 0, y: 0 }),
				sheetSize: new Coord({ x: 5, y: 1 }),
			},
			{
				name: "body",
				sheetPosition: new Coord({ x: 0, y: 1 }),
				sheetSize: new Coord({ x: 1, y: 1 }),
			},
			{
				name: "wingsClosed",
				sheetPosition: new Coord({ x: 1, y: 1 }),
				sheetSize: new Coord({ x: 0, y: 0 }),
			},
			{
				name: "wingsTransition1",
				sheetPosition: new Coord({ x: 2, y: 1 }),
				sheetSize: new Coord({ x: 0, y: 0 }),
			},
			{
				name: "wingsTransition2",
				sheetPosition: new Coord({ x: 3, y: 1 }),
				sheetSize: new Coord({ x: 0, y: 0 }),
			},
			{
				name: "wingsTransition3",
				sheetPosition: new Coord({ x: 4, y: 1 }),
				sheetSize: new Coord({ x: 0, y: 0 }),
			},
			{
				name: "wingsOpen",
				sheetPosition: new Coord({ x: 5, y: 1 }),
				sheetSize: new Coord({ x: 0, y: 0 }),
			},
		];

		return {
			imageFileName: "owl.png",
			gridSize: new Coord({ x: 6, y: 2 }),
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

	*generatePunishColors() {
		for (;;) {
			const colors = [];
			for (let x = 0; x < BoardLogic.size.x; x++) {
				colors.push(x % PieceCycle.numColors);
			}
			yield colors;
		}
	}

	*makeFrameCoroutine(): IterableIterator<void> {
		for (;;) {
			const animation = this.animationQueue.shift() || this.makeIdleCoroutine();
			yield* animation;
		}
	}

	*makeUnlockCoroutine(): IterableIterator<void> {
		const wingFlapCycle: ReadonlyArray<{
			name: WingSpriteName;
			time: number;
		}> = [
			{ name: "wingsTransition1", time: 50 },
			{ name: "wingsTransition2", time: 50 },
			{ name: "wingsTransition3", time: 50 },
			{ name: "wingsOpen", time: 1000 },
			{ name: "wingsTransition3", time: 50 },
			{ name: "wingsTransition2", time: 50 },
			{ name: "wingsTransition1", time: 50 },
			{ name: "wingsClosed", time: 0 },
		];

		for (const frame of wingFlapCycle) {
			this.currentWingSprite = frame.name;
			yield* waitMs(frame.time);
		}
	}

	*makePunishCoroutine(): IterableIterator<void> {
		// TODO
	}

	*makeWinCoroutine(): IterableIterator<void> {
		const wingFlapCycle: ReadonlyArray<{
			name: WingSpriteName;
			time: number;
		}> = [
			{ name: "wingsTransition1", time: 50 },
			{ name: "wingsTransition2", time: 50 },
			{ name: "wingsTransition3", time: 50 },
			{ name: "wingsOpen", time: 50 },
			{ name: "wingsTransition3", time: 50 },
			{ name: "wingsTransition2", time: 50 },
			{ name: "wingsTransition1", time: 50 },
			{ name: "wingsClosed", time: 50 },
		];

		for (;;) {
			for (const frame of wingFlapCycle) {
				this.currentWingSprite = frame.name;
				yield* waitMs(frame.time);
			}
		}
	}

	*makeLoseCoroutine(): IterableIterator<void> {
		// TODO
	}

	*makeIdleCoroutine(): IterableIterator<void> {
		const stepTime = 500;

		yield* waitMs(stepTime * 2);

		// Starting in the middle, bob up...
		yield* animateInterpolation(stepTime, factor => {
			this.bobFactor = easings.sine(0 + 1 * factor);
		});
		// ...all the way down...
		yield* animateInterpolation(stepTime, factor => {
			this.bobFactor = easings.sine(1 - 2 * factor);
		});
		// ...and back to normal.
		yield* animateInterpolation(stepTime, factor => {
			this.bobFactor = easings.sine(-1 + 1 * factor);
		});
	}

	draw(context: CanvasRenderingContext2D, avatarCenter: Coord) {
		const sprites = AvatarOwl.getSprites();

		const size = new Coord({
			x: AvatarOwl.size,
			y: AvatarOwl.size,
		});

		sprites[this.currentWingSprite].draw(
			context,
			Coord.subtract(avatarCenter, Coord.scale(size, 0.5)),
			size,
		);

		sprites.body.draw(
			context,
			Coord.subtract(avatarCenter, Coord.scale(size, 0.5)),
			size,
		);

		sprites.head.draw(
			context,
			Coord.add(
				new Coord({ x: 0, y: this.bobFactor * 2 }),
				Coord.subtract(avatarCenter, Coord.scale(size, 0.5)),
			),
			size,
		);
	}
}
