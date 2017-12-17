import { App } from "./App";

const app = new App({
	context: (document.getElementsByTagName(
		"canvas",
	)[0] as HTMLCanvasElement).getContext("2d")!,
});

app.startGame();
