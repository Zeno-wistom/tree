import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { postOfficeCatalog, type PostcardItem, type RouteId } from '../data/catalog';
import { useDemoState } from '../hooks/useDemoState';
import { useChime } from '../hooks/useChime';
import { CanopyBranch, MacauTileBorder } from '../components/MacauOrnaments';
import './postoffice.css';

gsap.registerPlugin(useGSAP);

type PostStep = 'select' | 'compose' | 'seal' | 'receipt';
type DeliveryMethod = 'pickup' | 'mail';

interface PostOfficeRouteProps {
  initialPostcardId?: string;
  onNavigate: (route: RouteId) => void;
  onFormDirtyChange?: (dirty: boolean) => void;
}

const DATE_CHOICES = [
  { months: 1, label: '1 个月后' },
  { months: 6, label: '半年后' },
  { months: 12, label: '1 年后' },
];

function getDatePresets() {
  const today = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Macau', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
  const [year, month, day] = today.split('-').map(Number);

  return DATE_CHOICES.map(({ months, label }) => {
    const target = new Date(Date.UTC(year, month - 1 + months, 1));
    const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
    target.setUTCDate(Math.min(day, lastDay));
    return { months, label, date: target.toISOString().slice(0, 10) };
  });
}

const CATALOG_SERIES = [
  { id: 'school', name: '三校典藏' },
  { id: 'season', name: '四季限定' },
] as const;

const SIMULATED_RECIPIENT = '未来的自己（示例）';
const DELIVERY = {
  pickup: { label: '到期通知校内取件', handoff: '模拟校内取件柜' },
  mail: { label: '到期邮寄寄出', handoff: '虚构时光信箱' },
} satisfies Record<DeliveryMethod, { label: string; handoff: string }>;

const postalTileColors = { bg: '#465e6c', stroke: '#f6ecd7', accent: '#c39e6c' };

function PostcardIndex({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav className="v6d-index" aria-label="明信片款式">
      {CATALOG_SERIES.map((series) => (
        <fieldset key={series.id} className="v6d-index-series" data-series={series.id}>
          <legend>{series.name}</legend>
          <div>
            {postOfficeCatalog.filter((card) => card.series === series.id).map((card) => (
              <button
                key={card.id}
                type="button"
                aria-pressed={card.id === selectedId}
                onClick={() => onSelect(card.id)}
              >
                <span className="v6d-swatch" style={{ backgroundColor: card.accent }} aria-hidden="true" />
                {card.title}
              </button>
            ))}
          </div>
        </fieldset>
      ))}
    </nav>
  );
}

function PostalDesk({ children }: { children: ReactNode }) {
  return (
    <div className="v6d-desk">
      <CanopyBranch className="v6d-desk-canopy" leafTint="#505b3c" accentLeaf="#7d8052" />
      {children}
      <MacauTileBorder className="v6d-desk-tiles" {...postalTileColors} />
    </div>
  );
}

