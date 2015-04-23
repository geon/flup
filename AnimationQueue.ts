
/// <reference path="Animation.ts"/>
/// <reference path="Coord.ts"/>

class AnimationQueue {

	from: Coord;
	animations: Animation[];


	constructor (startPosition?: Coord) {

		this.from = startPosition || new Coord({x:0, y:0});
		this.animations = [];
	}


	add (animation: Animation) {

		this.animations.push(animation);
	}


	// getLast () {

	// 	if (!this.animations.length) {

	// 		return undefined;
	// 	}

	// 	return this.animations[this.animations.length - 1];
	// }


	length () {

		return this.animations.length
			? this.animations
				.map(animation => animation.length())
				.reduce((soFar, next) => soFar + next, 0)
			: null;
	}


	// getLastTo () {

	// 	var lastAnimation = this.getLast();

	// 	return lastAnimation ? lastAnimation.to : this.from;
	// }


	getPosition (delta: number) {

		// Remove any expired animations.
		while (this.animations.length && this.animations[0].length() < delta) {

			var animation = this.animations.shift();
			this.from = animation.to;
			delta -= animation.length();
		}


		if (!this.animations.length) {

			return this.from;
		}


		// Interpolate.

		var currentAnimation = this.animations[0];

		// Might not be started yet.
		if (delta < currentAnimation.delay) {
			return this.from;
		}

		var progress = Animation.interpolators[currentAnimation.interpolation](
			(delta - currentAnimation.delay) / currentAnimation.duration
		);

		return Coord.add(
			this.from.scaled(1 - progress),
			currentAnimation.to.scaled(progress)
		);
	}
}
