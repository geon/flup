
"use strict";


function PieceAnimation (options) {

	this.from      = new Coord(options.from);
	this.to        = new Coord(options.to);
	this.startTime = options.startTime;
	this.duration  = options.duration;
};


PieceAnimation.prototype.getPosition = function (currentTime) {

	var progress =  (currentTime - this.startTime) / this.duration;

	if (progress < 0) {
		return this.from;
	}

	if (progress > 1) {
		return this.to;
	}

	progress *= progress;

	return Coord.add(
		this.from.scaled(1-progress),
		this.to.scaled(progress)
	);
}
