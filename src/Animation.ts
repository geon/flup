export function* waitMs(duration: number): IterableIterator<void> {
	let elapsedTime = 0;

	while (elapsedTime < duration) {
		const deltaTime: number = yield;
		elapsedTime += deltaTime;
	}

	return elapsedTime;
}

export function* animateInterpolation(
	duration: number,
	frame: (timeFactor: number) => void,
): IterableIterator<void> {
	let elapsedTime = 0;

	while (elapsedTime < duration) {
		frame(elapsedTime / duration);
		const deltaTime: number = yield;
		elapsedTime += deltaTime;
	}
	frame(1);

	return elapsedTime;
}

export function* parallel(
	branches: ReadonlyArray<IterableIterator<void>>,
): IterableIterator<void> {
	let incompleteBranches = branches.slice();
	while (incompleteBranches.length) {
		const deltaTime: number = yield;

		for (let i = 0; i < incompleteBranches.length; ++i) {
			if (incompleteBranches[i].next(deltaTime).done) {
				incompleteBranches.splice(i, 1);
			}
		}
	}
}

export function* queue(
	steps: ReadonlyArray<IterableIterator<void>>,
): IterableIterator<void> {
	for (const step of steps) {
		yield* step;
	}
}

export function* makeIterable(callback: () => void): IterableIterator<void> {
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
