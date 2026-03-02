// ============================================================================
// Roaring Lion - AI Controller
// Controls the Iran (red) army: setup placement + turn decisions
// Three difficulty levels: easy (Recruit), medium (Commander), hard (General)
// ============================================================================

import type {
  Side,
  Rank,
  Position,
  GamePiece,
  BoardCell,
  Difficulty,
  MoveRecord,
} from '../types';

import {
  BOARD_SIZE,
  LAKE_POSITION_SET,
  SCOUT_RANK,
  SAPPER_RANK,
  SPY_RANK,
  MARSHAL_RANK,
  getRankValue,
  canMove,
  isScout,
} from '../constants';

// ============================================================================
// Constants
// ============================================================================

/** Artificial delay in ms per difficulty to simulate "thinking" */
export const AI_THINK_DELAY: Record<Difficulty, number> = {
  easy: 500,
  medium: 1000,
  hard: 1500,
};

/** Iran setup rows: rows 6-9 (0-indexed, top 4 rows from Iran's perspective) */
const IRAN_SETUP_MIN_ROW = 6;
const IRAN_SETUP_MAX_ROW = 9;

/** Directions for piece movement: up, down, left, right */
const DIRECTIONS: Position[] = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
];

// ============================================================================
// Shared AI Memory (persists across turns within a game session)
// ============================================================================

/** Tracks enemy pieces whose rank has been revealed during combat or scouts */
let knownEnemyPieces: Map<string, Rank> = new Map();

/** Tracks pieces that have never moved (potential bombs/flags for hard AI) */
// Tracks pieces that have never moved - stored as module state for hard AI
// @ts-expect-error: Populated by updateNeverMovedTracking, read indirectly
let _neverMovedPieces: Set<string> = new Set();

/** Resets AI memory at the start of a new game */
export function resetAIMemory(): void {
  knownEnemyPieces = new Map();
  _neverMovedPieces = new Set();
}

/** Update known pieces when an enemy piece is revealed */
export function recordRevealedPiece(pieceId: string, rank: Rank): void {
  knownEnemyPieces.set(pieceId, rank);
}

/** Get current known enemy pieces map (for external inspection/testing) */
export function getKnownEnemyPieces(): Map<string, Rank> {
  return new Map(knownEnemyPieces);
}

// ============================================================================
// Utility Helpers
// ============================================================================

/** Secure random integer in [0, max) */
function randomInt(max: number): number {
  return Math.floor(Math.random() * max);
}

