import { Piece } from "./Piece";

export class PieceCycle {
	currentIndex: number;
	pieces: Piece[];

	constructor(pieces: Piece[]) {
		this.currentIndex = 0;
		this.pieces = pieces;
	}

	pop() {
		var piece = this.pieces[this.currentIndex];

		this.currentIndex = (this.currentIndex + 1) % this.pieces.length;

		return piece;
	}

	static numColors: number = 4;
	static nonKeyToKeyRatio: number = 7;

	static generate() {
		// Create list of all colors.
		var baseColors: Array<Piece> = [];
		var keyColors: Array<Piece> = [];
		for (var i = 0; i < this.numColors; ++i) {
			baseColors[i] = new Piece({ color: i, key: false });
			keyColors[i] = new Piece({ color: i, key: true });
		}

		// Create a list of all pieces in the proper ratios.
		var properRatio = keyColors;
		for (var i = 0; i < this.nonKeyToKeyRatio; ++i) {
			properRatio = properRatio.concat(baseColors);
		}

		// Repeat the colors so there is a long cycle.
		var pieces: Array<Piece> = [];
		for (var i = 0; i < 32; ++i) {
			// Shuffle the group of keys and colors separately, so the whole cycle gets the keys/colors evenly distributed.
			this.fisherYatesArrayShuffle(properRatio);

			pieces = pieces.concat(properRatio);
		}

		return pieces;
	}

	// http://stackoverflow.com/questions/2450954/how-to-randomize-a-javascript-array
	static fisherYatesArrayShuffle<T>(myArray: Array<T>) {
		var i = myArray.length;
		if (i == 0) return;
		while (--i) {
			var j = Math.floor(Math.random() * (i + 1));
			var tempi = myArray[i];
			var tempj = myArray[j];
			myArray[i] = tempj;
			myArray[j] = tempi;
		}
	}
}
