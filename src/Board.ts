import { Coord } from "./Coord";
import { UnlockingEffect } from "./UnlockingEffect";
import { GameMode } from "./GameMode";
import { DropperQueue } from "./DropperQueue";
import { Dropper } from "./Dropper";
import { Piece } from "./Piece";
import { PieceCycle } from "./PieceCycle";
import { Animation } from "./Animation";
import { Avatar } from "./Avatar";
import { App } from "./App";

export class Board {
	gameMode: GameMode;

	pieces: Array<Piece | undefined>;
	unlockedPieces: Piece[];
	unlockingEffects: UnlockingEffect[];
	pieceCycle: PieceCycle;
	dropperQueue: DropperQueue;

	dropper: Dropper;

	gameOver: boolean;

	slateRandomExp: number;

	constructor(options: { gameMode: GameMode; pieceCycle: PieceCycle }) {
		this.gameMode = options.gameMode;

		this.pieces = [];
		this.unlockedPieces = [];
		this.unlockingEffects = [];
		this.pieceCycle = options.pieceCycle;
		this.dropperQueue = new DropperQueue({ pieceCycle: this.pieceCycle });
		this.dropper = new Dropper(this.dropperQueue);
		this.gameOver = false;
		this.slateRandomExp = 2 + Math.random();

		// var colors = [
		// 	undefined, undefined, {color: 1}, undefined, undefined, undefined, undefined, undefined,
		// 	undefined, undefined, {color: 0}, undefined, undefined, undefined, undefined, undefined
		// ];
		// for (var i = colors.length - 1; i >= 0; i--) {
		// 	if (colors[i])
		// 		this.pieces[i] = new Piece(colors[i]);
		// };
		// this.makePiecesFall(0);
		// options.pieceCycle[0] = new Piece({color: 0, key:true});
		// options.pieceCycle[1] = new Piece({color: 0, key:false});
	}

	static size: Coord = new Coord({ x: 8, y: 18 });

	static gameOverUnlockEffectDelayPerPieceWidth: number = 100;

	static xyToIndex(x: number, y: number) {
		return x + y * Board.size.x;
	}

	static coordToIndex(coord: Coord) {
		return Board.xyToIndex(coord.x, coord.y);
	}

	static indexToCoord(index: number) {
		return new Coord({
			x: index % Board.size.x,
			y: Math.floor(index / Board.size.x),
		});
	}

	static getWidth() {
		return (Board.size.x + 2) * Piece.size;
	}

	static getHeight() {
		return (Board.size.y + 2) * Piece.size;
	}

	applyGameLogic() {
		this.makePiecesFall(0);
		this.unlockChains();
		this.checkForGameOver();
	}

	makePiecesFall(delay: number) {
		/*

		This might seem like an awful lot of code for something as simple as
		making the pieces fall.

		Turns out it isn't that simple...

		I need to set the animation properly so it is initiated only when a
		piece *starts* falling. That makes it tricky to do it in multiple
		passes. I also want a slight delay in the animation for each
		consecutive piece in a falling block. That means I need to keep track
		of wether the line of pieces is broken.

		If you have a better solution, I'm happy to see it.

		*/

		// For each collumn.
		for (var x = 0; x < Board.size.x; ++x) {
			// Start at the bottom.
			var yPut = Board.size.y - 1;

			// Search for a space that can be filled from above.
			while (yPut && this.pieces[Board.xyToIndex(x, yPut)]) {
				--yPut;
			}

			var yGet = yPut - 1;

			var numConsecutive = 0;

			// For the whole collumn...
			collumnLoop: while (yGet >= 0) {
				// Search for a piece to put in the empty space.
				while (!this.pieces[Board.xyToIndex(x, yGet)]) {
					--yGet;

					numConsecutive = 0;

					if (yGet < 0) {
						break collumnLoop;
					}
				}

				var getPos = Board.xyToIndex(x, yGet);
				var putPos = Board.xyToIndex(x, yPut);

				// Move the piece.
				this.pieces[putPos] = this.pieces[getPos];
				this.pieces[getPos] = undefined;
				const piece = this.pieces[putPos]!;

				// Animate it.
				var timePerPieceHeight = 100;
				piece.animationQueue.add(
					new Animation({
						to: new Coord({ x: x, y: yPut }),
						delay: delay + numConsecutive * 50 - piece.animationQueue.length(),
						duration: Math.sqrt(yPut - yGet) * timePerPieceHeight,
						interpolation: "easeInQuad",
					}),
				);
				++numConsecutive;

				// Raise the put/put-positions.
				--yGet;
				--yPut;
			}
		}
	}

