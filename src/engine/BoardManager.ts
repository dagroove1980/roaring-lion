// ============================================================================
// Roaring Lion - Board Manager
// Pure functions for board state manipulation, move validation, and
// anti-stall detection.
// ============================================================================

import type { BoardCell, GamePiece, MoveRecord, Position, Side } from '../types';
import {
  BOARD_SIZE,
  isLakePosition,
  IMMOVABLE_RANKS,
  SCOUT_RANK,
  ANTI_STALL_THRESHOLD,
} from '../constants';

// ---------------------------------------------------------------------------
// Board Creation
// ---------------------------------------------------------------------------

/**
 * Create an empty 10x10 board with lake cells marked.
 * All non-lake cells start with `piece: null`.
 */
export function createEmptyBoard(): BoardCell[][] {
  const board: BoardCell[][] = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    const rowCells: BoardCell[] = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      rowCells.push({
        piece: null,
        isLake: isLakePosition(row, col),
      });
    }
    board.push(rowCells);
  }

  return board;
}

// ---------------------------------------------------------------------------
// Position Queries
// ---------------------------------------------------------------------------

/** Check whether a position falls on a lake cell. */
export function isLake(pos: Position): boolean {
  return isLakePosition(pos.row, pos.col);
}

/** Check whether a position is within bounds and not a lake. */
export function isValidPosition(pos: Position): boolean {
  const { row, col } = pos;
  return (
    row >= 0 &&
    row < BOARD_SIZE &&
    col >= 0 &&
    col < BOARD_SIZE &&
    !isLakePosition(row, col)
  );
}

/** Get the piece at a given position, or null if empty / out of bounds. */
export function getPieceAt(board: BoardCell[][], pos: Position): GamePiece | null {
  const { row, col } = pos;
  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
    return null;
  }
  return board[row][col].piece;
}

// ---------------------------------------------------------------------------
// Board Mutation (Pure — returns new board)
// ---------------------------------------------------------------------------

/** Deep-clone the board so mutations don't affect the original. */
function cloneBoard(board: BoardCell[][]): BoardCell[][] {
  return board.map((row) =>
    row.map((cell) => ({
      ...cell,
      piece: cell.piece ? { ...cell.piece } : null,
    }))
  );
}

/**
 * Place a piece at the given position.
 * Returns a new board; the original is not mutated.
 * The piece's `position` field is updated to match `pos`.
 */
export function placePiece(
  board: BoardCell[][],
  piece: GamePiece,
  pos: Position
): BoardCell[][] {
  const newBoard = cloneBoard(board);
  const updatedPiece: GamePiece = { ...piece, position: { ...pos } };
  newBoard[pos.row][pos.col] = {
    ...newBoard[pos.row][pos.col],
    piece: updatedPiece,
  };
  return newBoard;
}

/**
 * Remove whatever piece is at the given position.
 * Returns a new board; the original is not mutated.
 */
export function removePiece(board: BoardCell[][], pos: Position): BoardCell[][] {
  const newBoard = cloneBoard(board);
  newBoard[pos.row][pos.col] = {
    ...newBoard[pos.row][pos.col],
    piece: null,
  };
  return newBoard;
}

/**
 * Move a piece from one position to another.
 * Returns a new board; the original is not mutated.
 * The piece's `hasMoved` flag is set to true and its position is updated.
 *
 * NOTE: This does NOT handle combat. If the destination has an enemy piece,
 * the caller (GameEngine.executeMove) must resolve combat first.
 */
export function movePiece(
  board: BoardCell[][],
  from: Position,
  to: Position
): BoardCell[][] {
  const piece = getPieceAt(board, from);
  if (!piece) {
    return board; // Nothing to move — return unchanged
  }

  const newBoard = cloneBoard(board);

  // Clear origin
  newBoard[from.row][from.col] = {
    ...newBoard[from.row][from.col],
    piece: null,
  };

  // Place at destination with updated metadata
  const movedPiece: GamePiece = {
    ...piece,
    position: { row: to.row, col: to.col },
    hasMoved: true,
  };
  newBoard[to.row][to.col] = {
    ...newBoard[to.row][to.col],
    piece: movedPiece,
  };

  return newBoard;
}

// ---------------------------------------------------------------------------
// Anti-Stall Detection
// ---------------------------------------------------------------------------

/**
 * Determine whether moving `piece` from `from` to `to` would constitute
 * an illegal oscillation (back-and-forth between the same two squares
 * for ANTI_STALL_THRESHOLD consecutive turns).
 *
 * The detection works by inspecting the most recent moves by this piece
 * in the move history. If the last (ANTI_STALL_THRESHOLD - 1) moves
 * by this piece alternate between the same two positions, and the
 * proposed move would continue that pattern, the move is blocked.
 */
