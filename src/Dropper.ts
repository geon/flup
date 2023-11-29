import { BoardLogic, ChargeEvent, MoveEvent } from "./BoardLogic";
import { Coord } from "./Coord";
import { DropperQueue } from "./DropperQueue";
import { Piece } from "./Piece";

export interface DropperPose {
	position: number;
	orientation: "horizontal" | "vertical";
}

export interface Drop {
	coord: Coord;
	piece: Piece;
}

export class Dropper {
	dropperQueue: DropperQueue;

	// Initialized by charge().
	pieceA!: Piece;
	pieceB!: Piece;

	pose: DropperPose;

	constructor(dropperQueue: DropperQueue) {
		this.dropperQueue = dropperQueue;

		this.pose = {
			position: Math.floor((BoardLogic.size.x - 1) / 2),
			orientation: "horizontal",
		};
	}

	moveLeft() {
		this.pose.position = Math.max(0, this.pose.position - 1);

		return this.animate();
	}

	moveRight() {
		this.pose.position = Math.min(
			BoardLogic.size.x - (this.pose.orientation == "vertical" ? 1 : 2),
			this.pose.position + 1,
		);

		return this.animate();
	}

	rotate() {
		this.pose.orientation =
			this.pose.orientation == "vertical" ? "horizontal" : "vertical";

		if (this.pose.orientation == "horizontal") {
			const temp = this.pieceA;
			this.pieceA = this.pieceB;
			this.pieceB = temp;
		}

		this.preventDropperFromStickingOutAfterRotation();

		return this.animate();
	}

	private preventDropperFromStickingOutAfterRotation() {
		// If the orientation is horizontal, and the pieces were at the right wall, now making the last one stick out...
		if (
			this.pose.orientation == "horizontal" &&
			this.pose.position >= BoardLogic.size.x - 1
		) {
			// ...move the pair up just against the wall.
			this.pose.position = BoardLogic.size.x - 2;
		}
	}

	getDrops(): [Drop, Drop] {
		const coords = this.getCoordinates();

		return [
			{ coord: coords.a, piece: this.pieceA },
			{ coord: coords.b, piece: this.pieceB },
		];
	}

	private getCoordinates() {
		return {
			a: new Coord({
				x: this.pose.position,
				y: 0,
			}),
			b: new Coord({
				x:
					this.pose.position + (this.pose.orientation === "horizontal" ? 1 : 0),
				y: this.pose.orientation === "vertical" ? 1 : 0,
			}),
		};
	}

	charge(): ChargeEvent {
		const coords = this.getCoordinates();

		const pieces = this.dropperQueue.pop();
		if (
			this.dropperQueue.dropperSide == "left" &&
			this.pose.orientation == "horizontal"
		) {
			this.pieceA = pieces.b;
			this.pieceB = pieces.a;
		} else {
			this.pieceA = pieces.a;
			this.pieceB = pieces.b;
		}

		return {
			type: "charge",
			a: { sprite: this.pieceA.sprite, to: coords.a },
			b: { sprite: this.pieceB.sprite, to: coords.b },
			queueMovements: pieces.queueMovements,
		};
	}

	private animate(): MoveEvent {
		const coords = this.getCoordinates();

		return {
			type: "move",
			movements: [
				{
					sprite: this.pieceA.sprite,
					to: coords.a,
				},
				{
					sprite: this.pieceB.sprite,
					to: coords.b,
				},
			],
		};
	}
}