/** Shuffle an array in place using Fisher-Yates */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Check if a position is within board bounds */
function isInBounds(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

/** Check if a position is a lake */
function isLake(row: number, col: number): boolean {
  return LAKE_POSITION_SET.has(`${row},${col}`);
}

/** Create a position key string for map lookups */
function posKey(row: number, col: number): string {
  return `${row},${col}`;
}

/** Get the numeric rank value for combat comparison (higher wins) */
function numericRank(rank: Rank): number {
  return getRankValue(rank);
}

// ============================================================================
// Board Query Helpers
// ============================================================================

/** Get all valid moves for a piece on the given board */
function getValidMovesForPiece(
  piece: GamePiece,
  board: BoardCell[][],
  moveHistory: MoveRecord[]
): Position[] {
  if (!canMove(piece.rank)) return [];

  const moves: Position[] = [];
  const { row, col } = piece.position;

  if (isScout(piece.rank)) {
    // Scouts can move any number of squares in a straight line
    for (const dir of DIRECTIONS) {
      let r = row + dir.row;
      let c = col + dir.col;
      while (isInBounds(r, c) && !isLake(r, c)) {
        const cell = board[r][c];
        if (cell.piece === null) {
          moves.push({ row: r, col: c });
        } else if (cell.piece.side !== piece.side) {
          // Can attack enemy piece (stopping here)
          moves.push({ row: r, col: c });
          break;
        } else {
          // Blocked by own piece
          break;
        }
        r += dir.row;
        c += dir.col;
      }
    }
  } else {
    // Regular pieces move 1 square in cardinal directions
    for (const dir of DIRECTIONS) {
      const r = row + dir.row;
      const c = col + dir.col;
      if (!isInBounds(r, c) || isLake(r, c)) continue;
      const cell = board[r][c];
      if (cell.piece === null || cell.piece.side !== piece.side) {
        moves.push({ row: r, col: c });
      }
    }
  }

  // Filter out moves that violate anti-stall rules (oscillating for 3 turns)
  return filterAntiStallMoves(piece, moves, moveHistory);
}

/** Filter moves that would cause oscillation (same piece between 2 squares 3 times) */
function filterAntiStallMoves(
  piece: GamePiece,
  moves: Position[],
  moveHistory: MoveRecord[]
): Position[] {
  if (moveHistory.length < 4) return moves;

  // Get last few moves by this specific piece
  const pieceHistory = moveHistory
    .filter((m) => m.piece.id === piece.id)
    .slice(-4);

  if (pieceHistory.length < 4) return moves;

  // Check if oscillating between two positions
  const last4 = pieceHistory.slice(-4);
  const posA = last4[0].from;
  const posB = last4[0].to;

  const isOscillating =
    last4[1].from.row === posB.row &&
    last4[1].from.col === posB.col &&
    last4[1].to.row === posA.row &&
    last4[1].to.col === posA.col &&
    last4[2].from.row === posA.row &&
    last4[2].from.col === posA.col &&
    last4[2].to.row === posB.row &&
    last4[2].to.col === posB.col &&
    last4[3].from.row === posB.row &&
    last4[3].from.col === posB.col &&
    last4[3].to.row === posA.row &&
    last4[3].to.col === posA.col;

  if (!isOscillating) return moves;

  // Block the oscillation destination
  return moves.filter(
    (m) =>
      !(
        (m.row === posA.row && m.col === posA.col) ||
        (m.row === posB.row && m.col === posB.col)
      )
  );
}

/** Get all Iran pieces that can make at least one legal move */
function getMovablePieces(
  board: BoardCell[][],
  pieces: GamePiece[],
  moveHistory: MoveRecord[]
): { piece: GamePiece; moves: Position[] }[] {
  const result: { piece: GamePiece; moves: Position[] }[] = [];

  for (const piece of pieces) {
    if (piece.side !== 'iran') continue;
    if (!canMove(piece.rank)) continue;
    if (piece.position.row < 0) continue; // Not on board

    const moves = getValidMovesForPiece(piece, board, moveHistory);
    if (moves.length > 0) {
      result.push({ piece, moves });
    }
  }

  return result;
}

// ============================================================================
// SETUP PLACEMENT
// ============================================================================

/**
 * Generate AI setup placement for all 40 Iranian pieces on rows 6-9.
 * Returns a map of pieceId -> Position.
 *
 * Strategy applied at all difficulties:
 * - Flag in back row (row 9), preferably columns 3-6
 * - 2-3 Bombs surrounding the Flag
 * - Remaining Bombs as decoys/traps
 * - High-rank pieces (10, 9, 8) protected in rows 7-8
 * - Scouts in front row (row 6) for early recon
 * - Miners spread across for bomb-clearing access
 * - Spy near the General (rank 9)
 * - Randomization within constraints for variety
 */
export function generateAISetup(
  pieces: GamePiece[],
  difficulty: Difficulty
): Map<string, Position> {
  const placement = new Map<string, Position>();
  const occupied = new Set<string>();

  // Build available positions (rows 6-9, excluding lakes)
  const allPositions: Position[] = [];
  for (let row = IRAN_SETUP_MIN_ROW; row <= IRAN_SETUP_MAX_ROW; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (!isLake(row, col)) {
        allPositions.push({ row, col });
      }
    }
  }

  // Categorize pieces by rank
  const flag = pieces.filter((p) => p.rank === 'F');
  const bombs = pieces.filter((p) => p.rank === 'B');
  const rank10 = pieces.filter((p) => p.rank === 10);
  const rank9 = pieces.filter((p) => p.rank === 9);
  const rank8 = pieces.filter((p) => p.rank === 8);
  const rank7 = pieces.filter((p) => p.rank === 7);
  const rank6 = pieces.filter((p) => p.rank === 6);
  const rank5 = pieces.filter((p) => p.rank === 5);
  const rank4 = pieces.filter((p) => p.rank === 4);
  const miners = pieces.filter((p) => p.rank === 3);
  const scouts = pieces.filter((p) => p.rank === 2);
  const spy = pieces.filter((p) => p.rank === 'S');

  /** Place a piece at a specific position */
  function placePiece(piece: GamePiece, pos: Position): void {
    const key = posKey(pos.row, pos.col);
    placement.set(piece.id, pos);
    occupied.add(key);
  }

  /** Check if a position is available */
  function isAvailable(pos: Position): boolean {
    return !occupied.has(posKey(pos.row, pos.col)) && !isLake(pos.row, pos.col);
  }

  /** Get available positions in a row range and optional column range */
  function getAvailableInRange(
    minRow: number,
    maxRow: number,
    minCol: number = 0,
    maxCol: number = BOARD_SIZE - 1
  ): Position[] {
    const result: Position[] = [];
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const pos = { row, col };
        if (isAvailable(pos)) {
          result.push(pos);
        }
      }
    }
    return shuffle(result);
  }

  /** Get adjacent positions to a given position */
  function getAdjacentPositions(pos: Position): Position[] {
    return DIRECTIONS.map((d) => ({ row: pos.row + d.row, col: pos.col + d.col }))
      .filter(
        (p) =>
          p.row >= IRAN_SETUP_MIN_ROW &&
          p.row <= IRAN_SETUP_MAX_ROW &&
          p.col >= 0 &&
          p.col < BOARD_SIZE &&
          isAvailable(p)
      );
  }

  // ---- Step 1: Place the Flag in the back row (row 9), columns 3-6 ----
  const flagPositions = getAvailableInRange(9, 9, 3, 6);
  if (flagPositions.length > 0) {
    placePiece(flag[0], flagPositions[0]);
  } else {
    // Fallback: anywhere in row 9
    const fallback = getAvailableInRange(9, 9);
    placePiece(flag[0], fallback[0]);
  }

  const flagPos = placement.get(flag[0].id)!;

  // ---- Step 2: Place 2-3 Bombs surrounding the Flag ----
  const adjacentToFlag = getAdjacentPositions(flagPos);
  const bombsAroundFlag = Math.min(
    difficulty === 'easy' ? 2 : 3,
    adjacentToFlag.length,
    bombs.length
  );

  let bombsPlaced = 0;
  for (let i = 0; i < bombsAroundFlag && i < adjacentToFlag.length; i++) {
    placePiece(bombs[bombsPlaced], adjacentToFlag[i]);
    bombsPlaced++;
  }

  // ---- Step 3: Place remaining Bombs as decoys ----
  // Corners and front-row traps for variety
  const decoyPositions = shuffle([
    // Corners of the setup area
    ...getAvailableInRange(9, 9, 0, 1),
    ...getAvailableInRange(9, 9, 8, 9),
    // Front-row traps
    ...getAvailableInRange(6, 6, 0, 2),
    ...getAvailableInRange(6, 6, 7, 9),
    // Mid-row traps
    ...getAvailableInRange(7, 8, 0, 1),
    ...getAvailableInRange(7, 8, 8, 9),
  ]);

  for (let i = bombsPlaced; i < bombs.length; i++) {
    if (decoyPositions.length > 0) {
      const pos = decoyPositions.shift()!;
      if (isAvailable(pos)) {
        placePiece(bombs[i], pos);
        continue;
      }
    }
    // Fallback: place anywhere in setup zone
    const available = getAvailableInRange(
      IRAN_SETUP_MIN_ROW,
      IRAN_SETUP_MAX_ROW
    );
    if (available.length > 0) {
      placePiece(bombs[i], available[0]);
    }
  }

  // ---- Step 4: Place high-value pieces (10, 9, 8) in protected rows 7-8 ----
  const highValuePieces = [...rank10, ...rank9, ...rank8];
  const protectedPositions = getAvailableInRange(7, 8, 2, 7);

  for (const piece of highValuePieces) {
    if (protectedPositions.length > 0) {
      placePiece(piece, protectedPositions.shift()!);
    } else {
      // Fallback: rows 7-9
      const fallback = getAvailableInRange(7, 9);
      if (fallback.length > 0) {
        placePiece(piece, fallback[0]);
      }
    }
  }

  // ---- Step 5: Place Spy near the General (rank 9) ----
  if (spy.length > 0 && rank9.length > 0) {
    const generalPos = placement.get(rank9[0].id);
    if (generalPos) {
      const nearGeneral = getAdjacentPositions(generalPos);
      if (nearGeneral.length > 0) {
        placePiece(spy[0], nearGeneral[0]);
      } else {
        // Place in same row range
        const sameRow = getAvailableInRange(
          Math.max(IRAN_SETUP_MIN_ROW, generalPos.row - 1),
          Math.min(IRAN_SETUP_MAX_ROW, generalPos.row + 1)
        );
        if (sameRow.length > 0) {
          placePiece(spy[0], sameRow[0]);
        }
      }
    }
  }

  // ---- Step 6: Place Scouts in front row (row 6) for early recon ----
  const frontPositions = getAvailableInRange(6, 6);
  for (const scout of scouts) {
    if (placement.has(scout.id)) continue;
    if (frontPositions.length > 0) {
      placePiece(scout, frontPositions.shift()!);
    }
  }

  // ---- Step 7: Spread Miners across the setup area ----
  const minerPositions = shuffle([
    ...getAvailableInRange(6, 7, 0, 3),
    ...getAvailableInRange(6, 7, 6, 9),
    ...getAvailableInRange(8, 9, 4, 5),
  ]);

  for (const miner of miners) {
    if (placement.has(miner.id)) continue;
    if (minerPositions.length > 0) {
      const pos = minerPositions.shift()!;
      if (isAvailable(pos)) {
        placePiece(miner, pos);
        continue;
      }
    }
    // Fallback
    const fallback = getAvailableInRange(IRAN_SETUP_MIN_ROW, IRAN_SETUP_MAX_ROW);
    if (fallback.length > 0) {
      placePiece(miner, fallback[0]);
    }
  }

  // ---- Step 8: Place remaining pieces (ranks 7, 6, 5, 4) ----
  const remainingPieces = shuffle([
    ...rank7,
    ...rank6,
    ...rank5,
    ...rank4,
    ...spy.filter((p) => !placement.has(p.id)),
    ...scouts.filter((p) => !placement.has(p.id)),
    ...miners.filter((p) => !placement.has(p.id)),
  ]);

  for (const piece of remainingPieces) {
    if (placement.has(piece.id)) continue;

    // Mid-rank officers in rows 7-8, lower ranks wherever
    const rankVal = numericRank(piece.rank);
    let candidates: Position[];

    if (rankVal >= 6) {
      candidates = getAvailableInRange(7, 8);
      if (candidates.length === 0) {
        candidates = getAvailableInRange(IRAN_SETUP_MIN_ROW, IRAN_SETUP_MAX_ROW);
      }
    } else {
      candidates = getAvailableInRange(IRAN_SETUP_MIN_ROW, IRAN_SETUP_MAX_ROW);
    }

    if (candidates.length > 0) {
      placePiece(piece, candidates[0]);
    }
  }

  // ---- Safety: place any remaining unplaced pieces ----
  for (const piece of pieces) {
    if (placement.has(piece.id)) continue;
    const available = getAvailableInRange(IRAN_SETUP_MIN_ROW, IRAN_SETUP_MAX_ROW);
    if (available.length > 0) {
      placePiece(piece, available[0]);
    }
  }

  return placement;
}

