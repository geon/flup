import { Avatar } from "./Avatar";
import { BoardLogic } from "./BoardLogic";
import { Coord } from "./Coord";
import { PieceCycle } from "./PieceCycle";
import { SpriteSet, SpriteSheet } from "./SpriteSheet";

export class AvatarAztecJade extends Avatar {
	diskSizeFactor: number;

	constructor() {
		super();
		this.diskSizeFactor = 1;
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
		// this.animationQueue.push(this.makeUnlockCoroutine());
	}
	onPunish() {
		// this.animationQueue.push(this.makePunishCoroutine());
	}
	onWin() {
		// this.animationQueue.push(this.makeWinCoroutine());
	}
	onLose() {
		// this.animationQueue.push(this.makeLoseCoroutine());
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
		let accumulatedDeltaTime = 0;
		for (;;) {
			accumulatedDeltaTime += yield;
			this.diskSizeFactor =
				1 - (1 + Math.sin(accumulatedDeltaTime / 1000 * 3)) / 2 * 0.1;
		}
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
