import { Coord } from "./Coord";
import { Sprite } from "./Sprite";
/// <reference path="jquery.d.ts" />

export interface SpriteSet {
	[name: string]: Sprite;
}

export class SpriteSheet {
	imageFileName: string;
	gridSize: Coord;
	spriteSettings: Array<{
		name: string;
		sheetPosition: Coord;
		sheetSize: Coord;
	}>;
	image: HTMLImageElement;

	constructor(spriteSheet: {
		imageFileName: string;
		gridSize: Coord;
		spriteSettings: Array<{
			name: string;
			sheetPosition: Coord;
			sheetSize: Coord;
		}>;
	}) {
		this.imageFileName = spriteSheet.imageFileName;
		this.gridSize = spriteSheet.gridSize;
		this.spriteSettings = spriteSheet.spriteSettings;

		this.image = new Image();
	}

	loadImage() {
		return new Promise<void>((resolve, reject) => {
			this.image.onload = () => resolve();
			this.image.onerror = () =>
				reject(new Error("Could not load sprites."));

			this.image.src = "graphics/" + this.imageFileName;
		});
	}

	getSprites() {
		const sprites: SpriteSet = {};

		for (const spriteSetting of this.spriteSettings) {
			sprites[spriteSetting.name] = new Sprite(
				this,
				spriteSetting.sheetPosition,
				spriteSetting.sheetSize,
			);
		}

		return sprites;
	}
}
