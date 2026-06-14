// import { OcdBot } from "./OcdBot";
import { LocalHuman } from "./LocalHuman";
import { UnlockBot } from "./UnlockBot";
import { GameMode2pBase } from "./GameMode2pBase";

export class GameMode2pAi extends GameMode2pBase {
	human: LocalHuman;

	constructor() {
		super();

		// 38, 37, 40, 39 : ^, <, v, >
		this.human = new LocalHuman(this.boards[1], [38, 37, 40, 39]);
	}

	onKeyDown(keyCode: number) {
		if (this.isGameOver) {
			return;
		}

		this.human.onKeyDown(keyCode);
	}

	*makeFrameCoroutine(): Generator<void, void, number> {
		// const bot = new OcdBot(this.boards[0]);
		const bot = new UnlockBot(this.boards[0]);
		const aiCoroutine = bot.makeCoroutine();
		const superCoroutine = super.makeFrameCoroutine();

		// Run board coroutines concurrently.
		for (;;) {
			const deltaTime = yield;

			superCoroutine.next(deltaTime);

			if (!this.isGameOver) {
				aiCoroutine.next(deltaTime);
			}
		}
	}
}
