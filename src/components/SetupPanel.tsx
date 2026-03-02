import { useGameStore } from '../store/gameStore';
import type { GamePiece, Rank } from '../types';

const RANK_ORDER: Rank[] = [10, 9, 8, 7, 6, 5, 4, 3, 2, 'S', 'B', 'F'];

export default function SetupPanel() {
  const setupPieces = useGameStore(s => s.setupPieces);
  const randomizeSetup = useGameStore(s => s.randomizeSetup);
  const clearSetup = useGameStore(s => s.clearSetup);
  const confirmSetup = useGameStore(s => s.confirmSetup);
  const returnToMenu = useGameStore(s => s.returnToMenu);

  // Group pieces by rank
  const grouped = new Map<Rank, GamePiece[]>();
  for (const rank of RANK_ORDER) {
    grouped.set(rank, []);
  }
  for (const piece of setupPieces) {
    grouped.get(piece.rank)?.push(piece);
  }

  const handleDragStart = (e: React.DragEvent, piece: GamePiece) => {
    e.dataTransfer.setData('pieceId', piece.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const allPlaced = setupPieces.length === 0;

  return (
    <div className="setup-panel">
      <div className="setup-header">
        <h2>DEPLOY YOUR FORCES</h2>
        <p>Drag pieces onto rows 1-4 of the board</p>
        <div className="setup-counter">
          {40 - setupPieces.length}/40 placed
        </div>
      </div>

      <div className="setup-pieces-tray">
        {RANK_ORDER.map(rank => {
          const pieces = grouped.get(rank) || [];
          if (pieces.length === 0) return null;
          return (
            <div key={String(rank)} className="setup-rank-group">
              <div className="rank-count">{pieces.length}x</div>
              <div
                className="setup-piece-card"
                draggable
                onDragStart={(e) => handleDragStart(e, pieces[0])}
                title={pieces[0].unitName}
              >
                <div className="spc-rank">
                  {rank === 'S' ? 'SPY' : rank === 'B' ? 'BOM' : rank === 'F' ? 'FLG' : rank}
                </div>
                <div className="spc-name">{pieces[0].unitName}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="setup-actions">
        <button className="btn btn-secondary" onClick={randomizeSetup}>
          Randomize
        </button>
        <button className="btn btn-secondary" onClick={clearSetup}>
          Clear
        </button>
        <button
          className={`btn btn-primary ${allPlaced ? '' : 'btn-disabled'}`}
          onClick={confirmSetup}
          disabled={!allPlaced}
        >
          {allPlaced ? 'READY FOR BATTLE' : `Place ${setupPieces.length} more`}
        </button>
        <button className="btn btn-ghost" onClick={returnToMenu}>
          Back
        </button>
      </div>
    </div>
  );
}
