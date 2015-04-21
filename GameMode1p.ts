
/// <reference path="GameMode.ts"/>
/// <reference path="Avatar.ts"/>
/// <reference path="AvatarOwl.ts"/>
/// <reference path="Coord.ts"/>
/// <reference path="Board.ts"/>


class GameMode1p implements GameMode {

	board: Board;
	avatar: Avatar;


	constructor () {

		var pieceCycle = Board.generatePieceCycle()

		this.board = new Board({pieceCycle: pieceCycle, gameMode: this});
		this.avatar = new AvatarOwl({character: 0});
	}


	onUnlockedChains (board: Board) {

		// Do nothing.
	}


	isGameOver () {

		return this.board.gameOver;
	}


	onKeyDown (keyCode: number) {

		if (this.isGameOver()) {

			return;
		}

		switch (event.keyCode) {

			case 37: // Left
				this.board.moveLeft();
				break;

			case 39: // Right
				this.board.moveRight();
				break;

			case 38: // Up
				this.board.rotate();
				break;

			case 40: // Down
				this.board.drop();
				break;
		}
	}

	draw (
		context: CanvasRenderingContext2D,
		currentTime: number,
		appSize: Coord
	) {

		// The player boards.
		this.board.draw(
			context,
			currentTime,
			new Coord({x:appSize.x/2, y:appSize.y/2}),
			1/1
		);

		// Draw the player avatars.
		this.avatar.draw(
			context,
			currentTime,
			new Coord({x:appSize.x/2+ Board.getWidth() * -1.1/2, y:appSize.y/2 + Board.getWidth()*.65})
		);
	}
}
