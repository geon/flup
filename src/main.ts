import { App } from "./App";

$(document).ready(() => {
	const app = new App({
		context: ($("canvas").get(0) as HTMLCanvasElement).getContext("2d")!,
	});

	app.startGame();
});
