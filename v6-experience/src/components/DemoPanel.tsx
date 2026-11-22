import { useState } from 'react';
import type { RouteId } from '../data/catalog';
import { useDemoState } from '../hooks/useDemoState';
import './demopanel.css';

export function DemoPanel({ route }: { route: RouteId }) {
  const { config, setField, resetDemoDefaults } = useDemoState();
  const [open, setOpen] = useState(false);

  // Strictly hidden from normal visitors unless ?demo=1 is active
  if (!config.demoMode) return null;

  return (
    <aside className={`v6-demo-panel${open ? ' is-open' : ''}`} aria-label="演示设置">
      <button
        className="v6-demo-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? '收起演示控制台' : '演示控制台'}
      </button>

      {open && (
        <div className="v6-demo-drawer">
          {(route === 'swing' || route === 'leaf-drop') && <div className="v6-demo-row">
            <span>秋千状态</span>
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
          </div>}

          {route === 'leaf-drop' && <>
          <div className="v6-demo-row">
            <span>设备状态</span>
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
            <span>主题叶卡库存</span>
            <div>
              {(
                [
                  ['full', '充足'],
                  ['empty', '主题卡领完'],
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
            <span>落卡结果</span>
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

          </>}

          {route === 'post-office' && <div className="v6-demo-row">
            <span>邮局状态</span>
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
            </div>
          </div>}
          <button className="v6-btn-text v6-demo-reset" onClick={resetDemoDefaults}>恢复默认</button>
        </div>
      )}
    </aside>
  );
}
