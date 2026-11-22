import { useId } from 'react';

/* ── Screen-printed plaza vignette: Macau calçada, banyan trees, colonnade ── */
export function PlazaBody({ detail = 1 }: { detail?: number }) {
  const id = useId().replace(/:/g, '');
  return (
    <>
      <defs>
        <linearGradient id={`${id}-sun`} x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0" stopColor="#dc8f68" />
          <stop offset="1" stopColor="#bd6b49" />
        </linearGradient>
        <linearGradient id={`${id}-ground`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7d937f" stopOpacity="0.34" />
          <stop offset="1" stopColor="#7d937f" stopOpacity="0.1" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <rect x="0" y="0" width="560" height="200" rx="4" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-clip)`}>
        <circle cx="424" cy="56" r="33" fill={`url(#${id}-sun)`} opacity="0.2" />
        <circle cx="424" cy="56" r="33" fill="none" stroke="#bd6b49" strokeWidth="0.9" opacity="0.3" />
        {/* ridge */}
        <path d="M-10 142 C 70 118, 150 132, 226 136 C 300 140, 360 112, 440 124 C 500 132, 546 118, 570 128 L570 200 L-10 200 Z" fill={`url(#${id}-ground)`} />
        {/* arcade */}
        <g stroke="#2f4f43" fill="none" opacity={0.46 * detail} strokeLinejoin="round">
          <path d="M316 146 L316 84 L516 84 L516 146" strokeWidth="2" />
          <path d="M310 84 L522 84" strokeWidth="2.6" />
          <path d="M316 74 L416 60 L516 74" strokeWidth="2" />
          <path d="M336 146 L336 108 a16 16 0 0 1 32 0 L368 146" strokeWidth="1.6" />
          <path d="M382 146 L382 108 a16 16 0 0 1 32 0 L414 146" strokeWidth="1.6" />
          <path d="M428 146 L428 108 a16 16 0 0 1 32 0 L460 146" strokeWidth="1.6" />
          <path d="M474 146 L474 112 a12 12 0 0 1 24 0 L498 146" strokeWidth="1.4" />
        </g>
        {/* banyans */}
        {[{ x: 96, s: 1 }, { x: 196, s: 0.76 }].map((t, i) => (
          <g key={i} opacity={0.62 * detail}>
            <path d={`M${t.x} 152 C ${t.x - 3} 136, ${t.x + 3} 124, ${t.x - 1} 112`} stroke="#2f4f43" strokeWidth="3.2" fill="none" strokeLinecap="round" />
            <path d={`M${t.x - 1} 128 C ${t.x - 16} 124, ${t.x - 26} 132, ${t.x - 30} 140`} stroke="#2f4f43" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <path d={`M${t.x + 2} 120 C ${t.x + 16} 116, ${t.x + 26} 124, ${t.x + 30} 132`} stroke="#2f4f43" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <path
              d={`M${t.x - 46} 100 C ${t.x - 56} 74, ${t.x - 32} 58, ${t.x - 6} 60 C ${t.x + 18} 54, ${t.x + 48} 68, ${t.x + 46} 92 C ${t.x + 56} 106, ${t.x + 42} 120, ${t.x + 20} 118 C ${t.x + 4} 128, ${t.x - 20} 124, ${t.x - 28} 114 C ${t.x - 40} 116, ${t.x - 52} 112, ${t.x - 46} 100 Z`}
              fill="#5d7d66"
              opacity="0.48"
            />
            <path d={`M${t.x - 32} 94 C ${t.x - 16} 84, ${t.x + 8} 84, ${t.x + 26} 92`} stroke="#2f4f43" strokeWidth="1.1" fill="none" opacity="0.45" />
            <path d={`M${t.x - 24} 106 C ${t.x - 6} 98, ${t.x + 14} 98, ${t.x + 30} 104`} stroke="#2f4f43" strokeWidth="1.1" fill="none" opacity="0.38" />
          </g>
        ))}
        {/* calçada */}
        <g stroke="#2f4f43" fill="none" strokeLinecap="round" opacity={0.5 * detail}>
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <path
              key={i}
              d={`M-20 ${150 + i * 8} C 60 ${143 + i * 8}, 124 ${158 + i * 8}, 204 ${150 + i * 8} S 344 ${142 + i * 8}, 424 ${150 + i * 8} S 544 ${158 + i * 8}, 590 ${150 + i * 8}`}
              strokeWidth={i % 2 === 0 ? 2.4 : 1}
            />
          ))}
        </g>
        {/* strollers */}
        <g stroke="#2f4f43" strokeWidth="1.6" opacity={0.5 * detail} strokeLinecap="round" fill="none">
          <path d="M252 150 L252 137 M247 141 L257 141 M252 150 L247 161 M252 150 L257 161 M250 131 A3.2 3.2 0 1 1 254 131 A3.2 3.2 0 1 1 250 131" />
          <path d="M270 152 L270 141 M266 144 L274 144 M270 152 L267 162 M270 152 L273 162 M268 135 A2.8 2.8 0 1 1 272 135 A2.8 2.8 0 1 1 268 135" />
        </g>
        {/* birds */}
        <g stroke="#2f4f43" strokeWidth="1.2" fill="none" opacity="0.4" strokeLinecap="round">
          <path d="M120 38 q7 -6 14 0 q7 -6 14 0" />
          <path d="M162 24 q6 -5 12 0 q6 -5 12 0" />
          <path d="M254 44 q5 -4 10 0 q5 -4 10 0" />
        </g>
      </g>
    </>
  );
}

