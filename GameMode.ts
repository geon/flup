
/// <reference path="Board.ts"/>


interface GameMode {

	onUnlockedChains: (board: Board) => void;
	onKeyDown: (keyCode: number) => void;
	draw: (
		context: CanvasRenderingContext2D,
		currentTime: number,
		appSize: Coord
	) => void;
}
