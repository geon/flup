import { PieceSprite } from "./PieceSprite";

export const pieceColors = [0, 1, 2, 3] as const;

export interface InvisiblePiece {
	color: number;
	key: boolean;
}

export interface Piece extends InvisiblePiece {
	sprite: PieceSprite;
}
