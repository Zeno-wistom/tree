import { useState } from 'react';
import { GardenBough, SwingRig } from '../components/GardenBackdrop';
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
        <svg className="v6b-swing-svg" viewBox="0 0 880 615" aria-hidden="true">
          <defs>
            <radialGradient id="v6b-pool">
              <stop stopColor="#fff5dc" stopOpacity=".85" />
              <stop offset="1" stopColor="#fff5dc" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="v6b-shadow">
              <stop stopColor="#314832" stopOpacity=".29" />
              <stop offset="1" stopColor="#314832" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="476" cy="369" rx="389" ry="252" fill="url(#v6b-pool)" />
          <GardenBough className="v6b-canopy" x={-23} y={0} width={960} height={175} />
          <path d="M108 147c108-57 198-60 293-32 104 30 194 33 348-32l-1 17c-143 75-263 64-357 39-101-25-169-19-282 22Z"
            fill="#58634e" />
          <path d="M119 147c102-53 184-56 280-27 103 30 204 30 339-29m-554 44c73-28 141-19 214-1 93 24 168 29 246 8"
            fill="none" stroke="#c6ba8e" strokeWidth="1.25" opacity=".82" />
          <ellipse key={`shadow-${state}-${swayReplay}`} className="v6b-swing-shadow" cx="442" cy="501" rx="190" ry="27" fill="url(#v6b-shadow)" />
          <path d="M83 518c158-64 219-34 354-22 128 11 248-24 387-23M123 537c137-48 206-20 319-10 154 12 254-22 370-29"
            fill="none" stroke="#8d8e69" strokeWidth="1" opacity=".53" />
          <g transform="translate(441 135) scale(1.47)">
            <g key={`rig-${state}-${swayReplay}`} className="v6b-swing-rig">
              <SwingRig state={state} anchors={[-9, 7]} />
            </g>
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
      </div>
    </section>
  );
}