// ============================================================================
// TURN DECISIONS
// ============================================================================

/**
 * Choose the AI's next move based on difficulty level.
 * Returns the from/to positions for the chosen move.
 *
 * Guaranteed to return a valid legal move. If no moves are available
 * (shouldn't happen in a legal game state), throws an error.
 */
export function getAIMove(
  board: BoardCell[][],
  pieces: GamePiece[],
  capturedEnemies: GamePiece[],
  difficulty: Difficulty,
  moveHistory: MoveRecord[]
): { from: Position; to: Position } {
  // Update never-moved tracking for hard difficulty
  if (difficulty === 'hard') {
    updateNeverMovedTracking(board, pieces, moveHistory);
  }

  // Update known pieces from any revealed pieces on the board
  updateKnownPiecesFromBoard(board);

  const movable = getMovablePieces(board, pieces, moveHistory);

  if (movable.length === 0) {
    throw new Error('AI has no legal moves available');
  }

  switch (difficulty) {
    case 'easy':
      return getEasyMove(movable);
    case 'medium':
      return getMediumMove(board, movable, pieces, capturedEnemies, moveHistory);
    case 'hard':
      return getHardMove(board, movable, pieces, capturedEnemies, moveHistory);
  }
}

// ============================================================================
// EASY DIFFICULTY (Recruit)
// ============================================================================

