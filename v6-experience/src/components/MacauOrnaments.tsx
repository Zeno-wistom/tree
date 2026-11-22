import type { CSSProperties } from 'react';

/**
 * Macau azulejo scrolling frieze distilled from 三校明信片 & 海报式-四季 bottom bands.
 */
export function MacauTileBorder({
  bg = '#1F4B4A',
  stroke = '#FAF5E8',
  accent = '#EFE5A8',
  className = '',
  style,
}: {
  bg?: string;
  stroke?: string;
  accent?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 420 44"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <rect width="420" height="44" fill={bg} />
      {/* Scrolling vine symmetry */}
      <g fill="none" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 22c14-14 34-14 48 0s34 14 48 0 34-14 48 0 34 14 48 0 34-14 48 0 34 14 48 0" />
        <path d="M16 22c14 14 34 14 48 0s34-14 48 0 34 14 48 0 34-14 48 0 34 14 48 0 34-14 48 0" opacity="0.65" />
      </g>
      {/* Diamond petals along rhythm */}
      {[64, 160, 256].map((cx) => (
        <g key={cx} transform={`translate(${cx} 22)`}>
          <path d="M0-9 7 0 0 9-7 0Z" fill={accent} />
          <circle r="2.2" fill={bg} />
        </g>
      ))}
      {/* Right square tile emblem */}
      <g transform="translate(364 4)">
        <rect width="36" height="36" rx="2" fill="none" stroke={stroke} strokeWidth="1.6" />
        <path d="M18 4 32 18 18 32 4 18Z" fill="none" stroke={accent} strokeWidth="1.6" />
        <circle cx="18" cy="18" r="4" fill={stroke} />
      </g>
    </svg>
  );
}

/**
 * Iconic 4-petal Macau diamond tile rosette seen on UPM / UTM / Summer & Autumn posters.
 */
export function MacauTileDiamond({
  className = '',
  primary = '#1F4B4A',
  secondary = '#E6B43E',
  paper = '#FAF5E8',
}: {
  className?: string;
  primary?: string;
  secondary?: string;
  paper?: string;
}) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M32 3 61 32 32 61 3 32Z" fill={paper} stroke={primary} strokeWidth="1.8" />
      <path d="M32 10 54 32 32 54 10 32Z" fill={primary} />
      <path d="M32 14c4 8 4 12 0 18-4-6-4-10 0-18Zm0 36c-4-8-4-12 0-18 4 6 4 10 0 18ZM14 32c8-4 12-4 18 0-6 4-10 4-18 0Zm36 0c-8 4-12 4-18 0 6-4 10-4 18 0Z" fill={paper} />
      <circle cx="32" cy="32" r="4.5" fill={secondary} />
    </svg>
  );
}

/**
 * 《拾花一叶》 refined botanical & tile seal brand mark.
 */
export function BrandSeal({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <rect x="2" y="2" width="44" height="44" rx="12" fill="#FAF5E8" stroke="#1F4B4A" strokeWidth="1.6" />
      <rect x="6" y="6" width="36" height="36" rx="9" fill="none" stroke="#B5BA9E" strokeWidth="1" />
      <path d="M24 36C15 29 14 18 24 11c10 7 9 18 0 25Z" fill="#DCE5CE" stroke="#1F4B4A" strokeWidth="1.5" />
      <path d="M24 35V14M24 25l-5-4M24 21l5-4" stroke="#1F4B4A" strokeWidth="1.3" strokeLinecap="round" fill="none" />
      <circle cx="33" cy="14" r="3.4" fill="#D94A2B" />
    </svg>
  );
}

/**
 * Organic canopy branch artwork for HOME & Route C.
 * Supports independent warm-gold branch tip light (not coupled to seasonal tree lighting).
 */
export function CanopyBranch({
  className = '',
  leafTint = '#7C9067',
  accentLeaf = '#B5BC96',
  showTipLight = false,
  tipLightIntensity = 0,
}: {
  className?: string;
  leafTint?: string;
  accentLeaf?: string;
  showTipLight?: boolean;
  tipLightIntensity?: number;
}) {
  return (
    <svg className={className} viewBox="0 0 620 280" fill="none" aria-hidden="true">
      {/* Main organic bough */}
      <path
        d="M-18 32C94 42 184 68 274 114c74 38 158 58 266 54"
        stroke="#4A5A46"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <path
        d="M126 56c32 48 26 94 2 142M246 100c44-24 94-26 146-12M358 144c18 34 10 66-12 92"
        stroke="#5E6E58"
        strokeWidth="6.5"
        strokeLinecap="round"
      />
      {/* Layered botanical leaves */}
      {[
        [72, 46, -24, 1],
        [136, 98, 36, 0],
        [152, 152, -32, 1],
        [208, 80, -45, 0],
        [278, 86, -18, 1],
        [334, 88, 22, 0],
        [394, 102, -26, 1],
        [366, 178, 34, 0],
        [446, 154, -22, 1],
        [498, 166, 18, 0],
      ].map(([x, y, rot, alt], i) => (
        <g key={i} className="v6-canopy-leaf" transform={`translate(${x} ${y}) rotate(${rot})`}>
          <path
            d="M0 0C-16-24-6-48 18-56 34-34 24-10 0 0Z"
            fill={alt ? leafTint : accentLeaf}
            stroke="#FAF5E8"
            strokeWidth="1.2"
          />
          <path d="M0 0 15-46" stroke="#FAF5E8" strokeWidth="1.2" opacity="0.65" />
        </g>
      ))}
      {/* Independent warm-gold branch tip indicator lamp (PDF: 枝端预告灯独立于四季树灯) */}
      {showTipLight && (
        <g transform="translate(540 168)">
          <circle
            className="v6-branch-halo"
            r={34 + tipLightIntensity * 14}
            fill="#E6B43E"
            opacity={0.14 + tipLightIntensity * 0.36}
          />
          <circle
            className="v6-branch-core"
            r={12 + tipLightIntensity * 4}
            fill={tipLightIntensity > 0.1 ? '#F2C95D' : '#D2D3BE'}
            stroke="#1F4B4A"
            strokeWidth="1.8"
          />
          <circle r="4.5" fill="#FFFDF5" opacity={0.4 + tipLightIntensity * 0.6} />
        </g>
      )}
    </svg>
  );
}
