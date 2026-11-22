import { useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { flushSync } from 'react-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import {
  dateLabel, events, getSchool, schools, timeLabel,
  type CampusEvent, type RouteId, type SchoolId,
} from '../data/catalog';
import { useChime } from '../hooks/useChime';
import { MacauTileBorder, MacauTileDiamond } from '../components/MacauOrnaments';
import { HomeHub } from './HomeHub';
import './explore.css';

gsap.registerPlugin(useGSAP);

type Phase = 'IDLE' | 'OPENING' | 'DISCOVER' | 'POSTCARD' | 'COMPLETE' | 'RETURNING';
type Filter = { school: 'all' | SchoolId; batch: number };

const FIRST: Filter = { school: 'all', batch: 0 };
const PAGE_SIZE = 3;
const DOCK = 413;
const READING_DOCK = 636;
const CARD_HEIGHT = 254 * 1091 / 774;
const HOME_POSE = { x: 306, y: 187, scale: 0.665, rotation: -7 };
const CARD_REST = { x: 0, y: 180, rotation: 0, scale: 1, autoAlpha: 0 };
const SHELL = '.v6a-envelope-shadow, .v6a-envelope-back, .v6a-envelope-lining, .v6a-pocket';
const OVERLAYS = '.v6a-discover-ui, .v6a-reading-ui, .v6a-collection';

interface ExploreRouteProps {
  atHome: boolean;
  collected: ReadonlySet<string>;
  onCollect: (id: string) => void;
  onNavigate: (route: RouteId, opts?: { postcardId?: string }) => void;
  onActivity?: () => void;
}

function fanPose(index: number, count: number, lifted = false) {
  const offset = index - (count - 1) / 2;
  return {
    x: offset * 267,
    y: -322 + Math.abs(offset) * 24 - (lifted ? 18 : 0),
    rotation: offset * 9 + (lifted ? offset * -3 : 0),
    scale: lifted ? 1.04 : 1,
  };
}

function EventCard({ item, selected, front, clickable, collected, onHover, onRead, onTilt, onRest }: {
  item: CampusEvent;
  selected: boolean;
  front: boolean;
  clickable: boolean;
  collected: boolean;
  onHover: (id: string | null) => void;
  onRead: () => void;
  onTilt: (event: PointerEvent<HTMLButtonElement>) => void;
  onRest: () => void;
}) {
  const school = getSchool(item.schoolId);
  const bodyId = `v6a-body-${item.id}`;
  return (
    <div className="v6a-event" data-event={item.id} style={{ '--card-ink': school.ink } as CSSProperties}>
      <div className="v6a-card-tilt">
        <div className="v6a-card-turn">
          <div className="v6a-card-face v6a-card-writing" aria-hidden={!selected || front}>
            <img src={school.backImage} alt="" draggable={false} />
            <div className="v6a-card-stamp" aria-hidden="true"><MacauTileDiamond primary={school.ink} secondary={school.accent} /></div>
            <div className="v6a-card-print" id={bodyId}>
              <small>非官方演示活动</small>
              <h2>{item.title}</h2>
              <p className="v6a-card-date">{dateLabel(item)} · {timeLabel(item)}</p>
              {item.description.split('\n').map((line) => <p key={line}>{line}</p>)}
            </div>
            <p className="v6a-card-location">{item.location}</p>
          </div>
          <div className="v6a-card-face v6a-card-art" aria-hidden={!selected || !front}>
            <img src={school.frontImage} alt={`${school.name} · ${school.flower}明信片正面`} draggable={false} />
          </div>
        </div>
        <span className="v6a-card-light" aria-hidden="true" />
      </div>
      <button
        type="button"
        className="v6a-event-hit"
        aria-label={selected ? (front ? '明信片正面，翻回背面' : '明信片背面，翻到正面') : `${item.title}，${school.name}，${dateLabel(item)}${collected ? '，已数字收藏' : ''}`}
        aria-describedby={selected && !front ? bodyId : undefined}
        disabled={!clickable}
        onClick={onRead}
        onPointerEnter={(event) => { if (event.pointerType === 'mouse' && !selected) onHover(item.id); }}
        onPointerMove={selected ? onTilt : undefined}
        onPointerLeave={(event) => {
          if (selected) onRest();
          else if (event.pointerType === 'mouse') onHover(null);
        }}
      />
    </div>
  );
}

