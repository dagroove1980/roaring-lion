import type { GamePiece, Rank, Side } from '../types';

// ---------------------------------------------------------------------------
// Asset mapping: PixelLab-generated sprites (available units)
// ---------------------------------------------------------------------------

const ASSET_MAP: Record<string, string> = {
  // Israel
  'israel-10': '/assets/units/israel_marshal.png',
  'israel-9': '/assets/units/israel_general.png',
  'israel-8': '/assets/units/israel_colonel.png',
  'israel-7': '/assets/units/israel_major.png',
  'israel-6': '/assets/units/israel_captain.png',
  'israel-5': '/assets/units/israel_lieutenant.png',
  'israel-4': '/assets/units/israel_soldier.png',
  'israel-3': '/assets/units/israel_miner.png',
  'israel-2': '/assets/units/israel_scout.png',
  'israel-S': '/assets/units/israel_spy.png',
  'israel-B': '/assets/units/israel_bomb.png',
  'israel-F': '/assets/units/israel_flag.png',
  // Iran
  'iran-10': '/assets/units/iran_marshal.png',
  'iran-9': '/assets/units/iran_general.png',
  'iran-8': '/assets/units/iran_colonel.png',
  'iran-7': '/assets/units/iran_major.png',
  'iran-6': '/assets/units/iran_captain.png',
  'iran-5': '/assets/units/iran_lieutenant.png',
  'iran-4': '/assets/units/iran_sergeant.png',
  'iran-3': '/assets/units/iran_miner.png',
  'iran-2': '/assets/units/iran_scout.png',
  'iran-S': '/assets/units/iran_spy.png',
  'iran-B': '/assets/units/iran_bomb.png',
  'iran-F': '/assets/units/iran_flag.png',
};

