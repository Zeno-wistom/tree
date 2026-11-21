import { useState } from 'react';
import { seasonLeaves, seasonOrder } from '../data/catalog';
import { useDemoState } from '../hooks/useDemoState';
import './demopanel.css';

export function DemoPanel() {
  const { config, setField, resetDemoDefaults } = useDemoState();
  const [open, setOpen] = useState(false);

  // Strictly hidden from normal visitors unless ?demo=1 is active
  if (!config.demoMode) return null;

  return (
    <aside className={`v6-demo-panel${open ? ' is-open' : ''}`} aria-label="课程评审演示控制台">
      <button
        className="v6-demo-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? '收起演示控制台 ✕' : '演示控制台（?demo=1）'}
      </button>

      {open && (
        <div className="v6-demo-drawer">
          <div className="v6-demo-row">
            <span>四季主题</span>
            <div>
              {seasonOrder.map((sid) => (
                <button
                  key={sid}
                  className={config.season === sid ? 'is-on' : ''}
                  onClick={() => setField('season', sid)}
                >
                  {seasonLeaves[sid].label}·{seasonLeaves[sid].variety}
                </button>
              ))}
            </div>
          </div>

          <div className="v6-demo-row">
            <span>秋千状态 (B)</span>
            <div>
              {(
                [
                  ['available', '可用'],
                  ['occupied', '占用中'],
                  ['closed', '已关闭'],
                ] as const
              ).map(([val, label]) => (
                <button
                  key={val}
                  className={config.swingState === val ? 'is-on' : ''}
                  onClick={() => setField('swingState', val)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="v6-demo-row">
            <span>设备状态 (C)</span>
            <div>
              {(
                [
                  ['ready', '正常'],
                  ['busy', '正忙'],
                  ['fault', '故障暂停'],
                ] as const
              ).map(([val, label]) => (
                <button
                  key={val}
                  className={config.deviceStatus === val ? 'is-on' : ''}
                  onClick={() => setField('deviceStatus', val)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="v6-demo-row">
            <span>库存状态 (C)</span>
            <div>
              {(
                [
                  ['full', '充足'],
                  ['current_empty', '缺当期卡'],
                  ['all_empty', '全缺卡'],
                ] as const
              ).map(([val, label]) => (
                <button
                  key={val}
                  className={config.stockStatus === val ? 'is-on' : ''}
                  onClick={() => setField('stockStatus', val)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="v6-demo-row">
            <span>天气 / 托盘</span>
            <div>
              <button
                className={config.weatherStatus === 'normal' ? 'is-on' : ''}
                onClick={() => setField('weatherStatus', 'normal')}
              >
                天气正常
              </button>
              <button
                className={config.weatherStatus === 'wind_rain' ? 'is-on' : ''}
                onClick={() => setField('weatherStatus', 'wind_rain')}
              >
                雨风暂停
              </button>
              <button
                className={config.trayStatus === 'empty' ? 'is-on' : ''}
                onClick={() => setField('trayStatus', 'empty')}
              >
                托盘空闲
              </button>
              <button
                className={config.trayStatus === 'occupied' ? 'is-on' : ''}
                onClick={() => setField('trayStatus', 'occupied')}
              >
                托盘占用
              </button>
            </div>
          </div>

          <div className="v6-demo-row">
            <span>落卡结果 (C)</span>
            <div>
              {(
                [
                  ['normal', '正常落盘'],
                  ['zero', '零张'],
                  ['jam', '卡滞'],
                  ['double', '疑似双张'],
                  ['off_target', '飞偏未落盘'],
                ] as const
              ).map(([val, label]) => (
                <button
                  key={val}
                  className={config.dropOutcome === val ? 'is-on' : ''}
                  onClick={() => setField('dropOutcome', val)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="v6-demo-row">
            <span>邮局 / 音效</span>
            <div>
              <button
                className={config.postOfficeOpen ? 'is-on' : ''}
                onClick={() => setField('postOfficeOpen', true)}
              >
                邮局开放
              </button>
              <button
                className={!config.postOfficeOpen ? 'is-on' : ''}
                onClick={() => setField('postOfficeOpen', false)}
              >
                邮局关闭
              </button>
              <button
                className={!config.muted ? 'is-on' : ''}
                onClick={() => setField('muted', false)}
              >
                音效开
              </button>
              <button
                className={config.muted ? 'is-on' : ''}
                onClick={() => setField('muted', true)}
              >
                静音
              </button>
              <button onClick={resetDemoDefaults}>恢复默认</button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
