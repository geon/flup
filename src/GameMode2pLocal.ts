import { AnimationGenerator } from "./Animation";
import { GameMode2pBase } from "./GameMode2pBase";

export class GameMode2pLocal extends GameMode2pBase {
	constructor() {
		super();
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

	*makeFrameCoroutine(): AnimationGenerator {
		const superCoroutine = super.makeFrameCoroutine();

		// Run board coroutines concurrently.
		for (;;) {
			const deltaTime = yield;

			superCoroutine.next(deltaTime);
		}
	}
}
