
import {Piece} from "./Piece"
import {Coord} from "./Coord"


export interface Avatar {

	getPunishRow (width: number, y: number): Piece[];

	draw (
		context: CanvasRenderingContext2D,
		deltaTime: number,
		avatarCenter: Coord
	): void;
}
