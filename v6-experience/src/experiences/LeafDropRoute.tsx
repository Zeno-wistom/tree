import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { seasonLeaves, seasonOrder, type RouteId, type SeasonId } from '../data/catalog';
import { useDemoState } from '../hooks/useDemoState';
import { useChime } from '../hooks/useChime';
import './leafdrop.css';

gsap.registerPlugin(useGSAP);

type StepNum = 1 | 2 | 3 | 4 | 5 | 6 | 7;
type TriggerMethod = 'swing' | 'button';
type DropPhase = 'signal' | 'release' | 'drift';
type MechanicalFailure = 'zero' | 'jam' | 'double';
type ExceptionKind =
  | '02-busy'
  | '02-empty'
  | '02-paused'
  | '03-04-unsafe'
  | '05-mechanical'
  | '06-off-target'
  | '07-leftover';
type ReleaseBlocker = '02-paused' | '02-busy' | '03-04-unsafe';

const stepLabels = ['领取意图', '请求受理', '选择触发', '请求与停稳', '枝头预告与飘落', '落盘与取卡提示', '取走与复位'];

const flightInstructions: Record<DropPhase, [string, string]> = {
  signal: ['请看向亮灯的树枝', '枝端暖灯亮起。请停在原处，等叶片落入侧盘。'],
  release: ['叶片离开枝头', '请保持停稳，等侧边取卡盘亮起。'],
  drift: ['让叶片飘一会儿', '等叶片落稳、侧盘灯亮后，再沿外侧取卡。'],
};

const mechanicalMessages: Record<MechanicalFailure, string> = {
  zero: '模拟出口未确认过卡（零张）。',
  jam: '模拟出卡机构卡滞。',
  double: '模拟疑似同时释出两张卡片。',
};

const staffResetLabels: Partial<Record<ExceptionKind, string>> = {
  '05-mechanical': '[演示] 工作人员检查并复位',
  '06-off-target': '[演示] 工作人员确认并清盘恢复',
  '07-leftover': '[演示] 模拟工作人员清盘并恢复',
};

interface LeafDropRouteProps {
  onNavigate: (route: RouteId) => void;
  onActiveChange?: (active: boolean) => void;
}

function ActionNote({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <>
      <h1 tabIndex={-1}>{title}</h1>
      {children}
    </>
  );
}

