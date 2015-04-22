
/// <reference path="Piece.ts"/>


interface Avatar {

	getPunishRow (width: number, y: number): Piece[];

	draw (
		context: CanvasRenderingContext2D,
		currentTime: number,
		avatarCenter: Coord
	): void;
}