function PostcardDesk({
  card,
  flipped,
  onFlip,
  onBrowse,
}: {
  card: PostcardItem;
  flipped: boolean;
  onFlip: () => void;
  onBrowse: (offset: number) => void;
}) {
  const position = postOfficeCatalog.indexOf(card) + 1;
  const dragSurface = useRef<HTMLSpanElement>(null);
  const press = useRef<{ id: number; x: number } | null>(null);
  const skipClick = useRef(false);

  const startDrag = (event: PointerEvent<HTMLButtonElement>) => {
    if (!event.isPrimary || event.button !== 0) return;
    skipClick.current = false;
    press.current = { id: event.pointerId, x: event.clientX };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveCard = (event: PointerEvent<HTMLButtonElement>) => {
    const origin = press.current;
    if (origin?.id !== event.pointerId || !dragSurface.current) return;
    const distance = event.clientX - origin.x;
    if (Math.abs(distance) < 8 && !skipClick.current) return;
    skipClick.current = true;
    dragSurface.current.dataset.dragging = 'true';
    const shift = Math.max(-64, Math.min(64, distance * 0.56));
    dragSurface.current.style.setProperty('--swipe-x', `${shift}px`);
    dragSurface.current.style.setProperty('--swipe-tilt', `${shift / 16}deg`);
  };
  const finishDrag = (event: PointerEvent<HTMLButtonElement>) => {
    const origin = press.current;
    if (origin?.id !== event.pointerId) return;
    const distance = event.clientX - origin.x;
    if (event.type === 'pointerup') {
      if (Math.abs(distance) >= 50) {
        skipClick.current = true;
        onBrowse(distance < 0 ? 1 : -1);
      } else if (event.pointerType === 'touch' && !skipClick.current && Math.abs(distance) < 8) {
        // Touch capture can suppress the browser's click. Flip on release and ignore a follow-up click.
        skipClick.current = true;
        onFlip();
      }
    }
    press.current = null;
    dragSurface.current?.removeAttribute('data-dragging');
    dragSurface.current?.style.removeProperty('--swipe-x');
    dragSurface.current?.style.removeProperty('--swipe-tilt');
  };

  return (
    <PostalDesk>
      <div className="v6d-desk-note">
        <span className="v6d-swatch" style={{ backgroundColor: card.accent }} aria-hidden="true" />
        <strong>{card.subtitle}</strong>
      </div>
      <div className="v6d-postmark" aria-hidden="true">
        <span>德智广场</span><span>MACAU</span>
      </div>
      <div className="v6d-pickup">
        <div className="v6d-card-stack" data-series={card.series}>
          <button
            type="button"
            className="v6d-flip-card"
            aria-label={`翻到${flipped ? '正面' : '背面'}`}
            onPointerDown={startDrag}
            onPointerMove={moveCard}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
            onLostPointerCapture={finishDrag}
            onClick={(event) => {
              if (event.detail === 0 || !skipClick.current) onFlip();
            }}
          >
            <span className="v6d-card-drag" ref={dragSurface}>
              <span key={card.id} className="v6d-card-motion">
                <span className="v6d-card-turn" data-flipped={flipped}>
                  <img src={card.frontImage} alt="" aria-hidden="true" />
                  <img src={card.backImage} alt="" aria-hidden="true" />
                </span>
              </span>
            </span>
          </button>
        </div>
        <span className="v6d-flip-hint">轻触翻面 · 左右滑动换一张</span>
      </div>
      <div className="v6d-desk-foot">
        <strong aria-live="polite">{card.title}</strong>
        <div className="v6d-browse-controls">
          <button type="button" onClick={() => onBrowse(-1)} aria-label="上一张明信片">←</button>
          <span aria-label={`第 ${position} 张，共 ${postOfficeCatalog.length} 张`}>
            {String(position).padStart(2, '0')} / {String(postOfficeCatalog.length).padStart(2, '0')}
          </span>
          <button type="button" onClick={() => onBrowse(1)} aria-label="下一张明信片">→</button>
        </div>
      </div>
    </PostalDesk>
  );
}

export function PostOfficeRoute({
  initialPostcardId,
  onNavigate,
  onFormDirtyChange,
}: PostOfficeRouteProps) {
  const root = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const messageField = useRef<HTMLTextAreaElement>(null);
  const sealCardRef = useRef<HTMLDivElement>(null);
  const sealFlapRef = useRef<HTMLDivElement>(null);
  const sealStampRef = useRef<HTMLDivElement>(null);
  const sealTl = useRef<gsap.core.Timeline | null>(null);

  const { config } = useDemoState();
  const { play } = useChime();

  const [allowClosedDemo, setAllowClosedDemo] = useState(false);
  const [closedSelfKeepMode, setClosedSelfKeepMode] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [selfKeepFlip, setSelfKeepFlip] = useState(false);

  const [step, setStep] = useState<PostStep>('select');
  const [selectedId, setSelectedId] = useState<string>(
    initialPostcardId && postOfficeCatalog.some((p) => p.id === initialPostcardId)
      ? initialPostcardId
      : postOfficeCatalog[0].id
  );
  const [datePresets, setDatePresets] = useState(getDatePresets);
  const [deliveryDate, setDeliveryDate] = useState(datePresets[1].date);
  const [method, setMethod] = useState<DeliveryMethod>('pickup');
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [sealing, setSealing] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const selectedCard = postOfficeCatalog.find((card) => card.id === selectedId) ?? postOfficeCatalog[0];
  const delivery = DELIVERY[method];
  const isClosed = !config.postOfficeOpen && !allowClosedDemo;
  const previousView = useRef({ step, allowClosedDemo });
  const hasMessage = message.trim().length > 0;
  const isDirty = (step === 'compose' || step === 'seal') && hasMessage;

  useEffect(() => {
    onFormDirtyChange?.(isDirty);
    return () => onFormDirtyChange?.(false);
  }, [isDirty, onFormDirtyChange]);

  useEffect(() => {
    if (previousView.current.step !== step || previousView.current.allowClosedDemo !== allowClosedDemo) {
      heading.current?.focus({ preventScroll: true });
      previousView.current = { step, allowClosedDemo };
    }
  }, [step, allowClosedDemo]);

  const { contextSafe } = useGSAP(
    () => {
      const syncVisibility = () => sealTl.current?.paused(document.hidden);
      document.addEventListener('visibilitychange', syncVisibility);
      return () => {
        document.removeEventListener('visibilitychange', syncVisibility);
        sealTl.current?.kill();
      };
    },
    { scope: root }
  );

  useEffect(() => {
    if (isClosed && sealing) {
      sealTl.current?.kill();
      setSealing(false);
    }
  }, [isClosed, sealing]);

  const selectCard = (id: string) => {
    if (id === selectedId) return;
    play('tap');
    setSelectedId(id);
    setFlipped(false);
    setSelfKeepFlip(false);
  };

  const browseCards = (offset: number) => {
    const count = postOfficeCatalog.length;
    const next = (postOfficeCatalog.indexOf(selectedCard) + offset + count) % count;
    selectCard(postOfficeCatalog[next].id);
  };

  const flipCard = () => {
    play('tap');
    if (isClosed) {
      setSelfKeepFlip((value) => !value);
    } else {
      setFlipped((value) => !value);
    }
  };

  const runSealCeremony = contextSafe(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = (seconds: number) => (reduce ? 0.03 : seconds);
    setSealing(true);
    play('envelope');
    sealTl.current?.kill();

    const timeline = gsap.timeline({
      paused: document.hidden,
      onComplete: () => {
        setSealing(false);
        setStep('receipt');
      },
    });
    sealTl.current = timeline;
    timeline
      .set(sealCardRef.current, { y: -145, scale: 0.94 })
      .set(sealFlapRef.current, { rotateX: -166, zIndex: 1 })
      .set(sealStampRef.current, { autoAlpha: 0, scale: 1.2, y: -16, rotation: -9 })
      .to(sealCardRef.current, { y: 4, scale: 0.8, duration: duration(0.62), ease: 'power3.inOut' })
      .to(sealFlapRef.current, { rotateX: 0, duration: duration(0.48), ease: 'power2.inOut' })
      .set(sealFlapRef.current, { zIndex: 4 }, '<50%')
      .to(sealStampRef.current, { autoAlpha: 1, scale: 1, y: 0, rotation: -8, duration: duration(0.24), ease: 'power3.in' })
      .call(() => play('stamp'))
      .to(sealStampRef.current, { scale: 0.97, duration: duration(0.09), ease: 'power1.out' })
      .to(sealStampRef.current, { scale: 1, duration: duration(0.12), ease: 'power1.out' });
  });

  const handleProceedToSeal = () => {
    if (!hasMessage) {
      setFormError('请在明信片背面写一句寄语，再进入封袋核对。');
      play('alert');
      messageField.current?.focus();
      return;
    }
    setFormError(null);
    play('tap');
    setStep('seal');
  };

  const resetPostOffice = () => {
    setStep('select');
    setFlipped(false);
    const nextDates = getDatePresets();
    setDatePresets(nextDates);
    setDeliveryDate(nextDates[1].date);
    setMethod('pickup');
    setMessage('');
    setFormError(null);
    setShowHelpModal(false);
  };

  if (isClosed) {
    return (
      <section className="v6d v6d--closed" ref={root} aria-label="D 时光邮局（暂未开放）">
        <div className="v6d-layout">
          <div className="v6d-copy">
            <p className="v6d-kicker">时光邮局 <span>·</span> 服务暂停</p>
            <h1 ref={heading} tabIndex={-1}>时光邮局当前未开放寄送</h1>
            <p className="v6d-intro">当前暂停人工收件与封袋交接。你可以翻阅自留卡，或继续体验寄送演示。</p>
            <div className="v6d-closed-actions">
              <button
                className="v6-btn-primary"
                onClick={() => {
                  play('tap');
                  setAllowClosedDemo(true);
                }}
              >
                观看并体验演示流程 →
              </button>
              <button
                className="v6-btn-text"
                aria-expanded={closedSelfKeepMode}
                aria-controls="v6d-selfkeep-index"
                onClick={() => {
                  play('tap');
                  setClosedSelfKeepMode((value) => !value);
                }}
              >
                {closedSelfKeepMode ? '收起自留卡翻阅' : '翻看自留卡（7 款明信片）'}
              </button>
            </div>
            <div id="v6d-selfkeep-index" hidden={!closedSelfKeepMode}>
              <PostcardIndex selectedId={selectedId} onSelect={selectCard} />
            </div>
            <button className="v6-btn-text v6d-back-link" onClick={() => onNavigate('home')}>
              ← 返回德智树下总览
            </button>
          </div>
          <PostcardDesk card={selectedCard} flipped={selfKeepFlip} onFlip={flipCard} onBrowse={browseCards} />
        </div>
      </section>
    );
  }

  return (
    <section className="v6d" ref={root} data-step={step} aria-label="D 时光邮局">
      {step === 'select' && (
        <div className="v6d-layout">
          <div className="v6d-copy">
            <p className="v6d-kicker">时光邮局 <span>·</span> 选卡</p>
            <h1 ref={heading} tabIndex={-1}>挑选一张明信片</h1>
            <p className="v6d-intro">从三校与四季花叶里选一张，写给未来的自己。</p>
            <PostcardIndex selectedId={selectedId} onSelect={selectCard} />
            <div className="v6d-actions">
              <button
                className="v6-btn-primary"
                onClick={() => {
                  play('tap');
                  setStep('compose');
                }}
              >
                选定这张，开始写信 →
              </button>
              <button className="v6-btn-text" onClick={() => onNavigate('home')}>
                ← 返回树下总览
              </button>
            </div>
            <p className="v6d-demo-note">两种寄送方式均为模拟。</p>
          </div>
          <PostcardDesk card={selectedCard} flipped={flipped} onFlip={flipCard} onBrowse={browseCards} />
        </div>
      )}

      {step === 'compose' && (
        <div className="v6d-layout v6d-layout--wide v6d-compose-layout">
          <div className="v6d-copy">
            <p className="v6d-kicker">时光邮局 <span>·</span> 落笔</p>
            <h1 ref={heading} tabIndex={-1}>写下给未来的话</h1>
            <div className="v6d-form">
              <fieldset className="v6d-field-row">
                <legend>选择未来寄达日期</legend>
                <div className="v6d-pills v6d-pills--dates">
                  {datePresets.map((preset) => (
                    <button
                      key={preset.months}
                      type="button"
                      aria-pressed={deliveryDate === preset.date}
                      onClick={() => setDeliveryDate(preset.date)}
                    >
                      <span>{preset.label}</span>
                      <small>{preset.date}</small>
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="v6d-field-row">
                <legend>寄送方式（演示）</legend>
                <div className="v6d-pills">
                  {(['pickup', 'mail'] as const).map((option) => (
                    <button key={option} type="button" aria-pressed={method === option} onClick={() => setMethod(option)}>
                      {DELIVERY[option].label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <dl className="v6d-handoff" aria-label="模拟交接信息">
                <div><dt>收件人</dt><dd>{SIMULATED_RECIPIENT}</dd></div>
                <div><dt>交接地点</dt><dd>{delivery.handoff}</dd></div>
              </dl>
              <p id="v6d-writing-note" className="v6d-writing-note">寄语请勿填写真实姓名、地址或联系方式。</p>

              {!hasMessage && formError && <p className="v6d-error" role="alert">{formError}</p>}
            </div>
          </div>
          <PostalDesk>
            <div className="v6d-desk-note">
              <span>在明信片背面落笔</span>
              <strong>{selectedCard.title}</strong>
            </div>
            <div className="v6d-back-frame" data-series={selectedCard.series}>
              <img src={selectedCard.backImage} alt={`${selectedCard.title} 背面实时预览`} />
              <textarea
                ref={messageField}
                className="v6d-live-msg"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="记下今天在德智广场的心情、愿望或想提醒未来自己的一句话…"
                aria-label="写给未来的自己"
                aria-describedby="v6d-writing-note v6d-message-hint"
                maxLength={120}
                required
              />
              <span id="v6d-message-hint" className="v6d-message-count">{message.length} / 120 字</span>
              <div className="v6d-live-recipient" aria-hidden="true">{SIMULATED_RECIPIENT}</div>
              <div className="v6d-live-address" aria-hidden="true">{delivery.handoff}</div>
            </div>
          </PostalDesk>
          <div className="v6d-actions v6d-compose-actions">
            <button className="v6-btn-primary" onClick={handleProceedToSeal}>
              核对信息，准备装入专用封袋 →
            </button>
            <button className="v6-btn-text" onClick={() => setStep('select')}>
              ← 更换明信片
            </button>
          </div>
        </div>
      )}

      {step === 'seal' && (
        <div className="v6d-layout v6d-layout--wide">
          <div className="v6d-copy">
            <p className="v6d-kicker">时光邮局 <span>·</span> 封存</p>
            <h1 ref={heading} tabIndex={-1}>核对必要信息与交接确认</h1>
            <dl className="v6d-summary">
              <div><dt>所选明信片</dt><dd>{selectedCard.title}</dd></div>
              <div><dt>寄达日期</dt><dd>{deliveryDate}</dd></div>
              <div><dt>寄送方式</dt><dd>{delivery.label}（演示）</dd></div>
              <div><dt>收件人</dt><dd>{SIMULATED_RECIPIENT}</dd></div>
              <div><dt>交接地点</dt><dd>{delivery.handoff}</dd></div>
              <div><dt>寄语内容</dt><dd>{message}</dd></div>
            </dl>
            <p className="v6d-policy-note">
              核对完日期和寄语后，即可模拟装袋、封口和盖章。
            </p>
            <div className="v6d-actions">
              <button className="v6-btn-primary" disabled={sealing} onClick={runSealCeremony}>
                {sealing ? '正在装袋封口并盖章…' : '确认装入专用封袋并盖章 →'}
              </button>
              <button className="v6-btn-text" disabled={sealing} onClick={() => setStep('compose')}>
                ← 返回修改
              </button>
            </div>
            <button
              className="v6-btn-text v6d-help-toggle"
              aria-expanded={showHelpModal}
              aria-controls="v6d-help"
              onClick={() => setShowHelpModal((value) => !value)}
            >
              未确认交接？查看求助指引
            </button>
            <div id="v6d-help" role="status" className="v6d-help-box" hidden={!showHelpModal}>
              如需了解现场寄送与交接，请咨询德智广场值班人员。
            </div>
          </div>

          <PostalDesk>
            <div className="v6d-desk-note">
              <span>专用封袋</span>
              <strong>{selectedCard.title}</strong>
            </div>
            <div className="v6d-special-env">
              <div className="v6d-env-back" />
              <div className="v6d-env-flap" ref={sealFlapRef} />
              <div className="v6d-env-card" data-series={selectedCard.series} ref={sealCardRef}>
                <img src={selectedCard.frontImage} alt={selectedCard.title} />
              </div>
              <div className="v6d-env-front">
                <MacauTileBorder className="v6d-env-tile" {...postalTileColors} accent={selectedCard.accent} />
                <span>德智广场 · 时光邮局专用封袋</span>
              </div>
              <div className="v6d-stamp v6d-env-stamp" ref={sealStampRef}>
                时光封存 <span>{deliveryDate}</span>
              </div>
            </div>
          </PostalDesk>
        </div>
      )}

      {step === 'receipt' && (
        <div className="v6d-layout">
          <div className="v6d-copy">
            <p className="v6d-kicker">时光邮局 <span>·</span> 回执</p>
            <h1 ref={heading} tabIndex={-1}>已封存写给未来的这封信</h1>
            <p className="v6d-intro">收好回执，记住你和未来约定的日子。</p>
            <p className="v6d-policy-note">
              这是模拟交接回执。寄语只在本次体验中显示，退出或刷新后清空。
            </p>
            <div className="v6d-receipt-actions">
              <button className="v6-btn-primary" onClick={() => onNavigate('home')}>
                完成体验，返回德智树下 →
              </button>
              <div className="v6d-actions">
                <button className="v6-btn-text" onClick={resetPostOffice}>再写一张明信片</button>
                <button className="v6-btn-text" onClick={() => onNavigate('leaf-drop')}>去领实体叶形卡（C）</button>
              </div>
            </div>
          </div>
          <PostalDesk>
            <article className="v6d-receipt-paper">
              <p className="v6d-receipt-no">NO. DZ-2026-DEMO</p>
              <h2>时光邮局 · 交接演示回执</h2>
              <dl className="v6d-receipt-details">
                <div><dt>明信片</dt><dd>{selectedCard.title}</dd></div>
                <div><dt>约定日期</dt><dd>{deliveryDate}</dd></div>
                <div><dt>方式</dt><dd>{delivery.label}（演示）</dd></div>
                <div><dt>交接地点</dt><dd>{delivery.handoff}</dd></div>
              </dl>
              <div className="v6d-stamp v6d-receipt-stamp" aria-hidden="true">
                时光封存 <span>{deliveryDate}</span>
              </div>
              <MacauTileBorder className="v6d-receipt-tile" {...postalTileColors} accent={selectedCard.accent} />
            </article>
          </PostalDesk>
        </div>
      )}
    </section>
  );
}
