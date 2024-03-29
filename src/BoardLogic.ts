import { Coord } from "./Coord";
import { Drop } from "./Dropper";
import { Piece } from "./Piece";
import { PieceSprite } from "./PieceSprite";

export interface Movement {
	sprite: PieceSprite;
	to: Coord;
}

interface Unlocking {
	sprite: PieceSprite;
	depth: number;
	color: number;
}

export interface ChargePieceMovement {
	sprite: PieceSprite;
	to: Coord;
}

export interface ChargeEvent {
	type: "charge";
	a: ChargePieceMovement;
	b: ChargePieceMovement;
	queueMovements: ReadonlyArray<Movement>;
}

export interface MoveEvent {
	type: "move";
	movements: ReadonlyArray<Movement>;
}

interface FallEvent {
	type: "fall";
	movements: ReadonlyArray<ReadonlyArray<Movement>>;
}

interface UnlockingEvent {
	type: "unlocking";
	unlockings: ReadonlyArray<Unlocking>;
}

export interface PunishEvent {
	type: "punish";
	movements: ReadonlyArray<ReadonlyArray<Movement>>;
}

export type Event =
	| PunishEvent
	| ChargeEvent
	| MoveEvent
	| FallEvent
	| UnlockingEvent;

export class BoardLogic {
	pieces: Array<Piece | undefined>;

	constructor() {
		this.pieces = [];
	}

	static size: Coord = new Coord({ x: 8, y: 14 });

	static xyToIndex(x: number, y: number) {
		return x + y * BoardLogic.size.x;
	}

	static coordToIndex(coord: Coord) {
		return BoardLogic.xyToIndex(coord.x, coord.y);
	}

	static indexToCoord(index: number) {
		return new Coord({
			x: index % BoardLogic.size.x,
			y: Math.floor(index / BoardLogic.size.x),
		});
	}

	static getWidth() {
		return (BoardLogic.size.x + 2) * PieceSprite.size;
	}

	static getHeight() {
		return (BoardLogic.size.y + 2) * PieceSprite.size;
	}

	drop(drops: readonly [Drop, Drop]): ReadonlyArray<Event> {
		// Make sure the positions are not used.
		if (
			drops.some((drop) => !!this.pieces[BoardLogic.coordToIndex(drop.coord)])
		) {
			return [];
		}

		// Add the pieces.
		for (const drop of drops) {
			this.pieces[BoardLogic.coordToIndex(drop.coord)] = drop.piece;
		}

		const events: Array<Event> = [];

		// Do all falling and unlocking.
		for (;;) {
			events.push({ type: "fall", movements: this.makePiecesFall() });

			const unlockings = this.unlockChains();

			if (!unlockings.length) {
				break;
			}

			events.push({ type: "unlocking", unlockings });
		}

		return events;
	}

	makePiecesFall(): ReadonlyArray<ReadonlyArray<Movement>> {
		const movements: Array<Array<Movement>> = [];

		// For each collumn.
		for (let x = 0; x < BoardLogic.size.x; ++x) {
			const columnMovements: Array<Movement> = [];
			movements.push(columnMovements);

			// Start at the bottom.
			let yPut = BoardLogic.size.y - 1;

			// Search for a space that can be filled from above.
			while (yPut && this.pieces[BoardLogic.xyToIndex(x, yPut)]) {
				--yPut;
			}

			let yGet = yPut - 1;

			// For the whole collumn...
			collumnLoop: while (yGet >= 0) {
				// Search for a piece to put in the empty space.
				while (!this.pieces[BoardLogic.xyToIndex(x, yGet)]) {
					--yGet;
					if (yGet < 0) {
						break collumnLoop;
					}
				}

				const getPos = BoardLogic.xyToIndex(x, yGet);
				const putPos = BoardLogic.xyToIndex(x, yPut);

				// Move the piece.
				this.pieces[putPos] = this.pieces[getPos];
				this.pieces[getPos] = undefined;
				const piece = this.pieces[putPos]!;

				// Record moves.
				columnMovements.push({
					sprite: piece.sprite,
					to: BoardLogic.indexToCoord(putPos),
				});

				// Raise the put/put-positions.
				--yGet;
				--yPut;
			}
		}

		return movements;
	}

