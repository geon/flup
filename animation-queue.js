
"use strict";


function AnimationQueue (startPosition) {

	startPosition = startPosition || new Coord({});

	this.animations = [new Animation({to:startPosition, from:startPosition, duration:0})];
};


AnimationQueue.prototype.add = function (animation) {

	// Force the startTime and position to match the end of the previous step.
	var lastAnimation   = this.getLast();
	if (lastAnimation) {
		animation.startTime = Math.max(animation.startTime, lastAnimation.getEndTime(), new Date().getTime());
		animation.from      = lastAnimation.to;
	}

	this.animations.push(animation);
}


AnimationQueue.prototype.getLast = function (animation) {

	if (!this.animations.length) {

		return undefined;
	}

	return this.animations[this.animations.length - 1];
}


AnimationQueue.prototype.getPosition = function (currentTime) {

	if (!this.animations.length) {

		return undefined;
	}

	// Remove all but the last animation until one is found that isn't expired.
	while (this.animations.length > 1 && this.animations[0].getEndTime() < new Date().getTime()) {

		this.animations.shift();
	}

	return this.animations[0].getPosition(currentTime);
}
