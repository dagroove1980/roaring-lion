import { useGameStore } from '../store/gameStore';

export default function RulesModal() {
  const showRules = useGameStore(s => s.showRules);
  const setShowRules = useGameStore(s => s.setShowRules);

  if (!showRules) return null;

  return (
    <div className="modal-overlay" onClick={() => setShowRules(false)}>
      <div className="modal-content rules-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={() => setShowRules(false)}>X</button>
        <h2>HOW TO PLAY</h2>
        <div className="rules-content">
          <div className="rule-section">
            <h3>Objective</h3>
            <p>Capture the enemy <strong>Flag</strong> to win. If your opponent cannot make any legal move, you also win.</p>
          </div>
          <div className="rule-section">
            <h3>Movement</h3>
            <p>Move 1 piece per turn, 1 square orthogonally (up, down, left, right). No diagonal movement.</p>
            <p><strong>Scouts (Rank 2)</strong> can move any number of squares in a straight line, like a rook in chess. This reveals their identity.</p>
            <p><strong>Bombs & Flags</strong> cannot move.</p>
          </div>
          <div className="rule-section">
            <h3>Combat</h3>
            <p>Move onto an enemy piece to attack. Higher rank wins. Equal ranks: both destroyed.</p>
            <table className="rules-table">
              <tbody>
                <tr><td><strong>Spy (S)</strong></td><td>Defeats Rank 10 ONLY when attacking first. Loses to all others.</td></tr>
                <tr><td><strong>Miner (3)</strong></td><td>Only piece that can defuse Bombs. All other attackers are destroyed.</td></tr>
                <tr><td><strong>Scout (2)</strong></td><td>Can move + attack in one turn across multiple squares.</td></tr>
                <tr><td><strong>Bomb (B)</strong></td><td>Immovable. Destroys any attacker except Miners.</td></tr>
                <tr><td><strong>Flag (F)</strong></td><td>Immovable. If captured, game over.</td></tr>
              </tbody>
            </table>
          </div>
          <div className="rule-section">
            <h3>Rank Hierarchy (High to Low)</h3>
            <p>10 &gt; 9 &gt; 8 &gt; 7 &gt; 6 &gt; 5 &gt; 4 &gt; 3 &gt; 2 &gt; Spy</p>
          </div>
          <div className="rule-section">
            <h3>Fog of War</h3>
            <p>Enemy pieces are hidden until revealed through combat. Once revealed, their rank stays visible.</p>
          </div>
          <div className="rule-section">
            <h3>Anti-Stall</h3>
            <p>A piece cannot oscillate between the same 2 squares for 3 consecutive turns.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
