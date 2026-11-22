import { useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { flushSync } from 'react-dom';
import gsap from 'gsap';
import { dateLabel, events, postcards, schools, schoolName, sessionConfig, timeLabel } from '../data';
import type { CampusEvent } from '../data';
import { Botanical, BrandMark, Breeze, EventArt, Leaf, PostcardVisual } from './art';
import './experience.css';

gsap.registerPlugin(useGSAP);
type Phase = 'IDLE' | 'OPENING' | 'DISCOVER' | 'DETAIL' | 'POSTCARD' | 'COMPLETE' | 'RESETTING';
const DOCK = 385;
const PAGE_SIZE = 3;

export function Experience() {
  const root = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const envelope = useRef<HTMLDivElement>(null);
  const flap = useRef<HTMLDivElement>(null);
  const seal = useRef<HTMLDivElement>(null);
  const letter = useRef<HTMLElement>(null);
  const postcardObject = useRef<HTMLButtonElement>(null);
  const postcardInner = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const openButton = useRef<HTMLButtonElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const gust = useRef<gsap.core.Timeline | null>(null);
  const gustDelay = useRef<gsap.core.Tween | null>(null);
  const hoverTweens = useRef<gsap.core.Tween[]>([]);
  const phaseRef = useRef<Phase>('IDLE');
  const busyRef = useRef(false);
  const selectedRef = useRef<string | null>(null);
  const reduceRef = useRef(matchMedia('(prefers-reduced-motion: reduce)').matches);
  const lastActivity = useRef(Date.now());
  const warnedAt = useRef<number | null>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const pendingFilter = useRef<{ school: string; batch: number } | null>(null);
  const groupRef = useRef({ school: 'all', batch: 0 });
  const gustCount = useRef(0);
  const lastTouch = useRef(0);
  const [phase, setPhase] = useState<Phase>('IDLE');
  const [busy, setBusy] = useState(false);
  const [school, setSchool] = useState('all');
  const [batch, setBatch] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [warning, setWarning] = useState(false);
  const [seconds, setSeconds] = useState(15);
  const available = events.filter(item => item.status !== 'ended' && (school === 'all' || item.schoolId === school));
  const shown = available.slice(batch * PAGE_SIZE, (batch + 1) * PAGE_SIZE);
  const current = events.find(item => item.id === currentId) ?? null;
  const postcard = postcards.find(item => item.id === current?.postcardId && item.eventId === current?.id);
  const query = <T extends Element = HTMLElement>(selector: string) => root.current?.querySelector<T>(selector) ?? null;
  const all = <T extends Element = HTMLElement>(selector: string) => Array.from(root.current?.querySelectorAll<T>(selector) ?? []);
  const duration = (value: number) => reduceRef.current ? 0.01 : value;
  const time = (value: number) => reduceRef.current ? value * 0.12 : value;
  const markBusy = (value: boolean) => { busyRef.current = value; setBusy(value); };
  const changePhase = (value: Phase) => { phaseRef.current = value; setPhase(value); };
  const focus = (selector: string) => requestAnimationFrame(() => query<HTMLElement>(selector)?.focus({ preventScroll: true }));
  const killHover = () => { hoverTweens.current.forEach(tween => tween.kill()); hoverTweens.current = []; };
  const pose = (index: number, total: number, selected: number = -1) => {
    const offset = index - (total - 1) / 2;
    const away = selected >= 0 && selected !== index ? (index < selected ? -22 : 22) : 0;
    return { x: offset * 290 + away, y: -234 + Math.abs(offset) * 22 - (index === selected ? 10 : 0), rotation: offset * 7 + away * 0.06, scale: index === selected ? 1.035 : 1, zIndex: index === selected ? 7 : 5 - Math.abs(offset) };
  };
  const stopWind = () => {
    gustDelay.current?.kill();
    gust.current?.kill();
    gsap.set(all('.v5-falling-leaf, .v5-breeze'), { autoAlpha: 0 });
  };

  const { context } = useGSAP(() => {
    const resize = () => root.current?.style.setProperty('--stage-scale', String(Math.min(innerWidth / 1440, innerHeight / 810)));
    resize();
    window.addEventListener('resize', resize);
    const shell = document.getElementById('first-frame');
    if (shell) {
      shell.style.pointerEvents = 'none';
      shell.remove();
    }
    gsap.set(all('.v5-event'), { x: 0, y: 170, rotation: 0, scale: 1 });
    gsap.set(all('.v5-discover-ui, .v5-letter, .v5-postcard-ui, .v5-postcard-object, .v5-collection'), { autoAlpha: 0 });
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const onReduce = () => { reduceRef.current = media.matches; if (media.matches) stopWind(); };
    media.addEventListener('change', onReduce);
    const visibility = () => {
      if (document.hidden) { timeline.current?.pause(); gust.current?.pause(); gustDelay.current?.pause(); }
      else { timeline.current?.resume(); gust.current?.resume(); gustDelay.current?.resume(); }
    };
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.removeEventListener('resize', resize);
      media.removeEventListener('change', onReduce);
      document.removeEventListener('visibilitychange', visibility);
      timeline.current?.kill(); stopWind(); killHover();
    };
  }, { scope: root });

  const owned = <Arguments extends unknown[]>(callback: (...args: Arguments) => void) => (...args: Arguments) => context.ignore(() => callback(...args));

  const playWind = owned(() => {
    if (phaseRef.current !== 'IDLE' || reduceRef.current) return;
    gust.current?.kill();
    gustCount.current += 1;
    if (root.current) root.current.dataset.gusts = String(gustCount.current);
    const next = gsap.timeline({ onComplete: () => { gustDelay.current = gsap.delayedCall(gustCount.current < 3 ? 1.3 : 4.5, playWind); } });
    gust.current = next;
    next.fromTo(all('.v5-breeze'), { autoAlpha: 0, x: -180 }, { autoAlpha: 0.9, x: 20, duration: 1.15, ease: 'sine.out' }, 0)
      .to(all('.v5-breeze'), { autoAlpha: 0, x: 380, duration: 1.55, ease: 'sine.inOut' }, 1.15);
    all('.v5-falling-leaf').forEach((leaf, index) => {
      const delay = index * 0.18;
      next.fromTo(leaf, { x: -100 - index * 35, y: 210 + index * 95, autoAlpha: 0, rotation: -40, scale: 0.7 + index * 0.13 }, { autoAlpha: 1, duration: 0.3 }, delay)
        .to(leaf, { x: 480, y: 270 + index * 60, rotation: 70, duration: 1.0, ease: 'sine.out' }, delay)
        .to(leaf, { x: 980, y: 360 + index * 40, rotation: 200, duration: 1.15, ease: 'sine.inOut' }, delay + 1)
        .to(leaf, { x: 1540, y: 470 + index * 20, rotation: 350, autoAlpha: 0, duration: 1.0, ease: 'sine.in' }, delay + 2.15);
    });
    next.to(query('.v5-seal-tail'), { rotateX: -50, rotateZ: 6, duration: 0.45, ease: 'sine.out' }, 0.7)
      .to(query('.v5-seal-shadow'), { autoAlpha: 0.35, scale: 1.12, duration: 0.45 }, 0.7)
      .to(query('.v5-seal-tail'), { rotateX: -24, rotateZ: -2, duration: 0.5, ease: 'sine.inOut' }, 1.15)
      .to(query('.v5-seal-tail'), { rotateX: 0, rotateZ: 0, duration: 1.0, ease: 'elastic.out(0.7,0.6)' }, 1.65)
      .to(query('.v5-seal-shadow'), { autoAlpha: 0, duration: 0.8 }, 1.65);
  });

  useEffect(() => {
    if (phase === 'IDLE' && !reduceRef.current) gustDelay.current = gsap.delayedCall(0.8, playWind);
    return stopWind;
  }, [phase]);

  const createTimeline = (complete: () => void) => {
    timeline.current?.kill(); killHover(); markBusy(true);
    const next = gsap.timeline({ onComplete: () => { markBusy(false); lastActivity.current = Date.now(); complete(); } });
    timeline.current = next;
    return next;
  };

  const open = owned(() => {
    if (busyRef.current || phaseRef.current !== 'IDLE') return;
    stopWind(); changePhase('OPENING');
    const next = createTimeline(() => { changePhase('DISCOVER'); focus('.v5-discover-head h1'); });
    next.to(query('.v5-open-hint'), { autoAlpha: 0, duration: duration(0.18) }, 0)
      .to(query('.v5-seal-tail'), { rotateX: -65, rotateZ: 7, duration: duration(0.25), ease: 'power2.out' }, 0)
      .to(seal.current, { y: -35, rotation: -9, duration: duration(0.32), ease: 'power2.out' }, time(0.18))
      .to(seal.current, { x: 80, y: 190, rotation: 28, autoAlpha: 0, duration: duration(0.5), ease: 'power2.inOut' }, time(0.45))
      .to(flap.current, { rotateX: -86, transformPerspective: 1400, duration: duration(0.45), ease: 'power2.inOut' }, time(0.35))
      .set(flap.current, { zIndex: 2 }, time(0.8))
      .to(flap.current, { rotateX: -172, duration: duration(0.5), ease: 'power2.inOut' }, time(0.8))
      .to(envelope.current, { y: DOCK, duration: duration(1.15), ease: 'power3.inOut' }, time(1.05))
      .to(flap.current, { rotateX: -270, duration: duration(0.75), ease: 'power2.inOut' }, time(1.35))
      .set(all('.v5-event'), { x: 0, y: 230, rotation: 0, scale: 1 }, time(2.1))
      .to(all('.v5-event'), { y: -228, duration: duration(0.75), stagger: duration(0.19), ease: 'power3.out' }, time(2.2))
      .to(all('.v5-event'), { ...pose(0, shown.length), x: (index: number) => pose(index, shown.length).x, y: (index: number) => pose(index, shown.length).y, rotation: (index: number) => pose(index, shown.length).rotation, zIndex: (index: number) => pose(index, shown.length).zIndex, duration: duration(0.72), stagger: duration(0.09), ease: 'power3.inOut' }, time(2.8))
      .to(all('.v5-discover-ui'), { autoAlpha: 1, duration: duration(0.35) }, time(2.6));
  });

  useEffect(() => {
    if ((window as Window & { __v5WantOpen?: boolean }).__v5WantOpen) {
      (window as Window & { __v5WantOpen?: boolean }).__v5WantOpen = false;
      open();
    }
  }, []);

  const arrange = owned((id: string | null) => {
    if (busyRef.current || phaseRef.current !== 'DISCOVER') return;
    selectedRef.current = id; setPicked(id); killHover();
    const index = shown.findIndex(item => item.id === id);
    all('.v5-event').forEach((node, position) => hoverTweens.current.push(gsap.to(node, { ...pose(position, shown.length, index), duration: duration(0.28), ease: 'power3.out', overwrite: 'auto' })));
  });

  const selectEvent = owned((item: CampusEvent, pointer: 'mouse' | 'touch' | 'keyboard') => {
    if (busyRef.current || phaseRef.current !== 'DISCOVER') return;
    if (pointer === 'touch' && selectedRef.current !== item.id) { arrange(item.id); return; }
    flushSync(() => { setCurrentId(item.id); setPicked(item.id); });
    selectedRef.current = item.id;
    const chosen = query(`[data-event="${item.id}"]`);
    const others = all('.v5-event').filter(node => node !== chosen);
    const next = createTimeline(() => { changePhase('DETAIL'); focus('.v5-sheet-title'); });
    next.to(all('.v5-discover-ui'), { autoAlpha: 0, duration: duration(0.2) }, 0)
      .to(others, { y: 240, rotation: 0, duration: duration(0.48), stagger: duration(0.04), ease: 'power2.inOut' }, 0)
      .to(chosen, { x: 0, y: -283, rotation: 0, scale: 1, duration: duration(0.6), ease: 'power3.inOut' }, 0)
      .set(query('.v5-letter-layout'), { autoAlpha: 0 }, 0)
      .set(letter.current, { autoAlpha: 1, x: 0, y: -1, scaleX: 280 / 960, scaleY: 380 / 558 }, time(0.61))
      .set(chosen, { autoAlpha: 0 }, time(0.62))
      .to(letter.current, { y: 0, scaleX: 1, scaleY: 1, duration: duration(0.65), ease: 'power3.inOut' }, time(0.63))
      .to(envelope.current, { y: 560, duration: duration(0.65), ease: 'power3.inOut' }, time(0.63))
      .to(query('.v5-letter-layout'), { autoAlpha: 1, duration: duration(0.27) }, time(1.02));
  });

  const closeLetter = owned(() => {
    if (busyRef.current || phaseRef.current !== 'DETAIL') return;
    const chosen = query(`[data-event="${currentId}"]`);
    const selected = shown.findIndex(item => item.id === currentId);
    const next = createTimeline(() => { changePhase('DISCOVER'); focus(`[data-event="${currentId}"] button`); });
    next.to(query('.v5-letter-layout'), { autoAlpha: 0, duration: duration(0.18) }, 0)
      .to(envelope.current, { y: DOCK, duration: duration(0.65), ease: 'power3.inOut' }, 0)
      .to(letter.current, { y: -1, scaleX: 280 / 960, scaleY: 380 / 558, duration: duration(0.6), ease: 'power3.inOut' }, 0)
      .set(chosen, { x: 0, y: -283, rotation: 0, scale: 1, autoAlpha: 1 }, time(0.61))
      .set(letter.current, { autoAlpha: 0 }, time(0.62))
      .to(all('.v5-event'), { x: (index: number) => pose(index, shown.length, selected).x, y: (index: number) => pose(index, shown.length, selected).y, rotation: (index: number) => pose(index, shown.length, selected).rotation, scale: (index: number) => pose(index, shown.length, selected).scale, zIndex: (index: number) => pose(index, shown.length, selected).zIndex, duration: duration(0.65), stagger: duration(0.04), ease: 'power3.inOut' }, time(0.63))
      .to(all('.v5-discover-ui'), { autoAlpha: 1, duration: duration(0.32) }, time(0.83));
  });

  const takePostcard = owned(() => {
    if (busyRef.current || !postcard) return;
    setFlipped(false);
    const next = createTimeline(() => { changePhase('POSTCARD'); focus('.v5-postcard-object'); });
    next.set(postcardObject.current, { autoAlpha: 1, x: 0, y: 180, rotation: 0, scale: 0.55, zIndex: 24 }, 0)
      .set(postcardInner.current, { rotateY: 0 }, 0)
      .to(postcardObject.current, { y: -30, scale: 0.72, duration: duration(0.55), ease: 'power3.out' }, 0)
      .to(letter.current, { y: 540, duration: duration(0.7), ease: 'power3.inOut' }, time(0.23))
      .set(postcardObject.current, { zIndex: 26 }, time(0.65))
      .to(postcardObject.current, { y: 0, scale: 1, rotation: -3, duration: duration(0.55), ease: 'power3.inOut' }, time(0.65))
      .set(letter.current, { autoAlpha: 0 }, time(1.0))
      .to(all('.v5-postcard-ui'), { autoAlpha: 1, duration: duration(0.3) }, time(0.95));
  });

  const backPostcard = owned(() => {
    if (busyRef.current || phaseRef.current !== 'POSTCARD') return;
    const next = createTimeline(() => { changePhase('DETAIL'); focus('.v5-sheet-title'); });
    next.to(all('.v5-postcard-ui'), { autoAlpha: 0, duration: duration(0.2) }, 0)
      .to(postcardInner.current, { rotateY: 0, duration: duration(0.35), ease: 'power2.inOut' }, 0)
      .to(postcardObject.current, { y: -30, scale: 0.72, rotation: 0, duration: duration(0.45), ease: 'power3.inOut' }, 0)
      .set(letter.current, { autoAlpha: 1 }, time(0.1))
      .to(letter.current, { y: 0, duration: duration(0.6), ease: 'power3.inOut' }, time(0.1))
      .set(postcardObject.current, { zIndex: 24 }, time(0.55))
      .to(postcardObject.current, { y: 180, scale: 0.55, duration: duration(0.4), ease: 'power2.inOut' }, time(0.55))
      .set(postcardObject.current, { autoAlpha: 0 }, time(0.96));
    setFlipped(false);
  });

  const flip = owned(() => {
    if (busyRef.current || phaseRef.current !== 'POSTCARD') return;
    const nextSide = !flipped; setFlipped(nextSide);
    const next = createTimeline(() => focus('.v5-postcard-object'));
    next.to(postcardObject.current, { y: -12, rotation: -1, duration: duration(0.2), ease: 'power2.out' }, 0)
      .to(postcardInner.current, { rotateY: nextSide ? 180 : 0, duration: duration(0.64), ease: 'power2.inOut' }, time(0.02))
      .to(postcardObject.current, { y: 0, rotation: -3, duration: duration(0.27), ease: 'power2.out' }, time(0.45));
  });

  const keep = owned(() => {
    if (phaseRef.current !== 'POSTCARD' || !postcard) return;
    const next = createTimeline(() => { changePhase('COMPLETE'); focus('.v5-complete-copy h1'); });
    next.to(all('.v5-postcard-ui'), { autoAlpha: 0, duration: duration(0.2) }, 0)
      .set(all('.v5-collection'), { autoAlpha: 1 }, 0)
      .set(query('.v5-collect-stamp'), { autoAlpha: 0 }, 0)
      .set(query('.v5-kept-front'), { y: 210 }, 0)
      .set(query('.v5-kept-back'), { y: 210 }, 0)
      .set(query('.v5-complete-copy'), { autoAlpha: 0, y: 20 }, 0)
      .to(postcardInner.current, { rotateY: 0, duration: duration(0.45), ease: 'power2.inOut' }, 0)
      .to(postcardObject.current, { x: -285, y: -25, scale: 0.72, rotation: -5, duration: duration(0.8), ease: 'power3.inOut' }, time(0.1))
      .to(query('.v5-kept-back'), { y: 0, duration: duration(0.65), ease: 'power3.out' }, time(0.35))
      .to(query('.v5-kept-front'), { y: 0, duration: duration(0.65), ease: 'power3.out' }, time(0.35))
      .to(postcardObject.current, { y: 8, duration: duration(0.5), ease: 'power2.inOut' }, time(0.85))
      .to(envelope.current, { y: 790, duration: duration(0.7), ease: 'power3.inOut' }, time(0.3))
      .to(query('.v5-complete-copy'), { autoAlpha: 1, y: 0, duration: duration(0.5), ease: 'power3.out' }, time(1.02))
      .fromTo(query('.v5-collect-stamp'), { autoAlpha: 0, y: -65, scale: 1.16, rotation: -14 }, { autoAlpha: 1, y: 0, scale: 1, rotation: -8, duration: duration(0.32), ease: 'power3.inOut' }, time(1.3))
      .to(query('.v5-collect-stamp'), { scale: 0.97, duration: duration(0.1) }, time(1.62))
      .to(query('.v5-collect-stamp'), { scale: 1, duration: duration(0.2), ease: 'power2.out' }, time(1.72));
  });

  const reset = owned(() => {
    stopWind(); pendingFilter.current = null; warnedAt.current = null; setWarning(false);
    if (phaseRef.current === 'IDLE') return;
    changePhase('RESETTING');
    const next = createTimeline(() => {
      flushSync(() => { setCurrentId(null); setSchool('all'); setBatch(0); setPicked(null); setFlipped(false); });
      selectedRef.current = null; gustCount.current = 0; groupRef.current = { school: 'all', batch: 0 };
      gsap.set(all('.v5-event'), { autoAlpha: 1, x: 0, y: 170, scale: 1, rotation: 0 });
      gsap.set(seal.current, { autoAlpha: 1, x: 0, y: 0, rotation: 0 });
      gsap.set(query('.v5-seal-tail'), { rotateX: 0, rotateZ: 0 });
      gsap.set(query('.v5-open-hint'), { autoAlpha: 1 });
      changePhase('IDLE'); focus('.v5-open');
    });
    next.to(all('.v5-discover-ui, .v5-postcard-ui, .v5-complete-copy'), { autoAlpha: 0, duration: duration(0.2) }, 0)
      .to(all('.v5-event'), { y: 170, x: 0, rotation: 0, scale: 1, duration: duration(0.45), ease: 'power2.inOut' }, 0)
      .to(letter.current, { y: 650, duration: duration(0.5), ease: 'power3.inOut' }, 0)
      .to(postcardObject.current, { y: 620, duration: duration(0.5), ease: 'power3.inOut' }, 0)
      .to(all('.v5-kept-front, .v5-kept-back, .v5-collect-stamp'), { y: 650, duration: duration(0.6), ease: 'power3.inOut' }, 0)
      .set(all('.v5-letter, .v5-postcard-object, .v5-collection'), { autoAlpha: 0 }, time(0.62))
      .to(envelope.current, { y: 0, rotation: 0, duration: duration(1.0), ease: 'power3.inOut' }, time(0.35))
      .to(flap.current, { rotateX: -86, duration: duration(0.65), ease: 'power2.inOut' }, time(0.6))
      .set(flap.current, { zIndex: 9 }, time(1.25))
      .to(flap.current, { rotateX: 0, duration: duration(0.5), ease: 'power2.inOut' }, time(1.25))
      .to(seal.current, { x: 0, y: 0, rotation: 0, autoAlpha: 1, duration: duration(0.3) }, time(1.55));
  });

  const changeFilter = owned((nextSchool: string, nextBatch: number = 0) => {
    if (phaseRef.current !== 'DISCOVER') return;
    if (busyRef.current) { pendingFilter.current = { school: nextSchool, batch: nextBatch }; return; }
    if (nextSchool === groupRef.current.school && nextBatch === groupRef.current.batch) return;
    pendingFilter.current = null;
    const next = createTimeline(() => {
      markBusy(true);
      groupRef.current = { school: nextSchool, batch: nextBatch };
      flushSync(() => { setSchool(nextSchool); setBatch(nextBatch); setPicked(null); });
      selectedRef.current = null;
      const nodes = all('.v5-event');
      if (!nodes.length) { markBusy(false); return; }
      gsap.set(nodes, { x: 0, y: 240, rotation: 0, scale: 1, autoAlpha: 1 });
      const entrance = gsap.timeline({ onComplete: () => {
        markBusy(false);
        const pending = pendingFilter.current; pendingFilter.current = null;
        if (pending && (pending.school !== nextSchool || pending.batch !== nextBatch)) changeFilter(pending.school, pending.batch);
      } });
      timeline.current = entrance;
      entrance.to(nodes, { x: (index: number) => pose(index, nodes.length).x, y: (index: number) => pose(index, nodes.length).y, rotation: (index: number) => pose(index, nodes.length).rotation, duration: duration(0.7), stagger: duration(0.08), ease: 'power3.out' });
    });
    const leaving = all('.v5-event');
    if (leaving.length) next.to(leaving, { x: 0, y: 240, rotation: 0, scale: 1, duration: duration(0.4), stagger: duration(0.04), ease: 'power2.inOut' });
    else next.to({}, { duration: 0.01 });
  });

  const resume = () => { warnedAt.current = null; lastActivity.current = Date.now(); setWarning(false); previousFocus.current?.focus({ preventScroll: true }); };
  useEffect(() => {
    const activity = () => { lastActivity.current = Date.now(); };
    const element = root.current;
    element?.addEventListener('pointerdown', activity); element?.addEventListener('keydown', activity);
    const idle = Number(new URLSearchParams(location.search).get('idle')) || sessionConfig.idleMs;
    const timer = window.setInterval(() => {
      if (phaseRef.current === 'IDLE' || phaseRef.current === 'RESETTING' || document.hidden) return;
      const now = Date.now();
      if (warnedAt.current !== null) {
        const left = Math.max(0, Math.ceil((sessionConfig.warningMs - now + warnedAt.current) / 1000));
        setSeconds(left); if (!left) reset();
      } else if (!busyRef.current && now - lastActivity.current >= idle) {
        previousFocus.current = document.activeElement as HTMLElement; warnedAt.current = now; setSeconds(15); setWarning(true);
      }
    }, 250);
    return () => { clearInterval(timer); element?.removeEventListener('pointerdown', activity); element?.removeEventListener('keydown', activity); };
  }, []);
  useEffect(() => { if (warning && !dialog.current?.open) dialog.current?.showModal(); else if (!warning && dialog.current?.open) dialog.current.close(); }, [warning]);

  return <div className="v5" ref={root} data-phase={phase} data-busy={busy} data-gusts="0">
    <div className="v5-stage" ref={scene}>
      <header className="v5-header"><button className="v5-brand" onClick={reset} aria-label="校园来信，返回首页"><BrandMark /><span>校园来信</span></button><span className="v5-place">德志广场 · 拾花一叶</span>{phase !== 'IDLE' && <button className="v5-reset" onClick={reset} disabled={phase === 'RESETTING'}>重新开始 ↺</button>}</header>
      <Botanical className="v5-corner v5-corner-left" variant={2} /><Botanical className="v5-corner v5-corner-right" variant={1} />
      <div className="v5-ambient" aria-hidden="true"><Breeze />{[0, 1, 2].map(index => <span className="v5-falling-leaf" key={index}><Leaf index={index} /></span>)}</div>
      <div className="v5-discover-ui v5-discover-head"><h1 tabIndex={-1}>今天，想遇见什么？</h1><p>三所大学的故事，藏在这一封封来信里。</p></div>
      <nav className="v5-discover-ui v5-filters" aria-label="按学校筛选" inert={phase !== 'DISCOVER'}>{[{ id: 'all', name: '全部来信' }, ...schools].map(item => <button key={item.id} aria-pressed={school === item.id} onClick={() => changeFilter(item.id)}><span className="v5-filter-leaf" aria-hidden="true" />{item.name}</button>)}</nav>

      <div className="v5-envelope" ref={envelope}>
        <div className="v5-envelope-shadow" /><div className="v5-envelope-back" /><div className="v5-envelope-lining"><Botanical variant={2} /><Botanical variant={1} /></div>
        <div className="v5-envelope-flap" ref={flap}><div className="v5-flap-front"><svg viewBox="0 0 1040 300" preserveAspectRatio="none" aria-hidden="true"><path d="M4 0h1032L520 300 4 0Z" fill="#faf5e8" stroke="#afb496" strokeWidth="1.8" /><path d="M18 5h1004L520 287 18 5Z" fill="none" stroke="#dad7be" /></svg><div className="v5-cover"><span className="v5-cover-kicker">来自三所校园的祝福</span><h1>校园来信</h1><p>拾一片花叶，开启一段相遇。</p></div><Botanical className="v5-cover-botanical" variant={1} /></div><div className="v5-flap-back"><svg viewBox="0 0 1040 300" preserveAspectRatio="none" aria-hidden="true"><path d="M4 0h1032L520 300 4 0Z" fill="#dce2cb" stroke="#aab596" strokeWidth="1.8" /><path d="M25 5h990L520 280 25 5Z" fill="none" stroke="#f4f0df" strokeWidth="2" /></svg></div></div>
        <div className="v5-fan" aria-hidden={phase !== 'DISCOVER'} inert={phase !== 'DISCOVER'} onPointerLeave={event => { if (event.pointerType === 'mouse' && performance.now() - lastTouch.current > 900) arrange(null); }}>
          {shown.map((item, index) => <div className={`v5-event${picked === item.id ? ' is-picked' : ''}`} data-event={item.id} key={item.id}><div className="v5-event-back" /><div className="v5-event-paper"><div className="v5-event-illustration"><EventArt event={item} /></div><span className="v5-event-school">{schoolName(item.schoolId)}</span><h2>{item.title}</h2><div className="v5-event-bottom"><span>{item.category}</span><time>{dateLabel(item)}</time></div><Botanical className="v5-event-botanical" variant={index} /><span className="v5-event-invite">打开来信 →</span><svg className="v5-small-pocket" viewBox="0 0 280 112" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0 140 66 280 0v112H0Z" fill="#f7efdd" stroke="#c4c9ac" strokeWidth="1.2" /><path d="M5 10 140 73 275 10" fill="none" stroke="#fffbf0" strokeWidth="2" /></svg></div><button className="v5-event-hit" aria-label={`${item.title}，${schoolName(item.schoolId)}，${dateLabel(item)}`} aria-pressed={picked === item.id} onPointerDown={event => { if (event.pointerType === 'touch') lastTouch.current = performance.now(); }} onPointerEnter={event => { if (event.pointerType === 'mouse' && performance.now() - lastTouch.current > 900) arrange(item.id); }} onFocus={event => { if (event.currentTarget.matches(':focus-visible') && performance.now() - lastTouch.current > 900) arrange(item.id); }} onClick={event => selectEvent(item, event.detail === 0 ? 'keyboard' : event.nativeEvent instanceof PointerEvent && event.nativeEvent.pointerType === 'touch' ? 'touch' : 'mouse')} /></div>)}
        </div>
        <div className="v5-pocket"><svg viewBox="0 0 1040 560" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0 520 160 1040 0v548q0 12-12 12H12Q0 560 0 548Z" fill="#f8f1df" stroke="#b1b69b" strokeWidth="1.8" /><path d="M8 9 520 169 1032 9M8 548V18m1024 530V18" fill="none" stroke="#d4d4b9" strokeWidth="1.2" /><path d="M12 18 520 177 1028 18" fill="none" stroke="#fffbef" strokeWidth="3" /></svg><div className="v5-pocket-print"><span>澳门 · 大学城</span><p>一叶一花，都是校园的祝福。</p></div><Botanical className="v5-pocket-botanical" variant={2} /><div className="v5-pocket-stamp"><Botanical /></div></div>
        <div className="v5-seal" ref={seal}><div className="v5-seal-shadow" /><div className="v5-seal-head"><Botanical /></div><div className="v5-seal-tail"><span>轻触拆信</span><i>↗</i></div></div>
        <button className="v5-open" ref={openButton} onClick={open} disabled={phase !== 'IDLE'} tabIndex={phase === 'IDLE' ? 0 : -1} aria-label="打开校园来信"><span className="v5-open-hint">轻触信封，拆开祝福 <b>→</b></span></button>
      </div>
      <div className="v5-discover-ui v5-dock-label" inert={phase !== 'DISCOVER'}><div><strong>{picked ? shown.find(item => item.id === picked)?.title : '挑一封，读读校园的故事。'}</strong><span>{picked ? '轻触来信，打开活动详情' : '触屏轻触选中，再次轻触打开'}</span></div>{available.length > PAGE_SIZE && <div className="v5-pager"><button aria-label="上一组活动" disabled={batch === 0} onClick={() => changeFilter(school, batch - 1)}>←</button><span>{batch + 1} / {Math.ceil(available.length / PAGE_SIZE)}</span><button aria-label="下一组活动" disabled={(batch + 1) * PAGE_SIZE >= available.length} onClick={() => changeFilter(school, batch + 1)}>→</button></div>}</div>
      {!shown.length && phase === 'DISCOVER' && <div className="v5-empty"><Botanical variant={2} /><h2>新的故事，还在路上</h2><p>换一所学校，继续看看吧。</p><button className="v5-secondary" onClick={() => changeFilter('all')}>查看全部来信</button></div>}

      <section className="v5-letter" ref={letter} inert={phase !== 'DETAIL' || busy} aria-label="活动详情"><div className="v5-letter-layout"><button className="v5-back v5-letter-back" onClick={closeLetter}>← 放回活动来信</button><Botanical className="v5-letter-botanical" variant={1} />{current && <><div className="v5-letter-art"><EventArt event={current} /><Botanical className="v5-letter-art-flower" variant={events.indexOf(current) % 3} /><span>{current.category}</span></div><div className="v5-letter-copy"><span className="v5-eyebrow">{schoolName(current.schoolId)}</span><h1 className="v5-sheet-title" tabIndex={-1}>{current.title}</h1><dl><div><dt>活动时间</dt><dd>{dateLabel(current)} · {timeLabel(current)}</dd></div><div><dt>活动地点</dt><dd>{current.location}</dd></div></dl><div className="v5-letter-description">{current.description.split('\n').map(text => <p key={text}>{text}</p>)}</div><button className="v5-primary" onClick={takePostcard} disabled={!postcard}>{postcard ? '取出纪念明信片' : '明信片正在准备中'}<span>→</span></button>{!postcard && <button className="v5-text-button" onClick={closeLetter}>返回选择其他活动</button>}</div></>}</div></section>

      <div className="v5-postcard-ui v5-postcard-head"><span className="v5-eyebrow">拾花一叶 · 校园纪念</span><h1>把校园的祝福，留在手心。</h1></div>
      <button className="v5-postcard-object" ref={postcardObject} onClick={flip} disabled={phase !== 'POSTCARD' || busy} tabIndex={phase === 'POSTCARD' ? 0 : -1} aria-label={`明信片${flipped ? '背面' : '正面'}，点击翻面`} aria-pressed={flipped}><div className="v5-postcard-inner" ref={postcardInner}><div className="v5-postcard-face" aria-hidden={flipped}>{current && postcard && <PostcardVisual event={current} postcard={postcard} />}</div><div className="v5-postcard-face v5-postcard-back" aria-hidden={!flipped}>{current && postcard && <PostcardVisual event={current} postcard={postcard} back />}</div></div></button>
      <div className="v5-postcard-ui v5-postcard-actions" inert={phase !== 'POSTCARD'}><button className="v5-back" onClick={backPostcard} disabled={busy}>← 返回活动详情</button><div><button className="v5-secondary" onClick={flip} disabled={busy}>翻到{flipped ? '正' : '背'}面 ↻</button><button className="v5-primary" onClick={keep}>收下这张明信片 <span>→</span></button></div></div>

      <div className="v5-collection v5-kept-back"><Botanical variant={2} /></div><div className="v5-collection v5-kept-front"><div /><Botanical variant={1} /><span>一叶一花 · 妥善珍藏</span></div><div className="v5-collection v5-collect-stamp">已收藏<span>✦</span></div>
      <section className="v5-collection v5-complete-copy" inert={phase !== 'COMPLETE'} aria-label="收藏完成"><span className="v5-eyebrow">校园祝福已收到</span><h1 tabIndex={-1}>愿这片花叶，<br />替你留住今天。</h1><div className="v5-complete-event"><strong>{current?.title}</strong><span>{current ? schoolName(current.schoolId) : ''} · {current ? dateLabel(current) : ''}</span></div><p>本次仅完成数字收藏，不涉及实体明信片投递。</p><button className="v5-primary" onClick={reset}>完成体验，返回首页 <span>→</span></button></section>
      <footer className="v5-footer"><span>德志广场互动树</span><span>演示活动 · 非官方资讯</span></footer>
    </div>
    <dialog className="v5-dialog" ref={dialog} aria-labelledby="v5-timeout-title" onCancel={event => { event.preventDefault(); resume(); }}><div><Botanical variant={1} /><span className="v5-dialog-count">{seconds}</span><h2 id="v5-timeout-title">还想再看一会儿吗？</h2><p role="status">{seconds} 秒后将清空本次选择，返回首页。</p><button className="v5-primary" onClick={resume} aria-label="继续探索">继续探索 <span>→</span></button><button className="v5-text-button" onClick={reset}>结束体验</button></div></dialog>
  </div>;
}
