import type { GamePiece, Rank, Side } from '../types';

const ISRAEL_PALETTE = {
  primary: '#2D5A8E',
  secondary: '#4A7A3D',
  accent: '#D4AF37',
  dark: '#1A3A5C',
  light: '#6B9BD2',
  skin: '#E8C39E',
  bg: '#0038b8',
};

const IRAN_PALETTE = {
  primary: '#2D6B3F',
  secondary: '#8B1A1A',
  accent: '#C0A030',
  dark: '#1A4A2A',
  light: '#4A8B5A',
  skin: '#D4A574',
  bg: '#239f40',
};

function getPalette(side: Side) {
  return side === 'israel' ? ISRAEL_PALETTE : IRAN_PALETTE;
}

function getRankDisplay(rank: Rank): string {
  if (rank === 'S') return 'SPY';
  if (rank === 'B') return 'BOMB';
  if (rank === 'F') return 'FLAG';
  return String(rank);
}

function getRankIcon(rank: Rank, side: Side): string {
  if (rank === 10) return side === 'israel' ? '👔' : '🧕';
  if (rank === 9) return '⭐';
  if (rank === 8) return '🎖';
  if (rank === 7) return '🪖';
  if (rank === 6) return '🎯';
  if (rank === 5) return '🔫';
  if (rank === 4) return '🎒';
  if (rank === 3) return '🔧';
  if (rank === 2) return '👁';
  if (rank === 'S') return '🕵';
  if (rank === 'B') return side === 'israel' ? '🛡' : '🚀';
  if (rank === 'F') return '🏳';
  return '?';
}

interface Props {
  piece: GamePiece;
  isSelected: boolean;
  size: number;
  isDragging?: boolean;
}

export default function PieceSprite({ piece, isSelected, size }: Props) {
  const palette = getPalette(piece.side);
  const isOwn = piece.side === 'israel';
  const showFace = isOwn || piece.isRevealed;

  if (!showFace) {
    // Hidden enemy piece - show back with emblem
    return (
      <div
        className={`piece-sprite piece-hidden ${isSelected ? 'piece-selected' : ''}`}
        style={{
          width: size,
          height: size,
          background: `linear-gradient(135deg, ${palette.dark}, ${palette.primary})`,
          borderColor: palette.accent,
        }}
      >
        <div className="piece-emblem">
          {piece.side === 'iran' ? (
            <svg viewBox="0 0 32 32" width={size * 0.5} height={size * 0.5}>
              <path d="M16 4 C12 8, 8 12, 8 18 C8 24, 12 28, 16 28 C20 28, 24 24, 24 18 C24 12, 20 8, 16 4Z" fill="#239f40" opacity="0.8"/>
              <path d="M14 12 L14 22 M14 15 L18 12 M14 18 L18 15" stroke="#fff" strokeWidth="1.5" fill="none"/>
            </svg>
          ) : (
            <svg viewBox="0 0 32 32" width={size * 0.5} height={size * 0.5}>
              <polygon points="16,4 18.5,11.5 26,11.5 20,16 22.5,24 16,19.5 9.5,24 12,16 6,11.5 13.5,11.5" fill="#0038b8" opacity="0.8"/>
              <polygon points="16,8 17.5,13 22,13 18.5,16 20,21 16,18 12,21 13.5,16 10,13 14.5,13" fill="#fff" opacity="0.6"/>
            </svg>
          )}
        </div>
        <div className="piece-question">?</div>
      </div>
    );
  }

  // Revealed piece - show rank and icon
  const isBomb = piece.rank === 'B';
  const isFlag = piece.rank === 'F';
  const bgGrad = isBomb
    ? `linear-gradient(135deg, #4a4a4a, #2a2a2a)`
    : isFlag
    ? `linear-gradient(135deg, ${palette.accent}, ${palette.dark})`
    : `linear-gradient(135deg, ${palette.light}, ${palette.primary})`;

  return (
    <div
      className={`piece-sprite piece-revealed ${isSelected ? 'piece-selected' : ''} ${piece.side}`}
      style={{
        width: size,
        height: size,
        background: bgGrad,
        borderColor: isSelected ? '#FFD700' : palette.accent,
      }}
    >
      <div className="piece-rank-badge" style={{ backgroundColor: palette.dark }}>
        {getRankDisplay(piece.rank)}
      </div>
      <div className="piece-icon">{getRankIcon(piece.rank, piece.side)}</div>
      <div className="piece-name">{piece.unitName}</div>
      {piece.isRevealed && !isOwn && (
        <div className="piece-revealed-badge">!</div>
      )}
    </div>
  );
}
