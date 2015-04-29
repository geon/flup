
/// <reference path="GameMode.ts"/>
/// <reference path="GameMode2pLocal.ts"/>


class App {

	context: CanvasRenderingContext2D;

	gameMode: GameMode;

	lastRenderTime: number;

	slateSpriteSheet: SpriteSheet

	keydownEventInProgress;



	constructor (options: {context: CanvasRenderingContext2D}) {

		this.context = options.context;

		this.gameMode = new GameMode2pLocal();
		
		this.lastRenderTime = 0;

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


	static sprites;
	static spriteSheet: SpriteSheet;


	static getSprites () {

		if (!this.sprites) {

			this.sprites = this.getSpriteSheet().getSprites();
		}

		return this.sprites;
	}


	static getSpriteSheet () {

		if (!this.spriteSheet) {

			this.spriteSheet = new SpriteSheet(this.getSpriteSheetSettings());
		}

		return this.spriteSheet;
	}


	static getSpriteSheetSettings () {

		var gridSize = new Coord({x:4, y:4});
		var spriteSettings = [];
		for (var i=0; i<gridSize.x*gridSize.y; ++i) {
			spriteSettings.push({
				name: new String(i),
				sheetPosition: new Coord({x:i%gridSize.x, y:Math.floor(i/gridSize.x)}),
				sheetSize: new Coord({x:1, y:1})
			});
		}
		
		return {
			imageFileName: "slates.jpg",
			gridSize: gridSize,
			spriteSettings: spriteSettings	
		};
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
		promises.push(App.getSpriteSheet().loadImage());

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

		var requestAnimFrame: (callback: (currentTime: number) => void) => void = (function(){
			return window.requestAnimationFrame || 
			(<any>window).webkitRequestAnimationFrame || 
			(<any>window).mozRequestAnimationFrame || 
			(<any>window).oRequestAnimationFrame || 
			window.msRequestAnimationFrame || 
			function(callback){ 
				window.setTimeout(callback, 1000 / 60, new Date().getTime());
			}; 
		})(); 		
		
		// Start the loop.
		var self = this;
		function loop (currentTime: number) { self.render(currentTime); requestAnimFrame(loop); }
		requestAnimFrame(loop);
	}


	render (currentTime: number) {

		// Calculate delta time. Cap it to make debugging easier.
		var deltaTime = Math.min(currentTime - this.lastRenderTime, 100);
		this.lastRenderTime = currentTime;


		// Draw the board background.
        this.context.fillStyle = "rgba(0, 0, 0, 1)";
        this.context.fillRect(
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
