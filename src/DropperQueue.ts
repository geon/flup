import { Animation } from "./Animation";
import { AnimationQueue } from "./AnimationQueue";
import { Board } from "./Board";
import { Coord } from "./Coord";
import { Piece } from "./Piece";
import { PieceCycle } from "./PieceCycle";

export class DropperQueue {
	pieces: Array<Piece>;

	pieceCycle: PieceCycle;

	constructor(options: { pieceCycle: PieceCycle }) {
		this.pieceCycle = options.pieceCycle;

		this.pieces = [];
		while (this.pieces.length < DropperQueue.dropperQueueVisibleLength) {
			const piece = this.pieceCycle.pop();

			this.pieces.push(
				new Piece({
					color: piece.color,
					key: piece.key,
					animationQueue: new AnimationQueue(
						new Coord({
							x: Board.size.x,
							y: this.pieces.length,
						}),
					),
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
			new Piece({
				color: piece.color,
				key: piece.key,
				animationQueue: new AnimationQueue(
					new Coord({
						x: Board.size.x,
						y: startYPos,
					}),
				),
			}),
		);
	}

	private popSingle() {
		const piece = this.pieces.shift();

		for (let i = 0; i < this.pieces.length; i++) {
			this.pieces[i].animationQueue.add(
				new Animation({
					to: new Coord({ x: Board.size.x, y: i }),
					duration: DropperQueue.dropperQueueTimePerPieceWidth,
					interpolation: "sine",
					delay: i * 5,
				}),
			);
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
