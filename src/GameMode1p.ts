import { Avatar } from "./Avatar";
import { AvatarOwl } from "./AvatarOwl";
import { Board } from "./Board";
import { BoardLogic } from "./BoardLogic";
import { Coord } from "./Coord";
import { GameMode } from "./GameMode";
import { PieceCycle } from "./PieceCycle";

export class GameMode1p implements GameMode {
	board: Board;
	avatar: Avatar;
	isGameOver: boolean;
	frameCoroutine: Generator<void, void, number>;

	constructor() {
		const pieceCycle = new PieceCycle(PieceCycle.generate());

		this.board = new Board({ pieceCycle, gameMode: this, dropperSide: "left" });
		this.avatar = new AvatarOwl();
		this.isGameOver = false;

		this.frameCoroutine = this.board.frameCoroutine;
	}

	onUnlockedChains(_board: Board) {
		// Do nothing.
	}

	onGameOver() {
		this.avatar.onLose();
		this.isGameOver = true;
	}

	onKeyDown(_keyCode: number) {
		if (this.isGameOver) {
			return;
		}

		switch ((event as KeyboardEvent).keyCode) {
			case 37: // Left
				this.board.moveLeft();
				break;

			case 39: // Right
				this.board.moveRight();
				break;

			case 38: // Up
				this.board.rotate();
				break;

			case 40: // Down
				this.board.drop();
				break;
		}
	}

	*makeFrameCoroutine(): Generator<void, void, number> {
		const boardCoroutine = this.board.frameCoroutine;
		const avatarCoroutine = this.avatar.frameCoroutine;

		for (;;) {
			const deltaTime = yield;
			boardCoroutine.next(deltaTime);
			avatarCoroutine.next(deltaTime);
		}
	}

	draw(context: CanvasRenderingContext2D, appSize: Coord) {
		// The player boards.
		this.board.draw(
			context,
			new Coord({ x: appSize.x / 2, y: appSize.y / 2 }),
			1 / 1,
		);

		// Draw the player avatars.
		this.avatar.draw(
			context,
			new Coord({
				x: appSize.x / 2 + (BoardLogic.getWidth() * -1.1) / 2,
				y: appSize.y / 2 + BoardLogic.getWidth() * 0.65,
			}),
		);
	}
}
