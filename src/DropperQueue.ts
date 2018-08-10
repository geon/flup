import { easings } from "./Animation";
import { Board } from "./Board";
import { Coord } from "./Coord";
import { PieceCycle } from "./PieceCycle";
import { Piece } from "./Piece";

export class DropperQueue {
	board: Board;
	pieces: Array<Piece>;

	pieceCycle: PieceCycle;
	dropperSide: "left" | "right";

	constructor(
		options: { board: Board; pieceCycle: PieceCycle },
		dropperSide: "left" | "right",
	) {
		this.board = options.board;
		this.pieceCycle = options.pieceCycle;
		this.dropperSide = dropperSide;

		this.pieces = [];
		while (this.pieces.length < DropperQueue.dropperQueueVisibleLength) {
			const piece = this.pieceCycle.pop();

			this.pieces.push(
				this.board.makePiece({
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
			this.board.makePiece({
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
			this.pieces[i].sprite.move({
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
}
