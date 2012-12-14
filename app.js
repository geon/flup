
"use strict";


function App (options) {

	this.context = options.context;

	this.board = new Board({pieceCycle: Board.generatePieceCycle()});

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



	this.images = {};



	var self = this;
	
	this.loadImages([
		"piece1.png",
		"piece2.png",
		"piece3.png",
		"piece4.png",
		"key1.png",
		"key2.png",
		"key3.png",
		"key4.png",
	]).then(function(){

		console.log("Sprites loaded.");
		
		self.startGame();

	}, function(){
		
		console.log("Could not load sprites.");
	});

}


App.prototype.getWidth = function () {
	
	return Board.size.x * this.pieceSize;
}


App.prototype.getHeight = function () {
	
	return Board.size.y * this.pieceSize;
}


App.prototype.loadImages = function (imageFileNames) {

	var promises = [];
	
	for (var i = 0; i < imageFileNames.length; ++i) {

		var imageFileName = imageFileNames[i];
		
		var promise = $.Deferred();
	
		var img = new Image();
		$(img).load(promise.resolve);
		$(img).error(promise.reject);
		img.src = 'graphics/'+imageFileName;

		this.images[imageFileName] = img;
		promises.push(promise);		
	}

	return $.when.apply($, promises);	
};


App.prototype.startGame = function () {

	// Set up input.
	var self = this;
	window.addEventListener("keydown", function(event) {
		switch (event.keyCode) {
			case 37: // Left
				self.board.moveLeft();
				break;
	
			case 39: // Right
				self.board.moveRight();
				break;
	
			case 38: // Up
				self.board.rotate();
				break;
	
			case 40: // Down
				self.board.drop();
				break;
		}
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

	// Testing dummy opponent boards.
	this.board.draw(
		this.images,
		this.context,
		currentTime,
		{x:this.getWidth()*1/8, y:this.getHeight()*2/4},
		1/4
	);
	this.board.draw(
		this.images,
		this.context,
		currentTime,
		{x:this.getWidth()*7/8, y:this.getHeight()*2/4},
		1/4
	);



	// The player board.
	this.board.draw(
		this.images,
		this.context,
		currentTime,
		{x:this.getWidth()/2, y:this.getHeight()/2},
		1/2
	);


	// FPS counter.
//	this.context.fillStyle = "black";
//	this.context.font = "16px Palatino";
//	this.context.fillText("FPS: " + Math.floor(1000/deltaTime), 10, 20);
};







