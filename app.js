
"use strict";


function App (options) {

	this.context = options.context;

	var pieceCycle = Board.generatePieceCycle()

	this.boardA = new Board({pieceCycle: pieceCycle});
	this.boardB = new Board({pieceCycle: pieceCycle});

	this.pieceSize = 32;
	
	this.context.canvas.width = this.getWidth();
	this.context.canvas.height = this.getHeight();

	this.lastRenderTime = 0;


	// Handle Retina Display

	// Find the resolution multiplier.
	var pixelRatio = 1;
	if (window.devicePixelRatio) {
		pixelRatio = window.devicePixelRatio;
	}

	$(this.context.canvas)

		// Double the number of pixels...
		.attr('width', this.getWidth() * pixelRatio)
		.attr('height', this.getHeight() * pixelRatio)

		// ...But keep the displayed size the same.		
		.css('width', this.getWidth())
		.css('height', this.getHeight())
	;
	
	// Set the scale factor so we can forget this.
	this.context.scale(pixelRatio, pixelRatio);			 




	var self = this;
	
	this.loadSprites().then(function(){

		console.log("Sprites loaded.");
		
		self.startGame();

	}, function(){
		
		console.log("Could not load sprites.");
	});

}


App.prototype.getWidth = function () {
	
	return Board.size.x * this.pieceSize * 3;
}


App.prototype.getHeight = function () {
	
	return Board.size.y * this.pieceSize * 1.2;
}


App.prototype.loadSprites = function () {

	var promises = [];
	
	promises.push(Piece.getSpriteSheet().loadImage());
	promises.push(UnlockingEffect.getSpriteSheet().loadImage());

	return $.when.apply($, promises);	
};


App.prototype.startGame = function () {

	// Set up input.
	var self = this;

	window.addEventListener("keyup", function(event) {

		self.keydownEventInProgress = undefined;

	}, false);

	window.addEventListener("keydown", function(event) {

		if (self.boardA.gameOver || self.boardB.gameOver) {

			return;
		}

		if (self.keydownEventInProgress != event.keyCode) {

			switch (event.keyCode) {

				// Player 1.
				case 37: // Left
					self.boardB.moveLeft();
					break;
		
				case 39: // Right
					self.boardB.moveRight();
					break;
		
				case 38: // Up
					self.boardB.rotate();
					break;
		
				case 40: // Down
					self.boardB.drop();
					break;


				// Player 2.
				case "A".charCodeAt(0): // Left
					self.boardA.moveLeft();
					break;
		
				case "D".charCodeAt(0): // Right
					self.boardA.moveRight();
					break;
		
				case "W".charCodeAt(0): // Up
					self.boardA.rotate();
					break;
		
				case "S".charCodeAt(0): // Down
					self.boardA.drop();
					break;
			}
		}

		self.keydownEventInProgress = event.keyCode;

	}, false);

	// Set up the server connection.
	// var socket = io.connect("//"); // The root at the same domain and protocol.
	// socket.on("opponent broadcast", function (data) {

	// 	console.log(data);

	// 	if (data.opponentID != this.board.ID) {

	// 		this.opponentBoards[data.opponentID][data.action]();
	// 	}
	// });

	// Set up the renderer.
	this.startRenderLoop();
};


App.prototype.startRenderLoop = function () {
	
	// We need a function to run the game over and over.
	function onEachFrame (callback) {
		
		// Use setTimeout as a naïve fallback.
		var doLater = function (callback) { setTimeout(callback, 20); };
	
		// Use a more specialized function if available.
		if (window.webkitRequestAnimationFrame) {

			// webkit
			doLater = webkitRequestAnimationFrame;

		} else if (window.mozRequestAnimationFrame) {

			// Mozilla
			doLater = mozRequestAnimationFrame;

		} else if (window.msRequestAnimationFrame) {

			// ie 10 PP2+
			doLater = msRequestAnimationFrame;
		}

		// Set up the loop.	
		var loop = function() { callback(); doLater(loop); }
		loop();
	};

	// Start the loop.
	var self = this;
	onEachFrame(function(){self.render();})
}


App.prototype.render = function () {

	// Calculate delta time.
	var currentTime = new Date().getTime();
	var deltaTime = currentTime - this.lastRenderTime;
	this.lastRenderTime = currentTime;

	// Fill the background.
	this.context.fillStyle = "#eee";
	this.context.fillRect(0, 0, this.getWidth(), this.getHeight());


	// // Testing dummy opponent boards.
	// this.board.draw(
	// 	this.context,
	// 	currentTime,
	// 	{x:this.getWidth()*1/8, y:this.getHeight()*2/4},
	// 	1/2
	// );
	// this.board.draw(
	// 	this.context,
	// 	currentTime,
	// 	{x:this.getWidth()*7/8, y:this.getHeight()*2/4},
	// 	1/2
	// );



	// The player boards.
	this.boardA.draw(
		this.context,
		currentTime,
		{x:this.getWidth()/4*1, y:this.getHeight()/2},
		1/1
	);
	this.boardB.draw(
		this.context,
		currentTime,
		{x:this.getWidth()/4*3, y:this.getHeight()/2},
		1/1
	);


	// FPS counter.
//	this.context.fillStyle = "black";
//	this.context.font = "16px Palatino";
//	this.context.fillText("FPS: " + Math.floor(1000/deltaTime), 10, 20);
};







