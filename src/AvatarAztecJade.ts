import { Avatar } from "./Avatar";
import { BoardLogic } from "./BoardLogic";
import { Coord } from "./Coord";
import { PieceCycle } from "./PieceCycle";
import { SpriteSet, SpriteSheet } from "./SpriteSheet";

export class AvatarAztecJade extends Avatar {
	accumulatedDeltaTime: number;

	constructor() {
		super();
		this.accumulatedDeltaTime = 0;
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

	draw(
		context: CanvasRenderingContext2D,
		deltaTime: number,
		avatarCenter: Coord,
	) {
		this.accumulatedDeltaTime += deltaTime;

		const sprites = AvatarAztecJade.getSprites();

		const size = new Coord({
			x: AvatarAztecJade.size,
			y: AvatarAztecJade.size,
		});

		const diskSizeFactor =
			1 - (1 + Math.sin(this.accumulatedDeltaTime / 1000 * 3)) / 2 * 0.1;

		sprites.gold.draw(
			context,
			Coord.subtract(avatarCenter, Coord.scale(size, 0.5 * diskSizeFactor)),
			Coord.scale(size, diskSizeFactor),
		);

		sprites.idol.draw(
			context,
			Coord.subtract(avatarCenter, Coord.scale(size, 0.5)),
			size,
		);
	}
}
