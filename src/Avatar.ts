import { Coord } from "./Coord";
import { Piece } from "./Piece";

export interface Avatar {
	getPunishRow(width: number, y: number): Piece[];

	draw(
		context: CanvasRenderingContext2D,
		deltaTime: number,
		avatarCenter: Coord,
	): void;
}