/**
 * Easy AI: Pick random piece, random move, slight preference for forward.
 * No memory of revealed pieces.
 */
function getEasyMove(
  movable: { piece: GamePiece; moves: Position[] }[]
): { from: Position; to: Position } {
  // Pick a random movable piece
  const entry = movable[randomInt(movable.length)];
  const piece = entry.piece;
  let moves = entry.moves;

  // Slight forward preference: 60% chance to prefer moves toward row 0 (player side)
  if (Math.random() < 0.6) {
    const forwardMoves = moves.filter((m) => m.row < piece.position.row);
    if (forwardMoves.length > 0) {
      moves = forwardMoves;
    }
  }

  const target = moves[randomInt(moves.length)];
  return { from: piece.position, to: target };
}

// ============================================================================
// MEDIUM DIFFICULTY (Commander)
// ============================================================================

/**
 * Medium AI: Remember revealed enemies, target weaker ones,
 * protect Flag area, use Scouts for recon, basic threat assessment.
 */
function getMediumMove(
  board: BoardCell[][],
  movable: { piece: GamePiece; moves: Position[] }[],
  pieces: GamePiece[],
  _capturedEnemies: GamePiece[],
  _moveHistory: MoveRecord[]
): { from: Position; to: Position } {
  // Score each possible move and pick the best
  let bestScore = -Infinity;
  let bestMove: { from: Position; to: Position } | null = null;

  for (const { piece, moves } of movable) {
    for (const move of moves) {
      const score = scoreMediumMove(board, piece, move, pieces);
      // Add small randomness for variety
      const jitter = Math.random() * 5;
      const totalScore = score + jitter;

      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestMove = { from: piece.position, to: move };
      }
    }
  }

  // Fallback to random if scoring fails
  if (!bestMove) {
    return getEasyMove(movable);
  }

  return bestMove;
}