export function ExploreRoute({ atHome, collected, onCollect, onNavigate, onActivity }: ExploreRouteProps) {
  const root = useRef<HTMLElement>(null);
  const envelope = useRef<HTMLDivElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const hoverTweens = useRef<gsap.core.Tween[]>([]);
  const tilt = useRef<{ x: ReturnType<typeof gsap.quickTo>; y: ReturnType<typeof gsap.quickTo> } | null>(null);
  const phaseRef = useRef<Phase>('IDLE');
  const busyRef = useRef(false);
  const pendingFilter = useRef<Filter | null>(null);
  const reduce = useRef(window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const [phase, setPhase] = useState<Phase>('IDLE');
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<Filter>(FIRST);
  const [current, setCurrent] = useState<CampusEvent | null>(null);
  const [front, setFront] = useState(false);
  const { play } = useChime();

  const availableFor = ({ school }: Filter) => events.filter(
    (item) => item.status !== 'ended' && (school === 'all' || item.schoolId === school)
  );
  const available = availableFor(filter);
  const shown = available.slice(filter.batch * PAGE_SIZE, (filter.batch + 1) * PAGE_SIZE);
  const currentSchool = current ? getSchool(current.schoolId) : null;

  const find = (selector: string) => root.current?.querySelector<HTMLElement>(selector) ?? null;
  const findAll = (selector: string) => Array.from(root.current?.querySelectorAll<HTMLElement>(selector) ?? []);
  const cards = () => findAll('.v6a-event');
  const cardNode = (id: string) => find(`[data-event="${id}"]`);
  const focus = (selector: string) => requestAnimationFrame(() => find(selector)?.focus({ preventScroll: true }));
  const setScene = (value: Phase) => { phaseRef.current = value; setPhase(value); };
  const setAnimating = (value: boolean) => { busyRef.current = value; setBusy(value); };
  const stopHover = () => { hoverTweens.current.forEach((tween) => tween.kill()); hoverTweens.current = []; };
  const stopTilt = () => {
    tilt.current?.x.tween.kill();
    tilt.current?.y.tween.kill();
    tilt.current = null;
    gsap.set(findAll('.v6a-card-tilt'), { rotateX: 0, rotateY: 0 });
  };

  const restore = () => {
    pendingFilter.current = null;
    setFilter(FIRST);
    setCurrent(null);
    setFront(false);
    gsap.set(envelope.current, { ...HOME_POSE, autoAlpha: 1 });
    gsap.set(find('.v6a-envelope-flap'), { rotateX: 0, zIndex: 9, autoAlpha: 1 });
    gsap.set(find('.v6a-seal'), { x: 0, y: 0, rotate: 0, autoAlpha: 1 });
    gsap.set(find('.v6a-seal-leaf'), { rotateX: 0 });
    gsap.set(findAll('.v6-home, .v6a-open-hint'), { autoAlpha: 1 });
    gsap.set(findAll('.v6a-card-turn'), { rotateY: 0 });
    gsap.set(cards(), CARD_REST);
    gsap.set(findAll(SHELL), { y: 0, autoAlpha: 1 });
    gsap.set(findAll(OVERLAYS), { autoAlpha: 0 });
    setAnimating(false);
    setScene('IDLE');
  };

  useGSAP(() => {
    gsap.set(envelope.current, HOME_POSE);
    gsap.set(find('.v6-home'), { autoAlpha: atHome ? 1 : 0 });
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onReduce = () => {
      reduce.current = media.matches;
      if (media.matches && timeline.current?.isActive()) {
        const active = timeline.current;
        active.progress(active.reversed() ? 0 : 1);
      }
      if (media.matches) stopTilt();
    };
    const onVisibility = () => timeline.current?.paused(document.hidden);
    media.addEventListener('change', onReduce);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      media.removeEventListener('change', onReduce);
      document.removeEventListener('visibilitychange', onVisibility);
      timeline.current?.kill();
      stopHover();
      stopTilt();
    };
  }, { scope: root });

  const nextTimeline = (onDone: () => void) => {
    timeline.current?.kill();
    stopHover();
    stopTilt();
    setAnimating(true);
    const next = gsap.timeline({
      paused: document.hidden,
      onComplete: () => { setAnimating(false); onActivity?.(); onDone(); },
    });
    timeline.current = next;
    if (reduce.current) next.timeScale(100);
    return next;
  };

  useLayoutEffect(() => {
    if (!atHome || phaseRef.current === 'IDLE') return;
    if (phaseRef.current === 'OPENING' && timeline.current?.progress() && !reduce.current) {
      const opening = timeline.current;
      opening.timeScale(1.65).reverse();
      return;
    }
    if (reduce.current || phaseRef.current === 'OPENING') {
      timeline.current?.kill();
      stopHover();
      stopTilt();
      restore();
      return;
    }

    setScene('RETURNING');
    const lid = find('.v6a-envelope-flap');
    const seal = find('.v6a-seal');
    const clearScene = findAll(OVERLAYS);
    const next = nextTimeline(() => { restore(); focus('.v6a-open'); });

    if (Number(gsap.getProperty(find('.v6a-pocket'), 'opacity')) < .5) {
      next
        .to(clearScene.concat(cards()), { autoAlpha: 0, duration: .26, ease: 'sine.inOut' })
        .set(envelope.current, { ...HOME_POSE, autoAlpha: 0 })
        .set(findAll(SHELL), { y: 0, autoAlpha: 1 })
        .set(lid, { rotateX: 0, zIndex: 9, autoAlpha: 1 })
        .set(seal, { x: 0, y: 0, rotate: 0, autoAlpha: 1 })
        .set(find('.v6a-seal-leaf'), { rotateX: 0 })
        .to(findAll('.v6-home, .v6a-open-hint, .v6a-envelope'), { autoAlpha: 1, duration: .32 });
      return;
    }

    // Return without remounting the letter. The pocket shields the tucked cards.
    next
      .to(clearScene, { autoAlpha: 0, duration: .21 }, 0)
      .to(cards(), { x: 0, y: 143, scale: .92, rotation: 0, autoAlpha: 0, duration: .43, ease: 'power2.in' }, 0)
      .to(findAll(SHELL), { y: 0, autoAlpha: 1, duration: .2 }, 0)
      .to(lid, { autoAlpha: 1, rotateX: 90, duration: .26, ease: 'sine.in' }, .18)
      .set(lid, { zIndex: 9 }, .44)
      .to(lid, { rotateX: 0, duration: .28, ease: 'sine.out' }, .44)
      .set(seal, { x: -8, y: -24, rotate: -7 }, .63)
      .to(seal, { x: 0, y: 0, rotate: 0, autoAlpha: 1, duration: .23, ease: 'power2.out' }, .63)
      .to(find('.v6a-seal-leaf'), { rotateX: 0, duration: .23 }, .63)
      .to(envelope.current, { ...HOME_POSE, duration: .73, ease: 'sine.inOut' }, .35)
      .to(findAll('.v6-home, .v6a-open-hint'), { autoAlpha: 1, duration: .42 }, .65);
  }, [atHome]);

  const motionToFan = (tl: gsap.core.Timeline, nodes: HTMLElement[], position: gsap.Position) =>
    tl.to(nodes, {
      x: (i: number) => fanPose(i, nodes.length).x,
      y: (i: number) => fanPose(i, nodes.length).y,
      rotation: (i: number) => fanPose(i, nodes.length).rotation,
      scale: 1, autoAlpha: 1, duration: 0.60, stagger: 0.048, ease: 'power2.out',
    }, position);

  const openEnvelope = () => {
    if (busyRef.current || phaseRef.current !== 'IDLE') return;
    play('envelope');
    setScene('OPENING');
    if (atHome) onNavigate('explore');
    const next = nextTimeline(() => { setScene('DISCOVER'); focus('.v6a-discover-head h1'); });
    const paper = cards();
    const lid = find('.v6a-envelope-flap');
    const seal = find('.v6a-seal');
    next.eventCallback('onReverseComplete', () => { restore(); focus('.v6a-open'); });

    next
      .addLabel('sink', 0.19)
      .addLabel('peel', 0.93)
      .addLabel('hinge', 1.15)
      .addLabel('extract', 1.58)
      .set(paper, CARD_REST, 0)
      .to(envelope.current, { scale: 0.7, duration: 0.19, ease: 'power2.out' }, 0)
      .to(find('.v6a-open-hint'), { autoAlpha: 0, duration: 0.2 }, 0)
      .to(envelope.current, { x: 0, y: DOCK, scale: 1, rotation: 0, duration: 0.8, ease: 'sine.inOut' }, 'sink')
      .to(find('.v6-home'), { autoAlpha: 0, duration: 0.58, ease: 'sine.inOut' }, 'sink')
      .to(find('.v6a-seal-leaf'), { rotateX: 56, duration: 0.35, ease: 'power2.out' }, 'peel')
      .to(seal, { x: 35, y: -29, rotation: 17, duration: 0.29, ease: 'power2.out' }, 'peel')
      .to(seal, { x: 125, y: 37, rotation: 48, autoAlpha: 0, duration: 0.4, ease: 'power1.in' }, 'hinge')
      .to(lid, { rotateX: 90, duration: 0.30, ease: 'sine.in' }, 'hinge')
      .set(lid, { zIndex: 2 }, 'hinge+=0.30')
      .to(lid, { rotateX: 174, duration: 0.30, ease: 'sine.out' }, 'hinge+=0.30')
      .set(paper, { autoAlpha: 1 }, 'extract')
      .to(paper, { y: -180, duration: 0.5, stagger: 0.045, ease: 'power2.inOut' }, 'extract')
      .to(findAll('.v6a-discover-ui'), { autoAlpha: 1, duration: 0.42 }, 'extract+=0.65');
    motionToFan(next, paper, 'extract+=0.50');
  };

  const hoverCard = (id: string | null) => {
    if (busyRef.current || phaseRef.current !== 'DISCOVER' || reduce.current) return;
    stopHover();
    cards().forEach((node, index) => hoverTweens.current.push(gsap.to(node, {
      ...fanPose(index, shown.length, node.dataset.event === id),
      duration: 0.42,
      ease: 'power3.out',
    })));
  };

  const readCard = (item: CampusEvent) => {
    if (busyRef.current || phaseRef.current !== 'DISCOVER') return;
    const chosen = cardNode(item.id);
    if (!chosen) return;
    play('tap');
    setCurrent(item);
    setFront(false);
    const next = nextTimeline(() => { setScene('POSTCARD'); focus(`[data-event="${item.id}"] button`); });
    next
      .to(findAll('.v6a-discover-ui'), { autoAlpha: 0, duration: 0.2 }, 0)
      .to(cards().filter((node) => node !== chosen), { y: 170, autoAlpha: 0, duration: 0.43, stagger: 0.04, ease: 'power2.in' }, 0)
      .set(chosen, { zIndex: 7 }, 0)
      .to(envelope.current, { y: READING_DOCK, duration: 0.71, ease: 'power2.inOut' }, 0)
      .to(find('.v6a-envelope-flap'), { autoAlpha: 0, duration: 0.32 }, 0.25)
      .to(chosen, { x: 0, y: 418 - 128 - READING_DOCK - CARD_HEIGHT / 2, rotation: -1.4, scale: 1.63, duration: 0.71, ease: 'power2.inOut' }, 0)
      .to(findAll('.v6a-reading-ui'), { autoAlpha: 1, duration: 0.31 }, 0.54);
  };

  const tiltCard = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== 'mouse' || busyRef.current || reduce.current) return;
    const layer = event.currentTarget.parentElement?.querySelector('.v6a-card-tilt');
    if (!layer) return;
    if (!tilt.current) tilt.current = {
      x: gsap.quickTo(layer, 'rotationX', { duration: 0.43, ease: 'power2.out' }),
      y: gsap.quickTo(layer, 'rotationY', { duration: 0.43, ease: 'power2.out' }),
    };
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    tilt.current.x(-y * 11);
    tilt.current.y(x * 13);
    (layer as HTMLElement).style.setProperty('--paper-light-x', `${50 + x * 90}%`);
    (layer as HTMLElement).style.setProperty('--paper-light-y', `${50 + y * 90}%`);
  };

  const flip = () => {
    if (!current || busyRef.current || phaseRef.current !== 'POSTCARD') return;
    play('tap');
    const node = cardNode(current.id);
    if (!node) return;
    const next = nextTimeline(() => focus(`[data-event="${current.id}"] button`));
    setFront(!front);
    next
      .to(node, { rotation: 1.5, duration: 0.26, ease: 'sine.out' }, 0)
      .to(node.querySelector('.v6a-card-turn'), { rotateY: front ? 0 : -180, duration: 0.65, ease: 'power2.inOut' }, 0)
      .to(node, { rotation: -1.4, duration: 0.23, ease: 'power2.out' }, 0.44);
  };

  const putBack = () => {
    if (!current || busyRef.current || phaseRef.current !== 'POSTCARD') return;
    play('tap');
    const node = cardNode(current.id);
    if (!node) return;
    const siblings = cards().filter((item) => item !== node);
    const next = nextTimeline(() => {
      gsap.set(node, { zIndex: '' });
      setCurrent(null);
      setFront(false);
      setScene('DISCOVER');
      focus(`[data-event="${current.id}"] button`);
    });
    gsap.set(siblings, { x: 0, y: 170, scale: 1, rotation: 0, autoAlpha: 1 });
    next
      .to(findAll('.v6a-reading-ui'), { autoAlpha: 0, duration: 0.18 }, 0)
      .to(node.querySelector('.v6a-card-turn'), { rotateY: 0, duration: 0.41, ease: 'power2.inOut' }, 0)
      .to(envelope.current, { y: DOCK, duration: 0.63, ease: 'power2.inOut' }, 0)
      .to(find('.v6a-envelope-flap'), { autoAlpha: 1, duration: 0.32 }, 0.22)
      .to(findAll('.v6a-discover-ui'), { autoAlpha: 1, duration: 0.34 }, 0.46);
    motionToFan(next, cards(), 0.12);
  };

  const collect = () => {
    if (!current || busyRef.current || phaseRef.current !== 'POSTCARD') return;
    const node = cardNode(current.id);
    if (!node) return;
    const next = nextTimeline(() => { onCollect(current.id); setScene('COMPLETE'); focus('.v6a-complete-copy h1'); });
    const sleeve = findAll('.v6a-sleeve-back, .v6a-sleeve-front, .v6a-stamp-mark');
    next
      .to(findAll('.v6a-reading-ui'), { autoAlpha: 0, duration: 0.2 }, 0)
      .to(findAll(SHELL), { y: 85, autoAlpha: 0, duration: 0.51, ease: 'power2.in' }, 0)
      .set(sleeve, { y: 94, autoAlpha: 1 }, 0)
      .set(find('.v6a-stamp-mark'), { autoAlpha: 0 }, 0)
      .set(find('.v6a-stamp-tool'), { y: -100, scale: 1.24, autoAlpha: 0 }, 0)
      .to(sleeve, { y: 0, duration: 0.53, ease: 'power3.out' }, 0)
      .to(node.querySelector('.v6a-card-turn'), { rotateY: -180, duration: 0.47, ease: 'power2.inOut' }, 0)
      .to(node, { x: -241, y: -591, scale: 1.14, rotation: 0, duration: 0.64, ease: 'power2.inOut' }, 0.04)
      .to(node, { y: -528, duration: 0.46, ease: 'power2.in' }, 0.69)
      .to(find('.v6a-stamp-tool'), { y: 0, rotation: -8, scale: 1, autoAlpha: 1, duration: 0.25, ease: 'power3.in' }, 1.03)
      .addLabel('impact', 1.28)
      .call(() => play('stamp'), [], 'impact')
      .set(find('.v6a-stamp-mark'), { autoAlpha: 1 }, 'impact')
      .to(sleeve, { y: 3, duration: 0.09, yoyo: true, repeat: 1 }, 'impact')
      .to(find('.v6a-stamp-tool'), { y: -39, rotation: -13, autoAlpha: 0, duration: 0.3, ease: 'power2.out' }, 'impact+=0.07')
      .to(find('.v6a-complete-copy'), { autoAlpha: 1, duration: 0.42 }, 'impact');
  };

  const changeFilter = (next: Filter) => {
    if (phaseRef.current !== 'DISCOVER') return;
    if (busyRef.current) { pendingFilter.current = next; return; }
    if (filter.school === next.school && filter.batch === next.batch) return;
    play('tap');
    const outward = nextTimeline(() => {
      flushSync(() => setFilter(next));
      const inward = nextTimeline(() => {
        const pending = pendingFilter.current;
        pendingFilter.current = null;
        if (pending && (pending.school !== next.school || pending.batch !== next.batch)) {
          requestAnimationFrame(() => filterAction.current(pending));
        }
      });
      const incoming = cards();
      inward.set(incoming, { ...CARD_REST, y: 160, autoAlpha: 1 }).to(incoming, { y: -178, duration: 0.33, stagger: 0.03, ease: 'power2.inOut' });
      motionToFan(inward, incoming, '-=0.08');
    });
    outward.to(cards(), { x: 0, y: 185, rotation: 0, duration: 0.37, stagger: 0.045, ease: 'power2.in' });
  };
  const filterAction = useRef(changeFilter);
  filterAction.current = changeFilter;

  return (
    <section className="v6a" ref={root} data-phase={phase} data-busy={busy} aria-label="A 屏幕探索">
      <HomeHub active={atHome && phase === 'IDLE'} onNavigate={onNavigate} />
      <div className="v6a-discover-ui v6a-discover-head"><h1 tabIndex={-1}>三校来信</h1></div>
      <nav className="v6a-discover-ui v6a-filters" aria-label="按学校筛选" inert={phase !== 'DISCOVER'}>
        <button aria-pressed={filter.school === 'all'} onClick={() => changeFilter(FIRST)}>全部来信</button>
        {schools.map((school) => (
          <button key={school.id} aria-pressed={filter.school === school.id} onClick={() => changeFilter({ school: school.id, batch: 0 })}>
            <i aria-hidden="true" style={{ background: school.accent }} />{school.name}
          </button>
        ))}
      </nav>

      <div className="v6a-envelope" ref={envelope}>
        <div className="v6a-envelope-shadow" />
        <div className="v6a-envelope-back" />
        <div className="v6a-envelope-lining" />
        <div className="v6a-envelope-flap">
          <div className="v6a-flap-front" aria-hidden="true">
            <svg viewBox="0 0 1040 300" preserveAspectRatio="none">
              <path d="M4 0h1032L520 300 4 0Z" fill="#eee4cd" stroke="#b4a67d" strokeWidth="2" />
              <path d="M26 7h988L520 283 26 7Z" fill="#f7eed9" stroke="#d4c7a8" />
            </svg>
            <div className="v6a-cover"><span>从德智树下寄出</span><strong>校园来信</strong></div>
          </div>
          <div className="v6a-flap-back" aria-hidden="true">
            <svg viewBox="0 0 1040 300" preserveAspectRatio="none">
              <path d="M4 0h1032L520 300 4 0Z" fill="#d8ddc3" stroke="#a6a78b" strokeWidth="2" />
              <path d="M27 6h986L520 279 27 6Z" fill="none" stroke="#eee8cf" />
            </svg>
          </div>
        </div>

        <div className="v6a-fan" hidden={phase === 'IDLE'}>
          {shown.map((item) => {
            const reading = phase === 'POSTCARD' && current?.id === item.id;
            return (
              <EventCard key={item.id} item={item} selected={reading} front={front && current?.id === item.id}
                collected={collected.has(item.id)}
                clickable={!busy && (phase === 'DISCOVER' || reading)}
                onHover={hoverCard} onRead={reading ? flip : () => readCard(item)}
                onTilt={tiltCard} onRest={() => { tilt.current?.x(0); tilt.current?.y(0); }}
              />
            );
          })}
        </div>
        <div className="v6a-pocket" aria-hidden="true">
          <svg viewBox="0 0 1040 552" preserveAspectRatio="none">
            <path d="M0 6 520 165 1040 6v530q0 16-16 16H16Q0 552 0 536Z" fill="#f6eed9" stroke="#c8b791" strokeWidth="2" />
            <path d="M7 545 372 121M1033 545 668 121" fill="none" stroke="#dacaa6" strokeWidth="2" />
            <path d="M12 22 520 178 1028 22" fill="none" stroke="#fffaea" strokeWidth="3" />
          </svg>
          <MacauTileBorder className="v6a-pocket-tile" bg="#426258" stroke="#f5ebd6" accent="#d0ac66" />
        </div>
        <div className="v6a-seal" aria-hidden="true">
          <div className="v6a-seal-leaf"><div className="v6a-seal-paper"><MacauTileDiamond /></div></div>
        </div>
        <button className="v6a-open" onClick={openEnvelope} disabled={phase !== 'IDLE' || busy}
          aria-label={atHome ? 'A 屏幕探索：轻触拆开校园来信' : '打开校园来信'}
        >
          <span className="v6a-open-hint">揭开叶封 <b aria-hidden="true">↗</b></span>
        </button>
      </div>

      <div className="v6a-discover-ui v6a-dock-label" inert={phase !== 'DISCOVER'}>
        <span>挑一张来信读读</span>
        {available.length > PAGE_SIZE && (
          <div className="v6a-pager">
            <button aria-label="上一组活动" disabled={filter.batch === 0} onClick={() => changeFilter({ ...filter, batch: filter.batch - 1 })}>←</button>
            <span>{filter.batch + 1} / {Math.ceil(available.length / PAGE_SIZE)}</span>
            <button aria-label="下一组活动" disabled={(filter.batch + 1) * PAGE_SIZE >= available.length} onClick={() => changeFilter({ ...filter, batch: filter.batch + 1 })}>→</button>
          </div>
        )}
      </div>

      <div className="v6a-reading-ui v6a-reading-left" inert={phase !== 'POSTCARD' || busy}>
        <button className="v6-btn-text" onClick={putBack}>← 放回信封</button>
        <p>{currentSchool?.name}</p>
        <h1>{currentSchool?.flower}</h1>
      </div>
      <div className="v6a-reading-ui v6a-reading-right" inert={phase !== 'POSTCARD' || busy}>
        <button className="v6-btn-text v6a-flip-hint" onClick={flip}>{front ? '翻回背面' : '翻到正面'} ↻</button>
        <button className="v6-btn-primary" onClick={collect}>{current && collected.has(current.id) ? '收回收藏套' : '完成数字收藏'} <span aria-hidden="true">↘</span></button>
      </div>

      <div className="v6a-collection v6a-sleeve-back" aria-hidden="true" />
      <div className="v6a-collection v6a-sleeve-front" aria-hidden="true">
        <MacauTileBorder className="v6a-sleeve-tile" bg="#486055" stroke="#e9dfc3" accent="#caa565" />
      </div>
      <div className="v6a-collection v6a-stamp-mark" aria-hidden="true"><MacauTileDiamond primary="#964b34" secondary="#964b34" paper="transparent" />拾花一叶</div>
      <div className="v6a-collection v6a-stamp-tool" aria-hidden="true"><i /><i /></div>

      <section className="v6a-collection v6a-complete-copy" inert={phase !== 'COMPLETE'} aria-label="数字收藏完成">
        <h1 tabIndex={-1}>已数字收藏</h1>
        <p>仅限当前网页会话</p>
        <strong>{current?.title}</strong>
        <div>
          <button className="v6-btn-secondary" onClick={() => onNavigate('leaf-drop')}>去领实体卡 →</button>
          <button className="v6-btn-primary" onClick={() => onNavigate('post-office', {
            postcardId: current ? `po-school-${current.schoolId}` : undefined,
          })}>去时光邮局 →</button>
        </div>
      </section>
    </section>
  );
}
