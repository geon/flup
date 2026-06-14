import { AnimationGenerator } from "./Animation";
import { Board } from "./Board";
import { Coord } from "./Coord";

export abstract class GameMode {
	abstract frameCoroutine: AnimationGenerator;
	abstract onGameOver(board: Board): void;
	abstract onUnlockedChains(board: Board, chainCount: number): void;
	abstract onKeyDown(keyCode: number): void;
	abstract draw(context: CanvasRenderingContext2D, appSize: Coord): void;
}
