// ============================================================================
// Roaring Lion - Game Constants
// Board configuration, army rosters, combat rules, and color palettes
// ============================================================================

import type { GamePiece, PieceType, Position, Rank, Side } from './types';

// ---------------------------------------------------------------------------
// Board Dimensions
// ---------------------------------------------------------------------------

/** Number of rows and columns on the board */
export const BOARD_SIZE = 10;

/** Pixel size of each cell for rendering */
export const CELL_SIZE = 72;

// ---------------------------------------------------------------------------
// Lake Positions (impassable terrain in the center of the board)
// Two 2x2 lakes, 0-indexed
// ---------------------------------------------------------------------------

export const LAKE_POSITIONS: Position[][] = [
  [
    { row: 4, col: 2 },
    { row: 4, col: 3 },
    { row: 5, col: 2 },
    { row: 5, col: 3 },
  ],
  [
    { row: 4, col: 6 },
    { row: 4, col: 7 },
    { row: 5, col: 6 },
    { row: 5, col: 7 },
  ],
];

/** Flat set of all lake positions for quick lookup */
export const LAKE_POSITION_SET: Set<string> = new Set(
  LAKE_POSITIONS.flat().map((p) => `${p.row},${p.col}`)
);

/** Check whether a given position is a lake cell */
export function isLakePosition(row: number, col: number): boolean {
  return LAKE_POSITION_SET.has(`${row},${col}`);
}

// ---------------------------------------------------------------------------
// Army Rosters
// ---------------------------------------------------------------------------

export const ISRAEL_ARMY: PieceType[] = [
  { rank: 10, unitName: 'Prime Minister', count: 1, description: 'Highest-ranking leader. Vulnerable to the Spy.' },
  { rank: 9, unitName: 'Chief of Staff', count: 1, description: 'Second in command. Powerful officer.' },
  { rank: 8, unitName: 'Aluf', count: 2, description: 'Major General. Senior field commander.' },
  { rank: 7, unitName: 'Sgan Aluf', count: 3, description: 'Lieutenant Colonel. Mid-rank officer.' },
  { rank: 6, unitName: 'Seren', count: 4, description: 'Captain. Reliable combat officer.' },
  { rank: 5, unitName: 'Segen', count: 4, description: 'Lieutenant. Junior officer.' },
  { rank: 4, unitName: 'Samal', count: 4, description: 'Sergeant. Experienced enlisted.' },
  { rank: 3, unitName: 'Sapper', count: 5, description: 'Combat engineer. Can defuse bombs.' },
  { rank: 2, unitName: 'Sayeret Recon', count: 8, description: 'Scout. Moves any number of open squares.' },
  { rank: 'S', unitName: 'Mossad Agent', count: 1, description: 'Spy. Defeats the 10 when attacking, but loses to all others.' },
  { rank: 'B', unitName: 'Iron Dome', count: 6, description: 'Bomb. Immovable. Destroys any attacker except sappers.' },
  { rank: 'F', unitName: 'Star of David Flag', count: 1, description: 'Flag. Capture to win. Cannot move.' },
];

export const IRAN_ARMY: PieceType[] = [
  { rank: 10, unitName: 'Supreme Leader', count: 1, description: 'Highest-ranking leader. Vulnerable to the Spy.' },
  { rank: 9, unitName: 'IRGC Commander', count: 1, description: 'Second in command. Powerful officer.' },
  { rank: 8, unitName: 'Arteshbod', count: 2, description: 'Major General. Senior field commander.' },
  { rank: 7, unitName: 'Sartip', count: 3, description: 'Brigadier General. Mid-rank officer.' },
  { rank: 6, unitName: 'Sarhang', count: 4, description: 'Colonel. Reliable combat officer.' },
  { rank: 5, unitName: 'Sotvan', count: 4, description: 'Lieutenant Colonel. Junior officer.' },
  { rank: 4, unitName: 'Goruban', count: 4, description: 'Sergeant Major. Experienced enlisted.' },
  { rank: 3, unitName: 'Mine Sweeper', count: 5, description: 'Combat engineer. Can defuse bombs.' },
  { rank: 2, unitName: 'Quds Force', count: 8, description: 'Scout. Moves any number of open squares.' },
  { rank: 'S', unitName: 'VAJA Agent', count: 1, description: 'Spy. Defeats the 10 when attacking, but loses to all others.' },
  { rank: 'B', unitName: 'Shahab Missile', count: 6, description: 'Bomb. Immovable. Destroys any attacker except sappers.' },
  { rank: 'F', unitName: 'Crescent Flag', count: 1, description: 'Flag. Capture to win. Cannot move.' },
];

// ---------------------------------------------------------------------------
// Rank Ordering (for combat resolution)
// ---------------------------------------------------------------------------

