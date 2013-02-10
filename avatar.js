
"use strict";


function AvatarAztecJade (options) {

	this.character = options.character;
};


AvatarAztecJade.size = 256;



AvatarAztecJade.getSprites = function() {

	if (!AvatarAztecJade.sprites) {

		AvatarAztecJade.sprites = AvatarAztecJade.getSpriteSheet().getSprites();
	}

	return AvatarAztecJade.sprites;
}


AvatarAztecJade.getSpriteSheet = function () {

	if (!AvatarAztecJade.spriteSheet) {

		AvatarAztecJade.spriteSheet = new SpriteSheet(AvatarAztecJade.getSpriteSheetSettings());
	}

	return AvatarAztecJade.spriteSheet;
}


AvatarAztecJade.getSpriteSheetSettings = function () {

	var sprites = [
		{
			name: "gold",
			sheetPosition: {x:0, y:0},
			sheetSize: {x:1, y:1},
		},
		{
			name: "clay",
			sheetPosition: {x:1, y:0},
			sheetSize: {x:0, y:0},
		},
		{
			name: "idol",
			sheetPosition: {x:0, y:1},
			sheetSize: {x:1, y:1},
		},
		{
			name: "shards",
			sheetPosition: {x:1, y:1},
			sheetSize: {x:0, y:1},
		}
	];

	return {
		imageFileName: "aztec-jade.png",
		gridSize: {x:2, y:2},
		spriteSettings: sprites	
	}
}


AvatarAztecJade.prototype.draw = function (context, currentTime, avatarCenter) {

	var sprites = AvatarAztecJade.getSprites();

	var size = {
		x: AvatarAztecJade.size,
		y: AvatarAztecJade.size
	};

	var diskSizeFactor = (1 + Math.sin(currentTime/1000 * 3))/2;

	sprites["gold"].draw(
		context,
		Coord.subtract(avatarCenter, Coord.scale(size, 0.5 * diskSizeFactor)),
		Coord.scale(size, diskSizeFactor)
	);

	sprites["idol"].draw(
		context,
		Coord.subtract(avatarCenter, Coord.scale(size, 0.5)),
		size
	);
}
