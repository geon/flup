
"use strict";


function Board (options) {

	this.pieces = [];

	// // Fill the poard with pieces. 
	// for (var i = 0; i < 16*8; ++i) {
	// 	this.pieces[i] = {color:Math.floor(Math.random() * 4), key:false};
	// }

	this.pieceCycle = options.pieceCycle;
	this.pieceCycleIndex = 0;
	this.dropperPieceA = undefined;
	this.dropperPieceB = undefined;

	this.playerPosition = Math.floor((8-1)/2); // Ahrg! I want to use Board.size, but it isn't defined yet...
	this.playerOrientation = 0;

	this.serverStateCounter = 0;


	this.chargeDropper();
};


Board.size = {x:8, y:18};
Board.numColors = 4;
Board.nonKeyToKeyRatio = 7;


Board.prototype.coordToIndex = function (x, y) {
	
	return x + y * Board.size.x;
};


Board.prototype.moveLeft = function () {
	
	this.playerPosition = Math.max(0, this.playerPosition - 1);

	this.animateDropper();
};


Board.prototype.moveRight = function () {
	
	this.playerPosition = Math.min(Board.size.x - (this.playerOrientation % 2 ? 1 : 2), this.playerPosition + 1);

	this.animateDropper();
};


Board.prototype.rotate = function () {
	
	this.playerOrientation = ((this.playerOrientation + 1) % 4);

	this.preventDropperFromStickingOutAfterRotation();

	this.animateDropper();
};


Board.prototype.preventDropperFromStickingOutAfterRotation = function () {
	
	// If the orientation is horizontal, and the pieces were at the right wall, now making the last one stick out...
	if	(!(this.playerOrientation % 2) && this.playerPosition >= Board.size.x - 1) {

		// ...move the pair up just against the wall.
		this.playerPosition = Board.size.x - 2;
	}
};


Board.prototype.drop = function () {
	
	var coords = this.getDropperCoordinates();

	var aPos = this.coordToIndex(coords.a.x, coords.a.y);
	var bPos = this.coordToIndex(coords.b.x, coords.b.y);

	// Make sure the board space is not used, and is not outside the board.
	if (
		this.pieces[aPos] ||
		this.pieces[bPos] ||
		coords.a.x < 0 || coords.a.x > Board.size.x-1 ||
		coords.b.x < 0 || coords.b.x > Board.size.x-1
	) {
		return false;
	}
	
	// Add the pieces.
	this.pieces[aPos] = this.dropperPieceA;
	this.pieces[bPos] = this.dropperPieceB
	this.chargeDropper();


	this.applyGameLogic();

	return true;
};


Board.prototype.getDropperCoordinates = function () {

	/* Player Orientations:
	
		ab	a.	ba	b.
		..	b.	..	a.
	*/

	return {
		a: {
			x: this.playerPosition + (this.playerOrientation == 2 ? 1 : 0),
			y: (this.playerOrientation == 3 ? 1 : 0)
		},
		b: {
			x: this.playerPosition + (this.playerOrientation == 0 ? 1 : 0),
			y: (this.playerOrientation == 1 ? 1 : 0)
		},
	};
}


Board.prototype.chargeDropper = function () {

	this.dropperPieceA = new Piece(this.getNextPieceInCycle(0));
	this.dropperPieceB = new Piece(this.getNextPieceInCycle(1));
	this.consumePiecesFromCycle(2);

	// Set the orientation back to horiz. or vert., but not backwards or upside-down.
	this.playerOrientation %= 2;

	this.animateDropper();
};


Board.prototype.consumePiecesFromCycle = function (count) {

	this.pieceCycleIndex = (this.pieceCycleIndex + count) % this.pieceCycle.length;
};


Board.prototype.getNextPieceInCycle = function (index) {

	return this.pieceCycle[(this.pieceCycleIndex + index) % this.pieceCycle.length];
};


