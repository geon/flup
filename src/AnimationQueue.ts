import { Animation } from "./Animation";
import { Coord } from "./Coord";
import { Piece } from "./Piece";

export class AnimationQueue {
	piece: Piece;
	from: Coord;
	animations: Array<Animation>;
	timeSinceCurrentAnimationStart: number;

	constructor(piece: Piece) {
		this.piece = piece;
		this.from = this.piece.position;
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

	// TODO: Remove. It is used for syncing animatuons. Use explicit primitives like parallel and queue instead.
	length() {
		return this.animations.length
			? this.animations
					.map(animation => animation.length())
					.reduce((soFar, next) => soFar + next, 0)
			: 0;
	}

	// TODO: Remove. Make the last animation step take a speed instead of duration.
	getLastTo() {
		const lastAnimation = this.getLast();

		return lastAnimation ? lastAnimation.to : this.from;
	}

	// TODO: Remove. Replace with generators.
	setPosition(deltaTime: number) {
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

			this.piece.position = this.from;
			return;
		}

		// Interpolate.

		// Might not be started yet.
		if (this.timeSinceCurrentAnimationStart < currentAnimation.delay) {
			this.piece.position = this.from;
			return;
		}

		const progress = Animation.interpolators[currentAnimation.interpolation](
			(this.timeSinceCurrentAnimationStart - currentAnimation.delay) /
				currentAnimation.duration,
		);

		this.piece.position = Coord.add(
			this.from.scaled(1 - progress),
			currentAnimation.to.scaled(progress),
		);
	}
}
