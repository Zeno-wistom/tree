import { useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { flushSync } from 'react-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import {
  dateLabel, eventStatus, events, getSchool, schools, timeLabel,
  type CampusEvent, type RouteId, type SchoolId,
} from '../data/catalog';
import { useObjectScale } from '../hooks/useObjectScale';
import { useChime } from '../hooks/useChime';
import { MacauTileBorder, MacauTileDiamond } from '../components/MacauOrnaments';
import { HomeHub } from './HomeHub';
import { gardenCard } from '../data/gardenCard';
import './explore.css';

gsap.registerPlugin(useGSAP);

type Phase = 'IDLE' | 'OPENING' | 'DISCOVER' | 'POSTCARD' | 'COMPLETE' | 'RETURNING';
type Filter = { school: 'all' | 'garden' | SchoolId; batch: number };

const FIRST: Filter = { school: 'all', batch: 0 };
const PAGE_SIZE = 4;
const DISCOVER_POSE = { x: 155, y: 304, scale: .68, rotation: 0 };
const READING_POSE = { x: -137, y: 444, scale: .36, rotation: 0 };
const CARD_HEIGHT = 254 * 1091 / 774;
const HOME_POSE = { x: 267, y: 181, scale: 0.685, rotation: -7 };
const COLLECTION_POSE = { x: -74, y: 319, scale: .65, rotation: 0 };
const CARD_REST = { x: 0, y: 180, rotation: 0, scale: 1, autoAlpha: 0 };
const SHELL = '.v6a-envelope-shadow, .v6a-envelope-back, .v6a-envelope-lining, .v6a-pocket';
const PRINT = '.v6a-stamp-mark, .v6a-stamp-tool';
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
    x: offset * 246,
    y: -177 + Math.abs(offset) * 2 - (lifted ? 18 : 0),
    rotation: offset * 4 + (lifted ? offset * -1.5 : 0),
    scale: lifted ? 1.06 : 1,
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
  const school = item.kind === 'garden' ? gardenCard : getSchool(item.schoolId);
  const status = eventStatus(item);
  const bodyId = `v6a-body-${item.id}`;
  return (
    <div className="v6a-event" data-event={item.id} data-selected={selected || undefined} style={{ '--card-ink': school.ink } as CSSProperties}>
      <div className="v6a-card-tilt">
        <div className="v6a-card-turn">
          <div className="v6a-card-face v6a-card-writing" aria-hidden={!selected || front}>
            <img src={school.backImage} alt="" draggable={false} />
            <div className="v6a-card-stamp" aria-hidden="true"><MacauTileDiamond primary={school.ink} secondary={school.accent} /></div>
            <div className="v6a-card-print" id={bodyId}>
              <small>{item.category}</small>
              <h2>{item.title}</h2>
              <p className="v6a-card-date">{dateLabel(item)} {timeLabel(item) && `· ${timeLabel(item)}`}</p>
              <p>{item.description}</p>
              {status === 'ended' && <p className="v6a-card-ended">活动已结束 · 留作纪念</p>}
            </div>
            <p className="v6a-card-location">{item.location}</p>
          </div>
          <div className="v6a-card-face v6a-card-art" aria-hidden={!selected || !front}>
            <img src={school.frontImage} alt={`${school.name} · ${school.flower}明信片正面`} draggable={false} />
            <div className="v6a-stamp-mark" aria-hidden="true"><MacauTileDiamond primary="#964b34" secondary="#964b34" paper="transparent" />拾花一叶</div>
          </div>
        </div>
        <span className="v6a-card-light" aria-hidden="true" />
      </div>
      <div className="v6a-stamp-tool" aria-hidden="true"><i /><i /></div>
      <button
        type="button"
        className="v6a-event-hit"
        aria-label={selected ? (front ? '明信片正面，翻回背面' : '明信片背面，翻到正面') : `${item.title}，${school.name}，${dateLabel(item)}${status === 'ended' ? '，活动已结束' : ''}${collected ? '，已数字收藏' : ''}`}
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
  useObjectScale(root, 1440, 810, 1.22);
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

  const displayEvents = events.filter((event, index) => event.kind === 'garden' || events.findIndex(
    (candidate) => candidate.kind !== 'garden' && candidate.schoolId === event.schoolId,
  ) === index);
  const availableFor = ({ school }: Filter) => displayEvents.filter(
    (item) => school === 'all' || (school === 'garden' ? item.kind === 'garden' : item.kind !== 'garden' && item.schoolId === school)
  );
  const available = availableFor(filter);
  const shown = available.slice(filter.batch * PAGE_SIZE, (filter.batch + 1) * PAGE_SIZE);
  const currentSchool = current ? (current.kind === 'garden' ? gardenCard : getSchool(current.schoolId)) : null;
  const currentEvents = current && current.kind !== 'garden'
    ? events.filter((event) => event.schoolId === current.schoolId)
    : current ? [current] : [];

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

  const objectScale = () => {
    const paper = root.current?.querySelector<HTMLElement>('.v6a-paper-space');
    return Number.parseFloat(
      paper ? getComputedStyle(paper).getPropertyValue('--object-scale') : '1',
    ) || 1;
  };

  const homePose = () => {
    const paper = root.current?.querySelector<HTMLElement>('.v6a-paper-space');
    const label = root.current?.querySelector<HTMLElement>('.v6-home-leaf .v6-home-object-label');
    if (!paper || !label) return HOME_POSE;
    const scale = objectScale();
    const paperTop = paper.getBoundingClientRect().top;
    const lift = 1040 * HOME_POSE.scale * Math.abs(Math.sin(HOME_POSE.rotation * Math.PI / 180));
    const minY = (label.getBoundingClientRect().bottom + 18 - paperTop) / scale + lift;
    return { ...HOME_POSE, y: Math.max(HOME_POSE.y, minY) };
  };

  const restore = () => {
    pendingFilter.current = null;
    setFilter(FIRST);
    setCurrent(null);
    setFront(false);
    gsap.set(envelope.current, { ...homePose(), autoAlpha: 1 });
    gsap.set(find('.v6a-envelope-flap'), { rotateX: 0, zIndex: 9, autoAlpha: 1 });
    gsap.set(find('.v6a-seal'), { x: 0, y: 0, rotate: 0, autoAlpha: 1 });
    gsap.set(find('.v6a-seal-leaf'), { rotateX: 0 });
    gsap.set(findAll('.v6-home, .v6a-open-hint'), { autoAlpha: 1 });
    gsap.set(findAll('.v6a-card-turn'), { rotateY: 0 });
    gsap.set(cards(), CARD_REST);
    gsap.set(findAll(SHELL), { y: 0, autoAlpha: 1 });
    gsap.set(findAll(OVERLAYS + ', ' + PRINT), { autoAlpha: 0 });
    setAnimating(false);
    setScene('IDLE');
  };

  useGSAP(() => {
    gsap.set(envelope.current, homePose());
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
    const wind = root.current?.querySelector<SVGElement>('.v6-home-wind');
    const sealPaper = find('.v6a-seal-paper');
    const bough = root.current?.querySelector<HTMLElement>('.v6-home-bough-motion');
    const gust = { force: 0 };
    const breeze = gsap.matchMedia();
    breeze.add('(prefers-reduced-motion: no-preference)', () => {
      if (!sealPaper || !wind || !bough) return;
      const lift = gsap.quickSetter(sealPaper, 'rotationX', 'deg');
      const trace = gsap.quickSetter(wind, 'opacity');
      const bend = gsap.quickSetter(bough, 'rotation', 'deg');
      const setGust = gsap.quickTo(gust, 'force', { duration: .8, ease: 'sine.out' });
      const onMove = (event: globalThis.PointerEvent) => {
        if (event.pointerType !== 'mouse' || phaseRef.current !== 'IDLE') return;
        const seal = sealPaper?.getBoundingClientRect();
        if (!seal) return;
        const distance = Math.hypot(event.clientX - (seal.left + seal.width / 2), event.clientY - (seal.top + seal.height / 2));
        setGust(Math.max(0, 1 - distance / 230));
      };
      const onLeave = () => setGust(0);
      let impulseStart = -100;
      const onImpulse = (event: Event) => {
        if (event.type === 'pointerdown' || (event as globalThis.PointerEvent).pointerType === 'mouse') impulseStart = performance.now() / 1000;
      };
      const paint = (time: number) => {
        if (phaseRef.current !== 'IDLE' || document.hidden) return;
        const swell = Math.max(0, Math.sin(time * .91) * .64 + Math.sin(time * 1.63 - .9) * .36);
        const impulseAge = time - impulseStart;
        const impulse = impulseAge >= 0 && impulseAge < 3 ? Math.sin(impulseAge / 3 * Math.PI) * .8 : 0;
        const periodicGust = Math.pow(Math.max(0, Math.sin(time * .19 - 1.2)), 8) * .8;
        const force = Math.min(1.25, swell + gust.force * .79 + impulse + periodicGust);
        lift(2 + force * 21);
        bend(force * .64 + Math.sin(time * .57) * .42);
        trace(Math.max(0, force - .3) * .65);
        wind?.style.setProperty('--wind-travel', `${-68 - force * 72}px`);
      };
      root.current?.addEventListener('pointermove', onMove, { passive: true });
      root.current?.addEventListener('pointerdown', onImpulse, { passive: true });
      root.current?.addEventListener('pointerleave', onLeave);
      gsap.ticker.add(paint);
      return () => {
        root.current?.removeEventListener('pointermove', onMove);
        root.current?.removeEventListener('pointerdown', onImpulse);
        root.current?.removeEventListener('pointerleave', onLeave);
        gsap.ticker.remove(paint);
        gsap.set([sealPaper, wind, bough].filter(Boolean), { clearProps: 'transform,opacity' });
      };
    });
    const onVisibility = () => timeline.current?.paused(document.hidden);
    media.addEventListener('change', onReduce);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      breeze.revert();
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

  const fittedPoseY = (pose: { y: number; scale: number }, marginRatio = .045) => {
    const paper = root.current?.querySelector<HTMLElement>('.v6a-paper-space');
    const scale = Number.parseFloat(
      paper ? getComputedStyle(paper).getPropertyValue('--object-scale') : '1',
    ) || 1;
    const margin = Math.max(28, window.innerHeight * marginRatio);
    const maxY = (window.innerHeight / 2 - margin) / scale + 276 - 552 * pose.scale;
    return Math.min(pose.y, maxY);
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

    // Return without remounting the letter. The pocket shields the tucked cards.
    next
      .to(clearScene, { autoAlpha: 0, duration: .21 }, 0)
      .to(cards(), { x: 0, y: 175, scale: .96, rotation: 0, duration: .39, ease: 'power2.in' }, 0)
      .set(cards(), { autoAlpha: 0 }, .39)
      .to(findAll(SHELL), { y: 0, autoAlpha: 1, duration: .2 }, 0)
      .to(lid, { autoAlpha: 1, rotateX: 90, duration: .26, ease: 'sine.in' }, .18)
      .set(lid, { zIndex: 9 }, .44)
      .to(lid, { rotateX: 0, duration: .28, ease: 'sine.out' }, .44)
      .set(seal, { x: -8, y: -24, rotate: -7 }, .63)
      .to(seal, { x: 0, y: 0, rotate: 0, autoAlpha: 1, duration: .23, ease: 'power2.out' }, .63)
      .to(find('.v6a-seal-leaf'), { rotateX: 0, duration: .23 }, .63)
      .to(envelope.current, { ...homePose(), duration: .73, ease: 'sine.inOut' }, .35)
      .to(findAll('.v6-home, .v6a-open-hint'), { autoAlpha: 1, duration: .42 }, .65);
  }, [atHome]);

  useLayoutEffect(() => {
    const refit = () => {
      if (phaseRef.current === 'IDLE') {
        gsap.set(envelope.current, homePose());
      } else if (phaseRef.current === 'DISCOVER') {
        gsap.set(envelope.current, { ...DISCOVER_POSE, y: fittedPoseY(DISCOVER_POSE) });
      }
    };
    window.addEventListener('resize', refit);
    return () => window.removeEventListener('resize', refit);
  }, []);

  const motionToFan = (tl: gsap.core.Timeline, nodes: HTMLElement[], position: gsap.Position) =>
    tl.to(nodes, {
      x: (i: number) => fanPose(i, nodes.length).x,
      y: (i: number) => fanPose(i, nodes.length).y,
      rotation: (i: number) => fanPose(i, nodes.length).rotation,
      scale: (i: number) => fanPose(i, nodes.length).scale,
      autoAlpha: 1, duration: 0.58, stagger: 0.048, ease: 'power2.out',
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
      .addLabel('peel', 0)
      .addLabel('hinge', .07)
      .addLabel('sink', .10)
      .addLabel('extract', .43)
      .set(paper, CARD_REST, 0)
      .to(envelope.current, { scale: .71, duration: .10, ease: 'power2.out' }, 0)
      .to(find('.v6a-open-hint'), { autoAlpha: 0, duration: .16 }, 0)
      .to(find('.v6a-seal-leaf'), { rotateX: 58, duration: .24, ease: 'power2.out' }, 'peel')
      .to(seal, { x: 34, y: -20, rotation: 17, duration: .23, ease: 'power2.out' }, 'peel')
      .to(envelope.current, { ...DISCOVER_POSE, y: fittedPoseY(DISCOVER_POSE), duration: .92, ease: 'sine.inOut' }, 'sink')
      .to(find('.v6-home'), { autoAlpha: 0, duration: .56, ease: 'sine.inOut' }, 'sink')
      .to(seal, { x: 114, y: 27, rotation: 46, autoAlpha: 0, duration: .35, ease: 'power1.in' }, .23)
      .to(lid, { rotateX: 90, duration: .27, ease: 'sine.inOut' }, 'hinge')
      .set(lid, { zIndex: 2 }, 'hinge+=.27')
      .to(lid, { rotateX: 174, duration: .39, ease: 'sine.out' }, 'hinge+=.27')
      .set(paper, { x: (i: number) => (i - (paper.length - 1) / 2) * 24, autoAlpha: 1 }, 'extract')
      .to(paper, { y: -151, duration: .46, stagger: .033, ease: 'sine.inOut' }, 'extract')
      .to(findAll('.v6a-discover-ui'), { autoAlpha: 1, duration: .35 }, .91);
    motionToFan(next, paper, .86);
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
    const siblings = cards().filter((node) => node !== chosen);
    next
      .to(findAll('.v6a-discover-ui'), { autoAlpha: 0, duration: 0.2 }, 0)
      .set(chosen, { zIndex: 7 }, 0)
      .to(envelope.current, { ...READING_POSE, duration: 0.68, ease: 'power2.inOut' }, 0)
      .to(chosen, {
        x: (520 - READING_POSE.x) / READING_POSE.scale - 520,
        y: (290 - READING_POSE.y) / READING_POSE.scale - CARD_HEIGHT / 2,
        rotation: -1.4, scale: 1.61 / READING_POSE.scale, duration: .68, ease: 'power2.inOut',
      }, 0)
      .to(findAll('.v6a-reading-ui'), { autoAlpha: 1, duration: 0.31 }, 0.54);
    if (siblings.length) {
      next.to(siblings, { y: 170, autoAlpha: 0, duration: 0.43, stagger: 0.04, ease: 'power2.in' }, 0);
    }
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
    if (siblings.length) gsap.set(siblings, { x: 0, y: 170, scale: 1, rotation: 0, autoAlpha: 1 });
    next
      .to(findAll('.v6a-reading-ui'), { autoAlpha: 0, duration: 0.18 }, 0)
      .to(node.querySelector('.v6a-card-turn'), { rotateY: 0, duration: 0.41, ease: 'power2.inOut' }, 0)
      .to(envelope.current, { ...DISCOVER_POSE, y: fittedPoseY(DISCOVER_POSE), duration: 0.63, ease: 'power2.inOut' }, 0)
      .to(findAll('.v6a-discover-ui'), { autoAlpha: 1, duration: 0.34 }, 0.46);
    motionToFan(next, cards(), 0.12);
  };

  const collect = () => {
    if (!current || busyRef.current || phaseRef.current !== 'POSTCARD') return;
    const node = cardNode(current.id);
    if (!node) return;
    const next = nextTimeline(() => { onCollect(current.id); setScene('COMPLETE'); focus('.v6a-complete-copy h1'); });
    const stamp = node.querySelector('.v6a-stamp-tool');
    const impression = node.querySelector('.v6a-stamp-mark');
    next
      .addLabel('strike', .79)
      .addLabel('tuck', 1.02)
      .to(findAll('.v6a-reading-ui'), { autoAlpha: 0, duration: .2 }, 0)
      // Lift the card clear of the lip before moving it laterally over the mouth.
      .to(node, { y: -718, scale: 3.05, rotation: 0, duration: .23, ease: 'power2.out' }, 0)
      .to(envelope.current, { ...COLLECTION_POSE, y: fittedPoseY(COLLECTION_POSE, .035), duration: .43, ease: 'sine.inOut' }, .23)
      .to(node.querySelector('.v6a-card-turn'), { rotateY: -180, duration: .48, ease: 'power2.inOut' }, .03)
      .to(node, { x: 0, y: -373, scale: 1.52, duration: .43, ease: 'sine.inOut' }, .23)
      .set(stamp, { y: -86, scale: 1.2, rotation: 0, autoAlpha: 0 }, 0)
      .to(stamp, { y: 0, scale: 1, autoAlpha: 1, duration: .22, ease: 'power3.in' }, 'strike-=.22')
      .call(() => play('stamp'), [], 'strike')
      .set(impression, { autoAlpha: 1 }, 'strike')
      .to(node, { y: -369, duration: .055, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 'strike')
      .to(stamp, { y: -50, rotation: -9, autoAlpha: 0, duration: .25, ease: 'power2.out' }, 'strike+=.04')
      .to(node, { y: 91, duration: .54, ease: 'power2.inOut' }, 'tuck')
      .to(find('.v6a-complete-copy'), { autoAlpha: 1, duration: .35 }, 'tuck+=.31');
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
      <div className="v6a-discover-ui v6a-discover-head"><h1 tabIndex={-1}>三校来信 · 一叶留念</h1></div>
      <nav className="v6a-discover-ui v6a-filters" aria-label="按学校筛选" inert={phase !== 'DISCOVER'}>
        <button aria-pressed={filter.school === 'all'} onClick={() => changeFilter(FIRST)}>全部来信</button>
        {schools.map((school) => (
          <button key={school.id} aria-pressed={filter.school === school.id} onClick={() => changeFilter({ school: school.id, batch: 0 })}>
            <i aria-hidden="true" style={{ background: school.accent }} />{school.name}
          </button>
        ))}
        <button aria-pressed={filter.school === 'garden'} onClick={() => changeFilter({ school: 'garden', batch: 0 })}>广场纪念</button>
      </nav>

      <div className="v6a-paper-space">
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
        <button className="v6-btn-text" onClick={() => onNavigate('post-office', {
          postcardId: current?.kind === 'garden' ? undefined : current ? `po-school-${current.schoolId}` : undefined,
        })}>用这张卡写信</button>
        {current && (
          <details className="v6a-related">
            <summary>{current.kind === 'garden' ? '关于这张广场纪念卡' : currentEvents.length > 1 ? `查看本期 ${currentEvents.length} 则澳大公告` : '活动信息与来源'}</summary>
            <div className="v6a-related-list">
              {currentEvents.map((event) => {
                const status = eventStatus(event);
                return (
                  <article key={event.id}>
                    <span className="v6a-event-state" data-status={status}>
                      {status === 'upcoming' ? '即将开始' : status === 'ongoing' ? '正在进行' : '已结束'}
                    </span>
                    <h3>{event.title}</h3>
                    <p>{dateLabel(event)} {timeLabel(event) && `· ${timeLabel(event)}`}</p>
                    <p>{event.location}</p>
                    {event.source?.startsWith('https://') && (
                      <a href={event.source} target="_blank" rel="noreferrer">查看澳大公告 ↗</a>
                    )}
                  </article>
                );
              })}
            </div>
          </details>
        )}
      </div>

      <section className="v6a-collection v6a-complete-copy" inert={phase !== 'COMPLETE'} aria-label="数字收藏完成">
        <h1 tabIndex={-1}>已数字收藏</h1>
        <p>仅限当前网页会话</p>
        <strong>{current?.title}</strong>
        <div>
          <button className="v6-btn-secondary" onClick={() => onNavigate('leaf-drop')}>去领实体卡 →</button>
          <button className="v6-btn-primary" onClick={() => onNavigate('post-office', {
            postcardId: current?.kind === 'garden' ? undefined : current ? `po-school-${current.schoolId}` : undefined,
          })}>去时光邮局 →</button>
        </div>
      </section>
    </section>
  );
}