function getAssetPath(side: Side, rank: Rank): string | null {
  return ASSET_MAP[`${side}-${rank}`] ?? null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRankDisplay(rank: Rank): string {
  if (rank === 'S') return 'SPY';
  if (rank === 'B') return 'BOM';
  if (rank === 'F') return 'FLG';
  return String(rank);
}

// ---------------------------------------------------------------------------
// SVG Military Silhouettes (fallback when no pixel art available)
// Each is a detailed, iconic military figure at 48x48 viewBox
// ---------------------------------------------------------------------------

function UnitSVG({ rank, side, size }: { rank: Rank; side: Side; size: number }) {
  const s = Math.floor(size * 0.52);
  const il = side === 'israel';
  const pri = il ? '#d4af37' : '#8a9a60';    // primary fill
  const drk = il ? '#8B6914' : '#3a4a28';    // dark accent
  const acc = il ? '#ffffff' : '#da0000';     // team accent

  const w = (children: React.ReactNode) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none"
      style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))' }}>
      {children}
    </svg>
  );

  switch (rank) {
    // Marshal (10) — Leader with crown and star
    case 10:
      return w(
        <g>
          <path d="M15 10l2 5 3-3 4 4 4-4 3 3 2-5v7H15z" fill={pri} stroke={drk} strokeWidth=".7"/>
          <circle cx="24" cy="22" r="5" fill={pri} stroke={drk} strokeWidth=".7"/>
          <path d="M16 28h16l2 14H14z" fill={pri} stroke={drk} strokeWidth=".7"/>
          <rect x="14" y="28" width="4" height="2.5" rx="1" fill={pri} stroke={drk} strokeWidth=".5"/>
          <rect x="30" y="28" width="4" height="2.5" rx="1" fill={pri} stroke={drk} strokeWidth=".5"/>
          <polygon points="24,32 25.5,35.5 29,35.5 26.2,37.5 27.2,41 24,39 20.8,41 21.8,37.5 19,35.5 22.5,35.5"
            fill={acc} opacity=".85"/>
        </g>
      );

    // General (9) — Officer with peaked cap and medals
    case 9:
      return w(
        <g>
          <ellipse cx="24" cy="12" rx="8" ry="2.8" fill={pri} stroke={drk} strokeWidth=".7"/>
          <rect x="18" y="9" width="12" height="4" rx="1" fill={pri} stroke={drk} strokeWidth=".6"/>
          <rect x="22" y="7" width="4" height="3" rx=".5" fill={acc} opacity=".7"/>
          <circle cx="24" cy="18.5" r="5" fill={pri} stroke={drk} strokeWidth=".7"/>
          <path d="M16 24.5h16l2 18H14z" fill={pri} stroke={drk} strokeWidth=".7"/>
          <circle cx="20" cy="30" r="1.8" fill={acc} opacity=".6"/>
          <circle cx="24" cy="30" r="1.8" fill={acc} opacity=".6"/>
          <circle cx="28" cy="30" r="1.8" fill={acc} opacity=".6"/>
          <rect x="19" y="34" width="10" height="1" fill={drk} opacity=".5"/>
        </g>
      );

    // Colonel (8) — Officer with beret and medal
    case 8:
      return w(
        <g>
          <path d="M17 14q0-6 7-7 7 1 7 7z" fill={pri} stroke={drk} strokeWidth=".7"/>
          <circle cx="24" cy="19.5" r="5" fill={pri} stroke={drk} strokeWidth=".7"/>
          <path d="M16 25.5h16l1 17H15z" fill={pri} stroke={drk} strokeWidth=".7"/>
          <rect x="17" y="35" width="14" height="2" rx=".5" fill={drk}/>
          <rect x="20" y="29" width="3.5" height="4.5" rx=".8" fill={acc} opacity=".6"/>
          <line x1="20" y1="33.5" x2="23.5" y2="33.5" stroke={acc} strokeWidth="1" opacity=".5"/>
        </g>
      );

    // Major (7) — Officer with binoculars
    case 7:
      return w(
        <g>
          <path d="M18 14.5q0-6 6-7 6 1 6 7z" fill={pri} stroke={drk} strokeWidth=".7"/>
          <circle cx="24" cy="19" r="4.5" fill={pri} stroke={drk} strokeWidth=".7"/>
          <path d="M17 24.5h14l2 18H15z" fill={pri} stroke={drk} strokeWidth=".7"/>
          <rect x="31" y="16" width="7" height="3.5" rx="1.5" fill={drk} stroke={pri} strokeWidth=".5"/>
          <line x1="31" y1="18" x2="26" y2="27" stroke={drk} strokeWidth="1"/>
          <line x1="20" y1="28" x2="28" y2="28" stroke={acc} strokeWidth="1.2" opacity=".5"/>
        </g>
      );

    // Captain (6) — Soldier saluting
    case 6:
      return w(
        <g>
          <ellipse cx="24" cy="11.5" rx="6.5" ry="3" fill={pri} stroke={drk} strokeWidth=".7"/>
          <circle cx="24" cy="17.5" r="4.5" fill={pri} stroke={drk} strokeWidth=".7"/>
          <path d="M17 23h14l2 19H15z" fill={pri} stroke={drk} strokeWidth=".7"/>
          <path d="M31 24l4.5-6.5 1.5 1-4 7z" fill={pri} stroke={drk} strokeWidth=".5"/>
          <line x1="20" y1="27" x2="28" y2="27" stroke={acc} strokeWidth="1.3" opacity=".6"/>
          <line x1="20" y1="29.5" x2="28" y2="29.5" stroke={acc} strokeWidth="1.3" opacity=".6"/>
        </g>
      );

    // Lieutenant (5) — Standing soldier with single bar
    case 5:
      return w(
        <g>
          <path d="M18 14q0-5.5 6-6.5 6 1 6 6.5z" fill={pri} stroke={drk} strokeWidth=".7"/>
          <circle cx="24" cy="18.5" r="4.5" fill={pri} stroke={drk} strokeWidth=".7"/>
          <path d="M17 24h14l1.5 18H15.5z" fill={pri} stroke={drk} strokeWidth=".7"/>
          <line x1="20" y1="28" x2="28" y2="28" stroke={acc} strokeWidth="1.5" opacity=".6"/>
        </g>
      );

    // Sergeant (4) — Soldier with backpack and chevron
    case 4:
      return w(
        <g>
          <path d="M18 14q0-5.5 6-6.5 6 1 6 6.5z" fill={pri} stroke={drk} strokeWidth=".7"/>
          <circle cx="24" cy="18.5" r="4.5" fill={pri} stroke={drk} strokeWidth=".7"/>
          <path d="M17 24h14l1.5 18H15.5z" fill={pri} stroke={drk} strokeWidth=".7"/>
          <rect x="31.5" y="25" width="5.5" height="9" rx="1" fill={drk} stroke={pri} strokeWidth=".4"/>
          <path d="M20 29l4 3.5 4-3.5" stroke={acc} strokeWidth="1.4" fill="none" opacity=".7"/>
        </g>
      );

    // Sapper/Miner (3) — Engineer with wrench
    case 3:
      return w(
        <g>
          <path d="M16 15q0-6 8-7 8 1 8 7l2 .5v2H14v-2z" fill={pri} stroke={drk} strokeWidth=".7"/>
          <circle cx="24" cy="21" r="4.5" fill={pri} stroke={drk} strokeWidth=".7"/>
          <path d="M17 26.5h14l1.5 16H15.5z" fill={pri} stroke={drk} strokeWidth=".7"/>
          <rect x="33" y="22" width="2.2" height="14" rx=".6" fill={drk}/>
          <circle cx="34" cy="20.5" r="3" fill="none" stroke={drk} strokeWidth="1.5"/>
          <line x1="22" y1="32" x2="26" y2="32" stroke={acc} strokeWidth="1.5" opacity=".7"/>
          <line x1="24" y1="30" x2="24" y2="34" stroke={acc} strokeWidth="1.5" opacity=".7"/>
        </g>
      );

    // Scout (2) — Running figure with goggles
    case 2:
      return w(
        <g>
          <circle cx="24" cy="14" r="4.2" fill={pri} stroke={drk} strokeWidth=".7"/>
          <rect x="20" y="12.5" width="8" height="3" rx="1.2" fill="none" stroke={acc}
            strokeWidth=".8" opacity=".7"/>
          <path d="M20 19.5l8-.5 4 18-4 4h-8l-4-4z" fill={pri} stroke={drk} strokeWidth=".7"/>
          <line x1="19.5" y1="21" x2="12" y2="28" stroke={pri} strokeWidth="2.8"
            strokeLinecap="round"/>
          <line x1="28.5" y1="21" x2="36" y2="17" stroke={pri} strokeWidth="2.8"
            strokeLinecap="round"/>
          <path d="M21 32q3-3.5 6 0 -3 3.5-6 0z" fill={acc} opacity=".5"/>
        </g>
      );

    // Spy (S) — Trench coat, fedora, glasses
    case 'S':
      return w(
        <g>
          <ellipse cx="24" cy="10.5" rx="9" ry="2.5" fill={pri} stroke={drk} strokeWidth=".6"/>
          <path d="M18 10.5q0-6 6-7.5 6 1.5 6 7.5" fill={pri} stroke={drk} strokeWidth=".6"/>
          <circle cx="24" cy="16" r="4.2" fill={pri} stroke={drk} strokeWidth=".7"/>
          <circle cx="22" cy="15" r="2" fill="none" stroke={drk} strokeWidth=".9"/>
          <circle cx="26" cy="15" r="2" fill="none" stroke={drk} strokeWidth=".9"/>
          <line x1="24" y1="15" x2="24" y2="15" stroke={drk} strokeWidth="1"/>
          <path d="M14 21h20l2 22H12z" fill={pri} stroke={drk} strokeWidth=".7"/>
          <path d="M24 21l-4.5 8.5 4.5-2 4.5 2.5L24 21z" fill={drk}/>
          <line x1="34" y1="30" x2="36" y2="26" stroke={acc} strokeWidth="1.5" opacity=".6"/>
        </g>
      );

    // Bomb (B) — Iron Dome / Shahab Missile
    case 'B':
      return il ? w(
        <g>
          <path d="M10 37q0-20 14-26 14 6 14 26z" fill={pri} stroke={drk} strokeWidth=".7"/>
          <path d="M14 35q0-16 10-20 10 4 10 20z" fill={drk} opacity=".5"/>
          <path d="M20 22l2.5 4.5-2.5.5 3.5 6" stroke={acc} strokeWidth="1.4" fill="none" opacity=".7"/>
          <path d="M26 22l2.5 4.5-2.5.5 3.5 6" stroke={acc} strokeWidth="1.4" fill="none" opacity=".7"/>
          <rect x="10" y="37" width="28" height="3.5" rx="1" fill={pri} stroke={drk} strokeWidth=".5"/>
        </g>
      ) : w(
        <g>
          <path d="M24 5l3 9v20l3.5 4.5H17.5L21 34V14z" fill={pri} stroke={drk} strokeWidth=".7"/>
          <path d="M21 34l-7 9 7-4z" fill={pri} stroke={drk} strokeWidth=".5"/>
          <path d="M27 34l7 9-7-4z" fill={pri} stroke={drk} strokeWidth=".5"/>
          <path d="M22 5h4l-2-3z" fill={acc} opacity=".7"/>
          <rect x="21" y="20" width="6" height="2.5" rx=".3" fill={acc} opacity=".5"/>
          <rect x="21" y="26" width="6" height="1" fill={drk} opacity=".5"/>
        </g>
      );

    // Flag (F) — National flag on pole
    case 'F':
      return w(
        <g>
          <rect x="13" y="6" width="2.2" height="36" rx=".5" fill={drk}/>
          <circle cx="14" cy="5" r="2" fill={acc} opacity=".7"/>
          <path d="M15.5 8h22l-4 10 4 10h-22z" fill={pri} stroke={drk} strokeWidth=".7"/>
          {il ? (
            <>
              <polygon points="26.5,13 23.5,19 29.5,19" fill="none" stroke="#fff" strokeWidth="1.1"/>
              <polygon points="26.5,21 23.5,15 29.5,15" fill="none" stroke="#fff" strokeWidth="1.1"/>
            </>
          ) : (
            <>
              <circle cx="27" cy="18" r="5" fill={drk}/>
              <circle cx="29" cy="17" r="4" fill={pri}/>
              <circle cx="32.5" cy="13.5" r="1.2" fill={drk}/>
            </>
          )}
          <rect x="10" y="40" width="8" height="3" rx="1" fill={drk}/>
        </g>
      );

    default:
      return w(<circle cx="24" cy="24" r="10" fill={pri} stroke={drk} strokeWidth="1"/>);
  }
}

