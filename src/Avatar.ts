import { Coord } from "./Coord";

export abstract class Avatar {
	colorGenerator: IterableIterator<Array<number>>;
	frameCoroutine: IterableIterator<void>;

	constructor() {
		this.colorGenerator = this.generatePunishColors();
		this.frameCoroutine = this.makeFrameCoroutine();
	}

	getPunishColors() {
		return this.colorGenerator.next().value;
	}

	abstract getSize(): number;

	abstract generatePunishColors(): IterableIterator<Array<number>>;

	abstract makeFrameCoroutine(): IterableIterator<void>;

	abstract draw(
		context: CanvasRenderingContext2D,
		deltaTime: number,
		avatarCenter: Coord,
	): void;
}
