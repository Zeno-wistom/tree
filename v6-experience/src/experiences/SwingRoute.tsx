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
  [108, 94, -50, 1.05, '#758b68'],
  [186, 81, -18, 0.9, '#a5ab7c'],
  [234, 64, -124, 1.12, '#87966e'],
  [268, 96, 143, 0.86, '#6f855e'],
  [362, 49, -116, 0.94, '#9ba67c'],
  [409, 72, 144, 1.08, '#71865d'],
  [470, 40, -66, 0.92, '#94a376'],
  [573, 75, -105, 1.12, '#788d64'],
  [607, 92, 123, 0.82, '#9da679'],
  [676, 111, 140, 1.14, '#758862'],
  [718, 87, -62, 0.91, '#8e9a70'],
  [767, 108, -22, 1.06, '#6d825f'],
  [819, 131, 115, 0.98, '#98a37a'],
] as const;

export function SwingRoute({ onNavigate }: SwingRouteProps) {
  const { config, isLeafDropPaused } = useDemoState();
  const { play } = useChime();
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
        <p className="v6b-status" role="status">
          <span className="v6b-status-dot" aria-hidden="true" />
          <span>{copy.status}</span>
          <span className="v6b-demo-label">演示状态</span>
        </p>
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
      </div>

      <svg
        key={state}
        className="v6b-swing-svg"
        viewBox="0 0 960 660"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <radialGradient id="v6b-glade">
            <stop stopColor="#f9ebc7" />
            <stop offset=".64" stopColor="#e9e7c9" />
            <stop offset="1" stopColor="#e9e7c9" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="v6b-wood" x2=".32" y2="1">
            <stop stopColor="#e1b47e" />
            <stop offset="1" stopColor="#be8958" />
          </linearGradient>
          <radialGradient id="v6b-shadow">
            <stop stopColor="#344b3c" stopOpacity=".26" />
            <stop offset="1" stopColor="#344b3c" stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse cx="501" cy="309" rx="439" ry="307" fill="url(#v6b-glade)" />
        <path d="M125 557c130-59 254-78 401-66 116 9 248 43 380 23-120 58-207 80-373 80-139 0-271-33-408-37Z" fill="#d1d8b5" opacity=".59" />
        <path d="M171 568c174-47 282-43 395-19 73 15 143 20 230 9-78 35-177 55-299 46-103-7-206-41-326-36Z" fill="#b8c39a" opacity=".34" />
        <ellipse className="v6b-swing-shadow" cx="478" cy="552" rx="195" ry="21" fill="url(#v6b-shadow)" />

        <path d="M96 129C233 42 370 29 478 48c96 17 173 40 260 48 79 7 141-12 222-60v51c-68 37-140 50-224 42-96-9-171-41-257-48-138-15-257-4-383 48Z" fill="#596a4e" opacity=".18" transform="translate(3 8)" />
        <path d="M96 129C233 42 370 29 478 48c96 17 173 40 260 48 79 7 141-12 222-60v51c-68 37-140 50-224 42-96-9-171-41-257-48-138-15-257-4-383 48Z" fill="#4f6048" />
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

        <g className="v6b-swing-rig">
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
    </section>
  );
}
