import { useGameStore } from '../store/gameStore';
import type { GamePiece, Rank } from '../types';

function CapturedTray({ pieces, label, side }: { pieces: GamePiece[]; label: string; side: 'israel' | 'iran' }) {
  const RANK_ORDER: Rank[] = [10, 9, 8, 7, 6, 5, 4, 3, 2, 'S', 'B', 'F'];
  const grouped = new Map<string, number>();
  for (const p of pieces) {
    const key = String(p.rank);
    grouped.set(key, (grouped.get(key) || 0) + 1);
  }

  return (
    <div className={`captured-tray ${side}`}>
      <h4>{label}</h4>
      <div className="captured-pieces">
        {pieces.length === 0 && <span className="empty-tray">None</span>}
        {RANK_ORDER.map(rank => {
          const count = grouped.get(String(rank));
          if (!count) return null;
          return (
            <div key={String(rank)} className="captured-chip">
              <span className="cap-rank">{rank === 'S' ? 'Spy' : rank === 'B' ? 'Bomb' : rank === 'F' ? 'Flag' : rank}</span>
              {count > 1 && <span className="cap-count">x{count}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function GameHUD() {
  const currentTurn = useGameStore(s => s.currentTurn);
  const turnNumber = useGameStore(s => s.turnNumber);
  const capturedByIsrael = useGameStore(s => s.capturedByIsrael);
  const capturedByIran = useGameStore(s => s.capturedByIran);
  const moveHistory = useGameStore(s => s.moveHistory);
  const aiThinking = useGameStore(s => s.aiThinking);
  const returnToMenu = useGameStore(s => s.returnToMenu);
  const setShowRules = useGameStore(s => s.setShowRules);
  const difficulty = useGameStore(s => s.difficulty);

  const recentMoves = moveHistory.slice(-8).reverse();

  return (
    <div className="game-hud">
      <div className="hud-header">
        <div className="turn-info">
          <div className={`turn-indicator ${currentTurn}`}>
            {aiThinking ? (
              <span className="thinking">
                <span className="dot-pulse" /> AI Thinking...
              </span>
            ) : (
              <span>
                {currentTurn === 'israel' ? '🇮🇱 YOUR TURN' : '🇮🇷 IRAN\'S TURN'}
              </span>
            )}
          </div>
          <div className="turn-number">Turn {turnNumber}</div>
          <div className="difficulty-badge">{difficulty.toUpperCase()}</div>
        </div>
      </div>

      <CapturedTray pieces={capturedByIsrael} label="Captured by You" side="israel" />
      <CapturedTray pieces={capturedByIran} label="Captured by Iran" side="iran" />

      <div className="move-history">
        <h4>Move History</h4>
        <div className="history-list">
          {recentMoves.length === 0 && <span className="empty-tray">No moves yet</span>}
          {recentMoves.map((move, i) => (
            <div key={i} className={`history-entry ${move.piece.side}`}>
              <span className="hist-turn">T{move.turn}</span>
              <span className="hist-side">{move.piece.side === 'israel' ? '🇮🇱' : '🇮🇷'}</span>
              <span className="hist-move">
                {String.fromCharCode(65 + move.from.col)}{10 - move.from.row}
                {' → '}
                {String.fromCharCode(65 + move.to.col)}{10 - move.to.row}
              </span>
              {move.combat && (
                <span className="hist-combat">
                  {move.combat.winner
                    ? `${move.combat.winner.unitName} wins`
                    : 'Both lost'}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="hud-actions">
        <button className="btn btn-ghost btn-sm" onClick={() => setShowRules(true)}>
          Rules
        </button>
        <button className="btn btn-ghost btn-sm" onClick={returnToMenu}>
          Quit
        </button>
      </div>
    </div>
  );
}