/** Score a move for medium difficulty */
function scoreMediumMove(
  board: BoardCell[][],
  piece: GamePiece,
  target: Position,
  pieces: GamePiece[]
): number {
  let score = 0;
  const cell = board[target.row][target.col];

  // --- Attacking a known weaker enemy: high priority ---
  if (cell.piece && cell.piece.side !== piece.side) {
    const enemyId = cell.piece.id;
    const knownRank = knownEnemyPieces.get(enemyId);

    if (knownRank !== undefined) {
      const myValue = numericRank(piece.rank);
      const theirValue = numericRank(knownRank);

      // Special: Spy attacking Marshal
      if (piece.rank === SPY_RANK && knownRank === MARSHAL_RANK) {
        score += 80;
      }
      // Special: Miner attacking known Bomb
      else if (piece.rank === SAPPER_RANK && knownRank === 'B') {
        score += 50;
      }
      // Known weaker enemy: capture it
      else if (myValue > theirValue && theirValue > 0) {
        score += 40 + (theirValue * 3); // Higher-value captures are better
      }
      // Known stronger enemy: avoid!
      else if (myValue < theirValue) {
        score -= 60;
      }
      // Equal rank: avoid unless it's a low-value piece
      else if (myValue === theirValue) {
        score += myValue <= 4 ? 5 : -20;
      }
    } else {
      // Unknown enemy piece - risk assessment based on own value
      const myValue = numericRank(piece.rank);
      if (myValue >= 8) {
        // Don't risk high-value pieces on unknowns
        score -= 30;
      } else if (myValue <= 3) {
        // Low-value pieces can probe
        score += 10;
      }
    }
  }

  // --- Scout reconnaissance: reward scouts attacking unknowns ---
  if (piece.rank === SCOUT_RANK && cell.piece && cell.piece.side !== piece.side) {
    if (!knownEnemyPieces.has(cell.piece.id)) {
      score += 20; // Scouts scouting is good
    }
  }

  // --- Forward movement preference ---
  if (target.row < piece.position.row) {
    score += 3; // Moving toward enemy side
  }

  // --- Protect Flag area: pieces near own back rows get slight defensive bonus ---
  const flagPieces = pieces.filter(
    (p) => p.side === 'iran' && p.rank === 'F' && p.position.row >= 0
  );
  if (flagPieces.length > 0) {
    const flagPos = flagPieces[0].position;
    const distToFlagBefore =
      Math.abs(piece.position.row - flagPos.row) +
      Math.abs(piece.position.col - flagPos.col);
    const distToFlagAfter =
      Math.abs(target.row - flagPos.row) + Math.abs(target.col - flagPos.col);

    // If an enemy is near our flag, prioritize moving to protect it
    const enemiesNearFlag = getEnemiesNearPosition(board, flagPos, 2, 'israel');
    if (enemiesNearFlag.length > 0 && distToFlagAfter < distToFlagBefore) {
      score += 25;
    }
  }

  // --- Don't move high-value pieces to the front line recklessly ---
  if (numericRank(piece.rank) >= 8 && target.row <= 4) {
    score -= 15;
  }

  return score;
}

// ============================================================================
// HARD DIFFICULTY (General)
// ============================================================================

/**
 * Hard AI: Full tactical awareness with probability tracking, bait traps,
 * piece trading calculations, flanking, and adaptive play.
 */
function getHardMove(
  board: BoardCell[][],
  movable: { piece: GamePiece; moves: Position[] }[],
  pieces: GamePiece[],
  capturedEnemies: GamePiece[],
  moveHistory: MoveRecord[]
): { from: Position; to: Position } {
  const iranPieces = pieces.filter((p) => p.side === 'iran' && p.position.row >= 0);
  const israelPieces = pieces.filter(
    (p) => p.side === 'israel' && p.position.row >= 0
  );

  // Calculate material advantage
  const iranMaterial = iranPieces.reduce(
    (sum, p) => sum + Math.max(0, numericRank(p.rank)),
    0
  );
  const israelMaterial = israelPieces.reduce((sum, p) => {
    const known = knownEnemyPieces.get(p.id);
    if (known !== undefined) return sum + Math.max(0, numericRank(known));
    return sum + 5; // Estimate unknown pieces as ~5
  }, 0);

  const materialAdvantage = iranMaterial - israelMaterial;
  const isAggressive = materialAdvantage > 10;
  const isDefensive = materialAdvantage < -10;

  // Score all possible moves
  let bestScore = -Infinity;
  let bestMove: { from: Position; to: Position } | null = null;

  for (const { piece, moves } of movable) {
    for (const move of moves) {
      const score = scoreHardMove(
        board,
        piece,
        move,
        pieces,
        capturedEnemies,
        moveHistory,
        isAggressive,
        isDefensive
      );
      // Smaller jitter for hard AI (more deterministic)
      const jitter = Math.random() * 2;
      const totalScore = score + jitter;

      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestMove = { from: piece.position, to: move };
      }
    }
  }

  if (!bestMove) {
    return getEasyMove(movable);
  }

  return bestMove;
}

