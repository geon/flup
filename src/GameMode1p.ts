
import {GameMode} from "./GameMode";
import {Avatar} from "./Avatar";
import {AvatarOwl} from "./AvatarOwl";
import {Coord} from "./Coord";
import {Board} from "./Board";
import {PieceCycle} from "./PieceCycle";


export class GameMode1p implements GameMode {

	board: Board;
	avatar: Avatar;


	constructor () {

		var pieceCycle = new PieceCycle(PieceCycle.generate());

		this.board = new Board({pieceCycle: pieceCycle, gameMode: this});
		this.avatar = new AvatarOwl();
	}


	onUnlockedChains (_board: Board) {

		// Do nothing.
	}


	isGameOver () {

		return this.board.gameOver;
	}


	onKeyDown (_keyCode: number) {

		if (this.isGameOver()) {

			return;
		}

		switch ((<KeyboardEvent>event).keyCode) {

			case 37: // Left
				this.board.dropper.moveLeft();
				break;

			case 39: // Right
				this.board.dropper.moveRight();
				break;

			case 38: // Up
				this.board.dropper.rotate();
				break;

			case 40: // Down
				this.board.dropper.drop(this.board);
				break;
		}
	}

	draw (
		context: CanvasRenderingContext2D,
		deltaTime: number,
		appSize: Coord
	) {

		// The player boards.
		this.board.draw(
			context,
			deltaTime,
			new Coord({x:appSize.x/2, y:appSize.y/2}),
			1/1
		);

		// Draw the player avatars.
		this.avatar.draw(
			context,
			deltaTime,
			new Coord({x:appSize.x/2+ Board.getWidth() * -1.1/2, y:appSize.y/2 + Board.getWidth()*.65})
		);
	}
}
