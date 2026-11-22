import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { sessionConfig, type RouteId } from './data/catalog';
import { DemoProvider, useDemoState } from './hooks/useDemoState';
import { BrandSeal } from './components/MacauOrnaments';
import { GardenBackdrop } from './components/GardenBackdrop';
import { DemoPanel } from './components/DemoPanel';
import { ExploreRoute } from './experiences/ExploreRoute';
import { SwingRoute } from './experiences/SwingRoute';
import { LeafDropRoute } from './experiences/LeafDropRoute';
import { PostOfficeRoute } from './experiences/PostOfficeRoute';
import './styles/tokens.css';

const isSharedEnvelopeScene = (route: RouteId) => route === 'home' || route === 'explore';

function KioskShell() {
  const rootRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const lastActivity = useRef(Date.now());
  const warnedAt = useRef<number | null>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const currentRoute = useRef<RouteId>('home');
  const transition = useRef<ViewTransition | null>(null);
  const navigationId = useRef(0);

  const [route, setRoute] = useState<RouteId>('home');
  const [collected, setCollected] = useState<ReadonlySet<string>>(() => new Set());
  const collectCard = useCallback((id: string) => {
    setCollected((previous) => previous.has(id) ? previous : new Set([...previous, id]));
  }, []);
  const [postOfficeInitialCard, setPostOfficeInitialCard] = useState<string | undefined>(undefined);
  const [warning, setWarning] = useState(false);
  const [seconds, setSeconds] = useState(15);
  const [postFormDirty, setPostFormDirty] = useState(false);
  const [leafDropActive, setLeafDropActive] = useState(false);

  const { config, setField } = useDemoState();

  useEffect(() => () => transition.current?.skipTransition(), []);

  const markActivity = useCallback(() => {
    lastActivity.current = Date.now();
  }, []);

  const navigate = useCallback(
    (next: RouteId, opts?: { postcardId?: string }) => {
      markActivity();
      if (currentRoute.current === next && !transition.current) return;
      const id = ++navigationId.current;
      transition.current?.skipTransition();
      transition.current = null;
      const shell = rootRef.current;
      shell?.removeAttribute('data-scene-transition');

      const changeRoute = () => {
        if (navigationId.current !== id) return;
        currentRoute.current = next;
        if (next === 'post-office') setPostOfficeInitialCard(opts?.postcardId);
        setRoute(next);
        requestAnimationFrame(() => {
          if (navigationId.current !== id) return;
          const selector = next === 'explore' ? '.v6a-open:enabled' : 'main h1';
          rootRef.current?.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true });
        });
      };

      // Home and A already share a physical envelope. Other garden views can overlap
      // using the browser's captured paints, with an in-place update as fallback.
      const shared = isSharedEnvelopeScene(currentRoute.current) && isSharedEnvelopeScene(next);
      if (!shared && !warnedAt.current && !dialogRef.current?.open && document.startViewTransition &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches && !document.hidden) {
        shell?.setAttribute('data-scene-transition', '');
        const active = document.startViewTransition(() => flushSync(changeRoute));
        transition.current = active;
        const clear = () => {
          if (transition.current !== active) return;
          transition.current = null;
          shell?.removeAttribute('data-scene-transition');
        };
        void active.finished.then(clear, clear);
      } else {
        changeRoute();
      }
    },
    [markActivity]
  );

  const resetToHome = useCallback(() => {
    warnedAt.current = null;
    setWarning(false);
    setPostFormDirty(false);
    setLeafDropActive(false);
    navigate('home');
  }, [navigate]);

  const finishSession = useCallback(() => {
    setCollected(new Set());
    resetToHome();
  }, [resetToHome]);

  const resumeSession = useCallback(() => {
    warnedAt.current = null;
    lastActivity.current = Date.now();
    setWarning(false);
    previousFocus.current?.focus({ preventScroll: true });
  }, []);

  // Scale 1440x810 logical kiosk stage to viewport (1920x1080, 1366x768, etc.)
  useEffect(() => {
    const resize = () => {
      const scale = Math.min(window.innerWidth / 1440, window.innerHeight / 810);
      rootRef.current?.style.setProperty('--stage-scale', String(scale));
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // 90s idle + 15s countdown (supports ?idle=<ms> for E2E verification)
  useEffect(() => {
    const el = rootRef.current;
    const onAct = () => {
      lastActivity.current = Date.now();
    };
    el?.addEventListener('pointerdown', onAct);
    el?.addEventListener('keydown', onAct);
    el?.addEventListener('input', onAct);

    const idleParam = Number(new URLSearchParams(window.location.search).get('idle'));
    const idleMs = idleParam > 0 ? idleParam : sessionConfig.idleMs;

    const timer = window.setInterval(() => {
      if (route === 'home' || document.hidden) return;
      const now = Date.now();
      if (warnedAt.current !== null) {
        const left = Math.max(0, Math.ceil((sessionConfig.warningMs - (now - warnedAt.current)) / 1000));
        setSeconds(left);
        if (left <= 0) finishSession();
      } else if (now - lastActivity.current >= idleMs) {
        previousFocus.current = document.activeElement as HTMLElement;
        warnedAt.current = now;
        setSeconds(Math.ceil(sessionConfig.warningMs / 1000));
        setWarning(true);
      }
    }, 250);

    return () => {
      window.clearInterval(timer);
      el?.removeEventListener('pointerdown', onAct);
      el?.removeEventListener('keydown', onAct);
      el?.removeEventListener('input', onAct);
    };
  }, [route, finishSession]);

  useEffect(() => {
    if (warning && !dialogRef.current?.open) {
      dialogRef.current?.showModal();
    } else if (!warning && dialogRef.current?.open) {
      dialogRef.current.close();
    }
  }, [warning]);

  return (
    <div className="v6-root" ref={rootRef} data-route={route} data-season={config.season}>
      <div className="v6-stage">
        <GardenBackdrop />
        <header className="v6-header">
          <button className="v6-brand" onClick={resetToHome} aria-label="拾花一叶，返回德智树下首页">
            <BrandSeal />
            <span className="v6-brand-text">
              <strong>拾花一叶</strong>

            </span>
          </button>

          <div className="v6-header-right">
            <button
              className="v6-icon-btn"
              onClick={() => setField('muted', !config.muted)}
              aria-pressed={config.muted}
              aria-label={config.muted ? '已静音，点击开启提示音' : '提示音开启中，点击静音'}
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 9v6h4l5 4V5L8 9H4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                {config.muted
                  ? <path d="m16 10 4 4m0-4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  : <path d="M17 9a5 5 0 0 1 0 6m2.5-8a8 8 0 0 1 0 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />}
              </svg>
            </button>
            {route !== 'home' && (
              <button className="v6-icon-btn" onClick={resetToHome}>
                ← 返回树下
              </button>
            )}
          </div>
        </header>

        <main>
          {(route === 'home' || route === 'explore') && (
            <ExploreRoute
              atHome={route === 'home'}
              collected={collected}
              onCollect={collectCard}
              onNavigate={navigate}
              onActivity={markActivity}
            />
          )}
          {route !== 'home' && route !== 'explore' && (
            <div className="v6-route-scene" key={route}>
              {route === 'swing' && <SwingRoute onNavigate={navigate} />}
              {route === 'leaf-drop' && (
                <LeafDropRoute onNavigate={navigate} onActiveChange={setLeafDropActive} />
              )}
              {route === 'post-office' && (
                <PostOfficeRoute
                  initialPostcardId={postOfficeInitialCard}
                  onNavigate={navigate}
                  onFormDirtyChange={setPostFormDirty}
                />
              )}
            </div>
          )}
        </main>

        {route !== 'home' && route !== 'explore' && <DemoPanel key={route} route={route} />}
      </div>

      {/* Idle Timeout Dialog */}
      <dialog
        className="v6-dialog"
        ref={dialogRef}
        aria-labelledby="v6-timeout-title"
        onCancel={(e) => {
          e.preventDefault();
          resumeSession();
        }}
      >
        <div className="v6-dialog-body">
          <span className="v6-dialog-count">{seconds}</span>
          <h2 id="v6-timeout-title">还想继续在树下停留吗？</h2>
          <p role="status">
            {postFormDirty
              ? `您正在写给未来的信尚未封存。${seconds} 秒后将清空内容并返回德智树下首页。`
              : leafDropActive
                ? `当前实体领卡演示尚未结束。${seconds} 秒后将安全退出本轮并返回首页。`
                : `${seconds} 秒后将自动清空本次记录，返回德智树下首页。`}
          </p>
          <div className="v6-dialog-actions">
            <button className="v6-btn-primary" onClick={resumeSession}>
              继续当前体验 →
            </button>
            <button className="v6-btn-text" onClick={finishSession}>
              立即结束并返回首页
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}

export function App() {
  return (
    <DemoProvider>
      <KioskShell />
    </DemoProvider>
  );
}
