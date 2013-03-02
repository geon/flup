
"use strict";


function AvatarOwl (options) {

	this.character = options.character;
};


AvatarOwl.size = 256;



AvatarOwl.getSprites = function() {

	if (!AvatarOwl.sprites) {

		AvatarOwl.sprites = AvatarOwl.getSpriteSheet().getSprites();
	}

	return AvatarOwl.sprites;
}


AvatarOwl.getSpriteSheet = function () {

	if (!AvatarOwl.spriteSheet) {

		AvatarOwl.spriteSheet = new SpriteSheet(AvatarOwl.getSpriteSheetSettings());
	}

	return AvatarOwl.spriteSheet;
}


AvatarOwl.getSpriteSheetSettings = function () {

	var sprites = [
		{
			name: "head",
			sheetPosition: {x:0, y:0},
			sheetSize: {x:1, y:1},
		},
		{
			name: "headSpin1",
			sheetPosition: {x:0, y:0},
			sheetSize: {x:1, y:1},
		},
		{
			name: "headSpin2",
			sheetPosition: {x:0, y:0},
			sheetSize: {x:2, y:1},
		},
		{
			name: "headSpin3",
			sheetPosition: {x:0, y:0},
			sheetSize: {x:3, y:1},
		},
		{
			name: "headSpin4",
			sheetPosition: {x:0, y:0},
			sheetSize: {x:4, y:1},
		},
		{
			name: "headSpin5",
			sheetPosition: {x:0, y:0},
			sheetSize: {x:5, y:1},
		},
		{
			name: "body",
			sheetPosition: {x:0, y:1},
			sheetSize: {x:1, y:1},
		},
		{
			name: "wingsClosed",
			sheetPosition: {x:1, y:1},
			sheetSize: {x:0, y:0},
		},
		{
			name: "wingsTransition1",
			sheetPosition: {x:2, y:1},
			sheetSize: {x:0, y:0},
		},
		{
			name: "wingsTransition2",
			sheetPosition: {x:3, y:1},
			sheetSize: {x:0, y:0},
		},
		{
			name: "wingsTransition3",
			sheetPosition: {x:4, y:1},
			sheetSize: {x:0, y:0},
		},
		{
			name: "wingsOpen",
			sheetPosition: {x:5, y:1},
			sheetSize: {x:0, y:0},
		},
	];

	return {
		imageFileName: "owl.png",
		gridSize: {x:6, y:2},
		spriteSettings: sprites	
	}
}


AvatarOwl.wingFlapCycle = [
	{name: "wingsClosed",      time: 2000},
	{name: "wingsTransition1", time: 50},
	{name: "wingsTransition2", time: 50},
	{name: "wingsTransition3", time: 50},
	{name: "wingsOpen",        time: 1000},
	{name: "wingsTransition3", time: 50},
	{name: "wingsTransition2", time: 50},
	{name: "wingsTransition1", time: 50}
];

AvatarOwl.wingFlapCycle.currentFrameIndex = 0;

AvatarOwl.wingFlapCycle.getCurrentFrameName = function () {

	// If there is no timer to the next frame...
	if (!AvatarOwl.wingFlapCycle.frameTimer) {

		// ...create one.
		AvatarOwl.wingFlapCycle.frameTimer = setTimeout(function(){

			// Next frame.
			++AvatarOwl.wingFlapCycle.currentFrameIndex;
			AvatarOwl.wingFlapCycle.currentFrameIndex %= AvatarOwl.wingFlapCycle.length;

			// Clear the timer.
			AvatarOwl.wingFlapCycle.frameTimer = undefined;

		// Wait this long before switching frame.
		}, AvatarOwl.wingFlapCycle[AvatarOwl.wingFlapCycle.currentFrameIndex].time);
	};

	// The current frame name.
	return AvatarOwl.wingFlapCycle[AvatarOwl.wingFlapCycle.currentFrameIndex].name;
}

AvatarOwl.prototype.draw = function (context, currentTime, avatarCenter) {

	var sprites = AvatarOwl.getSprites();

	var size = {
		x: AvatarOwl.size,
		y: AvatarOwl.size
	};

	var wingFlapFrameTime = 50;

	sprites[AvatarOwl.wingFlapCycle.getCurrentFrameName()].draw(
		context,
		Coord.subtract(avatarCenter, Coord.scale(size, 0.5)),
		size
	);

	sprites["body"].draw(
		context,
		Coord.subtract(avatarCenter, Coord.scale(size, 0.5)),
		size
	);

	sprites["head"].draw(
		context,
		Coord.subtract(avatarCenter, Coord.scale(size, 0.5)),
		size
	);
}
