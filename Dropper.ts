
/// <reference path="Coord.ts"/>
/// <reference path="DropperQueue.ts"/>
/// <reference path="Board.ts"/>


class Dropper {

	dropperQueue: DropperQueue;

	dropperPieceA: Piece;
	dropperPieceB: Piece;

	playerPosition: number;
	playerOrientation: number;


	constructor (dropperQueue: DropperQueue) {

		this.dropperQueue = dropperQueue;

		this.playerPosition = Math.floor((Board.size.x-1)/2);
		this.playerOrientation = 0;

		this.chargeDropper();
	}


	moveLeft () {

		this.playerPosition = Math.max(0, this.playerPosition - 1);

		this.animateDropper(new Date().getTime());
	}


	moveRight () {

		this.playerPosition = Math.min(Board.size.x - (this.playerOrientation % 2 ? 1 : 2), this.playerPosition + 1);

		this.animateDropper(new Date().getTime());
	}


	rotate () {

		this.playerOrientation = ((this.playerOrientation + 1) % 4);

		this.preventDropperFromStickingOutAfterRotation();

		this.animateDropper(new Date().getTime());
	}


	preventDropperFromStickingOutAfterRotation () {

		// If the orientation is horizontal, and the pieces were at the right wall, now making the last one stick out...
		if	(!(this.playerOrientation % 2) && this.playerPosition >= Board.size.x - 1) {

			// ...move the pair up just against the wall.
			this.playerPosition = Board.size.x - 2;
		}
	}


	drop (board: Board) {

		var coords = this.getDropperCoordinates();

		var aPos = Board.coordToIndex(coords.a.x, coords.a.y);
		var bPos = Board.coordToIndex(coords.b.x, coords.b.y);

		// Make sure the board space is not used, and is not outside the Board.
		if (
			board.pieces[aPos] ||
			board.pieces[bPos] ||
			coords.a.x < 0 || coords.a.x > Board.size.x-1 ||
			coords.b.x < 0 || coords.b.x > Board.size.x-1
		) {
			return false;
		}

		// Add the pieces.
		board.pieces[aPos] = this.dropperPieceA;
		board.pieces[bPos] = this.dropperPieceB

		board.applyGameLogic();

		if (!board.gameOver) {

			this.chargeDropper();
		}

		return true;
	}


	getDropperCoordinates () {

		/* Player Orientations:

			ab	a.	ba	b.
			..	b.	..	a.
		*/

		return {
			a: new Coord({
				x: this.playerPosition + (this.playerOrientation == 2 ? 1 : 0),
				y: (this.playerOrientation == 3 ? 1 : 0)
			}),
			b: new Coord({
				x: this.playerPosition + (this.playerOrientation == 0 ? 1 : 0),
				y: (this.playerOrientation == 1 ? 1 : 0)
			}),
		};
	}


	chargeDropper () {

		// Set the orientation back to horiz. or vert., but not backwards or upside-down.
		//	this.playerOrientation %= 2;

		if (this.playerOrientation == 2) {
			this.playerOrientation = 0;
		}

		if (this.playerOrientation == 1) {
			this.playerOrientation = 3;
		}


		var coords = this.getDropperCoordinates();

		var timePerPieceWidths = 50;

		var currentTime = new Date().getTime();

		this.dropperPieceA = this.dropperQueue.consumePieceFromDropperQueue();
		this.dropperPieceB = this.dropperQueue.consumePieceFromDropperQueue();


		// A needs to wait just beside the queue until B is ready.
		this.dropperPieceA.animationQueue.add(new Animation({
			to: new Coord({x: Board.size.x-1, y:0}),
			duration: DropperQueue.dropperQueueTimePerPieceWidth,
			interpolation: "sine",
			startTime: currentTime
		}));

		if (this.playerOrientation && this.playerPosition < Board.size.x-1) {

			// Make A go via B.
			this.dropperPieceA.animationQueue.add(new Animation({
				to: coords.b,
				duration: (Board.size.x - coords.b.x) * timePerPieceWidths,
				interpolation: "sine",
				startTime: currentTime
			}));

			// Make B stop next to A.
			this.dropperPieceB.animationQueue.add(new Animation({
				to: new Coord({x: coords.b.x+1, y:0}),
				duration: (Board.size.x - coords.b.x) * timePerPieceWidths,
				interpolation: "sine",
				startTime: currentTime
			}));
		}

		// Move to final positions.
		this.dropperPieceA.animationQueue.add(new Animation({
			to: coords.a,
			duration: Coord.distance(this.dropperPieceA.animationQueue.getLastTo(), coords.a) * timePerPieceWidths,
			interpolation: "sine",
			startTime: currentTime
		}));
		this.dropperPieceB.animationQueue.add(new Animation({
			to: coords.b,
			duration: Coord.distance(this.dropperPieceB.animationQueue.getLastTo(), coords.b) * timePerPieceWidths,
			interpolation: "sine",
			startTime: currentTime
		}));
	}


	animateDropper (currentTime: number) {

		var coords = this.getDropperCoordinates();

		var timePerPieceWidths = 50;

		this.dropperPieceA.animationQueue.add(new Animation({
			to: coords.a,
			duration: timePerPieceWidths,
			interpolation: "sine",
			startTime: currentTime
		}));
		this.dropperPieceB.animationQueue.add(new Animation({
			to: coords.b,
			duration: timePerPieceWidths,
			interpolation: "sine",
			startTime: currentTime
		}));
	}


	draw (context: CanvasRenderingContext2D, currentTime: number, center: Coord, scale: number, boardSize: Coord) {

		// Draw the dropper pieces.
		this.dropperPieceA.draw(
			context,
			currentTime,
			center,
			scale,
			0,
			boardSize
		);
		this.dropperPieceB.draw(
			context,
			currentTime,
			center,
			scale,
			0,
			boardSize
		);
	}
}
