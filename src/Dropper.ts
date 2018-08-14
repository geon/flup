import { BoardLogic } from "./BoardLogic";
import { Coord } from "./Coord";
import { DropperQueue } from "./DropperQueue";
import { Piece } from "./Piece";
import { easings } from "./Animation";

export class Dropper {
	dropperQueue: DropperQueue;

	// Initialized by charge().
	pieceA!: Piece;
	pieceB!: Piece;

	position: number;
	orientation: "horizontal" | "vertical";

	constructor(dropperQueue: DropperQueue) {
		this.dropperQueue = dropperQueue;

		this.position = Math.floor((BoardLogic.size.x - 1) / 2);
		this.orientation = "horizontal";

		this.charge();
	}

	moveLeft() {
		this.position = Math.max(0, this.position - 1);

		this.animate();
	}

	moveRight() {
		this.position = Math.min(
			BoardLogic.size.x - (this.orientation == "vertical" ? 1 : 2),
			this.position + 1,
		);

		this.animate();
	}

	rotate() {
		this.orientation =
			this.orientation == "vertical" ? "horizontal" : "vertical";

		if (this.orientation == "horizontal") {
			const temp = this.pieceA;
			this.pieceA = this.pieceB;
			this.pieceB = temp;
		}

		this.preventDropperFromStickingOutAfterRotation();

		this.animate();
	}

	private preventDropperFromStickingOutAfterRotation() {
		// If the orientation is horizontal, and the pieces were at the right wall, now making the last one stick out...
		if (this.orientation == "horizontal" && this.position >= BoardLogic.size.x - 1) {
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
		return {
			a: new Coord({
				x: this.position,
				y: 0,
			}),
			b: new Coord({
				x: this.position + (this.orientation === "horizontal" ? 1 : 0),
				y: this.orientation === "vertical" ? 1 : 0,
			}),
		};
	}

	charge() {
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