/**
 * Numeric value for each rank used in standard combat comparison.
 * Higher value wins. Spy (S) is 0.5 — special handling required.
 * Bombs (B) and Flags (F) are not directly comparable in normal combat;
 * they use special rules instead.
 */
export const RANK_ORDER: Record<string, number> = {
  '10': 10,
  '9': 9,
  '8': 8,
  '7': 7,
  '6': 6,
  '5': 5,
  '4': 4,
  '3': 3,
  '2': 2,
  'S': 0.5,
  'B': -1, // Not directly comparable — special rules
  'F': -2, // Not directly comparable — auto-capture
};

/**
 * Get the numeric combat value for a rank.
 * Returns the value from RANK_ORDER, or 0 if not found.
 */
export function getRankValue(rank: Rank): number {
  return RANK_ORDER[String(rank)] ?? 0;
}

// ---------------------------------------------------------------------------
// Color Palettes
// ---------------------------------------------------------------------------

export const ISRAEL_COLORS = {
  primary: '#0038b8',       // Israeli blue
  secondary: '#ffffff',     // White
  accent: '#c5a93a',        // Gold accent
  bg: '#e8f0fe',            // Light blue background
  bgDark: '#1a2744',        // Dark navy for cards
  text: '#ffffff',          // Text on dark backgrounds
  textDark: '#0d1b3e',      // Text on light backgrounds
  border: '#0038b8',        // Border color
  highlight: '#4d8af0',     // Selection highlight
  captured: '#ff4444',      // Captured piece indicator
};

export const IRAN_COLORS = {
  primary: '#239f40',       // Iranian green
  secondary: '#ffffff',     // White
  accent: '#da0000',        // Red accent
  bg: '#e8f5e9',            // Light green background
  bgDark: '#1a3a1f',        // Dark green for cards
  text: '#ffffff',          // Text on dark backgrounds
  textDark: '#0d2e12',      // Text on light backgrounds
  border: '#239f40',        // Border color
  highlight: '#66cc80',     // Selection highlight
  captured: '#ff4444',      // Captured piece indicator
};

/** Retrieve the color palette for a given side */
export function getColorsForSide(side: Side) {
  return side === 'israel' ? ISRAEL_COLORS : IRAN_COLORS;
}

// ---------------------------------------------------------------------------
// Army Factory
// ---------------------------------------------------------------------------

/**
 * Create all 40 pieces for a given side, each with a unique ID.
 * Pieces are created in an unplaced state (position {row: -1, col: -1})
 * for use in the setup tray.
 */
export function createArmy(side: Side): GamePiece[] {
  const roster = side === 'israel' ? ISRAEL_ARMY : IRAN_ARMY;
  const pieces: GamePiece[] = [];
  let index = 0;

  for (const pieceType of roster) {
    for (let i = 0; i < pieceType.count; i++) {
      pieces.push({
        id: `${side}-${String(pieceType.rank)}-${index}`,
        side,
        rank: pieceType.rank,
        unitName: pieceType.unitName,
        isRevealed: false,
        hasMoved: false,
        position: { row: -1, col: -1 }, // Unplaced — will be set during setup
      });
      index++;
    }
  }

  return pieces;
}

// ---------------------------------------------------------------------------
// Piece Mobility Helpers
// ---------------------------------------------------------------------------

/** Ranks that cannot move (bombs and flags) */
export const IMMOVABLE_RANKS: Rank[] = ['B', 'F'];

/** The scout rank, which can move multiple squares in a straight line */
export const SCOUT_RANK: Rank = 2;

/** The sapper/minesweeper rank, which can defuse bombs */
export const SAPPER_RANK: Rank = 3;

/** The spy rank, which can assassinate the highest-ranking officer */
export const SPY_RANK: Rank = 'S';

/** The highest officer rank, vulnerable to the spy */
export const MARSHAL_RANK: Rank = 10;

/** Check whether a piece with the given rank can move */
export function canMove(rank: Rank): boolean {
  return !IMMOVABLE_RANKS.includes(rank);
}

/** Check whether a piece is a scout (can move multiple cells) */
export function isScout(rank: Rank): boolean {
  return rank === SCOUT_RANK;
}

// ---------------------------------------------------------------------------
// Game Setup
// ---------------------------------------------------------------------------

/** Total number of pieces per side (must equal the sum of all counts in the army roster) */
export const PIECES_PER_SIDE = 40;

/** Number of rows available for each side's initial placement (rows 0-3 for Iran, rows 6-9 for Israel) */
export const SETUP_ROWS = 4;

// ---------------------------------------------------------------------------
// Anti-Stall
// ---------------------------------------------------------------------------

/**
 * Number of consecutive back-and-forth moves between the same two squares
 * before the anti-stall rule blocks the move.
 * With a threshold of 3, a piece can go A->B, B->A, but the third move
 * back to B is blocked.
 */
export const ANTI_STALL_THRESHOLD = 3;
