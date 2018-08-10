import { Avatar } from "./Avatar";
import { AvatarAztecJade } from "./AvatarAztecJade";
import { AvatarOwl } from "./AvatarOwl";
import { Board } from "./Board";
import { Coord } from "./Coord";
import { GameMode } from "./GameMode";
import { PieceCycle } from "./PieceCycle";

export class GameMode2pLocal implements GameMode {
	boards: Array<Board>;
	avatars: Array<Avatar>;
	isGameOver: boolean;
	frameCoroutine: IterableIterator<void>;

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

		this.avatars = [new AvatarOwl(), new AvatarAztecJade()];
		this.isGameOver = false;

		this.frameCoroutine = this.makeFrameCoroutine();
	}

	onUnlockedChains(board: Board) {
		this.punishOpponents(board);
	}

	punishOpponents(board: Board) {
		for (let i = 0; i < this.boards.length; i++) {
			if (this.boards[i] !== board) {
				this.boards[i].punish(this.avatars[i]);
			}
		}
	}

	onGameOver() {
		this.isGameOver = true;
	}

	onKeyDown(_keyCode: number) {
		if (this.isGameOver) {
			return;
		}

		switch ((event as KeyboardEvent).keyCode) {
			// Player 1.
			case 37: // Left
				this.boards[1].dropper.moveLeft();
				break;

			case 39: // Right
				this.boards[1].dropper.moveRight();
				break;

			case 38: // Up
				this.boards[1].dropper.rotate();
				break;

			case 40: // Down
				this.boards[1].dropper.drop(this.boards[1]);
				break;

			// Player 2.
			case "A".charCodeAt(0): // Left
				this.boards[0].dropper.moveLeft();
				break;

			case "D".charCodeAt(0): // Right
				this.boards[0].dropper.moveRight();
				break;

			case "W".charCodeAt(0): // Up
				this.boards[0].dropper.rotate();
				break;

			case "S".charCodeAt(0): // Down
				this.boards[0].dropper.drop(this.boards[0]);
				break;
		}
	}

	*makeFrameCoroutine(): IterableIterator<void> {
		// Run board coroutines concurrently.
		for (;;) {
			const deltaTime: number = yield;

			this.boards
				.map(board => board.frameCoroutine)
				.forEach(coroutine => coroutine.next(deltaTime));

			if (this.isGameOver) {
				break;
			}
		}
	}

	draw(context: CanvasRenderingContext2D, deltaTime: number, appSize: Coord) {
		const center = new Coord({ x: appSize.x / 2, y: appSize.y / 2 });
		const boardSpread = Board.getWidth() * 0.66;

		// The player boards.
		this.boards[0].draw(
			context,
			deltaTime,
			new Coord({
				x: center.x - boardSpread,
				y: center.y,
			}),
			1 / 1,
		);
		this.boards[1].draw(
			context,
			deltaTime,
			new Coord({
				x: center.x + boardSpread,
				y: center.y,
			}),
			1 / 1,
		);

		const avatarSpread = Board.getWidth() * 0.75;
		const avatarDownStickiness = 1.1;
		const avatarDownset = Board.getHeight() / 2 * avatarDownStickiness;

		// Draw the player avatars.
		this.avatars[0].draw(
			context,
			deltaTime,
			new Coord({
				x: center.x - boardSpread - avatarSpread,
				y: center.y + avatarDownset - this.avatars[0].getSize() / 2,
			}),
		);
		this.avatars[1].draw(
			context,
			deltaTime,
			new Coord({
				x: center.x + boardSpread + avatarSpread,
				y: center.y + avatarDownset - this.avatars[1].getSize() / 2,
			}),
		);
	}
}
