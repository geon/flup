
"use strict";


function Piece (options) {

	this.color = options.color;
	this.key = options.key;
	this.animation = options.animation || new AnimationQueue();
};


Piece.size = 32;



Piece.getSprites = function() {

	if (!Piece.sprites) {

		Piece.sprites = Piece.getSpriteSheet().getSprites();
	}

	return Piece.sprites;
}


Piece.getSpriteSheet = function () {

	if (!Piece.spriteSheet) {

		Piece.spriteSheet = new SpriteSheet(Piece.getSpriteSheetSettings());
	}

	return Piece.spriteSheet;
}


Piece.getSpriteSheetSettings = function () {

	var sprites = [];

	for (var i = 0; i < 4; ++i) {

		sprites.push({
			name: "piece"+i,
			sheetPosition: {x:0, y:i},
			sheetSize: {x:1, y:1},
		});

		sprites.push({
			name: "key"+i,
			sheetPosition: {x:1, y:i},
			sheetSize: {x:1, y:1},
		});
	}

	return {
		imageFileName: "pieces.png",
		gridSize: {x:4, y:4},
		spriteSettings: sprites	
	}
}


Piece.prototype.draw = function (context, currentTime, boardCenter, boardScale) {

	var position = this.animation.getPosition(currentTime);

	var disturbance = true;
	var jitterX = (disturbance ? Piece.size*boardScale*0.05 * Math.sin(currentTime/1000 * 27 + position.x + position.y*3) : 0);
	var jitterY = (disturbance ? Piece.size*boardScale*0.05 * Math.sin(currentTime/1000 * 21 + position.y + position.x*2) : 0);
	var jitterZ = (disturbance ? Piece.size*boardScale*0.1  * Math.sin(currentTime/1000 * 13 + position.y + position.x*5) : 0);

	Piece.getSprites()[(this.key ? "key" : "piece")+this.color].draw(
		context,
		{
			x: (boardCenter.x + (position.x/Board.size.x - 0.5) * Board.size.x*Piece.size*boardScale + Piece.size/2) - 0.5 * (Piece.size + jitterZ) + jitterX,
			y: (boardCenter.y + (position.y/Board.size.y - 0.5) * Board.size.y*Piece.size*boardScale + Piece.size/2) - 0.5 * (Piece.size + jitterZ) + jitterY
		},
		{
			x: Piece.size*boardScale,
			y: Piece.size*boardScale
		}
	);
}
