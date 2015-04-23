
/// <reference path="Coord.ts"/>

class Animation {

	to: Coord;
	delay: number;
	duration: number;
	interpolation: string;


	constructor (animation: {to: Coord, delay: number, duration: number, interpolation: string}) {

		this.to            = animation.to;
		this.delay         = animation.delay;
		this.duration      = animation.duration;
		this.interpolation = animation.interpolation;
	}


	length () {

		return this.delay + this.duration;
	}


	static interpolators = {
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
}