export function PlazaPrint({ className = '', detail = 1 }: { className?: string; detail?: number }) {
  return (
    <svg className={className} viewBox="0 0 560 200" role="img" aria-label="德志广场的手绘风景：波浪石纹地面、榕树与回廊">
      <PlazaBody detail={detail} />
    </svg>
  );
}

/* ── Leaves: three hand-cut silhouettes ── */
export function Leaf({ variant = 0, className = '' }: { variant?: number; className?: string }) {
  if (variant === 1) {
    return (
      <svg className={className} viewBox="0 0 60 90" aria-hidden="true">
        <path d="M30 6 C 44 22, 52 44, 47 66 C 44 78, 36 84, 30 88 C 24 84, 16 78, 13 66 C 8 44, 16 22, 30 6 Z" fill="currentColor" opacity="0.85" />
        <path d="M30 12 L30 84 M30 34 L42 26 M30 46 L44 40 M30 58 L40 54 M30 34 L18 26 M30 46 L16 40 M30 58 L20 54" stroke="currentColor" strokeWidth="1" opacity="0.35" fill="none" />
      </svg>
    );
  }
  if (variant === 2) {
    return (
      <svg className={className} viewBox="0 0 90 60" aria-hidden="true">
        <path d="M6 44 C 22 12, 52 4, 84 10 C 78 40, 52 56, 6 44 Z" fill="currentColor" opacity="0.85" />
        <path d="M12 42 C 34 36, 58 26, 80 12 M28 38 L24 26 M44 33 L42 21 M60 26 L60 15" stroke="currentColor" strokeWidth="1" opacity="0.3" fill="none" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 60 70" aria-hidden="true">
      <path d="M30 4 C 46 14, 54 34, 44 52 C 38 64, 32 66, 30 66 C 28 66, 22 64, 16 52 C 6 34, 14 14, 30 4 Z" fill="currentColor" opacity="0.9" />
      <path d="M30 10 L30 62 M30 28 L20 22 M30 40 L18 36 M30 52 L22 48 M30 28 L40 22 M30 40 L42 36 M30 52 L38 48" stroke="currentColor" strokeWidth="0.9" opacity="0.3" fill="none" />
    </svg>
  );
}

/* ── A compact stamp picture: sun, waves, one tree ── */
export function StampArt() {
  return (
    <g>
      <circle cx="74" cy="30" r="15" fill="#c2714f" opacity="0.28" />
      <path d="M-4 74 C 20 64, 34 76, 54 70 C 72 65, 84 74, 104 68 L104 92 L-4 92 Z" fill="#5d7d66" opacity="0.4" />
      <g stroke="#7d937f" fill="none" strokeWidth="1" opacity="0.6" strokeLinecap="round">
        <path d="M-4 82 C 20 76, 34 86, 54 80 C 72 75, 84 84, 104 78" />
        <path d="M-4 88 C 20 82, 34 92, 54 86 C 72 81, 84 90, 104 84" />
      </g>
      <path d="M30 78 C 29 66, 31 58, 29 50" stroke="#2f4f43" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M30 70 C 20 66, 14 70, 11 74 M31 64 C 41 60, 47 64, 50 68" stroke="#2f4f43" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d="M30 22 C 12 34, 8 54, 22 62 C 26 64, 34 64, 38 62 C 52 54, 48 34, 30 22 Z" fill="#2f4f43" opacity="0.55" />
      <path d="M30 28 L30 60 M30 42 L20 36 M30 50 L20 46 M30 42 L40 36 M30 50 L40 46" stroke="#efe0c2" strokeWidth="0.9" opacity="0.5" fill="none" />
      <path d="M84 54 q6 -5 12 0 q6 -5 12 0" stroke="#2f4f43" strokeWidth="1" fill="none" opacity="0.4" />
    </g>
  );
}

/* ── Perforated postage stamp ── */
export function StampFrame({ className = '', label = '澳门 · 大学城', value = '2.00' }: { className?: string; label?: string; value?: string }) {
  const id = useId().replace(/:/g, '');
  const holes: { x: number; y: number }[] = [];
  const W = 150, H = 178, step = 9.5;
  for (let x = 6; x <= W - 6; x += step) { holes.push({ x, y: 3 }); holes.push({ x, y: H - 3 }); }
  for (let y = 6; y <= H - 6; y += step) { holes.push({ x: 3, y }); holes.push({ x: W - 3, y }); }
  return (
    <svg className={className} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <defs>
        <mask id={`${id}-perf`}>
          <rect width={W} height={H} fill="white" />
          {holes.map((h, i) => <circle key={i} cx={h.x} cy={h.y} r="2.6" fill="black" />)}
        </mask>
      </defs>
      <g mask={`url(#${id}-perf)`}>
        <rect width={W} height={H} fill="#f6ecd6" />
        <rect x="9" y="9" width={W - 18} height={H - 18} fill="none" stroke="#2f4f43" strokeWidth="0.7" opacity="0.35" />
        <g transform="translate(13 19)">
          <rect width="124" height="92" fill="#efe0c2" />
          <g transform="scale(1.24 1.31)">
            <StampArt />
          </g>
        </g>
        <text x="12" y={H - 36} fontFamily="'Campus Serif', serif" fontSize="13" fill="#2f4f43" opacity="0.72">MACAU</text>
        <text x="12" y={H - 20} fontFamily="'Campus Text', serif" fontSize="9" fill="#2f4f43" opacity="0.6">{label}</text>
        <text x={W - 14} y="26" textAnchor="end" fontFamily="'Campus Serif', serif" fontSize="17" fill="#b4503c" opacity="0.85">{value}</text>
      </g>
    </svg>
  );
}

/* ── Circular postmark with curved type + cancellation bars ── */
export function Postmark({ className = '', text = 'CAMPUS POST · MACAU ·' }: { className?: string; text?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={className} viewBox="0 0 250 140" aria-hidden="true">
      <defs>
        <path id={`${id}-arc`} d="M70 70 m-49 0 a49 49 0 1 1 98 0" fill="none" />
        <path id={`${id}-arc2`} d="M70 70 m-42 0 a42 42 0 1 0 84 0" fill="none" />
      </defs>
      <g fill="none" stroke="currentColor">
        <circle cx="70" cy="70" r="54" strokeWidth="1.6" opacity="0.9" />
        <circle cx="70" cy="70" r="34" strokeWidth="1.1" opacity="0.55" />
        <path d="M28 70 L112 70" strokeWidth="1" opacity="0.35" />
      </g>
      <text fill="currentColor" fontSize="9" letterSpacing="2" fontFamily="'Campus Serif', serif">
        <textPath href={`#${id}-arc`} startOffset="50%" textAnchor="middle">{text}</textPath>
      </text>
      <text fill="currentColor" fontSize="9" letterSpacing="2" fontFamily="'Campus Serif', serif">
        <textPath href={`#${id}-arc2`} startOffset="50%" textAnchor="middle">2026 · WINTER</textPath>
      </text>
      <text x="70" y="72" textAnchor="middle" fill="currentColor" fontSize="15" fontFamily="'Campus Serif', serif">DEC</text>
      <text x="70" y="90" textAnchor="middle" fill="currentColor" fontSize="10" letterSpacing="3" fontFamily="'Campus Serif', serif">12</text>
      <g stroke="currentColor" strokeWidth="1.6" fill="none" opacity="0.7" strokeLinecap="round">
        <path d="M132 52 q14 -7 28 0 t28 0 t28 0" />
        <path d="M132 70 q14 -7 28 0 t28 0 t28 0" />
        <path d="M132 88 q14 -7 28 0 t28 0 t28 0" />
      </g>
    </svg>
  );
}

/* ── Soft wind ribbons ── */
export function WindRibbons() {
  const id = useId().replace(/:/g, '');
  return (
    <svg className="wind-svg" viewBox="0 0 1440 810" aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`${id}-g1`} x1="0" x2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.35" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="0.7" stopColor="#fff8e6" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-g2`} x1="0" x2="1">
          <stop offset="0" stopColor="#dfe8d8" stopOpacity="0" />
          <stop offset="0.4" stopColor="#e8f0e2" stopOpacity="0.9" />
          <stop offset="1" stopColor="#dfe8d8" stopOpacity="0" />
        </linearGradient>
        <filter id={`${id}-blur`} x="-20%" y="-60%" width="140%" height="220%">
          <feGaussianBlur stdDeviation="2.6" />
        </filter>
      </defs>
      <g filter={`url(#${id}-blur)`} fill="none" strokeLinecap="round">
        <path className="wind-line w1" d="M-80 300 C 220 250, 330 360, 560 330 S 980 250, 1200 300 S 1420 330, 1520 300" stroke={`url(#${id}-g1)`} strokeWidth="3.2" />
        <path className="wind-line w2" d="M-80 372 C 200 340, 360 430, 620 400 S 1010 330, 1240 372 S 1440 400, 1520 376" stroke={`url(#${id}-g2)`} strokeWidth="7" opacity="0.55" />
        <path className="wind-line w3" d="M-80 236 C 180 214, 300 268, 520 250 S 900 196, 1140 232 S 1380 258, 1520 234" stroke={`url(#${id}-g1)`} strokeWidth="1.6" opacity="0.7" />
      </g>
    </svg>
  );
}

