// ============================================================================
// Roaring Lion - Pixel Art Sprite Renderer
// Procedurally generates distinctive pixel art sprites for each unit type
// using Canvas 2D API (fillRect-based pixel art)
// ============================================================================

import type { Side, Rank } from '../types';

// ---------------------------------------------------------------------------
// Color Palettes (sprite-specific, richer than UI palette)
// ---------------------------------------------------------------------------

const ISRAEL_SPRITE = {
  primary: '#2D5A8E',
  secondary: '#4A7A3D',
  accent: '#D4AF37',
  skin: '#E8C39E',
  dark: '#1A3A5C',
  light: '#6B9BD2',
  badge: '#FFFFFF',
  hair: '#3B2F2F',
  gear: '#5A5A5A',
  gearLight: '#8A8A8A',
  black: '#111111',
};

const IRAN_SPRITE = {
  primary: '#2D6B3F',
  secondary: '#8B1A1A',
  accent: '#C0A030',
  skin: '#D4A574',
  dark: '#1A4A2A',
  light: '#4A8B5A',
  badge: '#FFFFFF',
  hair: '#2A1F1F',
  gear: '#4A4A4A',
  gearLight: '#7A7A7A',
  black: '#111111',
};

type SpritePalette = typeof ISRAEL_SPRITE;

function getPalette(side: Side): SpritePalette {
  return side === 'israel' ? ISRAEL_SPRITE : IRAN_SPRITE;
}

// ---------------------------------------------------------------------------
// Pixel drawing helpers
// ---------------------------------------------------------------------------

/** Size of one "pixel" block in canvas pixels. Adjusted to fit the cell. */
function px(size: number): number {
  return Math.max(1, Math.floor(size / 24));
}

/** Draw a single pixel-art block at grid position (gx, gy) relative to origin */
function block(
  ctx: CanvasRenderingContext2D,
  originX: number,
  originY: number,
  gx: number,
  gy: number,
  color: string,
  p: number
): void {
  ctx.fillStyle = color;
  ctx.fillRect(originX + gx * p, originY + gy * p, p, p);
}

/** Draw multiple pixel blocks from an array of [gx, gy] coords */
function blocks(
  ctx: CanvasRenderingContext2D,
  originX: number,
  originY: number,
  coords: [number, number][],
  color: string,
  p: number
): void {
  ctx.fillStyle = color;
  for (const [gx, gy] of coords) {
    ctx.fillRect(originX + gx * p, originY + gy * p, p, p);
  }
}

/** Draw a filled rectangle of pixel blocks */
function blockRect(
  ctx: CanvasRenderingContext2D,
  originX: number,
  originY: number,
  gx: number,
  gy: number,
  w: number,
  h: number,
  color: string,
  p: number
): void {
  ctx.fillStyle = color;
  ctx.fillRect(originX + gx * p, originY + gy * p, w * p, h * p);
}

// ---------------------------------------------------------------------------
// Emblem drawing
// ---------------------------------------------------------------------------

/**
 * Draw army emblem centered at (cx, cy).
 * Israel: Star of David (hexagram)
 * Iran: Crescent and sword
 */
