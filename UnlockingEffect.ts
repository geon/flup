
/// <reference path="Piece.ts"/>
/// <reference path="Coord.ts"/>


class UnlockingEffect {

	color: number;
	coord: Coord;
	startTime: number;
	initialVelocities: Coord[];


	constructor (piece: Piece) {

		this.color = piece.color;
		this.coord = piece.animationQueue.getLastTo();
		this.startTime = piece.unlockEffectStartTime;

		this.initialVelocities = [];
		for (var i = 0; i < 8; i++) {
			this.initialVelocities[i] = new Coord({x: Math.random() * 2 - 1, y: Math.random() * 2 - 1}).scaled(0.5);
		};
	}


	static size: number = 16;
	static gravity: number = 0.001;
	static sprites = null;
	static spriteSheet = null;


	static getSprites = function() {

		if (!UnlockingEffect.sprites) {

			UnlockingEffect.sprites = UnlockingEffect.getSpriteSheet().getSprites();
		}

		return UnlockingEffect.sprites;
	}


	static getSpriteSheet = function () {

		if (!UnlockingEffect.spriteSheet) {

			UnlockingEffect.spriteSheet = new SpriteSheet(UnlockingEffect.getSpriteSheetSettings());
		}

		return UnlockingEffect.spriteSheet;
	}


	static getSpriteSheetSettings = function () {

		var sprites: {
			name: string,
			sheetPosition: Coord,
			sheetSize: Coord
		}[] = [];

		for (var i = 0; i < 4; ++i) {
			for (var j = 0; j < 8; ++j) {

				sprites.push({
					name: "color "+i+", variation "+j,
					sheetPosition: new Coord({x:4+j%4, y:i*2+Math.floor(j/4)}),
					sheetSize:     new Coord({x:1,     y:1}),
				});
			}
		}

		return {
			imageFileName: "pieces.png",
			gridSize: new Coord({x:8, y:8}),
			spriteSettings: sprites	
		}
	}


	isDone (currentTime: number) {

		return currentTime > this.startTime + 1000 * 3;
	}


	draw (
		context: CanvasRenderingContext2D,
		currentTime: number,
		boardCenter: Coord,
		boardScale: number,
		boardSize: Coord
	) {

		var origin = new Coord({
			x: (boardCenter.x + (this.coord.x/boardSize.x - 0.5) * boardSize.x*Piece.size*boardScale + Piece.size/2) - 0.5 * (UnlockingEffect.size),
			y: (boardCenter.y + (this.coord.y/boardSize.y - 0.5) * boardSize.y*Piece.size*boardScale + Piece.size/2) - 0.5 * (UnlockingEffect.size)
		});


		for (var i = 0; i < this.initialVelocities.length; i++) {

			UnlockingEffect.getSprites()["color "+this.color+", variation "+i].draw(
				context,
				{
					x: origin.x + this.initialVelocities[i].x * (currentTime - this.startTime),
					y: origin.y + this.initialVelocities[i].y * (currentTime - this.startTime) + UnlockingEffect.gravity * Math.pow(currentTime - this.startTime, 2)
				},
				{
					x: UnlockingEffect.size*boardScale,
					y: UnlockingEffect.size*boardScale
				}
			);
		};
	}
}
