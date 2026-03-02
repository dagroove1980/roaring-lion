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

      {/* Bottom-right: notepad with pen */}
      <div className="deco-prop deco-notepad">
        <img src="/assets/deco/deco_notepad.png" alt="" width={100} height={100} />
      </div>

      {/* Left-mid: dog tags */}
      <div className="deco-prop deco-dogtags">
        <img src="/assets/deco/deco_dogtags.png" alt="" width={90} height={90} />
      </div>

      {/* Left-mid (high): coffee */}
      <div className="deco-prop deco-coffee">
        <img src="/assets/deco/deco_coffee.png" alt="" width={90} height={90} />
      </div>

      {/* Right-mid: ammo shells */}
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

      {/* Top-center: oil lamp glow */}
      <div className="deco-prop deco-oillamp">
        <img src="/assets/deco/deco_oillamp.png" alt="" width={80} height={80} />
      </div>

      {/* Sand scatter at bottom */}
      <div className="deco-sand-scatter" />

      {/* Rope accent */}
      <div className="deco-rope-line" />
    </div>
  );
}
