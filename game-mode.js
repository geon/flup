
"use strict";


function GameMode (options) {

	this.boards = null;
};


GameMode.prototype.punishOpponents = function (board) {

	for (var i = 0; i < this.boards.length; i++) {

		if (this.boards[i] != board) {

			this.boards[i].punish();
		}
	};
}