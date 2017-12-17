import { App } from "./App";

const app = new App({
	context: (document.getElementsByTagName(
		"canvas",
	)[0] as HTMLCanvasElement).getContext("2d")!,
});

try {
	app.startGame();
} catch (error) {
	console.error("Could not start game.", error);
}
