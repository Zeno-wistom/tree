import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { events, schools, schoolName, dateLabel, timeLabel } from '../data';
import type { CampusEvent } from '../data';
import { MiniScene, Scenery } from './Illustrations';
import './directions.css';

gsap.registerPlugin(useGSAP);

const directions = {
  a: { name: '柔软的校园绘本', short: '校园绘本', hero: '/v2/storybook-original-1400.webp', title: <>把校园，<br/>翻成<span>一页奇遇。</span></>, subtitle: '每一场相遇，都值得被轻轻收藏。', cta: '翻开校园绘本', discovery: '今天，翻到哪一种快乐？', alt: '原创手绘校园绘本场景' },
  b: { name: '玩具互动邮局', short: '玩具邮局', hero: '/v2/post-office-original-1400.webp', title: <>叮咚！<br/>校园有<span>好事发生。</span></>, subtitle: '转一转，盖个章，把喜欢的故事收进口袋。', cta: '去邮局逛一逛', discovery: '你的下一封快乐来信', alt: '原创漆木玩具校园邮局场景' },
  c: { name: '校园奇遇空间', short: '奇遇地图', hero: '/v2/adventure-original-1400.webp', title: <>出发吧，<br/>校园藏着<span>小惊喜！</span></>, subtitle: '顺着好奇心走，下一场相遇就在前面。', cta: '开启校园奇遇', discovery: '下一站，想去哪里看看？', alt: '原创水彩校园奇遇地图片段' },
} as const;
type Direction = keyof typeof directions;
const directionKeys: Direction[] = ['a', 'b', 'c'];

