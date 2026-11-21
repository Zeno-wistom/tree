import { useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import {
  dateLabel,
  eventPostcards,
  events,
  getSchool,
  schoolName,
  schools,
  timeLabel,
  type CampusEvent,
  type RouteId,
  type SchoolId,
} from '../data/catalog';
import { useChime } from '../hooks/useChime';
import {
  BotanicalSpray,
  EventVignette,
  MacauTileBorder,
} from '../components/MacauOrnaments';
import { HomeHub } from './HomeHub';
import './explore.css';

gsap.registerPlugin(useGSAP);

type ExplorePhase = 'IDLE' | 'OPENING' | 'DISCOVER' | 'DETAIL' | 'POSTCARD' | 'COMPLETE';

const DOCK = 385;
const HOME_POSE = { x: 304, y: 177, scale: 0.665, rotation: -7 };
const EVENT_REST = { x: 0, y: 170, rotation: 0, scale: 1, autoAlpha: 0 };
const OVERLAYS = '.v6a-discover-ui, .v6a-letter, .v6a-postcard-ui, .v6a-postcard-object, .v6a-collection';
const PAGE_SIZE = 3;

interface ExploreRouteProps {
  atHome: boolean;
  onNavigate: (route: RouteId, opts?: { postcardId?: string }) => void;
  onActivity?: () => void;
}

export function ExploreRoute({ atHome, onNavigate, onActivity }: ExploreRouteProps) {
  const root = useRef<HTMLDivElement>(null);
  const envelope = useRef<HTMLDivElement>(null);
  const flap = useRef<HTMLDivElement>(null);
  const seal = useRef<HTMLDivElement>(null);
  const letter = useRef<HTMLElement>(null);
  const postcardObject = useRef<HTMLButtonElement>(null);
  const postcardInner = useRef<HTMLDivElement>(null);

  const timeline = useRef<gsap.core.Timeline | null>(null);
  const hoverTweens = useRef<gsap.core.Tween[]>([]);

  const phaseRef = useRef<ExplorePhase>('IDLE');
  const busyRef = useRef(false);
  const selectedRef = useRef<string | null>(null);
  const reduceRef = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const pendingFilter = useRef<{ school: 'all' | SchoolId; batch: number } | null>(null);
  const groupRef = useRef<{ school: 'all' | SchoolId; batch: number }>({ school: 'all', batch: 0 });
  const lastTouch = useRef(0);

  const [phase, setPhase] = useState<ExplorePhase>('IDLE');
  const [busy, setBusy] = useState(false);
  const [school, setSchool] = useState<'all' | SchoolId>('all');
  const [batch, setBatch] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);

  const { play } = useChime();

  const available = events.filter(
    (item) => item.status !== 'ended' && (school === 'all' || item.schoolId === school)
  );
  const shown = available.slice(batch * PAGE_SIZE, (batch + 1) * PAGE_SIZE);
  const current = events.find((item) => item.id === currentId) ?? null;
  const postcard = eventPostcards.find(
    (item) => item.id === current?.postcardId && item.eventId === current?.id
  );
  const currentSchool = current ? getSchool(current.schoolId) : null;

  const query = <T extends Element = HTMLElement>(selector: string) =>
    root.current?.querySelector<T>(selector) ?? null;
  const all = <T extends Element = HTMLElement>(selector: string) =>
    Array.from(root.current?.querySelectorAll<T>(selector) ?? []);

  const duration = (value: number) => (reduceRef.current ? 0.01 : value);
  const time = (value: number) => (reduceRef.current ? value * 0.12 : value);
  const markBusy = (value: boolean) => {
    busyRef.current = value;
    setBusy(value);
  };
  const changePhase = (value: ExplorePhase) => {
    phaseRef.current = value;
    setPhase(value);
  };
  const focusEl = (selector: string) =>
    requestAnimationFrame(() => query<HTMLElement>(selector)?.focus({ preventScroll: true }));
  const killHover = () => {
    hoverTweens.current.forEach((t) => t.kill());
    hoverTweens.current = [];
  };

  const pose = (index: number, total: number, selected = -1) => {
    const offset = index - (total - 1) / 2;
    const away = selected >= 0 && selected !== index ? (index < selected ? -22 : 22) : 0;
    return {
      x: offset * 292 + away,
      y: -236 + Math.abs(offset) * 22 - (index === selected ? 10 : 0),
      rotation: offset * 6.5 + away * 0.06,
      scale: index === selected ? 1.035 : 1,
      zIndex: index === selected ? 7 : 5 - Math.abs(offset),
    };
  };

  const restoreHome = () => {
    pendingFilter.current = null;
    selectedRef.current = null;
    groupRef.current = { school: 'all', batch: 0 };
    setCurrentId(null);
    setSchool('all');
    setBatch(0);
    setPicked(null);
    setFlipped(false);

    gsap.set(envelope.current, HOME_POSE);
    gsap.set(flap.current, { rotateX: 0, zIndex: 9 });
    gsap.set(seal.current, { x: 0, y: 0, rotation: 0, autoAlpha: 1 });
    gsap.set(query('.v6a-seal-tail'), { rotateX: 0 });
    gsap.set(all('.v6-home, .v6a-open-hint'), { autoAlpha: 1 });
    gsap.set(all('.v6a-event'), EVENT_REST);
    gsap.set(all(OVERLAYS), { autoAlpha: 0 });
    markBusy(false);
    changePhase('IDLE');
  };

  const { context } = useGSAP(() => {
    gsap.set(envelope.current, atHome ? HOME_POSE : { x: 146, y: 107, scale: 0.72, rotation: -3 });
    gsap.set(query('.v6-home'), { autoAlpha: atHome ? 1 : 0 });
    gsap.set(all('.v6a-event'), EVENT_REST);
    gsap.set(all(OVERLAYS), { autoAlpha: 0 });

    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onReduce = () => {
      reduceRef.current = media.matches;
      if (media.matches && timeline.current?.isActive()) {
        timeline.current.progress(timeline.current.reversed() ? 0 : 1);
      }
    };
    const onVisibility = () => timeline.current?.paused(document.hidden);
    media.addEventListener('change', onReduce);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      media.removeEventListener('change', onReduce);
      document.removeEventListener('visibilitychange', onVisibility);
      timeline.current?.kill();
      killHover();
    };
  }, { scope: root });

  useLayoutEffect(() => {
    if (!atHome) return;
    if (phaseRef.current === 'IDLE' && !busyRef.current) {
      gsap.set(envelope.current, HOME_POSE);
      gsap.set(query('.v6-home'), { autoAlpha: 1 });
      return;
    }
    if (phaseRef.current === 'OPENING' && timeline.current?.progress() && !reduceRef.current) {
      timeline.current.timeScale(1.6).reverse();
      return;
    }
    timeline.current?.kill();
    killHover();
    restoreHome();
  }, [atHome]);

  const owned =
    <Args extends unknown[]>(callback: (...args: Args) => void) =>
    (...args: Args) =>
      context.ignore(() => callback(...args));

  const createTimeline = (complete: () => void) => {
    timeline.current?.kill();
    killHover();
    markBusy(true);
    const next = gsap.timeline({
      onComplete: () => {
        markBusy(false);
        onActivity?.();
        complete();
      },
    });
    timeline.current = next;
    return next;
  };

  // The home scene, envelope and event letters share this coordinate space.
  const openEnvelope = owned(() => {
    if (busyRef.current || phaseRef.current !== 'IDLE') return;
    play('envelope');
    changePhase('OPENING');
    if (atHome) onNavigate('explore');

    const next = createTimeline(() => {
      changePhase('DISCOVER');
      focusEl('.v6a-discover-head h1');
    });
    next.eventCallback('onReverseComplete', () => {
      restoreHome();
      focusEl('.v6-home h1');
    });
    const paper = all('.v6a-event');
    gsap.set(paper, EVENT_REST);
    if (reduceRef.current) {
      next
        .set(all('.v6-home, .v6a-open-hint, .v6a-seal'), { autoAlpha: 0 })
        .set(flap.current, { rotateX: 174, zIndex: 2 })
        .set(envelope.current, { x: 0, y: DOCK, scale: 1, rotation: 0 })
        .set(paper, {
          autoAlpha: 1,
          x: (index: number) => pose(index, paper.length).x,
          y: (index: number) => pose(index, paper.length).y,
          rotation: (index: number) => pose(index, paper.length).rotation,
        })
        .set(all('.v6a-discover-ui'), { autoAlpha: 1 })
        .to({}, { duration: 0.01 });
      return;
    }

    next
      .addLabel('peel', 0.12)
      .addLabel('lift', 0.31)
      .addLabel('extract', 0.83)
      .to(envelope.current, { scale: '-=0.014', duration: 0.13, ease: 'power2.out' }, 0)
      .to(query('.v6a-open-hint'), { autoAlpha: 0, duration: 0.22 }, 0)
      .to(query('.v6a-seal-tail'), { rotateX: 55, duration: 0.26, ease: 'power1.out' }, 'peel')
      .to(seal.current, { x: 22, y: -42, rotation: 11, duration: 0.25, ease: 'power2.out' }, 'lift-=0.07')
      .to(seal.current, { x: 116, y: 80, rotation: 38, autoAlpha: 0, duration: 0.37, ease: 'power1.in' }, 'lift+=0.18')
      .to(flap.current, { rotateX: 90, duration: 0.4, ease: 'sine.in' }, 'lift')
      .set(flap.current, { zIndex: 2 }, 'lift+=0.4')
      .to(flap.current, { rotateX: 174, duration: 0.39, ease: 'sine.out' }, 'lift+=0.4')
      .to(query('.v6-home'), { autoAlpha: 0, duration: 0.56, ease: 'sine.inOut' }, 'lift')
      .to(envelope.current, {
        x: 0, y: DOCK, scale: 1, rotation: 0, duration: 0.95, ease: 'power2.inOut',
      }, 'lift+=0.07')
      .set(paper, { autoAlpha: 1 }, 'extract')
      .to(paper, { y: -130, duration: 0.46, stagger: 0.055, ease: 'power2.inOut' }, 'extract')
      .to(paper, {
        x: (index: number) => pose(index, paper.length).x,
        y: (index: number) => pose(index, paper.length).y,
        rotation: (index: number) => pose(index, paper.length).rotation,
        zIndex: (index: number) => pose(index, paper.length).zIndex,
        duration: 0.61,
        stagger: 0.055,
        ease: 'power2.out',
      }, 'extract+=0.43')
      .to(all('.v6a-discover-ui'), { autoAlpha: 1, duration: 0.35 }, 'extract+=0.68');
  });

  const arrange = owned((id: string | null) => {
    if (busyRef.current || phaseRef.current !== 'DISCOVER') return;
    selectedRef.current = id;
    setPicked(id);
    killHover();
    const index = shown.findIndex((item) => item.id === id);
    all('.v6a-event').forEach((node, position) =>
      hoverTweens.current.push(
        gsap.to(node, {
          ...pose(position, shown.length, index),
          duration: duration(0.28),
          ease: 'power3.out',
          overwrite: 'auto',
        })
      )
    );
  });

  // Animation 4: Small envelope seamlessly morphs into full editorial letter sheet
  const selectEvent = owned((item: CampusEvent, pointer: 'mouse' | 'touch' | 'keyboard') => {
    if (busyRef.current || phaseRef.current !== 'DISCOVER') return;
    if (pointer === 'touch' && selectedRef.current !== item.id) {
      arrange(item.id);
      return;
    }
    play('tap');
    flushSync(() => {
      setCurrentId(item.id);
      setPicked(item.id);
    });
    selectedRef.current = item.id;
    const chosen = query(`[data-event="${item.id}"]`);
    const others = all('.v6a-event').filter((node) => node !== chosen);
    const next = createTimeline(() => {
      changePhase('DETAIL');
      focusEl('.v6a-sheet-title');
    });
    next
      .to(all('.v6a-discover-ui'), { autoAlpha: 0, duration: duration(0.18) }, 0)
      .to(others, { y: 240, rotation: 0, duration: duration(0.44), stagger: duration(0.04), ease: 'power2.inOut' }, 0)
      .to(chosen, { x: 0, y: -283, rotation: 0, scale: 1, duration: duration(0.54), ease: 'power3.inOut' }, 0)
      .set(query('.v6a-letter-layout'), { autoAlpha: 0 }, 0)
      .set(letter.current, { autoAlpha: 1, x: 0, y: -1, scaleX: 280 / 980, scaleY: 380 / 560 }, time(0.55))
      .set(chosen, { autoAlpha: 0 }, time(0.56))
      .to(letter.current, { y: 0, scaleX: 1, scaleY: 1, duration: duration(0.6), ease: 'power3.inOut' }, time(0.57))
      .to(envelope.current, { y: 560, duration: duration(0.6), ease: 'power3.inOut' }, time(0.57))
      .to(query('.v6a-letter-layout'), { autoAlpha: 1, duration: duration(0.25) }, time(0.92));
  });

  const closeLetter = owned(() => {
    if (busyRef.current || phaseRef.current !== 'DETAIL') return;
    play('tap');
    const chosen = query(`[data-event="${currentId}"]`);
    const selected = shown.findIndex((item) => item.id === currentId);
    const next = createTimeline(() => {
      changePhase('DISCOVER');
      focusEl(`[data-event="${currentId}"] button`);
    });
    next
      .to(query('.v6a-letter-layout'), { autoAlpha: 0, duration: duration(0.18) }, 0)
      .to(envelope.current, { y: DOCK, duration: duration(0.6), ease: 'power3.inOut' }, 0)
      .to(letter.current, { y: -1, scaleX: 280 / 980, scaleY: 380 / 560, duration: duration(0.56), ease: 'power3.inOut' }, 0)
      .set(chosen, { x: 0, y: -283, rotation: 0, scale: 1, autoAlpha: 1 }, time(0.57))
      .set(letter.current, { autoAlpha: 0 }, time(0.58))
      .to(
        all('.v6a-event'),
        {
          x: (index: number) => pose(index, shown.length, selected).x,
          y: (index: number) => pose(index, shown.length, selected).y,
          rotation: (index: number) => pose(index, shown.length, selected).rotation,
          scale: (index: number) => pose(index, shown.length, selected).scale,
          zIndex: (index: number) => pose(index, shown.length, selected).zIndex,
          duration: duration(0.6),
          stagger: duration(0.04),
          ease: 'power3.inOut',
        },
        time(0.59)
      )
      .to(all('.v6a-discover-ui'), { autoAlpha: 1, duration: duration(0.3) }, time(0.78));
  });

  // Animation 5: Extract real A6 school postcard & 3D flip
  const takePostcard = owned(() => {
    if (busyRef.current || !postcard) return;
    play('envelope');
    setFlipped(false);
    const next = createTimeline(() => {
      changePhase('POSTCARD');
      focusEl('.v6a-postcard-object');
    });
    next
      .set(postcardObject.current, { autoAlpha: 1, x: 0, y: 170, rotation: 0, scale: 0.58, zIndex: 24 }, 0)
      .set(postcardInner.current, { rotateY: 0 }, 0)
      .to(postcardObject.current, { y: -24, scale: 0.76, duration: duration(0.5), ease: 'power3.out' }, 0)
      .to(letter.current, { y: 540, duration: duration(0.65), ease: 'power3.inOut' }, time(0.2))
      .set(postcardObject.current, { zIndex: 26 }, time(0.6))
      .to(postcardObject.current, { y: 0, scale: 1, rotation: -2, duration: duration(0.52), ease: 'power3.inOut' }, time(0.6))
      .set(letter.current, { autoAlpha: 0 }, time(0.92))
      .to(all('.v6a-postcard-ui'), { autoAlpha: 1, duration: duration(0.28) }, time(0.86));
  });

  const backPostcard = owned(() => {
    if (busyRef.current || phaseRef.current !== 'POSTCARD') return;
    play('tap');
    const next = createTimeline(() => {
      changePhase('DETAIL');
      focusEl('.v6a-sheet-title');
    });
    next
      .to(all('.v6a-postcard-ui'), { autoAlpha: 0, duration: duration(0.18) }, 0)
      .to(postcardInner.current, { rotateY: 0, duration: duration(0.32), ease: 'power2.inOut' }, 0)
      .to(postcardObject.current, { y: -24, scale: 0.74, rotation: 0, duration: duration(0.42), ease: 'power3.inOut' }, 0)
      .set(letter.current, { autoAlpha: 1 }, time(0.1))
      .to(letter.current, { y: 0, duration: duration(0.56), ease: 'power3.inOut' }, time(0.1))
      .set(postcardObject.current, { zIndex: 24 }, time(0.5))
      .to(postcardObject.current, { y: 170, scale: 0.56, duration: duration(0.38), ease: 'power2.inOut' }, time(0.5))
      .set(postcardObject.current, { autoAlpha: 0 }, time(0.88));
    setFlipped(false);
  });

  const flipCard = owned(() => {
    if (busyRef.current || phaseRef.current !== 'POSTCARD') return;
    play('tap');
    const nextSide = !flipped;
    setFlipped(nextSide);
    const next = createTimeline(() => focusEl('.v6a-postcard-object'));
    next
      .to(postcardObject.current, { y: -12, rotation: -0.5, duration: duration(0.18), ease: 'power2.out' }, 0)
      .to(postcardInner.current, { rotateY: nextSide ? 180 : 0, duration: duration(0.62), ease: 'power2.inOut' }, time(0.02))
      .to(postcardObject.current, { y: 0, rotation: -2, duration: duration(0.24), ease: 'power2.out' }, time(0.44));
  });

  // Animation 6: Slide postcard into solid collection sleeve & press digital stamp
  const keepCard = owned(() => {
    if (busyRef.current || phaseRef.current !== 'POSTCARD' || !postcard) return;
    play('stamp');
    const next = createTimeline(() => {
      changePhase('COMPLETE');
      focusEl('.v6a-complete-copy h1');
    });
    next
      .to(all('.v6a-postcard-ui'), { autoAlpha: 0, duration: duration(0.18) }, 0)
      .set(all('.v6a-collection'), { autoAlpha: 1 }, 0)
      .set(query('.v6a-collect-stamp'), { autoAlpha: 0 }, 0)
      .set(query('.v6a-kept-front'), { y: 210 }, 0)
      .set(query('.v6a-kept-back'), { y: 210 }, 0)
      .set(query('.v6a-complete-copy'), { autoAlpha: 0, y: 20 }, 0)
      .to(postcardInner.current, { rotateY: 0, duration: duration(0.4), ease: 'power2.inOut' }, 0)
      .to(postcardObject.current, { x: -290, y: -18, scale: 0.72, rotation: -4, duration: duration(0.75), ease: 'power3.inOut' }, time(0.08))
      .to(query('.v6a-kept-back'), { y: 0, duration: duration(0.6), ease: 'power3.out' }, time(0.32))
      .to(query('.v6a-kept-front'), { y: 0, duration: duration(0.6), ease: 'power3.out' }, time(0.32))
      .to(postcardObject.current, { y: 10, duration: duration(0.45), ease: 'power2.inOut' }, time(0.8))
      .to(envelope.current, { y: 790, duration: duration(0.65), ease: 'power3.inOut' }, time(0.28))
      .to(query('.v6a-complete-copy'), { autoAlpha: 1, y: 0, duration: duration(0.45), ease: 'power3.out' }, time(0.95))
      .fromTo(
        query('.v6a-collect-stamp'),
        { autoAlpha: 0, y: -62, scale: 1.16, rotation: -14 },
        { autoAlpha: 1, y: 0, scale: 1, rotation: -8, duration: duration(0.3), ease: 'power3.inOut' },
        time(1.22)
      )
      .to(query('.v6a-collect-stamp'), { scale: 0.96, duration: duration(0.1) }, time(1.52))
      .to(query('.v6a-collect-stamp'), { scale: 1, duration: duration(0.18), ease: 'power2.out' }, time(1.62));
  });

  const changeFilter = owned((nextSchool: 'all' | SchoolId, nextBatch: number = 0) => {
    if (phaseRef.current !== 'DISCOVER') return;
    if (busyRef.current) {
      pendingFilter.current = { school: nextSchool, batch: nextBatch };
      return;
    }
    if (nextSchool === groupRef.current.school && nextBatch === groupRef.current.batch) return;
    play('tap');
    pendingFilter.current = null;
    const next = createTimeline(() => {
      markBusy(true);
      groupRef.current = { school: nextSchool, batch: nextBatch };
      flushSync(() => {
        setSchool(nextSchool);
        setBatch(nextBatch);
        setPicked(null);
      });
      selectedRef.current = null;
      const nodes = all('.v6a-event');
      if (!nodes.length) {
        markBusy(false);
        return;
      }
      gsap.set(nodes, { x: 0, y: 240, rotation: 0, scale: 1, autoAlpha: 1 });
      const entrance = gsap.timeline({
        onComplete: () => {
          markBusy(false);
          const pending = pendingFilter.current;
          pendingFilter.current = null;
          if (pending && (pending.school !== nextSchool || pending.batch !== nextBatch)) {
            changeFilter(pending.school, pending.batch);
          }
        },
      });
      timeline.current = entrance;
      entrance.to(nodes, {
        x: (index: number) => pose(index, nodes.length).x,
        y: (index: number) => pose(index, nodes.length).y,
        rotation: (index: number) => pose(index, nodes.length).rotation,
        duration: duration(0.65),
        stagger: duration(0.07),
        ease: 'power3.out',
      });
    });
    const leaving = all('.v6a-event');
    if (leaving.length) {
      next.to(leaving, { x: 0, y: 240, rotation: 0, scale: 1, duration: duration(0.36), stagger: duration(0.04), ease: 'power2.inOut' });
    } else {
      next.to({}, { duration: 0.01 });
    }
  });

  return (
    <section className="v6a" ref={root} data-phase={phase} data-busy={busy} aria-label="A 屏幕探索">
      <HomeHub active={atHome && phase === 'IDLE'} onNavigate={onNavigate} />

      {/* Discover header & Chinese-only school filters */}
      <div className="v6a-discover-ui v6a-discover-head">
        <h1 tabIndex={-1}>今天，想遇见哪一所校园？</h1>
      </div>
      <nav
        className="v6a-discover-ui v6a-filters"
        aria-label="按学校筛选"
        inert={phase !== 'DISCOVER' ? true : undefined}
      >
        <button aria-pressed={school === 'all'} onClick={() => changeFilter('all')}>
          <span className="v6a-filter-leaf" aria-hidden="true" />
          全部来信
        </button>
        {schools.map((item) => (
          <button
            key={item.id}
            aria-pressed={school === item.id}
            onClick={() => changeFilter(item.id)}
            style={{ '--school-dot': item.accent } as React.CSSProperties}
          >
            <span className="v6a-filter-leaf is-school" aria-hidden="true" />
            {item.name}
            <small>{item.flower}</small>
          </button>
        ))}
      </nav>

      {/* Shared Envelope Stage (Preserved V5 continuous DOM object) */}
      <div className="v6a-envelope" ref={envelope}>
        <div className="v6a-envelope-shadow" />
        <div className="v6a-envelope-back" />
        <div className="v6a-envelope-lining">
          <BotanicalSpray variant={2} />
          <BotanicalSpray variant={1} />
        </div>

        <div className="v6a-envelope-flap" ref={flap}>
          <div className="v6a-flap-front" aria-hidden="true">
            <svg viewBox="0 0 1040 300" preserveAspectRatio="none" aria-hidden="true">
              <path d="M4 0h1032L520 300 4 0Z" fill="#FAF5E8" stroke="#AEB598" strokeWidth="1.8" />
              <path d="M18 5h1004L520 287 18 5Z" fill="none" stroke="#DAD7BE" />
            </svg>
            <div className="v6a-cover">
              <span>德智树下 · 三校来信</span>
              <strong>校园来信</strong>
            </div>
          </div>
          <div className="v6a-flap-back">
            <svg viewBox="0 0 1040 300" preserveAspectRatio="none" aria-hidden="true">
              <path d="M4 0h1032L520 300 4 0Z" fill="#DCE2CB" stroke="#AAB596" strokeWidth="1.8" />
              <path d="M25 5h990L520 280 25 5Z" fill="none" stroke="#F4F0DF" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Small event envelopes fanning out from pocket */}
        <div
          className="v6a-fan"
          hidden={phase === 'IDLE'}
          aria-hidden={phase !== 'DISCOVER'}
          inert={phase !== 'DISCOVER' ? true : undefined}
          onPointerLeave={(e) => {
            if (e.pointerType === 'mouse' && performance.now() - lastTouch.current > 900) arrange(null);
          }}
        >
          {shown.map((item, index) => {
            const sc = getSchool(item.schoolId);
            return (
              <div
                className={`v6a-event${picked === item.id ? ' is-picked' : ''}`}
                data-event={item.id}
                key={item.id}
              >
                <div className="v6a-event-back" />
                <div className="v6a-event-paper">
                  <div className="v6a-event-illustration">
                    <EventVignette kind={item.coverKey} />
                  </div>
                  <span className="v6a-event-school" style={{ color: sc.ink }}>
                    {sc.name}
                  </span>
                  <h2>{item.title}</h2>
                  <div className="v6a-event-bottom">
                    <span>{item.category}</span>
                    <time>{dateLabel(item)}</time>
                  </div>
                  <BotanicalSpray className="v6a-event-botanical" variant={index} />
                  <span className="v6a-event-invite">打开来信 →</span>
                  <svg className="v6a-small-pocket" viewBox="0 0 280 112" preserveAspectRatio="none" aria-hidden="true">
                    <path d="M0 0 140 66 280 0v112H0Z" fill="#F7EFDD" stroke="#C4C9AC" strokeWidth="1.2" />
                    <path d="M5 10 140 73 275 10" fill="none" stroke="#FFFBF0" strokeWidth="2" />
                  </svg>
                </div>
                <button
                  className="v6a-event-hit"
                  aria-label={`${item.title}，${sc.name}，${dateLabel(item)}`}
                  aria-pressed={picked === item.id}
                  onPointerDown={(e) => {
                    if (e.pointerType === 'touch') lastTouch.current = performance.now();
                  }}
                  onPointerEnter={(e) => {
                    if (e.pointerType === 'mouse' && performance.now() - lastTouch.current > 900) arrange(item.id);
                  }}
                  onFocus={(e) => {
                    if (e.currentTarget.matches(':focus-visible') && performance.now() - lastTouch.current > 900) {
                      arrange(item.id);
                    }
                  }}
                  onClick={(e) =>
                    selectEvent(
                      item,
                      e.detail === 0
                        ? 'keyboard'
                        : e.nativeEvent instanceof PointerEvent && e.nativeEvent.pointerType === 'touch'
                          ? 'touch'
                          : 'mouse'
                    )
                  }
                />
              </div>
            );
          })}
        </div>

        <div className="v6a-pocket">
          <svg viewBox="0 0 1040 560" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 0 520 160 1040 0v548q0 12-12 12H12Q0 560 0 548Z" fill="#F8F1DF" stroke="#B1B69B" strokeWidth="1.8" />
            <path d="M12 18 520 177 1028 18" fill="none" stroke="#FFFBEF" strokeWidth="3" />
          </svg>
          <BotanicalSpray className="v6a-pocket-botanical" variant={0} />
          <MacauTileBorder className="v6a-pocket-tile" bg="#1F4B4A" stroke="#FAF5E8" accent="#EFE5A8" />
        </div>

        <div className="v6a-seal" ref={seal}>
          <div className="v6a-seal-tail" aria-hidden="true" />
          <div className="v6a-seal-head" aria-hidden="true"><span>花</span></div>
        </div>
        <button
          className="v6a-open"
          onClick={openEnvelope}
          disabled={phase !== 'IDLE'}
          aria-label={atHome ? 'A 屏幕探索：轻触拆开校园来信' : '打开校园来信'}
        >
          <span className="v6a-open-hint">轻触封签 <b aria-hidden="true">↗</b></span>
        </button>
      </div>

      {/* Dock footer & pagination in DISCOVER */}
      <div className="v6a-discover-ui v6a-dock-label" inert={phase !== 'DISCOVER' ? true : undefined}>
        <span>{picked ? '轻触展开' : '挑一封来信'}</span>
        {available.length > PAGE_SIZE && (
          <div className="v6a-pager">
            <button aria-label="上一组活动" disabled={batch === 0} onClick={() => changeFilter(school, batch - 1)}>
              ←
            </button>
            <span>
              {batch + 1} / {Math.ceil(available.length / PAGE_SIZE)}
            </span>
            <button
              aria-label="下一组活动"
              disabled={(batch + 1) * PAGE_SIZE >= available.length}
              onClick={() => changeFilter(school, batch + 1)}
            >
              →
            </button>
          </div>
        )}
      </div>

      {/* Activity Detail Sheet (DETAIL) */}
      <section className="v6a-letter" ref={letter} inert={phase !== 'DETAIL' || busy ? true : undefined} aria-label="活动详情">
        <div className="v6a-letter-layout">
          <button className="v6-btn-secondary v6a-letter-back" onClick={closeLetter}>
            ← 放回活动来信
          </button>
          {current && currentSchool && (
            <>
              <div className="v6a-letter-art">
                <img className="v6a-letter-card-preview" src={currentSchool.frontImage} alt={`${currentSchool.name}${currentSchool.flower}明信片预览`} />
                <span className="v6a-letter-cat">{current.category} · {currentSchool.flower}</span>
              </div>
              <div className="v6a-letter-copy">
                <div className="v6a-letter-meta-top">
                  <span className="v6a-eyebrow" style={{ color: currentSchool.ink }}>
                    {currentSchool.name}
                  </span>
                  <small className="v6a-event-notice">演示活动</small>
                </div>
                <h1 className="v6a-sheet-title" tabIndex={-1}>
                  {current.title}
                </h1>
                <dl>
                  <div>
                    <dt>活动时间</dt>
                    <dd>
                      {dateLabel(current)} · {timeLabel(current)}
                    </dd>
                  </div>
                  <div>
                    <dt>活动地点</dt>
                    <dd>{current.location}</dd>
                  </div>
                </dl>
                <div className="v6a-letter-description">
                  {current.description.split('\n').map((text) => (
                    <p key={text}>{text}</p>
                  ))}
                </div>
                <div className="v6a-letter-actions">
                  <button className="v6-btn-primary" onClick={takePostcard} disabled={!postcard}>
                    {postcard ? '翻阅对应三校明信片' : '明信片准备中'} <span>→</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Postcard 3D Flip Stage (POSTCARD) using authentic A6 front/back artwork */}
      <div className="v6a-postcard-ui v6a-postcard-head">
        <span className="v6a-eyebrow">{currentSchool?.name} · {currentSchool?.flower}</span>
        <h1>轻触明信片翻看正反面</h1>
      </div>

      <button
        className="v6a-postcard-object"
        ref={postcardObject}
        onClick={flipCard}
        disabled={phase !== 'POSTCARD' || busy}
        tabIndex={phase === 'POSTCARD' ? 0 : -1}
        aria-label={`明信片${flipped ? '背面' : '正面'}，点击翻面`}
        aria-pressed={flipped}
      >
        <div className="v6a-postcard-inner" ref={postcardInner}>
          <div className="v6a-postcard-face" aria-hidden={flipped}>
            {postcard && (
              <img className="v6a-postcard-img" src={postcard.frontImage} alt={`${postcard.subtitle} 正面`} />
            )}
          </div>
          <div className="v6a-postcard-face v6a-postcard-back" aria-hidden={!flipped}>
            {postcard && (
              <>
                <img className="v6a-postcard-img" src={postcard.backImage} alt={`${postcard.subtitle} 背面`} />
                <div className="v6a-postcard-overlay-note">
                  <strong>{current?.title}</strong>
                  <p>{postcard.postcardText}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </button>

      <div className="v6a-postcard-ui v6a-postcard-actions" inert={phase !== 'POSTCARD' ? true : undefined}>
        <button className="v6-btn-secondary" onClick={backPostcard} disabled={busy}>
          ← 返回活动详情
        </button>
        <div>
          <button className="v6-btn-secondary" onClick={flipCard} disabled={busy}>
            翻到{flipped ? '正' : '背'}面 ↻
          </button>
          <button className="v6-btn-primary" onClick={keepCard}>
            完成数字收藏 <span>→</span>
          </button>
        </div>
      </div>

      {/* Collection Sleeve & Stamp (COMPLETE) + Route C / Route D bridges */}
      <div className="v6a-collection v6a-kept-back">
        <MacauTileBorder className="v6a-kept-tile" bg={currentSchool?.ink ?? '#1F4B4A'} stroke="#FAF5E8" accent="#EFE5A8" />
      </div>
      <div className="v6a-collection v6a-kept-front">
        <div />
        <span>拾花一叶 · 已数字收藏</span>
      </div>
      <div className="v6a-collection v6a-collect-stamp">
        已数字收藏<span>✦</span>
      </div>

      <section
        className="v6a-collection v6a-complete-copy"
        inert={phase !== 'COMPLETE' ? true : undefined}
        aria-label="数字收藏完成"
      >
        <h1 tabIndex={-1}>
          愿这朵{currentSchool?.flower ?? '花叶'}，
          <br />
          替你留住今天。
        </h1>
        <div className="v6a-complete-event">
          <strong>{current?.title}</strong>
          <span>
            {current ? schoolName(current.schoolId) : ''} · {current ? dateLabel(current) : ''}
          </span>
        </div>
        <div className="v6a-complete-bridges">
          <button className="v6-btn-accent" onClick={() => onNavigate('leaf-drop')}>
            进一步去领实体卡（C）→
          </button>
          <button
            className="v6-btn-primary"
            onClick={() =>
              onNavigate('post-office', {
                postcardId: current ? `po-school-${current.schoolId}` : undefined,
              })
            }
          >
            去时光邮局寄给未来（D）→
          </button>
        </div>
        <div className="v6a-complete-foot">
          <button className="v6-btn-text" onClick={() => onNavigate('home')}>
            重新拆开校园来信
          </button>
        </div>
      </section>
    </section>
  );
}
