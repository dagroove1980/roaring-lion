import { create } from 'zustand';
import type { BoardCell, Difficulty, GamePiece, GameState, MoveRecord, Position, Side } from '../types';
import { BOARD_SIZE, createArmy, isLakePosition } from '../constants';

function createEmptyBoard(): BoardCell[][] {
  const board: BoardCell[][] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    board[row] = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      board[row][col] = { piece: null, isLake: isLakePosition(row, col) };
    }
  }
  return board;
}

interface GameStore extends GameState {
  // Menu actions
  startNewGame: (difficulty: Difficulty) => void;
  returnToMenu: () => void;

  // Setup actions
  placePieceOnBoard: (pieceId: string, pos: Position) => void;
  removePieceFromBoard: (pos: Position) => void;
  randomizeSetup: () => void;
  clearSetup: () => void;
  confirmSetup: () => void;

  // Gameplay actions
  selectPiece: (piece: GamePiece) => void;
  clearSelection: () => void;
  executeMove: (to: Position) => void;
  executeBattle: () => void;

  // Battle popup
  battleResult: {
    attacker: GamePiece;
    defender: GamePiece;
    winner: GamePiece | null;
    attackerDestroyed: boolean;
    defenderDestroyed: boolean;
  } | null;
  setBattleResult: (result: GameStore['battleResult']) => void;

  // AI
  executeAIMove: () => void;
  aiThinking: boolean;

  // Game stats
  gameStartTime: number;
  showRules: boolean;
  setShowRules: (show: boolean) => void;
}

// Anti-stall tracking
const moveTracker = new Map<string, Position[]>();

function isAntiStallViolation(pieceId: string, to: Position): boolean {
  const history = moveTracker.get(pieceId) || [];
  if (history.length < 4) return false;
  const last4 = [...history.slice(-3), to];
  return (
    last4[0].row === last4[2].row && last4[0].col === last4[2].col &&
    last4[1].row === last4[3].row && last4[1].col === last4[3].col
  );
}

function trackMove(pieceId: string, pos: Position) {
  const history = moveTracker.get(pieceId) || [];
  history.push(pos);
  if (history.length > 6) history.shift();
  moveTracker.set(pieceId, history);
}

function getValidMoves(board: BoardCell[][], piece: GamePiece): Position[] {
  const moves: Position[] = [];
  if (piece.rank === 'B' || piece.rank === 'F') return moves;

  const { row, col } = piece.position;
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  if (piece.rank === 2) {
    // Scout: move any number of squares in a straight line
    for (const [dr, dc] of directions) {
      for (let dist = 1; dist < BOARD_SIZE; dist++) {
        const nr = row + dr * dist;
        const nc = col + dc * dist;
        if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) break;
        if (board[nr][nc].isLake) break;
        if (board[nr][nc].piece) {
          if (board[nr][nc].piece!.side !== piece.side) {
            const pos = { row: nr, col: nc };
            if (!isAntiStallViolation(piece.id, pos)) moves.push(pos);
          }
          break; // Can't jump over pieces
        }
        const pos = { row: nr, col: nc };
        if (!isAntiStallViolation(piece.id, pos)) moves.push(pos);
      }
    }
  } else {
    // Normal pieces: move 1 square
    for (const [dr, dc] of directions) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) continue;
      if (board[nr][nc].isLake) continue;
      if (board[nr][nc].piece && board[nr][nc].piece!.side === piece.side) continue;
      const pos = { row: nr, col: nc };
      if (!isAntiStallViolation(piece.id, pos)) moves.push(pos);
    }
  }

  return moves;
}

function resolveCombat(attacker: GamePiece, defender: GamePiece) {
  // Flag captured
  if (defender.rank === 'F') {
    return { attacker, defender, winner: attacker, attackerDestroyed: false, defenderDestroyed: true };
  }

  // Bomb
  if (defender.rank === 'B') {
    if (attacker.rank === 3) {
      // Miner defuses bomb
      return { attacker, defender, winner: attacker, attackerDestroyed: false, defenderDestroyed: true };
    }
    // Bomb destroys attacker
    return { attacker, defender, winner: defender, attackerDestroyed: true, defenderDestroyed: false };
  }

  // Spy attacks Marshal
  if (attacker.rank === 'S' && defender.rank === 10) {
    return { attacker, defender, winner: attacker, attackerDestroyed: false, defenderDestroyed: true };
  }

  // Spy loses to everything else on attack, or when attacked
  if (attacker.rank === 'S') {
    return { attacker, defender, winner: defender, attackerDestroyed: true, defenderDestroyed: false };
  }
  if (defender.rank === 'S') {
    return { attacker, defender, winner: attacker, attackerDestroyed: false, defenderDestroyed: true };
  }

  // Normal combat: higher rank wins
  const aRank = attacker.rank as number;
  const dRank = defender.rank as number;

  if (aRank > dRank) {
    return { attacker, defender, winner: attacker, attackerDestroyed: false, defenderDestroyed: true };
  } else if (dRank > aRank) {
    return { attacker, defender, winner: defender, attackerDestroyed: true, defenderDestroyed: false };
  } else {
    // Equal ranks: both destroyed
    return { attacker, defender, winner: null, attackerDestroyed: true, defenderDestroyed: true };
  }
}

