import { Animation } from "./Animation";
import { Board } from "./Board";
import { Coord } from "./Coord";
import { DropperQueue } from "./DropperQueue";
import { Piece } from "./Piece";

export class Dropper {
	dropperQueue: DropperQueue;

	pieceA: Piece;
	pieceB: Piece;

	position: number;
	orientation: number;

	constructor(dropperQueue: DropperQueue) {
		this.dropperQueue = dropperQueue;

		this.position = Math.floor((Board.size.x - 1) / 2);
		this.orientation = 0;

		this.charge();
	}

	moveLeft() {
		this.position = Math.max(0, this.position - 1);

		this.animate();
	}

	moveRight() {
		this.position = Math.min(
			Board.size.x - (this.orientation % 2 ? 1 : 2),
			this.position + 1,
		);

		this.animate();
	}

	rotate() {
		this.orientation = (this.orientation + 1) % 4;

		this.preventDropperFromStickingOutAfterRotation();

		this.animate();
	}

	private preventDropperFromStickingOutAfterRotation() {
		// If the orientation is horizontal, and the pieces were at the right wall, now making the last one stick out...
		if (!(this.orientation % 2) && this.position >= Board.size.x - 1) {
			// ...move the pair up just against the wall.
			this.position = Board.size.x - 2;
		}
	}

	drop(board: Board) {
		const coords = this.getCoordinates();

		const aPos = Board.coordToIndex(coords.a);
		const bPos = Board.coordToIndex(coords.b);

		// Make sure the board space is not used, and is not outside the Board.
		if (
			board.pieces[aPos] ||
			board.pieces[bPos] ||
			coords.a.x < 0 ||
			coords.a.x > Board.size.x - 1 ||
			coords.b.x < 0 ||
			coords.b.x > Board.size.x - 1
		) {
			return false;
		}

		// Add the pieces.
		board.pieces[aPos] = this.pieceA;
		board.pieces[bPos] = this.pieceB;

		board.applyGameLogic();

		if (!board.gameOver) {
			this.charge();
		}

		return true;
	}

	private getCoordinates() {
		/* Player Orientations:

			ab	a.	ba	b.
			..	b.	..	a.
		*/

		return {
			a: new Coord({
				x: this.position + (this.orientation === 2 ? 1 : 0),
				y: this.orientation === 3 ? 1 : 0,
			}),
			b: new Coord({
				x: this.position + (this.orientation === 0 ? 1 : 0),
				y: this.orientation === 1 ? 1 : 0,
			}),
		};
	}

	private charge() {
		// Set the orientation back to horiz. or vert., but not backwards or upside-down.
		// this.orientation %= 2;

		if (this.orientation === 2) {
			this.orientation = 0;
		}

		if (this.orientation === 1) {
			this.orientation = 3;
		}

		const coords = this.getCoordinates();

		const timePerPieceWidths = 50;

		const pieces = this.dropperQueue.pop();
		if (this.dropperQueue.dropperSide == "left") {
			this.pieceA = pieces.b;
			this.pieceB = pieces.a;
		} else {
			this.pieceA = pieces.a;
			this.pieceB = pieces.b;
		}

		// A needs to wait just beside the queue until B is ready.
		this.pieceA.animationQueue.add(
			new Animation({
				to: new Coord({
					x: this.dropperQueue.dropperSide == "left" ? 0 : Board.size.x - 1,
					y: 0,
				}),
				duration: DropperQueue.dropperQueueTimePerPieceWidth,
				interpolation: "sine",
				delay: 0,
			}),
		);

		const duration =
			this.dropperQueue.dropperSide == "left"
				? (coords.b.x - Board.size.x) * timePerPieceWidths
				: (Board.size.x - coords.b.x) * timePerPieceWidths;
		if (this.orientation && this.position < Board.size.x - 1) {
			// Make A go via B.
			this.pieceA.animationQueue.add(
				new Animation({
					to: coords.b,
					duration,
					interpolation: "sine",
					delay: 0,
				}),
			);

			// Make B stop next to A.
			this.pieceB.animationQueue.add(
				new Animation({
					to: new Coord({ x: coords.b.x + 1, y: 0 }),
					duration,
					interpolation: "sine",
					delay: 0,
				}),
			);
		}

		// Move to final positions.
		this.pieceA.animationQueue.add(
			new Animation({
				to: coords.a,
				duration:
					Coord.distance(this.pieceA.animationQueue.getLastTo(), coords.a) *
					timePerPieceWidths,
				interpolation: "sine",
				delay: 0,
			}),
		);
		this.pieceB.animationQueue.add(
			new Animation({
				to: coords.b,
				duration:
					Coord.distance(this.pieceB.animationQueue.getLastTo(), coords.b) *
					timePerPieceWidths,
				interpolation: "sine",
				delay: 0,
			}),
		);
	}

	private animate() {
		const coords = this.getCoordinates();

		const timePerPieceWidths = 50;

		this.pieceA.animationQueue.add(
			new Animation({
				to: coords.a,
				duration: timePerPieceWidths,
				interpolation: "sine",
				delay: 0,
			}),
		);
		this.pieceB.animationQueue.add(
			new Animation({
				to: coords.b,
				duration: timePerPieceWidths,
				interpolation: "sine",
				delay: 0,
			}),
		);
	}

	draw(
		context: CanvasRenderingContext2D,
		deltaTime: number,
		center: Coord,
		scale: number,
		boardSize: Coord,
	) {
		// Draw the dropper pieces.
		this.pieceA.draw(context, deltaTime, center, scale, 0, boardSize);
		this.pieceB.draw(context, deltaTime, center, scale, 0, boardSize);
	}
}