/* ── Sprig: a printed flourish for the flap tip ── */
export function Sprig({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 220 44" aria-hidden="true">
      <g stroke="currentColor" fill="none" strokeWidth="1" strokeLinecap="round" opacity="0.55">
        <path d="M110 22 C 92 22, 74 18, 52 10" />
        <path d="M110 22 C 128 22, 146 18, 168 10" />
        <path d="M86 19 C 84 12, 78 8, 72 6 M74 15 C 68 10, 62 8, 56 8 M64 12 C 60 8, 54 6, 48 7" />
        <path d="M134 19 C 136 12, 142 8, 148 6 M146 15 C 152 10, 158 8, 164 8 M156 12 C 160 8, 166 6, 172 7" />
      </g>
      <g fill="currentColor" opacity="0.5">
        <ellipse cx="70" cy="6" rx="5" ry="2.4" transform="rotate(-32 70 6)" />
        <ellipse cx="55" cy="7.5" rx="4.4" ry="2.1" transform="rotate(-16 55 7.5)" />
        <ellipse cx="150" cy="6" rx="5" ry="2.4" transform="rotate(32 150 6)" />
        <ellipse cx="165" cy="7.5" rx="4.4" ry="2.1" transform="rotate(16 165 7.5)" />
      </g>
      <circle cx="110" cy="22" r="2.2" fill="#b4503c" opacity="0.8" />
    </svg>
  );
}

