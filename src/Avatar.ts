import { Coord } from "./Coord";
import { PieceColor } from "./Piece";

export abstract class Avatar {
	colorGenerator: Generator<Array<PieceColor>, never, void>;
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

	abstract generatePunishColors(): Generator<Array<PieceColor>, never, void>;
	abstract makeFrameCoroutine(): Generator<void, void, number>;

	abstract draw(context: CanvasRenderingContext2D, avatarCenter: Coord): void;
}
