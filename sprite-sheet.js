
"use strict";


function SpriteSheet (options) {

	this.imageFileName = options.imageFileName;
	this.gridSize = options.gridSize;
	this.spriteSettings = options.spriteSettings;

	this.image = new Image();
};


SpriteSheet.prototype.loadImage = function () {

	var promise = $.Deferred();
	$(this.image).load(promise.resolve);
	$(this.image).error(promise.reject);

	this.image.src = "graphics/"+this.imageFileName;

	return promise;	
};


SpriteSheet.prototype.getSprites = function () {

	var sprites = {};

	for (var i = this.spriteSettings.length - 1; i >= 0; i--) {
		sprites[this.spriteSettings[i].name] = new Sprite(
			this,
			this.spriteSettings[i].sheetPosition,
			this.spriteSettings[i].sheetSize
		);
	};

	return sprites;	
};