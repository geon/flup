import { App } from "./App";

$(document).ready(function() {
	var app = new App({
		context: (<HTMLCanvasElement>$("canvas").get(0)).getContext("2d")!,
	});

	app.startGame();
});
