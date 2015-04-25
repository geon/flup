
/// <reference path="Coord.ts"/>
/// <reference path="Sprite.ts"/>
/// <reference path="jquery.d.ts" />


class SpriteSheet {

	imageFileName: string;
	gridSize: Coord;
	spriteSettings: {
		name: string,
		sheetPosition: Coord,
		sheetSize: Coord
	}[];
	image: HTMLImageElement;


	constructor (
		spriteSheet: {
			imageFileName: string;
			gridSize: Coord;
			spriteSettings: {
				name: string,
				sheetPosition: Coord,
				sheetSize: Coord
			}[];
		}
	) {

		this.imageFileName = spriteSheet.imageFileName;
		this.gridSize = spriteSheet.gridSize;
		this.spriteSettings = spriteSheet.spriteSettings;

		this.image = new Image();
	}


	loadImage () {

		var promise = $.Deferred();
		$(this.image).load(promise.resolve);
		$(this.image).error(promise.reject);

		this.image.src = "graphics/"+this.imageFileName;

		return promise;	
	}


	getSprites () {

		var sprites = {};

		for (var i = this.spriteSettings.length - 1; i >= 0; i--) {
			sprites[this.spriteSettings[i].name] = new Sprite(
				this,
				this.spriteSettings[i].sheetPosition,
				this.spriteSettings[i].sheetSize
			);
		};

		return sprites;	
	}
}
