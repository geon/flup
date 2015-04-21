
/// <reference path="Avatar.ts"/>
/// <reference path="Coord.ts"/>
/// <reference path="SpriteSheet.ts"/>


class AvatarAztecJade implements Avatar {

	character: number;


	constructor (options: {character: number}) {

		this.character = options.character;
	}


	static size: number = 256;
	static sprites;
	static spriteSheet;


	static getSprites () {

		if (!AvatarAztecJade.sprites) {

			AvatarAztecJade.sprites = AvatarAztecJade.getSpriteSheet().getSprites();
		}

		return AvatarAztecJade.sprites;
	}


	static getSpriteSheet () {

		if (!AvatarAztecJade.spriteSheet) {

			AvatarAztecJade.spriteSheet = new SpriteSheet(AvatarAztecJade.getSpriteSheetSettings());
		}

		return AvatarAztecJade.spriteSheet;
	}


	static getSpriteSheetSettings () {

		var sprites = [
			{
				name: "gold",
				sheetPosition: new Coord({x:0, y:0}),
				sheetSize: new Coord({x:1, y:1})
			},
			{
				name: "clay",
				sheetPosition: new Coord({x:1, y:0}),
				sheetSize: new Coord({x:0, y:0})
			},
			{
				name: "idol",
				sheetPosition: new Coord({x:0, y:1}),
				sheetSize: new Coord({x:1, y:1})
			},
			{
				name: "shards",
				sheetPosition: new Coord({x:1, y:1}),
				sheetSize: new Coord({x:0, y:1})
			}
		];

		return {
			imageFileName: "aztec-jade.png",
			gridSize: new Coord({x:2, y:2}),
			spriteSettings: sprites	
		}
	}


	draw (context: CanvasRenderingContext2D, currentTime: number, avatarCenter: Coord) {

		var sprites = AvatarAztecJade.getSprites();

		var size = new Coord({
			x: AvatarAztecJade.size,
			y: AvatarAztecJade.size
		});

		var diskSizeFactor = (1 + Math.sin(currentTime/1000 * 3))/2;

		sprites["gold"].draw(
			context,
			Coord.subtract(avatarCenter, Coord.scale(size, 0.5 * diskSizeFactor)),
			Coord.scale(size, diskSizeFactor)
		);

		sprites["idol"].draw(
			context,
			Coord.subtract(avatarCenter, Coord.scale(size, 0.5)),
			size
		);
	}
}