function hasLegalMoves(board: BoardCell[][], side: Side): boolean {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col].piece;
      if (piece && piece.side === side && piece.rank !== 'B' && piece.rank !== 'F') {
        if (getValidMoves(board, piece).length > 0) return true;
      }
    }
  }
  return false;
}

// AI Logic
function generateAISetup(pieces: GamePiece[]): GamePiece[] {
  const placed: boolean[][] = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(false));
  // Mark lakes
  for (let r = 0; r < BOARD_SIZE; r++)
    for (let c = 0; c < BOARD_SIZE; c++)
      if (isLakePosition(r, c)) placed[r][c] = true;
  // Mark non-AI rows
  for (let r = 0; r < 6; r++)
    for (let c = 0; c < BOARD_SIZE; c++)
      placed[r][c] = true;

  const getOpen = (rows: number[]): Position[] => {
    const open: Position[] = [];
    for (const r of rows)
      for (let c = 0; c < BOARD_SIZE; c++)
        if (!placed[r][c]) open.push({ row: r, col: c });
    return open;
  };

  const placeAt = (piece: GamePiece, pos: Position): GamePiece => {
    placed[pos.row][pos.col] = true;
    return { ...piece, position: pos };
  };

  const shuffle = <T>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const result: GamePiece[] = [];
  const byRank = new Map<string, GamePiece[]>();
  for (const p of pieces) {
    const key = String(p.rank);
    if (!byRank.has(key)) byRank.set(key, []);
    byRank.get(key)!.push(p);
  }

  // Place Flag in back row (row 9), center area
  const flag = byRank.get('F')![0];
  const flagCols = shuffle([3, 4, 5, 6]);
  const flagPos = { row: 9, col: flagCols[0] };
  result.push(placeAt(flag, flagPos));

  // Place 2-3 Bombs around flag
  const bombs = byRank.get('B')!;
  const bombPositions: Position[] = [];
  for (const [dr, dc] of [[-1, 0], [0, -1], [0, 1], [1, 0]]) {
    const r = flagPos.row + dr, c = flagPos.col + dc;
    if (r >= 6 && r <= 9 && c >= 0 && c < BOARD_SIZE && !placed[r][c]) {
      bombPositions.push({ row: r, col: c });
    }
  }
  const shuffledBombPos = shuffle(bombPositions);
  let bombIdx = 0;
  for (let i = 0; i < Math.min(3, shuffledBombPos.length, bombs.length); i++) {
    result.push(placeAt(bombs[bombIdx++], shuffledBombPos[i]));
  }
  // Remaining bombs in front-ish positions
  while (bombIdx < bombs.length) {
    const open = shuffle(getOpen([6, 7, 8, 9]));
    if (open.length > 0) result.push(placeAt(bombs[bombIdx], open[0]));
    bombIdx++;
  }

  // Place high-rank pieces (10, 9, 8) in protected rows
  for (const rank of ['10', '9', '8']) {
    const pcs = byRank.get(rank) || [];
    for (const p of pcs) {
      const open = shuffle(getOpen([7, 8, 9]));
      if (open.length > 0) result.push(placeAt(p, open[0]));
    }
  }

  // Scouts in front rows
  const scouts = byRank.get('2') || [];
  for (const p of scouts) {
    const open = shuffle(getOpen([6, 7]));
    if (open.length > 0) result.push(placeAt(p, open[0]));
    else {
      const any = shuffle(getOpen([6, 7, 8, 9]));
      if (any.length > 0) result.push(placeAt(p, any[0]));
    }
  }

  // Spy near generals
  const spy = byRank.get('S')?.[0];
  if (spy) {
    const open = shuffle(getOpen([7, 8]));
    if (open.length > 0) result.push(placeAt(spy, open[0]));
  }

  // Remaining pieces
  for (const [, pcs] of byRank.entries()) {
    for (const p of pcs) {
      if (result.find(r => r.id === p.id)) continue;
      const open = shuffle(getOpen([6, 7, 8, 9]));
      if (open.length > 0) result.push(placeAt(p, open[0]));
    }
  }

  return result;
}

