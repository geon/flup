import { waitMs } from "./Animation";
import { DropperPose, Dropper } from "./Dropper";
import { Player } from "./Player";

export class OcdBot extends Player {
	*makeCoroutine(): Generator<void, void, number> {
		for (;;) {
			// Simulate thinking time.
			yield* waitMs(500);

			const dropper = this.board.boardLogic.dropper;
			const { matchingPose, ascending } = findMatchingDrop(dropper);

			let move: (() => void) | undefined;
			for (;;) {
				move = this.nextMoveToGetToPose(dropper.pose, matchingPose, ascending);

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
		ascending: boolean,
	): (() => void) | undefined {
		const dropper = this.board.boardLogic.dropper;
		const dropColors: [number, number] = [
			dropper.pieceA.color,
			dropper.pieceB.color,
		];

		if (from.orientation != to.orientation) {
			return () => this.board.rotate();
		}
		if (ascending !== dropColors[0] < dropColors[1]) {
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
}

function findMatchingDrop(dropper: Dropper): {
	matchingPose: DropperPose;
	ascending: boolean;
} {
	// This table has neighbours of allnumber, number]possible combinations, and still fits within the width of the board.
	const colorTable = [0, 1, 2, 3, 1, 3, 0, 2];

	const dropColors: [number, number] = [
		dropper.pieceA.color,
		dropper.pieceB.color,
	];

	if (dropColors[0] === dropColors[1]) {
		for (let position = 0; position < colorTable.length; ++position) {
			if (colorTable[position] === dropColors[0]) {
				return {
					matchingPose: { position, orientation: "vertical" },
					ascending: false,
				};
			}
		}
	}

	for (let position = 0; position < colorTable.length - 1; ++position) {
		if (
			colorTable[position] === dropColors[0] &&
			colorTable[position + 1] === dropColors[1]
		) {
			return {
				matchingPose: { position, orientation: "horizontal" },
				ascending: dropColors[0] < dropColors[1],
			};
		}
	}

	dropColors.reverse();

	let position = 0;
	for (; position < colorTable.length - 1; ++position) {
		if (
			colorTable[position] === dropColors[0] &&
			colorTable[position + 1] === dropColors[1]
		) {
			break;
		}
	}
	return {
		matchingPose: { position, orientation: "horizontal" },
		ascending: dropColors[0] < dropColors[1],
	};
}
