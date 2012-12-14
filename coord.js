
"use strict";


function Coord (options) {

	this.x = options.x || 0;
	this.y = options.y || 0;
};


Coord.add = function (a, b) {

	return new Coord({
		x: a.x + b.x,
		y: a.y + b.y
	});
}


Coord.scale = function (coord, factor) {

	return new Coord({
		x: coord.x * factor,
		y: coord.y * factor
	});
}


Coord.prototype.scaled = function (factor) {

	return Coord.scale(this, factor);
}
