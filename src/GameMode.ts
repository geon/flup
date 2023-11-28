import { Board } from "./Board";
import { Coord } from "./Coord";

export interface GameMode {
	frameCoroutine: Generator<void, void, number>;
	onGameOver: (board: Board) => void;
	onUnlockedChains: (board: Board, chainCount: number) => void;
	onKeyDown: (keyCode: number) => void;
	draw: (context: CanvasRenderingContext2D, appSize: Coord) => void;
}
