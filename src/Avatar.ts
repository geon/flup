import { Coord } from "./Coord";

export abstract class Avatar {
	colorGenerator: IterableIterator<Array<number>>;

	constructor() {
		this.colorGenerator = this.generatePunishColors();
	}

	getPunishColors() {
		return this.colorGenerator.next().value;
	}

	abstract getSize(): number;

	abstract generatePunishColors(): IterableIterator<Array<number>>;

	abstract draw(
		context: CanvasRenderingContext2D,
		deltaTime: number,
		avatarCenter: Coord,
	): void;
}
