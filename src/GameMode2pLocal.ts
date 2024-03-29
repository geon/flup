import { Avatar } from "./Avatar";
import { AvatarAztecJade } from "./AvatarAztecJade";
import { AvatarOwl } from "./AvatarOwl";
import { Board } from "./Board";
import { BoardLogic } from "./BoardLogic";
import { Coord } from "./Coord";
import { GameMode } from "./GameMode";
import { PieceCycle } from "./PieceCycle";
import { AvatarMonolith } from "./AvatarMonolith";

function randomArrayElement<T>(array: ReadonlyArray<T>): T {
	return array[Math.floor(Math.random() * array.length)];
}

export class GameMode2pLocal implements GameMode {
	boards: Array<Board>;
	avatars: Array<Avatar>;
	isGameOver: boolean;
	frameCoroutine: Generator<void, void, number>;

	constructor() {
		const pieceCycleTemplate = PieceCycle.generate();

		this.boards = [
			new Board({
				pieceCycle: new PieceCycle(pieceCycleTemplate),
				gameMode: this,
				dropperSide: "right",
			}),
			new Board({
				pieceCycle: new PieceCycle(pieceCycleTemplate),
				gameMode: this,
				dropperSide: "left",
			}),
		];

		const avatarClasses = [AvatarOwl, AvatarAztecJade, AvatarMonolith];
		this.avatars = [
			new (randomArrayElement(avatarClasses))(),
			new (randomArrayElement(avatarClasses))(),
		];
		this.isGameOver = false;

		this.frameCoroutine = this.makeFrameCoroutine();
	}

	onUnlockedChains(board: Board, chainCount: number) {
		this.punishOpponents(board, chainCount);

		const playerIndex = this.boards.indexOf(board);
		this.avatars[playerIndex].onUnlock();
	}

	punishOpponents(board: Board, chainCount: number) {
		for (let i = 0; i < this.boards.length; i++) {
			if (this.boards[i] !== board) {
				const punishCount = Math.max(0, chainCount - 1);
				if (punishCount) {
					this.boards[i].punish(this.avatars[i], punishCount);
					this.avatars[i].onPunish();
				}
			}
		}
	}

	onGameOver(board: Board) {
		this.isGameOver = true;

		const playerIndex = this.boards.indexOf(board);
		this.avatars[playerIndex].onLose();
		this.avatars
			.filter((_, index) => index != playerIndex)
			.forEach((opponentAvatar) => {
				opponentAvatar.onWin();
			});
	}

	onKeyDown(_keyCode: number) {
		if (this.isGameOver) {
			return;
		}

		switch ((event as KeyboardEvent).keyCode) {
			// Player 1.
			case 37: // Left
				this.boards[1].moveLeft();
				break;

			case 39: // Right
				this.boards[1].moveRight();
				break;

			case 38: // Up
				this.boards[1].rotate();
				break;

			case 40: // Down
				this.boards[1].drop();
				break;

			// Player 2.
			case "A".charCodeAt(0): // Left
				this.boards[0].moveLeft();
				break;

			case "D".charCodeAt(0): // Right
				this.boards[0].moveRight();
				break;

			case "W".charCodeAt(0): // Up
				this.boards[0].rotate();
				break;

			case "S".charCodeAt(0): // Down
				this.boards[0].drop();
				break;

			case "Q".charCodeAt(0):
				this.punishOpponents(this.boards[0], 4);
		}
	}

	*makeFrameCoroutine(): Generator<void, void, number> {
		// Run board coroutines concurrently.
		for (;;) {
			const deltaTime = yield;

			this.boards
				.map((board) => board.frameCoroutine)
				.forEach((coroutine) => coroutine.next(deltaTime));

			this.avatars
				.map((avatar) => avatar.frameCoroutine)
				.forEach((coroutine) => coroutine.next(deltaTime));

			// if (this.isGameOver) {
			// 	break;
			// }
		}
	}

	draw(context: CanvasRenderingContext2D, appSize: Coord) {
		const center = new Coord({ x: appSize.x / 2, y: appSize.y / 2 });
		const boardSpread = BoardLogic.getWidth() * 0.66;

		// The player boards.
		this.boards[0].draw(
			context,
			new Coord({
				x: center.x - boardSpread,
				y: center.y,
			}),
			1 / 1,
		);
		this.boards[1].draw(
			context,
			new Coord({
				x: center.x + boardSpread,
				y: center.y,
			}),
			1 / 1,
		);

		const avatarSpread = BoardLogic.getWidth() * 0.75;
		const avatarDownStickiness = 1.1;
		const avatarDownset = (BoardLogic.getHeight() / 2) * avatarDownStickiness;

		// Draw the player avatars.
		this.avatars[0].draw(
			context,
			new Coord({
				x: center.x - boardSpread - avatarSpread,
				y: center.y + avatarDownset - this.avatars[0].getSize() / 2,
			}),
		);
		this.avatars[1].draw(
			context,
			new Coord({
				x: center.x + boardSpread + avatarSpread,
				y: center.y + avatarDownset - this.avatars[1].getSize() / 2,
			}),
		);
	}
}
