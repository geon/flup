import { Avatar } from "./Avatar";
import { Coord } from "./Coord";
import { PieceCycle } from "./PieceCycle";
import { SpriteSet, SpriteSheet } from "./SpriteSheet";
import { Board } from "./Board";

export class AvatarOwl extends Avatar {
	static size: number = 256;
	static sprites: SpriteSet;
	static spriteSheet: SpriteSheet;

	getSize() {
		return AvatarOwl.size;
	}

	static getSprites() {
		if (!AvatarOwl.sprites) {
			AvatarOwl.sprites = AvatarOwl.getSpriteSheet().getSprites();
		}

		return AvatarOwl.sprites;
	}

	static getSpriteSheet() {
		if (!AvatarOwl.spriteSheet) {
			AvatarOwl.spriteSheet = new SpriteSheet(
				AvatarOwl.getSpriteSheetSettings(),
			);
		}

		return AvatarOwl.spriteSheet;
	}

	static getSpriteSheetSettings() {
		const sprites = [
			{
				name: "head",
				sheetPosition: new Coord({ x: 0, y: 0 }),
				sheetSize: new Coord({ x: 1, y: 1 }),
			},
			{
				name: "headSpin1",
				sheetPosition: new Coord({ x: 0, y: 0 }),
				sheetSize: new Coord({ x: 1, y: 1 }),
			},
			{
				name: "headSpin2",
				sheetPosition: new Coord({ x: 0, y: 0 }),
				sheetSize: new Coord({ x: 2, y: 1 }),
			},
			{
				name: "headSpin3",
				sheetPosition: new Coord({ x: 0, y: 0 }),
				sheetSize: new Coord({ x: 3, y: 1 }),
			},
			{
				name: "headSpin4",
				sheetPosition: new Coord({ x: 0, y: 0 }),
				sheetSize: new Coord({ x: 4, y: 1 }),
			},
			{
				name: "headSpin5",
				sheetPosition: new Coord({ x: 0, y: 0 }),
				sheetSize: new Coord({ x: 5, y: 1 }),
			},
			{
				name: "body",
				sheetPosition: new Coord({ x: 0, y: 1 }),
				sheetSize: new Coord({ x: 1, y: 1 }),
			},
			{
				name: "wingsClosed",
				sheetPosition: new Coord({ x: 1, y: 1 }),
				sheetSize: new Coord({ x: 0, y: 0 }),
			},
			{
				name: "wingsTransition1",
				sheetPosition: new Coord({ x: 2, y: 1 }),
				sheetSize: new Coord({ x: 0, y: 0 }),
			},
			{
				name: "wingsTransition2",
				sheetPosition: new Coord({ x: 3, y: 1 }),
				sheetSize: new Coord({ x: 0, y: 0 }),
			},
			{
				name: "wingsTransition3",
				sheetPosition: new Coord({ x: 4, y: 1 }),
				sheetSize: new Coord({ x: 0, y: 0 }),
			},
			{
				name: "wingsOpen",
				sheetPosition: new Coord({ x: 5, y: 1 }),
				sheetSize: new Coord({ x: 0, y: 0 }),
			},
		];

		return {
			imageFileName: "owl.png",
			gridSize: new Coord({ x: 6, y: 2 }),
			spriteSettings: sprites,
		};
	}

	static wingFlapCycle = {
		frames: [
			{ name: "wingsClosed", time: 2000 },
			{ name: "wingsTransition1", time: 50 },
			{ name: "wingsTransition2", time: 50 },
			{ name: "wingsTransition3", time: 50 },
			{ name: "wingsOpen", time: 1000 },
			{ name: "wingsTransition3", time: 50 },
			{ name: "wingsTransition2", time: 50 },
			{ name: "wingsTransition1", time: 50 },
		],
		currentFrameIndex: 0,
		frameTimer: undefined as number | undefined,
		getCurrentFrameName() {
			// If there is no timer to the next frame...
			if (!AvatarOwl.wingFlapCycle.frameTimer) {
				// ...create one.
				AvatarOwl.wingFlapCycle.frameTimer = setTimeout(() => {
					// Next frame.
					++AvatarOwl.wingFlapCycle.currentFrameIndex;
					AvatarOwl.wingFlapCycle.currentFrameIndex %=
						AvatarOwl.wingFlapCycle.frames.length;

					// Clear the timer.
					AvatarOwl.wingFlapCycle.frameTimer = undefined;

					// Wait this long before switching frame.
				}, AvatarOwl.wingFlapCycle.frames[AvatarOwl.wingFlapCycle.currentFrameIndex].time);
			}

			// The current frame name.
			return AvatarOwl.wingFlapCycle.frames[
				AvatarOwl.wingFlapCycle.currentFrameIndex
			].name;
		},
	};

	*generatePunishColors() {
		for (;;) {
			const colors = [];
			for (let x = 0; x < Board.size.x; x++) {
				colors.push(x % PieceCycle.numColors);
			}
			yield colors;
		}
	}

	draw(
		context: CanvasRenderingContext2D,
		_deltaTime: number,
		avatarCenter: Coord,
	) {
		const sprites = AvatarOwl.getSprites();

		const size = new Coord({
			x: AvatarOwl.size,
			y: AvatarOwl.size,
		});

		sprites[AvatarOwl.wingFlapCycle.getCurrentFrameName()].draw(
			context,
			Coord.subtract(avatarCenter, Coord.scale(size, 0.5)),
			size,
		);

		sprites.body.draw(
			context,
			Coord.subtract(avatarCenter, Coord.scale(size, 0.5)),
			size,
		);

		sprites.head.draw(
			context,
			Coord.subtract(avatarCenter, Coord.scale(size, 0.5)),
			size,
		);
	}
}
