
"use strict";


function Sprite (spriteSheet, sheetPosition, sheetSize) {

	this.sheetPosition = sheetPosition;
	this.sheetSize = sheetSize;
	this.spriteSheet = spriteSheet;
};


Sprite.prototype.draw = function (context, position, size) {

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
