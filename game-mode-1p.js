
"use strict";


function GameMode1p (options) {

	var pieceCycle = Board.generatePieceCycle()

	this.board = new Board({pieceCycle: pieceCycle, gameMode: this});
	this.avatar = new AvatarOwl({character: 0});
};


GameMode1p.prototype.onUnlockedChains = function (board) {

	// Do nothing.
}


GameMode1p.prototype.isGameOver = function () {

	return this.board.gameOver;
}


GameMode1p.prototype.onKeyDown = function (keyCode) {

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

GameMode1p.prototype.draw = function (context, currentTime, appSize) {

	// The player boards.
	this.board.draw(
		context,
		currentTime,
		{x:appSize.x/2, y:appSize.y/2},
		1/1
	);

	// Draw the player avatars.
	this.avatar.draw(
		context,
		currentTime,
		{x:appSize.x/2+ Board.getWidth() * -1.1/2, y:appSize.y/2 + Board.getWidth()*.65}
	);
}
