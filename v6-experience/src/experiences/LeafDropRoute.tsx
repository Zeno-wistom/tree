import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { seasonLeaves, seasonOrder, type RouteId } from '../data/catalog';
import { useDemoState } from '../hooks/useDemoState';
import { useObjectScale } from '../hooks/useObjectScale';
import { useChime } from '../hooks/useChime';
import { GardenBough, SwingRig } from '../components/GardenBackdrop';
import './leafdrop.css';

gsap.registerPlugin(useGSAP, MotionPathPlugin);

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
type ReleaseBlocker = '02-paused' | '02-busy' | '02-empty' | '03-04-unsafe';

const stepLabels = ['领取意图', '请求受理', '选择触发', '请求与停稳', '枝头预告与飘落', '落盘与取卡提示', '取走与复位'];
const tributeCardFront = '/assets/postcards/leaf/tribute-front.svg';
const tributeCardBack = '/assets/postcards/leaf/tribute-back.svg';

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

function SeasonDisplay() {
  return (
    <section className="v6c-specimens" aria-label="四季叶形卡自取陈列">
      <div className="v6c-specimen-heading">
        <h2>四季叶形卡</h2>
        <span>旁侧陈列架自取</span>
      </div>
      <div className="v6c-specimen-row">
        {seasonOrder.map((season) => {
          const specimen = seasonLeaves[season];
          return (
            <figure key={season}>
              <img src={specimen.frontImage} alt="" width={90} height={90} />
              <figcaption>{specimen.label} · {specimen.variety}</figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}

function GardenIllustration({ swingMoving }: { swingMoving: boolean }) {
  return (
    <svg className="v6c-garden" viewBox="0 0 824 650" aria-hidden="true">
      <defs>
        <linearGradient id="v6c-wood" x1="0%" y1="0%" x2="94%" y2="52%">
          <stop stopColor="#394c3b" />
          <stop offset=".56" stopColor="#62694d" />
          <stop offset="1" stopColor="#938568" />
        </linearGradient>
        <radialGradient id="v6c-pool">
          <stop stopColor="#fff5dd" stopOpacity=".78" />
          <stop offset="1" stopColor="#fff5dd" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="v6c-seat-shadow">
          <stop stopColor="#45523a" stopOpacity=".29" />
          <stop offset="1" stopColor="#45523a" stopOpacity="0" />
        </radialGradient>
        <pattern id="v6c-etch" width="5" height="5" patternUnits="userSpaceOnUse">
          <path d="M-2 5 5-2M2 7l5-5" stroke="#e4dda0" strokeWidth=".6" />
        </pattern>
      </defs>
      <ellipse cx="495" cy="341" rx="406" ry="276" fill="url(#v6c-pool)" />
      <GardenBough className="v6c-canopy" x={-178} y={-27} width={1060} height={206} />
      <path d="M-70 103C26 94 99 77 161 93c93 21 126 63 230 80 66 11 111 15 177 19l-1 13c-66 11-139 3-198-8-104-20-179-57-236-67-64-12-145 31-209 35Z"
        fill="url(#v6c-wood)" />
      <path d="M-70 109C24 99 95 86 160 99c86 18 124 63 235 81 63 10 121 20 171 16M-54 143c89-21 139-31 186-23 65 10 114 38 165 50m91 18c54 11 121 18 153 15"
        fill="none" stroke="#c2b289" strokeOpacity=".77" strokeWidth="1.25" />
      <path d="M27 110c54-3 75-13 119-6l64 24c-71-17-127-9-191-1Z" fill="url(#v6c-etch)" opacity=".64" />
      <path d="M483 190q36-46 61-45-2 31-44 47m-77-9q-32-18-35-45 28 6 38 45m-285-56Q104 166 77 152q24-23 64-25"
        fill="#6c856b" stroke="#526a4d" />
      <path d="M501 190q17-24 38-40m-116 31q-21-18-30-37m-253-16-55 22" fill="none" stroke="#c6d1a9" strokeWidth="1" />
      <path d="M564 203q17 2 26-4" fill="none" stroke="#897350" strokeWidth="2" />
      <path d="M23 483q182-57 381-22t412-32m-769 70q179-47 353-13t416-35m-734 64q152-33 281-12"
        fill="none" stroke="#817b59" strokeWidth="1" opacity=".36" />
      <path d="M424 534q147-28 400-42m-419 53q184-33 419-43" fill="none" stroke="#ab8c61" strokeWidth="2" opacity=".56" />
      <ellipse cx="284" cy="432" rx="119" ry="26" fill="url(#v6c-seat-shadow)" />
      <g transform="translate(272 153)">
        <g className={swingMoving ? 'v6c-swing-seat is-moving' : 'v6c-swing-seat'}>
          <SwingRig anchors={[-23, 15]} />
        </g>
      </g>
      <path d="M121 447h54v5h-54zM135 451h26v57h-26Z" fill="#657267" stroke="#4c5b50" />
      <path d="M139 455h18v51h-18Z" fill="url(#v6c-etch)" opacity=".56" />
      <rect x="126" y="425" width="44" height="23" rx="3" fill="#50675b" stroke="#35473c" strokeWidth="1.5" />
      <ellipse cx="147" cy="433" rx="8" ry="5" fill="#b56c53" stroke="#e0b687" />
      <path d="M479 525q127-17 337-20l-3 7q-181 1-334 21Z" fill="#77866f" opacity=".47" />
    </svg>
  );
}

export function LeafDropRoute({ onNavigate, onActiveChange }: LeafDropRouteProps) {
  const root = useRef<HTMLElement>(null);
  const leafCardRef = useRef<HTMLDivElement>(null);
  const trayBedRef = useRef<HTMLDivElement>(null);
  const theaterRef = useRef<HTMLDivElement>(null);
  useObjectScale(theaterRef, 824, 650, 1.32);
  const demoDrawerRef = useRef<HTMLDetailsElement>(null);
  const dropTl = useRef<gsap.core.Timeline | null>(null);
  const directionTimer = useRef<number | undefined>(undefined);

  const { config, setField, isLeafDropPaused, leafDropPauseReason } = useDemoState();
  const { play } = useChime();
  const latestChime = useRef(play);

  const [step, setStep] = useState<StepNum>(1);
  const [trigger, setTrigger] = useState<TriggerMethod | null>(null);
  const [exception, setException] = useState<ExceptionKind | null>(null);
  const [dropPhase, setDropPhase] = useState<DropPhase>('signal');
  const [mechanicalFailure, setMechanicalFailure] = useState<MechanicalFailure>('zero');
  const [cardFlipBack, setCardFlipBack] = useState(false);
  const [showDirectionHint, setShowDirectionHint] = useState(false);

  const branchLit = step === 5 && !exception;
  const canTake = step === 6 && !exception;
  const trayOccupied = config.trayStatus === 'occupied';
  const trayLit = canTake || trayOccupied || exception === '07-leftover';
  const swingUnavailable = trigger === 'swing' && config.swingState !== 'available';
  const requestBlocker = isLeafDropPaused ? '02-paused' : config.deviceStatus === 'busy' ? '02-busy' : null;
  const noCard = config.stockStatus === 'empty';
  const releaseBlocker: ReleaseBlocker | null = requestBlocker
    ?? (noCard ? '02-empty' : swingUnavailable ? '03-04-unsafe' : null);
  const latestReleaseBlocker = useRef(releaseBlocker);

  useLayoutEffect(() => {
    latestChime.current = play;
    latestReleaseBlocker.current = releaseBlocker;
  }, [play, releaseBlocker]);

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
    setDropPhase('signal');
    setCardFlipBack(false);
    gsap.set(leafCardRef.current, { x: 0, y: 0, rotation: -14, scale: 0.48, autoAlpha: 0 });
  });

  const beginAcceptance = (directButton = false) => {
    if (step !== 1) return;
    play('tap');
    setTrigger(directButton ? 'button' : null);
    setException(null);
    setStep(2);
  };

  useEffect(() => {
    if (step !== 2 || exception) return;

    const timer = window.setTimeout(() => {
      if (requestBlocker || noCard) {
        latestChime.current('alert');
        setException(requestBlocker ?? '02-empty');
      } else {
        setStep(trigger === 'button' ? 4 : 3);
      }
    }, 340);

    return () => window.clearTimeout(timer);
  }, [exception, noCard, requestBlocker, step, trigger]);

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
    // Both anchors share the apparatus as their offset parent, so flight stays aligned on resize.
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
      const landingX = offTarget ? -149 : x;
      const landingAngle = offTarget ? -42 : -7;
      if (reduce) {
        timeline.set(leaf, {
          x: landingX, y, rotation: landingAngle, scale: .55,
          autoAlpha: offTarget ? .5 : 1,
        });
      } else {
        timeline
          .call(() => setDropPhase('release'), [], 0)
          .to(leaf, {
            motionPath: `M0,0 C-5,18 -87,${y * .17} -69,${y * .36} S${landingX + 35},${y * .65} ${landingX},${y}`,
            duration: 1.88, ease: 'sine.inOut',
          }, 0)
          .to(leaf, { autoAlpha: 1, scale: .66, rotation: -29, duration: .53, ease: 'power2.out' }, 0)
          .call(() => setDropPhase('drift'), [], .38)
          .to(leaf, { rotation: 18, scale: .72, duration: .71, ease: 'sine.inOut' }, .53)
          .to(leaf, {
            rotation: landingAngle, scale: .55,
            autoAlpha: offTarget ? .5 : 1, duration: .64, ease: 'sine.inOut',
          }, 1.24);
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
      data-trigger={trigger ?? undefined}
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
            <ActionNote title={swingUnavailable ? '秋千当前不可用' : '请等待停稳与落区清空'}>
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
              <p>{config.demoMode && mechanicalMessages[mechanicalFailure]} 发卡已暂停，<strong>不会自动补发</strong>，请等工作人员检查。</p>
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
            <ActionNote title={<>等一片叶，<br />从枝头落下</>}>
              <figure className="v6c-tribute">
                <img src={tributeCardFront} alt="" width={76} height={76} />
                <figcaption><strong>拾花一叶</strong><span>主题叶形纪念卡 · 演示设计</span></figcaption>
              </figure>
              <p>用秋千或屏幕旁的按键触发。等落区清空，枝头暖灯亮起，叶卡就会落入摆动区外侧的取卡盘。</p>
              <div className="v6c-btns">
                <button className="v6-btn-primary" onClick={() => beginAcceptance()}>领实体叶形明信片 →</button>
              </div>
            </ActionNote>
          )}

          {!exception && step === 2 && (
            <ActionNote title="正在确认本轮领卡">
              <p role="status">请稍候，正在准备叶形纪念卡。</p>
            </ActionNote>
          )}

          {!exception && step === 3 && (
            <ActionNote title="请选择触发方式">
              <p>两种方式都可领取「拾花一叶」主题叶形纪念卡。</p>
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

        <SeasonDisplay />
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

      <div className="v6c-theater" ref={theaterRef}>
        <div className="v6c-apparatus">
          <GardenIllustration swingMoving={step === 4 && trigger === 'swing' && !exception} />
          <div className={'v6c-branch-lamp' + (branchLit ? ' is-on' : '')} aria-hidden="true" />
          <span className="v6c-branch-label" aria-hidden="true">枝端预告灯</span>
          <span className="v6c-swing-label" aria-hidden="true">秋千摆动区</span>
          <span className="v6c-press-label" aria-hidden="true">实体按键</span>

          <div
            className={'v6c-tray' + (trayLit ? ' is-lit' : '') + (showDirectionHint ? ' is-pulse' : '')}
            ref={trayBedRef}
            aria-hidden="true"
          />
          <div className="v6c-leaf-card" ref={leafCardRef} aria-hidden={!canTake}>
            <img
              src={cardFlipBack ? tributeCardBack : tributeCardFront}
              alt={cardFlipBack ? '拾花一叶主题叶形纪念卡背面' : '拾花一叶主题叶形纪念卡正面'}
            />
          </div>
          {canTake && (
                <button
                  className="v6c-tray-action"
                  aria-label="取走明信片，确认取走这张叶形卡"
                  onClick={handlePickup}
                >
                  <span aria-hidden="true">↑</span> 取走明信片
                </button>
          )}
          {!canTake && (
            <span className="v6c-tray-label" aria-hidden="true">
              {trayLit ? '侧盘待清盘' : '侧边取卡盘'}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
