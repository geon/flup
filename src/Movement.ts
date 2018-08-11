import { PieceSprite } from "./PieceSprite";
import { Coord } from "./Coord";

export interface Movement {
	sprite: PieceSprite;
	to: Coord;
}
