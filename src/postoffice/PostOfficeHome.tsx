import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { createPostOffice } from './scene';
import './home.css';
gsap.registerPlugin(useGSAP);
export function PostOfficeHome(){
 const root=useRef<HTMLDivElement>(null),canvas=useRef<HTMLDivElement>(null),model=useRef<ReturnType<typeof createPostOffice>|null>(null),timeline=useRef<gsap.core.Timeline|null>(null);
 const [state,setState]=useState<'closed'|'opening'|'open'>('closed');const [failure,setFailure]=useState(false);
 const {contextSafe}=useGSAP(()=>{try{model.current=createPostOffice(canvas.current!);}catch{setFailure(true);}return()=>{timeline.current?.kill();model.current?.dispose();model.current=null;};},{scope:root});
 const open=contextSafe(()=>{if(state==='opening')return;const m=model.current;if(!m)return;const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(state==='open'){setState('opening');m.play();timeline.current=gsap.timeline({onComplete:()=>{m.stop();setState('closed');}}).to(m.letter.scale,{x:.001,y:.001,z:.001,duration:reduce?0:.2}).to(m.door.rotation,{x:0,duration:reduce?0:.35,ease:'power2.out'}).set(m.letter.position,{y:1.7,z:.9});return;}
 setState('opening');m.play();timeline.current=gsap.timeline({onComplete:()=>{m.stop();setState('open');}}).to('.po-interact',{scale:.96,duration:reduce?0:.09}).to('.po-interact',{scale:1,duration:reduce?0:.16}).to(m.door.rotation,{x:1.65,duration:reduce?0:.6,ease:'power2.inOut'},.08).to(m.letter.scale,{x:1,y:1,z:1,duration:reduce?0:.28},.4).to(m.letter.position,{y:2.3,z:2.05,duration:reduce?0:.65,ease:'power3.out'},.4).to(m.letter.rotation,{z:-.12,y:.08,duration:reduce?0:.5},.4);
 });
 return <div className="po-home" ref={root}><header className="po-header"><a href="/" aria-label="校园来信，打开原版体验" className="po-brand"><span className="po-brand-icon">✉</span><span>校园来信<small>德志广场 · 三校相遇</small></span></a><span className="po-season"><i/> 冬日的好故事，正在营业</span></header><main className="po-main"><section className="po-copy"><p className="po-eyebrow">大学城里的一间小邮局</p><h1>叮咚，<br/>校园<span>来信了。</span></h1><p className="po-description">一场活动，一段相遇。<br/>把校园的小美好，收藏成一张明信片。</p><a className="po-start" href="/?explore=1">开始探索 <span aria-hidden="true">→</span></a><p className="po-start-note">三所大学 · 六场相遇 · 一份校园记忆</p><div className="po-message" role="status">{state==='open'?'来信已送达。愿下一场相遇，刚好是你喜欢的。':'邮局的小秘密，藏在右边的信箱里。'}</div></section><section className="po-stage" aria-label="微缩校园邮局"><div className="po-halo"/><div className="po-canvas" ref={canvas} role="img" aria-label="釉绿拱顶邮局、黄铜配件、纸质信件与陶盆植物组成的三维微缩场景"/>{failure&&<p className="po-failure">此浏览器未能开启三维场景，仍可点击开始探索。</p>}<button className="po-interact" onClick={open} disabled={state==='opening'||failure} aria-expanded={state==='open'}><span aria-hidden="true">{state==='open'?'↶':'✉'}</span>{state==='opening'?'来信正在路上…':state==='open'?'收好来信，再看一次':'打开信箱，收一封来信'}</button><p className="po-stage-note">为每一份好奇，留一个温柔的入口</p></section></main><footer className="po-footer"><span>校园活动探索 · 数字纪念明信片</span><span>原型演示 · 非官方活动资讯</span></footer></div>;
}

