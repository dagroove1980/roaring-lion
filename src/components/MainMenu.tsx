import { useState } from 'react';
import type { Difficulty } from '../types';
import { useGameStore } from '../store/gameStore';

export default function MainMenu() {
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium');
  const startNewGame = useGameStore(s => s.startNewGame);
  const setShowRules = useGameStore(s => s.setShowRules);

  return (
    <div className="menu-container">
      <div className="menu-bg" />
      <div className="menu-content">
        <div className="menu-logo">
          <div className="lion-icon">
            <svg viewBox="0 0 64 64" width="80" height="80">
              <path d="M32 8 L24 16 L20 12 L16 20 L12 18 L16 28 L14 32 L18 36 L16 44 L24 40 L28 48 L32 52 L36 48 L40 40 L48 44 L46 36 L50 32 L48 28 L52 18 L48 20 L44 12 L40 16Z" fill="#c5a93a" stroke="#8B6914" strokeWidth="2"/>
              <circle cx="26" cy="24" r="2" fill="#1a2744"/>
              <circle cx="38" cy="24" r="2" fill="#1a2744"/>
              <path d="M28 32 Q32 36 36 32" stroke="#1a2744" strokeWidth="2" fill="none"/>
            </svg>
          </div>
          <h1 className="game-title">ROARING LION</h1>
          <p className="game-subtitle">A Strategic Battle of Nations</p>
        </div>

        <div className="menu-panel">
          <div className="difficulty-selector">
            <h3>SELECT DIFFICULTY</h3>
            <div className="difficulty-options">
              {([
                { value: 'easy' as Difficulty, label: 'RECRUIT', desc: 'Random moves, no strategy' },
                { value: 'medium' as Difficulty, label: 'COMMANDER', desc: 'Targets weak pieces, uses scouts' },
                { value: 'hard' as Difficulty, label: 'GENERAL', desc: 'Tracks pieces, sets traps, adapts' },
              ]).map(d => (
                <button
                  key={d.value}
                  className={`difficulty-btn ${selectedDifficulty === d.value ? 'active' : ''}`}
                  onClick={() => setSelectedDifficulty(d.value)}
                >
                  <span className="diff-label">{d.label}</span>
                  <span className="diff-desc">{d.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <button className="start-btn" onClick={() => startNewGame(selectedDifficulty)}>
            START GAME
          </button>

          <button className="rules-btn" onClick={() => setShowRules(true)}>
            HOW TO PLAY
          </button>
        </div>

        <div className="menu-footer">
          <span>Israel vs Iran</span>
          <span>Inspired by Stratego</span>
        </div>
      </div>
    </div>
  );
}
