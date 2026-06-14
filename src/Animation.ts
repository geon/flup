export type AnimationGenerator = Generator<void, void, number>;

export function* waitMs(duration: number): AnimationGenerator {
	let elapsedTime = 0;

	while (elapsedTime < duration) {
		const deltaTime = yield;
		elapsedTime += deltaTime;
	}
}

export function* animateInterpolation(
	duration: number,
	frame: (timeFactor: number) => void,
): AnimationGenerator {
	let elapsedTime = 0;

	while (elapsedTime < duration) {
		frame(elapsedTime / duration);
		const deltaTime = yield;
		elapsedTime += deltaTime;
	}
	frame(1);
}

export function* parallel(
	branches: ReadonlyArray<AnimationGenerator>,
): AnimationGenerator {
	let incompleteBranches = branches.slice();
	while (incompleteBranches.length) {
		const deltaTime = yield;

		for (const [i, branch] of incompleteBranches.entries()) {
			if (branch.next(deltaTime).done) {
				incompleteBranches.splice(i, 1);
			}
		}
	}
}

export function* queue(
	steps: ReadonlyArray<AnimationGenerator>,
): AnimationGenerator {
	for (const step of steps) {
		yield* step;
	}
}

export function* makeIterable(callback: () => void): AnimationGenerator {
	callback();
}

const sine = (progress: number) => (Math.cos((1 - progress) * Math.PI) + 1) / 2;

export const easings = {
	linear(progress: number) {
		return progress;
	},
	easeInQuad(progress: number) {
		return progress * progress;
	},
	sine,
	sine2: (t: number) => sine(sine(t)),
};