	unlockChains() {
		var foundChains = false;
		var maxUnlockEffectDuration = 0;
		for (var i = this.pieces.length - 1; i >= 0; i--) {
			const piece = this.pieces[i];

			// Look for keys.
			if (piece && piece.key) {
				var matchingNeighborPositions = this.matchingNeighborsOfPosition(i);

				// If there is at least one pair in the chain...
				if (matchingNeighborPositions.length) {
					foundChains = true;

					// As soon as everything has stopped falling...
					var unlockEffectDelay = this.maxAnimationLength();

					// ...Start the unlocking effect.
					var unlockEffectDuration = this.unLockChainRecursively(
						i,
						unlockEffectDelay,
					);

					maxUnlockEffectDuration = Math.max(
						maxUnlockEffectDuration,
						unlockEffectDuration,
					);
				}
			}
		}

		if (foundChains) {
			// Fill up the gaps left by the chains, right after the unlocking effect is finished.
			this.makePiecesFall(this.maxAnimationLength() + maxUnlockEffectDuration);

			// New chains might have formed.
			this.unlockChains();

			// The player scored, so punish opponents.
			this.gameMode.onUnlockedChains(this);
		}
	}

	maxAnimationLength() {
		// Must also check the unlocked pieces waiting for the unlocking effect.
		var allPieces = this.pieces
			.concat(this.unlockedPieces)
			.filter(x => !!x)
			.map(x => x!);

		return allPieces
			.map(piece => piece && piece.animationQueue.length())
			.reduce((soFar, next) => {
				return next ? Math.max(soFar, next) : soFar;
			}, 0);
	}

	unLockChainRecursively(position: number, unlockEffectDelay: number) {
		// Must search for neighbors before removing the piece matching against.
		var matchingNeighborPositions = this.matchingNeighborsOfPosition(position);

		var unlockedPiece = this.pieces[position];

		// Another branch of the chain might have reached here before.
		if (!unlockedPiece) {
			return 0;
		}

		// Move the piece from the play field to the queue of pieces waiting for the unlocking effect.
		unlockedPiece.unlockEffectDelay = unlockEffectDelay;
		this.unlockedPieces.push(unlockedPiece);
		this.pieces[position] = undefined;

		// For all matching neighbors...
		var interUnlockEffectDelay = 25;
		var longestChainDuration = 0;
		for (var i = matchingNeighborPositions.length - 1; i >= 0; i--) {
			// Recurse.
			var chainDuration = this.unLockChainRecursively(
				matchingNeighborPositions[i],
				unlockEffectDelay + interUnlockEffectDelay,
			);

			longestChainDuration = Math.max(longestChainDuration, chainDuration);
		}

		return interUnlockEffectDelay + longestChainDuration;
	}

	matchingNeighborsOfPosition(position: number) {
		const piece = this.pieces[position];

		if (!piece) {
			return [];
		}

		var neighborPositions = [];

		var coord = Board.indexToCoord(position);

		// Right
		if (coord.x < Board.size.x - 1) {
			neighborPositions.push(position + 1);
		}

		// Left
		if (coord.x > 0) {
			neighborPositions.push(position - 1);
		}

		// Down
		if (coord.y < Board.size.y - 1) {
			neighborPositions.push(position + Board.size.x);
		}

		// Up
		if (coord.y > 0) {
			neighborPositions.push(position - Board.size.x);
		}

		var matchingNeighborPositions = [];
		var color = piece.color;
		for (var i = neighborPositions.length - 1; i >= 0; i--) {
			var neighborPosition = neighborPositions[i];
			const neighborPiece = this.pieces[neighborPosition];

			if (neighborPiece && neighborPiece.color == color) {
				matchingNeighborPositions.push(neighborPosition);
			}
		}

		return matchingNeighborPositions;
	}

	checkForGameOver() {
		for (var i = 0; i < Board.size.x * 2; i++) {
			if (this.pieces[i]) {
				this.gameOver = true;

				this.startGameOverEffect();

				break;
			}
		}

		return false;
	}

	startGameOverEffect() {
		var gameOverEffectDelay = this.maxAnimationLength();

		// Unlock all pieces, from the center and out.
		for (var i = 0; i < this.pieces.length; i++) {
			var unlockedPiece = this.pieces[i];
			if (unlockedPiece) {
				unlockedPiece.unlockEffectDelay =
					gameOverEffectDelay +
					Coord.distance(Board.indexToCoord(i), Coord.scale(Board.size, 0.5)) *
						Board.gameOverUnlockEffectDelayPerPieceWidth;
				this.unlockedPieces.push(unlockedPiece);
				this.pieces[i] = undefined;
			}
		}
	}

