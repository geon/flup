import { waitMs } from "./Animation";
import { BoardLogic } from "./BoardLogic";
import { Coord } from "./Coord";
import { DropperPose } from "./Dropper";
import { Piece } from "./Piece";
import { Player } from "./Player";

export class UnlockBot extends Player {
	*makeCoroutine(): Generator<void, void, number> {
		for (;;) {
			// Simulate thinking time.
			yield* waitMs(500);

			const dropper = this.board.dropper;
			var { pose: matchingPose, swap } = this.findMatchingDrop(
				dropper.getDrops().map((x) => x.piece) as any,
			);

			let move: (() => void) | undefined;
			for (;;) {
				move = this.nextMoveToGetToPose(dropper.pose, matchingPose, swap);
				swap = false;

				if (!move) {
					break;
				}

				// Simulate slow fingers.
				yield* waitMs(150);

				move();
			}

			// Simulate hesitation.
			yield* waitMs(200);
			this.board.drop();
		}
	}

	nextMoveToGetToPose(
		from: DropperPose,
		to: DropperPose,
		swap: boolean,
	): (() => void) | undefined {
		const dropper = this.board.dropper;
		const dropColors: [number, number] = [
			dropper.pieceA.color,
			dropper.pieceB.color,
		];

		if (from.orientation != to.orientation) {
			return () => this.board.rotate();
		}
		if (swap !== dropColors[0] < dropColors[1]) {
			return () => this.board.rotate();
		}
		if (from.position < to.position) {
			return () => this.board.moveRight();
		}
		if (from.position > to.position) {
			return () => this.board.moveLeft();
		}
		return undefined;
	}

	findMatchingDrop(pieces: [Piece, Piece]): {
		pose: DropperPose;
		swap: boolean;
	} {
		const poses: Array<DropperPose> = [];
		for (const orientation of ["horizontal", "vertical"] as const) {
			for (
				let position = 0;
				position < BoardLogic.size.x - (orientation === "horizontal" ? 1 : 0);
				++position
			) {
				poses.push({
					position,
					orientation,
				});
			}
		}

		const moves = poses.flatMap((pose) => [
			{ pose, swap: true },
			{ pose, swap: false },
		]);
		const bestMove = maxBy(moves, (move) =>
			evaluatePose(this.board.boardLogic, pieces, move),
		);

		return bestMove;
	}
}

function evaluatePose(
	board: BoardLogic,
	pieces: readonly [Piece, Piece],
	move: { pose: DropperPose; swap: boolean },
) {
	const boardCopy = new BoardLogic();
	boardCopy.pieces = [...board.pieces];

	if (move.swap) {
		pieces = [pieces[1], pieces[0]];
	}

	boardCopy.drop([
		{ coord: new Coord({ x: move.pose.position, y: 0 }), piece: pieces[0] },
		{
			coord: new Coord(
				move.pose.orientation === "horizontal"
					? { x: move.pose.position + 1, y: 0 }
					: { x: move.pose.position, y: 1 },
			),
			piece: pieces[1],
		},
	]);

	const chainCount = boardCopy.unlockChains().length;
	const punishCount = Math.max(0, chainCount - 1);

	const firstPieceIndex = boardCopy.pieces.findIndex((x) => x);

	const score = firstPieceIndex + punishCount * 10;

	console.log(firstPieceIndex, punishCount, score);

	return score;
}

function maxBy<T>(
	array: ReadonlyArray<T>,
	selector: (element: T) => number,
): T {
	let maxElement = array[0];
	let maxValue = -Infinity;
	for (const element of array) {
		const value = selector(element);

		if (value > maxValue) {
			maxValue = value;
			maxElement = element;
		}
	}
	return maxElement;
}
