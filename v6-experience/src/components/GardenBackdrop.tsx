import { useId } from 'react';

const sprays = [
  [80, 96, -88, .96], [154, 67, 24, 1.08], [236, 122, -83, 1.12], [286, 74, 19, 1.1],
  [343, 27, 75, 1.3], [428, 91, -25, .9], [498, 52, 43, 1.12],
  [555, 83, 18, 1.25], [619, 104, -90, .99], [702, 59, 35, 1.18],
  [762, 99, -60, .9], [816, 109, 20, 1.1], [869, 54, 53, 1.3],
  [937, 86, -53, 1.33], [1003, 162, -118, .91], [1047, 84, 27, 1.1],
  [1106, 128, 36, 1.2], [1181, 72, -53, .88], [1232, 103, -14, 1.34],
  [1306, 69, 42, 1.2], [1358, 143, -84, 1.1], [1422, 77, 29, 1.5],
];

const blooms = [
  [416, 87, 22, '#d18b55'], [453, 53, 15, '#edb078'], [505, 90, 10, '#f4ca93'],
  [631, 100, 24, '#e4aa86'], [674, 115, 22, '#d9988e'], [710, 68, 23, '#e8b3a0'],
  [928, 132, 25, '#d07c65'], [966, 101, 20, '#d99571'], [1005, 112, 14, '#e5ad80'],
  [1153, 89, 19, '#e1ae6e'], [1190, 114, 21, '#e5b88a'], [1225, 79, 17, '#e9bd87'],
] as const;

export function GardenBough({ className = '', ...placement }: {
  className?: string; x?: number; y?: number; width?: number; height?: number;
}) {
  const uid = useId();
  const leaf = `${uid}-leaf`;
  const twig = `${uid}-twig`;

  return (
    <svg viewBox="0 0 1440 264" className={className} {...placement} preserveAspectRatio="xMidYMid slice" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={leaf} x1="0%" y1="0%" x2="100%" y2="70%">
          <stop stopColor="#294f43" />
          <stop offset="1" stopColor="#8f9d76" />
        </linearGradient>
        <g id={twig}>
          <path d="M0 62Q41 43 55 0" stroke="#586149" strokeWidth="2.7" />
          <path d="M12 54C-17 54-28 35-35 20-10 21 9 32 12 54ZM24 47C23 22 5 14-10 8-5 30 5 43 24 47ZM37 33C31 12 40-9 58-21c4 23-6 43-21 54Z" fill={`url(#${leaf})`} />
          <path d="M12 54c18 1 39-9 51-22-22-5-44 3-51 22ZM31 42C51 39 75 20 79 7c-21 1-42 14-48 35Z" fill="#6c856b" />
          <path d="M-18 33l2-6m3 11 2-8m2 11 3-8m13 17 4-8m-10-7 3-8m5 15 2-7m31-7 6-3m-9 10 8-2m-5 14 6 3m-17-6 5 4" stroke="#d9d9a4" strokeOpacity=".38" strokeWidth=".75" />
          <path d="M12 54-26 26M24 47 1 18M37 33 54-13M14 53q26-9 43-17m-24 4 40-28" stroke="#c4c8a0" strokeOpacity=".53" strokeWidth=".85" />
        </g>
      </defs>
      <path d="M1470-18c-141 29-200 109-347 118-152 10-283-12-420-51C530 0 439 110 280 112 166 114 52 87-34 42" stroke="#5e5940" strokeWidth="16" />
      <path d="M1470-24c-149 42-229 107-348 118-152 14-300-22-421-54C530-6 437 102 278 106 165 109 52 81-34 37" stroke="#b0a175" strokeWidth="3" />
      <path d="M355 107c74 33 132 21 167-31m109-32c32 55 85 93 155 111m272-57c-33 47-79 81-136 82m291-102c32 17 78 17 119 6M98 88c28 45 58 62 102 82" stroke="#777454" strokeWidth="4.5" strokeLinecap="round" />
      {sprays.map(([x, y, angle, scale]) => (
        <use key={x} href={`#${twig}`} transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`} />
      ))}
      {blooms.map(([x, y, radius, fill], i) => (
        <g key={x} transform={`translate(${x} ${y}) rotate(${i * 17}) scale(${radius / 25})`}>
          {[0, 76, 153, 220, 294].map((angle) => (
            <path key={angle} transform={`rotate(${angle}) scale(${.78 + ((angle + i * 11) % 43) / 110})`}
              d="M0 2C-6-2-21-11-15-20c3-5 9-4 14-1 5-5 12-4 16 1C20-12 8-2 0 2Z"
              fill={fill} stroke="#f4e6c5" strokeWidth=".8" />
          ))}
          <circle r="4.7" fill="#f6e0b0" />
          <circle r="1.7" fill="#9b6947" />
        </g>
      ))}
    </svg>
  );
}

export function SwingRig({ state = 'available', anchors = [0, 0] }: {
  state?: 'available' | 'occupied' | 'closed'; anchors?: [number, number];
}) {
  const wood = useId();
  const ropes = `M-79 ${anchors[0]}-81 225M77 ${anchors[1]}l2 ${225 - anchors[1]}`;
  return (
    <>
      <defs>
        <linearGradient id={wood} x1="0%" y1="0%" x2="29%" y2="100%">
          <stop stopColor="#c3a17a" />
          <stop offset="1" stopColor="#997354" />
        </linearGradient>
      </defs>
      <g fill="none" strokeLinecap="round">
        <path d={ropes} stroke="#524f36" strokeWidth="4" />
        <path d={ropes} stroke="#dfc49b" strokeWidth="1.55" />
        <path d={ropes} stroke="#6f5b42" strokeWidth="1.1" strokeDasharray="1 4" />
      </g>
      <g fill="#59624d" stroke="#c3bb94" strokeWidth="1.3">
        <ellipse cx="-79" cy={anchors[0] + 1} rx="4" ry="7" />
        <ellipse cx="77" cy={anchors[1] + 1} rx="4" ry="7" />
      </g>
      {state === 'occupied' && (
        <path d="M-32 225c3-15 12-34 22-43-17-9-20-32-6-44 9-7 23-7 31 2 13 16 9 33-5 42 12 9 17 24 22 43Z" fill="#4c6754" />
      )}
      <path d="m-105 232 211-2-4 10-203 3Z" fill="#654c34" stroke="#594430" />
      <path d="m-86 217 171-2 21 15-211 2Z" fill={`url(#${wood})`} stroke="#614c35" strokeLinejoin="round" />
      <path d="m-87 226 162-3m-90-2 62-1m-129 15 178-3" fill="none" stroke="#e7cba0" opacity=".62" />
      <circle cx="-81" cy="223" r="3" fill="#4b4c35" />
      <circle cx="79" cy="221" r="3" fill="#4b4c35" />
      {state === 'closed' && (
        <g transform="translate(-25 216) rotate(-5)">
          <path d="m8 1 18-14L46 1" fill="none" stroke="#624739" />
          <rect width="50" height="33" rx="2" fill="#814138" />
          <path d="M22 15v-4a3 3 0 0 1 6 0v4m-8 0h10v8H20Z" fill="none" stroke="#f5eedb" strokeWidth="1.5" />
        </g>
      )}
    </>
  );
}

export function GardenBackdrop() {
  return (
    <div className="v6-garden" aria-hidden="true">
      <GardenBough className="v6-garden-shadow" />
      <div className="v6-garden-floor" />
    </div>
  );
}
