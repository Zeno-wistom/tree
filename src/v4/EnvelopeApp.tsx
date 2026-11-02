import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import gsap from 'gsap';
import { events, postcards, schools, schoolName, dateLabel, timeLabel, sessionConfig } from '../data';
import type { CampusEvent } from '../data';
import { BrandMark, Leaf, PlazaPrint, Postmark, Sprig, StampFrame, TicketArt, WindRibbons } from './art';
import './base.css';
import './scene.css';

type Phase = 'IDLE' | 'OPENING' | 'DISCOVER' | 'DETAIL' | 'POSTCARD' | 'COMPLETE';
type Enter = 'open' | 'forward' | 'back' | 'reset';

const CARD_SPACING = 212;
const reduceQuery = () => window.matchMedia('(prefers-reduced-motion: reduce)');
/* QA hook: ?idle=4000 shortens the inactivity timer for automated checks */
const idleMs = (() => {
  const raw = new URLSearchParams(location.search).get('idle');
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 800 ? n : sessionConfig.idleMs;
})();

export function EnvelopeApp() {
  const root = useRef<HTMLDivElement>(null);
  const envLayer = useRef<HTMLDivElement>(null);
  const flap = useRef<HTMLDivElement>(null);
  const seal = useRef<HTMLDivElement>(null);
  const sealTail = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const letterStage = useRef<HTMLDivElement>(null);
  const postcardStage = useRef<HTMLDivElement>(null);
  const pc = useRef<HTMLButtonElement>(null);
  const pcInner = useRef<HTMLDivElement>(null);
  const completeStage = useRef<HTMLDivElement>(null);
  const keptCard = useRef<HTMLDivElement>(null);
  const keptStamp = useRef<HTMLDivElement>(null);
  const keptInk = useRef<HTMLDivElement>(null);
  const sleeve = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const trayLabel = useRef<HTMLDivElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const openBtn = useRef<HTMLButtonElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const fanRef = useRef<HTMLDivElement>(null);

  const tl = useRef<gsap.core.Timeline | null>(null);
  const gust = useRef<gsap.core.Timeline | null>(null);
  const gustCall = useRef<gsap.core.Tween | null>(null);
  const tiltSet = useRef(new Map<HTMLElement, { x: (n: number) => void; y: (n: number) => void }>());
  const busy = useRef(false);
  const enteredBy = useRef<Enter>('reset');
  const phaseRef = useRef<Phase>('IDLE');
  const lastActivity = useRef(Date.now());
  const warningAt = useRef<number | null>(null);
  const focusBefore = useRef<HTMLElement | null>(null);

  const [phase, setPhase] = useState<Phase>('IDLE');
  const [school, setSchool] = useState('all');
  const [picked, setPicked] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [warning, setWarning] = useState(false);
  const [seconds, setSeconds] = useState(15);
  const [batch, setBatch] = useState(0);
  const [reduce, setReduce] = useState(reduceQuery().matches);

  const available = events.filter(e => e.status !== 'ended' && (school === 'all' || e.schoolId === school));
  const shown = available.slice(batch * 6, batch * 6 + 6);
  const current = events.find(e => e.id === openId) ?? null;
  const postcard = postcards.find(p => p.id === current?.postcardId && p.eventId === current?.id);
  const pickedEvent = shown.find(e => e.id === picked) ?? null;
  const activeDiscover = phase === 'DISCOVER';
  const step = phase === 'IDLE' || phase === 'OPENING' ? -1 : phase === 'DISCOVER' ? 0 : phase === 'DETAIL' ? 1 : phase === 'POSTCARD' ? 2 : 3;

  useEffect(() => {
    const q = reduceQuery();
    const on = () => setReduce(q.matches);
    q.addEventListener('change', on);
    return () => q.removeEventListener('change', on);
  }, []);

  useEffect(() => { phaseRef.current = phase; }, [phase]);

  /* ────────────────────────── ambient wind ────────────────────────── */
  const stopGust = useCallback(() => {
    gustCall.current?.kill();
    gust.current?.kill();
    gsap.set('.wind-svg', { autoAlpha: 0 });
    gsap.set('.leaf', { autoAlpha: 0 });
    if (sealTail.current) gsap.set(sealTail.current, { rotateX: 0, rotateZ: 0 });
  }, []);

  const playGust = useCallback(() => {
    if (reduce || phaseRef.current !== 'IDLE') return;
    const dir = Math.random() > 0.45 ? 1 : -1;
    const strength = 0.72 + Math.random() * 0.5;
    const g = gsap.timeline({
      onComplete: () => {
        gustCall.current = gsap.delayedCall(gsap.utils.random(4.4, 8.2) as number, playGust);
      },
    });
    gust.current = g;

    const lines = gsap.utils.toArray<SVGPathElement>('.wind-line');
    lines.forEach((line, i) => {
      const lag = i * 0.11;
      g.fromTo(line,
        { x: dir * -260, autoAlpha: 0, strokeDashoffset: 800 },
        { x: dir * 260, autoAlpha: 0.55 * strength, strokeDashoffset: 0, duration: 0.75, ease: 'sine.out' }, lag)
        .to(line, { x: dir * 1180, autoAlpha: 0, duration: 1.15, ease: 'sine.in' }, 0.75 + lag);
    });
    g.fromTo('.wind-svg', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35 }, 0)
      .to('.wind-svg', { autoAlpha: 0, duration: 0.6 }, 1.35);

    /* leaves: different depth, speed and spin */
    const specs = [
      { sel: '.leaf-1', x0: dir * -120, y0: 380, x1: dir * 340, y1: 300, x2: dir * 780, y2: 430, x3: dir * 1420, y3: 330, s0: 0.8, s1: 0.95, r: 200, d: 2.6 },
      { sel: '.leaf-2', x0: dir * -160, y0: 250, x1: dir * 280, y1: 200, x2: dir * 700, y2: 290, x3: dir * 1360, y3: 220, s0: 1.0, s1: 1.15, r: -160, d: 2.9 },
      { sel: '.leaf-3', x0: dir * -130, y0: 520, x1: dir * 390, y1: 470, x2: dir * 820, y2: 560, x3: dir * 1400, y3: 480, s0: 0.66, s1: 0.78, r: 250, d: 3.3 },
    ];
    specs.forEach((sp, i) => {
      const el = document.querySelector(sp.sel);
      if (!el) return;
      g.set(el, { x: sp.x0, y: sp.y0, rotation: -40 * dir, scale: sp.s0, autoAlpha: 0 }, 0.1 + i * 0.14);
      g.to(el, { autoAlpha: 0.9, duration: 0.3 }, 0.12 + i * 0.14);
      g.to(el, { x: sp.x1, y: sp.y1, rotation: 40 * dir, duration: 0.62, ease: 'sine.out' }, 0.12 + i * 0.14);
      g.to(el, { x: sp.x2, y: sp.y2, rotation: sp.r * 0.6 * dir, duration: 0.72, ease: 'sine.inOut' }, 0.72 + i * 0.14);
      g.to(el, { x: sp.x3, y: sp.y3, rotation: sp.r * dir, scale: sp.s1, duration: 0.92, ease: 'sine.in' }, 1.42 + i * 0.14);
      g.to(el, { autoAlpha: 0, duration: 0.45 }, 2.1 + i * 0.14);
    });

    /* the seal is the thing the wind actually touches */
    if (sealTail.current) {
      g.to(sealTail.current, { rotateX: -46 * strength, rotateZ: 5.2 * dir, duration: 0.5, ease: 'power2.out' }, 0.58)
        .to(sealTail.current, { rotateX: -34 * strength, duration: 0.7, ease: 'sine.inOut' }, 1.08)
        .to(sealTail.current, { rotateX: 0, rotateZ: 0, duration: 1.05, ease: 'elastic.out(0.85, 0.5)' }, 1.78);
      g.to('.seal-shadow', { opacity: 0.95 * strength, duration: 0.45 }, 0.6)
        .to('.seal-shadow', { opacity: 0, duration: 0.8 }, 1.6);
      g.to('.seal', { y: -3, duration: 0.4, ease: 'sine.out' }, 0.62)
        .to('.seal', { y: 0, duration: 0.7, ease: 'sine.inOut' }, 1.5);
    }
    /* the whole envelope gives a little */
    g.to(envLayer.current, { rotation: 0.55 * dir, y: -5, duration: 0.45, ease: 'sine.out' }, 0.64)
      .to(envLayer.current, { rotation: 0, y: 0, duration: 1.05, ease: 'elastic.out(1, 0.7)' }, 1.3);

    /* hint breathes with the gust */
    g.to(hintRef.current, { opacity: 1, duration: 0.4 }, 0.55).to(hintRef.current, { opacity: 0.62, duration: 0.9 }, 1.4);
  }, [reduce]);

  const startAmbient = useCallback(() => {
    stopGust();
    if (reduce) return;
    gustCall.current = gsap.delayedCall(1.9, playGust);
    gsap.to(hintRef.current, { opacity: 0.62, duration: 1.2, ease: 'sine.out' });
  }, [playGust, reduce, stopGust]);

  /* ────────────────────────── camera helpers ────────────────────────── */
  const cam = useCallback(() => [envLayer.current].filter(Boolean) as HTMLElement[], []);

  const setCam = useCallback((vars: gsap.TweenVars) => {
    gsap.set(cam(), { ...vars, transformOrigin: '50% 0' });
  }, [cam]);

  /* ────────────────────────── card poses ────────────────────────── */
  const poseOf = useCallback((i: number, n: number, focusIdx: number) => {
    const mid = (n - 1) / 2;
    const d = i - mid;
    const away = focusIdx >= 0 && i !== focusIdx ? (i < focusIdx ? -15 : 15) : 0;
    const lift = i === focusIdx ? -44 : 0;
    return {
      x: d * CARD_SPACING + away,
      y: Math.abs(d) * 6 + lift,
      rotation: d * 3.3 + (away === 0 ? 0 : away * 0.12),
      scale: i === focusIdx ? 1.055 : 1,
      zIndex: i === focusIdx ? 40 : 20 - Math.abs(i - (focusIdx >= 0 ? focusIdx : mid)),
    };
  }, []);

  const applyPoses = useCallback((animate: boolean, focusIdx: number) => {
    const nodes = gsap.utils.toArray<HTMLElement>('.fan-card');
    nodes.forEach((node, i) => {
      const p = poseOf(i, nodes.length, focusIdx);
      const vars = { ...p, duration: animate && !reduce ? 0.34 : 0, ease: 'power3.out', overwrite: 'auto' as const };
      if (animate) gsap.to(node, vars);
      else gsap.set(node, vars);
    });
  }, [poseOf, reduce]);

  /* hand over from the static first frame once React has painted */
  useLayoutEffect(() => {
    const el = document.getElementById('first-frame');
    if (!el) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        el.style.opacity = '0';
        window.setTimeout(() => el.remove(), 320);
      });
    });
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
  }, []);

  /* ────────────────────────── initial state ────────────────────────── */
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(envLayer.current, { transformOrigin: '50% 0', x: 0, y: 0, scale: 1, rotation: 0 });
      gsap.set(flap.current, { rotateX: 0 });
      gsap.set('.flap-back', { opacity: 1 });
      gsap.set(sealTail.current, { rotateX: 0, rotateZ: 0 });
      gsap.set('.fan-card', { x: 0, y: 420, scale: 0.9, rotation: 0, autoAlpha: 0 });
      gsap.set('.discover-head, .filters, .discover-tip, .tray-label, .filter-count', { autoAlpha: 0, y: 14 });
      gsap.set(letterStage.current, { autoAlpha: 0 });
      gsap.set(sheet.current, { autoAlpha: 0, y: 60 });
      gsap.set(postcardStage.current, { autoAlpha: 0 });
      gsap.set(completeStage.current, { autoAlpha: 0 });
      gsap.set([keptStamp.current, keptInk.current], { autoAlpha: 0 });
      gsap.set('.hint', { opacity: 0 });
    }, root);
    return () => ctx.revert();
  }, []);

  /* pre-set the seal/paper so the very first paint matches the static shell */
  useEffect(() => {
    if (phase === 'IDLE') startAmbient();
    return () => { gustCall.current?.kill(); };
  }, [phase, startAmbient]);

  /* ────────────────────────── opening ────────────────────────── */
  const open = useCallback(() => {
    if (busy.current || phaseRef.current !== 'IDLE') return;
    busy.current = true;
    stopGust();
    gsap.to(hintRef.current, { opacity: 0, duration: 0.2 });
    const camEls = cam();
    const t = gsap.timeline({
      onComplete: () => {
        busy.current = false;
        enteredBy.current = 'open';
        setPhase('DISCOVER');
      },
    });
    tl.current = t;
    const d = (v: number) => (reduce ? 0.001 : v);

    t.addLabel('grab', 0)
      .to(sealTail.current, { rotateX: -42, rotateZ: 5, duration: d(0.26), ease: 'power2.out' }, 0)
      .to('.seal-shadow', { opacity: 0.62, duration: d(0.26) }, 0)
      .to(seal.current, { y: -8, duration: d(0.2), ease: 'power2.out' }, 0.08)
      .to(seal.current, { y: -52, rotation: -7, duration: d(0.3), ease: 'power2.in' }, 0.24)
      .to(seal.current, { y: 96, x: 34, rotation: 26, opacity: 0, duration: d(0.62), ease: 'power1.in' }, 0.48)
      .to('.flap-under', { opacity: 0, duration: d(0.4) }, 0.3)
      .to(flap.current, { rotateX: -62, duration: d(0.3), ease: 'power2.out' }, 0.34)
      .to(flap.current, { rotateX: -168, duration: d(0.46), ease: 'power2.inOut' }, 0.64)
      .to(camEls, { scale: 1.05, y: 16, duration: d(0.55), ease: 'power2.out' }, 0.34)
      .to('.env-sheet', { y: -22, duration: d(0.5), ease: 'power2.out' }, 0.62)
      .to(camEls, { scale: 2, y: 548, duration: d(0.95), ease: 'power3.inOut' }, 0.92)
      .to('.pocket-fill', { autoAlpha: 1, duration: d(0.4), ease: 'power2.in' }, 0.98)
      .to('.env-interior', { autoAlpha: 0, duration: d(0.3) }, 0.98)
      .to('.env-sheet', { autoAlpha: 0, duration: d(0.3) }, 0.98)
      /* letters rise from inside the pocket — no fades, the wall hides them */
      .fromTo('.fan-card',
        { y: 430, scale: 0.86, rotation: 0, autoAlpha: 0 },
        { y: (i: number) => poseOf(i, shown.length, -1).y, x: (i: number) => poseOf(i, shown.length, -1).x, rotation: (i: number) => poseOf(i, shown.length, -1).rotation, scale: 1, autoAlpha: 1, duration: d(0.9), stagger: reduce ? 0 : 0.055, ease: 'power3.out' }, 1.18)
      .set(flap.current, { autoAlpha: 0 }, 1.9)
      .to('.discover-head', { autoAlpha: 1, y: 0, duration: d(0.4), ease: 'power2.out' }, 1.42)
      .to('.filters, .filter-count', { autoAlpha: 1, y: 0, duration: d(0.4), ease: 'power2.out' }, 1.52)
      .to('.discover-tip', { autoAlpha: 1, y: 0, duration: d(0.35) }, 1.62)
      .to('.tray-label', { autoAlpha: 1, y: 0, duration: d(0.4), ease: 'power2.out' }, 1.6);
  }, [cam, poseOf, reduce, shown.length, stopGust]);

  const skip = useCallback(() => {
    tl.current?.progress(1);
  }, []);

  /* ────────────────────────── discover ────────────────────────── */
  const enterDiscover = useCallback((enter: Enter) => {
    const camEls = cam();
    const t = gsap.timeline({ onComplete: () => { busy.current = false; } });
    tl.current = t;
    busy.current = true;
    const d = (v: number) => (reduce ? 0.001 : v);

    gsap.set('.seal', { opacity: 0 });
    gsap.set('.fold-shadow', { opacity: 0 });
    gsap.set('.seal-slit', { opacity: 0 });
    gsap.set(flap.current, { rotateX: -168 });
    gsap.set('.env-sheet', { y: -22 });
    t.to(camEls, { scale: 2, y: 548, rotation: 0, duration: enter === 'back' ? d(0.7) : 0, ease: 'power3.inOut' }, 0)
      .set('.fan-card', { autoAlpha: 1 }, 0)
      .to('.discover-head, .filters, .discover-tip, .tray-label, .filter-count', { autoAlpha: 1, y: 0, duration: enter === 'back' ? d(0.35) : 0 }, enter === 'back' ? 0.1 : 0)
      .to(letterStage.current, { autoAlpha: 0, duration: enter === 'back' ? d(0.3) : 0 }, 0)
      .to(postcardStage.current, { autoAlpha: 0, duration: d(0.2) }, 0)
      .to(completeStage.current, { autoAlpha: 0, duration: d(0.2) }, 0);
    if (enter !== 'open') {
      applyPoses(false, -1);
      t.fromTo('.fan-card', { y: 620, autoAlpha: 0 }, {
        y: (i: number) => poseOf(i, shown.length, -1).y,
        x: (i: number) => poseOf(i, shown.length, -1).x,
        rotation: (i: number) => poseOf(i, shown.length, -1).rotation,
        autoAlpha: 1, duration: d(0.62), stagger: reduce ? 0 : 0.04, ease: 'power3.out',
      }, 0);
    }
    gsap.set(sheet.current, { autoAlpha: 0 });
    setOpenId(null);
    setPicked(null);
    startAmbient();
  }, [applyPoses, cam, poseOf, reduce, shown.length, startAmbient]);

  /* ────────────────────────── detail ────────────────────────── */
  const openLetter = useCallback((item: CampusEvent) => {
    if (busy.current) return;
    if (phaseRef.current === 'DISCOVER' && picked !== item.id) {
      setPicked(item.id);
      const idx = shown.findIndex(e => e.id === item.id);
      applyPoses(true, idx);
      return;
    }
    busy.current = true;
    setOpenId(item.id);
    enteredBy.current = 'forward';
    stopGust();
    const t = gsap.timeline({ onComplete: () => { busy.current = false; setPhase('DETAIL'); } });
    tl.current = t;
    const d = (v: number) => (reduce ? 0.001 : v);
    const idx = shown.findIndex(e => e.id === item.id);
    const pose = poseOf(idx, shown.length, idx);
    const dx = -pose.x;
    const dy = (324 + pose.y + 188) - 401;

    t.to('.fan-card', {
      y: (i: number) => (i === idx ? pose.y - 26 : 300),
      rotation: (i: number) => (i === idx ? 0 : 0),
      duration: d(0.42), ease: 'power2.inOut',
    }, 0)
      .to('.discover-head, .filters, .discover-tip, .tray-label, .filter-count', { autoAlpha: 0, y: -10, duration: d(0.28) }, 0)
      .to(`.fan-card[data-id="${item.id}"] .card-flap`, { rotateX: -150, duration: d(0.35), ease: 'power2.inOut' }, 0.05)
      .set(letterStage.current, { autoAlpha: 1 }, 0.1)
      .fromTo(sheet.current,
        { autoAlpha: 1, x: dx, y: dy, scale: 0.281, rotation: -1.5 },
        { x: 0, y: 0, scale: 1, rotation: 0, duration: d(0.78), ease: 'power3.inOut' }, 0.16)
      .fromTo('.sheet-grid', { opacity: 1 }, { opacity: 1, duration: d(0.3) }, 0.5)
      .to('.fan-card', { y: 640, autoAlpha: 0, duration: d(0.4), stagger: reduce ? 0 : 0.02, ease: 'power2.in' }, 0.3)
      .fromTo('.sheet-tab', { autoAlpha: 0, x: -8 }, { autoAlpha: 1, x: 0, duration: d(0.3) }, 0.62)
      .fromTo('.letter-envelope', { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: d(0.4), ease: 'power2.out' }, 0.55);
  }, [applyPoses, busy, picked, poseOf, reduce, shown, stopGust]);

  const closeLetter = useCallback(() => {
    if (busy.current) return;
    busy.current = true;
    enteredBy.current = 'back';
    const idx = Math.max(0, shown.findIndex(e => e.id === openId));
    const pose = poseOf(idx, shown.length, idx);
    const dx = -pose.x;
    const dy = (324 + pose.y + 188) - 401;
    const t = gsap.timeline({ onComplete: () => { busy.current = false; setPhase('DISCOVER'); } });
    tl.current = t;
    const d = (v: number) => (reduce ? 0.001 : v);
    t.to(sheet.current, { x: dx, y: dy, scale: 0.281, rotation: 1.5, duration: d(0.62), ease: 'power3.inOut' }, 0)
      .to('.letter-envelope', { y: 40, autoAlpha: 0, duration: d(0.3) }, 0)
      .to('.sheet-tab', { autoAlpha: 0, duration: d(0.2) }, 0)
      .to('.fan-card', {
        y: (i: number) => poseOf(i, shown.length, -1).y,
        x: (i: number) => poseOf(i, shown.length, -1).x,
        rotation: (i: number) => poseOf(i, shown.length, -1).rotation,
        autoAlpha: 1, duration: d(0.5), stagger: reduce ? 0 : 0.03, ease: 'power3.out',
      }, 0.34)
      .to('.discover-head, .filters, .discover-tip, .tray-label, .filter-count', { autoAlpha: 1, y: 0, duration: d(0.35) }, 0.4);
  }, [openId, poseOf, reduce, shown, busy]);

  /* ────────────────────────── postcard ────────────────────────── */
  const takePostcard = useCallback(() => {
    if (busy.current) return;
    busy.current = true;
    enteredBy.current = 'forward';
    setFlipped(false);
    const t = gsap.timeline({ onComplete: () => { busy.current = false; setPhase('POSTCARD'); } });
    tl.current = t;
    const d = (v: number) => (reduce ? 0.001 : v);
    t.to(letterStage.current, { autoAlpha: 0, y: -26, duration: d(0.42), ease: 'power2.inOut' }, 0)
      .set(postcardStage.current, { autoAlpha: 1 }, 0)
      .fromTo(pcInner.current, { rotateY: 0 }, { rotateY: 0, duration: 0 }, 0)
      .fromTo(pc.current,
        { y: 330, rotation: -4, scale: 0.92, autoAlpha: 0 },
        { y: 0, rotation: 0, scale: 1, autoAlpha: 1, duration: d(0.72), ease: 'power3.out' }, 0.08)
      .fromTo('.postcard-head', { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: d(0.36) }, 0.3)
      .fromTo('.pc-actions, .pc-hint', { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: d(0.36) }, 0.42);
  }, [busy, reduce]);

  const backPostcard = useCallback(() => {
    if (busy.current) return;
    busy.current = true;
    enteredBy.current = 'back';
    const t = gsap.timeline({ onComplete: () => { busy.current = false; setPhase('DETAIL'); } });
    tl.current = t;
    const d = (v: number) => (reduce ? 0.001 : v);
    t.to(pc.current, { y: 300, rotation: 3, scale: 0.94, autoAlpha: 0, duration: d(0.42), ease: 'power2.in' }, 0)
      .to('.postcard-head, .pc-actions, .pc-hint', { autoAlpha: 0, duration: d(0.24) }, 0)
      .to(letterStage.current, { autoAlpha: 1, y: 0, duration: d(0.45), ease: 'power2.out' }, 0.1)
      .to(postcardStage.current, { autoAlpha: 0, duration: d(0.3) }, 0.25);
  }, [busy, reduce]);

  const flip = useCallback(() => {
    if (busy.current) return;
    busy.current = true;
    const next = !flipped;
    setFlipped(next);
    const t = gsap.timeline({ onComplete: () => { busy.current = false; } });
    tl.current = t;
    const d = (v: number) => (reduce ? 0.001 : v);
    t.to(pc.current, { y: -14, scale: 1.012, rotation: next ? -1.2 : 0.8, duration: d(0.22), ease: 'power2.out' }, 0)
      .to(pcInner.current, { rotateY: next ? 180 : 0, duration: d(0.68), ease: 'power2.inOut' }, 0.02)
      .to(pc.current, { y: 0, scale: 1, rotation: 0, duration: d(0.3), ease: 'power2.inOut' }, d(0.5));
  }, [busy, flipped, reduce]);

  /* ────────────────────────── complete ────────────────────────── */
  const keep = useCallback(() => {
    /* a click during the flip should still be honoured */
    if (busy.current) { tl.current?.kill(); busy.current = false; }
    busy.current = true;
    enteredBy.current = 'forward';
    const t = gsap.timeline({ onComplete: () => { busy.current = false; setPhase('COMPLETE'); } });
    tl.current = t;
    const d = (v: number) => (reduce ? 0.001 : v);
    t.to('.postcard-head, .pc-actions, .pc-hint', { autoAlpha: 0, duration: d(0.24) }, 0)
      .set(letterStage.current, { autoAlpha: 0 }, 0)
      .set(completeStage.current, { autoAlpha: 1 }, 0.05)
      .to(pc.current, { y: -22, scale: 0.99, duration: d(0.22), ease: 'power2.out' }, 0)
      /* the card travels left and shrinks into the sleeve */
      .to(pc.current, { x: -246, y: -18, scale: 0.62, rotation: -1.4, duration: d(0.7), ease: 'power3.inOut' }, 0.22)
      .fromTo(sleeve.current, { y: 190, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: d(0.62), ease: 'power3.out' }, 0.5)
      .fromTo('.complete-copy', { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: d(0.5), ease: 'power2.out' }, 0.62)
      /* the stamp comes down and presses */
      .fromTo(keptStamp.current, { y: -90, rotation: -14, autoAlpha: 0, scale: 1.18 }, { y: 0, rotation: -7, autoAlpha: 1, scale: 1, duration: d(0.4), ease: 'power3.in' }, 0.98)
      .to(keptInk.current, { autoAlpha: 0.55, scale: 1, duration: d(0.28), ease: 'power2.out' }, 1.34)
      .to(keptStamp.current, { y: 4, scale: 0.98, duration: d(0.14), ease: 'power2.in' }, 1.34)
      .to(keptStamp.current, { y: 0, scale: 1, duration: d(0.3), ease: 'elastic.out(1, 0.5)' }, 1.48)
      .to(keptInk.current, { autoAlpha: 0.32, duration: d(0.5) }, 1.6);
  }, [busy, reduce]);

  /* ────────────────────────── reset ────────────────────────── */
  const reset = useCallback(() => {
    tl.current?.kill();
    busy.current = false;
    setWarning(false);
    warningAt.current = null;
    setPicked(null);
    setOpenId(null);
    setSchool('all');
    setBatch(0);
    setFlipped(false);
    enteredBy.current = 'reset';
    setPhase('IDLE');
    lastActivity.current = Date.now();
  }, []);

  const enterIdle = useCallback(() => {
    const t = gsap.timeline();
    tl.current = t;
    t.to(cam(), { scale: 1, y: 0, rotation: 0, duration: reduce ? 0.001 : 0.85, ease: 'power3.inOut' }, 0)
      .set('.seal', { opacity: 1, y: 0, x: 0, rotation: 0 }, 0)
      .set(flap.current, { autoAlpha: 1 }, 0)
      .set('.pocket-fill', { autoAlpha: 0 }, 0.25)
      .set(['.env-interior', '.env-sheet'], { autoAlpha: 1 }, 0.2)
      .to(hintRef.current, { opacity: 0.62, duration: reduce ? 0.001 : 0.9 }, 0.9)
      .set(sealTail.current, { rotateX: 0, rotateZ: 0 }, 0)
      .set('.seal-shadow', { opacity: 0 }, 0)
      .set('.flap-under', { opacity: 1 }, 0)
      .to(flap.current, { rotateX: 0, duration: reduce ? 0.001 : 0.8, ease: 'power3.inOut' }, 0)
      .set('.env-sheet', { y: -8 }, 0.3)
      .to('.fan-card', { y: 520, autoAlpha: 0, duration: reduce ? 0.001 : 0.4, stagger: 0.02 }, 0)
      .to('.discover-head, .filters, .discover-tip, .tray-label, .filter-count', { autoAlpha: 0, duration: 0.2 }, 0)
      .to([sheet.current, letterStage.current], { autoAlpha: 0, duration: 0.25 }, 0)
      .to([pc.current, postcardStage.current, completeStage.current], { autoAlpha: 0, duration: 0.2 }, 0)
      .set([keptStamp.current, keptInk.current], { autoAlpha: 0 }, 0);
  }, [cam, reduce]);

  /* re-fan the cards whenever the filter or page changes */
  const firstFan = useRef(true);
  useEffect(() => {
    if (firstFan.current) { firstFan.current = false; return; }
    if (phaseRef.current !== 'DISCOVER') return;
    const cards = gsap.utils.toArray<HTMLElement>('.fan-card');
    cards.forEach((node, i) => {
      const p = poseOf(i, cards.length, -1);
      gsap.fromTo(node,
        { x: p.x, y: 620, rotation: p.rotation, scale: 0.94, autoAlpha: 0 },
        { y: p.y, autoAlpha: 1, scale: 1, duration: reduce ? 0.001 : 0.6, delay: reduce ? 0 : i * 0.045, ease: 'power3.out', overwrite: 'auto' });
    });
  }, [school, batch]); // eslint-disable-line react-hooks/exhaustive-deps

  /* phase side-effects */
  useEffect(() => {
    if (phase === 'DISCOVER') enterDiscover(enteredBy.current);
    else if (phase === 'IDLE' && enteredBy.current === 'reset') enterIdle();
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ────────────────────────── pointer parallax ────────────────────────── */
  const hoverCard = useCallback((el: HTMLElement, id: string) => {
    setPicked(id);
    const idx = shown.findIndex(e => e.id === id);
    applyPoses(true, idx);
  }, [applyPoses, shown]);

  const tilt = useCallback((el: HTMLElement, x: number, y: number) => {
    if (reduce) return;
    const target = el.querySelector<HTMLElement>('.card-tilt');
    if (!target) return;
    let q = tiltSet.current.get(target);
    if (!q) {
      q = { x: gsap.quickTo(target, 'rotateY', { duration: 0.4, ease: 'power3.out' }), y: gsap.quickTo(target, 'rotateX', { duration: 0.4, ease: 'power3.out' }) };
      tiltSet.current.set(target, q);
    }
    q.x(x * 7);
    q.y(-y * 6);
  }, [reduce]);

  /* ────────────────────────── idle timeout ────────────────────────── */
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const onActivity = () => { lastActivity.current = Date.now(); };
    el.addEventListener('pointerdown', onActivity);
    el.addEventListener('keydown', onActivity);
    el.addEventListener('wheel', onActivity, { passive: true });
    const timer = window.setInterval(() => {
      if (phaseRef.current === 'IDLE') return;
      const now = Date.now();
      if (warningAt.current !== null) {
        const left = Math.max(0, Math.ceil((sessionConfig.warningMs - (now - warningAt.current)) / 1000));
        setSeconds(left);
        if (!left) reset();
      } else if (now - lastActivity.current >= idleMs) {
        focusBefore.current = document.activeElement as HTMLElement;
        warningAt.current = now;
        setSeconds(Math.ceil(sessionConfig.warningMs / 1000));
        setWarning(true);
      }
    }, 250);
    return () => {
      window.clearInterval(timer);
      el.removeEventListener('pointerdown', onActivity);
      el.removeEventListener('keydown', onActivity);
      el.removeEventListener('wheel', onActivity);
    };
  }, [reset]);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (warning && !d.open) d.showModal();
    if (!warning && d.open) d.close();
  }, [warning]);

  /* pause ambient when the tab is hidden */
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) {
        gustCall.current?.pause();
        gust.current?.pause();
        gsap.globalTimeline.timeScale(0.0001);
      } else {
        gsap.globalTimeline.timeScale(1);
        gustCall.current?.resume();
        gust.current?.resume();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const resume = () => {
    warningAt.current = null;
    lastActivity.current = Date.now();
    setWarning(false);
    focusBefore.current?.focus?.();
  };

  /* focus handoff */
  useEffect(() => {
    if (busy.current) return;
    const el = root.current;
    if (!el) return;
    if (phase === 'IDLE') return;
    if (phase === 'DISCOVER' && picked) {
      el.querySelector<HTMLButtonElement>(`.fan-card[data-id="${picked}"] .card-hit`)?.focus({ preventScroll: true });
    } else el.querySelector<HTMLElement>('[data-heading]')?.focus({ preventScroll: true });
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const openIfPending = useCallback(() => {
    const w = window as unknown as { __v4WantOpen?: boolean };
    if (w.__v4WantOpen) { w.__v4WantOpen = false; open(); }
  }, [open]);
  useEffect(() => { const id = window.setTimeout(openIfPending, 120); return () => window.clearTimeout(id); }, [openIfPending]);

  const cardArt = (e: CampusEvent) => <TicketArt variant={events.indexOf(e)} tint={e.color} />;

  return (
    <div className="v4" ref={root} data-phase={phase}>
      <div className="stage">
        <header className="masthead">
          <button className="brand" onClick={reset} aria-label="校园来信，回到待机">
            <BrandMark className="brand-mark" />
            <span>
              <span className="brand-name">校园来信</span>
              <span className="brand-sub">CAMPUS POST · MACAU</span>
            </span>
          </button>
          <span className="masthead-line" />
          <span className="masthead-note">三校相遇 · 一封冬日邀请</span>
          {phase !== 'IDLE' && phase !== 'OPENING' && (
            <button className="ghost-btn" onClick={reset}>重新开始 ↶</button>
          )}
        </header>

        <div className="wind wind-back" aria-hidden="true">
          <WindRibbons />
          <span className="leaf leaf-1"><Leaf variant={0} /></span>
          <span className="mote" style={{ left: '18%', bottom: '18%', animationDuration: '17s' }} />
          <span className="mote" style={{ left: '38%', bottom: '8%', animationDuration: '23s', animationDelay: '3s' }} />
          <span className="mote" style={{ left: '72%', bottom: '12%', animationDuration: '19s', animationDelay: '7s' }} />
          <span className="mote" style={{ left: '86%', bottom: '24%', animationDuration: '25s', animationDelay: '1.5s' }} />
        </div>

        {/* ── the fan of letters (behind the envelope, so the pocket hides their feet) ── */}
        <div className="fan" ref={fanRef} aria-hidden={!activeDiscover}>
          {shown.map((e, i) => (
            <div className={`fan-card${picked === e.id ? ' is-focus' : ''}`} data-id={e.id} key={e.id} style={{ '--tint': e.color } as CSSProperties}>
              <div className="card-tilt">
                <div className="card-body">
                  <div className="card-flap" />
                  <div className="card-meta"><span>{schoolName(e.schoolId)}</span><span>{dateLabel(e)}</span></div>
                  <div className="card-art">
                    <div className="card-art-tint" style={{ background: e.color }} />
                    {cardArt(e)}
                    <span className="card-cat">{e.category}</span>
                  </div>
                  <h3 className="card-title">{e.title}</h3>
                  <p className="card-school">{e.subtitle}</p>
                  <span className="card-cta">打开这封来信</span>
                  <span className="card-wax" />
                  <button
                    className="card-hit"
                    aria-label={`${e.title}，${schoolName(e.schoolId)}，${dateLabel(e)}`}
                    aria-pressed={picked === e.id}
                    onPointerEnter={ev => { if (ev.pointerType === 'mouse') hoverCard(ev.currentTarget.closest('.fan-card') as HTMLElement, e.id); }}
                    onPointerMove={ev => {
                      if (ev.pointerType !== 'mouse' || picked !== e.id) return;
                      const r = ev.currentTarget.getBoundingClientRect();
                      tilt(ev.currentTarget.closest('.fan-card') as HTMLElement, (ev.clientX - r.left) / r.width - 0.5, (ev.clientY - r.top) / r.height - 0.5);
                    }}
                    onPointerLeave={ev => {
                      if (ev.pointerType !== 'mouse') return;
                      const c = ev.currentTarget.closest('.fan-card') as HTMLElement | null;
                      const t = c?.querySelector<HTMLElement>('.card-tilt');
                      if (t) gsap.to(t, { rotateX: 0, rotateY: 0, duration: 0.5, ease: 'power3.out' });
                    }}
                    onFocus={ev => { hoverCard(ev.currentTarget.closest('.fan-card') as HTMLElement, e.id); }}
                    onClick={() => openLetter(e)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── the envelope: one layer, honest z-order ── */}
        <div className="env-layer" ref={envLayer}>
          <div className="env-cast" />
          <div className="env-contact" />
          <div className="env-stack" />
          <div className="env-interior" />
          <div className="env-sheet" />
          <div className="pocket-fill" aria-hidden="true" />
          <svg className="pocket-shape" viewBox="0 0 960 600" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="pocketPaper" x1="0.1" y1="0" x2="0.85" y2="1">
                <stop offset="0" stopColor="#f9f1dd" />
                <stop offset="0.55" stopColor="#f4e7ca" />
                <stop offset="1" stopColor="#eedcbb" />
              </linearGradient>
              <radialGradient id="pocketLight" cx="0.18" cy="0.88" r="0.75">
                <stop offset="0" stopColor="#ffffff" stopOpacity="0.5" />
                <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="pocketShade" cx="0.9" cy="0.1" r="0.7">
                <stop offset="0" stopColor="#b08f5c" stopOpacity="0.16" />
                <stop offset="1" stopColor="#b08f5c" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="pocketSeam" x1="0" y1="0" x2="0.5" y2="1">
                <stop offset="0" stopColor="#8a6f45" stopOpacity="0.34" />
                <stop offset="1" stopColor="#8a6f45" stopOpacity="0.06" />
              </linearGradient>
            </defs>
            <path d="M 0 0 L 480 360 L 960 0 L 960 592 Q 960 600 952 600 L 8 600 Q 0 600 0 592 Z" fill="url(#pocketPaper)" />
            <path d="M 0 0 L 480 360 L 960 0 L 960 592 Q 960 600 952 600 L 8 600 Q 0 600 0 592 Z" fill="url(#pocketLight)" />
            <path d="M 0 0 L 480 360 L 960 0 L 960 592 Q 960 600 952 600 L 8 600 Q 0 600 0 592 Z" fill="url(#pocketShade)" />
            <path d="M 0 0 L 480 360 L 960 0" fill="none" stroke="url(#pocketSeam)" strokeWidth="14" opacity="0.4" strokeLinecap="round" />
            <path d="M 0 0 L 480 360 L 960 0" fill="none" stroke="#8a6f45" strokeWidth="1" opacity="0.22" />
          </svg>
          <div className="pocket-print">
            <div className="plaza-print"><PlazaPrint /></div>
            <div className="addr">
              <p className="addr-to">TO · 爱探索的你</p>
              <p className="addr-name">澳门 · 大学城</p>
              <div className="addr-rule" />
              <p className="addr-line">德志广场 · 三校相遇<br />每一次相遇，都有回信</p>
            </div>
            <div className="pocket-postmark"><Postmark /></div>
            <div className="pocket-stamp"><StampFrame /></div>
            <div className="par-avion">PAR AVION</div>
          </div>

          <div className="env-flap" ref={flap}>
            <svg className="flap-under" viewBox="0 0 960 360" aria-hidden="true">
              <g fill="none" stroke="#5c4a28" strokeLinecap="round">
                <path d="M2 2 L480 356 L958 2" strokeWidth="16" opacity="0.055" />
                <path d="M2 2 L480 356 L958 2" strokeWidth="8" opacity="0.075" />
                <path d="M2 2 L480 356 L958 2" strokeWidth="3" opacity="0.09" />
              </g>
            </svg>
            <div className="flap-face flap-front">
              <svg className="flap-paper" viewBox="0 0 960 360" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <linearGradient id="flapPaper" x1="0" y1="0" x2="0.25" y2="1">
                    <stop offset="0" stopColor="#fdf7e7" />
                    <stop offset="0.5" stopColor="#f7ecd4" />
                    <stop offset="1" stopColor="#efdfbf" />
                  </linearGradient>
                  <linearGradient id="flapSheen" x1="0" y1="0" x2="0.4" y2="1">
                    <stop offset="0" stopColor="#ffffff" stopOpacity="0.6" />
                    <stop offset="0.55" stopColor="#ffffff" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M 9 0 L 951 0 Q 960 0 960 9 L 480 360 L 0 9 Q 0 0 9 0 Z" fill="url(#flapPaper)" />
                <path d="M 9 0 L 951 0 Q 960 0 960 9 L 480 360 L 0 9 Q 0 0 9 0 Z" fill="url(#flapSheen)" />
                <path d="M 2 8 L 480 358 L 958 8" fill="none" stroke="#c9b18a" strokeWidth="1" opacity="0.35" />
              </svg>
              <div className="flap-return">FROM · 德志广场<br />澳门 · 大学城</div>
              <div className="flap-vol">VOL. 01<br />2026</div>
              <div className="flap-print">
                <p className="flap-kicker">寄给爱探索的你</p>
                <h1 className="flap-title">校园来信</h1>
                <div className="flap-rule" />
                <p className="flap-sub">打开一封来自大学城的邀请</p>
              </div>
              <div className="flap-sprig"><Sprig /></div>
              <div className="flap-grain" />
            </div>
            <div className="flap-face flap-back">
              <svg className="flap-paper" viewBox="0 0 960 360" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <linearGradient id="flapLining" x1="0" y1="0" x2="0.2" y2="1">
                    <stop offset="0" stopColor="#f2e4c6" />
                    <stop offset="1" stopColor="#e4cfa9" />
                  </linearGradient>
                </defs>
                <path d="M 9 0 L 951 0 Q 960 0 960 9 L 480 360 L 0 9 Q 0 0 9 0 Z" fill="url(#flapLining)" />
              </svg>
            </div>
          </div>

          <div className="seal" ref={seal}>
            <div className="seal-shadow" />
            <div className="seal-head"><span className="seal-thread">校园来信</span></div>
            <div className="seal-tail" ref={sealTail}>
              <span className="seal-mark">启</span>
              <span className="seal-hint">拆封处</span>
            </div>
          </div>
          <div className="hint" ref={hintRef} aria-hidden="true">
            <svg className="hint-arrow" viewBox="0 0 54 40" fill="none">
              <path d="M52 4 C 40 16, 26 24, 8 28" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M14 22 L7 28.5 L15 31" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="hint-copy">轻轻一按，替你拆信<small>TOUCH TO UNSEAL</small></span>
          </div>
        </div>

        <button className="env-open" ref={openBtn} onClick={open} disabled={phase !== 'IDLE'} aria-label="打开校园来信" tabIndex={phase === 'IDLE' ? 0 : -1} />

        <div className="wind wind-front" aria-hidden="true">
          <span className="leaf leaf-2"><Leaf variant={1} /></span>
          <span className="leaf leaf-3"><Leaf variant={2} /></span>
        </div>

        {/* ── discover chrome ── */}
        <div className="discover-head">
          <span className="kicker">一封来信 · 一种新鲜事</span>
          <h2 className="discover-title" tabIndex={-1} data-heading={phase === 'DISCOVER' ? true : undefined}>今天，想遇见什么<em>？</em></h2>
          <p className="discover-note">六封来信，来自三所大学</p>
        </div>
        <nav className="filters" aria-label="按学校筛选" ref={filtersRef}>
          {[{ id: 'all', name: '全部来信' }, ...schools].map(s => (
            <button key={s.id} className="filter" aria-pressed={school === s.id} onClick={() => changeFilter(s.id)}>{s.name}</button>
          ))}
        </nav>
        <span className="filter-count" role="status">{available.length} 封 · 演示活动</span>
        <div className="discover-tip">轻点一封来信，看看它的故事</div>
        <div className="tray-label" ref={trayLabel}>
          <div className="picked">
            {pickedEvent ? (
              <>
                <span className="kicker">{schoolName(pickedEvent.schoolId)} · {dateLabel(pickedEvent)} · {pickedEvent.category}</span>
                <strong className="tray-title">{pickedEvent.title}</strong>
              </>
            ) : (
              <span className="tray-empty">还没挑好？把信封翻开看看。</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            {available.length > 6 && (
              <div className="pager">
                <button disabled={batch === 0} onClick={() => { setPicked(null); setBatch(b => b - 1); }} aria-label="上一组">←</button>
                <span>{batch + 1} / {Math.ceil(available.length / 6)}</span>
                <button disabled={(batch + 1) * 6 >= available.length} onClick={() => { setPicked(null); setBatch(b => b + 1); }} aria-label="下一组">→</button>
              </div>
            )}
            <button className="btn" disabled={!pickedEvent} onClick={() => pickedEvent && openLetter(pickedEvent)} style={{ opacity: pickedEvent ? 1 : 0.45 }}>
              <span>打开这封来信</span><span className="arrow">→</span>
            </button>
          </div>
        </div>

        {/* ── detail: the letter ── */}
        <div className="letter-stage" ref={letterStage} inert={phase !== 'DETAIL'}>
          <div className="letter-envelope" />
          <section className="sheet" ref={sheet} aria-label="活动详情">
            <button className="sheet-tab" onClick={closeLetter}>← 放回来信</button>
            {current && (
              <div className="sheet-grid">
                <figure className="sheet-plate">
                  <div className="sheet-plate-tint" style={{ background: current.color }} />
                  {cardArt(current)}
                  <figcaption>德志广场 · 演示插画</figcaption>
                </figure>
                <div className="sheet-copy">
                  <div className="sheet-head">
                    <span className="kicker">FROM {schoolName(current.schoolId)}</span>
                    <span className="sheet-no">NO. {String(events.indexOf(current) + 1).padStart(2, '0')} / 06</span>
                  </div>
                  <h2 className="sheet-title" tabIndex={-1} data-heading={phase === 'DETAIL' ? true : undefined}>{current.title}</h2>
                  <p className="sheet-sub">{current.subtitle}</p>
                  <dl className="sheet-facts">
                    <div><dt>时间</dt><dd>{dateLabel(current)} · {timeLabel(current)}</dd></div>
                    <div><dt>地点</dt><dd>{current.location}</dd></div>
                    <div><dt>类型</dt><dd>{current.category}</dd></div>
                  </dl>
                  <div className="sheet-body">
                    {current.description.split('\n').map(p => <p key={p}>{p}</p>)}
                  </div>
                  <div className="sheet-foot">
                    <span className="sheet-sign">写于 <b>德志广场</b> · 冬日</span>
                    <button className="btn" onClick={takePostcard}><span>抽出纪念明信片</span><span className="arrow">→</span></button>
                  </div>
                  <p className="sheet-note">期待在广场，与你遇见。</p>
                  <div className="sheet-stamp"><Postmark text="DEZHI SQUARE ·" /></div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ── postcard ── */}
        <div className="postcard-stage" ref={postcardStage} inert={phase !== 'POSTCARD'}>
          <div className="postcard-head">
            <span className="kicker">一页可以寄出的纪念</span>
            <h2 tabIndex={-1} data-heading={phase === 'POSTCARD' ? true : undefined}>把这次相遇，留在手心</h2>
          </div>
          <button
            className={`pc-object${flipped ? ' is-flipped' : ''}`}
            ref={pc}
            onClick={flip}
            aria-label={`明信片${flipped ? '背面' : '正面'}，点击翻面`}
            aria-pressed={flipped}
          >
            <div className="pc-inner" ref={pcInner}>
              <div className="pc-face pc-front">
                <div className="pc-edge" />
                <div className="pc-front-art">
                  <div className="tint" style={{ background: current?.color ?? '#c9ddca' }} />
                  {current && cardArt(current)}
                </div>
                <div className="pc-caption">
                  <div className="t">
                    <span>GREETINGS FROM CAMPUS</span>
                    <strong>{current?.title}</strong>
                  </div>
                  <div className="pc-serial">NO. {current ? String(events.indexOf(current) + 1).padStart(2, '0') : '01'} / 06<br />WINTER 2026</div>
                </div>
              </div>
              <div className="pc-face pc-back">
                <div className="pc-back-inner">
                  <div className="pc-back-head">
                    <div className="left">
                      <strong>写给爱探索的你</strong>
                      <span>POSTCARD · 校园来信</span>
                    </div>
                    <div className="pc-back-stamp"><StampFrame label={schoolName(current?.schoolId ?? 'um')} value="2.00" /></div>
                  </div>
                  <div className="pc-postmark"><Postmark /></div>
                  <div className="pc-body">
                    <div>
                      <p className="pc-message"><span className="lead">DEAR EXPLORER,</span>{postcard?.postcardText}</p>
                      <p className="pc-sign">—— 写于 <b>德志广场</b> · 冬日</p>
                      <div className="pc-ruled"><i /><i /></div>
                    </div>
                    <div className="pc-address">
                      <span>{schoolName(current?.schoolId ?? 'um')}<br />{current?.title}<br />{current ? dateLabel(current) : ''} · {current ? timeLabel(current) : ''}</span>
                      <i />
                      <span>{current?.location}</span>
                    </div>
                  </div>
                  <div className="pc-back-deco"><Postmark text="DEZHI ·" /></div>
                  <span className="pc-back-foot">演示纪念明信片 · 不涉及实体投递</span>
                </div>
              </div>
            </div>
          </button>
          <p className="pc-hint">轻点明信片，翻到另一面</p>
          <div className="pc-actions">
            <button className="text-link pc-back" onClick={backPostcard}>← 放回明信片</button>
            <button className="btn btn-quiet" onClick={flip}><span>翻到{flipped ? '正' : '背'}面</span><span className="arrow">↻</span></button>
            <button className="btn" onClick={keep}><span>收下这张明信片</span><span className="arrow">→</span></button>
          </div>
        </div>

        {/* ── complete ── */}
        <div className="complete-stage" ref={completeStage} inert={phase !== 'COMPLETE'}>
          <div className="kept-wrap">
            <div className="kept-sleeve" ref={sleeve}>
              <div className="kept-sleeve-label"><BrandMark />把这段相遇，妥帖收藏</div>
            </div>
            <div className="kept-ink" ref={keptInk} />
            <div className="kept-stamp" ref={keptStamp}>
              <svg viewBox="0 0 132 132" aria-hidden="true">
                <circle cx="66" cy="66" r="56" fill="none" stroke="currentColor" strokeWidth="3" />
                <circle cx="66" cy="66" r="44" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.7" />
                <text x="66" y="52" textAnchor="middle" fontSize="15" letterSpacing="3" fill="currentColor" fontFamily="'Campus Display', sans-serif">已收藏</text>
                <text x="66" y="78" textAnchor="middle" fontSize="9" letterSpacing="2.4" fill="currentColor" fontFamily="'Campus Serif', serif">DEC · 2026</text>
                <path d="M40 92 h52" stroke="currentColor" strokeWidth="1" opacity="0.6" />
              </svg>
            </div>
          </div>
          <div className="complete-copy">
            <span className="kicker">一封来信 · 已被珍藏</span>
            <h2 className="complete-title" tabIndex={-1} data-heading={phase === 'COMPLETE' ? true : undefined}>这份美好，<br />与你<em>相遇</em>了。</h2>
            <div className="complete-line"><i /><span>KEPT DIGITALLY</span><i /></div>
            <div className="complete-picked">
              <strong>{current?.title}</strong>
              <span>{current ? schoolName(current.schoolId) : ''} · {current ? dateLabel(current) : ''}</span>
            </div>
            <p className="complete-note">本次仅确认数字选择，不涉及实体明信片投递。<br />愿每一次经过，都有新的发现。</p>
            <div className="complete-actions">
              <button className="btn" onClick={reset}><span>完成体验，回到待机</span><span className="arrow">↶</span></button>
            </div>
          </div>
        </div>

        <footer className="colophon">
          <span>澳门 · 大学城 · 冬日来信</span>
          <span className="rule" />
          {step >= 0 ? (
            <ol className="steps" aria-label="体验进度">
              {['挑选', '读信', '明信片', '收藏'].map((name, i) => (
                <li key={name} className={step === i ? 'is-now' : step > i ? 'is-done' : ''} aria-current={step === i ? 'step' : undefined}>
                  <i />{name}
                </li>
              ))}
            </ol>
          ) : (
            <span>一封等待拆开的邀请</span>
          )}
          <span className="rule" />
          <span>原型演示 · 非官方活动资讯</span>
          <a href="/?v3">V3</a>
        </footer>

        {phase === 'OPENING' && <button className="skip-btn" ref={skipRef} onClick={skip}>跳过开场 →</button>}
      </div>

      <dialog className="v4-dialog" ref={dialog} aria-labelledby="v4-timeout" onCancel={e => { e.preventDefault(); resume(); }}>
        <div className="dialog-card">
          <p className="kicker">STILL EXPLORING?</p>
          <div className="dialog-count" aria-hidden="true">{String(seconds).padStart(2, '0')}</div>
          <h2 className="dialog-title" id="v4-timeout">这封来信，等你继续。</h2>
          <p className="dialog-copy" role="status">{seconds} 秒后将清空本次选择，回到待机。</p>
          <div className="dialog-actions">
            <button className="btn" onClick={resume}><span>继续探索</span><span className="arrow">→</span></button>
            <button className="text-link" onClick={reset}>结束体验</button>
          </div>
        </div>
      </dialog>
    </div>
  );

  function changeFilter(id: string) {
    if (id === school) return;
    const nodes = gsap.utils.toArray<HTMLElement>('.fan-card');
    if (!nodes.length) { setSchool(id); setBatch(0); return; }
    const t = gsap.timeline();
    tl.current?.kill();
    t.to(nodes, { y: 620, autoAlpha: 0, rotation: 0, duration: reduce ? 0.001 : 0.3, stagger: reduce ? 0 : 0.025, ease: 'power2.in' })
      .call(() => { setSchool(id); setBatch(0); setPicked(null); });
  }
}
