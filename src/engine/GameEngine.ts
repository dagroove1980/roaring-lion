// ============================================================================
// Roaring Lion - Game Engine
// Top-level game orchestrator: initialisation, move execution, turn
// management, and win-condition checking. All functions are pure.
// ============================================================================

import type {
  Difficulty,
  GamePiece,
  GameState,
  MoveRecord,
  Position,
  Side,
} from '../types';

import {
  BOARD_SIZE,
  PIECES_PER_SIDE,
  createArmy,
} from '../constants';

import {
  createEmptyBoard,
  getValidMoves,
  getPieceAt,
  hasLegalMoves,
  movePiece as boardMovePiece,
  removePiece,
  placePiece,
  positionsEqual,
} from './BoardManager';

import { isFlagCapture, resolveCombat } from './CombatResolver';

// ---------------------------------------------------------------------------
// Game Initialisation
// ---------------------------------------------------------------------------

/**
 * Create a fresh game state ready for the setup phase.
 *
 * The board is empty, pieces are placed in each side's `setupPieces` tray,
 * and the phase starts at 'setup'. The human player (Israel) places pieces
 * first; the AI's pieces will be auto-placed by the AI module.
 */
export function initializeGame(difficulty: Difficulty = 'medium'): GameState {
  const board = createEmptyBoard();
  const israelPieces = createArmy('israel');
  const iranPieces = createArmy('iran');

  return {
    board,
    currentTurn: 'israel',
    phase: 'setup',
    selectedPiece: null,
    validMoves: [],
    israelPieces: [],    // Populated as pieces are placed during setup
    iranPieces: [],      // Populated as pieces are placed during setup
    capturedByIsrael: [],
    capturedByIran: [],
    moveHistory: [],
    turnNumber: 1,
    difficulty,
    setupPieces: [...israelPieces, ...iranPieces], // Both armies in tray; player places Israel, AI places Iran
    winner: null,
  };
}

// ---------------------------------------------------------------------------
// Setup Phase
// ---------------------------------------------------------------------------

/**
 * Check whether the setup phase is complete:
 * both sides must have all 40 pieces placed on the board.
 */
export function isSetupComplete(state: GameState): boolean {
  return (
    state.israelPieces.length === PIECES_PER_SIDE &&
    state.iranPieces.length === PIECES_PER_SIDE
  );
}

/**
 * Place a piece from the setup tray onto the board during the setup phase.
 * Returns a new game state. The piece is removed from `setupPieces` and
 * added to the appropriate side's active pieces array.
 *
 * @param state   Current game state (must be in 'setup' phase)
 * @param pieceId The piece ID from setupPieces to place
 * @param pos     The board position to place it at
 */
export function placeSetupPiece(
  state: GameState,
  pieceId: string,
  pos: Position
): GameState {
  const piece = state.setupPieces.find((p) => p.id === pieceId);
  if (!piece) {
    return state; // Piece not found in tray
  }

  // Validate position is within the side's setup zone
  if (!isValidSetupPosition(pos, piece.side)) {
    return state;
  }

  // Ensure target cell is empty
  if (getPieceAt(state.board, pos) !== null) {
    return state;
  }

  const placedPiece: GamePiece = {
    ...piece,
    position: { row: pos.row, col: pos.col },
  };

  const newBoard = placePiece(state.board, placedPiece, pos);

  const newSetupPieces = state.setupPieces.filter((p) => p.id !== pieceId);

  const newIsraelPieces =
    piece.side === 'israel'
      ? [...state.israelPieces, placedPiece]
      : state.israelPieces;

  const newIranPieces =
    piece.side === 'iran'
      ? [...state.iranPieces, placedPiece]
      : state.iranPieces;

  return {
    ...state,
    board: newBoard,
    setupPieces: newSetupPieces,
    israelPieces: newIsraelPieces,
    iranPieces: newIranPieces,
  };
}

/**
 * Check whether a position is within the valid setup zone for a side.
 * Israel sets up in rows 6-9 (bottom), Iran in rows 0-3 (top).
 */
function isValidSetupPosition(pos: Position, side: Side): boolean {
  const { row, col } = pos;
  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
    return false;
  }
  if (side === 'israel') {
    return row >= 6 && row <= 9;
  }
  return row >= 0 && row <= 3;
}

/**
 * Transition from setup phase to playing phase.
 * Should only be called once both sides' pieces are fully placed.
 */
export function startGame(state: GameState): GameState {
  if (!isSetupComplete(state)) {
    return state;
  }

  return {
    ...state,
    phase: 'playing',
    currentTurn: 'israel', // Israel always moves first
    selectedPiece: null,
    validMoves: [],
  };
}

// ---------------------------------------------------------------------------
// Move Execution
// ---------------------------------------------------------------------------

/**
 * Execute a move from one position to another.
 *
 * This handles:
 * 1. Validation: the move must be in the piece's valid moves.
 * 2. Combat: if the destination has an enemy piece, resolve combat.
 * 3. Board update: move/remove pieces as needed.
 * 4. History: record the move.
 * 5. Win check: if a flag is captured or a side has no moves.
 * 6. Turn switch: advance to the next turn.
 *
 * Returns a new GameState. The original is never mutated.
 */
