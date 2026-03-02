import { useGameStore } from './store/gameStore';
import MainMenu from './components/MainMenu';
import GameBoard from './components/GameBoard';
import SetupPanel from './components/SetupPanel';
import GameHUD from './components/GameHUD';
import BattlePopup from './components/BattlePopup';
import GameOverScreen from './components/GameOverScreen';
import RulesModal from './components/RulesModal';
import './App.css';

function App() {
  const phase = useGameStore(s => s.phase);
  const battleResult = useGameStore(s => s.battleResult);
  const winner = useGameStore(s => s.winner);

  return (
    <div className="app">
      {phase === 'menu' && <MainMenu />}

      {phase === 'setup' && (
        <div className="game-layout">
          <SetupPanel />
          <div className="board-container">
            <GameBoard />
          </div>
        </div>
      )}

      {(phase === 'playing' || phase === 'battle') && (
        <div className="game-layout">
          <div className="board-container">
            <GameBoard />
          </div>
          <GameHUD />
        </div>
      )}

      {battleResult && <BattlePopup />}

      {phase === 'gameOver' && winner && !battleResult && <GameOverScreen />}

      <RulesModal />
    </div>
  );
}

export default App;
