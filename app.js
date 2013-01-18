
"use strict";


function App (options) {

	this.context = options.context;

	var pieceCycle = Board.generatePieceCycle()

	this.gameMode = new GameMode();

	// TODO: Move this to the GameMode implementation.
	this.boardA = new Board({pieceCycle: pieceCycle, gameMode: this.gameMode});
	this.boardB = new Board({pieceCycle: pieceCycle, gameMode: this.gameMode});

	this.gameMode.boards = [this.boardA, this.boardB];

	this.pieceSize = 32;
	
	this.lastRenderTime = 0;

	this.backgroundImage = new Image();


	// Make the canvas resolution match the displayed size.
	var self = this;
	function makeCanvasFullWindow (){

		self.context.canvas.width = window.innerWidth * window.devicePixelRatio;
		self.context.canvas.height = window.innerHeight * window.devicePixelRatio;

		$(self.context.canvas).css({
			width: window.innerWidth,
			height: window.innerHeight
		});

		// Set the scale factor to handle Retina displays. MUST BE DONE AFTER EACH SIZE CHANGE.
		self.context.scale(window.devicePixelRatio, window.devicePixelRatio);
	}
	$(window).resize(makeCanvasFullWindow);
	makeCanvasFullWindow();


	
	this.loadSprites().then(function(){

		console.log("Sprites loaded.");
		
		self.startGame();

	}, function(){
		
		console.log("Could not load sprites.");
	});

}


App.prototype.getWidth = function () {
	
	return this.context.canvas.width / window.devicePixelRatio;
}


App.prototype.getHeight = function () {
	
	return this.context.canvas.height / window.devicePixelRatio;
}


App.prototype.loadSprites = function () {

	var promises = [];
	
	promises.push(Piece.getSpriteSheet().loadImage());
	promises.push(UnlockingEffect.getSpriteSheet().loadImage());

	var promise = $.Deferred();
	$(this.backgroundImage).load(promise.resolve);
	$(this.backgroundImage).error(promise.reject);
	this.backgroundImage.src = "graphics/background.jpg";

	promises.push(promise);

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


	// Draw the background.
	var srcAspect = this.backgroundImage.width / this.backgroundImage.height;
	var dstAspect = this.getWidth()            / this.getHeight();
	var srcCroppedWidth  = Math.min(this.backgroundImage.width,  this.backgroundImage.width  * dstAspect / srcAspect);
	var srcCroppedHeight = Math.min(this.backgroundImage.height, this.backgroundImage.height / dstAspect * srcAspect);
	this.context.drawImage(
		this.backgroundImage,

		// Source xywh - Centered crop to destination aspect.
		Math.max(0, this.backgroundImage.width  - srcCroppedWidth ) / 2,
		Math.max(0, this.backgroundImage.height - srcCroppedHeight) / 2,
		srcCroppedWidth,
		srcCroppedHeight,

		// Destination xywh - Fill up completely.
		0,
		0,
		this.getWidth(),
		this.getHeight()
	);


	// The player boards.
	this.boardA.draw(
		this.context,
		currentTime,
		{x:(this.getWidth() - Board.getWidth() * 2) * 1/3 + Board.getWidth() * 1/2, y:this.getHeight()/2},
		1/1
	);
	this.boardB.draw(
		this.context,
		currentTime,
		{x:(this.getWidth() - Board.getWidth() * 2) * 2/3 + Board.getWidth() * 3/2, y:this.getHeight()/2},
		1/1
	);


	// FPS counter.
//	this.context.fillStyle = "black";
//	this.context.font = "16px Palatino";
//	this.context.fillText("FPS: " + Math.floor(1000/deltaTime), 10, 20);
};