Board.prototype.animateDropper = function () {

	var coords = this.getDropperCoordinates();

	var timePerPieceWidths = 50;

	this.dropperPieceA.animation.add(new Animation({
		to: coords.a,
		duration: timePerPieceWidths
	}));
	this.dropperPieceB.animation.add(new Animation({
		to: coords.b,
		delay: timePerPieceWidths,
		duration: timePerPieceWidths
	}));
}

Board.prototype.applyGameLogic = function () {

	/*

	This might seem like an awful lot of code for something as simple as
	making the pieces fall.
	
	Turns out it isn't that simple...

	I need to set the animation properly so it is initiated only when a
	piece *starts* falling. That makes it tricky to do it in multiple
	passes. I also want a slight delay in the animation for each
	consecutive piece in a falling block. That means I need to keep track
	of wether the line of pieces is broken.

	If you have a better solution, I'm happy to see it.

	*/

	// For each collumn.
	for (var x = 0; x < Board.size.x; ++x) {

		// Start at the bottom.
		var yPut = Board.size.y - 1;

		// Search for a space that can be filled from above.
		while (yPut && this.pieces[this.coordToIndex(x, yPut)]) {
			--yPut;
		}

		var yGet = yPut - 1;

		var numConsecutive = 0;

		// For the whole collumn...
		collumnLoop:
		while (yGet >= 0){

			// Search for a piece to put in the empty space.
			while (!this.pieces[this.coordToIndex(x, yGet)]) {

				--yGet;

				numConsecutive = 0;

				if (yGet < 0) {
					break collumnLoop;
				}
			}

			var getPos = this.coordToIndex(x, yGet);
			var putPos = this.coordToIndex(x, yPut);

			// Move the piece.
			this.pieces[putPos] = this.pieces[getPos];
			this.pieces[getPos] = undefined;

			// Animate it.
			var timePerPieceHeight = 50;
			this.pieces[putPos].animation.add(new Animation({
				to: {x: x, y: yPut},
				delay: numConsecutive * timePerPieceHeight,
				duration: Math.sqrt(yPut - yGet) * timePerPieceHeight,
				interpolation: "easeInQuad"
			}));
			++numConsecutive;

			// Raise the put/put-positions.
			--yGet;
			--yPut;
		}
	}

};


Board.generatePieceCycle = function () {

	// Create list of all colors.
	var baseColors = [];
	var keyColors = [];
	for (var i = 0; i < Board.numColors; ++i) {
		baseColors[i] = {color: i, key: false};
		keyColors[i] = {color: i, key: true};
	}

	// Create a list of all pieces in the proper ratios.
	var properRatio = keyColors;
	for (var i = 0; i < Board.nonKeyToKeyRatio; ++i) {
		properRatio = properRatio.concat(baseColors);
	}

	// Repeat the colors so there is a long cycle. 
	var pieces = [];
	for (var i = 0; i < 32; ++i) {

		// Shuffle the group of keys and colors separately, so the whole cycle gets the keys/colors evenly distributed.
		this.fisherYatesArrayShuffle(properRatio);
	
		pieces = pieces.concat(properRatio);
	}
		
	return pieces;
};


// http://stackoverflow.com/questions/2450954/how-to-randomize-a-javascript-array
Board.fisherYatesArrayShuffle = function (myArray) {

	var i = myArray.length;
	if ( i == 0 ) return false;
	while ( --i ) {
		var j = Math.floor( Math.random() * ( i + 1 ) );
		var tempi = myArray[i];
		var tempj = myArray[j];
		myArray[i] = tempj;
		myArray[j] = tempi;
	 }
}


Board.prototype.draw = function (images, context, currentTime, center, scale) {

	// Draw the board pieces.
	for (var i = 0, length = this.pieces.length; i < length; ++i) {

		var piece = this.pieces[i];
		if (piece !== undefined) {

			piece.draw(
				images,
				context,
				currentTime,
				center,
				scale
			);
		}
	}

	// Draw the dropper pieces.
	this.dropperPieceA.draw(
		images,
		context,
		currentTime,
		center,
		scale
	);
	this.dropperPieceB.draw(
		images,
		context,
		currentTime,
		center,
		scale
	);
};

