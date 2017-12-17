import { Animation } from "./Animation";
import { Coord } from "./Coord";

export class AnimationQueue {
	from: Coord;
	animations: Animation[];
	timeSinceCurrentAnimationStart: number;

	constructor(startPosition?: Coord) {
		this.from = startPosition || new Coord({ x: 0, y: 0 });
		this.animations = [];
		this.timeSinceCurrentAnimationStart = 0;
	}

	add(animation: Animation) {
		this.animations.push(animation);
	}

	getLast() {
		if (!this.animations.length) {
			return undefined;
		}

		return this.animations[this.animations.length - 1];
	}

	length() {
		return this.animations.length
			? this.animations
					.map(animation => animation.length())
					.reduce((soFar, next) => soFar + next, 0)
			: 0;
	}

	getLastTo() {
		const lastAnimation = this.getLast();

		return lastAnimation ? lastAnimation.to : this.from;
	}

	getPosition(deltaTime: number) {
		this.timeSinceCurrentAnimationStart += deltaTime;

		let currentAnimation = this.animations[0];

		// Remove any expired animations.
		while (
			this.animations.length &&
			currentAnimation.length() < this.timeSinceCurrentAnimationStart
		) {
			// Then next animation should start where this one ended.
			this.from = currentAnimation.to;

			// Make the delta time carry over to the next animation.
			this.timeSinceCurrentAnimationStart -= currentAnimation.length();

			// Use the next one instead.
			this.animations.shift();
			currentAnimation = this.animations[0];
		}

		if (!this.animations.length) {
			// Don't carry over delta time to the next animation getting queued up.
			this.timeSinceCurrentAnimationStart = 0;

			return this.from;
		}

		// Interpolate.

		// Might not be started yet.
		if (this.timeSinceCurrentAnimationStart < currentAnimation.delay) {
			return this.from;
		}

		const progress = Animation.interpolators[currentAnimation.interpolation](
			(this.timeSinceCurrentAnimationStart - currentAnimation.delay) /
				currentAnimation.duration,
		);

		return Coord.add(
			this.from.scaled(1 - progress),
			currentAnimation.to.scaled(progress),
		);
	}
}
