
/// <reference path="Coord.ts"/>
/// <reference path="Piece.ts"/>
/// <reference path="Board.ts"/>
/// <reference path="PieceCycle.ts"/>


class DropperQueue {

	pieces: Piece[];

	pieceCycle: PieceCycle;


	constructor (options: {pieceCycle: PieceCycle}) {

		this.pieces = [];

		this.pieceCycle = options.pieceCycle;

		this.fillUpDropperQueue();
	}

	static dropperQueueVisibleLength: number = 6;
	static dropperQueueTimePerPieceWidth: number = 200;

	fillUpDropperQueue () {

		while (this.pieces.length < DropperQueue.dropperQueueVisibleLength) {

			var piece = this.pieceCycle.consumePieceFromCycle();

			this.pieces.push(new Piece({
				color: piece.color,
				key: piece.key,
				animationQueue: new AnimationQueue(new Coord({
					x: Board.size.x,
					y: this.pieces.length
				})),
			}));
		};
	}


	pop () {

		var newPiece = this.pieceCycle.consumePieceFromCycle();

		this.pieces.push(new Piece({
			color: newPiece.color,
			key: newPiece.key,
			animationQueue: new AnimationQueue(new Coord({
				x: Board.size.x,
				y: DropperQueue.dropperQueueVisibleLength
			})),
		}));

		var p = this.pieces.shift();

		var currentTime = new Date().getTime();

		for (var i = 0; i < this.pieces.length; i++) {

			this.pieces[i].animationQueue.add(new Animation({
				to: new Coord({x: Board.size.x, y: i}),
				duration: DropperQueue.dropperQueueTimePerPieceWidth,
				interpolation: "sine",
				startTime: (this.pieces[0].animationQueue.getLast() && this.pieces[0].animationQueue.getLast().startTime) || currentTime
			}));
		};

		return p
	}




	draw (context: CanvasRenderingContext2D, currentTime: number, center: Coord, scale: number, boardSize: Coord) {

		// Draw the dropper queue.
		for (var i = 0; i < this.pieces.length; i++) {
			this.pieces[i].draw(
				context,
				currentTime,
				center,
				scale,
				0,
				boardSize
			);
		};
	}
}