export function isOscillatingMove(
  piece: GamePiece,
  from: Position,
  to: Position,
  moveHistory: MoveRecord[]
): boolean {
  // Get the recent moves for this specific piece (most recent first)
  const pieceMoves = moveHistory
    .filter((m) => m.piece.id === piece.id)
    .slice(-(ANTI_STALL_THRESHOLD * 2)); // Only inspect recent moves

  if (pieceMoves.length < (ANTI_STALL_THRESHOLD - 1) * 2 - 1) {
    // Not enough history to detect oscillation
    return false;
  }

  // We need at least (ANTI_STALL_THRESHOLD - 1) previous moves that
  // oscillate between the same two squares. The proposed move would
  // be the ANTI_STALL_THRESHOLD-th move in the pattern.
  //
  // Example with threshold 3:
  //   Move N-3: A -> B   (piece move 1)
  //   Move N-2: B -> A   (piece move 2)
  //   Proposed: A -> B   (piece move 3 — blocked!)

  const recentPieceMoves = pieceMoves.slice(-(ANTI_STALL_THRESHOLD - 1));

  // Check if all recent moves by this piece oscillate between from and to
  const posA = from;
  const posB = to;

  for (let i = recentPieceMoves.length - 1; i >= 0; i--) {
    const move = recentPieceMoves[i];
    const isAtoB =
      positionsEqual(move.from, posA) && positionsEqual(move.to, posB);
    const isBtoA =
      positionsEqual(move.from, posB) && positionsEqual(move.to, posA);

    if (!isAtoB && !isBtoA) {
      return false; // Pattern broken — not oscillating
    }
  }

  return true;
}

// ---------------------------------------------------------------------------
// Move Validation
// ---------------------------------------------------------------------------

/** Orthogonal directions: up, down, left, right */
const DIRECTIONS: Position[] = [
  { row: -1, col: 0 }, // up
  { row: 1, col: 0 },  // down
  { row: 0, col: -1 }, // left
  { row: 0, col: 1 },  // right
];

/**
 * Calculate all valid destination positions for a piece.
 *
 * Rules:
 * - Bombs (B) and Flags (F) cannot move.
 * - Normal pieces move exactly 1 square orthogonally.
 * - Scouts (rank 2) move any number of squares in a straight line,
 *   but cannot jump over other pieces or lakes.
 * - A piece cannot move onto a square occupied by a friendly piece.
 * - A piece CAN move onto a square occupied by an enemy piece (attack).
 * - Anti-stall: oscillating moves are filtered out.
 *
 * @param board       Current board state
 * @param piece       The piece to calculate moves for
 * @param moveHistory Move history (for anti-stall detection)
 * @returns           Array of valid destination positions
 */
export function getValidMoves(
  board: BoardCell[][],
  piece: GamePiece,
  moveHistory: MoveRecord[] = []
): Position[] {
  // Immovable pieces have no valid moves
  if (IMMOVABLE_RANKS.includes(piece.rank)) {
    return [];
  }

  const moves: Position[] = [];
  const from = piece.position;

  if (piece.rank === SCOUT_RANK) {
    // Scouts: slide any number of squares in each orthogonal direction
    for (const dir of DIRECTIONS) {
      for (let dist = 1; dist < BOARD_SIZE; dist++) {
        const target: Position = {
          row: from.row + dir.row * dist,
          col: from.col + dir.col * dist,
        };

        // Stop if out of bounds
        if (
          target.row < 0 ||
          target.row >= BOARD_SIZE ||
          target.col < 0 ||
          target.col >= BOARD_SIZE
        ) {
          break;
        }

        // Stop if lake
        if (isLakePosition(target.row, target.col)) {
          break;
        }

        const occupant = board[target.row][target.col].piece;

        if (occupant) {
          if (occupant.side !== piece.side) {
            // Enemy piece — can attack, but cannot continue past
            moves.push(target);
          }
          // Friendly or enemy — cannot continue in this direction
          break;
        }

        // Empty valid square
        moves.push(target);
      }
    }
  } else {
    // Normal pieces: move exactly 1 square orthogonally
    for (const dir of DIRECTIONS) {
      const target: Position = {
        row: from.row + dir.row,
        col: from.col + dir.col,
      };

      if (!isValidPosition(target)) {
        continue;
      }

      const occupant = board[target.row][target.col].piece;

      if (occupant && occupant.side === piece.side) {
        continue; // Can't move onto friendly piece
      }

      moves.push(target);
    }
  }

  // Filter out oscillating moves (anti-stall)
  return moves.filter(
    (to) => !isOscillatingMove(piece, from, to, moveHistory)
  );
}

/**
 * Get the subset of valid moves that would result in combat
 * (moves onto squares occupied by an enemy piece).
 */
export function getAttackMoves(
  board: BoardCell[][],
  piece: GamePiece,
  moveHistory: MoveRecord[] = []
): Position[] {
  return getValidMoves(board, piece, moveHistory).filter((pos) => {
    const occupant = getPieceAt(board, pos);
    return occupant !== null && occupant.side !== piece.side;
  });
}

/**
 * Check whether a given side has at least one piece with a legal move.
 * If a side has no legal moves, the game should end (that side loses).
 */
export function hasLegalMoves(
  board: BoardCell[][],
  side: Side,
  moveHistory: MoveRecord[] = []
): boolean {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col].piece;
      if (piece && piece.side === side) {
        const moves = getValidMoves(board, piece, moveHistory);
        if (moves.length > 0) {
          return true;
        }
      }
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

/** Check whether two positions are the same cell. */
export function positionsEqual(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}
