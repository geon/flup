import { Avatar } from "./Avatar";
import { AvatarAztecJade } from "./AvatarAztecJade";
import { AvatarOwl } from "./AvatarOwl";
import { Board } from "./Board";
import { BoardLogic } from "./BoardLogic";
import { Coord } from "./Coord";
import { GameMode } from "./GameMode";
import { PieceCycle } from "./PieceCycle";
import { AvatarMonolith } from "./AvatarMonolith";
import { waitMs } from "./Animation";
import { Dropper } from "./Dropper";

function randomArrayElement<T>(array: ReadonlyArray<T>): T {
	return array[Math.floor(Math.random() * array.length)];
}

interface DropperPose {
	position: number;
	orientation: "horizontal" | "vertical";
}

function findMatchingDrop(
	dropper: Dropper,
): { matchingPose: DropperPose; ascending: boolean } {
	// This table has neighbours of allnumber, number]possible combinations, and still fits within the width of the board.
	const colorTable = [0, 1, 2, 3, 1, 3, 0, 2];

	const dropColors: [number, number] = [
		dropper.pieceA.color,
		dropper.pieceB.color,
	];

	if (dropColors[0] === dropColors[1]) {
		for (let position = 0; position < colorTable.length; ++position) {
			if (colorTable[position] === dropColors[0]) {
				return {
					matchingPose: { position, orientation: "vertical" },
					ascending: false,
				};
			}
		}
	}

	for (let position = 0; position < colorTable.length - 1; ++position) {
		if (
			colorTable[position] === dropColors[0] &&
			colorTable[position + 1] === dropColors[1]
		) {
			return {
				matchingPose: { position, orientation: "horizontal" },
				ascending: dropColors[0] < dropColors[1],
			};
		}
	}

	dropColors.reverse();

	let position = 0;
	for (; position < colorTable.length - 1; ++position) {
		if (
			colorTable[position] === dropColors[0] &&
			colorTable[position + 1] === dropColors[1]
		) {
			break;
		}
	}
	return {
		matchingPose: { position, orientation: "horizontal" },
		ascending: dropColors[0] < dropColors[1],
	};
}

export class GameMode2pAi implements GameMode {
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
			.forEach(opponentAvatar => {
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
		}
	}

	*makeFrameCoroutine(): IterableIterator<void> {
		const aiCoroutine = this.makeAiCoroutine();

		// Run board coroutines concurrently.
		for (;;) {
			const deltaTime: number = yield;

			aiCoroutine.next(deltaTime);

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

	*makeAiCoroutine(): IterableIterator<void> {
		for (;;) {
			// Simulate thinking time.
			yield* waitMs(500);

			const dropper = this.boards[0].boardLogic.dropper;
			const { matchingPose, ascending } = findMatchingDrop(dropper);

			let move: (() => void) | undefined;
			for (;;) {
				move = this.nextMoveToGetToPose(
					{
						position: dropper.position,
						orientation: dropper.orientation,
					},
					matchingPose,
					ascending,
				);

				if (!move) {
					break;
				}

				// Simulate slow fingers.
				yield* waitMs(150);

				move();
			}

			// Simulate hesitation.
			yield* waitMs(200);
			this.boards[0].drop();
		}
	}

	nextMoveToGetToPose(
		from: DropperPose,
		to: DropperPose,
		ascending: boolean,
	): (() => void) | undefined {
		const dropper = this.boards[0].boardLogic.dropper;
		const dropColors: [number, number] = [
			dropper.pieceA.color,
			dropper.pieceB.color,
		];

		if (from.orientation != to.orientation) {
			return () => this.boards[0].rotate();
		}
		if (ascending !== dropColors[0] < dropColors[1]) {
			return () => this.boards[0].rotate();
		}
		if (from.position < to.position) {
			return () => this.boards[0].moveRight();
		}
		if (from.position > to.position) {
			return () => this.boards[0].moveLeft();
		}
		return undefined;
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
