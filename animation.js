
"use strict";


function Animation (options) {

	console.assert(
		options
		&& options.to
		&& options.startTime
		&& options.duration
		&& options.interpolation
	, "Data missing in constructor.");

	this.to             = new Coord(options.to);
	this.startTime      = options.startTime;
	this.duration       = options.duration;
	this.interpolation  = options.interpolation;
};


Animation.prototype.getEndTime = function () {

	return this.startTime + this.duration;
}


Animation.interpolators = {
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

		return Animation.interpolators["sine"](
			Animation.interpolators["sine"](progress)
		);
	}
}