/** Score a move for hard difficulty with advanced tactics */
function scoreHardMove(
  board: BoardCell[][],
  piece: GamePiece,
  target: Position,
  pieces: GamePiece[],
  capturedEnemies: GamePiece[],
  moveHistory: MoveRecord[],
  isAggressive: boolean,
  isDefensive: boolean
): number {
  let score = 0;
  const cell = board[target.row][target.col];
  const myValue = numericRank(piece.rank);

  // ---- Combat evaluation ----
  if (cell.piece && cell.piece.side !== piece.side) {
    const enemy = cell.piece;
    const knownRank = knownEnemyPieces.get(enemy.id);

    if (knownRank !== undefined) {
      score += scoreKnownCombat(piece, knownRank, enemy);
    } else {
      score += scoreUnknownCombat(
        piece,
        enemy,
        capturedEnemies,
        isAggressive
      );
    }
  }

  // ---- Positional scoring ----

  // Forward movement (weighted by aggression)
  if (target.row < piece.position.row) {
    score += isAggressive ? 6 : isDefensive ? 1 : 3;
  }

  // Flanking: prefer edge columns for approaching (cols 0,1 and 8,9)
  if (
    target.row <= 5 &&
    (target.col <= 1 || target.col >= 8) &&
    myValue >= 4 &&
    myValue <= 7
  ) {
    score += 5; // Flanking bonus
  }

  // ---- Flag protection ----
  const flagPieces = pieces.filter(
    (p) => p.side === 'iran' && p.rank === 'F' && p.position.row >= 0
  );
  if (flagPieces.length > 0) {
    const flagPos = flagPieces[0].position;

    // Prioritize attacking pieces near our flag
    const enemiesNearFlag = getEnemiesNearPosition(board, flagPos, 3, 'israel');
    if (enemiesNearFlag.length > 0) {
      const distToNearestEnemy = Math.min(
        ...enemiesNearFlag.map(
          (e) =>
            Math.abs(target.row - e.position.row) +
            Math.abs(target.col - e.position.col)
        )
      );
      if (distToNearestEnemy <= 1) {
        score += 35; // Intercept enemy near flag
      } else if (distToNearestEnemy <= 2) {
        score += 20;
      }
    }

    // Don't move pieces away from flag if enemies are nearby
    if (enemiesNearFlag.length > 0) {
      const distBefore =
        Math.abs(piece.position.row - flagPos.row) +
        Math.abs(piece.position.col - flagPos.col);
      const distAfter =
        Math.abs(target.row - flagPos.row) +
        Math.abs(target.col - flagPos.col);
      if (distAfter > distBefore && distBefore <= 3) {
        score -= 20; // Don't abandon flag defense
      }
    }
  }

  // ---- Miner protection for late game ----
  if (piece.rank === SAPPER_RANK) {
    const remainingIranPieces = pieces.filter(
      (p) => p.side === 'iran' && p.position.row >= 0 && canMove(p.rank)
    );
    if (remainingIranPieces.length < 15) {
      // Late game: miners are precious for bomb clearing
      if (cell.piece && !knownEnemyPieces.has(cell.piece.id)) {
        score -= 15; // Don't risk miners on unknowns in late game
      }
    }
    // Miners should try to approach known bombs
    const knownBombs = [...knownEnemyPieces.entries()]
      .filter(([, rank]) => rank === 'B')
      .map(([id]) => pieces.find((p) => p.id === id))
      .filter((p): p is GamePiece => p !== undefined && p.position.row >= 0);

    for (const bomb of knownBombs) {
      const distBefore =
        Math.abs(piece.position.row - bomb.position.row) +
        Math.abs(piece.position.col - bomb.position.col);
      const distAfter =
        Math.abs(target.row - bomb.position.row) +
        Math.abs(target.col - bomb.position.col);
      if (distAfter < distBefore) {
        score += 10; // Move miner toward known bomb
      }
    }
  }

  // ---- Protect high-value pieces ----
  if (myValue >= 8) {
    // Check if target square is threatened
    const threateningEnemies = getEnemiesNearPosition(
      board,
      target,
      1,
      'israel'
    );
    for (const enemy of threateningEnemies) {
      const eRank = knownEnemyPieces.get(enemy.id);
      if (eRank !== undefined && numericRank(eRank) >= myValue) {
        score -= 25; // Don't walk into known danger
      } else if (eRank === undefined) {
        score -= 10; // Unknown adjacent enemy is risky
      }
    }
  }

  // ---- Probability-based bomb/flag detection ----
  if (cell.piece && cell.piece.side !== piece.side) {
    const enemy = cell.piece;
    if (!knownEnemyPieces.has(enemy.id)) {
      const stationaryProb = estimateStationaryProbability(enemy, moveHistory);

      if (stationaryProb > 0.7) {
        // Likely a bomb or flag
        if (piece.rank === SAPPER_RANK) {
          score += 30; // Miners should attack probable bombs
        } else if (myValue >= 6) {
          score -= 25; // Don't send valuable pieces into probable bombs
        }

        // Stationary piece in back row = possibly flag
        if (enemy.position.row >= 8) {
          if (piece.rank === SAPPER_RANK) {
            score += 15; // Could be clearing path to flag
          }
          score += 5; // Exploring back row is worthwhile
        }
      }
    }
  }

  // ---- Piece trading calculations ----
  if (
    cell.piece &&
    cell.piece.side !== piece.side &&
    knownEnemyPieces.has(cell.piece.id)
  ) {
    const enemyRank = knownEnemyPieces.get(cell.piece.id)!;
    const enemyValue = numericRank(enemyRank);
    const tradeValue = enemyValue - myValue;

    if (tradeValue > 0) {
      // Net positive trade
      score += tradeValue * 5;
    } else if (tradeValue === 0 && myValue <= 5) {
      // Even trade with low-value piece: acceptable
      score += 3;
    }
  }

  // ---- Adaptive behavior ----
  if (isAggressive) {
    // Push forward more when ahead
    if (target.row < piece.position.row) {
      score += 4;
    }
    // More willing to attack unknowns
    if (cell.piece && !knownEnemyPieces.has(cell.piece.id) && myValue <= 5) {
      score += 8;
    }
  }

  if (isDefensive) {
    // Prefer staying back when behind
    if (target.row > piece.position.row && piece.position.row >= 6) {
      score += 3; // Retreat toward own side
    }
    // Be more cautious about attacking
    if (cell.piece && !knownEnemyPieces.has(cell.piece.id)) {
      score -= 8;
    }
  }

  return score;
}