export function DirectionLab({ direction: requested }: { direction: string }) {
  const direction: Direction = directionKeys.includes(requested as Direction) ? requested as Direction : 'a';
  const config = directions[direction];
  const [page, setPage] = useState<'home' | 'discover'>('home');
  const [school, setSchool] = useState('all');
  const [selected, setSelected] = useState<CampusEvent | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const filtered = events.filter(item => school === 'all' || item.schoolId === school);

  const { contextSafe } = useGSAP((_, safe) => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (page === 'home') {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: reduce ? 0 : 0.48 } });
      tl.from('.v2-intro > *', { y: reduce ? 0 : 18, autoAlpha: 0, stagger: 0.06 })
        .from('.v2-hero-art', { y: reduce ? 0 : 22, autoAlpha: 0, rotation: reduce ? 0 : direction === 'b' ? 2 : -1.5 }, 0.12)
        .from('.v2-hero-detail', { y: reduce ? 0 : 12, autoAlpha: 0 }, 0.34);
      if (!reduce) {
        gsap.to('.v2-float', { y: -5, duration: 3.4, ease: 'sine.inOut', repeat: -1, yoyo: true });
        gsap.to('.v2-leaf', { rotation: 1.1, transformOrigin: '50% 90%', duration: 3.6, ease: 'sine.inOut', repeat: -1, yoyo: true });
      }
    } else {
      gsap.from('.v2-discover-head > *, .v2-filter-row', { y: reduce ? 0 : 10, autoAlpha: 0, duration: reduce ? 0 : 0.28, ease: 'power2.out', stagger: 0.045 });
    }
    const enterList = safe?.(() => {
      if (!list.current) return;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      gsap.fromTo(list.current.querySelectorAll('.v2-event'), { y: reduce ? 0 : 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: reduce ? 0 : 0.25, ease: 'power2.out', stagger: 0.045, overwrite: true, clearProps: 'transform,opacity,visibility' });
    });
    enterList?.();
  }, { scope: root, dependencies: [page, school, direction], revertOnUpdate: true });

  const openEvent = contextSafe((event: CampusEvent) => {
    returnFocus.current = document.activeElement as HTMLElement;
    setSelected(event);
  });
  useEffect(() => {
    if (!selected || !dialog.current) return;
    dialog.current.showModal();
    return () => { dialog.current?.close(); returnFocus.current?.focus(); };
  }, [selected]);

  return <div className={`v2 v2-${direction} v2-page-${page}`} ref={root}>
    <header className="v2-header">
      <a href="/" className="v2-brand" aria-label="校园来信，返回V1首页"><span className="v2-brand-flower" aria-hidden="true">✳</span><span>校园来信<small>德志广场 · 冬日来信</small></span></a>
      <nav className="v2-direction-tabs" aria-label="选择视觉方向">{directionKeys.map(key => <a key={key} href={`/?direction=${key}`} aria-current={key === direction ? 'page' : undefined}><span>{key.toUpperCase()}</span>{directions[key].short}</a>)}</nav>
      <span className="v2-review-label">视觉方向评审 <span aria-hidden="true">●</span></span>
    </header>
    <main className="v2-main">
      {page === 'home' ? <section className="v2-home" aria-label={`${config.name}首页`}>
        <div className="v2-intro">
          <span className="v2-kicker">来校园，遇见一点新鲜事</span>
          <h1>{config.title}</h1>
          <p>{config.subtitle}</p>
          <button className="v2-primary" onClick={() => setPage('discover')}>{config.cta}<span aria-hidden="true">→</span></button>
          <span className="v2-touch-note">轻轻一点，开始发现</span>
        </div>
        <div className="v2-hero-art">
          <div className="v2-image-wrap"><img src={config.hero} alt={config.alt} width="1400" height={direction === 'a' ? '876' : '933'}/></div>
          {direction === 'a' && <div className="v2-hero-detail v2-story-note"><span>这一页，写着我们的校园</span><strong>有好风景，也有新故事。</strong><MiniScene direction={direction} index={0}/></div>}
          {direction === 'b' && <div className="v2-hero-detail v2-mail-ticket"><span>今日快乐，准时营业</span><strong>请取一封校园来信</strong><span className="v2-ticket-code">No. 001 · 冬日的问候</span></div>}
          {direction === 'c' && <div className="v2-hero-detail v2-map-key"><span aria-hidden="true">✦</span><p>小路会拐弯，<br/>惊喜不绕路。</p><div className="v2-route" aria-hidden="true"><i/><i/><i/></div></div>}
        </div>
        <div className="v2-home-foot"><span>{direction === 'a' ? '一页一页，收藏校园的小美好' : direction === 'b' ? '把喜欢的故事，装进今天的口袋' : '三所大学，一条充满可能的小路'}</span><span>原创场景 · 想象的校园</span></div>
      </section> : <section className="v2-discover" aria-label={`${config.name}活动发现`}>
        <div className="v2-discover-head"><button className="v2-back" onClick={() => { setSchool('all'); setPage('home'); }}><span aria-hidden="true">←</span> 回到{direction === 'a' ? '封面' : direction === 'b' ? '邮局' : '地图起点'}</button><div><span className="v2-kicker">{direction === 'a' ? '校园活动 · 第 01 页' : direction === 'b' ? '校园来信 · 今日投递' : '校园奇遇 · 发现下一站'}</span><h1>{config.discovery}</h1></div><span className="v2-result" role="status">{filtered.length} 场小美好</span></div>
        <div className="v2-filter-row" aria-label="按学校筛选">{[{ id: 'all', name: '全部活动' }, ...schools].map(item => <button key={item.id} aria-pressed={school === item.id} onClick={() => setSchool(item.id)}>{item.name}{school === item.id && <span aria-hidden="true"> ✓</span>}</button>)}<span>演示活动 · 原创场景</span></div>
        <div className="v2-events" ref={list}>{filtered.map((event, index) => <button className={`v2-event v2-event-${index}`} key={event.id} onClick={() => openEvent(event)}><div className="v2-event-art"><MiniScene direction={direction} index={index}/><span className="v2-event-tag">{event.category}</span></div><span className="v2-event-school">{schoolName(event.schoolId)}<span>{dateLabel(event)}</span></span><h2>{event.title}</h2><span className="v2-event-action">{direction === 'a' ? '翻开这一页' : direction === 'b' ? '拆开这封信' : '去这里看看'}<span aria-hidden="true">↗</span></span></button>)}</div>
      </section>}
    </main>
    <footer className="v2-footer"><span>德志广场互动树 · 校园活动探索</span><span>方向 {direction.toUpperCase()} / {config.name}</span><span>原型演示 · 非官方活动资讯</span></footer>
    <dialog className="v2-dialog" ref={dialog} onCancel={() => setSelected(null)} onClick={event => { if (event.target === dialog.current) setSelected(null); }} aria-labelledby="v2-dialog-title">{selected && <div className="v2-dialog-inner"><button className="v2-dialog-close" onClick={() => setSelected(null)} aria-label="关闭活动资料">×</button><div className="v2-dialog-art"><MiniScene direction={direction} index={events.indexOf(selected)}/></div><span className="v2-kicker">{selected.category} / {schoolName(selected.schoolId)}</span><h2 id="v2-dialog-title">{selected.title}</h2><p className="v2-dialog-facts">{dateLabel(selected)} · {timeLabel(selected)}<br/>{selected.location}</p><p>{selected.description.split('\n')[0]}</p><button className="v2-primary" onClick={() => setSelected(null)}>继续发现其他活动 <span aria-hidden="true">→</span></button><span className="v2-dialog-note">当前为视觉方向评审，明信片选择流程将在方向确定后接入。</span></div>}</dialog>
  </div>;
}

