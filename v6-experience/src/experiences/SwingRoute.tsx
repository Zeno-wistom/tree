import { useState } from 'react';
import { MacauTileBorder } from '../components/MacauOrnaments';
import type { RouteId } from '../data/catalog';
import { useDemoState } from '../hooks/useDemoState';
import { useChime } from '../hooks/useChime';
import './swing.css';

interface SwingRouteProps {
  onNavigate: (route: RouteId) => void;
}

const swingCopy = {
  available: {
    status: '秋千可用',
    title: ['坐稳轻荡，', '在树影下停一停'],
    hint: '确认摆动区无人再入座，双手扶稳轻荡。离座前先双脚着地，等秋千完全停稳。',
  },
  occupied: {
    status: '秋千占用中',
    title: ['此刻有人', '正在树下轻荡'],
    hint: '请留在摆动区外，等当前访客停稳离座。也可以先用实体按键领卡。',
  },
  closed: {
    status: '秋千暂时关闭',
    title: ['秋千当前', '暂不开放使用'],
    hint: '请勿入座或推动，待现场恢复开放后再体验。',
  },
};

const canopyLeaves = [
  [108, 94, -50, 1.05, '#6f764a'],
  [186, 81, -18, 0.9, '#a4a267'],
  [234, 64, -124, 1.12, '#838858'],
  [268, 96, 143, 0.86, '#737b51'],
  [362, 49, -116, 0.94, '#92955c'],
  [409, 72, 144, 1.08, '#7e8357'],
  [470, 40, -66, 0.92, '#909357'],
  [573, 75, -105, 1.12, '#768054'],
  [607, 92, 123, 0.82, '#a0a068'],
  [676, 111, 140, 1.14, '#798255'],
  [718, 87, -62, 0.91, '#a8a46c'],
  [767, 108, -22, 1.06, '#717a53'],
  [819, 131, 115, 0.98, '#94965e'],
] as const;

