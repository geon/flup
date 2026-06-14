import { Avatar } from "./Avatar";
import { AvatarAztecJade } from "./AvatarAztecJade";
import { AvatarOwl } from "./AvatarOwl";
import { Board } from "./Board";
import { BoardLogic } from "./BoardLogic";
import { Coord } from "./Coord";
import { GameMode } from "./GameMode";
import { PieceCycle } from "./PieceCycle";
import { AvatarMonolith } from "./AvatarMonolith";
import { randomArrayElement } from "./array";
import { Tuple } from "./Tuple";
import { checkedAccess } from "./checked-access";
import { AnimationGenerator } from "./Animation";

export abstract class GameMode2pBase extends GameMode {
	boards: Tuple<Board, 2>;
	avatars: Tuple<Avatar, 2>;
	isGameOver: boolean;
	frameCoroutine: AnimationGenerator;

	constructor() {
		super();
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
		checkedAccess(this.avatars, playerIndex).onUnlock();
	}

	punishOpponents(board: Board, chainCount: number) {
		for (const [i, otherBoard] of this.boards.entries()) {
			if (otherBoard !== board) {
				const punishCount = Math.max(0, chainCount - 1);
				if (punishCount) {
					const otherAvatar = checkedAccess(this.avatars, i);
					otherBoard.punish(otherAvatar, punishCount);
					otherAvatar.onPunish();
				}
			}
		}
	}

	onGameOver(board: Board) {
		this.isGameOver = true;

		const playerIndex = this.boards.indexOf(board);
		checkedAccess(this.avatars, playerIndex).onLose();
		this.avatars
			.filter((_, index) => index != playerIndex)
			.forEach((opponentAvatar) => {
				opponentAvatar.onWin();
			});
	}

	*makeFrameCoroutine(): AnimationGenerator {
		// Run board coroutines concurrently.
		for (;;) {
			const deltaTime = yield;

			this.boards
				.map((board) => board.frameCoroutine)
				.forEach((coroutine) => coroutine.next(deltaTime));

			this.avatars
				.map((avatar) => avatar.frameCoroutine)
				.forEach((coroutine) => coroutine.next(deltaTime));
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
