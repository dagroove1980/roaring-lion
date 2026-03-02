// ============================================================================
// Roaring Lion - Combat Resolver
// Pure function that determines the outcome when one piece attacks another.
// ============================================================================

import type { CombatResult, GamePiece } from '../types';
import { getRankValue, MARSHAL_RANK, SAPPER_RANK, SPY_RANK } from '../constants';

// ---------------------------------------------------------------------------
// Combat Resolution
// ---------------------------------------------------------------------------

/**
 * Resolve combat between an attacking piece and a defending piece.
 *
 * Rules (in priority order):
 *
 * 1. **Flag captured** — Any piece attacking the Flag (F) wins instantly.
 *    The flag is destroyed and the game should end.
 *
 * 2. **Bomb defense** — Any piece attacking a Bomb (B) is destroyed,
 *    UNLESS the attacker is a Sapper/Miner (rank 3), who defuses the bomb.
 *    - Non-miner vs Bomb: attacker destroyed, bomb stays.
 *    - Miner vs Bomb: bomb destroyed, miner survives.
 *
 * 3. **Spy assassination** — The Spy (S) attacking the Marshal (rank 10)
 *    defeats the Marshal. However, if the Marshal attacks the Spy, or if
 *    any other piece attacks the Spy, the Spy loses.
 *
 * 4. **Standard combat** — Higher numeric rank wins.
 *    Equal ranks: both pieces are destroyed.
 *
 * Note: Bombs and Flags cannot initiate attacks — this is enforced in
 * BoardManager.getValidMoves() (they have no valid moves). If somehow
 * called with a Bomb or Flag as attacker, they would still lose to most
 * pieces by the rules above.
 *
 * @param attacker The piece initiating the attack
 * @param defender The piece being attacked
 * @returns        A CombatResult describing the outcome
 */
export function resolveCombat(
  attacker: GamePiece,
  defender: GamePiece
): CombatResult {
  const aRank = attacker.rank;
  const dRank = defender.rank;

  // --- 1. Attacking the Flag: instant capture ---
  if (dRank === 'F') {
    return {
      attacker: { ...attacker, isRevealed: true },
      defender: { ...defender, isRevealed: true },
      winner: attacker,
      attackerDestroyed: false,
      defenderDestroyed: true,
    };
  }

  // --- 2. Attacking a Bomb ---
  if (dRank === 'B') {
    if (aRank === SAPPER_RANK) {
      // Miner defuses the bomb
      return {
        attacker: { ...attacker, isRevealed: true },
        defender: { ...defender, isRevealed: true },
        winner: attacker,
        attackerDestroyed: false,
        defenderDestroyed: true,
      };
    }
    // Non-miner is destroyed by the bomb; bomb survives
    return {
      attacker: { ...attacker, isRevealed: true },
      defender: { ...defender, isRevealed: true },
      winner: defender,
      attackerDestroyed: true,
      defenderDestroyed: false,
    };
  }

  // --- 3. Spy interactions ---
  if (aRank === SPY_RANK && dRank === MARSHAL_RANK) {
    // Spy assassinates the Marshal (only when the Spy is ATTACKING)
    return {
      attacker: { ...attacker, isRevealed: true },
      defender: { ...defender, isRevealed: true },
      winner: attacker,
      attackerDestroyed: false,
      defenderDestroyed: true,
    };
  }

  // --- 4. Standard numeric combat ---
  const aValue = getRankValue(aRank);
  const dValue = getRankValue(dRank);

  if (aValue > dValue) {
    // Attacker has higher rank — attacker wins
    return {
      attacker: { ...attacker, isRevealed: true },
      defender: { ...defender, isRevealed: true },
      winner: attacker,
      attackerDestroyed: false,
      defenderDestroyed: true,
    };
  }

  if (dValue > aValue) {
    // Defender has higher rank — defender wins
    return {
      attacker: { ...attacker, isRevealed: true },
      defender: { ...defender, isRevealed: true },
      winner: defender,
      attackerDestroyed: true,
      defenderDestroyed: false,
    };
  }

  // Equal ranks — both destroyed
  return {
    attacker: { ...attacker, isRevealed: true },
    defender: { ...defender, isRevealed: true },
    winner: null,
    attackerDestroyed: true,
    defenderDestroyed: true,
  };
}

// ---------------------------------------------------------------------------
// Combat Helpers
// ---------------------------------------------------------------------------

/**
 * Check whether the given combat result indicates the defending Flag
 * was captured (game-ending condition).
 */
export function isFlagCapture(result: CombatResult): boolean {
  return result.defender.rank === 'F' && result.defenderDestroyed;
}

/**
 * Returns a human-readable description of the combat outcome.
 * Useful for battle animations and log display.
 */
export function describeCombat(result: CombatResult): string {
  const aName = result.attacker.unitName;
  const dName = result.defender.unitName;
  const aRank = String(result.attacker.rank);
  const dRank = String(result.defender.rank);

  if (result.defender.rank === 'F') {
    return `${aName} (${aRank}) captured the ${dName}! Game Over!`;
  }

  if (result.defender.rank === 'B') {
    if (result.defenderDestroyed) {
      return `${aName} (${aRank}) defused the ${dName}!`;
    }
    return `${aName} (${aRank}) was destroyed by the ${dName}!`;
  }

  if (result.winner === null) {
    return `${aName} (${aRank}) and ${dName} (${dRank}) destroyed each other!`;
  }

  if (result.attackerDestroyed) {
    return `${dName} (${dRank}) defeated ${aName} (${aRank})`;
  }

  return `${aName} (${aRank}) defeated ${dName} (${dRank})`;
}
