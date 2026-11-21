import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { seasonLeaves, seasonOrder, type RouteId, type SeasonId } from '../data/catalog';
import { useDemoState } from '../hooks/useDemoState';
import { useChime } from '../hooks/useChime';
import { CanopyBranch, MacauTileBorder } from '../components/MacauOrnaments';
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

const stepLabels = ['领取意图', '请求受理', '选择触发', '等待停稳', '枝头飘落', '落盘取卡', '取走复位'];

const flightInstructions: Record<DropPhase, [string, string]> = {
  signal: ['请看向亮灯的树枝', '枝端暖灯亮起。请停在原处，等叶片落入侧盘。'],
  release: ['叶片离开枝头', '请保持停稳，等侧边取卡盘亮起。'],
  drift: ['让叶片飘一会儿', '等叶片落稳、侧盘灯亮后，再沿外侧取卡。'],
};

const mechanicalMessages: Record<MechanicalFailure, string> = {
  zero: '出口未确认过卡（零张）。',
  jam: '检测到出卡机构卡滞。',
  double: '检测到疑似同时释出两张卡片。',
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

export function LeafDropRoute({ onNavigate, onActiveChange }: LeafDropRouteProps) {
  const root = useRef<HTMLElement>(null);
  const leafCardRef = useRef<HTMLDivElement>(null);
  const trayBedRef = useRef<HTMLDivElement>(null);
  const dropTl = useRef<gsap.core.Timeline | null>(null);
  const directionTimer = useRef<number | undefined>(undefined);

  const { config, setField, isLeafDropPaused, leafDropPauseReason } = useDemoState();
  const { play } = useChime();

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
  const trayLit = canTake || exception === '07-leftover';

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
    play('tap');
    setException(null);
    setNeedsAltConfirm(false);
    setStep(2);

    if (isLeafDropPaused) {
      play('alert');
      setException('02-paused');
      return;
    }
    if (config.deviceStatus === 'busy') {
      play('alert');
      setException('02-busy');
      return;
    }
    if (config.stockStatus === 'all_empty') {
      play('alert');
      setException('02-empty');
      return;
    }
    if (config.stockStatus === 'current_empty') {
      setNeedsAltConfirm(true);
      return;
    }

    setActiveSeason(config.season);
    if (directButton) {
      setTrigger('button');
      setStep(4);
    } else {
      setStep(3);
    }
  };

  const confirmAlternativeCard = () => {
    play('tap');
    setActiveSeason(altSeason);
    setNeedsAltConfirm(false);
    setStep(3);
  };

  const chooseTrigger = (method: TriggerMethod) => {
    play('tap');
    setException(null);
    setTrigger(method);
    setStep(4);
  };

  const launchLeafDrop = contextSafe(() => {
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
    const timeline = gsap.timeline({ paused: document.hidden });
    dropTl.current = timeline;
    timeline
      .set(leaf, { x: 0, y: 0, rotation: -14, scale: 0.48, autoAlpha: 0 })
      .addLabel('release', reduce ? 0.05 : 0.85);

    if (outcome === 'zero' || outcome === 'jam' || outcome === 'double') {
      timeline
        .to(leaf, {
          y: outcome === 'zero' || reduce ? 0 : 20,
          rotation: -14,
          autoAlpha: outcome === 'zero' ? 0 : 1,
          duration: reduce ? 0.05 : 0.55,
          ease: 'power1.out',
        }, 'release')
        .call(() => {
          play('alert');
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
      }, 'release');
    } else {
      timeline
        .call(() => setDropPhase('release'), [], 'release')
        .to(leaf, { autoAlpha: 1, y: 19, scale: 0.65, duration: 0.38, ease: 'power2.out' }, 'release')
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
        setException('06-off-target');
        play('alert');
      } else {
        play('landed');
      }
    });
  });

  const handlePickup = contextSafe(() => {
    clearDirectionHint();
    play('stamp');
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
    setStep(7);
    setException('07-leftover');
  };

  const handleStaffClearTray = () => {
    play('tap');
    setField('trayStatus', 'empty');
    setField('deviceStatus', 'ready');
    setField('dropOutcome', 'normal');
    resetRound();
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
            <ActionNote title="检测到秋千未停稳或有人进入落区">
              <p>请等秋千完全停稳，确认落区无人后再继续。也可改到屏幕旁，用实体按键触发。</p>
              <div className="v6c-btns">
                <button className="v6-btn-primary" onClick={launchLeafDrop}>已确认停稳与落区清空，继续放行 →</button>
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
                {config.demoMode && (
                  <button className="v6c-demo-action" onClick={handleStaffClearTray}>[演示] 工作人员检查并复位</button>
                )}
              </div>
            </ActionNote>
          )}

          {exception === '06-off-target' && (
            <ActionNote title="卡片未到，请等工作人员">
              <p>请留在摆动区外侧，由工作人员确认卡片的落点。</p>
              <div className="v6c-btns">
                <button className="v6-btn-primary" onClick={() => onNavigate('home')}>返回树下总览</button>
                {config.demoMode && (
                  <button className="v6c-demo-action" onClick={handleStaffClearTray}>[演示] 工作人员确认并清盘恢复</button>
                )}
              </div>
            </ActionNote>
          )}

          {exception === '07-leftover' && (
            <ActionNote title="本轮结束 · 侧盘待清盘">
              <p>侧盘灯会继续亮着。工作人员取走余卡后，即可开放下一轮。</p>
              <div className="v6c-btns">
                <button className="v6-btn-primary" onClick={() => onNavigate('home')}>返回德智树下总览</button>
                {config.demoMode && (
                  <button className="v6c-demo-action" onClick={handleStaffClearTray}>[演示] 模拟工作人员清盘并恢复</button>
                )}
              </div>
            </ActionNote>
          )}

          {!exception && step === 1 && (
            <ActionNote title={<>树枝会飘下<span className="v6c-title-phrase">一张叶形明信片</span></>}>
              <p>枝头亮起暖金灯时，留在原处等一等。你的明信片会飘进摆动区外侧的取卡盘。</p>
              <div className="v6c-specimen">
                <img src={card.frontImage} alt="" />
                <div>
                  <strong>{card.label} · {card.variety}</strong>
                  <p>{card.poeticLine}</p>
                </div>
              </div>
              <div className="v6c-btns">
                <button className="v6-btn-primary" onClick={() => beginAcceptance()}>领实体叶形明信片 →</button>
                {config.demoMode && (
                  <button className="v6c-demo-action" onClick={() => beginAcceptance(true)}>[演示] 直接按实体按键领卡</button>
                )}
              </div>
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
                {config.demoMode && (
                  <button
                    className="v6c-demo-action"
                    onClick={() => {
                      play('alert');
                      setException('03-04-unsafe');
                    }}
                  >
                    [演示异常] 模拟未停稳 / 有人进入落区
                  </button>
                )}
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
                <button className="v6-btn-text" onClick={handleSkipOrTimeout}>
                  {config.demoMode ? '跳过 / 不愿取（模拟遗留）' : '本轮不取卡'}
                </button>
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
          <span>硬件演示 · 发卡装置未连接</span>
          {config.demoMode && (
            <ol className="v6c-stepper" aria-label="实体领卡七步流程">
              {stepLabels.map((label, index) => (
                <li key={label} title={label} aria-label={label} aria-current={index + 1 === step ? 'step' : undefined}>
                  0{index + 1}
                </li>
              ))}
            </ol>
          )}
        </footer>
      </div>

      <div className="v6c-theater">
        <div className="v6c-ground" aria-hidden="true" />
        <div className="v6c-canopy-box" aria-hidden="true">
          <CanopyBranch leafTint="#566d4e" accentLeaf="#9fae7c" />
        </div>
        <div className={'v6c-branch-lamp' + (branchLit ? ' is-on' : '')} aria-hidden="true" />
        <span className="v6c-branch-label" aria-hidden="true">枝端预告灯</span>

        <div className="v6c-swing-zone" aria-hidden="true">
          <div className="v6c-swing" />
          <span>秋千摆动区</span>
        </div>
        <div className="v6c-path" aria-hidden="true" />

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
            {exception === '07-leftover' ? '侧盘待清盘' : '侧边取卡盘'}
          </span>
        )}

        <MacauTileBorder className="v6c-theater-tile" bg={card.tileBg} stroke="#FAF5E8" accent="#EFE5A8" />
      </div>
    </section>
  );
}
