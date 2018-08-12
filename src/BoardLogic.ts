import { Coord } from "./Coord";
import { Dropper } from "./Dropper";
import { DropperQueue } from "./DropperQueue";
import { Piece } from "./Piece";
import { PieceSprite } from "./PieceSprite";
import { PieceCycle } from "./PieceCycle";

interface Movement {
	sprite: PieceSprite;
	to: Coord;
}

export class BoardLogic {
	pieces: Array<Piece | undefined>;

	pieceCycle: PieceCycle;
	dropperQueue: DropperQueue;

	dropper: Dropper;

	constructor(options: { pieceCycle: PieceCycle; dropperQueue: DropperQueue }) {
		this.pieces = [];

		this.pieceCycle = options.pieceCycle;
		this.dropperQueue = options.dropperQueue;
		this.dropper = new Dropper(this.dropperQueue);
	}

	static size: Coord = new Coord({ x: 8, y: 18 });

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

	moveLeft() {
		this.dropper.moveLeft();
	}

	moveRight() {
		this.dropper.moveRight();
	}

	rotate() {
		this.dropper.rotate();
	}

	drop() {
		const drops = this.dropper.getDrops();

		// Make sure the board space is not used.
		if (
			drops.some(drop => !!this.pieces[BoardLogic.coordToIndex(drop.coord)])
		) {
		}

		for (const drop of drops) {
			// Add the pieces.
			this.pieces[BoardLogic.coordToIndex(drop.coord)] = drop.piece;
		}

		this.dropper.charge();
	}

	makePiecesFall(): ReadonlyArray<ReadonlyArray<Movement>> {
		const movements: Array<Array<Movement>> = [];
		let columnMovements: Array<Movement> = [];

		// For each collumn.
		for (let x = 0; x < BoardLogic.size.x; ++x) {
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

					columnMovements = [];
					movements.push(columnMovements);

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

	unlockChains(): Array<Piece> {
		return this.pieces
			.map((_piece, position) => position)
			.filter(position => {
				const piece = this.pieces[position];
				return (
					piece &&
					piece.key &&
					this.matchingNeighborsOfPosition(position).length
				);
			})
			.map(position => this.unLockChainRecursively(position))
			.reduce((soFar, current) => [...soFar, ...current], [] as Array<Piece>);
	}

	unLockChainRecursively(position: number): Array<Piece> {
		// Must search for neighbors before removing the piece matching against.
		const matchingNeighborPositions = this.matchingNeighborsOfPosition(
			position,
		);

		const unlockedPiece = this.pieces[position];
		this.pieces[position] = undefined;

		// Another branch of the chain might have reached here before.
		if (!unlockedPiece) {
			return [];
		}

		// For all matching neighbors, recurse.
		const unlockedChainsFromNeighbors = matchingNeighborPositions.map(
			neighborPosition => this.unLockChainRecursively(neighborPosition),
		);

		return [
			unlockedPiece,
			...unlockedChainsFromNeighbors.reduce(
				(soFar, current) => [...soFar, ...current],
				[] as Array<Piece>,
			),
		];
	}

	matchingNeighborsOfPosition(position: number) {
		const piece = this.pieces[position];

		if (!piece) {
			return [];
		}

		const neighborPositions = [];

		const coord = BoardLogic.indexToCoord(position);

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

		const matchingNeighborPositions = [];
		const color = piece.color;
		for (let i = neighborPositions.length - 1; i >= 0; i--) {
			const neighborPosition = neighborPositions[i];
			const neighborPiece = this.pieces[neighborPosition];

			if (neighborPiece && neighborPiece.color === color) {
				matchingNeighborPositions.push(neighborPosition);
			}
		}

		return matchingNeighborPositions;
	}

	checkForGameOver() {
		// Check if there are any pieces sticking up into the top 2 rows of the board.
		return this.pieces.slice(0, BoardLogic.size.x * 2).some(piece => !!piece);
	}

	punishLogic(row: ReadonlyArray<Piece>): ReadonlyArray<Movement> {
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
