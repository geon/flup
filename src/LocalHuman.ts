import { Player } from "./Player";
import { Board } from "./Board";

type Keylist = [number, number, number, number];

export class LocalHuman extends Player {
	keys: Keylist;

	constructor(board: Board, keys: Keylist) {
		super(board);
		this.keys = keys;
	}

	onKeyDown(keyCode: number) {
		if (this.board.boardLogic.checkForGameOver()) {
			return;
		}

		switch (keyCode) {
			case this.keys[1]:
				this.board.moveLeft();
				break;

			case this.keys[3]:
				this.board.moveRight();
				break;

			case this.keys[0]:
				this.board.rotate();
				break;

			case this.keys[2]:
				this.board.drop();
				break;
		}
	}
}