export function drawArmyEmblem(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  side: Side
): void {
  const r = size * 0.35;

  ctx.save();
  if (side === 'israel') {
    // Star of David - two overlapping triangles
    ctx.strokeStyle = '#FFFFFF';
    ctx.fillStyle = 'rgba(0, 56, 184, 0.9)';
    ctx.lineWidth = Math.max(1, size * 0.04);

    // Upward triangle
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx - r * 0.866, cy + r * 0.5);
    ctx.lineTo(cx + r * 0.866, cy + r * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Downward triangle
    ctx.beginPath();
    ctx.moveTo(cx, cy + r);
    ctx.lineTo(cx - r * 0.866, cy - r * 0.5);
    ctx.lineTo(cx + r * 0.866, cy - r * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    // Crescent
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(cx - r * 0.15, cy, r * 0.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = side === 'iran' ? '#2D6B3F' : '#2D5A8E';
    ctx.beginPath();
    ctx.arc(cx + r * 0.2, cy, r * 0.65, 0, Math.PI * 2);
    ctx.fill();

    // Small circle (star) in crescent opening
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(cx + r * 0.15, cy, r * 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Sword / vertical line
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = Math.max(1, size * 0.05);
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.55, cy - r * 0.7);
    ctx.lineTo(cx + r * 0.55, cy + r * 0.7);
    ctx.stroke();
    // Sword crossguard
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.35, cy + r * 0.3);
    ctx.lineTo(cx + r * 0.75, cy + r * 0.3);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Card back (unrevealed piece)
// ---------------------------------------------------------------------------

function drawCardBack(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  side: Side
): void {
  const pal = getPalette(side);
  const margin = size * 0.06;
  const cardX = x + margin;
  const cardY = y + margin;
  const cardW = size - margin * 2;
  const cardH = size - margin * 2;
  const cornerR = size * 0.08;

  ctx.save();

  // Card body with rounded corners
  ctx.fillStyle = pal.dark;
  ctx.beginPath();
  ctx.moveTo(cardX + cornerR, cardY);
  ctx.lineTo(cardX + cardW - cornerR, cardY);
  ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + cornerR);
  ctx.lineTo(cardX + cardW, cardY + cardH - cornerR);
  ctx.quadraticCurveTo(cardX + cardW, cardY + cardH, cardX + cardW - cornerR, cardY + cardH);
  ctx.lineTo(cardX + cornerR, cardY + cardH);
  ctx.quadraticCurveTo(cardX, cardY + cardH, cardX, cardY + cardH - cornerR);
  ctx.lineTo(cardX, cardY + cornerR);
  ctx.quadraticCurveTo(cardX, cardY, cardX + cornerR, cardY);
  ctx.closePath();
  ctx.fill();

  // Inner border
  const bw = size * 0.03;
  ctx.strokeStyle = pal.accent;
  ctx.lineWidth = bw;
  ctx.stroke();

  // Diagonal pattern for texture
  ctx.strokeStyle = pal.primary;
  ctx.lineWidth = Math.max(1, size * 0.015);
  ctx.globalAlpha = 0.3;
  const step = size * 0.1;
  for (let i = -cardH; i < cardW; i += step) {
    ctx.beginPath();
    ctx.moveTo(cardX + i, cardY);
    ctx.lineTo(cardX + i + cardH, cardY + cardH);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Central emblem
  drawArmyEmblem(ctx, x + size / 2, y + size / 2, size * 0.65, side);

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Rank badge
// ---------------------------------------------------------------------------

/**
 * Draw a small rank badge in the bottom-right corner of a piece.
 */
export function drawRankBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rank: Rank,
  side: Side
): void {
  const pal = getPalette(side);
  const badgeSize = size * 0.26;
  const bx = x + size - badgeSize - size * 0.04;
  const by = y + size - badgeSize - size * 0.04;

  ctx.save();

  // Badge circle
  ctx.fillStyle = pal.dark;
  ctx.beginPath();
  ctx.arc(bx + badgeSize / 2, by + badgeSize / 2, badgeSize / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = pal.accent;
  ctx.lineWidth = Math.max(1, size * 0.025);
  ctx.stroke();

  // Rank text
  const label = String(rank);
  ctx.fillStyle = pal.badge;
  ctx.font = `bold ${Math.round(badgeSize * 0.65)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, bx + badgeSize / 2, by + badgeSize / 2 + 1);

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Highlight overlays
// ---------------------------------------------------------------------------

/**
 * Draw highlight overlay for selected/move/attack states.
 */
export function drawHighlight(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  type: 'selected' | 'move' | 'attack'
): void {
  ctx.save();

  const margin = 1;
  const hx = x + margin;
  const hy = y + margin;
  const hw = size - margin * 2;
  const hh = size - margin * 2;

  switch (type) {
    case 'selected': {
      // Gold glow border
      ctx.shadowColor = '#D4AF37';
      ctx.shadowBlur = size * 0.25;
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = Math.max(2, size * 0.06);
      ctx.strokeRect(hx, hy, hw, hh);
      // Second pass for extra glow
      ctx.shadowBlur = size * 0.15;
      ctx.strokeRect(hx, hy, hw, hh);
      break;
    }
    case 'move': {
      // Blue semi-transparent overlay
      ctx.fillStyle = 'rgba(100, 160, 255, 0.3)';
      ctx.fillRect(hx, hy, hw, hh);
      ctx.strokeStyle = 'rgba(100, 160, 255, 0.7)';
      ctx.lineWidth = Math.max(1, size * 0.04);
      ctx.strokeRect(hx + 2, hy + 2, hw - 4, hh - 4);
      // Corner dots
      const dotR = size * 0.04;
      ctx.fillStyle = 'rgba(100, 160, 255, 0.8)';
      for (const [dx, dy] of [[0.15, 0.15], [0.85, 0.15], [0.15, 0.85], [0.85, 0.85]]) {
        ctx.beginPath();
        ctx.arc(x + size * dx, y + size * dy, dotR, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'attack': {
      // Red semi-transparent overlay with X pattern
      ctx.fillStyle = 'rgba(255, 60, 60, 0.25)';
      ctx.fillRect(hx, hy, hw, hh);
      ctx.strokeStyle = 'rgba(255, 60, 60, 0.8)';
      ctx.lineWidth = Math.max(2, size * 0.05);
      ctx.strokeRect(hx + 1, hy + 1, hw - 2, hh - 2);
      // Crossed swords effect
      ctx.lineWidth = Math.max(1, size * 0.03);
      ctx.beginPath();
      ctx.moveTo(x + size * 0.2, y + size * 0.2);
      ctx.lineTo(x + size * 0.8, y + size * 0.8);
      ctx.moveTo(x + size * 0.8, y + size * 0.2);
      ctx.lineTo(x + size * 0.2, y + size * 0.8);
      ctx.stroke();
      break;
    }
  }

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Unit sprites - one function per rank
// Each draws a pixel art figure using fillRect blocks
// All sprites target a ~24x24 grid (scaled by px size)
// Origin is top-left of the sprite area
// ---------------------------------------------------------------------------

function drawLeader(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  side: Side,
  p: number
): void {
  const c = getPalette(side);

  // Crown / headdress
  if (side === 'israel') {
    // Dark formal hat (kippah/fedora style)
    blocks(ctx, ox, oy, [
      [9, 2], [10, 2], [11, 2], [12, 2], [13, 2], [14, 2],
    ], c.dark, p);
    blocks(ctx, ox, oy, [
      [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], [13, 3], [14, 3], [15, 3],
    ], c.dark, p);
    // Gold band on hat
    blocks(ctx, ox, oy, [
      [8, 4], [9, 4], [10, 4], [11, 4], [12, 4], [13, 4], [14, 4], [15, 4],
    ], c.accent, p);
  } else {
    // Black turban / headdress
    blocks(ctx, ox, oy, [
      [10, 1], [11, 1], [12, 1], [13, 1],
    ], c.black, p);
    blocks(ctx, ox, oy, [
      [9, 2], [10, 2], [11, 2], [12, 2], [13, 2], [14, 2],
    ], c.black, p);
    blocks(ctx, ox, oy, [
      [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], [13, 3], [14, 3], [15, 3],
    ], c.black, p);
    blocks(ctx, ox, oy, [
      [8, 4], [9, 4], [10, 4], [11, 4], [12, 4], [13, 4], [14, 4], [15, 4],
    ], c.black, p);
  }

  // Face
  blocks(ctx, ox, oy, [
    [9, 5], [10, 5], [11, 5], [12, 5], [13, 5], [14, 5],
    [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6],
    [9, 7], [10, 7], [11, 7], [12, 7], [13, 7], [14, 7],
    [10, 8], [11, 8], [12, 8], [13, 8],
  ], c.skin, p);
  // Eyes
  blocks(ctx, ox, oy, [[10, 6], [13, 6]], c.black, p);
  // Mouth
  block(ctx, ox, oy, 11, 7, c.dark, p);
  block(ctx, ox, oy, 12, 7, c.dark, p);

  // Beard (Iran - full beard; Israel - shorter)
  if (side === 'iran') {
    blocks(ctx, ox, oy, [
      [9, 7], [14, 7],
      [9, 8], [10, 8], [13, 8], [14, 8],
      [10, 9], [11, 9], [12, 9], [13, 9],
    ], c.hair, p);
  } else {
    blocks(ctx, ox, oy, [
      [10, 8], [13, 8],
    ], c.hair, p);
  }

  // Neck
  blocks(ctx, ox, oy, [[11, 9], [12, 9]], c.skin, p);

  // Body - formal suit/robe
  const bodyColor = side === 'israel' ? c.dark : c.primary;
  blocks(ctx, ox, oy, [
    [8, 10], [9, 10], [10, 10], [11, 10], [12, 10], [13, 10], [14, 10], [15, 10],
    [7, 11], [8, 11], [9, 11], [10, 11], [11, 11], [12, 11], [13, 11], [14, 11], [15, 11], [16, 11],
    [7, 12], [8, 12], [9, 12], [10, 12], [11, 12], [12, 12], [13, 12], [14, 12], [15, 12], [16, 12],
    [7, 13], [8, 13], [9, 13], [10, 13], [11, 13], [12, 13], [13, 13], [14, 13], [15, 13], [16, 13],
    [8, 14], [9, 14], [10, 14], [11, 14], [12, 14], [13, 14], [14, 14], [15, 14],
    [8, 15], [9, 15], [10, 15], [11, 15], [12, 15], [13, 15], [14, 15], [15, 15],
    [8, 16], [9, 16], [10, 16], [11, 16], [12, 16], [13, 16], [14, 16], [15, 16],
  ], bodyColor, p);

  // Gold accent lapels / decoration
  blocks(ctx, ox, oy, [
    [11, 10], [12, 10],
    [11, 11], [12, 11],
    [11, 12], [12, 12],
  ], c.accent, p);

  // Emblem on chest
  if (side === 'israel') {
    // Small Star of David hint
    blocks(ctx, ox, oy, [[11, 13], [12, 13]], c.badge, p);
    block(ctx, ox, oy, 11, 14, c.light, p);
    block(ctx, ox, oy, 12, 14, c.light, p);
  } else {
    // Crescent hint
    block(ctx, ox, oy, 11, 13, c.secondary, p);
    block(ctx, ox, oy, 12, 13, c.secondary, p);
  }

  // Arms (hands at side)
  blocks(ctx, ox, oy, [
    [6, 11], [6, 12], [6, 13],
    [17, 11], [17, 12], [17, 13],
  ], bodyColor, p);
  // Hands
  blocks(ctx, ox, oy, [[6, 14], [17, 14]], c.skin, p);

  // Legs / lower robe
  blocks(ctx, ox, oy, [
    [9, 17], [10, 17], [11, 17], [12, 17], [13, 17], [14, 17],
    [9, 18], [10, 18], [13, 18], [14, 18],
    [9, 19], [10, 19], [13, 19], [14, 19],
  ], side === 'israel' ? '#1A1A2E' : c.dark, p);

  // Shoes
  blocks(ctx, ox, oy, [
    [8, 20], [9, 20], [10, 20],
    [13, 20], [14, 20], [15, 20],
  ], c.black, p);
}

function drawGeneral(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  side: Side,
  p: number
): void {
  const c = getPalette(side);

  // Military cap with visor
  blocks(ctx, ox, oy, [
    [9, 2], [10, 2], [11, 2], [12, 2], [13, 2], [14, 2],
  ], c.primary, p);
  blocks(ctx, ox, oy, [
    [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], [13, 3], [14, 3], [15, 3],
  ], c.primary, p);
  // Cap peak / visor
  blocks(ctx, ox, oy, [
    [7, 4], [8, 4], [9, 4], [10, 4], [11, 4], [12, 4], [13, 4], [14, 4], [15, 4], [16, 4],
  ], c.dark, p);
  // Gold cap band
  blocks(ctx, ox, oy, [
    [9, 3], [10, 3], [11, 3], [12, 3], [13, 3], [14, 3],
  ], c.accent, p);

  // Face
  blocks(ctx, ox, oy, [
    [9, 5], [10, 5], [11, 5], [12, 5], [13, 5], [14, 5],
    [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6],
    [9, 7], [10, 7], [11, 7], [12, 7], [13, 7], [14, 7],
    [10, 8], [11, 8], [12, 8], [13, 8],
  ], c.skin, p);
  blocks(ctx, ox, oy, [[10, 6], [13, 6]], c.black, p);
  blocks(ctx, ox, oy, [[11, 7], [12, 7]], c.dark, p);

  // Neck
  blocks(ctx, ox, oy, [[11, 9], [12, 9]], c.skin, p);

  // Decorated uniform body
  blocks(ctx, ox, oy, [
    [8, 10], [9, 10], [10, 10], [11, 10], [12, 10], [13, 10], [14, 10], [15, 10],
    [7, 11], [8, 11], [9, 11], [10, 11], [11, 11], [12, 11], [13, 11], [14, 11], [15, 11], [16, 11],
    [7, 12], [8, 12], [9, 12], [10, 12], [11, 12], [12, 12], [13, 12], [14, 12], [15, 12], [16, 12],
    [7, 13], [8, 13], [9, 13], [10, 13], [11, 13], [12, 13], [13, 13], [14, 13], [15, 13], [16, 13],
    [8, 14], [9, 14], [10, 14], [11, 14], [12, 14], [13, 14], [14, 14], [15, 14],
    [8, 15], [9, 15], [10, 15], [11, 15], [12, 15], [13, 15], [14, 15], [15, 15],
  ], c.primary, p);

  // Gold epaulettes (shoulders)
  blocks(ctx, ox, oy, [[7, 10], [8, 10], [15, 10], [16, 10]], c.accent, p);

  // Medals on chest (3 gold + accent dots)
  blocks(ctx, ox, oy, [[9, 12], [10, 12], [9, 13]], c.accent, p);
  blocks(ctx, ox, oy, [[10, 13]], c.secondary, p);
  block(ctx, ox, oy, 9, 14, c.accent, p);

  // Belt
  blockRect(ctx, ox, oy, 8, 15, 8, 1, c.accent, p);

  // Arms
  blocks(ctx, ox, oy, [
    [6, 11], [6, 12], [6, 13], [6, 14],
    [17, 11], [17, 12], [17, 13], [17, 14],
  ], c.primary, p);
  blocks(ctx, ox, oy, [[6, 15], [17, 15]], c.skin, p);

  // Legs
  blocks(ctx, ox, oy, [
    [9, 16], [10, 16], [13, 16], [14, 16],
    [9, 17], [10, 17], [13, 17], [14, 17],
    [9, 18], [10, 18], [13, 18], [14, 18],
  ], c.dark, p);
  blocks(ctx, ox, oy, [
    [8, 19], [9, 19], [10, 19],
    [13, 19], [14, 19], [15, 19],
  ], c.black, p);
}

function drawColonel(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  side: Side,
  p: number
): void {
  const c = getPalette(side);

  // Beret
  blocks(ctx, ox, oy, [
    [9, 3], [10, 3], [11, 3], [12, 3], [13, 3],
  ], side === 'israel' ? '#8B0000' : c.primary, p);
  blocks(ctx, ox, oy, [
    [8, 4], [9, 4], [10, 4], [11, 4], [12, 4], [13, 4], [14, 4],
  ], side === 'israel' ? '#8B0000' : c.primary, p);
  // Beret flash
  block(ctx, ox, oy, 8, 4, c.accent, p);

  // Face
  blocks(ctx, ox, oy, [
    [9, 5], [10, 5], [11, 5], [12, 5], [13, 5], [14, 5],
    [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6],
    [9, 7], [10, 7], [11, 7], [12, 7], [13, 7], [14, 7],
    [10, 8], [11, 8], [12, 8], [13, 8],
  ], c.skin, p);
  blocks(ctx, ox, oy, [[10, 6], [13, 6]], c.black, p);
  blocks(ctx, ox, oy, [[11, 7], [12, 7]], c.dark, p);

  // Neck
  blocks(ctx, ox, oy, [[11, 9], [12, 9]], c.skin, p);

  // Uniform with collar
  blocks(ctx, ox, oy, [
    [9, 10], [10, 10], [11, 10], [12, 10], [13, 10], [14, 10],
    [8, 11], [9, 11], [10, 11], [11, 11], [12, 11], [13, 11], [14, 11], [15, 11],
    [8, 12], [9, 12], [10, 12], [11, 12], [12, 12], [13, 12], [14, 12], [15, 12],
    [8, 13], [9, 13], [10, 13], [11, 13], [12, 13], [13, 13], [14, 13], [15, 13],
    [8, 14], [9, 14], [10, 14], [11, 14], [12, 14], [13, 14], [14, 14], [15, 14],
    [9, 15], [10, 15], [11, 15], [12, 15], [13, 15], [14, 15],
  ], c.primary, p);

  // Collar
  blocks(ctx, ox, oy, [[10, 10], [13, 10]], c.dark, p);
  // Rank insignia (two pips)
  blocks(ctx, ox, oy, [[14, 11], [14, 12]], c.accent, p);

  // Belt
  blockRect(ctx, ox, oy, 9, 15, 6, 1, c.gear, p);
  block(ctx, ox, oy, 12, 15, c.accent, p);

  // Arms
  blocks(ctx, ox, oy, [
    [7, 11], [7, 12], [7, 13], [7, 14],
    [16, 11], [16, 12], [16, 13], [16, 14],
  ], c.primary, p);
  blocks(ctx, ox, oy, [[7, 15], [16, 15]], c.skin, p);

  // Legs
  blocks(ctx, ox, oy, [
    [9, 16], [10, 16], [13, 16], [14, 16],
    [9, 17], [10, 17], [13, 17], [14, 17],
    [9, 18], [10, 18], [13, 18], [14, 18],
  ], c.dark, p);
  blocks(ctx, ox, oy, [
    [8, 19], [9, 19], [10, 19],
    [13, 19], [14, 19], [15, 19],
  ], c.black, p);
}

function drawMajor(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  side: Side,
  p: number
): void {
  const c = getPalette(side);

  // Helmet
  blocks(ctx, ox, oy, [
    [10, 2], [11, 2], [12, 2], [13, 2],
  ], c.secondary, p);
  blocks(ctx, ox, oy, [
    [9, 3], [10, 3], [11, 3], [12, 3], [13, 3], [14, 3],
    [8, 4], [9, 4], [10, 4], [11, 4], [12, 4], [13, 4], [14, 4], [15, 4],
  ], c.secondary, p);
  // Helmet rim
  blocks(ctx, ox, oy, [
    [7, 5], [8, 5], [9, 5], [14, 5], [15, 5], [16, 5],
  ], c.dark, p);

  // Face (partially under helmet)
  blocks(ctx, ox, oy, [
    [10, 5], [11, 5], [12, 5], [13, 5],
    [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6],
    [9, 7], [10, 7], [11, 7], [12, 7], [13, 7], [14, 7],
    [10, 8], [11, 8], [12, 8], [13, 8],
  ], c.skin, p);
  blocks(ctx, ox, oy, [[10, 6], [13, 6]], c.black, p);
  blocks(ctx, ox, oy, [[11, 7], [12, 7]], c.dark, p);

  // Neck
  blocks(ctx, ox, oy, [[11, 9], [12, 9]], c.skin, p);

  // Body with mid-rank uniform
  blocks(ctx, ox, oy, [
    [9, 10], [10, 10], [11, 10], [12, 10], [13, 10], [14, 10],
    [8, 11], [9, 11], [10, 11], [11, 11], [12, 11], [13, 11], [14, 11], [15, 11],
    [8, 12], [9, 12], [10, 12], [11, 12], [12, 12], [13, 12], [14, 12], [15, 12],
    [8, 13], [9, 13], [10, 13], [11, 13], [12, 13], [13, 13], [14, 13], [15, 13],
    [9, 14], [10, 14], [11, 14], [12, 14], [13, 14], [14, 14],
    [9, 15], [10, 15], [11, 15], [12, 15], [13, 15], [14, 15],
  ], c.primary, p);

  // Insignia stripe
  blocks(ctx, ox, oy, [[9, 11], [9, 12]], c.accent, p);

  // Belt
  blockRect(ctx, ox, oy, 9, 15, 6, 1, c.gear, p);

  // Arms
  blocks(ctx, ox, oy, [
    [7, 11], [7, 12], [7, 13],
    [16, 11], [16, 12], [16, 13],
  ], c.primary, p);
  blocks(ctx, ox, oy, [[7, 14], [16, 14]], c.skin, p);

  // Legs
  blocks(ctx, ox, oy, [
    [9, 16], [10, 16], [13, 16], [14, 16],
    [9, 17], [10, 17], [13, 17], [14, 17],
    [9, 18], [10, 18], [13, 18], [14, 18],
  ], c.secondary, p);
  blocks(ctx, ox, oy, [
    [8, 19], [9, 19], [10, 19],
    [13, 19], [14, 19], [15, 19],
  ], c.black, p);
}

function drawCaptain(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  side: Side,
  p: number
): void {
  const c = getPalette(side);

  // Helmet (tactical)
  blocks(ctx, ox, oy, [
    [10, 3], [11, 3], [12, 3], [13, 3],
    [9, 4], [10, 4], [11, 4], [12, 4], [13, 4], [14, 4],
  ], c.secondary, p);

  // Face
  blocks(ctx, ox, oy, [
    [9, 5], [10, 5], [11, 5], [12, 5], [13, 5], [14, 5],
    [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6],
    [10, 7], [11, 7], [12, 7], [13, 7],
    [10, 8], [11, 8], [12, 8], [13, 8],
  ], c.skin, p);
  blocks(ctx, ox, oy, [[10, 6], [13, 6]], c.black, p);
  block(ctx, ox, oy, 11, 7, c.dark, p);
  block(ctx, ox, oy, 12, 7, c.dark, p);

  // Neck
  blocks(ctx, ox, oy, [[11, 9], [12, 9]], c.skin, p);

  // Tactical vest over uniform
  // Base uniform
  blocks(ctx, ox, oy, [
    [8, 10], [9, 10], [10, 10], [11, 10], [12, 10], [13, 10], [14, 10], [15, 10],
    [8, 11], [9, 11], [10, 11], [11, 11], [12, 11], [13, 11], [14, 11], [15, 11],
    [8, 12], [9, 12], [10, 12], [11, 12], [12, 12], [13, 12], [14, 12], [15, 12],
    [8, 13], [9, 13], [10, 13], [11, 13], [12, 13], [13, 13], [14, 13], [15, 13],
    [9, 14], [10, 14], [11, 14], [12, 14], [13, 14], [14, 14],
    [9, 15], [10, 15], [11, 15], [12, 15], [13, 15], [14, 15],
  ], c.primary, p);

  // Tactical vest overlay (pouches)
  blocks(ctx, ox, oy, [
    [9, 11], [10, 11], [13, 11], [14, 11],
    [9, 12], [10, 12], [13, 12], [14, 12],
    [9, 13], [10, 13], [13, 13], [14, 13],
  ], c.gear, p);
  // Pouch detail
  blocks(ctx, ox, oy, [[9, 12], [13, 12]], c.gearLight, p);

  // Belt with buckle
  blockRect(ctx, ox, oy, 9, 15, 6, 1, c.gear, p);
  block(ctx, ox, oy, 12, 15, c.accent, p);

  // Arms
  blocks(ctx, ox, oy, [
    [7, 11], [7, 12], [7, 13],
    [16, 11], [16, 12], [16, 13],
  ], c.primary, p);
  blocks(ctx, ox, oy, [[7, 14], [16, 14]], c.skin, p);

  // Legs
  blocks(ctx, ox, oy, [
    [9, 16], [10, 16], [13, 16], [14, 16],
    [9, 17], [10, 17], [13, 17], [14, 17],
    [9, 18], [10, 18], [13, 18], [14, 18],
  ], c.secondary, p);
  blocks(ctx, ox, oy, [
    [8, 19], [9, 19], [10, 19],
    [13, 19], [14, 19], [15, 19],
  ], c.black, p);
}

function drawLieutenant(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  side: Side,
  p: number
): void {
  const c = getPalette(side);

  // Cap
  blocks(ctx, ox, oy, [
    [10, 3], [11, 3], [12, 3], [13, 3],
    [9, 4], [10, 4], [11, 4], [12, 4], [13, 4], [14, 4],
  ], c.primary, p);

  // Face
  blocks(ctx, ox, oy, [
    [9, 5], [10, 5], [11, 5], [12, 5], [13, 5], [14, 5],
    [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6],
    [10, 7], [11, 7], [12, 7], [13, 7],
    [10, 8], [11, 8], [12, 8], [13, 8],
  ], c.skin, p);
  blocks(ctx, ox, oy, [[10, 6], [13, 6]], c.black, p);
  blocks(ctx, ox, oy, [[11, 7], [12, 7]], c.dark, p);

  // Neck
  blocks(ctx, ox, oy, [[11, 9], [12, 9]], c.skin, p);

  // Body
  blocks(ctx, ox, oy, [
    [9, 10], [10, 10], [11, 10], [12, 10], [13, 10], [14, 10],
    [8, 11], [9, 11], [10, 11], [11, 11], [12, 11], [13, 11], [14, 11], [15, 11],
    [8, 12], [9, 12], [10, 12], [11, 12], [12, 12], [13, 12], [14, 12], [15, 12],
    [8, 13], [9, 13], [10, 13], [11, 13], [12, 13], [13, 13], [14, 13], [15, 13],
    [9, 14], [10, 14], [11, 14], [12, 14], [13, 14], [14, 14],
    [9, 15], [10, 15], [11, 15], [12, 15], [13, 15], [14, 15],
  ], c.primary, p);

  // Belt
  blockRect(ctx, ox, oy, 9, 15, 6, 1, c.gear, p);

  // Right arm holding rifle
  blocks(ctx, ox, oy, [
    [7, 11], [7, 12], [7, 13],
  ], c.primary, p);
  block(ctx, ox, oy, 7, 14, c.skin, p);

  // Left arm forward (holding rifle)
  blocks(ctx, ox, oy, [
    [16, 11], [16, 12],
  ], c.primary, p);
  blocks(ctx, ox, oy, [[17, 12], [17, 13]], c.skin, p);

  // Rifle
  blocks(ctx, ox, oy, [
    [18, 7], [18, 8], [18, 9], [18, 10], [18, 11], [18, 12], [18, 13],
  ], c.gear, p);
  // Rifle stock
  blocks(ctx, ox, oy, [[18, 14], [19, 14]], c.hair, p);
  // Barrel tip
  block(ctx, ox, oy, 18, 6, c.gearLight, p);

  // Legs
  blocks(ctx, ox, oy, [
    [9, 16], [10, 16], [13, 16], [14, 16],
    [9, 17], [10, 17], [13, 17], [14, 17],
    [9, 18], [10, 18], [13, 18], [14, 18],
  ], c.secondary, p);
  blocks(ctx, ox, oy, [
    [8, 19], [9, 19], [10, 19],
    [13, 19], [14, 19], [15, 19],
  ], c.black, p);
}

function drawSergeant(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  side: Side,
  p: number
): void {
  const c = getPalette(side);

  // Helmet
  blocks(ctx, ox, oy, [
    [10, 3], [11, 3], [12, 3], [13, 3],
    [9, 4], [10, 4], [11, 4], [12, 4], [13, 4], [14, 4],
  ], c.secondary, p);

  // Face
  blocks(ctx, ox, oy, [
    [9, 5], [10, 5], [11, 5], [12, 5], [13, 5], [14, 5],
    [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6],
    [10, 7], [11, 7], [12, 7], [13, 7],
    [10, 8], [11, 8], [12, 8], [13, 8],
  ], c.skin, p);
  blocks(ctx, ox, oy, [[10, 6], [13, 6]], c.black, p);
  blocks(ctx, ox, oy, [[11, 7], [12, 7]], c.dark, p);

  // Neck
  blocks(ctx, ox, oy, [[11, 9], [12, 9]], c.skin, p);

  // Body
  blocks(ctx, ox, oy, [
    [9, 10], [10, 10], [11, 10], [12, 10], [13, 10], [14, 10],
    [8, 11], [9, 11], [10, 11], [11, 11], [12, 11], [13, 11], [14, 11], [15, 11],
    [8, 12], [9, 12], [10, 12], [11, 12], [12, 12], [13, 12], [14, 12], [15, 12],
    [8, 13], [9, 13], [10, 13], [11, 13], [12, 13], [13, 13], [14, 13], [15, 13],
    [9, 14], [10, 14], [11, 14], [12, 14], [13, 14], [14, 14],
    [9, 15], [10, 15], [11, 15], [12, 15], [13, 15], [14, 15],
  ], c.primary, p);

  // Backpack (distinctive feature)
  blocks(ctx, ox, oy, [
    [5, 10], [6, 10], [7, 10],
    [5, 11], [6, 11], [7, 11],
    [5, 12], [6, 12], [7, 12],
    [5, 13], [6, 13], [7, 13],
    [5, 14], [6, 14], [7, 14],
  ], c.gear, p);
  // Backpack detail
  blocks(ctx, ox, oy, [[6, 11], [6, 13]], c.gearLight, p);
  // Backpack straps
  blocks(ctx, ox, oy, [[7, 10], [7, 11]], c.dark, p);

  // Belt
  blockRect(ctx, ox, oy, 9, 15, 6, 1, c.gear, p);
  // Canteen
  blocks(ctx, ox, oy, [[15, 14], [16, 14], [15, 15], [16, 15]], c.secondary, p);

  // Right arm
  blocks(ctx, ox, oy, [[16, 11], [16, 12], [16, 13]], c.primary, p);
  block(ctx, ox, oy, 16, 14, c.skin, p);

  // Legs
  blocks(ctx, ox, oy, [
    [9, 16], [10, 16], [13, 16], [14, 16],
    [9, 17], [10, 17], [13, 17], [14, 17],
    [9, 18], [10, 18], [13, 18], [14, 18],
  ], c.secondary, p);
  // Boots
  blocks(ctx, ox, oy, [
    [8, 19], [9, 19], [10, 19],
    [13, 19], [14, 19], [15, 19],
  ], c.black, p);
}

function drawMiner(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  side: Side,
  p: number
): void {
  const c = getPalette(side);

  // Hard hat / engineer helmet
  blocks(ctx, ox, oy, [
    [10, 2], [11, 2], [12, 2], [13, 2],
  ], '#E8C520', p);
  blocks(ctx, ox, oy, [
    [9, 3], [10, 3], [11, 3], [12, 3], [13, 3], [14, 3],
    [8, 4], [9, 4], [10, 4], [11, 4], [12, 4], [13, 4], [14, 4], [15, 4],
  ], '#E8C520', p);
  // Helmet light
  block(ctx, ox, oy, 12, 2, '#FF4444', p);

  // Face
  blocks(ctx, ox, oy, [
    [9, 5], [10, 5], [11, 5], [12, 5], [13, 5], [14, 5],
    [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6],
    [10, 7], [11, 7], [12, 7], [13, 7],
    [10, 8], [11, 8], [12, 8], [13, 8],
  ], c.skin, p);
  blocks(ctx, ox, oy, [[10, 6], [13, 6]], c.black, p);
  blocks(ctx, ox, oy, [[11, 7], [12, 7]], c.dark, p);

  // Neck
  blocks(ctx, ox, oy, [[11, 9], [12, 9]], c.skin, p);

  // Body (work uniform, slightly different shade)
  blocks(ctx, ox, oy, [
    [9, 10], [10, 10], [11, 10], [12, 10], [13, 10], [14, 10],
    [8, 11], [9, 11], [10, 11], [11, 11], [12, 11], [13, 11], [14, 11], [15, 11],
    [8, 12], [9, 12], [10, 12], [11, 12], [12, 12], [13, 12], [14, 12], [15, 12],
    [8, 13], [9, 13], [10, 13], [11, 13], [12, 13], [13, 13], [14, 13], [15, 13],
    [9, 14], [10, 14], [11, 14], [12, 14], [13, 14], [14, 14],
    [9, 15], [10, 15], [11, 15], [12, 15], [13, 15], [14, 15],
  ], c.secondary, p);

  // Tool belt
  blockRect(ctx, ox, oy, 9, 15, 6, 1, c.gear, p);
  // Tools hanging
  blocks(ctx, ox, oy, [[10, 16], [13, 16]], c.gearLight, p);

  // Left arm holding wrench
  blocks(ctx, ox, oy, [
    [7, 11], [7, 12], [7, 13],
  ], c.secondary, p);
  block(ctx, ox, oy, 7, 14, c.skin, p);

  // Wrench in left hand (distinctive tool)
  blocks(ctx, ox, oy, [
    [5, 11], [6, 11],
    [6, 12],
    [6, 13],
    [5, 14], [6, 14],
  ], c.gearLight, p);

  // Right arm
  blocks(ctx, ox, oy, [[16, 11], [16, 12], [16, 13]], c.secondary, p);
  block(ctx, ox, oy, 16, 14, c.skin, p);

  // Wire cutters / bomb kit on right side
  blocks(ctx, ox, oy, [
    [17, 12], [17, 13],
  ], '#CC4444', p);
  block(ctx, ox, oy, 17, 14, c.gear, p);

  // Legs
  blocks(ctx, ox, oy, [
    [9, 16], [10, 16], [13, 16], [14, 16],
    [9, 17], [10, 17], [13, 17], [14, 17],
    [9, 18], [10, 18], [13, 18], [14, 18],
  ], c.dark, p);
  blocks(ctx, ox, oy, [
    [8, 19], [9, 19], [10, 19],
    [13, 19], [14, 19], [15, 19],
  ], c.black, p);
}

function drawScout(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  side: Side,
  p: number
): void {
  const c = getPalette(side);
  const tactical = '#2A2A2A';
  const tacticalLight = '#444444';

  // No helmet -- balaclava / head wrap
  blocks(ctx, ox, oy, [
    [10, 3], [11, 3], [12, 3], [13, 3],
    [9, 4], [10, 4], [11, 4], [12, 4], [13, 4], [14, 4],
  ], tactical, p);

  // Face (narrow slit for eyes)
  blocks(ctx, ox, oy, [
    [9, 5], [14, 5],
  ], tactical, p);
  blocks(ctx, ox, oy, [
    [10, 5], [11, 5], [12, 5], [13, 5],
  ], c.skin, p);
  // Eyes visible through mask
  blocks(ctx, ox, oy, [[10, 5], [13, 5]], c.black, p);
  // Balaclava lower
  blocks(ctx, ox, oy, [
    [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6],
    [10, 7], [11, 7], [12, 7], [13, 7],
    [10, 8], [11, 8], [12, 8], [13, 8],
  ], tactical, p);

  // Neck
  blocks(ctx, ox, oy, [[11, 9], [12, 9]], tactical, p);

  // Slim tactical body (lighter build)
  blocks(ctx, ox, oy, [
    [9, 10], [10, 10], [11, 10], [12, 10], [13, 10], [14, 10],
    [9, 11], [10, 11], [11, 11], [12, 11], [13, 11], [14, 11],
    [9, 12], [10, 12], [11, 12], [12, 12], [13, 12], [14, 12],
    [9, 13], [10, 13], [11, 13], [12, 13], [13, 13], [14, 13],
    [9, 14], [10, 14], [11, 14], [12, 14], [13, 14], [14, 14],
  ], tactical, p);

  // Side color stripes to show team
  blocks(ctx, ox, oy, [[9, 11], [9, 12], [9, 13]], c.primary, p);
  blocks(ctx, ox, oy, [[14, 11], [14, 12], [14, 13]], c.primary, p);

  // Utility belt
  blockRect(ctx, ox, oy, 9, 14, 6, 1, tacticalLight, p);

  // Arms (slim, tucked)
  blocks(ctx, ox, oy, [
    [8, 11], [8, 12],
    [15, 11], [15, 12],
  ], tactical, p);
  blocks(ctx, ox, oy, [[8, 13], [15, 13]], c.skin, p);

  // Binoculars on chest
  blocks(ctx, ox, oy, [[11, 11], [12, 11]], tacticalLight, p);

  // Legs (slim, running stance with one forward)
  blocks(ctx, ox, oy, [
    [9, 15], [10, 15], [13, 15], [14, 15],
    [8, 16], [9, 16], [14, 16], [15, 16],
    [7, 17], [8, 17], [15, 17], [16, 17],
  ], tactical, p);
  // Boots
  blocks(ctx, ox, oy, [
    [6, 18], [7, 18], [8, 18],
    [15, 18], [16, 18], [17, 18],
  ], c.black, p);
}

function drawSpy(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  side: Side,
  p: number
): void {
  const c = getPalette(side);
  const suitColor = '#1A1A2E';
  const suitLight = '#2A2A3E';

  // Fedora hat
  blocks(ctx, ox, oy, [
    [10, 2], [11, 2], [12, 2], [13, 2],
  ], suitColor, p);
  blocks(ctx, ox, oy, [
    [9, 3], [10, 3], [11, 3], [12, 3], [13, 3], [14, 3],
  ], suitColor, p);
  // Hat brim
  blocks(ctx, ox, oy, [
    [7, 4], [8, 4], [9, 4], [10, 4], [11, 4], [12, 4], [13, 4], [14, 4], [15, 4], [16, 4],
  ], suitColor, p);
  // Hat band
  blocks(ctx, ox, oy, [[9, 3], [10, 3], [13, 3], [14, 3]], c.accent, p);

  // Face (partially shadowed)
  blocks(ctx, ox, oy, [
    [9, 5], [10, 5], [11, 5], [12, 5], [13, 5], [14, 5],
    [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6],
    [10, 7], [11, 7], [12, 7], [13, 7],
    [10, 8], [11, 8], [12, 8], [13, 8],
  ], c.skin, p);
  // Sunglasses (key spy feature)
  blocks(ctx, ox, oy, [
    [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6],
  ], c.black, p);
  // Sunglasses frame highlight
  blocks(ctx, ox, oy, [[10, 6], [13, 6]], '#333355', p);

  // Smirk
  block(ctx, ox, oy, 12, 7, c.dark, p);

  // Neck with tie
  blocks(ctx, ox, oy, [[11, 9], [12, 9]], c.skin, p);

  // Suit body (dark, formal)
  blocks(ctx, ox, oy, [
    [9, 10], [10, 10], [11, 10], [12, 10], [13, 10], [14, 10],
    [8, 11], [9, 11], [10, 11], [11, 11], [12, 11], [13, 11], [14, 11], [15, 11],
    [8, 12], [9, 12], [10, 12], [11, 12], [12, 12], [13, 12], [14, 12], [15, 12],
    [8, 13], [9, 13], [10, 13], [11, 13], [12, 13], [13, 13], [14, 13], [15, 13],
    [9, 14], [10, 14], [11, 14], [12, 14], [13, 14], [14, 14],
    [9, 15], [10, 15], [11, 15], [12, 15], [13, 15], [14, 15],
  ], suitColor, p);

  // Suit lapels
  blocks(ctx, ox, oy, [
    [10, 10], [13, 10],
    [10, 11], [13, 11],
    [10, 12], [13, 12],
  ], suitLight, p);

  // Tie
  blocks(ctx, ox, oy, [
    [11, 10], [12, 10],
    [11, 11],
    [12, 12],
    [11, 13],
    [12, 14],
  ], c.secondary, p);

  // Arms (suit sleeves)
  blocks(ctx, ox, oy, [
    [7, 11], [7, 12], [7, 13], [7, 14],
    [16, 11], [16, 12], [16, 13], [16, 14],
  ], suitColor, p);
  blocks(ctx, ox, oy, [[7, 15], [16, 15]], c.skin, p);

  // Suit pants
  blocks(ctx, ox, oy, [
    [9, 16], [10, 16], [13, 16], [14, 16],
    [9, 17], [10, 17], [13, 17], [14, 17],
    [9, 18], [10, 18], [13, 18], [14, 18],
  ], '#0D0D1A', p);
  // Dress shoes
  blocks(ctx, ox, oy, [
    [8, 19], [9, 19], [10, 19],
    [13, 19], [14, 19], [15, 19],
  ], c.black, p);
}

function drawBomb(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  side: Side,
  p: number
): void {
  const c = getPalette(side);

  if (side === 'israel') {
    // Iron Dome launcher
    // Base platform
    blocks(ctx, ox, oy, [
      [6, 17], [7, 17], [8, 17], [9, 17], [10, 17], [11, 17],
      [12, 17], [13, 17], [14, 17], [15, 17], [16, 17], [17, 17],
      [7, 18], [8, 18], [9, 18], [10, 18], [11, 18], [12, 18],
      [13, 18], [14, 18], [15, 18], [16, 18],
    ], c.gear, p);

    // Launcher body
    blocks(ctx, ox, oy, [
      [9, 14], [10, 14], [11, 14], [12, 14], [13, 14], [14, 14],
      [9, 15], [10, 15], [11, 15], [12, 15], [13, 15], [14, 15],
      [9, 16], [10, 16], [11, 16], [12, 16], [13, 16], [14, 16],
    ], c.gear, p);
    blocks(ctx, ox, oy, [[10, 15], [11, 15], [12, 15], [13, 15]], c.gearLight, p);

    // Missile tubes (3 angled tubes)
    blocks(ctx, ox, oy, [
      [8, 8], [9, 8], [10, 9], [10, 10], [10, 11], [10, 12], [10, 13],
    ], c.gearLight, p);
    blocks(ctx, ox, oy, [
      [11, 7], [11, 8], [11, 9], [11, 10], [11, 11], [11, 12], [11, 13],
    ], c.gear, p);
    blocks(ctx, ox, oy, [
      [12, 7], [12, 8], [12, 9], [12, 10], [12, 11], [12, 12], [12, 13],
    ], c.gear, p);
    blocks(ctx, ox, oy, [
      [13, 8], [14, 8], [13, 9], [13, 10], [13, 11], [13, 12], [13, 13],
    ], c.gearLight, p);

    // Missile tips
    blocks(ctx, ox, oy, [[8, 7], [9, 7]], '#CC4444', p);
    blocks(ctx, ox, oy, [[11, 6], [12, 6]], '#CC4444', p);
    blocks(ctx, ox, oy, [[14, 7], [15, 7]], '#CC4444', p);

    // Star of David label
    blocks(ctx, ox, oy, [[11, 15], [12, 15]], c.primary, p);
  } else {
    // Shahab Missile
    // Missile body (vertical)
    blocks(ctx, ox, oy, [
      [10, 4], [11, 4], [12, 4], [13, 4],
      [10, 5], [11, 5], [12, 5], [13, 5],
      [10, 6], [11, 6], [12, 6], [13, 6],
      [10, 7], [11, 7], [12, 7], [13, 7],
      [10, 8], [11, 8], [12, 8], [13, 8],
      [10, 9], [11, 9], [12, 9], [13, 9],
      [10, 10], [11, 10], [12, 10], [13, 10],
      [10, 11], [11, 11], [12, 11], [13, 11],
      [10, 12], [11, 12], [12, 12], [13, 12],
      [10, 13], [11, 13], [12, 13], [13, 13],
    ], c.gear, p);

    // Warhead (red)
    blocks(ctx, ox, oy, [
      [11, 2], [12, 2],
      [10, 3], [11, 3], [12, 3], [13, 3],
    ], '#CC2222', p);
    // Warhead tip
    blocks(ctx, ox, oy, [[11, 1], [12, 1]], '#FF3333', p);

    // Body stripes
    blocks(ctx, ox, oy, [
      [10, 6], [11, 6], [12, 6], [13, 6],
      [10, 10], [11, 10], [12, 10], [13, 10],
    ], c.primary, p);
    blocks(ctx, ox, oy, [
      [11, 8], [12, 8],
    ], c.gearLight, p);

    // Fins at bottom
    blocks(ctx, ox, oy, [
      [8, 13], [9, 13], [14, 13], [15, 13],
      [7, 14], [8, 14], [9, 14], [14, 14], [15, 14], [16, 14],
    ], c.gear, p);

    // Flame / exhaust
    blocks(ctx, ox, oy, [
      [10, 14], [11, 14], [12, 14], [13, 14],
      [10, 15], [11, 15], [12, 15], [13, 15],
      [11, 16], [12, 16],
    ], '#FF6600', p);
    blocks(ctx, ox, oy, [
      [11, 17], [12, 17],
      [11, 18],
    ], '#FFAA00', p);

    // Launch platform
    blocks(ctx, ox, oy, [
      [7, 18], [8, 18], [9, 18], [10, 18], [11, 18],
      [12, 18], [13, 18], [14, 18], [15, 18], [16, 18],
    ], c.dark, p);
  }

  // Danger symbol - small triangle
  block(ctx, ox, oy, 11, 9, '#FFCC00', p);
  block(ctx, ox, oy, 12, 9, '#FFCC00', p);
}

function drawFlag(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  side: Side,
  p: number
): void {
  const c = getPalette(side);

  // Flag pole
  blocks(ctx, ox, oy, [
    [8, 3], [8, 4], [8, 5], [8, 6], [8, 7], [8, 8],
    [8, 9], [8, 10], [8, 11], [8, 12], [8, 13], [8, 14],
    [8, 15], [8, 16], [8, 17], [8, 18],
  ], c.gearLight, p);
  // Pole top ornament
  blocks(ctx, ox, oy, [[7, 2], [8, 2], [9, 2]], c.accent, p);
  block(ctx, ox, oy, 8, 1, c.accent, p);

  // Pole base
  blocks(ctx, ox, oy, [
    [6, 19], [7, 19], [8, 19], [9, 19], [10, 19],
  ], c.gear, p);

  if (side === 'israel') {
    // Israeli flag: white with blue stripes and Star of David
    // Flag body (white)
    blockRect(ctx, ox, oy, 9, 4, 10, 8, '#FFFFFF', p);

    // Top blue stripe
    blockRect(ctx, ox, oy, 9, 4, 10, 2, '#0038B8', p);
    // Bottom blue stripe
    blockRect(ctx, ox, oy, 9, 10, 10, 2, '#0038B8', p);

    // Star of David center (simplified pixel version)
    // Upward triangle
    blocks(ctx, ox, oy, [
      [13, 6], [14, 6],
      [12, 7], [13, 7], [14, 7], [15, 7],
    ], '#0038B8', p);
    // Downward triangle
    blocks(ctx, ox, oy, [
      [12, 8], [13, 8], [14, 8], [15, 8],
      [13, 9], [14, 9],
    ], '#0038B8', p);
  } else {
    // Iranian flag: green-white-red horizontal
    // Green top
    blockRect(ctx, ox, oy, 9, 4, 10, 3, c.primary, p);
    // White middle
    blockRect(ctx, ox, oy, 9, 7, 10, 2, '#FFFFFF', p);
    // Red bottom
    blockRect(ctx, ox, oy, 9, 9, 10, 3, c.secondary, p);

    // Emblem in center (simplified tulip/allah symbol)
    blocks(ctx, ox, oy, [
      [13, 7], [14, 7],
      [12, 8], [13, 8], [14, 8], [15, 8],
    ], '#CC2222', p);
  }

  // Flag wave shadow for depth
  blocks(ctx, ox, oy, [
    [18, 5], [18, 6], [18, 7], [18, 8], [18, 9], [18, 10], [18, 11],
  ], 'rgba(0,0,0,0.15)', p);
}

// ---------------------------------------------------------------------------
// Unit sprite dispatcher
// ---------------------------------------------------------------------------

/**
 * Draw the distinctive pixel art sprite for a given unit type.
 * Sprites are drawn using fillRect pixel blocks in a ~24x24 grid,
 * centered within the given size.
 */
export function drawUnitSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  side: Side,
  rank: Rank
): void {
  const p = px(size);
  // Center the 24-block sprite grid within the cell
  const gridWidth = 24 * p;
  const gridHeight = 22 * p;
  const ox = x + (size - gridWidth) / 2;
  const oy = y + (size - gridHeight) / 2;

  switch (rank) {
    case 10:
      drawLeader(ctx, ox, oy, side, p);
      break;
    case 9:
      drawGeneral(ctx, ox, oy, side, p);
      break;
    case 8:
      drawColonel(ctx, ox, oy, side, p);
      break;
    case 7:
      drawMajor(ctx, ox, oy, side, p);
      break;
    case 6:
      drawCaptain(ctx, ox, oy, side, p);
      break;
    case 5:
      drawLieutenant(ctx, ox, oy, side, p);
      break;
    case 4:
      drawSergeant(ctx, ox, oy, side, p);
      break;
    case 3:
      drawMiner(ctx, ox, oy, side, p);
      break;
    case 2:
      drawScout(ctx, ox, oy, side, p);
      break;
    case 'S':
      drawSpy(ctx, ox, oy, side, p);
      break;
    case 'B':
      drawBomb(ctx, ox, oy, side, p);
      break;
    case 'F':
      drawFlag(ctx, ox, oy, side, p);
      break;
  }
}

// ---------------------------------------------------------------------------
// Main piece drawing function
// ---------------------------------------------------------------------------

/**
 * Draw a complete game piece at position (x, y) with the given size.
 *
 * - Unrevealed enemy pieces show a card back with army emblem.
 * - Revealed pieces show their distinctive pixel art sprite + rank badge.
 * - Selected pieces get a gold highlight glow.
 */
export function drawPiece(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  side: Side,
  rank: Rank,
  isRevealed: boolean,
  isSelected: boolean
): void {
  ctx.save();

  const pal = getPalette(side);
  const margin = size * 0.04;
  const cardX = x + margin;
  const cardY = y + margin;
  const cardW = size - margin * 2;
  const cardH = size - margin * 2;
  const cornerR = size * 0.08;

  if (!isRevealed) {
    // ---- Unrevealed: card back with emblem ----
    drawCardBack(ctx, x, y, size, side);
  } else {
    // ---- Revealed: sprite card ----

    // Card background with rounded corners
    ctx.fillStyle = pal.dark;
    ctx.beginPath();
    ctx.moveTo(cardX + cornerR, cardY);
    ctx.lineTo(cardX + cardW - cornerR, cardY);
    ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + cornerR);
    ctx.lineTo(cardX + cardW, cardY + cardH - cornerR);
    ctx.quadraticCurveTo(
      cardX + cardW,
      cardY + cardH,
      cardX + cardW - cornerR,
      cardY + cardH
    );
    ctx.lineTo(cardX + cornerR, cardY + cardH);
    ctx.quadraticCurveTo(cardX, cardY + cardH, cardX, cardY + cardH - cornerR);
    ctx.lineTo(cardX, cardY + cornerR);
    ctx.quadraticCurveTo(cardX, cardY, cardX + cornerR, cardY);
    ctx.closePath();
    ctx.fill();

    // Subtle gradient overlay for depth
    const grad = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
    grad.addColorStop(0, 'rgba(255,255,255,0.08)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.15)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Border
    ctx.strokeStyle = pal.primary;
    ctx.lineWidth = Math.max(1, size * 0.025);
    ctx.stroke();

    // Clip drawing to card area
    ctx.save();
    ctx.clip();

    // Draw the sprite
    drawUnitSprite(ctx, x, y, size, side, rank);

    ctx.restore();

    // Rank badge (bottom-right)
    drawRankBadge(ctx, x, y, size, rank, side);

    // Unit name at top (small text)
    ctx.fillStyle = pal.badge;
    ctx.font = `bold ${Math.max(7, Math.round(size * 0.13))}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const label = getRankLabel(rank);
    ctx.fillText(label, x + size / 2, y + size * 0.03, size * 0.9);
  }

  // Selection glow
  if (isSelected) {
    drawHighlight(ctx, x, y, size, 'selected');
  }

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Rank label helper
// ---------------------------------------------------------------------------

function getRankLabel(rank: Rank): string {
  switch (rank) {
    case 10:
      return 'LEADER';
    case 9:
      return 'GENERAL';
    case 8:
      return 'COLONEL';
    case 7:
      return 'MAJOR';
    case 6:
      return 'CAPTAIN';
    case 5:
      return 'LIEUT.';
    case 4:
      return 'SERGEANT';
    case 3:
      return 'MINER';
    case 2:
      return 'SCOUT';
    case 'S':
      return 'SPY';
    case 'B':
      return 'BOMB';
    case 'F':
      return 'FLAG';
  }
}
