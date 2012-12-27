
"use strict";


function UnlockingEffect (piece) {

	this.color = piece.color;
	this.coord = piece.animation.getLast().to;
	this.startTime = piece.unlockEffectStartTime;

	this.initialVelocities = [];
	for (var i = 0; i < 8; i++) {
		this.initialVelocities[i] = new Coord({x: Math.random() * 2 - 1, y: Math.random() * 2 - 1}).scaled(0.5);
	};
};


UnlockingEffect.size = 16;
UnlockingEffect.gravity = 0.001;


UnlockingEffect.getSprites = function() {

	if (!UnlockingEffect.sprites) {

		UnlockingEffect.sprites = UnlockingEffect.getSpriteSheet().getSprites();
	}

	return UnlockingEffect.sprites;
}


UnlockingEffect.getSpriteSheet = function () {

	if (!UnlockingEffect.spriteSheet) {

		UnlockingEffect.spriteSheet = new SpriteSheet(UnlockingEffect.getSpriteSheetSettings());
	}

	return UnlockingEffect.spriteSheet;
}


UnlockingEffect.getSpriteSheetSettings = function () {

	var sprites = [];

	for (var i = 0; i < 4; ++i) {
		for (var j = 0; j < 8; ++j) {

			sprites.push({
				name: "color "+i+", variation "+j,
				sheetPosition: {x:4+j%4, y:i*2+Math.floor(j/4)},
				sheetSize: {x:1, y:1},
			});
		}
	}

	return {
		imageFileName: "pieces.png",
		gridSize: {x:8, y:8},
		spriteSettings: sprites	
	}
}


UnlockingEffect.prototype.isDone = function (currentTime) {
	return currentTime > this.startTime + 1000 * 3;
}


UnlockingEffect.prototype.draw = function (context, currentTime, boardCenter, boardScale) {

	var origin = new Coord({
		x: (boardCenter.x + (this.coord.x/Board.size.x - 0.5) * Board.size.x*Piece.size*boardScale + Piece.size/2) - 0.5 * (UnlockingEffect.size),
		y: (boardCenter.y + (this.coord.y/Board.size.y - 0.5) * Board.size.y*Piece.size*boardScale + Piece.size/2) - 0.5 * (UnlockingEffect.size)
	});


	for (var i = 0; i < this.initialVelocities.length; i++) {

		UnlockingEffect.getSprites()["color "+this.color+", variation "+i].draw(
			context,
			{
				x: origin.x + this.initialVelocities[i].x * (currentTime - this.startTime),
				y: origin.y + this.initialVelocities[i].y * (currentTime - this.startTime) + UnlockingEffect.gravity * Math.pow(currentTime - this.startTime, 2)
			},
			{
				x: UnlockingEffect.size*boardScale,
				y: UnlockingEffect.size*boardScale
			}
		);
	};
}
