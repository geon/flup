
"use strict";


function Coord (options) {

	this.x = options.x;
	this.y = options.y;
};


Coord.add = function (a, b) {

	return new Coord({
		x: a.x + b.x,
		y: a.y + b.y
	});
};


Coord.subtract = function (a, b) {

	return new Coord({
		x: a.x - b.x,
		y: a.y - b.y
	});
};


Coord.scale = function (coord, factor) {

	return new Coord({
		x: coord.x * factor,
		y: coord.y * factor
	});
}


Coord.prototype.scaled = function (factor) {

	return Coord.scale(this, factor);
};


Coord.prototype.length = function () {

	return Math.sqrt(this.x * this.x + this.y * this.y);
};


Coord.prototype.normalized = function () {

	return Coord.scale(this, 1/this.length());
};


Coord.distance = function (a, b) {

	return Coord.subtract(a, b).length();
};