/* ── Brand mark: a small wax-seal monogram ── */
export function BrandMark({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 44 44" aria-hidden="true">
      <rect x="1.2" y="1.2" width="41.6" height="41.6" rx="10" fill="#b4503c" opacity="0.92" />
      <rect x="1.2" y="1.2" width="41.6" height="41.6" rx="10" fill="none" stroke="#8d3b2b" strokeWidth="0.8" opacity="0.5" />
      <rect x="10" y="14.5" width="24" height="16" rx="1.6" fill="none" stroke="#f9eed8" strokeWidth="1.5" opacity="0.95" />
      <path d="M10.6 15.4 L22 24 L33.4 15.4" fill="none" stroke="#f9eed8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.95" />
      <circle cx="22" cy="31" r="1.7" fill="#f9eed8" opacity="0.9" />
    </svg>
  );
}

/* ── Poster plate: one screen-printed composition per story ── */
export function TicketArt({ variant = 0, tint = '#c9ddca' }: { variant?: number; tint?: string }) {
  const v = variant % 6;
  return (
    <svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="300" height="200" fill={tint} />
      <g opacity="0.22" fill="#2f4f43">
        <rect y="158" width="300" height="42" />
      </g>
      {v === 0 && (
        <g>
          <circle cx="232" cy="52" r="26" fill="#fffaf0" opacity="0.5" />
          <g transform="translate(18 16) scale(0.5)">
            <PlazaPrint detail={1} />
          </g>
        </g>
      )}
      {v === 1 && (
        <g>
          <rect x="34" y="42" width="106" height="118" fill="#fff8e8" opacity="0.72" transform="rotate(-4 87 101)" />
          <rect x="96" y="56" width="96" height="104" fill="#b4573f" opacity="0.55" transform="rotate(5 144 108)" />
          <path d="M188 150 L232 58 L268 150 Z" fill="#2f4f43" opacity="0.42" />
          <g stroke="#2f4f43" strokeWidth="1" opacity="0.35" fill="none">
            <path d="M46 66 h82 M46 78 h64 M104 84 h70 M104 96 h48" />
          </g>
        </g>
      )}
      {v === 2 && (
        <g>
          <circle cx="150" cy="104" r="56" fill="#fff8e8" opacity="0.5" />
          <path d="M110 96 h80 l-8 54 a12 12 0 0 1 -12 10 h-40 a12 12 0 0 1 -12 -10 Z" fill="#2f4f43" opacity="0.55" />
          <path d="M190 104 q26 -2 24 18 q-2 16 -20 14" fill="none" stroke="#2f4f43" strokeWidth="3" opacity="0.5" />
          <g stroke="#fff8e8" strokeWidth="2.4" opacity="0.75" fill="none" strokeLinecap="round">
            <path d="M132 82 q-8 -12 0 -22 M150 78 q-8 -14 0 -26 M168 82 q-8 -12 0 -22" />
          </g>
        </g>
      )}
      {v === 3 && (
        <g fill="none" stroke="#2f4f43" opacity="0.45">
          <circle cx="150" cy="104" r="24" strokeWidth="2" />
          <circle cx="150" cy="104" r="42" strokeWidth="1.4" opacity="0.7" />
          <circle cx="150" cy="104" r="60" strokeWidth="1" opacity="0.45" />
          <path d="M150 44 v120 M98 74 q52 60 104 0" strokeWidth="1" opacity="0.4" />
          <path d="M212 46 l0 34 a10 10 0 1 1 -8 -10" strokeWidth="2.4" opacity="0.7" />
        </g>
      )}
      {v === 4 && (
        <g>
          <rect x="66" y="34" width="168" height="132" fill="none" stroke="#2f4f43" strokeWidth="2" opacity="0.35" />
          <path d="M66 34 L234 34 L190 166 L110 166 Z" fill="#fff8e8" opacity="0.42" />
          <path d="M66 166 L150 34 M150 34 L234 166" stroke="#2f4f43" strokeWidth="1" opacity="0.3" fill="none" />
          <circle cx="150" cy="104" r="16" fill="#fff8e8" opacity="0.8" />
        </g>
      )}
      {v === 5 && (
        <g fill="#2f4f43">
          <rect x="52" y="96" width="42" height="70" opacity="0.35" />
          <rect x="102" y="64" width="52" height="102" opacity="0.45" />
          <rect x="162" y="112" width="38" height="54" opacity="0.32" />
          <rect x="208" y="82" width="46" height="84" opacity="0.4" />
          <circle cx="70" cy="52" r="18" opacity="0.5" />
        </g>
      )}
    </svg>
  );
}
