import { PieceSprite } from "./PieceSprite";

export const pieceColors = [0, 1, 2, 3] as const;
export type PieceColor = (typeof pieceColors)[number];
export function isPieceColor(color: number): color is PieceColor {
	return color >= 0 && color < pieceColors.length;
}
export function parsePieceColor(color: number): PieceColor {
	if (!isPieceColor(color)) {
		throw new Error(`Not a PieceColor: ${color}`);
	}

	return color;
}

export interface InvisiblePiece {
	color: PieceColor;
	key: boolean;
}

export interface Piece extends InvisiblePiece {
	sprite: PieceSprite;
}
