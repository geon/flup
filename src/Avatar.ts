import { Coord } from "./Coord";

export abstract class Avatar {
	colorGenerator: Generator<Array<number>, never, void>;
	frameCoroutine: Generator<void, void, number>;

	constructor() {
		this.colorGenerator = this.generatePunishColors();
		this.frameCoroutine = this.makeFrameCoroutine();
	}

	abstract onUnlock(): void;
	abstract onPunish(): void;
	abstract onWin(): void;
	abstract onLose(): void;

	getPunishColors() {
		return this.colorGenerator.next().value;
	}

	abstract getSize(): number;

	abstract generatePunishColors(): Generator<Array<number>, never, void>;
	abstract makeFrameCoroutine(): Generator<void, void, number>;

	abstract draw(context: CanvasRenderingContext2D, avatarCenter: Coord): void;
}
