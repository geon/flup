function primeGenerator<
	T extends (...args: Array<any>) => IterableIterator<void>
>(unPrimed: T): T {
	return function(...args: Array<any>) {
		const generator = unPrimed(...args);
		generator.next();
		return generator;
	} as any; // Don't know why I need the cast.
}
/*
This is more correct, since there won't be any lag because of the priming. But all makeFramCoroutine needs to be fixed as well. Also the ones that just yield*-s.
*/

export const waitMs = primeGenerator(function*(
	duration: number,
): IterableIterator<void> {
	let elapsedTime = 0;

	while (elapsedTime < duration) {
		const deltaTime: number = yield;
		elapsedTime += deltaTime;
	}

	return elapsedTime;
});

export const animateInterpolation = primeGenerator(function*(
	duration: number,
	frame: (timeFactor: number) => void,
): IterableIterator<void> {
	let elapsedTime = 0;

	while (elapsedTime < duration) {
		const deltaTime: number = yield;
		frame(elapsedTime / duration);
		elapsedTime += deltaTime;
	}
	frame(1);

	return elapsedTime;
});

export const parallel = primeGenerator(function*(
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
});

export const queue = primeGenerator(function*(
	steps: ReadonlyArray<IterableIterator<void>>,
): IterableIterator<void> {
	for (const step of steps) {
		yield* step;
	}
});

export const makeIterable = primeGenerator(function*(
	callback: () => void,
): IterableIterator<void> {
	callback();
});

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
