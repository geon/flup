
import {Coord} from "./Coord";
import {SpriteSheet} from "./SpriteSheet";

export class Sprite {

	sheetPosition: Coord;
	sheetSize: Coord;
	spriteSheet: SpriteSheet;


	constructor (spriteSheet: SpriteSheet, sheetPosition: Coord, sheetSize: Coord) {

		this.sheetPosition = sheetPosition;
		this.sheetSize = sheetSize;
		this.spriteSheet = spriteSheet;
	}


	draw (context: CanvasRenderingContext2D, position: Coord, size: Coord) {

		context.drawImage(
			this.spriteSheet.image,

			// Source xywh
			this.sheetPosition.x * this.spriteSheet.image.width  / this.spriteSheet.gridSize.x,
			this.sheetPosition.y * this.spriteSheet.image.height / this.spriteSheet.gridSize.y,
			this.spriteSheet.image.width  / this.spriteSheet.gridSize.x,
			this.spriteSheet.image.height / this.spriteSheet.gridSize.y,

			// Destination xywh
			position.x,
			position.y,
			size.x,
			size.y
		);
	}
}
