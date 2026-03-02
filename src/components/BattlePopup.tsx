import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';

export default function BattlePopup() {
  const battleResult = useGameStore(s => s.battleResult);
  const executeBattle = useGameStore(s => s.executeBattle);
  const [phase, setPhase] = useState<'reveal' | 'result'>('reveal');

  useEffect(() => {
    if (battleResult) {
      setPhase('reveal');
      const timer = setTimeout(() => setPhase('result'), 800);
      return () => clearTimeout(timer);
    }
  }, [battleResult]);

  if (!battleResult) return null;

  const { attacker, defender, winner, attackerDestroyed, defenderDestroyed } = battleResult;

  const getRankLabel = (rank: typeof attacker.rank) => {
    if (rank === 'S') return 'SPY';
    if (rank === 'B') return 'BOMB';
    if (rank === 'F') return 'FLAG';
    return String(rank);
  };

  const getOutcome = () => {
    if (attackerDestroyed && defenderDestroyed) return 'MUTUAL DESTRUCTION';
    if (winner?.side === 'israel') return 'VICTORY!';
    if (winner?.side === 'iran') return 'DEFEATED!';
    return '';
  };

  const outcomeClass = () => {
    if (attackerDestroyed && defenderDestroyed) return 'outcome-draw';
    if (winner?.side === 'israel') return 'outcome-win';
    return 'outcome-lose';
  };

  return (
    <div className="battle-overlay" onClick={executeBattle}>
      <div className="battle-popup" onClick={e => e.stopPropagation()}>
        <h2 className="battle-title">COMBAT!</h2>

        <div className="battle-arena">
          <div className={`battle-card ${attackerDestroyed ? 'destroyed' : 'survived'} ${attacker.side}`}>
            <div className="bc-side">{attacker.side === 'israel' ? '🇮🇱 ISRAEL' : '🇮🇷 IRAN'}</div>
            <div className="bc-rank">{getRankLabel(attacker.rank)}</div>
            <div className="bc-name">{attacker.unitName}</div>
            <div className="bc-role">ATTACKER</div>
          </div>

          <div className="battle-vs">
            <span className={phase === 'result' ? 'vs-resolved' : ''}>VS</span>
          </div>

          <div className={`battle-card ${defenderDestroyed ? 'destroyed' : 'survived'} ${defender.side}`}>
            <div className="bc-side">{defender.side === 'israel' ? '🇮🇱 ISRAEL' : '🇮🇷 IRAN'}</div>
            <div className="bc-rank">{getRankLabel(defender.rank)}</div>
            <div className="bc-name">{defender.unitName}</div>
            <div className="bc-role">DEFENDER</div>
          </div>
        </div>

        {phase === 'result' && (
          <div className={`battle-outcome ${outcomeClass()}`}>
            <div className="outcome-text">{getOutcome()}</div>
            {winner && (
              <div className="outcome-winner">
                {winner.unitName} ({getRankLabel(winner.rank)}) prevails
              </div>
            )}
          </div>
        )}

        <button className="btn btn-primary battle-continue" onClick={executeBattle}>
          CONTINUE
        </button>
      </div>
    </div>
  );
}
