import { PieceSprite } from "./PieceSprite";

export interface InvisiblePiece {
	color: number;
	key: boolean;
}

export interface Piece extends InvisiblePiece {
	sprite: PieceSprite;
}
