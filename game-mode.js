
"use strict";


function GameMode (options) {

	var pieceCycle = Board.generatePieceCycle()

	this.boards = [
		new Board({pieceCycle: pieceCycle, gameMode: this}),
		new Board({pieceCycle: pieceCycle, gameMode: this})
	];

	this.avatars = [
		new AvatarOwl({character: 0}),
		new AvatarAztecJade({character: 0})
	];
};


GameMode.prototype.punishOpponents = function (board) {

	for (var i = 0; i < this.boards.length; i++) {

		if (this.boards[i] != board) {

			this.boards[i].punish();
		}
	};
}


GameMode.prototype.isGameOver = function () {

	return this.boards[0].gameOver || this.boards[1].gameOver;
}


GameMode.prototype.onKeyDown = function (keyCode) {

	if (this.isGameOver()) {

		return;
	}

	switch (event.keyCode) {

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
	}
}

GameMode.prototype.draw = function (context, currentTime, appSize) {

	// The player boards.
	this.boards[0].draw(
		context,
		currentTime,
		{x:(appSize.x - Board.getWidth() * 2) * 1/3 + Board.getWidth() * 1/2, y:appSize.y/2},
		1/1
	);
	this.boards[1].draw(
		context,
		currentTime,
		{x:(appSize.x - Board.getWidth() * 2) * 2/3 + Board.getWidth() * 3/2, y:appSize.y/2},
		1/1
	);


	// Draw the player avatars.
	this.avatars[0].draw(
		context,
		currentTime,
		{x:(appSize.x - Board.getWidth() * 2) * 1/3 + Board.getWidth() * -0.1/2, y:appSize.y/2 + Board.getWidth()*.65}
	);
	this.avatars[1].draw(
		context,
		currentTime,
		{x:(appSize.x - Board.getWidth() * 2) * 2/3 + Board.getWidth() * 4.1/2, y:appSize.y/2 + Board.getWidth()*.65}
	);

}
