import { BoardLogic } from "./BoardLogic";
import { Coord } from "./Coord";
import { DropperQueue } from "./DropperQueue";
import { Piece } from "./Piece";
import { easings } from "./Animation";

export class Dropper {
	dropperQueue: DropperQueue;

	pieceA: Piece;
	pieceB: Piece;

	position: number;
	orientation: number;

	constructor(dropperQueue: DropperQueue) {
		this.dropperQueue = dropperQueue;

		this.position = Math.floor((BoardLogic.size.x - 1) / 2);
		this.orientation = 0;

		const { a, b } = this.dropperQueue.pop();
		this.pieceA = a;
		this.pieceB = b;

		this.charge();
	}

	moveLeft() {
		this.position = Math.max(0, this.position - 1);

		this.animate();
	}

	moveRight() {
		this.position = Math.min(
			BoardLogic.size.x - (this.orientation % 2 ? 1 : 2),
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
		if (!(this.orientation % 2) && this.position >= BoardLogic.size.x - 1) {
			// ...move the pair up just against the wall.
			this.position = BoardLogic.size.x - 2;
		}
	}

	getDrops() {
		const coords = this.getCoordinates();

		return [
			{ coord: coords.a, piece: this.pieceA },
			{ coord: coords.b, piece: this.pieceB },
		];
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

	charge() {
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
		this.pieceA.sprite.move({
			to: new Coord({
				x: this.dropperQueue.dropperSide == "left" ? 0 : BoardLogic.size.x - 1,
				y: 0,
			}),
			duration: DropperQueue.dropperQueueTimePerPieceWidth,
			easing: easings.sine,
			delay: 0,
		});

		const duration =
			this.dropperQueue.dropperSide == "left"
				? (coords.b.x - BoardLogic.size.x) * timePerPieceWidths
				: (BoardLogic.size.x - coords.b.x) * timePerPieceWidths;
		if (this.orientation && this.position < BoardLogic.size.x - 1) {
			// Make A go via B.
			this.pieceA.sprite.move({
				to: coords.b,
				duration,
				easing: easings.sine,
				delay: 0,
			});

			// Make B stop next to A.
			this.pieceB.sprite.move({
				to: new Coord({ x: coords.b.x + 1, y: 0 }),
				duration,
				easing: easings.sine,
				delay: 0,
			});
		}

		// Move to final positions.
		this.pieceA.sprite.move({
			to: coords.a,
			// TODO: Fix syncing.
			duration: 1000, // Coord.distance(this.pieceA.animationQueue.getLastTo(), coords.a) * timePerPieceWidths,
			easing: easings.sine,
			delay: 0,
		});

		this.pieceB.sprite.move({
			to: coords.b,
			// TODO: Fix syncing.
			duration: 1000, // Coord.distance(this.pieceB.animationQueue.getLastTo(), coords.b) * timePerPieceWidths,
			easing: easings.sine,
			delay: 0,
		});
	}

	private animate() {
		const coords = this.getCoordinates();

		const timePerPieceWidths = 50;

		this.pieceA.sprite.move({
			to: coords.a,
			duration: timePerPieceWidths,
			easing: easings.sine,
			delay: 0,
		});
		this.pieceB.sprite.move({
			to: coords.b,
			duration: timePerPieceWidths,
			easing: easings.sine,
			delay: 0,
		});
	}
}
