
import {Board} from "./Board"
import {Coord} from "./Coord"


export interface GameMode {

	isGameOver: () => boolean;
	onUnlockedChains: (board: Board) => void;
	onKeyDown: (keyCode: number) => void;
	draw: (
		context: CanvasRenderingContext2D,
		deltaTime: number,
		appSize: Coord
	) => void;
}