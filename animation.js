
"use strict";


function Animation (options) {

	this.from           = new Coord(options.from || new Coord({}));
	this.to             = new Coord(options.to || new Coord({}));
	this.duration       = options.duration;
	this.interpolation  = options.interpolation || "sine";
	this.startTime      = options.startTime || new Date().getTime();

	if (options.delay != undefined) {

		this.startTime += options.delay;
	}
};


Animation.prototype.getEndTime = function () {

	return this.startTime + this.duration;
}


Animation.prototype.getPosition = function (currentTime) {

	if (currentTime < this.startTime) {
		return this.from;
	}

	if (currentTime > this.getEndTime()) {
		return this.to;
	}

	var progress = this.interpolators[this.interpolation](
		(currentTime - this.startTime) / this.duration
	);

	return Coord.add(
		this.from.scaled(1-progress),
		this.to.scaled(progress)
	);
}


Animation.prototype.interpolators = {
	"linear" : function (progress) {

		return progress;
	},
	"easeInQuad" : function (progress) {

		return progress * progress;
	},
	"sine" : function (progress) {

		return (Math.cos((1 - progress)*Math.PI) + 1)/2;
	},
	"sine2" : function (progress) {

		return Animation.prototype.interpolators["sine"](
			Animation.prototype.interpolators["sine"](progress)
		);
	}
}
