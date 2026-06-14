import { randomArrayElement } from "./array";
import { Avatar } from "./Avatar";
import { AvatarAztecJade } from "./AvatarAztecJade";
import { AvatarMonolith } from "./AvatarMonolith";
import { AvatarOwl } from "./AvatarOwl";
import { Board } from "./Board";
import { BoardLogic } from "./BoardLogic";
import { Coord } from "./Coord";
import { GameMode } from "./GameMode";
import { LocalHuman } from "./LocalHuman";
import { PieceCycle } from "./PieceCycle";

export class GameMode1p implements GameMode {
	board: Board;
	avatar: Avatar;
	isGameOver: boolean;
	frameCoroutine: Generator<void, void, number>;
	human: LocalHuman;

	constructor() {
		const pieceCycle = new PieceCycle(PieceCycle.generate());

		this.board = new Board({ pieceCycle, gameMode: this, dropperSide: "left" });
		const avatarClasses = [AvatarOwl, AvatarAztecJade, AvatarMonolith];
		this.avatar = new (randomArrayElement(avatarClasses))();
		this.isGameOver = false;

		this.frameCoroutine = this.makeFrameCoroutine();

		// 38, 37, 40, 39 : ^, <, v, >
		this.human = new LocalHuman(this.board, [38, 37, 40, 39]);
	}

	onUnlockedChains(_board: Board) {
		// Do nothing.
	}

	onGameOver() {
		this.avatar.onLose();
		this.isGameOver = true;
	}

	onKeyDown(keyCode: number) {
		if (this.isGameOver) {
			return;
		}

		this.human.onKeyDown(keyCode);
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
				x: appSize.x / 2 + (BoardLogic.getWidth() * -1.5) / 2,
				y: appSize.y / 2 + BoardLogic.getWidth() * 0.65,
			}),
		);
	}
}