export function SwingRoute({ onNavigate }: SwingRouteProps) {
  const { config, isLeafDropPaused } = useDemoState();
  const { play } = useChime();
  const [swayReplay, setSwayReplay] = useState(0);
  const state = config.swingState;
  const copy = swingCopy[state];
  const hint = state === 'occupied' && isLeafDropPaused
    ? '请留在摆动区外，等当前访客停稳离座。'
    : copy.hint;
  const leafDropLabel = isLeafDropPaused
    ? '查看实体领卡状态（C）→'
    : state === 'available'
      ? '前往实体领卡（可选秋千或按键）→'
      : '改走实体按键领卡（C）→';

  return (
    <section className="v6b" data-swing-state={state} aria-label="B 秋千停留">
      <div className="v6b-copy">
        <p className="v6b-kicker">德智树下 · 秋千安全演示</p>
        <h1 tabIndex={-1}>
          <span>{copy.title[0]}</span>
          <wbr />
          <span>{copy.title[1]}</span>
        </h1>
        <p className="v6b-hint">{hint}</p>
        <button
          className="v6-btn-primary v6b-action"
          onClick={() => {
            play('branch');
            onNavigate('leaf-drop');
          }}
        >
          {leafDropLabel}
        </button>
        <div className="v6b-other-routes">
          <button
            className="v6-btn-text"
            onClick={() => {
              play('tap');
              onNavigate('explore');
            }}
          >
            去逛三校活动（A）
          </button>
          <button
            className="v6-btn-text"
            onClick={() => {
              play('tap');
              onNavigate('post-office');
            }}
          >
            走进时光邮局（D）
          </button>
        </div>
        <p className="v6b-safety-note">现场使用请遵循工作人员指引。</p>
      </div>

      <div className="v6b-grove">
        <svg
          className="v6b-swing-svg"
          viewBox="0 0 960 660"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <linearGradient id="v6b-grove" x2=".88" y2="1">
              <stop stopColor="#242d26" />
              <stop offset=".48" stopColor="#535936" />
              <stop offset="1" stopColor="#303a2b" />
            </linearGradient>
            <radialGradient id="v6b-glade" cx=".49" cy=".67" r=".7">
              <stop stopColor="#fff1c9" />
              <stop offset=".49" stopColor="#ebd5a1" />
              <stop offset=".79" stopColor="#a9a16c" />
              <stop offset="1" stopColor="#767a4b" />
            </radialGradient>
            <linearGradient id="v6b-sunbeam" x2="0" y2="1">
              <stop stopColor="#fff2c9" stopOpacity=".58" />
              <stop offset="1" stopColor="#fff2c9" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="v6b-wood" x2=".32" y2="1">
              <stop stopColor="#e1b47e" />
              <stop offset="1" stopColor="#be8958" />
            </linearGradient>
            <radialGradient id="v6b-shadow">
              <stop stopColor="#344b3c" stopOpacity=".26" />
              <stop offset="1" stopColor="#344b3c" stopOpacity="0" />
            </radialGradient>
          </defs>

          <path d="M0 0h960v660H0z" fill="url(#v6b-glade)" />
          <g fill="none" stroke="#666543" strokeLinecap="round">
            <path d="M123 504c14-78 17-158-5-289m53 296c29-101 26-170 18-245m559 235c-12-101-4-176 39-266m-88 264c13-94 13-147-3-208" strokeWidth="11" opacity=".29" />
            <path d="M135 307l-69-66m126 68 61-61m475 91 62-39m-26 1 77-102" strokeWidth="5" opacity=".35" />
          </g>
          <path d="M0 0h960v252c-38-23-73-22-108-5-25-44-73-57-113-46-23-50-82-63-133-43-30-43-92-52-135-28-45-48-115-59-161-23-49-35-108-15-127 31-45-3-83 22-87 61C52 200 33 216 0 250Z" fill="#6c7048" />
          <path d="M0 0h960v211c-57-16-99-61-145-48-45-54-105-57-154-39-40-50-108-59-151-37-34-41-102-49-154-24-57-23-115-11-150 25-48-5-78 13-100 48C60 129 19 157 0 183Z" fill="url(#v6b-grove)" />
          <path d="M470 109l74 8-254 444-132-2Zm110 28 19 8-158 364-76 21Zm159 49 37 6-139 317-67 4Z" fill="url(#v6b-sunbeam)" />

          <path d="M0 428c93 5 132 53 198 71 87-9 183-26 316-19 165 9 280 38 446-12v192H0Z" fill="#a5a16e" />
          <path d="M0 523c118 51 200-40 356-24 157 9 302 58 604 7v154H0Z" fill="#cfba89" />
          <path d="M35 531c160 27 199-31 371-17 196 16 311 67 570 5-142 103-411 91-573 60-111-21-253 39-368-48Z" fill="#eddbac" />
          <path d="M0 580c97 8 175-1 255-38 60-27 136-16 197 1-107-2-151 32-237 56C136 621 54 605 0 616Zm567-41c145 10 248-21 393-6v34c-134-20-235 20-393-28Z" fill="#69704a" opacity=".29" />
          <g fill="none" stroke="#827d51" strokeLinecap="round" opacity=".48">
            <path d="M105 587c78 0 136-31 195-37m283 37c111 13 218 9 312-24M77 606l18-4m137-6 18-5m473 5 36-2m52-91 12-5" />
            <path d="M167 535q-5-18-16-26m16 26q7-18 21-22m598 16q-9-20-25-24m25 24q2-20 14-28m-655 94q-2-13-12-20m12 20q9-15 20-15" strokeWidth="2" />
          </g>
          <ellipse key={`shadow-${state}-${swayReplay}`} className="v6b-swing-shadow" cx="478" cy="552" rx="195" ry="21" fill="url(#v6b-shadow)" />
          <path d="M960 8c-96 52-105 99-209 89-93-9-176-38-274-56C363 21 222 22 85 115l11 14c126-52 245-63 383-48 86 7 161 39 257 48 69 7 126-1 174-18-36 146-9 285-51 431-8 39-23 79-51 118h152Z" fill="url(#v6b-grove)" />
          <path d="M956 108c-72 109-14 245-67 419-14 46-27 82-46 111m104-398c-9 62 6 159-35 279" fill="none" stroke="#9c9360" strokeWidth="3" opacity=".52" />
          <g fill="none" strokeLinecap="round">
            <path d="M152 104c117-47 219-54 313-45 85 10 143 29 207 43m126 10c64-4 106-20 151-45" stroke="#a5ad7d" strokeWidth="2" opacity=".56" />
            <path d="M221 76c-35-5-69 0-112 21m166-30c-13 19-29 29-54 37m356-39c32 2 56-1 86-10m20 52c24 12 34 23 43 34m41-23c39 4 62 17 77 31M183 88l3-7m44-4 4-13m115-16 13 1m99 16 9-25m90 33 13 2m133 16 12-4m27 18 22 3" stroke="#647650" strokeWidth="3" />
          </g>
          {canopyLeaves.map(([x, y, angle, scale, color]) => (
            <g key={x} transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`}>
              <path d="M1 2C8-14 24-17 44-7 34 6 15 13 1 2Z" fill="#465639" opacity=".22" transform="translate(1 3)" />
              <path d="M0 0C8-16 24-19 44-9 34 4 15 11 0 0Z" fill={color} />
              <path d="M2 0c14-5 26-8 39-9" stroke="#d3d6aa" strokeWidth="1" fill="none" opacity=".56" />
            </g>
          ))}

          <g key={`rig-${state}-${swayReplay}`} className="v6b-swing-rig">
            <g fill="none" strokeLinecap="round">
              <path d="M341 89 333 432m282-329 8 329" stroke="#46483b" strokeWidth="6" />
              <path d="M340 89 332 432m282-329 8 329" stroke="#c5a676" strokeWidth="3" />
              <path d="M342 89 334 432m282-329 8 329" stroke="#edcc93" strokeWidth="1" opacity=".75" />
            </g>

            {state === 'occupied' && (
              <g>
                <path d="M427 431c6-27 16-53 32-69-12-8-18-20-18-33 0-21 16-38 38-38s39 17 39 38c0 14-7 27-18 34 19 18 27 48 30 68Z" fill="#36534d" />
                <path d="M466 376c-11 14-18 31-22 48m48-55c15 16 23 36 26 56" fill="none" stroke="#91a388" strokeWidth="2" opacity=".65" />
              </g>
            )}

            <path d="m307 425 334 3 18 23-368 2Z" fill="url(#v6b-wood)" stroke="#754d33" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="m291 453 368-2-5 14c-1 4-5 6-10 6H306c-5 0-9-3-10-7Z" fill="#8d593a" stroke="#754d33" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M309 441c53-7 109-6 166-3 32 2 77 2 125-1m-271 24h285m-215-15c27-2 56-2 84-1" stroke="#784d32" strokeWidth="1.4" opacity=".52" fill="none" strokeLinecap="round" />
            <path d="M326 425v8a7 7 0 0 0 14 0v-8m276 1v8a7 7 0 0 0 14 0v-8" stroke="#4e4f41" strokeWidth="3" fill="none" />

            {state === 'closed' && (
              <g transform="translate(436 424) rotate(-6)">
                <path d="M7 13 38-11l31 24" fill="none" stroke="#594734" strokeWidth="2" />
                <rect x="3" y="16" width="76" height="53" rx="4" fill="#493b2e" opacity=".22" />
                <rect y="13" width="76" height="53" rx="4" fill="#963d30" />
                <path d="M32 38v-5a6 6 0 0 1 12 0v5m-13 0h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H31a2 2 0 0 1-2-2V40a2 2 0 0 1 2-2Z" fill="none" stroke="#faefdc" strokeWidth="2" />
              </g>
            )}
          </g>
          <g fill="#354639" stroke="#b0b08a" strokeWidth="2">
            <rect x="333" y="71" width="16" height="27" rx="7" transform="rotate(3 341 84)" />
            <rect x="607" y="88" width="16" height="27" rx="7" transform="rotate(-4 615 101)" />
          </g>
        </svg>
        <div className="v6b-grove-caption">
          <span>演示情境 · {copy.status}</span>
          {state === 'available' && (
            <button type="button" onClick={() => {
              play('tap');
              setSwayReplay((replay) => replay + 1);
            }}>
              再看一次轻荡 <span aria-hidden="true">↺</span>
            </button>
          )}
        </div>
        <MacauTileBorder className="v6b-grove-tiles" bg="#465e6c" stroke="#f6ecd7" accent="#c39e6c" />
      </div>
    </section>
  );
}
