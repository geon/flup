
"use strict";


function Piece (options) {

	this.color = options.color;
	this.key = options.key;
	this.animation = options.animation;
};


Piece.size = 32;


Piece.prototype.draw = function (images, context, currentTime, boardCenter, boardScale) {

	var image = images["piece"+(this.color + 1)+".png"];

	var position = this.animation.getPosition(currentTime);

	var disturbance = true;
	var jitterX = (disturbance ? Piece.size*boardScale*0.05 * Math.sin(currentTime * 27 + position.x + position.y*3) : 0);
	var jitterY = (disturbance ? Piece.size*boardScale*0.05 * Math.sin(currentTime * 21 + position.y + position.x*2) : 0);
	var jitterZ = (disturbance ? Piece.size*boardScale*0.1  * Math.sin(currentTime * 13 + position.y + position.x*5) : 0);

	context.drawImage(
		image,
		(boardCenter.x + (position.x/Board.size.x - 0.5) * Board.size.x*Piece.size*boardScale + Piece.size/2) - 0.5 * (Piece.size + jitterZ) + jitterX,
		(boardCenter.y + (position.y/Board.size.y - 0.5) * Board.size.y*Piece.size*boardScale + Piece.size/2) - 0.5 * (Piece.size + jitterZ) + jitterY,
		Piece.size*boardScale,
		Piece.size*boardScale
	);
}
