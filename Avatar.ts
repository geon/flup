
/// <reference path="Piece.ts"/>


interface Avatar {

	getPunishRow (width: number, y: number): Piece[];

	draw (
		context: CanvasRenderingContext2D,
		deltaTime: number,
		avatarCenter: Coord
	): void;
}
