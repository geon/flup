
interface Avatar {

	draw(
		context: CanvasRenderingContext2D,
		currentTime: number,
		avatarCenter: Coord
	): void;
}