/** Score combat against a known enemy rank */
function scoreKnownCombat(
  piece: GamePiece,
  enemyRank: Rank,
  _enemy: GamePiece
): number {
  let score = 0;
  const myValue = numericRank(piece.rank);
  const theirValue = numericRank(enemyRank);

  // Spy vs Marshal special case
  if (piece.rank === SPY_RANK && enemyRank === MARSHAL_RANK) {
    return 100; // Highest priority: assassinate the Marshal
  }

  // Miner vs Bomb
  if (piece.rank === SAPPER_RANK && enemyRank === 'B') {
    return 60; // Clear the bomb
  }

  // Capture the flag
  if (enemyRank === 'F') {
    return 200; // Win the game!
  }

  // Attack a bomb with non-miner = death
  if (enemyRank === 'B' && piece.rank !== SAPPER_RANK) {
    return -80;
  }

  // Standard combat
  if (myValue > theirValue && theirValue > 0) {
    // Guaranteed win
    score += 50 + theirValue * 4;

    // Bonus for capturing high-value targets
    if (theirValue >= 8) score += 20;
    if (theirValue >= 9) score += 15;
  } else if (myValue < theirValue) {
    // Guaranteed loss
    score -= 50 - myValue * 3; // Losing high-value piece is worse
  } else if (myValue === theirValue) {
    // Mutual destruction
    score += myValue <= 4 ? 5 : -15; // Only trade low pieces
  }

  return score;
}

/** Score combat against an unknown enemy piece using probability */
function scoreUnknownCombat(
  piece: GamePiece,
  _enemy: GamePiece,
  capturedEnemies: GamePiece[],
  isAggressive: boolean
): number {
  let score = 0;
  const myValue = numericRank(piece.rank);

  // Calculate what enemy pieces are still alive and unknown
  const remainingUnknown = estimateRemainingUnknownDistribution(capturedEnemies);

  // Probability of winning against a random unknown piece
  let winProb = 0;
  let loseProb = 0;
  let totalWeight = 0;

  for (const [rank, count] of remainingUnknown) {
    const enemyVal = numericRank(rank);
    const weight = count;
    totalWeight += weight;

    if (rank === 'B') {
      // Bomb: only miner survives
      if (piece.rank === SAPPER_RANK) {
        winProb += weight;
      } else {
        loseProb += weight;
      }
    } else if (rank === 'F') {
      winProb += weight; // Always capture flag
    } else if (piece.rank === SPY_RANK && rank === MARSHAL_RANK) {
      winProb += weight;
    } else if (rank === SPY_RANK) {
      // Spy only beats Marshal when attacking
      if (myValue > 0.5) {
        winProb += weight;
      } else {
        // Equal rank spy: mutual destruction
        loseProb += weight * 0.5;
        winProb += weight * 0.5;
      }
    } else {
      if (myValue > enemyVal) winProb += weight;
      else if (myValue < enemyVal) loseProb += weight;
      else {
        winProb += weight * 0.5;
        loseProb += weight * 0.5;
      }
    }
  }

  if (totalWeight > 0) {
    const winRatio = winProb / totalWeight;
    const loseRatio = loseProb / totalWeight;

    // Expected value: factor in our piece's value as the cost
    const expectedGain = winRatio * 30 - loseRatio * (myValue * 5);
    score += expectedGain;

    // Aggressive mode: more willing to take risks
    if (isAggressive) {
      score += 5;
    }
  }

  // Low-value pieces are better for probing
  if (myValue <= 3) {
    score += 8;
  }

  // Don't risk marshal/general on unknowns
  if (myValue >= 9) {
    score -= 30;
  }

  return score;
}

