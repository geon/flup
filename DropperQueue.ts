
/// <reference path="Coord.ts"/>
/// <reference path="Piece.ts"/>
/// <reference path="Board.ts"/>
/// <reference path="PieceCycle.ts"/>


class DropperQueue {

	dropperQueue: Piece[];

	pieceCycle: PieceCycle;


	constructor (options: {pieceCycle: PieceCycle}) {

		this.dropperQueue = [];

		this.pieceCycle = options.pieceCycle;

		this.fillUpDropperQueue();
	}

	static dropperQueueVisibleLength: number = 6;
	static dropperQueueTimePerPieceWidth: number = 200;

	fillUpDropperQueue () {

		while (this.dropperQueue.length < DropperQueue.dropperQueueVisibleLength) {

			var piece = this.pieceCycle.consumePieceFromCycle();

			this.dropperQueue.push(new Piece({
				color: piece.color,
				key: piece.key,
				animationQueue: new AnimationQueue(new Coord({
					x: Board.size.x,
					y: this.dropperQueue.length
				})),
			}));
		};
	}


	consumePieceFromDropperQueue () {

		var newPiece = this.pieceCycle.consumePieceFromCycle();

		this.dropperQueue.push(new Piece({
			color: newPiece.color,
			key: newPiece.key,
			animationQueue: new AnimationQueue(new Coord({
				x: Board.size.x,
				y: DropperQueue.dropperQueueVisibleLength
			})),
		}));

		var p = this.dropperQueue.shift();

		var currentTime = new Date().getTime();

		for (var i = 0; i < this.dropperQueue.length; i++) {

			this.dropperQueue[i].animationQueue.add(new Animation({
				to: new Coord({x: Board.size.x, y: i}),
				duration: DropperQueue.dropperQueueTimePerPieceWidth,
				interpolation: "sine",
				startTime: (this.dropperQueue[0].animationQueue.getLast() && this.dropperQueue[0].animationQueue.getLast().startTime) || currentTime
			}));
		};

		return p
	}




	draw (context: CanvasRenderingContext2D, currentTime: number, center: Coord, scale: number, boardSize: Coord) {

		// Draw the dropper queue.
		for (var i = 0; i < this.dropperQueue.length; i++) {
			this.dropperQueue[i].draw(
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
