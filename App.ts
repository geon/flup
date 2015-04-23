
/// <reference path="GameMode.ts"/>
/// <reference path="GameMode2pLocal.ts"/>


class App {

	context: CanvasRenderingContext2D;

	gameMode: GameMode;

	lastRenderTime: number;

	backgroundImage: HTMLImageElement;

	keydownEventInProgress;



	constructor (options: {context: CanvasRenderingContext2D}) {

		this.context = options.context;

		this.gameMode = new GameMode2pLocal();
		
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


	getWidth () {
		
		return this.context.canvas.width / window.devicePixelRatio;
	}


	getHeight () {
		
		return this.context.canvas.height / window.devicePixelRatio;
	}


	loadSprites () {

		var promises = [];
		
		promises.push(Piece.getSpriteSheet().loadImage());
		promises.push(UnlockingEffect.getSpriteSheet().loadImage());
		promises.push(AvatarOwl.getSpriteSheet().loadImage());
		promises.push(AvatarAztecJade.getSpriteSheet().loadImage());

		var promise = $.Deferred();
		$(this.backgroundImage).load(promise.resolve);
		$(this.backgroundImage).error(promise.reject);
		this.backgroundImage.src = "graphics/temple.jpg";

		promises.push(promise);

		return $.when.apply($, promises);	
	}


	startGame () {

		// Set up input.
		var self = this;


		// I need to listen to keyup as well, so I can ignore repeated
		// keydown events from holding the key.
		window.addEventListener("keyup", function(event) {

			self.keydownEventInProgress = undefined;

		}, false);

		window.addEventListener("keydown", function(event) {

			if (self.keydownEventInProgress != event.keyCode) {

				self.gameMode.onKeyDown(event.keyCode);
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
	}


	startRenderLoop () {

		var requestAnimFrame: (callback: () => void) => void = (function(){ 
			return window.requestAnimationFrame || 
			(<any>window).webkitRequestAnimationFrame || 
			(<any>window).mozRequestAnimationFrame || 
			(<any>window).oRequestAnimationFrame || 
			window.msRequestAnimationFrame || 
			function(callback){ 
				window.setTimeout(callback, 1000 / 60, new Date().getTime()); 
			}; 
		})(); 		
		
		// We need a function to run the game over and over.
		function onEachFrame (callback) {

			// Set up the loop.	
			var loop = function() { callback(); requestAnimFrame(loop); }
			loop();
		};

		// Start the loop.
		var self = this;
		onEachFrame(function(){self.render();})
	}


	render () {

		// Calculate delta time. Cap it to make debugging easier.
		var currentTime = new Date().getTime();
		var deltaTime = Math.min(currentTime - this.lastRenderTime, 100);
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


		// Boards and avatars.
		this.gameMode.draw(
			this.context,
			deltaTime,
			new Coord ({
				x:this.getWidth(),
				y:this.getHeight()
			})
		);

		// FPS counter.
	//	this.context.fillStyle = "black";
	//	this.context.font = "16px Palatino";
	//	this.context.fillText("FPS: " + Math.floor(1000/deltaTime), 10, 20);
	};
}
