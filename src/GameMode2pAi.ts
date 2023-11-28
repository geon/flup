import { Avatar } from "./Avatar";
import { AvatarAztecJade } from "./AvatarAztecJade";
import { AvatarOwl } from "./AvatarOwl";
import { Board } from "./Board";
import { BoardLogic } from "./BoardLogic";
import { Coord } from "./Coord";
import { GameMode } from "./GameMode";
import { PieceCycle } from "./PieceCycle";
import { AvatarMonolith } from "./AvatarMonolith";
import { OcdBot } from "./OcdBot";
import { LocalHuman } from "./LocalHuman";

function randomArrayElement<T>(array: ReadonlyArray<T>): T {
	return array[Math.floor(Math.random() * array.length)];
}

export class GameMode2pAi implements GameMode {
	boards: Array<Board>;
	avatars: Array<Avatar>;
	isGameOver: boolean;
	frameCoroutine: Generator<void, void, number>;

	human: LocalHuman;

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

		// 38, 37, 40, 39 : ^, <, v, >
		this.human = new LocalHuman(this.boards[1], [38, 37, 40, 39]);
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
			.forEach(opponentAvatar => {
				opponentAvatar.onWin();
			});
	}

	onKeyDown(keyCode: number) {
		if (this.isGameOver) {
			return;
		}

		this.human.onKeyDown(keyCode);
	}

	*makeFrameCoroutine(): Generator<void, void, number> {
		const bot = new OcdBot(this.boards[0]);
		const aiCoroutine = bot.makeCoroutine();

		// Run board coroutines concurrently.
		for (;;) {
			const deltaTime = yield;

			if (!this.isGameOver) {
				aiCoroutine.next(deltaTime);
			}

			this.boards
				.map(board => board.frameCoroutine)
				.forEach(coroutine => coroutine.next(deltaTime));

			this.avatars
				.map(avatar => avatar.frameCoroutine)
				.forEach(coroutine => coroutine.next(deltaTime));

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
		const avatarDownset = BoardLogic.getHeight() / 2 * avatarDownStickiness;

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
