import { Coord } from "./Coord";

type InterplolationName = keyof typeof Animation.interpolators;
export class Animation {
	to: Coord;
	delay: number;
	duration: number;
	interpolation: InterplolationName;

	constructor(animation: {
		to: Coord;
		delay: number;
		duration: number;
		interpolation: InterplolationName;
	}) {
		this.to = animation.to;
		this.delay = animation.delay;
		this.duration = animation.duration;
		this.interpolation = animation.interpolation;
	}

	length() {
		return this.delay + this.duration;
	}

	static interpolators = {
		linear(progress: number) {
			return progress;
		},
		easeInQuad(progress: number) {
			return progress * progress;
		},
		sine(progress: number) {
			return (Math.cos((1 - progress) * Math.PI) + 1) / 2;
		},
		sine2(progress: number) {
			return Animation.interpolators.sine(
				Animation.interpolators.sine(progress),
			);
		},
	};
}
