import { Coord } from "./Coord";

export interface Avatar {
	getPunishColors(width: number): Array<number>;

	draw(
		context: CanvasRenderingContext2D,
		deltaTime: number,
		avatarCenter: Coord,
	): void;
}
