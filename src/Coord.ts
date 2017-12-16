export class Coord {
	x: number;
	y: number;

	constructor(coord: { x: number; y: number }) {
		this.x = coord.x;
		this.y = coord.y;
	}

	scaled(factor: number) {
		return Coord.scale(this, factor);
	}

	length() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}

	normalized() {
		return Coord.scale(this, 1 / this.length());
	}

	static distance(a: Coord, b: Coord) {
		return Coord.subtract(a, b).length();
	}

	static add(a: Coord, b: Coord) {
		return new Coord({
			x: a.x + b.x,
			y: a.y + b.y,
		});
	}

	static subtract(a: Coord, b: Coord) {
		return new Coord({
			x: a.x - b.x,
			y: a.y - b.y,
		});
	}

	static scale(coord: Coord, factor: number) {
		return new Coord({
			x: coord.x * factor,
			y: coord.y * factor,
		});
	}
}
