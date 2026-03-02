// Table decorations - war room props arranged around the board
// Uses PixelLab pixel art where available + SVG fallbacks

export default function TableDecorations() {
  return (
    <div className="table-decorations" aria-hidden="true">
      {/* Warm lamp glow from above */}
      <div className="deco-lamp-glow" />

      {/* Top-left: compass */}
      <div className="deco-prop deco-compass">
        <img src="/assets/deco/deco_compass.png" alt="" width={120} height={120} />
      </div>

      {/* Top-right: binoculars */}
      <div className="deco-prop deco-binoculars">
        <img src="/assets/deco/deco_binoculars.png" alt="" width={110} height={110} />
      </div>

      {/* Bottom-left: pistol with holster */}
      <div className="deco-prop deco-pistol">
        <img src="/assets/deco/deco_pistol.png" alt="" width={120} height={120} />
      </div>

      {/* Bottom-right: notepad with pen (SVG) */}
      <div className="deco-prop deco-notepad">
        <svg width="100" height="120" viewBox="0 0 80 96" fill="none">
          <rect x="8" y="8" width="56" height="76" rx="2" fill="#b89a5a" stroke="#6a5430" strokeWidth="1.5"/>
          <rect x="8" y="8" width="56" height="76" rx="2" fill="url(#paper-grain)" opacity=".15"/>
          {/* Spiral binding */}
          {[16, 24, 32, 40, 48, 56, 64, 72].map(y => (
            <circle key={y} cx="8" cy={y} r="2.5" fill="#8a7340" stroke="#6a5430" strokeWidth=".5"/>
          ))}
          {/* Ruled lines */}
          {[22, 30, 38, 46, 54, 62, 70].map(y => (
            <line key={y} x1="16" y1={y} x2="56" y2={y} stroke="#a88e4e" strokeWidth=".5" opacity=".5"/>
          ))}
          {/* Scribbled writing */}
          <path d="M18 23q8-2 16 1 8 2 14-1" stroke="#665840" strokeWidth=".8" fill="none" opacity=".6"/>
          <path d="M18 31q6-1 12 0 6 1 10 0" stroke="#665840" strokeWidth=".8" fill="none" opacity=".5"/>
          <path d="M18 39q10-2 18 1 5 1 8-1" stroke="#665840" strokeWidth=".7" fill="none" opacity=".4"/>
          <path d="M18 47q7 0 14 1" stroke="#665840" strokeWidth=".7" fill="none" opacity=".35"/>
          {/* Pen */}
          <g transform="rotate(-25 60 50)">
            <rect x="55" y="14" width="4" height="60" rx="1.5" fill="#4a3f2e"/>
            <polygon points="55,74 59,74 57,82" fill="#D4AF37"/>
            <rect x="55" y="16" width="4" height="4" fill="#8B6914"/>
          </g>
          <defs>
            <pattern id="paper-grain" width="4" height="4" patternUnits="userSpaceOnUse">
              <rect width="1" height="1" x="1" y="0" fill="#8a7340" opacity=".3"/>
              <rect width="1" height="1" x="3" y="2" fill="#8a7340" opacity=".2"/>
            </pattern>
          </defs>
        </svg>
      </div>

      {/* Left-mid: dog tags (SVG) */}
      <div className="deco-prop deco-dogtags">
        <svg width="55" height="90" viewBox="0 0 44 72" fill="none">
          {/* Chain */}
          {[0,4,8,12,16].map(i => (
            <circle key={i} cx={22+Math.sin(i)*2} cy={4+i*1.5} r="1.5" fill="none" stroke="#887858" strokeWidth=".8"/>
          ))}
          {/* Tag 1 */}
          <g transform="rotate(-8 22 38)">
            <rect x="6" y="28" width="22" height="32" rx="4" fill="#9a9080" stroke="#665840" strokeWidth=".8"/>
            <rect x="6" y="28" width="22" height="32" rx="4" fill="#b8b0a0" opacity=".3"/>
            <line x1="10" y1="36" x2="24" y2="36" stroke="#665840" strokeWidth=".5" opacity=".5"/>
            <line x1="10" y1="40" x2="22" y2="40" stroke="#665840" strokeWidth=".5" opacity=".5"/>
            <line x1="10" y1="44" x2="20" y2="44" stroke="#665840" strokeWidth=".5" opacity=".4"/>
            <circle cx="17" cy="30" r="2" fill="none" stroke="#665840" strokeWidth=".6"/>
          </g>
          {/* Tag 2 */}
          <g transform="rotate(5 22 42)">
            <rect x="14" y="34" width="22" height="32" rx="4" fill="#888070" stroke="#665840" strokeWidth=".8"/>
            <rect x="14" y="34" width="22" height="32" rx="4" fill="#a8a090" opacity=".3"/>
            <line x1="18" y1="42" x2="32" y2="42" stroke="#665840" strokeWidth=".5" opacity=".5"/>
            <line x1="18" y1="46" x2="30" y2="46" stroke="#665840" strokeWidth=".5" opacity=".5"/>
            <line x1="18" y1="50" x2="28" y2="50" stroke="#665840" strokeWidth=".5" opacity=".4"/>
            <circle cx="25" cy="36" r="2" fill="none" stroke="#665840" strokeWidth=".6"/>
          </g>
        </svg>
      </div>

      {/* Right-mid: ammo shells (SVG) */}
      <div className="deco-prop deco-ammo">
        <svg width="90" height="55" viewBox="0 0 72 44" fill="none">
          {/* Shell casings at various angles */}
          {[
            { x: 10, y: 20, r: -30 },
            { x: 28, y: 12, r: 45 },
            { x: 22, y: 32, r: 10 },
            { x: 45, y: 22, r: -60 },
            { x: 55, y: 30, r: 20 },
          ].map((s, i) => (
            <g key={i} transform={`rotate(${s.r} ${s.x} ${s.y})`}>
              <rect x={s.x-2} y={s.y-6} width="4" height="12" rx="1.5" fill="#c4a040" stroke="#8B6914" strokeWidth=".5"/>
              <ellipse cx={s.x} cy={s.y-6} rx="2" ry="1" fill="#D4AF37"/>
              <ellipse cx={s.x} cy={s.y+6} rx="1.5" ry=".8" fill="#8B6914"/>
            </g>
          ))}
        </svg>
      </div>

      {/* Top-center: oil lamp glow (SVG) */}
      <div className="deco-prop deco-oillamp">
        <svg width="60" height="70" viewBox="0 0 48 56" fill="none">
          {/* Lamp base */}
          <ellipse cx="24" cy="48" rx="14" ry="4" fill="#8B6914" stroke="#6a5430" strokeWidth=".8"/>
          <path d="M14 48v-8q0-4 4-6h12q4 2 4 6v8" fill="#a88e4e" stroke="#6a5430" strokeWidth=".8"/>
          {/* Chimney */}
          <path d="M18 34q0-8 6-12 6 4 6 12" fill="none" stroke="#887858" strokeWidth=".8" opacity=".6"/>
          {/* Flame */}
          <ellipse cx="24" cy="22" rx="3" ry="5" fill="#F0D060" opacity=".8"/>
          <ellipse cx="24" cy="20" rx="1.5" ry="3" fill="#fff" opacity=".5"/>
          {/* Glow */}
          <circle cx="24" cy="22" r="10" fill="#F0D060" opacity=".08"/>
          <circle cx="24" cy="22" r="16" fill="#F0D060" opacity=".04"/>
        </svg>
      </div>

      {/* Sand scatter at bottom */}
      <div className="deco-sand-scatter" />

      {/* Rope accent */}
      <div className="deco-rope-line" />
    </div>
  );
}