function GardenIllustration({ swingMoving }: { swingMoving: boolean }) {
  return (
    <svg className="v6c-garden" viewBox="0 0 824 650" aria-hidden="true">
      <defs>
        <linearGradient id="v6c-sky" x2=".45" y2="1">
          <stop stopColor="#9fa994" />
          <stop offset=".52" stopColor="#efe6c8" />
          <stop offset="1" stopColor="#b5b18b" />
        </linearGradient>
        <linearGradient id="v6c-bark" x2=".95" y2=".1">
          <stop stopColor="#343e2d" />
          <stop offset=".62" stopColor="#57583b" />
          <stop offset="1" stopColor="#827153" />
        </linearGradient>
        <linearGradient id="v6c-court" x2=".58" y2="1">
          <stop stopColor="#efdfb8" />
          <stop offset="1" stopColor="#c7aa7e" />
        </linearGradient>
        <linearGradient id="v6c-swing-seat" x2=".2" y2="1">
          <stop stopColor="#ddbc88" />
          <stop offset="1" stopColor="#85613e" />
        </linearGradient>
        <pattern id="v6c-tile" width="26" height="26" patternUnits="userSpaceOnUse">
          <path fill="#e6d6b4" d="M0 0h26v26H0z" />
          <path fill="none" stroke="#927c65" strokeWidth=".65" d="M0 0h26v26H0z" />
          <path fill="#5e7281" d="M13 2 24 13 13 24 2 13Z" />
          <path fill="#f7edd5" d="M13 5q5 5 0 8 5-5 8 0-5 5-8 0 5 5 0 8-5-5 0-8-5 5-8 0 5-5 8 0-5-5 0-8Z" />
          <circle cx="13" cy="13" r="1.6" fill="#aa7955" />
        </pattern>
        <path id="v6c-frond" d="M0 0C17-18 41-29 68-27 49-10 24 3 0 0Z" />
      </defs>

      <path fill="url(#v6c-sky)" d="M0 0h824v650H0z" />
      <circle cx="693" cy="235" r="87" fill="#fff3ce" opacity=".65" />
      <path fill="#9da382" d="M0 272C122 162 222 211 324 288c118 91 220-17 311-25 89-8 139 7 189 41v202H0Z" />
      <path fill="#79876a" d="M0 336c116-37 175-15 279 8 79 18 144-2 213-43 93-54 201-18 332 33v192H0Z" />
      <path fill="#acaf8b" d="M579 373c3-40 6-72 14-119l9-20-1 43-8 94Zm159 0 9-137 10-37 6 70 6 111Z" />
      <path fill="#687759" d="M550 267c22-37 43-48 66-57 15 27 7 54-16 74-17-12-32-10-50-17Zm137-55c13-42 67-57 117-51-9 40-42 65-79 68-5 23-21 32-47 36-14-21-8-38 9-53Z" />
      <path fill="#b8a886" d="m474 362 350-61v100l-350 55Z" />
      <path fill="#d9c6a0" d="m461 354 363-63v14l-363 65Z" />
      <path fill="url(#v6c-tile)" d="m477 376 347-61v33l-347 59Z" />
      <path fill="#88765c" d="m477 407 347-59v6l-347 59Z" />

      <path fill="#79805d" d="M0 419c110-61 263-61 393-35 82 17 151 45 431 11v255H0Z" />
      <path fill="#5f6b4f" d="M0 439c99-14 184-38 286-32 112 6 212 39 302 39-55 46-32 124 42 204H0Z" />
      <path fill="url(#v6c-court)" d="M824 388c-186-3-273 36-350 101-91 77-187 103-346 161h696Z" />
      <path fill="none" stroke="#f5e5c0" strokeWidth="3" d="M824 400c-156 0-256 35-340 103-98 79-172 98-322 147" />
      <path fill="none" stroke="#9e8969" strokeWidth="1" opacity=".65" d="M561 431q57 38 82 103t123 116M671 404q41 39 61 85t92 95M448 519q98 21 143 131M398 553q206 1 426-76M285 608q260 21 539-66" />
      <path fill="#4a5840" d="M0 500c37-34 112-45 168-17-59 17-113 34-168 54Zm0 83c55-21 105-20 180-4L6 650H0Z" />
      <path fill="#aab181" d="M27 513q25-42 80-39-29 27-80 39Zm12 30q38-30 73-14-26 22-73 14Zm119-74q20-30 66-26-20 18-66 26Zm257-43q-25-24-63-16 25 19 63 16Z" />

      <path fill="url(#v6c-bark)" d="M0 10c40 54 51 109 41 177C27 280 55 352 32 427c-8 27-18 45-32 58h146c-31-24-43-52-39-89 8-82-13-134 14-205 13-36 46-49 86-46 82 7 190 58 293 68 25 2 50 0 78-10l-3-14c-69 1-120-21-185-50C301 99 204 51 141 56 101 59 70 32 57 0H0Z" />
      <path fill="none" stroke="#b39a6e" strokeWidth="2" opacity=".52" d="M88 79c42-8 103 9 176 42 84 39 181 91 291 75M64 163c-29 102 19 207-14 279m32-270c-28 74 21 185-12 249M140 131c77-13 160 33 204 49" />
      <path fill="#293a2a" d="M0 0h824v72c-48 9-55 38-103 29-40 31-76 9-95 38-49-11-86 18-132 1-44 15-89-13-123-10-48-15-80-1-121-19-52 13-89-21-127-11C83 108 42 91 0 112Z" />
      <path fill="#3b5035" d="M0 15c27-8 47 9 71 4 68-14 99 26 138 37 61-2 101 28 151 19-48 30-65 27-106 20-32 22-80-11-113-13C98 102 35 53 0 81Zm427 72c49-36 93-50 155-54 0-14 35-26 85-33h157v38c-52-3-75 25-113 34-34 32-64 11-95 28-83-13-133 28-189-13Z" />
      <path fill="#4c6040" d="M0 101C55 71 122 88 162 118c-62 20-100 4-162 30Zm151-20c51-22 109 11 136 42-52 0-109-8-136-42Zm186 47c44-23 94-39 150-20-32 31-104 41-150 20Zm256-13c44-25 93-39 128-19-27 31-89 36-128 19Z" />
      <g fill="#788560" opacity=".72">
        <use href="#v6c-frond" transform="translate(30 75) rotate(-16)" />
        <use href="#v6c-frond" transform="translate(119 94) rotate(25) scale(.86)" />
        <use href="#v6c-frond" transform="translate(230 91) rotate(30) scale(.75)" />
        <use href="#v6c-frond" transform="translate(353 121) rotate(-11) scale(.57)" />
        <use href="#v6c-frond" transform="translate(471 109) rotate(-28) scale(.95)" />
        <use href="#v6c-frond" transform="translate(550 117) rotate(10) scale(.73)" />
        <use href="#v6c-frond" transform="translate(659 85) rotate(-23)" />
        <use href="#v6c-frond" transform="translate(727 74) rotate(-21) scale(.83)" />
      </g>
      <g fill="#596c46">
        <use href="#v6c-frond" transform="translate(411 190) rotate(70) scale(.65)" />
        <use href="#v6c-frond" transform="translate(486 204) rotate(43) scale(.65)" />
        <use href="#v6c-frond" transform="translate(522 202) rotate(-13) scale(.76)" />
        <use href="#v6c-frond" transform="translate(185 145) rotate(81) scale(.76)" />
      </g>

      <ellipse cx="310" cy="431" rx="95" ry="15" fill="#39452f" opacity=".25" />
      <g className={swingMoving ? 'v6c-swing-seat is-moving' : 'v6c-swing-seat'}>
        <path d="M231 143 257 386m108-205 12 184" fill="none" stroke="#4b4233" strokeWidth="5" />
        <path d="M231 143 257 386m108-205 12 184" fill="none" stroke="#e2cc9e" strokeWidth="1.5" />
        <path fill="#725238" d="m235 381 151-24 33 25v10l-151 28-33-26Z" />
        <path fill="url(#v6c-swing-seat)" stroke="#5f4b35" strokeWidth="1.5" d="m235 381 151-24 33 25-151 28Z" />
        <path d="m249 387 147-25m-132 36 147-26" stroke="#f8e1b5" opacity=".56" />
        <circle cx="257" cy="385" r="4" fill="#584e3a" />
        <circle cx="377" cy="365" r="4" fill="#584e3a" />
      </g>
      <path fill="#847458" opacity=".38" d="M529 541c36-19 233-26 267 8s-65 66-153 55c-54-7-151-36-114-63Z" />
      <path fill="#a78f70" d="M545 484h219l-20 53c-15 37-177 44-194 8Z" />
      <path fill="url(#v6c-tile)" d="M549 514c47 17 151 14 206-5l-10 29c-54 18-143 21-193 2Z" />
      <path fill="none" stroke="#e8d7af" strokeWidth="3" d="M549 514c47 17 151 14 206-5m-203 31c50 19 139 16 193-2" />
    </svg>
  );
}