// ---------------------------------------------------------------------------
// Card Back Emblems (hidden enemy pieces)
// ---------------------------------------------------------------------------

function CardBackEmblem({ side, size }: { side: Side; size: number }) {
  const s = Math.floor(size * 0.42);

  if (side === 'israel') {
    return (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <defs>
          <linearGradient id="ilg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F0D060"/>
            <stop offset="100%" stopColor="#8B6914"/>
          </linearGradient>
        </defs>
        <polygon points="20,4 25,15 36,15 27,22 30,34 20,27 10,34 13,22 4,15 15,15"
          fill="none" stroke="url(#ilg)" strokeWidth="1.3" opacity=".6"/>
        <polygon points="20,8 24,16 32,16 26,21 28,30 20,25 12,30 14,21 8,16 16,16"
          fill="url(#ilg)" opacity=".12"/>
      </svg>
    );
  }

  return (
    <svg width={s} height={s} viewBox="0 0 40 40">
      <defs>
        <linearGradient id="irg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C0A030"/>
          <stop offset="100%" stopColor="#6a5430"/>
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="11" fill="none" stroke="url(#irg)" strokeWidth="1.3" opacity=".6"/>
      <circle cx="24" cy="18" r="9" fill="#1a2a12"/>
      <polygon points="31,10 32,13.5 35,13.5 32.5,15.5 33.5,19 31,17 28.5,19 29.5,15.5 27,13.5 30,13.5"
        fill="url(#irg)" opacity=".5"/>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main PieceSprite Component
// ---------------------------------------------------------------------------

interface Props {
  piece: GamePiece;
  isSelected: boolean;
  size: number;
  isDragging?: boolean;
}

export default function PieceSprite({ piece, isSelected, size }: Props) {
  const isOwn = piece.side === 'israel';
  const showFace = isOwn || piece.isRevealed;
  const assetPath = getAssetPath(piece.side, piece.rank);

  // ── Hidden enemy card back ──
  if (!showFace) {
    return (
      <div
        className={`piece-sprite piece-hidden ${isSelected ? 'piece-selected' : ''}`}
        style={{
          width: size,
          height: size,
          background: piece.side === 'iran'
            ? 'linear-gradient(145deg, #2a3a1e 0%, #1e2e16 50%, #162210 100%)'
            : 'linear-gradient(145deg, #1a3a5c 0%, #142e4a 50%, #0d2040 100%)',
          borderColor: piece.side === 'iran' ? '#3a4a28' : '#2a4a70',
        }}
      >
        <CardBackEmblem side={piece.side} size={size} />
        <div className="piece-question">?</div>
      </div>
    );
  }

  // ── Revealed card face ──
  const isBomb = piece.rank === 'B';
  const isFlag = piece.rank === 'F';

  // Israel: warm sandy khaki cards | Iran: dark olive military cards
  const bgGrad = isOwn
    ? isBomb
      ? 'linear-gradient(155deg, #8a7040, #6a5430, #4a3a20)'
      : isFlag
        ? 'linear-gradient(155deg, #c4a868, #a89040, #8a7040)'
        : 'linear-gradient(155deg, #c4a868, #b89a5a, #907848)'
    : isBomb
      ? 'linear-gradient(155deg, #3a4a28, #2a3a1e, #1a2a12)'
      : isFlag
        ? 'linear-gradient(155deg, #5a6a48, #4a5a38, #3a4a28)'
        : 'linear-gradient(155deg, #4a5a38, #3e4e2e, #2a3a1e)';

  const borderCol = isSelected
    ? '#FFD700'
    : isOwn ? '#6a5430' : '#3a4a28';

  return (
    <div
      className={`piece-sprite piece-revealed ${isSelected ? 'piece-selected' : ''} ${piece.side}`}
      style={{
        width: size,
        height: size,
        background: bgGrad,
        borderColor: borderCol,
      }}
    >
      {/* Rank badge — top-right */}
      <div className="piece-rank-badge" style={{
        backgroundColor: isOwn ? 'rgba(106,84,48,0.92)' : 'rgba(42,58,30,0.92)',
      }}>
        {getRankDisplay(piece.rank)}
      </div>

      {/* Unit illustration — center */}
      <div className="piece-icon">
        {assetPath ? (
          <img
            src={assetPath}
            alt={piece.unitName}
            style={{
              width: Math.floor(size * 0.52),
              height: Math.floor(size * 0.52),
              imageRendering: 'pixelated',
              pointerEvents: 'none',
            }}
          />
        ) : (
          <UnitSVG rank={piece.rank} side={piece.side} size={size} />
        )}
      </div>

      {/* Unit name — bottom */}
      <div className="piece-name">{piece.unitName}</div>

      {/* Revealed-in-combat indicator */}
      {piece.isRevealed && !isOwn && (
        <div className="piece-revealed-badge">!</div>
      )}
    </div>
  );
}
