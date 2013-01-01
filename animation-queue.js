
"use strict";


function AnimationQueue (startPosition) {

	this.from = new Coord(startPosition || {x:0, y:0});
	this.animations = [];
};


AnimationQueue.prototype.add = function (animationOptions) {

	// If there are already animations playing, queue it up. 
	var endTime = this.getEndTime();
	if (endTime) {

		animationOptions.startTime = Math.max(animationOptions.startTime, endTime);
	}


	this.animations.push(new Animation(animationOptions));
}


AnimationQueue.prototype.getLast = function (animation) {

	if (!this.animations.length) {

		return undefined;
	}

	return this.animations[this.animations.length - 1];
}


AnimationQueue.prototype.getEndTime = function () {

	var lastAnimation = this.getLast();

	return lastAnimation && lastAnimation.getEndTime();
}


AnimationQueue.prototype.getLastTo = function () {

	var lastAnimation = this.getLast();

	return lastAnimation ? lastAnimation.to : this.from;
}


AnimationQueue.prototype.getPosition = function (currentTime) {

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

