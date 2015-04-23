
/// <reference path="GameMode.ts"/>
/// <reference path="Avatar.ts"/>
/// <reference path="AvatarOwl.ts"/>
/// <reference path="AvatarAztecJade.ts"/>
/// <reference path="Coord.ts"/>
/// <reference path="Board.ts"/>
/// <reference path="PieceCycle.ts"/>


class GameMode2pLocal implements GameMode {

	boards: Board[];
	avatars: Avatar[];


	constructor () {

		var pieceCycle = new PieceCycle();

		this.boards = [
			new Board({pieceCycle: pieceCycle, gameMode: this}),
			new Board({pieceCycle: pieceCycle, gameMode: this})
		];

		this.avatars = [
			new AvatarOwl(),
			new AvatarAztecJade()
		];
	}


	onUnlockedChains (board: Board) {

		this.punishOpponents(board);
	}


	punishOpponents (board: Board) {

		for (var i = 0; i < this.boards.length; i++) {

			if (this.boards[i] != board) {

				this.boards[i].punish(this.avatars[i]);
			}
		};
	}


	isGameOver () {

		return this.boards[0].gameOver || this.boards[1].gameOver;
	}


	onKeyDown (keyCode: number) {

		if (this.isGameOver()) {

			return;
		}

		switch (event.keyCode) {

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


	draw (context: CanvasRenderingContext2D, deltaTime: number, appSize: Coord) {

		// The player boards.
		this.boards[0].draw(
			context,
			deltaTime,
			new Coord({x:(appSize.x - Board.getWidth() * 2) * 1/3 + Board.getWidth() * 1/2, y:appSize.y/2}),
			1/1
		);
		this.boards[1].draw(
			context,
			deltaTime,
			new Coord({x:(appSize.x - Board.getWidth() * 2) * 2/3 + Board.getWidth() * 3/2, y:appSize.y/2}),
			1/1
		);


		// Draw the player avatars.
		this.avatars[0].draw(
			context,
			deltaTime,
			new Coord({x:(appSize.x - Board.getWidth() * 2) * 1/3 + Board.getWidth() * -0.1/2, y:appSize.y/2 + Board.getWidth()*.65})
		);
		this.avatars[1].draw(
			context,
			deltaTime,
			new Coord({x:(appSize.x - Board.getWidth() * 2) * 2/3 + Board.getWidth() * 4.1/2, y:appSize.y/2 + Board.getWidth()*.65})
		);

	}
}
