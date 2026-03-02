import { useGameStore } from '../store/gameStore';

export default function GameOverScreen() {
  const winner = useGameStore(s => s.winner);
  const moveHistory = useGameStore(s => s.moveHistory);
  const capturedByIsrael = useGameStore(s => s.capturedByIsrael);
  const capturedByIran = useGameStore(s => s.capturedByIran);
  const gameStartTime = useGameStore(s => s.gameStartTime);
  const turnNumber = useGameStore(s => s.turnNumber);
  const difficulty = useGameStore(s => s.difficulty);
  const startNewGame = useGameStore(s => s.startNewGame);
  const returnToMenu = useGameStore(s => s.returnToMenu);

  const isVictory = winner === 'israel';
  const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <div className={`gameover-overlay ${isVictory ? 'victory' : 'defeat'}`}>
      <div className="gameover-content">
        <div className="gameover-icon">
          {isVictory ? '🦁' : '💀'}
        </div>
        <h1 className="gameover-title">
          {isVictory ? 'VICTORY!' : 'DEFEAT'}
        </h1>
        <p className="gameover-subtitle">
          {isVictory
            ? 'The Lion of Judah roars triumphant!'
            : 'Your forces have been overwhelmed.'}
        </p>

        <div className="gameover-stats">
          <div className="stat">
            <span className="stat-value">{turnNumber}</span>
            <span className="stat-label">Turns</span>
          </div>
          <div className="stat">
            <span className="stat-value">{capturedByIsrael.length}</span>
            <span className="stat-label">Enemies Captured</span>
          </div>
          <div className="stat">
            <span className="stat-value">{capturedByIran.length}</span>
            <span className="stat-label">Losses</span>
          </div>
          <div className="stat">
            <span className="stat-value">{minutes}:{seconds.toString().padStart(2, '0')}</span>
            <span className="stat-label">Duration</span>
          </div>
          <div className="stat">
            <span className="stat-value">{moveHistory.filter(m => m.combat).length}</span>
            <span className="stat-label">Battles</span>
          </div>
          <div className="stat">
            <span className="stat-value">{difficulty.toUpperCase()}</span>
            <span className="stat-label">Difficulty</span>
          </div>
        </div>

        <div className="gameover-actions">
          <button className="btn btn-primary" onClick={() => startNewGame(difficulty)}>
            PLAY AGAIN
          </button>
          <button className="btn btn-secondary" onClick={returnToMenu}>
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
}
