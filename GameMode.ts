
/// <reference path="Board.ts"/>


interface GameMode {

	isGameOver: () => boolean;
	onUnlockedChains: (board: Board) => void;
	onKeyDown: (keyCode: number) => void;
	draw: (
		context: CanvasRenderingContext2D,
		deltaTime: number,
		appSize: Coord
	) => void;
}
