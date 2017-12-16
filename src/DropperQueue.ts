
import {Coord} from "./Coord";
import {Piece} from "./Piece";
import {Board} from "./Board";
import {PieceCycle} from "./PieceCycle";
import {Animation} from "./Animation";
import {AnimationQueue} from "./AnimationQueue";


export class DropperQueue {

	pieces: Piece[];

	pieceCycle: PieceCycle;


	constructor (options: {pieceCycle: PieceCycle}) {

		this.pieceCycle = options.pieceCycle;

		this.pieces = [];
		while (this.pieces.length < DropperQueue.dropperQueueVisibleLength) {

			var piece = this.pieceCycle.pop();

			this.pieces.push(new Piece({
				color: piece.color,
				key: piece.key,
				animationQueue: new AnimationQueue(new Coord({
					x: Board.size.x,
					y: this.pieces.length
				})),
			}));
		}
	}


	static dropperQueueVisibleLength: number = 6;
	static dropperQueueTimePerPieceWidth: number = 200;


	pop () {

		var newPiece = this.pieceCycle.pop();

		this.pieces.push(new Piece({
			color: newPiece.color,
			key: newPiece.key,
			animationQueue: new AnimationQueue(new Coord({
				x: Board.size.x,
				y: DropperQueue.dropperQueueVisibleLength
			})),
		}));

		var p = this.pieces.shift();

		for (var i = 0; i < this.pieces.length; i++) {

			this.pieces[i].animationQueue.add(new Animation({
				to: new Coord({x: Board.size.x, y: i}),
				duration: DropperQueue.dropperQueueTimePerPieceWidth,
				interpolation: "sine",
				delay: 0
				// delay: this.pieces[0].animationQueue.length() || 0
			}));
		}

		return p
	}


	draw (context: CanvasRenderingContext2D, deltaTime: number, center: Coord, scale: number, boardSize: Coord) {

		// Draw the dropper queue.
		for (var i = 0; i < this.pieces.length; i++) {
			this.pieces[i].draw(
				context,
				deltaTime,
				center,
				scale,
				0,
				boardSize
			);
		};
	}
}
