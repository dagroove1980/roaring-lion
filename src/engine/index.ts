// ============================================================================
// Roaring Lion - Engine Module
// Re-exports all public engine functions for convenient importing.
// ============================================================================

export {
  createEmptyBoard,
  isLake,
  isValidPosition,
  getPieceAt,
  placePiece,
  removePiece,
  movePiece,
  getValidMoves,
  getAttackMoves,
  hasLegalMoves,
  isOscillatingMove,
  positionsEqual,
} from './BoardManager';

export {
  resolveCombat,
  isFlagCapture,
  describeCombat,
} from './CombatResolver';

export {
  initializeGame,
  isSetupComplete,
  placeSetupPiece,
  startGame,
  executeMove,
  switchTurn,
  checkWinCondition,
  getValidMovesForPiece,
  selectPiece,
  deselectPiece,
} from './GameEngine';

export {
  AI_THINK_DELAY,
  resetAIMemory,
  recordRevealedPiece,
  getKnownEnemyPieces,
  generateAISetup,
  getAIMove,
} from './AIController';
