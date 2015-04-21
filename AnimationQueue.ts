
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

		// If there are already animations playing, queue it up. 
		var endTime = this.getEndTime();
		if (endTime) {

			animation.startTime = Math.max(animation.startTime, endTime);
		}

		this.animations.push(animation);
	}


	getLast () {

		if (!this.animations.length) {

			return undefined;
		}

		return this.animations[this.animations.length - 1];
	}


	getEndTime () {

		var lastAnimation = this.getLast();

		return lastAnimation && lastAnimation.getEndTime();
	}


	getLastTo () {

		var lastAnimation = this.getLast();

		return lastAnimation ? lastAnimation.to : this.from;
	}


	getPosition (currentTime: number) {

		// Remove any expired animations.
		while (this.animations.length && this.animations[0].getEndTime() < currentTime) {
			this.from = this.animations.shift().to;
		}


		if (!this.animations.length) {

			return this.from;
		}


		// Interpolate.

		var currentAnimation = this.animations[0];

		// Might not be strated yet.
		if (currentTime < currentAnimation.startTime) {
			return this.from;
		}

		var progress = Animation.interpolators[currentAnimation.interpolation](
			(currentTime - currentAnimation.startTime) / currentAnimation.duration
		);

		return Coord.add(
			this.from.scaled(1-progress),
			currentAnimation.to.scaled(progress)
		);
	}
}
