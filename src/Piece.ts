
import {AnimationQueue} from "./AnimationQueue";
import {SpriteSheet, SpriteSet} from "./SpriteSheet";
import {Coord} from "./Coord";
import {Sprite} from "./Sprite";

export class Piece {

	color: number;
	key: boolean;
	animationQueue: AnimationQueue;
	unlockEffectDelay: number;
	accumulatedDeltaTime: number;


	constructor (options: {color: number, key: boolean, animationQueue?: AnimationQueue}) {

		this.color = options.color;
		this.key = options.key;
		this.animationQueue = options.animationQueue || new AnimationQueue();
		this.unlockEffectDelay = 0;
		this.accumulatedDeltaTime = 0;
	}


	static size = 32;
	static sprites: SpriteSet | null = null;
	static spriteSheet: SpriteSheet | null = null;


	static getSprites () {

		if (!Piece.sprites) {

			Piece.sprites = Piece.getSpriteSheet().getSprites();
		}

		return Piece.sprites;
	}


	static getSpriteSheet () {

		if (!Piece.spriteSheet) {

			Piece.spriteSheet = new SpriteSheet(Piece.getSpriteSheetSettings());
		}

		return Piece.spriteSheet;
	}


	static getSpriteSheetSettings () {

		var sprites: {
			name: string,
			sheetPosition: Coord,
			sheetSize: Coord
		}[] = [];

		for (var i = 0; i < 4; ++i) {

			sprites.push({
				name: "piece"+i,
				sheetPosition: new Coord({x:0, y:i}),
				sheetSize:     new Coord({x:1, y:1}),
			});

			sprites.push({
				name: "key"+i,
				sheetPosition: new Coord({x:1, y:i}),
				sheetSize:     new Coord({x:1, y:1}),
			});
		}

		return {
			imageFileName: "pieces.png",
			gridSize: new Coord({x:4, y:4}),
			spriteSettings: sprites
		}
	}


	draw (
		context: CanvasRenderingContext2D,
		deltaTime: number,
		boardCenter: Coord,
		boardScale: number,
		disturbance: number,
		boardSize: Coord
	) {

		this.accumulatedDeltaTime += deltaTime;

		var position = this.animationQueue.getPosition(deltaTime);

		var jitterX = disturbance * (Piece.size*boardScale*0.05 * Math.sin(this.accumulatedDeltaTime/1000 * 27 + position.x + position.y*3));
		var jitterY = disturbance * (Piece.size*boardScale*0.05 * Math.sin(this.accumulatedDeltaTime/1000 * 21 + position.y + position.x*2));
		var jitterZ = disturbance * (Piece.size*boardScale*0.1  * Math.sin(this.accumulatedDeltaTime/1000 * 13 + position.y + position.x*5));

		Piece.getSprites()[(this.key ? "key" : "piece")+this.color].draw(
			context,
			new Coord({
				x: (boardCenter.x + (position.x/boardSize.x - 0.5) * boardSize.x*Piece.size*boardScale + Piece.size/2) - 0.5 * (Piece.size + jitterZ) + jitterX,
				y: (boardCenter.y + (position.y/boardSize.y - 0.5) * boardSize.y*Piece.size*boardScale + Piece.size/2) - 0.5 * (Piece.size + jitterZ) + jitterY
			}),
			new Coord({
				x: Piece.size*boardScale,
				y: Piece.size*boardScale
			})
		);
	}
}
