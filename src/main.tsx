import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Art } from './Art';
import { events, postcards, schools, schoolName, dateLabel, timeLabel, theme, sessionConfig } from './data';
import type { CampusEvent, Postcard } from './data';
import './style.css';
import { DirectionLab } from './v2/DirectionLab';
import { EnvelopeApp as EnvelopeAppV4 } from './v4/EnvelopeApp';
import { Experience as ExperienceV5 } from './v5/Experience';
const EnvelopeApp = React.lazy(() => import('./v3/EnvelopeApp').then(m => ({ default: m.EnvelopeApp })));
const PostOfficeHome = React.lazy(() => import('./postoffice/PostOfficeHome').then(m => ({ default: m.PostOfficeHome })));

type Page = 'home' | 'discover' | 'detail' | 'postcard' | 'complete';
const pageNames = ['发现活动', '了解活动', '预览明信片', '完成选择'];
function Arrow({ back = false }: { back?: boolean }) { return <span aria-hidden="true">{back ? '←' : '↗'}</span>; }
function Stamp({ small = false }: { small?: boolean }) { return <div className={`postmark ${small ? 'small' : ''}`} aria-hidden="true"><span>DEZHI SQUARE</span><b>校园来信</b><span>WINTER · 2026</span></div>; }
function PostcardFace({ event, postcard, back = false }: { event: CampusEvent; postcard: Postcard; back?: boolean }) {
  return back ? <div className="postcard-back"><div className="letter-top"><span>POSTCARD / 校园来信</span><div className="mini-stamp">冬<br/>日</div></div><div className="letter-columns"><div><span className="eyebrow">DEAR EXPLORER,</span><p>{postcard.postcardText}</p><p className="letter-sign">来自大学城的一份冬日记忆</p></div><div className="address"><span>TO: 爱探索的你</span><i/><i/><i/><span>德志广场 · 数字纪念</span></div></div><span className="letter-bottom">{schoolName(event.schoolId)} / {event.title} · 演示明信片</span></div>
  : <div className="postcard-front"><Art kind={postcard.frontImage}/><div className="postcard-caption"><div><span className="eyebrow">GREETINGS FROM CAMPUS</span><strong>{event.title}</strong></div><span className="serial">No. {String(events.indexOf(event) + 1).padStart(2, '0')}<br/>WINTER 2026</span></div></div>;
}
function App() {
  const [page, setPage] = useState<Page>(new URLSearchParams(location.search).has('explore') ? 'discover' : 'home');
  const [school, setSchool] = useState('all');
  const [eventId, setEventId] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [selection, setSelection] = useState<{ eventId: string; postcardId: string } | null>(null);
  const [warning, setWarning] = useState(false);
  const [seconds, setSeconds] = useState(15);
  const lastActivity = useRef(Date.now());
  const warningAt = useRef<number | null>(null);
  const scrollTop = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const continueRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const event = events.find(item => item.id === (selection?.eventId ?? eventId));
  const postcard = postcards.find(item => item.id === (selection?.postcardId ?? event?.postcardId) && item.eventId === event?.id);
  const filtered = events.filter(item => item.status !== 'ended' && (school === 'all' || item.schoolId === school));
  const featured = events.find(item => item.featured) ?? events[0];
  function reset() { setPage('home'); setSchool('all'); setEventId(null); setSelection(null); setFlipped(false); setWarning(false); warningAt.current = null; scrollTop.current = 0; lastActivity.current = Date.now(); }
  function resume() { setWarning(false); warningAt.current = null; lastActivity.current = Date.now(); previousFocus.current?.focus(); }
  function openEvent(item: CampusEvent) { scrollTop.current = listRef.current?.scrollTop ?? 0; setEventId(item.id); setFlipped(false); setPage('detail'); }
  useLayoutEffect(() => { headingRef.current?.focus({ preventScroll: true }); if (page === 'discover' && listRef.current) listRef.current.scrollTop = scrollTop.current; }, [page]);
  useEffect(() => {
    const onActivity = (e: globalThis.Event) => {
      if ((e.target as HTMLElement)?.closest?.('[role="dialog"]')) return;
      if (warningAt.current !== null) { setWarning(false); warningAt.current = null; }
      lastActivity.current = Date.now();
    };
    window.addEventListener('pointerdown', onActivity); window.addEventListener('keydown', onActivity); window.addEventListener('wheel', onActivity, { passive: true });
    return () => { window.removeEventListener('pointerdown', onActivity); window.removeEventListener('keydown', onActivity); window.removeEventListener('wheel', onActivity); };
  }, []);
  useEffect(() => {
    if (page === 'home') return;
    const timer = window.setInterval(() => {
      const now = Date.now();
      if (warningAt.current !== null) { const remaining = Math.ceil((sessionConfig.warningMs - (now - warningAt.current)) / 1000); setSeconds(Math.max(0, remaining)); if (remaining <= 0) reset(); }
      else if (now - lastActivity.current >= sessionConfig.idleMs) { previousFocus.current = document.activeElement as HTMLElement; warningAt.current = now; setSeconds(Math.ceil(sessionConfig.warningMs / 1000)); setWarning(true); }
    }, 250);
    return () => window.clearInterval(timer);
  }, [page]);
  useEffect(() => { if (warning) continueRef.current?.focus(); }, [warning]);
  const step = page === 'discover' ? 0 : page === 'detail' ? 1 : page === 'postcard' ? 2 : 3;
  return <div className="app" style={{ '--theme-paper': theme.background } as React.CSSProperties}>
    <header className="header"><button className="brand" onClick={reset} aria-label="校园来信，返回首页"><span className="brand-icon" aria-hidden="true">✳</span><span>校园来信<small>CAMPUS POST</small></span></button><div className="header-center">德志广场互动树<span>三校相遇，故事发生</span></div><div className="edition"><span className="live-dot"/>{theme.name}<span className="edition-no">VOL. 01 / 2026</span></div></header>
    <main className={`main page-${page}`} key={page}>
      {page === 'home' && <section className="home-layout" aria-label="冬日校园探索">
        <div className="home-copy"><div className="eyebrow home-kicker"><span className="line"/> A SEASON OF LITTLE DISCOVERIES</div><h1 ref={headingRef} tabIndex={-1}>在校园，<br/>遇见<span className="red">小美好</span><span className="title-star" aria-hidden="true">✳</span></h1><p className="home-intro">一场活动，一段相遇。<br/>把这个冬天，收藏成一张明信片。</p><button className="primary start" onClick={() => { lastActivity.current = Date.now(); setPage('discover'); }}>开始探索 <Arrow/></button><div className="home-footnote"><span className="tiny-arrow" aria-hidden="true">↳</span> 发现三校活动 · 收藏一份校园记忆</div></div>
        <div className="hero-art"><div className="hero-label">THE WINTER<br/><em>COLLECTION</em><span>冬日校园探索手册</span></div><div className="hero-postcard"><div className="airmail-edge"/><Art kind={featured?.coverImage ?? 'campus'}/><div className="hero-card-title"><span>Greetings<br/><em>from campus.</em></span><span className="hero-card-cn">把相遇<br/>寄给冬天</span></div><div className="hero-card-bottom">DEZHI SQUARE · CAMPUS POSTCARD EXPLORER <span>01 — 06</span></div></div><Stamp/><div className="hero-sticker">三所大学<br/><strong>无限发现</strong><span>✦</span></div><div className="hero-scribble" aria-hidden="true">a little moment,<br/>a lovely memory. ⤴</div></div>
        <div className="home-bottom"><span>EXPLORE. CONNECT. COLLECT.</span><div>{schools.map(item => <span key={item.id}>{item.name}</span>)}</div><span>触摸，开启一段校园奇遇 <span aria-hidden="true">✦</span></span></div>
      </section>}
      {page === 'discover' && <section className="discover-layout"><div className="section-heading"><div><div className="eyebrow">01 / EXPLORE THE CAMPUS</div><h1 ref={headingRef} tabIndex={-1}>今天，想遇见什么<span className="red">？</span></h1></div><span className="heading-note">好故事，正在校园里发生。<br/><b>选一场喜欢的活动，继续探索 ↘</b></span></div><nav className="filters" aria-label="按学校筛选">{[{ id: 'all', name: '全部活动' }, ...schools].map(item => <button key={item.id} aria-pressed={school === item.id} onClick={() => { setSchool(item.id); scrollTop.current = 0; listRef.current?.scrollTo({ top: 0 }); }}>{item.name}{school === item.id && <span aria-hidden="true"> ✳</span>}</button>)}<span className="result-count" role="status">{String(filtered.length).padStart(2, '0')} 个活动 · 演示内容</span></nav><div className="event-scroll" ref={listRef}>{filtered.length ? <div className="event-grid">{filtered.map((item, index) => <button className="event-tile" key={item.id} onClick={() => openEvent(item)}><div className="event-poster" style={{ background: item.color }}><Art kind={item.coverImage}/><span className="poster-number">{String(index + 1).padStart(2, '0')} / CAMPUS</span><span className="category">{item.category}</span><div className="poster-lettering">{item.coverImage === 'campus' ? <>Wander<br/><i>& wonder.</i></> : item.coverImage === 'print' ? <>Make<br/><i>your mark.</i></> : item.coverImage === 'taste' ? <>A taste<br/><i>of Macao.</i></> : <>Under<br/><i>the trees.</i></>}</div></div><div className="event-meta"><span>{schoolName(item.schoolId)}</span><span>{dateLabel(item)}</span></div><div className="event-title"><h2>{item.title}</h2><span aria-hidden="true">↗</span></div><p>{item.subtitle}</p></button>)}</div> : <div className="empty"><span aria-hidden="true">✉</span><h2>新的故事，还在路上</h2><p>这个分类暂时没有活动，换一所学校看看吧。</p><button className="secondary" onClick={() => setSchool('all')}>查看全部活动 <Arrow/></button></div>}</div></section>}
      {page === 'detail' && event && <section className="detail-layout"><div className="detail-visual"><div className="detail-poster" style={{ background: event.color }}><span className="eyebrow">THE WINTER COLLECTION / 演示活动</span><h2>{event.title}</h2><p>{event.subtitle}</p><Art kind={event.coverImage}/><div className="poster-bottom"><span>{schoolName(event.schoolId)}</span><span>{dateLabel(event)}<br/>{timeLabel(event)}</span></div></div><span className="tape" aria-hidden="true"/><Stamp small/></div><div className="detail-copy"><button className="text-button" onClick={() => setPage('discover')}><Arrow back/> 返回活动列表</button><div className="eyebrow">02 / A STORY WORTH DISCOVERING</div><span className="detail-category">{event.category} / {schoolName(event.schoolId)}</span><h1 ref={headingRef} tabIndex={-1}>{event.title}</h1><div className="facts"><div><span>活动时间</span><b>{dateLabel(event)} · {timeLabel(event)}</b></div><div><span>活动地点</span><b>{event.location}</b></div></div><div className="description">{event.description.split('\n').map(text => <p key={text}>{text}</p>)}</div><div className="detail-action"><p>喜欢这段故事？看看它的纪念明信片。</p><button className="primary" onClick={() => { setFlipped(false); setPage('postcard'); }}>查看纪念明信片 <Arrow/></button></div></div></section>}
      {page === 'postcard' && event && <section className="preview-layout"><div className="section-heading"><div><div className="eyebrow">03 / KEEP A LITTLE MEMORY</div><h1 ref={headingRef} tabIndex={-1}>把这一刻，<span className="red">留在手心。</span></h1></div><button className="text-button" onClick={() => setPage('detail')}><Arrow back/> 返回活动详情</button></div>{postcard ? <><div className="preview-workspace"><div className="preview-side"><span className="vertical-label">A POSTCARD FROM CAMPUS</span><Stamp small/></div><div className="flip-area"><button className={`flip-card ${flipped ? 'is-flipped' : ''}`} aria-label={`明信片${flipped ? '背面' : '正面'}，点击翻面`} aria-pressed={flipped} onClick={() => setFlipped(value => !value)}><div className="flip-inner"><div className="flip-face" aria-hidden={flipped}><PostcardFace event={event} postcard={postcard}/></div><div className="flip-face back" aria-hidden={!flipped}><PostcardFace event={event} postcard={postcard} back/></div></div></button><button className="flip-hint" onClick={() => setFlipped(value => !value)}><span aria-hidden="true">⤾</span> 点击明信片，翻到{flipped ? '正' : '背'}面 <span className="face-indicator">{flipped ? '02' : '01'} / 02</span></button></div><div className="preview-note"><span className="eyebrow">MADE FOR THIS MOMENT</span><p>一张小小的卡片，<br/>装下一段校园时光。</p><span className="drawn-star" aria-hidden="true">✳</span></div></div><div className="confirm-bar"><div><span className="eyebrow">你的校园记忆</span><h2>{event.title}</h2><span>{schoolName(event.schoolId)} · 演示纪念明信片</span></div><button className="primary" onClick={() => { setSelection({ eventId: event.id, postcardId: postcard.id }); setPage('complete'); }}>就选这张，确认选择 <Arrow/></button></div></> : <div className="empty"><span aria-hidden="true">✉</span><h2>这张明信片还在准备中</h2><p>当前活动暂时没有匹配的明信片，请返回选择其他活动。</p><button className="secondary" onClick={() => setPage('discover')}>返回活动列表 <Arrow/></button></div>}</section>}
      {page === 'complete' && event && postcard && selection && <section className="complete-layout"><div className="complete-copy"><span className="eyebrow">04 / A MEMORY TO KEEP</span><div className="success-mark" aria-hidden="true">✓</div><h1 ref={headingRef} tabIndex={-1}>这份美好，<br/>已为你<span className="red">收藏。</span></h1><p>属于你的校园故事，从这一次相遇开始。</p><div className="chosen"><span>已选择的活动</span><h2>{event.title}</h2><span>{schoolName(event.schoolId)} · {dateLabel(event)}</span></div><button className="primary" onClick={reset}>完成体验，返回首页 <Arrow/></button><p className="digital-note">本次仅完成数字选择，不涉及实体明信片投递。</p></div><div className="collected"><span className="collection-label">MY CAMPUS MEMORY / 2026</span><div className="collected-card"><PostcardFace event={event} postcard={postcard}/></div><div className="success-stamp">已收藏<span>DIGITALLY COLLECTED</span><b>✦</b></div><p>愿每一次经过，都有新的发现。</p></div></section>}
    </main>
    <footer className="footer"><span>德志广场 · CAMPUS POST</span>{page !== 'home' ? <ol className="steps" aria-label="体验进度">{pageNames.map((name, i) => <li key={name} aria-current={step === i ? 'step' : undefined} className={step >= i ? 'active' : ''}><span>{i + 1}</span>{name}</li>)}</ol> : <span className="footer-center">一份来自大学城的冬日邀请</span>}<span className="demo-label">原型演示 · 非官方活动资讯</span></footer>
    {warning && <div className="modal-backdrop"><div role="dialog" aria-modal="true" aria-labelledby="timeout-title" className="timeout-dialog" onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); resume(); } if (e.key === 'Tab') { const buttons = e.currentTarget.querySelectorAll('button'); if (e.shiftKey && document.activeElement === buttons[0]) { e.preventDefault(); buttons[1].focus(); } else if (!e.shiftKey && document.activeElement === buttons[1]) { e.preventDefault(); buttons[0].focus(); } } }}><span className="eyebrow">STILL EXPLORING?</span><div className="countdown" aria-hidden="true">{seconds.toString().padStart(2, '0')}</div><h2 id="timeout-title">还想再逛一会儿吗？</h2><p role="status">{seconds} 秒后将清空本次选择，返回首页。</p><button className="primary" ref={continueRef} onClick={resume}>继续探索 <Arrow/></button><button className="text-button" onClick={reset}>结束体验，返回首页</button></div></div>}
  </div>;
}

// Earlier versions stay reachable by query param; V5 is the default experience.
const params = new URLSearchParams(window.location.search);
const direction = params.get('direction');
const legacy = params.has('v1') ? 'v1' : params.has('v3') ? 'v3' : params.has('v4') ? 'v4' : params.has('postoffice') ? 'postoffice' : direction ? 'lab' : 'v5';
const root = createRoot(document.getElementById('root')!);

if (legacy === 'v5') {
  root.render(<ExperienceV5 />);
} else if (legacy === 'v4') {
  root.render(<EnvelopeAppV4 />);
} else {
  document.getElementById('first-frame')?.remove();
  root.render(<React.StrictMode>
    {legacy === 'v3' ? <React.Suspense fallback={null}><EnvelopeApp /></React.Suspense>
      : legacy === 'postoffice' ? <React.Suspense fallback={null}><PostOfficeHome /></React.Suspense>
        : legacy === 'lab' ? <DirectionLab direction={direction!} />
          : <App />}
  </React.StrictMode>);
}



