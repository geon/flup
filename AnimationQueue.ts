
/// <reference path="Animation.ts"/>
/// <reference path="Coord.ts"/>

class AnimationQueue {

	from: Coord;
	animations: Animation[];
	accumulatedDeltaTime: number;


	constructor (startPosition?: Coord) {

		this.from = startPosition || new Coord({x:0, y:0});
		this.animations = [];
		this.accumulatedDeltaTime = 0;
	}


	add (animation: Animation) {

		this.animations.push(animation);
	}


	getLast () {

		if (!this.animations.length) {

			return undefined;
		}

		return this.animations[this.animations.length - 1];
	}


	length () {

		return this.animations.length
			? this.animations
				.map(animation => animation.length())
				.reduce((soFar, next) => soFar + next, 0)
			: null;
	}


	getLastTo () {

		var lastAnimation = this.getLast();

		return lastAnimation ? lastAnimation.to : this.from;
	}


	getPosition (deltaTime: number) {

		this.accumulatedDeltaTime += deltaTime;


		if (!this.animations.length) {

			// Don't carry over delta time to the next animation getting queued up.
			this.accumulatedDeltaTime = 0;

			return this.from;
		}


		var currentAnimation = this.animations[0];


		// Remove any expired animations.
		while (currentAnimation.length() < this.accumulatedDeltaTime) {

			// Then nex animation should start where this one ended.
			this.from = currentAnimation.to;

			this.animations.shift();

			// Make the delta time carry over to the next animation.
			this.accumulatedDeltaTime -= currentAnimation.length();
		}


		// Interpolate.

		// Might not be started yet.
		if (this.accumulatedDeltaTime < currentAnimation.delay) {

			return this.from;
		}

		var progress = Animation.interpolators[currentAnimation.interpolation](
			(this.accumulatedDeltaTime - currentAnimation.delay) / currentAnimation.duration
		);

		return Coord.add(
			this.from.scaled(1 - progress),
			currentAnimation.to.scaled(progress)
		);
	}
}
