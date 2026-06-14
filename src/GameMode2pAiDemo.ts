import { OcdBot } from "./OcdBot";
import { UnlockBot } from "./UnlockBot";
import { GameMode2pBase } from "./GameMode2pBase";

export class GameMode2pAiDemo extends GameMode2pBase {
	constructor() {
		super();
	}

	onKeyDown() {}

	*makeFrameCoroutine(): Generator<void, void, number> {
		const bots = [
			//
			new OcdBot(this.boards[0]),
			new UnlockBot(this.boards[1]),
		];
		const aiCoroutines = bots.map((bot) => bot.makeCoroutine());
		const superCoroutine = super.makeFrameCoroutine();

		// Run board coroutines concurrently.
		for (;;) {
			const deltaTime = yield;

			superCoroutine.next(deltaTime);

			if (!this.isGameOver) {
				for (const aiCoroutine of aiCoroutines) {
					aiCoroutine.next(deltaTime);
				}
			}
		}
	}
}