	unlockChains(): Array<Unlocking> {
		const unlockings: Array<Unlocking> = [];

		// Removes the piece and saves the unlocking.
		const unlockPosition = (position: number, depth: number) => {
			const piece = this.pieces[position];
			this.pieces[position] = undefined;

			if (piece) {
				unlockings.push({
					sprite: piece.sprite,
					depth,
					color: piece.color,
				});
			}
		};

		for (const [position, piece] of this.pieces.entries()) {
			// Search for keys.
			if (!(piece && piece.key)) {
				continue;
			}

			const isUnlockable = (neighborPosition: number) => {
				const neighborPiece = this.pieces[neighborPosition];
				return (
					!!neighborPiece &&
					neighborPiece.color == piece.color &&
					!neighborPiece.key
				);
			};

			// If the key is touching any other piece of the same color, there is a chain.
			const foundChain = this.neighborsOfPosition(position).some(isUnlockable);

			if (foundChain) {
				// Unlock it.

				// Breadth-first search.

				// Start at the key.
				let queue = [position];
				let depth = 0;
				while (queue.length) {
					// Unlock everything at the wave-front.
					for (const neighborPosition of queue) {
						unlockPosition(neighborPosition, depth);
					}
					++depth;

					// Find everything of the same color, that touched the recently unlocked pieces.
					queue = queue
						.map((p) => this.neighborsOfPosition(p))
						.reduce(
							(soFar, current) => [...soFar, ...current],
							[] as Array<number>,
						)
						.filter(isUnlockable);
				}
			}
		}

		return unlockings;
	}

	neighborsOfPosition(position: number) {
		const coord = BoardLogic.indexToCoord(position);

		const neighborPositions = [];

		// Right
		if (coord.x < BoardLogic.size.x - 1) {
			neighborPositions.push(position + 1);
		}

		// Left
		if (coord.x > 0) {
			neighborPositions.push(position - 1);
		}

		// Down
		if (coord.y < BoardLogic.size.y - 1) {
			neighborPositions.push(position + BoardLogic.size.x);
		}

		// Up
		if (coord.y > 0) {
			neighborPositions.push(position - BoardLogic.size.x);
		}

		return neighborPositions;
	}

	checkForGameOver() {
		// Check if there are any pieces sticking up into the top 2 rows of the board.
		return this.pieces.slice(0, BoardLogic.size.x * 2).some((piece) => !!piece);
	}

	punishLogic(row: ReadonlyArray<Piece>): ReadonlyArray<Movement> {
		if (this.checkForGameOver()) {
			// Alternatively, remove the top row of pieces, so the board doesn't overflow.
			return [];
		}

		// TODO: Generate the row and add the pieces inside here as well.

		const movements: Array<Movement> = [];

		// Make room. Move everything 1 step up.
		for (let y = 0; y < BoardLogic.size.y - 1; y++) {
			for (let x = 0; x < BoardLogic.size.x; x++) {
				const from = BoardLogic.xyToIndex(x, y + 1);
				const to = BoardLogic.xyToIndex(x, y);

				const movedPiece = this.pieces[from];
				this.pieces[to] = movedPiece;

				if (movedPiece) {
					movements.push({
						to: BoardLogic.indexToCoord(to),
						sprite: movedPiece.sprite,
					});
				}
			}
		}

		// Add a row of pieces at the bottom.
		row.forEach((piece, x) => {
			const to = BoardLogic.xyToIndex(x, BoardLogic.size.y - 1);
			this.pieces[to] = piece;
			movements.push({
				to: BoardLogic.indexToCoord(to),
				sprite: piece.sprite,
			});
		});

		return movements;
	}
}