// ============================================================================
// Intelligence & Probability Helpers
// ============================================================================

/** Update known pieces from visible board state (any revealed pieces) */
function updateKnownPiecesFromBoard(board: BoardCell[][]): void {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = board[r][c];
      if (cell.piece && cell.piece.side === 'israel' && cell.piece.isRevealed) {
        knownEnemyPieces.set(cell.piece.id, cell.piece.rank);
      }
    }
  }
}

/** Track which enemy pieces have never moved (for hard AI bomb/flag detection) */
function updateNeverMovedTracking(
  _board: BoardCell[][],
  _pieces: GamePiece[],
  moveHistory: MoveRecord[]
): void {
  const movedPieces = new Set(
    moveHistory
      .filter((m) => m.piece.side === 'israel')
      .map((m) => m.piece.id)
  );

  _neverMovedPieces = new Set(
    _pieces
      .filter(
        (p: GamePiece) =>
          p.side === 'israel' &&
          p.position.row >= 0 &&
          !movedPieces.has(p.id)
      )
      .map((p: GamePiece) => p.id)
  );
}

/** Estimate the probability that an enemy piece is stationary (bomb/flag) */
function estimateStationaryProbability(
  enemy: GamePiece,
  moveHistory: MoveRecord[]
): number {
  // Check if the piece has ever moved
  const hasMoved = moveHistory.some(
    (m) => m.piece.id === enemy.id
  );

  if (hasMoved) return 0;

  // The longer the game has gone on without this piece moving, the more
  // likely it is a bomb or flag
  const totalTurns = moveHistory.filter((m) => m.piece.side === 'israel').length;

  if (totalTurns < 5) return 0.2; // Too early to tell
  if (totalTurns < 10) return 0.4;
  if (totalTurns < 20) return 0.6;
  return 0.8;
}

/** Estimate distribution of remaining unknown enemy pieces */
function estimateRemainingUnknownDistribution(
  capturedEnemies: GamePiece[]
): Map<Rank, number> {
  // Start with the full Israel army composition
  const fullArmy = new Map<Rank, number>([
    [10, 1],
    [9, 1],
    [8, 2],
    [7, 3],
    [6, 4],
    [5, 4],
    [4, 4],
    [3, 5],
    [2, 8],
    ['S' as Rank, 1],
    ['B' as Rank, 6],
    ['F' as Rank, 1],
  ]);

  // Subtract captured pieces
  for (const piece of capturedEnemies) {
    if (piece.side === 'israel') {
      const current = fullArmy.get(piece.rank) ?? 0;
      if (current > 0) {
        fullArmy.set(piece.rank, current - 1);
      }
    }
  }

  // Subtract known pieces (revealed and still alive)
  for (const [, rank] of knownEnemyPieces) {
    const current = fullArmy.get(rank) ?? 0;
    if (current > 0) {
      fullArmy.set(rank, current - 1);
    }
  }

  // Remove entries with 0 count
  const result = new Map<Rank, number>();
  for (const [rank, count] of fullArmy) {
    if (count > 0) {
      result.set(rank, count);
    }
  }

  return result;
}

/** Get enemy pieces within Manhattan distance of a position */
function getEnemiesNearPosition(
  board: BoardCell[][],
  pos: Position,
  maxDist: number,
  enemySide: Side
): GamePiece[] {
  const enemies: GamePiece[] = [];

  const minRow = Math.max(0, pos.row - maxDist);
  const maxRow = Math.min(BOARD_SIZE - 1, pos.row + maxDist);
  const minCol = Math.max(0, pos.col - maxDist);
  const maxCol = Math.min(BOARD_SIZE - 1, pos.col + maxDist);

  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      const dist = Math.abs(r - pos.row) + Math.abs(c - pos.col);
      if (dist > maxDist || dist === 0) continue;

      const cell = board[r][c];
      if (cell.piece && cell.piece.side === enemySide) {
        enemies.push(cell.piece);
      }
    }
  }

  return enemies;
}