	punish(avatar: Avatar) {
		var punishmentAnimationDelay = this.maxAnimationLength();

		// Make room.
		for (var y = 0; y < Board.size.y - 1; y++) {
			for (var x = 0; x < Board.size.x; x++) {
				this.pieces[Board.xyToIndex(x, y)] = this.pieces[
					Board.xyToIndex(x, y + 1)
				];
			}
		}

		// Add pieces.
		var row = avatar.getPunishRow(
			Board.size.x,
			Board.size.y, // Start the animation just outside the Board.
		);
		for (var x = 0; x < row.length; x++) {
			this.pieces[Board.xyToIndex(x, Board.size.y - 1)] = row[x];
		}

		// Animate.
		for (var i = 0; i < this.pieces.length; i++) {
			const piece = this.pieces[i];
			if (piece) {
				piece.animationQueue.add(
					new Animation({
						to: Board.indexToCoord(i),
						duration: DropperQueue.dropperQueueTimePerPieceWidth,
						interpolation: "sine",
						delay: punishmentAnimationDelay,
					}),
				);
			}
		}

		// New chains might thave formed.
		this.unlockChains();

		// The pieces might have risen too high.
		this.checkForGameOver();
	}

	draw(
		context: CanvasRenderingContext2D,
		deltaTime: number,
		center: Coord,
		scale: number,
	) {
		// Draw the board background.

		var slateSprites = App.getSprites();
		for (var y = 0; y < Board.size.y; ++y) {
			for (var x = 0; x < Board.size.x; ++x) {
				var numTiles = 8;
				var numBaseTiles = 2;

				// This is just BS. The magic munber don't mean anything.
				var pseudoRandomByXY = Math.floor(
					Math.pow(113 + x + y * Board.size.y, this.slateRandomExp),
				);
				var basePattern = pseudoRandomByXY % numBaseTiles;
				var details = pseudoRandomByXY % numTiles - numBaseTiles + numBaseTiles;
				var useDetail = !(Math.floor(pseudoRandomByXY / 13) % 10);

				slateSprites[useDetail ? details : basePattern].draw(
					context,
					new Coord({
						x: center.x + (x - Board.size.x / 2) * scale * Piece.size,
						y: center.y + (y - Board.size.y / 2) * scale * Piece.size,
					}),
					new Coord({
						x: Piece.size * scale,
						y: Piece.size * scale,
					}),
				);
			}
		}

		// Calculate how much to stress the player. (Piece wobbling increases as they approach the maximum height before game over.)
		var height = 0;
		for (var i = 0; i < this.pieces.length; i++) {
			if (this.pieces[i]) {
				var position = Board.indexToCoord(i);
				height = Board.size.y - 1 - position.y;
				break;
			}
		}
		var ratio = height / (Board.size.y - 2 - 1);
		var cutOffPoint = 0.65;
		var disturbance =
			ratio < cutOffPoint ? 0 : (ratio - cutOffPoint) / (1 - cutOffPoint);

		// Draw the unlocking effects.
		var doneUnlockingEffectIndices = [];
		for (var i = this.unlockingEffects.length - 1; i >= 0; i--) {
			if (!this.unlockingEffects[i].isDone()) {
				this.unlockingEffects[i].draw(
					context,
					deltaTime,
					center,
					scale,
					Board.size,
				);
			} else {
				doneUnlockingEffectIndices.push(i);
			}
		}

		// Remove the unlocking effects when they are done.
		for (var i = doneUnlockingEffectIndices.length - 1; i >= 0; i--) {
			this.unlockingEffects.splice(doneUnlockingEffectIndices[i], 1);
		}

		// Draw the unlocked pieces, queued for unlocking effects.
		var donePieceIndices = [];
		for (var i = 0, length = this.unlockedPieces.length; i < length; ++i) {
			var piece = this.unlockedPieces[i];

			if (piece.unlockEffectDelay > 0) {
				// The piece should still be visible, so draw like normal.
				piece.draw(context, deltaTime, center, scale, disturbance, Board.size);

				// Count down.
				piece.unlockEffectDelay -= deltaTime;
			} else {
				// Remove it from the unlocking queue.
				donePieceIndices.push(i);

				// Start the unlocking effects.
				this.unlockingEffects.push(new UnlockingEffect(piece));
			}
		}

		// Remove the unlocked pieces from the unlocking effect queue.
		for (var i = donePieceIndices.length - 1; i >= 0; i--) {
			this.unlockedPieces.splice(donePieceIndices[i], 1);
		}

		// Draw the board pieces.
		for (var i = 0, length = this.pieces.length; i < length; ++i) {
			let piece = this.pieces[i];
			if (piece !== undefined) {
				piece.draw(context, deltaTime, center, scale, disturbance, Board.size);
			}
		}

		// Draw the dropper queue.
		this.dropperQueue.draw(context, deltaTime, center, scale, Board.size);

		// Draw the dropper pieces.
		if (!this.gameOver) {
			this.dropper.draw(context, deltaTime, center, scale, Board.size);
		}
	}
}