export function executeMove(
  state: GameState,
  from: Position,
  to: Position
): GameState {
  if (state.phase !== 'playing') {
    return state;
  }

  const piece = getPieceAt(state.board, from);
  if (!piece || piece.side !== state.currentTurn) {
    return state; // Not this side's piece
  }

  // Validate the move
  const validMoves = getValidMoves(state.board, piece, state.moveHistory);
  const isValid = validMoves.some((m) => positionsEqual(m, to));
  if (!isValid) {
    return state;
  }

  const defender = getPieceAt(state.board, to);

  // --- No combat: simple move ---
  if (!defender) {
    const newBoard = boardMovePiece(state.board, from, to);
    const movedPiece: GamePiece = {
      ...piece,
      position: { row: to.row, col: to.col },
      hasMoved: true,
    };

    const moveRecord: MoveRecord = {
      piece: { ...piece },
      from: { ...from },
      to: { ...to },
      turn: state.turnNumber,
    };

    const newState = {
      ...state,
      board: newBoard,
      moveHistory: [...state.moveHistory, moveRecord],
      selectedPiece: null,
      validMoves: [],
      ...updatePieceArrays(state, piece, movedPiece, null, null),
    };

    return finalizeTurn(newState);
  }

  // --- Combat ---
  const combat = resolveCombat(piece, defender);

  const moveRecord: MoveRecord = {
    piece: { ...piece },
    from: { ...from },
    to: { ...to },
    combat,
    turn: state.turnNumber,
  };

  let newBoard = state.board;

  // Always clear the attacker's origin
  newBoard = removePiece(newBoard, from);

  if (combat.attackerDestroyed && combat.defenderDestroyed) {
    // Both destroyed: clear defender's position too
    newBoard = removePiece(newBoard, to);
  } else if (combat.attackerDestroyed) {
    // Attacker destroyed, defender stays (already on the board)
    // Update the defender to be revealed
    const revealedDefender: GamePiece = { ...defender, isRevealed: true };
    newBoard = removePiece(newBoard, to);
    newBoard = placePiece(newBoard, revealedDefender, to);
  } else if (combat.defenderDestroyed) {
    // Defender destroyed, attacker moves to that square
    newBoard = removePiece(newBoard, to);
    const victoriousAttacker: GamePiece = {
      ...piece,
      position: { row: to.row, col: to.col },
      hasMoved: true,
      isRevealed: true,
    };
    newBoard = placePiece(newBoard, victoriousAttacker, to);
  }

  // Determine the surviving attacker (if any) for piece array updates
  const survivingAttacker = combat.attackerDestroyed
    ? null
    : {
        ...piece,
        position: { row: to.row, col: to.col },
        hasMoved: true,
        isRevealed: true,
      };

  const survivingDefender = combat.defenderDestroyed
    ? null
    : { ...defender, isRevealed: true };

  // Build captured lists
  const newCapturedByIsrael = [...state.capturedByIsrael];
  const newCapturedByIran = [...state.capturedByIran];

  if (combat.defenderDestroyed) {
    if (defender.side === 'iran') {
      newCapturedByIsrael.push({ ...defender, isRevealed: true });
    } else {
      newCapturedByIran.push({ ...defender, isRevealed: true });
    }
  }

  if (combat.attackerDestroyed) {
    if (piece.side === 'iran') {
      newCapturedByIsrael.push({ ...piece, isRevealed: true });
    } else {
      newCapturedByIran.push({ ...piece, isRevealed: true });
    }
  }

  const newState: GameState = {
    ...state,
    board: newBoard,
    moveHistory: [...state.moveHistory, moveRecord],
    capturedByIsrael: newCapturedByIsrael,
    capturedByIran: newCapturedByIran,
    selectedPiece: null,
    validMoves: [],
    ...updatePieceArraysAfterCombat(
      state,
      piece,
      defender,
      survivingAttacker,
      survivingDefender
    ),
  };

  // Check for flag capture — immediate game over
  if (isFlagCapture(combat)) {
    return {
      ...newState,
      phase: 'gameOver',
      winner: piece.side,
    };
  }

  return finalizeTurn(newState);
}

// ---------------------------------------------------------------------------
// Turn Management
// ---------------------------------------------------------------------------

/** Switch the current turn to the other side. */
export function switchTurn(state: GameState): GameState {
  const nextSide: Side = state.currentTurn === 'israel' ? 'iran' : 'israel';
  const nextTurnNumber =
    state.currentTurn === 'iran' ? state.turnNumber + 1 : state.turnNumber;

  return {
    ...state,
    currentTurn: nextSide,
    turnNumber: nextTurnNumber,
  };
}

/**
 * Finalize a turn: switch sides, check win conditions.
 * Called internally after a move is executed.
 */
