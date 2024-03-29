import { AvatarAztecJade } from "./AvatarAztecJade";
import { AvatarOwl } from "./AvatarOwl";
import { Coord } from "./Coord";
import { GameMode } from "./GameMode";
// import { GameMode2pLocal } from "./GameMode2pLocal";
import { GameMode2pAi } from "./GameMode2pAi";
import { PieceSprite } from "./PieceSprite";
import { SpriteSet, SpriteSheet } from "./SpriteSheet";
import { UnlockingEffect } from "./UnlockingEffect";
import { AvatarMonolith } from "./AvatarMonolith";

export class App {
	context: CanvasRenderingContext2D;

	gameMode: GameMode;

	lastRenderTime: number;

	keydownEventInProgress: number | undefined;

	constructor(options: { context: CanvasRenderingContext2D }) {
		this.context = options.context;

		// this.gameMode = new GameMode2pLocal();
		this.gameMode = new GameMode2pAi();

		this.lastRenderTime = 0;

		// Make the canvas resolution match the displayed size.
		const makeCanvasFullWindow = () => {
			this.context.canvas.width = window.innerWidth * window.devicePixelRatio;
			this.context.canvas.height = window.innerHeight * window.devicePixelRatio;

			this.context.canvas.style.width = window.innerWidth + "px";
			this.context.canvas.style.height = window.innerHeight + "px";

			// Set the scale factor to handle Retina displays. MUST BE DONE AFTER EACH SIZE CHANGE.
			this.context.scale(window.devicePixelRatio, window.devicePixelRatio);
		};
		window.onresize = makeCanvasFullWindow;
		makeCanvasFullWindow();
	}

	static sprites: SpriteSet;
	static spriteSheet: SpriteSheet;

	static getSprites() {
		if (!this.sprites) {
			this.sprites = this.getSpriteSheet().getSprites();
		}

		return this.sprites;
	}

	static getSpriteSheet() {
		if (!this.spriteSheet) {
			this.spriteSheet = new SpriteSheet(this.getSpriteSheetSettings());
		}

		return this.spriteSheet;
	}

	static getSpriteSheetSettings() {
		const gridSize = new Coord({ x: 4, y: 2 });
		const spriteSettings = [];
		for (let i = 0; i < gridSize.x * gridSize.y; ++i) {
			spriteSettings.push({
				name: i.toString(),
				sheetPosition: new Coord({
					x: i % gridSize.x,
					y: Math.floor(i / gridSize.x),
				}),
				sheetSize: new Coord({ x: 1, y: 1 }),
			});
		}

		return {
			imageFileName: "slates.jpg",
			gridSize,
			spriteSettings,
		};
	}

	getWidth() {
		return this.context.canvas.width / window.devicePixelRatio;
	}

	getHeight() {
		return this.context.canvas.height / window.devicePixelRatio;
	}

	loadSprites() {
		// TODO: This is really ugly.
		return Promise.all([
			PieceSprite.getSpriteSheet().loadImage(),
			UnlockingEffect.getSpriteSheet().loadImage(),
			AvatarOwl.getSpriteSheet().loadImage(),
			AvatarAztecJade.getSpriteSheet().loadImage(),
			AvatarMonolith.getSpriteSheet().loadImage(),
			App.getSpriteSheet().loadImage(),
		]);
	}

	async startGame() {
		// Set up input.

		// I need to listen to keyup as well, so I can ignore repeated
		// keydown events from holding the key.
		window.addEventListener(
			"keyup",
			(_event) => {
				this.keydownEventInProgress = undefined;
			},
			false,
		);

		window.addEventListener(
			"keydown",
			(event) => {
				if (this.keydownEventInProgress !== event.keyCode) {
					this.gameMode.onKeyDown(event.keyCode);
				}

				this.keydownEventInProgress = event.keyCode;
			},
			false,
		);

		// Set up the server connection.
		// var socket = io.connect("//"); // The root at the same domain and protocol.
		// socket.on("opponent broadcast", function (data) {

		// 	console.log(data);

		// 	if (data.opponentID != this.board.ID) {

		// 		this.opponentBoards[data.opponentID][data.action]();
		// 	}
		// });

		await this.loadSprites();

		// Set up the renderer.
		await this.startRenderLoop();
	}

	async startRenderLoop() {
		const requestAnimFrame = () =>
			new Promise<number>((resolve) => {
				(
					window.requestAnimationFrame ||
					(window as any).webkitRequestAnimationFrame ||
					(window as any).mozRequestAnimationFrame ||
					(window as any).oRequestAnimationFrame ||
					(window as any).msRequestAnimationFrame ||
					((callback) => {
						window.setTimeout(callback, 1000 / 60, new Date().getTime());
					})
				)(resolve);
			});

		// Start the loop.
		for (;;) {
			const currentTime = await requestAnimFrame();

			// Calculate delta time. Cap it to make debugging easier.
			const deltaTime = Math.min(currentTime - this.lastRenderTime, 100);
			this.lastRenderTime = currentTime;

			const done = this.gameMode.frameCoroutine.next(deltaTime).done;
			this.render();

			// Restart the game after game over.
			if (done) {
				// TODO
				// console.log("Game Over");
			}
		}
	}

	render() {
		// Draw the board background.
		this.context.fillStyle = "rgba(0, 0, 0, 1)";
		this.context.fillRect(0, 0, this.getWidth(), this.getHeight());

		// Boards and avatars.
		this.gameMode.draw(
			this.context,
			new Coord({
				x: this.getWidth(),
				y: this.getHeight(),
			}),
		);

		// FPS counter.
		// this.context.fillStyle = "black";
		// this.context.font = "16px Palatino";
		// this.context.fillText("FPS: " + Math.floor(1000/deltaTime), 10, 20);
	}
}
