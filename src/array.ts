export function randomArrayElement<T>(array: ReadonlyArray<T>): T {
	return array[Math.floor(Math.random() * array.length)]!;
}
