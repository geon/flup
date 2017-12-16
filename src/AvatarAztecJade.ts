
import {Avatar} from "./Avatar";
import {Coord} from "./Coord";
import {SpriteSheet} from "./SpriteSheet";
import {Piece} from "./Piece";
import {PieceCycle} from "./PieceCycle";
import {AnimationQueue} from "./AnimationQueue";

export class AvatarAztecJade implements Avatar {

	rowNumber: number;
	accumulatedDeltaTime: number;

	constructor () {

		this.rowNumber = 0;
		this.accumulatedDeltaTime = 0;
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


	getPunishRow (width: number, y: number) {

		var pieces: Piece[] = [];

		for (var x = 0; x < width; x++) {

			pieces.push(new Piece({
				color: (x+this.rowNumber) % PieceCycle.numColors,
				key: false,
				animationQueue: new AnimationQueue(new Coord({
					x: x,
					y: y
				})),
			}));
		}

		++this.rowNumber;

		return pieces;
	}


	draw (context: CanvasRenderingContext2D, deltaTime: number, avatarCenter: Coord) {

		this.accumulatedDeltaTime += deltaTime;

		var sprites = AvatarAztecJade.getSprites();

		var size = new Coord({
			x: AvatarAztecJade.size,
			y: AvatarAztecJade.size
		});

		var diskSizeFactor = (1 + Math.sin(this.accumulatedDeltaTime/1000 * 3))/2;

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
