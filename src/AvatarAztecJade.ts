import { Avatar } from "./Avatar";
import { BoardLogic } from "./BoardLogic";
import { Coord } from "./Coord";
import { PieceCycle } from "./PieceCycle";
import { SpriteSet, SpriteSheet } from "./SpriteSheet";
import { animateInterpolation, easings, waitMs } from "./Animation";

const baseDiskSize = 1;
const slightlySmallerDiskSize = baseDiskSize * 0.98;
const smallDiskSize = baseDiskSize * 0.8;
const enlargedDiskSize = baseDiskSize * 1.1;

function makeNumberInterpolator(a: number, b: number) {
	return (factor: number) => a * (1 - factor) + b * factor;
}

export class AvatarAztecJade extends Avatar {
	diskSizeFactor: number;
	animationQueue: Array<IterableIterator<void>>;

	constructor() {
		super();
		this.diskSizeFactor = baseDiskSize;
		this.animationQueue = [];
	}

	static size: number = 256;
	static sprites: SpriteSet;
	static spriteSheet: SpriteSheet;

	getSize() {
		return AvatarAztecJade.size;
	}

	static getSprites() {
		if (!AvatarAztecJade.sprites) {
			AvatarAztecJade.sprites = AvatarAztecJade.getSpriteSheet().getSprites();
		}

		return AvatarAztecJade.sprites;
	}

	static getSpriteSheet() {
		if (!AvatarAztecJade.spriteSheet) {
			AvatarAztecJade.spriteSheet = new SpriteSheet(
				AvatarAztecJade.getSpriteSheetSettings(),
			);
		}

		return AvatarAztecJade.spriteSheet;
	}

	static getSpriteSheetSettings() {
		const sprites = [
			{
				name: "gold",
				sheetPosition: new Coord({ x: 0, y: 0 }),
				sheetSize: new Coord({ x: 1, y: 1 }),
			},
			{
				name: "clay",
				sheetPosition: new Coord({ x: 1, y: 0 }),
				sheetSize: new Coord({ x: 0, y: 0 }),
			},
			{
				name: "idol",
				sheetPosition: new Coord({ x: 0, y: 1 }),
				sheetSize: new Coord({ x: 1, y: 1 }),
			},
			{
				name: "shards",
				sheetPosition: new Coord({ x: 1, y: 1 }),
				sheetSize: new Coord({ x: 0, y: 1 }),
			},
		];

		return {
			imageFileName: "aztec-jade.png",
			gridSize: new Coord({ x: 2, y: 2 }),
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
		let rowNumber = 0;
		for (;;) {
			++rowNumber;

			const colors = [];
			for (let x = 0; x < BoardLogic.size.x; x++) {
				colors.push(Math.floor((rowNumber + x) / 2) % PieceCycle.numColors);
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
		const stepTime = 200;

		const interpolator = makeNumberInterpolator(baseDiskSize, smallDiskSize);

		yield* animateInterpolation(stepTime, factor => {
			this.diskSizeFactor = interpolator(easings.sine2(factor));
		});
		yield* animateInterpolation(stepTime, factor => {
			this.diskSizeFactor = interpolator(easings.sine2(1 - factor));
		});
	}

	*makePunishCoroutine(): IterableIterator<void> {
		// TODO
	}

	*makeWinCoroutine(): IterableIterator<void> {
		const stepTime = 200;

		yield* animateInterpolation(stepTime, factor => {
			this.diskSizeFactor = easings.sine2(
				makeNumberInterpolator(baseDiskSize, enlargedDiskSize)(factor),
			);
		});

		for (;;) {
			const interpolator = makeNumberInterpolator(
				enlargedDiskSize,
				baseDiskSize,
			);

			yield* animateInterpolation(stepTime, factor => {
				this.diskSizeFactor = interpolator(easings.sine2(factor));
			});
			yield* animateInterpolation(stepTime, factor => {
				this.diskSizeFactor = interpolator(easings.sine2(1 - factor));
			});
		}
	}

	*makeLoseCoroutine(): IterableIterator<void> {
		// TODO
	}

	*makeIdleCoroutine(): IterableIterator<void> {
		const stepTime = 100;

		const interpolator = makeNumberInterpolator(
			baseDiskSize,
			slightlySmallerDiskSize,
		);

		for (let i = 0; i < 2; ++i) {
			yield* animateInterpolation(stepTime, factor => {
				this.diskSizeFactor = interpolator(easings.sine2(factor));
			});
			yield* animateInterpolation(stepTime, factor => {
				this.diskSizeFactor = interpolator(easings.sine2(1 - factor));
			});
		}
		yield* waitMs(1200);
	}

	draw(context: CanvasRenderingContext2D, avatarCenter: Coord) {
		const sprites = AvatarAztecJade.getSprites();

		const size = new Coord({
			x: AvatarAztecJade.size,
			y: AvatarAztecJade.size,
		});

		sprites.gold.draw(
			context,
			Coord.subtract(
				avatarCenter,
				Coord.scale(size, 0.5 * this.diskSizeFactor),
			),
			Coord.scale(size, this.diskSizeFactor),
		);

		sprites.idol.draw(
			context,
			Coord.subtract(avatarCenter, Coord.scale(size, 0.5)),
			size,
		);
	}
}
