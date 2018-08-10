import { easings } from "./Animation";
import { Board } from "./Board";
import { Coord } from "./Coord";
import { PieceSprite } from "./PieceSprite";
import { PieceCycle } from "./PieceCycle";

export class DropperQueue {
	pieces: Array<PieceSprite>;

	pieceCycle: PieceCycle;
	dropperSide: "left" | "right";

	constructor(
		options: { pieceCycle: PieceCycle },
		dropperSide: "left" | "right",
	) {
		this.pieceCycle = options.pieceCycle;
		this.dropperSide = dropperSide;

		this.pieces = [];
		while (this.pieces.length < DropperQueue.dropperQueueVisibleLength) {
			const piece = this.pieceCycle.pop();

			this.pieces.push(
				new PieceSprite({
					color: piece.color,
					key: piece.key,
					position: new Coord({
						x: this.dropperSide == "left" ? -1 : Board.size.x,
						y: this.pieces.length,
					}),
				}),
			);
		}
	}

	static dropperQueueVisibleLength: number = 18;
	static dropperQueueTimePerPieceWidth: number = 200;

	pop() {
		this.pushSingle(DropperQueue.dropperQueueVisibleLength);
		this.pushSingle(DropperQueue.dropperQueueVisibleLength + 1);

		// 2 new pieces were pushed above, so unshift will never be undefined.
		const a = this.popSingle()!;
		const b = this.popSingle()!;

		return { a, b };
	}

	private pushSingle(startYPos: number) {
		const piece = this.pieceCycle.pop();

		this.pieces.push(
			new PieceSprite({
				color: piece.color,
				key: piece.key,
				position: new Coord({
					x: this.dropperSide == "left" ? -1 : Board.size.x,
					y: startYPos,
				}),
			}),
		);
	}

	private popSingle() {
		const piece = this.pieces.shift();

		for (let i = 0; i < this.pieces.length; i++) {
			this.pieces[i].move({
				to: new Coord({
					x: this.dropperSide == "left" ? -1 : Board.size.x,
					y: i,
				}),
				duration: DropperQueue.dropperQueueTimePerPieceWidth,
				easing: easings.sine,
				delay: i * 5,
			});
		}

		return piece;
	}

	draw(
		context: CanvasRenderingContext2D,
		deltaTime: number,
		center: Coord,
		scale: number,
		boardSize: Coord,
	) {
		// Draw the dropper queue.
		for (const piece of this.pieces) {
			piece.draw(context, deltaTime, center, scale, 0, boardSize);
		}
	}
}