function getAIMove(board: BoardCell[][], difficulty: Difficulty): { from: Position; to: Position } | null {
  // Collect all movable AI pieces with valid moves
  const candidates: { piece: GamePiece; moves: Position[] }[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c].piece;
      if (piece && piece.side === 'iran' && piece.rank !== 'B' && piece.rank !== 'F') {
        const moves = getValidMoves(board, piece);
        if (moves.length > 0) candidates.push({ piece, moves });
      }
    }
  }
  if (candidates.length === 0) return null;

  const rand = (arr: Position[]) => arr[Math.floor(Math.random() * arr.length)];

  if (difficulty === 'easy') {
    // Random move with slight forward preference
    const choice = candidates[Math.floor(Math.random() * candidates.length)];
    const forwardMoves = choice.moves.filter(m => m.row < choice.piece.position.row);
    if (forwardMoves.length > 0 && Math.random() < 0.6) {
      return { from: choice.piece.position, to: rand(forwardMoves) };
    }
    return { from: choice.piece.position, to: rand(choice.moves) };
  }

  if (difficulty === 'medium') {
    // Target revealed weaker enemies
    for (const { piece, moves } of candidates) {
      const attacks = moves.filter(m => {
        const target = board[m.row][m.col].piece;
        return target && target.isRevealed;
      });
      for (const atk of attacks) {
        const target = board[atk.row][atk.col].piece!;
        if (target.isRevealed) {
          const myVal = piece.rank === 'S' ? 0.5 : piece.rank as number;
          const theirVal = target.rank === 'S' ? 0.5 : target.rank === 'F' ? -2 : target.rank as number;
          if (myVal > theirVal || (piece.rank === 'S' && target.rank === 10) || target.rank === 'F') {
            return { from: piece.position, to: atk };
          }
        }
      }
    }
    // Otherwise advance scouts or move forward
    const scouts = candidates.filter(c => c.piece.rank === 2);
    if (scouts.length > 0 && Math.random() < 0.4) {
      const s = scouts[Math.floor(Math.random() * scouts.length)];
      const forward = s.moves.filter(m => m.row < s.piece.position.row);
      if (forward.length > 0) return { from: s.piece.position, to: rand(forward) };
    }
    const choice = candidates[Math.floor(Math.random() * candidates.length)];
    return { from: choice.piece.position, to: rand(choice.moves) };
  }

  // Hard difficulty
  // Priority 1: Capture revealed weaker enemies
  let bestAttack: { from: Position; to: Position; value: number } | null = null;
  for (const { piece, moves } of candidates) {
    const attacks = moves.filter(m => board[m.row][m.col].piece != null);
    for (const atk of attacks) {
      const target = board[atk.row][atk.col].piece!;
      let value = 0;
      if (target.rank === 'F') value = 1000;
      else if (target.isRevealed) {
        const myVal = piece.rank === 'S' ? 0.5 : piece.rank as number;
        const theirVal = target.rank === 'S' ? 0.5 : target.rank as number;
        if (piece.rank === 'S' && target.rank === 10) value = 50;
        else if (piece.rank === 3 && target.rank === 'B') value = 30;
        else if (myVal > theirVal) value = theirVal + 5;
      } else {
        // Unknown enemy - risky. Use low-rank pieces to scout
        if ((piece.rank as number) <= 4) value = 2;
        // Stationary pieces are likely bombs/flags
        if (!target.hasMoved) {
          if (piece.rank === 3) value = 15; // Miner vs possible bomb
        }
      }
      if (value > 0 && (!bestAttack || value > bestAttack.value)) {
        bestAttack = { from: piece.position, to: atk, value };
      }
    }
  }
  if (bestAttack && bestAttack.value > 3) {
    return { from: bestAttack.from, to: bestAttack.to };
  }

  // Priority 2: Scout for intel
  const scouts = candidates.filter(c => c.piece.rank === 2);
  if (scouts.length > 0 && Math.random() < 0.3) {
    const s = scouts[Math.floor(Math.random() * scouts.length)];
    const forward = s.moves.filter(m => m.row < s.piece.position.row);
    if (forward.length > 0) return { from: s.piece.position, to: rand(forward) };
  }

  // Priority 3: Advance mid-rank pieces
  const midRank = candidates.filter(c => {
    const r = c.piece.rank;
    return typeof r === 'number' && r >= 4 && r <= 7;
  });
  if (midRank.length > 0 && Math.random() < 0.5) {
    const choice = midRank[Math.floor(Math.random() * midRank.length)];
    const forward = choice.moves.filter(m => m.row < choice.piece.position.row);
    if (forward.length > 0) return { from: choice.piece.position, to: rand(forward) };
  }

  // Low priority attack
  if (bestAttack) return { from: bestAttack.from, to: bestAttack.to };

  // Default: random move
  const choice = candidates[Math.floor(Math.random() * candidates.length)];
  return { from: choice.piece.position, to: rand(choice.moves) };
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  board: createEmptyBoard(),
  currentTurn: 'israel',
  phase: 'menu',
  selectedPiece: null,
  validMoves: [],
  israelPieces: [],
  iranPieces: [],
  capturedByIsrael: [],
  capturedByIran: [],
  moveHistory: [],
  turnNumber: 1,
  difficulty: 'medium',
  setupPieces: [],
  winner: null,
  battleResult: null,
  aiThinking: false,
  gameStartTime: 0,
  showRules: false,

  setShowRules: (show) => set({ showRules: show }),

  startNewGame: (difficulty) => {
    moveTracker.clear();
    const israelPieces = createArmy('israel');
    set({
      board: createEmptyBoard(),
      currentTurn: 'israel',
      phase: 'setup',
      selectedPiece: null,
      validMoves: [],
      israelPieces: [],
      iranPieces: [],
      capturedByIsrael: [],
      capturedByIran: [],
      moveHistory: [],
      turnNumber: 1,
      difficulty,
      setupPieces: israelPieces,
      winner: null,
      battleResult: null,
      aiThinking: false,
      gameStartTime: Date.now(),
    });
  },

  returnToMenu: () => {
    moveTracker.clear();
    set({
      board: createEmptyBoard(),
      phase: 'menu',
      selectedPiece: null,
      validMoves: [],
      setupPieces: [],
      winner: null,
      battleResult: null,
    });
  },

  placePieceOnBoard: (pieceId, pos) => {
    const state = get();
    if (pos.row > 3 || pos.row < 0) return; // Player can only place on rows 0-3
    const piece = state.setupPieces.find(p => p.id === pieceId);
    if (!piece) return;
    const board = state.board.map(row => row.map(cell => ({ ...cell })));
    if (board[pos.row][pos.col].piece || board[pos.row][pos.col].isLake) return;
    const placedPiece = { ...piece, position: pos };
    board[pos.row][pos.col] = { ...board[pos.row][pos.col], piece: placedPiece };
    set({
      board,
      setupPieces: state.setupPieces.filter(p => p.id !== pieceId),
    });
  },

  removePieceFromBoard: (pos) => {
    const state = get();
    if (state.phase !== 'setup') return;
    const board = state.board.map(row => row.map(cell => ({ ...cell })));
    const piece = board[pos.row][pos.col].piece;
    if (!piece || piece.side !== 'israel') return;
    board[pos.row][pos.col] = { ...board[pos.row][pos.col], piece: null };
    const returnedPiece = { ...piece, position: { row: -1, col: -1 } };
    set({
      board,
      setupPieces: [...state.setupPieces, returnedPiece],
    });
  },

  randomizeSetup: () => {
    const state = get();
    // Collect all Israel pieces (on board + in tray)
    const allPieces: GamePiece[] = [...state.setupPieces];
    const board = createEmptyBoard();
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const piece = state.board[r][c].piece;
        if (piece && piece.side === 'israel') {
          allPieces.push({ ...piece, position: { row: -1, col: -1 } });
        }
      }
    }
    // Shuffle positions in rows 0-3
    const positions: Position[] = [];
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < BOARD_SIZE; c++)
        positions.push({ row: r, col: c });
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    for (let i = 0; i < allPieces.length; i++) {
      const pos = positions[i];
      const piece = { ...allPieces[i], position: pos };
      board[pos.row][pos.col] = { ...board[pos.row][pos.col], piece };
    }
    set({ board, setupPieces: [] });
  },

  clearSetup: () => {
    const state = get();
    const allPieces: GamePiece[] = [...state.setupPieces];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const piece = state.board[r][c].piece;
        if (piece && piece.side === 'israel') {
          allPieces.push({ ...piece, position: { row: -1, col: -1 } });
        }
      }
    }
    set({ board: createEmptyBoard(), setupPieces: allPieces });
  },

  confirmSetup: () => {
    const state = get();
    if (state.setupPieces.length > 0) return; // Not all pieces placed

    const board = state.board.map(row => row.map(cell => ({ ...cell })));

    // Collect placed Israel pieces
    const israelPieces: GamePiece[] = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (board[r][c].piece) israelPieces.push(board[r][c].piece!);
      }
    }

    // Generate AI setup
    const iranArmy = createArmy('iran');
    const placedIran = generateAISetup(iranArmy);
    for (const piece of placedIran) {
      board[piece.position.row][piece.position.col] = {
        ...board[piece.position.row][piece.position.col],
        piece,
      };
    }

    set({
      board,
      phase: 'playing',
      currentTurn: 'israel',
      israelPieces,
      iranPieces: placedIran,
    });
  },

  selectPiece: (piece) => {
    const state = get();
    if (state.phase !== 'playing' || state.currentTurn !== 'israel') return;
    if (piece.side !== 'israel') return;
    if (state.aiThinking) return;
    const moves = getValidMoves(state.board, piece);
    set({ selectedPiece: piece, validMoves: moves });
  },

  clearSelection: () => set({ selectedPiece: null, validMoves: [] }),

  executeMove: (to) => {
    const state = get();
    if (!state.selectedPiece || state.aiThinking) return;

    const from = state.selectedPiece.position;
    const board = state.board.map(row => row.map(cell => ({ ...cell })));
    const movingPiece = { ...state.selectedPiece, hasMoved: true };
    const targetPiece = board[to.row][to.col].piece;

    trackMove(movingPiece.id, to);

    if (targetPiece && targetPiece.side !== movingPiece.side) {
      // Combat!
      const result = resolveCombat(movingPiece, targetPiece);
      const revealedAttacker = { ...movingPiece, isRevealed: true };
      const revealedDefender = { ...targetPiece, isRevealed: true };

      // Clear from position
      board[from.row][from.col] = { ...board[from.row][from.col], piece: null };

      const capturedByIsrael = [...state.capturedByIsrael];
      const capturedByIran = [...state.capturedByIran];

      if (result.attackerDestroyed && result.defenderDestroyed) {
        // Both destroyed
        board[to.row][to.col] = { ...board[to.row][to.col], piece: null };
        capturedByIsrael.push(revealedDefender);
        capturedByIran.push(revealedAttacker);
      } else if (result.attackerDestroyed) {
        // Attacker loses - defender stays (bomb case)
        board[to.row][to.col] = { ...board[to.row][to.col], piece: revealedDefender };
        capturedByIran.push(revealedAttacker);
      } else {
        // Attacker wins
        board[to.row][to.col] = { ...board[to.row][to.col], piece: { ...revealedAttacker, position: to } };
        capturedByIsrael.push(revealedDefender);
      }

      const moveRecord: MoveRecord = {
        piece: movingPiece,
        from,
        to,
        combat: { ...result, attacker: revealedAttacker, defender: revealedDefender },
        turn: state.turnNumber,
      };

      // Check win condition
      let winner: Side | null = null;
      if (targetPiece.rank === 'F') winner = 'israel';

      set({
        board,
        selectedPiece: null,
        validMoves: [],
        capturedByIsrael,
        capturedByIran,
        moveHistory: [...state.moveHistory, moveRecord],
        battleResult: { ...result, attacker: revealedAttacker, defender: revealedDefender },
        phase: winner ? 'gameOver' : 'battle',
        winner,
      });
    } else {
      // Simple move
      const movedPiece = { ...movingPiece, position: to };
      // Scout reveals when moving multiple squares
      if (movingPiece.rank === 2 && (Math.abs(to.row - from.row) > 1 || Math.abs(to.col - from.col) > 1)) {
        movedPiece.isRevealed = true;
      }
      board[from.row][from.col] = { ...board[from.row][from.col], piece: null };
      board[to.row][to.col] = { ...board[to.row][to.col], piece: movedPiece };

      const moveRecord: MoveRecord = { piece: movingPiece, from, to, turn: state.turnNumber };

      set({
        board,
        selectedPiece: null,
        validMoves: [],
        moveHistory: [...state.moveHistory, moveRecord],
        currentTurn: 'iran',
      });

      // Trigger AI turn after a delay
      setTimeout(() => get().executeAIMove(), 600);
    }
  },

  setBattleResult: (result) => set({ battleResult: result }),

  executeBattle: () => {
    const state = get();
    if (state.winner) {
      set({ battleResult: null, phase: 'gameOver' });
      return;
    }
    // Check if Iran has legal moves
    if (!hasLegalMoves(state.board, 'iran')) {
      set({ battleResult: null, phase: 'gameOver', winner: 'israel' });
      return;
    }
    set({ battleResult: null, phase: 'playing', currentTurn: 'iran' });
    setTimeout(() => get().executeAIMove(), 600);
  },

  executeAIMove: () => {
    const state = get();
    if (state.phase === 'gameOver' || state.winner) return;

    set({ aiThinking: true });
    const delay = state.difficulty === 'easy' ? 400 : state.difficulty === 'medium' ? 800 : 1200;

    setTimeout(() => {
      const currentState = get();
      const move = getAIMove(currentState.board, currentState.difficulty);

      if (!move) {
        // AI can't move - player wins
        set({ phase: 'gameOver', winner: 'israel', aiThinking: false });
        return;
      }

      const board = currentState.board.map(row => row.map(cell => ({ ...cell })));
      const piece = board[move.from.row][move.from.col].piece!;
      const movingPiece = { ...piece, hasMoved: true };
      const targetPiece = board[move.to.row][move.to.col].piece;

      trackMove(piece.id, move.to);

      if (targetPiece && targetPiece.side !== piece.side) {
        // Combat
        const result = resolveCombat(movingPiece, targetPiece);
        const revealedAttacker = { ...movingPiece, isRevealed: true };
        const revealedDefender = { ...targetPiece, isRevealed: true };

        board[move.from.row][move.from.col] = { ...board[move.from.row][move.from.col], piece: null };

        const capturedByIsrael = [...currentState.capturedByIsrael];
        const capturedByIran = [...currentState.capturedByIran];

        if (result.attackerDestroyed && result.defenderDestroyed) {
          board[move.to.row][move.to.col] = { ...board[move.to.row][move.to.col], piece: null };
          capturedByIran.push(revealedAttacker);
          capturedByIsrael.push(revealedDefender);
        } else if (result.attackerDestroyed) {
          board[move.to.row][move.to.col] = { ...board[move.to.row][move.to.col], piece: revealedDefender };
          capturedByIsrael.push(revealedAttacker);
        } else {
          board[move.to.row][move.to.col] = { ...board[move.to.row][move.to.col], piece: { ...revealedAttacker, position: move.to } };
          capturedByIran.push(revealedDefender);
        }

        let winner: Side | null = null;
        if (targetPiece.rank === 'F') winner = 'iran';

        const moveRecord: MoveRecord = {
          piece: movingPiece,
          from: move.from,
          to: move.to,
          combat: { ...result, attacker: revealedAttacker, defender: revealedDefender },
          turn: currentState.turnNumber,
        };

        set({
          board,
          capturedByIsrael,
          capturedByIran,
          moveHistory: [...currentState.moveHistory, moveRecord],
          battleResult: { ...result, attacker: revealedAttacker, defender: revealedDefender },
          phase: winner ? 'gameOver' : 'battle',
          winner,
          aiThinking: false,
        });
      } else {
        // Simple move
        const movedPiece = { ...movingPiece, position: move.to };
        if (movingPiece.rank === 2 && (Math.abs(move.to.row - move.from.row) > 1 || Math.abs(move.to.col - move.from.col) > 1)) {
          movedPiece.isRevealed = true;
        }
        board[move.from.row][move.from.col] = { ...board[move.from.row][move.from.col], piece: null };
        board[move.to.row][move.to.col] = { ...board[move.to.row][move.to.col], piece: movedPiece };

        const moveRecord: MoveRecord = { piece: movingPiece, from: move.from, to: move.to, turn: currentState.turnNumber };

        // Check if player has legal moves
        if (!hasLegalMoves(board, 'israel')) {
          set({
            board,
            moveHistory: [...currentState.moveHistory, moveRecord],
            phase: 'gameOver',
            winner: 'iran',
            aiThinking: false,
            turnNumber: currentState.turnNumber + 1,
          });
          return;
        }

        set({
          board,
          moveHistory: [...currentState.moveHistory, moveRecord],
          currentTurn: 'israel',
          aiThinking: false,
          turnNumber: currentState.turnNumber + 1,
        });
      }
    }, delay);
  },
}));