function finalizeTurn(state: GameState): GameState {
  const nextState = switchTurn(state);

  // Check if the next player has any legal moves
  const winCheck = checkWinCondition(nextState);
  if (winCheck) {
    return {
      ...nextState,
      phase: 'gameOver',
      winner: winCheck,
    };
  }

  return nextState;
}

// ---------------------------------------------------------------------------
// Win Condition
// ---------------------------------------------------------------------------

/**
 * Check whether the game is over.
 *
 * Win conditions:
 * 1. A side's flag has been captured (handled in executeMove via isFlagCapture).
 * 2. A side has no pieces that can make a legal move.
 *
 * @returns The winning side, or null if the game continues.
 */
export function checkWinCondition(state: GameState): Side | null {
  // If the current player has no legal moves, they lose
  if (!hasLegalMoves(state.board, state.currentTurn, state.moveHistory)) {
    return state.currentTurn === 'israel' ? 'iran' : 'israel';
  }

  return null;
}

// ---------------------------------------------------------------------------
// Piece Selection & Valid Moves Query
// ---------------------------------------------------------------------------

/**
 * Get valid moves for a specific piece identified by its ID.
 * Returns an empty array if the piece is not found or not on the board.
 */
export function getValidMovesForPiece(
  state: GameState,
  pieceId: string
): Position[] {
  const allPieces = [...state.israelPieces, ...state.iranPieces];
  const piece = allPieces.find((p) => p.id === pieceId);

  if (!piece) {
    return [];
  }

  // Only allow moves for pieces belonging to the current turn's side
  if (piece.side !== state.currentTurn) {
    return [];
  }

  return getValidMoves(state.board, piece, state.moveHistory);
}

/**
 * Select a piece and compute its valid moves, updating the game state
 * for UI highlighting.
 */
export function selectPiece(
  state: GameState,
  pieceId: string
): GameState {
  if (state.phase !== 'playing') {
    return state;
  }

  const allPieces = [...state.israelPieces, ...state.iranPieces];
  const piece = allPieces.find((p) => p.id === pieceId);

  if (!piece || piece.side !== state.currentTurn) {
    return { ...state, selectedPiece: null, validMoves: [] };
  }

  const validMoves = getValidMoves(state.board, piece, state.moveHistory);

  return {
    ...state,
    selectedPiece: piece,
    validMoves,
  };
}

/** Deselect the currently selected piece. */
export function deselectPiece(state: GameState): GameState {
  return {
    ...state,
    selectedPiece: null,
    validMoves: [],
  };
}

// ---------------------------------------------------------------------------
// Internal Helpers — Piece Array Management
// ---------------------------------------------------------------------------

/**
 * Update the israelPieces / iranPieces arrays after a non-combat move.
 * Replaces the old piece entry with the moved piece.
 */
function updatePieceArrays(
  state: GameState,
  oldPiece: GamePiece,
  newPiece: GamePiece,
  _removedIsrael: GamePiece | null,
  _removedIran: GamePiece | null
): { israelPieces: GamePiece[]; iranPieces: GamePiece[] } {
  const replacePiece = (pieces: GamePiece[]) =>
    pieces.map((p) => (p.id === oldPiece.id ? newPiece : p));

  return {
    israelPieces:
      oldPiece.side === 'israel'
        ? replacePiece(state.israelPieces)
        : state.israelPieces,
    iranPieces:
      oldPiece.side === 'iran'
        ? replacePiece(state.iranPieces)
        : state.iranPieces,
  };
}

/**
 * Update the israelPieces / iranPieces arrays after combat.
 * Removes destroyed pieces and updates surviving pieces.
 */
function updatePieceArraysAfterCombat(
  state: GameState,
  attacker: GamePiece,
  defender: GamePiece,
  survivingAttacker: GamePiece | null,
  survivingDefender: GamePiece | null
): { israelPieces: GamePiece[]; iranPieces: GamePiece[] } {
  let israelPieces = [...state.israelPieces];
  let iranPieces = [...state.iranPieces];

  // Handle attacker
  if (attacker.side === 'israel') {
    if (survivingAttacker) {
      israelPieces = israelPieces.map((p) =>
        p.id === attacker.id ? survivingAttacker : p
      );
    } else {
      israelPieces = israelPieces.filter((p) => p.id !== attacker.id);
    }
  } else {
    if (survivingAttacker) {
      iranPieces = iranPieces.map((p) =>
        p.id === attacker.id ? survivingAttacker : p
      );
    } else {
      iranPieces = iranPieces.filter((p) => p.id !== attacker.id);
    }
  }

  // Handle defender
  if (defender.side === 'israel') {
    if (survivingDefender) {
      israelPieces = israelPieces.map((p) =>
        p.id === defender.id ? survivingDefender : p
      );
    } else {
      israelPieces = israelPieces.filter((p) => p.id !== defender.id);
    }
  } else {
    if (survivingDefender) {
      iranPieces = iranPieces.map((p) =>
        p.id === defender.id ? survivingDefender : p
      );
    } else {
      iranPieces = iranPieces.filter((p) => p.id !== defender.id);
    }
  }

  return { israelPieces, iranPieces };
}
