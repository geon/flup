import { Board } from "./Board";
import { Coord } from "./Coord";
import { PieceCycle } from "./PieceCycle";
import { Piece } from "./Piece";
import { BoardLogic, Movement } from "./BoardLogic";

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
						x: this.dropperSide == "left" ? -1 : BoardLogic.size.x,
						y: this.pieces.length,
					}),
				}),
			);
		}
	}

	static dropperQueueVisibleLength: number = BoardLogic.size.y;
	static dropperQueueTimePerPieceWidth: number = 200;

	pop() {
		this.pushSingle(DropperQueue.dropperQueueVisibleLength);
		this.pushSingle(DropperQueue.dropperQueueVisibleLength + 1);

		// 2 new pieces were pushed above, so unshift will never be undefined.
		const a = this.pieces.shift()!;
		const b = this.pieces.shift()!;

		const queueMovements = this.pieces.map(
			(piece, i): Movement => ({
				sprite: piece.sprite,
				to: new Coord({
					x: this.dropperSide == "left" ? -1 : BoardLogic.size.x,
					y: i,
				}),
			}),
		);

		return {
			a,
			b,
			queueMovements,
		};
	}

	private pushSingle(startYPos: number) {
		const piece = this.pieceCycle.pop();

		this.pieces.push(
			this.board.makePiece({
				color: piece.color,
				key: piece.key,
				position: new Coord({
					x: this.dropperSide == "left" ? -1 : BoardLogic.size.x,
					y: startYPos,
				}),
			}),
		);
	}
}