export function LeafDropRoute({ onNavigate, onActiveChange }: LeafDropRouteProps) {
  const root = useRef<HTMLElement>(null);
  const leafCardRef = useRef<HTMLDivElement>(null);
  const trayBedRef = useRef<HTMLDivElement>(null);
  const demoDrawerRef = useRef<HTMLDetailsElement>(null);
  const dropTl = useRef<gsap.core.Timeline | null>(null);
  const directionTimer = useRef<number | undefined>(undefined);

  const { config, setField, isLeafDropPaused, leafDropPauseReason } = useDemoState();
  const { play } = useChime();
  const latestChime = useRef(play);

  const [step, setStep] = useState<StepNum>(1);
  const [trigger, setTrigger] = useState<TriggerMethod | null>(null);
  const [exception, setException] = useState<ExceptionKind | null>(null);
  const [needsAltConfirm, setNeedsAltConfirm] = useState(false);
  const [activeSeason, setActiveSeason] = useState<SeasonId>(config.season);
  const [dropPhase, setDropPhase] = useState<DropPhase>('signal');
  const [mechanicalFailure, setMechanicalFailure] = useState<MechanicalFailure>('zero');
  const [cardFlipBack, setCardFlipBack] = useState(false);
  const [showDirectionHint, setShowDirectionHint] = useState(false);

  const card = seasonLeaves[activeSeason];
  const altSeason = seasonOrder[(seasonOrder.indexOf(config.season) + 1) % seasonOrder.length];
  const branchLit = step === 5 && !exception;
  const canTake = step === 6 && !exception;
  const trayOccupied = config.trayStatus === 'occupied';
  const trayLit = canTake || trayOccupied || exception === '07-leftover';
  const swingUnavailable = trigger === 'swing' && config.swingState !== 'available';
  const requestBlocker = isLeafDropPaused ? '02-paused' : config.deviceStatus === 'busy' ? '02-busy' : null;
  const releaseBlocker: ReleaseBlocker | null = requestBlocker ?? (swingUnavailable ? '03-04-unsafe' : null);
  const latestReleaseBlocker = useRef(releaseBlocker);

  useLayoutEffect(() => {
    latestChime.current = play;
    latestReleaseBlocker.current = releaseBlocker;
  }, [play, releaseBlocker]);

  useEffect(() => {
    if (step === 1) setActiveSeason(config.season);
  }, [config.season, step]);

  useEffect(() => {
    onActiveChange?.(step >= 2 && step <= 6 && !exception);
    return () => onActiveChange?.(false);
  }, [step, exception, onActiveChange]);

  useEffect(() => {
    const activeElement = document.activeElement;
    if (activeElement === document.body || root.current?.contains(activeElement)) {
      root.current?.querySelector('h1')?.focus({ preventScroll: true });
    }
  }, [step, exception]);

  useEffect(() => () => window.clearTimeout(directionTimer.current), []);

  const { contextSafe } = useGSAP(
    () => {
      const syncVisibility = () => dropTl.current?.paused(document.hidden);
      document.addEventListener('visibilitychange', syncVisibility);
      return () => {
        document.removeEventListener('visibilitychange', syncVisibility);
        dropTl.current?.kill();
      };
    },
    { scope: root }
  );

  const clearDirectionHint = () => {
    window.clearTimeout(directionTimer.current);
    directionTimer.current = undefined;
    setShowDirectionHint(false);
  };

  const showPickupDirection = () => {
    play('tap');
    window.clearTimeout(directionTimer.current);
    setShowDirectionHint(true);
    directionTimer.current = window.setTimeout(clearDirectionHint, 1800);
  };

  const resetRound = contextSafe(() => {
    dropTl.current?.kill();
    dropTl.current = null;
    clearDirectionHint();
    setStep(1);
    setTrigger(null);
    setException(null);
    setNeedsAltConfirm(false);
    setDropPhase('signal');
    setCardFlipBack(false);
    setActiveSeason(config.season);
    gsap.set(leafCardRef.current, { x: 0, y: 0, rotation: -14, scale: 0.48, autoAlpha: 0 });
  });

  const beginAcceptance = (directButton = false) => {
    if (step !== 1) return;
    play('tap');
    setTrigger(directButton ? 'button' : null);
    setException(null);
    setNeedsAltConfirm(false);
    setStep(2);
  };

  useEffect(() => {
    if (step !== 2 || exception || needsAltConfirm) return;

    const timer = window.setTimeout(() => {
      if (requestBlocker || config.stockStatus === 'all_empty') {
        latestChime.current('alert');
        setException(requestBlocker ?? '02-empty');
      } else if (config.stockStatus === 'current_empty') {
        setNeedsAltConfirm(true);
      } else {
        setActiveSeason(config.season);
        setStep(trigger === 'button' ? 4 : 3);
      }
    }, 340);

    return () => window.clearTimeout(timer);
  }, [config.season, config.stockStatus, exception, needsAltConfirm, requestBlocker, step, trigger]);

  const confirmAlternativeCard = () => {
    play('tap');
    setActiveSeason(altSeason);
    setTrigger(null);
    setNeedsAltConfirm(false);
    setStep(3);
  };

  const chooseTrigger = (method: TriggerMethod) => {
    play('tap');
    setException(null);
    setTrigger(method);
    setStep(4);
  };

  const reportBlockedRelease = (blocker: ReleaseBlocker) => {
    latestChime.current('alert');
    setStep(blocker === '03-04-unsafe' ? 4 : 2);
    setException(blocker);
  };

  const launchLeafDrop = contextSafe(() => {
    if (step !== 4 || !trigger || (exception && exception !== '03-04-unsafe')) return;
    if (releaseBlocker) {
      reportBlockedRelease(releaseBlocker);
      return;
    }

    const leaf = leafCardRef.current;
    const trayBed = trayBedRef.current;
    if (!leaf || !trayBed) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const outcome = config.dropOutcome;
    // Both anchors share the theater as their offset parent and use unscaled stage coordinates.
    const x = trayBed.offsetLeft + trayBed.offsetWidth / 2 - leaf.offsetLeft - leaf.offsetWidth / 2;
    const y = trayBed.offsetTop + trayBed.offsetHeight / 2 - leaf.offsetTop - leaf.offsetHeight / 2;

    setException(null);
    setStep(5);
    setDropPhase('signal');
    play('branch');

    dropTl.current?.kill();
    const releaseLeaf = contextSafe(() => {
      // Shared conditions can change while the branch lamp is giving its warning.
      const blocker = latestReleaseBlocker.current;
      if (blocker) {
        dropTl.current = null;
        reportBlockedRelease(blocker);
        return;
      }

      const timeline = gsap.timeline({ paused: document.hidden });
      dropTl.current = timeline;

      if (outcome === 'zero' || outcome === 'jam' || outcome === 'double') {
        timeline
          .to(leaf, {
            y: outcome === 'zero' || reduce ? 0 : 20,
            rotation: -14,
            autoAlpha: outcome === 'zero' ? 0 : 1,
            duration: reduce ? 0.05 : 0.55,
            ease: 'power1.out',
          })
          .call(() => {
            latestChime.current('alert');
            setField('deviceStatus', 'fault');
            setMechanicalFailure(outcome);
            setException('05-mechanical');
          });
        return;
      }

      const offTarget = outcome === 'off_target';
      if (reduce) {
        timeline.set(leaf, {
          x: offTarget ? -122 : x,
          y,
          rotation: offTarget ? -32 : -6,
          scale: 0.76,
          autoAlpha: offTarget ? 0.5 : 1,
        });
      } else {
        timeline
          .call(() => setDropPhase('release'))
          .to(leaf, { autoAlpha: 1, y: 19, scale: 0.65, duration: 0.38, ease: 'power2.out' })
          .call(() => setDropPhase('drift'))
          .to(leaf, { x: -72, y: y * 0.38, rotation: -27, scale: 0.74, duration: 0.65, ease: 'sine.inOut' })
          .to(leaf, {
            x: offTarget ? -105 : x * 0.53,
            y: y * 0.76,
            rotation: offTarget ? -25 : 18,
            scale: 0.82,
            duration: 0.66,
            ease: 'sine.inOut',
          })
          .to(leaf, {
            x: offTarget ? -150 : x,
            y,
            rotation: offTarget ? -48 : -6,
            scale: 0.76,
            autoAlpha: offTarget ? 0.5 : 1,
            duration: 0.65,
            ease: 'power2.out',
          });
      }

      timeline.call(() => {
        setStep(6);
        if (offTarget) {
          setField('deviceStatus', 'fault');
          setException('06-off-target');
          latestChime.current('alert');
        } else {
          setField('trayStatus', 'occupied');
          latestChime.current('landed');
        }
      });
    });

    dropTl.current = gsap.timeline({ paused: document.hidden })
      .set(leaf, { x: 0, y: 0, rotation: -14, scale: 0.48, autoAlpha: 0 })
      .call(releaseLeaf, [], reduce ? 0.05 : 0.85);
  });

  const handlePickup = contextSafe(() => {
    clearDirectionHint();
    play('stamp');
    setField('trayStatus', 'empty');
    setException(null);
    setStep(7);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    dropTl.current?.kill();
    dropTl.current = gsap.timeline({ paused: document.hidden }).to(leafCardRef.current, {
      y: reduce ? '+=0' : '-=42',
      autoAlpha: 0,
      duration: reduce ? 0 : 0.26,
      ease: 'power2.out',
    });
  });

  const handleSkipOrTimeout = () => {
    clearDirectionHint();
    play('alert');
    setField('trayStatus', 'occupied');
    setStep(7);
    setException('07-leftover');
  };

  const handleStaffRecovery = () => {
    play('tap');
    if (config.trayStatus === 'occupied') setField('trayStatus', 'empty');
    if (config.deviceStatus === 'fault') setField('deviceStatus', 'ready');
    if (config.deviceStatus === 'fault' || exception === '05-mechanical' || exception === '06-off-target') {
      setField('dropOutcome', 'normal');
    }
    resetRound();
  };

  const canRecoverFromPause = exception === '02-paused'
    && (config.deviceStatus === 'fault' || trayOccupied);
  const staffResetLabel = canRecoverFromPause
    ? '[演示] 工作人员检查并恢复领卡'
    : exception && staffResetLabels[exception];

  const runDemoAction = (action: () => void) => {
    // Keep focus in this route while the active control is closed or removed.
    const drawer = demoDrawerRef.current;
    drawer?.querySelector('summary')?.focus({ preventScroll: true });
    if (drawer) drawer.open = false;
    action();
  };

  return (
    <section
      className="v6c"
      ref={root}
      data-step={step}
      data-exception={exception ?? 'none'}
      data-flight={branchLit ? dropPhase : undefined}
      aria-label="C 实体领卡"
    >
      <div className="v6c-paper">
        <div className="v6c-action">
          <span className="v6c-route-name">C　实体领卡</span>

          {exception === '02-busy' && (
            <ActionNote title="系统正忙，请稍后重试">
              <p>上一轮明信片还在发放。稍等片刻再试，或先看看三校活动。</p>
              <div className="v6c-btns">
                <button className="v6-btn-primary" onClick={resetRound}>返回重新选择</button>
                <button className="v6-btn-text" onClick={() => onNavigate('explore')}>先看三校活动（A）</button>
              </div>
            </ActionNote>
          )}

          {exception === '02-empty' && (
            <ActionNote title="当前实体叶形卡已领完">
              <p>你仍可在屏幕上挑一张数字明信片，带走德智广场的故事。</p>
              <div className="v6c-btns">
                <button className="v6-btn-primary" onClick={() => onNavigate('explore')}>改去屏幕数字收藏（A）→</button>
                <button className="v6-btn-text" onClick={() => onNavigate('home')}>结束并返回树下</button>
              </div>
            </ActionNote>
          )}

          {exception === '02-paused' && (
            <ActionNote title="当前暂不可开启实体领卡">
              <p>{leafDropPauseReason ?? '领卡暂缓，请等待工作人员恢复。'}</p>
              <div className="v6c-btns">
                <button className="v6-btn-primary" onClick={() => onNavigate('explore')}>前往屏幕探索（A）→</button>
                <button className="v6-btn-text" onClick={() => onNavigate('post-office')}>前往时光邮局（D）</button>
                <button className="v6-btn-text" onClick={() => onNavigate('home')}>返回德智树下总览</button>
              </div>
            </ActionNote>
          )}

          {exception === '03-04-unsafe' && (
            <ActionNote title={swingUnavailable ? '秋千当前不可用' : '模拟状态 · 秋千未停稳或有人进入落区'}>
              <p>{swingUnavailable
                ? '请等秋千恢复可用，或改到屏幕旁，用实体按键触发。'
                : '请等秋千完全停稳，确认落区无人后再继续。也可改到屏幕旁，用实体按键触发。'}</p>
              <div className="v6c-btns">
                <button className="v6-btn-primary" onClick={launchLeafDrop} disabled={swingUnavailable}>已确认停稳与落区清空，继续放行 →</button>
                <button className="v6-btn-secondary" onClick={() => chooseTrigger('button')}>改用实体按键触发</button>
                <button className="v6-btn-text" onClick={resetRound}>取消并结束本轮</button>
              </div>
            </ActionNote>
          )}

          {exception === '05-mechanical' && (
            <ActionNote title="暂不可领取">
              <p>{mechanicalMessages[mechanicalFailure]} 发卡已暂停，<strong>不会自动补发</strong>，请等工作人员检查。</p>
              <div className="v6c-btns">
                <button className="v6-btn-primary" onClick={() => onNavigate('explore')}>先体验其他路线（A）</button>
              </div>
            </ActionNote>
          )}

          {exception === '06-off-target' && (
            <ActionNote title="卡片未到，请等工作人员">
              <p>请留在摆动区外侧，由工作人员确认卡片的落点。</p>
              <div className="v6c-btns">
                <button className="v6-btn-primary" onClick={() => onNavigate('home')}>返回树下总览</button>
              </div>
            </ActionNote>
          )}

          {exception === '07-leftover' && (
            <ActionNote title="本轮结束 · 侧盘待清盘">
              <p>侧盘灯会继续亮着。工作人员取走余卡后，即可开放下一轮。</p>
              <div className="v6c-btns">
                <button className="v6-btn-primary" onClick={() => onNavigate('home')}>返回德智树下总览</button>
              </div>
            </ActionNote>
          )}

          {!exception && step === 1 && (
            <ActionNote title={<>树枝会飘下<span className="v6c-title-phrase">一张叶形明信片</span></>}>
              <p>枝头亮起暖金灯时，留在原处等一等。你的明信片会飘进摆动区外侧的取卡盘。</p>
              <section className="v6c-specimens" aria-label="四季叶形卡预览">
                <div className="v6c-specimen-heading">
                  <h2>四季叶形卡</h2>
                  <span>本期 · {card.label} · {card.variety}</span>
                </div>
                <div className="v6c-specimen-row">
                  {seasonOrder.map((season) => {
                    const specimen = seasonLeaves[season];
                    return (
                      <figure key={season} data-current={season === activeSeason ? '' : undefined}>
                        <img src={specimen.frontImage} alt="" width={90} height={90} />
                        <figcaption>{specimen.label} · {specimen.variety}</figcaption>
                      </figure>
                    );
                  })}
                </div>
              </section>
              <div className="v6c-btns">
                <button className="v6-btn-primary" onClick={() => beginAcceptance()}>领实体叶形明信片 →</button>
              </div>
            </ActionNote>
          )}

          {!exception && step === 2 && !needsAltConfirm && (
            <ActionNote title="正在确认本轮领卡">
              <p role="status">先检查当期库存与侧盘，再继续。</p>
            </ActionNote>
          )}

          {!exception && step === 2 && needsAltConfirm && (
            <ActionNote title={'当期「' + seasonLeaves[config.season].variety + '」已领完'}>
              <p>要换一张 <strong>{seasonLeaves[altSeason].label} · {seasonLeaves[altSeason].variety}</strong> 叶形明信片吗？</p>
              <div className="v6c-btns">
                <button className="v6-btn-primary" onClick={confirmAlternativeCard}>接受替代卡，继续领卡 →</button>
                <button className="v6-btn-secondary" onClick={() => onNavigate('explore')}>改去屏幕数字收藏（A）</button>
                <button className="v6-btn-text" onClick={resetRound}>暂不领取，返回</button>
              </div>
            </ActionNote>
          )}

          {!exception && step === 3 && (
            <ActionNote title="请选择触发方式">
              <p>秋千和屏幕旁的按键都能送出这张 <strong>{card.label} · {card.variety}</strong>。</p>
              <div className="v6c-trigger-grid">
                <button
                  className="v6c-trigger-card"
                  disabled={config.swingState !== 'available'}
                  onClick={() => chooseTrigger('swing')}
                >
                  <strong>秋千触发</strong>
                  <span>{config.swingState === 'available' ? '坐稳后轻晃一次' : config.swingState === 'occupied' ? '秋千使用中' : '秋千暂时关闭'}</span>
                </button>
                <button className="v6c-trigger-card" onClick={() => chooseTrigger('button')}>
                  <strong>实体按键</strong>
                  <span>轻按屏幕旁的发卡键</span>
                </button>
              </div>
              <button className="v6-btn-text" onClick={resetRound}>取消本轮</button>
            </ActionNote>
          )}

          {!exception && step === 4 && (
            <ActionNote title={trigger === 'swing' ? '收到请求，请先停稳' : '请确认落区清空'}>
              <p>{trigger === 'swing'
                ? '坐在原处，等秋千完全停下。确认下方无人后，枝端的暖灯才会亮起。'
                : '请站在摆动区外侧。确认落区无人后，枝端的暖灯才会亮起。'}</p>
              <div className="v6c-btns">
                <button
                  className="v6-btn-primary"
                  aria-label={trigger === 'swing' && config.demoMode ? '停稳后继续（模拟停稳并落区清空）' : undefined}
                  onClick={launchLeafDrop}
                >
                  {trigger === 'swing' ? '停稳后继续 →' : '开始枝头预告 →'}
                </button>
                <button className="v6-btn-text" onClick={resetRound}>取消本轮</button>
              </div>
            </ActionNote>
          )}

          {!exception && step === 5 && (
            <ActionNote title={flightInstructions[dropPhase][0]}>
              <p role="status">{flightInstructions[dropPhase][1]}</p>
            </ActionNote>
          )}

          {canTake && (
            <ActionNote title={<>明信片到了 <span className="v6c-pickup-arrow">→</span> <span className="v6c-title-phrase">侧边取卡盘</span></>}>
              <p>看向亮起的侧盘，沿摆动区外侧前往取卡。</p>
              <button
                className="v6c-tray-action"
                aria-label="取走明信片，确认取走这张叶形卡"
                onClick={handlePickup}
              >
                <span aria-hidden="true">↑</span> 取走明信片
              </button>
              <div className="v6c-btns">
                <button
                  className="v6-btn-secondary"
                  onClick={() => {
                    play('tap');
                    setCardFlipBack((value) => !value);
                  }}
                >
                  预览叶形卡{cardFlipBack ? '正面' : '背面'} ↻
                </button>
                <button className="v6-btn-text" onClick={showPickupDirection}>重看取卡方向</button>
                <button className="v6-btn-text" onClick={handleSkipOrTimeout}>本轮不取卡</button>
              </div>
            </ActionNote>
          )}

          {!exception && step === 7 && (
            <ActionNote title="已取走，愿这片花叶陪你走过德智广场">
              <p>把这片花叶带在身边，或到时光邮局，给未来的自己留句话。</p>
              <div className="v6c-btns">
                <button className="v6-btn-primary" onClick={() => onNavigate('post-office')}>去时光邮局（D）→</button>
                <button className="v6-btn-secondary" onClick={resetRound}>
                  {config.demoMode ? '再演示一轮领卡' : '再领一张'}
                </button>
                <button className="v6-btn-text" onClick={() => onNavigate('home')}>返回德智树下总览</button>
              </div>
            </ActionNote>
          )}
        </div>

        <footer className="v6c-note-foot">
          <span>屏幕模拟 · 发卡装置未连接</span>
          {config.demoMode && (
            <details className="v6c-demo-drawer" ref={demoDrawerRef}>
              <summary>C 演示工具</summary>
              <div className="v6c-demo-body">
                <p>编号对应领卡流程，深色一行为当前步骤。条件与结果均为屏幕模拟。</p>
                <ol className="v6c-stepper" aria-label="实体领卡七步流程">
                  {stepLabels.map((label, index) => (
                    <li key={label} aria-current={index + 1 === step ? 'step' : undefined}>
                      <span aria-hidden="true">0{index + 1}</span> {label}
                    </li>
                  ))}
                </ol>
                {!exception && step === 1 && (
                  <button className="v6c-demo-action" onClick={() => runDemoAction(() => beginAcceptance(true))}>
                    [演示] 直接按实体按键领卡
                  </button>
                )}
                {!exception && step === 4 && (
                  <button
                    className="v6c-demo-action"
                    onClick={() => runDemoAction(() => {
                      play('alert');
                      setException('03-04-unsafe');
                    })}
                  >
                    [演示异常] 模拟未停稳 / 有人进入落区
                  </button>
                )}
                {canTake && (
                  <button className="v6c-demo-action" onClick={() => runDemoAction(handleSkipOrTimeout)}>
                    [演示] 强制取卡超时
                  </button>
                )}
                {staffResetLabel && (
                  <button className="v6c-demo-action" onClick={() => runDemoAction(handleStaffRecovery)}>
                    {staffResetLabel}
                  </button>
                )}
              </div>
            </details>
          )}
        </footer>
      </div>

      <div className="v6c-theater">
        <GardenIllustration swingMoving={step === 4 && trigger === 'swing' && !exception} />
        <div className={'v6c-branch-lamp' + (branchLit ? ' is-on' : '')} aria-hidden="true" />
        <span className="v6c-branch-label" aria-hidden="true">枝端预告灯</span>
        <span className="v6c-swing-label" aria-hidden="true">秋千摆动区</span>

        <div
          className={'v6c-tray' + (trayLit ? ' is-lit' : '') + (showDirectionHint ? ' is-pulse' : '')}
          ref={trayBedRef}
          aria-hidden="true"
        />
        <div className="v6c-leaf-card" ref={leafCardRef} aria-hidden={!canTake}>
          <img
            src={cardFlipBack ? card.backImage : card.frontImage}
            alt={card.variety + '叶形卡' + (cardFlipBack ? '背面' : '正面')}
          />
        </div>
        {!canTake && (
          <span className="v6c-tray-label" aria-hidden="true">
            {trayLit ? '侧盘待清盘' : '侧边取卡盘'}
          </span>
        )}
      </div>
    </section>
  );
}
