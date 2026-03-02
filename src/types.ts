// ============================================================================
// Roaring Lion - Game Types
// A Stratego-inspired browser board game: Israel vs Iran
// ============================================================================

/** The two opposing sides in the game */
export type Side = 'israel' | 'iran';

/**
 * Piece ranks following Stratego conventions:
 * - 10 (highest officer) down to 2 (scout)
 * - 'S' = Spy (can defeat the 10 if attacking)
 * - 'B' = Bomb (immovable, destroys any attacker except rank 3)
 * - 'F' = Flag (immovable, capture to win)
 */
export type Rank = 10 | 9 | 8 | 7 | 6 | 5 | 4 | 3 | 2 | 'S' | 'B' | 'F';

/** Template definition for a piece type within an army roster */
export interface PieceType {
  rank: Rank;
  unitName: string;
  count: number;
  description: string;
}

/** A position on the 10x10 board (0-indexed) */
export interface Position {
  row: number;
  col: number;
}

/** A single cell on the game board */
export interface BoardCell {
  piece: GamePiece | null;
  isLake: boolean;
}

/** A game piece on the board or in a tray */
export interface GamePiece {
  id: string;
  side: Side;
  rank: Rank;
  unitName: string;
  isRevealed: boolean;
  hasMoved: boolean;
  position: Position;
}

/** The current phase of the game */
export type GamePhase = 'menu' | 'setup' | 'playing' | 'battle' | 'gameOver';

/** AI difficulty levels */
export type Difficulty = 'easy' | 'medium' | 'hard';

/** The result of a combat encounter between two pieces */
export interface CombatResult {
  attacker: GamePiece;
  defender: GamePiece;
  /** The winning piece, or null if both are destroyed (equal rank) */
  winner: GamePiece | null;
  attackerDestroyed: boolean;
  defenderDestroyed: boolean;
}

/** A record of a single move in the game history */
export interface MoveRecord {
  piece: GamePiece;
  from: Position;
  to: Position;
  combat?: CombatResult;
  turn: number;
}

/** The complete game state */
export interface GameState {
  /** 10x10 board grid */
  board: BoardCell[][];
  /** Whose turn it is */
  currentTurn: Side;
  /** Current game phase */
  phase: GamePhase;
  /** Currently selected piece (for move highlighting) */
  selectedPiece: GamePiece | null;
  /** Valid move destinations for the selected piece */
  validMoves: Position[];
  /** All living Israel pieces on the board */
  israelPieces: GamePiece[];
  /** All living Iran pieces on the board */
  iranPieces: GamePiece[];
  /** Pieces captured (destroyed) by Israel */
  capturedByIsrael: GamePiece[];
  /** Pieces captured (destroyed) by Iran */
  capturedByIran: GamePiece[];
  /** Full move history for replay / undo */
  moveHistory: MoveRecord[];
  /** Current turn number (increments each full round) */
  turnNumber: number;
  /** AI difficulty setting */
  difficulty: Difficulty;
  /** Pieces remaining in the tray during setup phase */
  setupPieces: GamePiece[];
  /** The winning side, or null if game is still in progress */
  winner: Side | null;
}
