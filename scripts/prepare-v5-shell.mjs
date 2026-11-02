import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const original = await readFile('index.html', 'utf8');
const legacy = original.match(/<template id="legacy-v4-shell">([\s\S]*?)<\/template>/)?.[1]?.trim() ?? original.match(/<div id="first-frame"[\s\S]*?(?=<div id="root">)/)?.[0]?.trim();
if (!legacy) throw new Error('Legacy shell not found');
const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, reducedMotion: 'reduce' });
await page.goto('http://127.0.0.1:5175/', { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
const shell = await page.locator('#root .v5').evaluate(element => {
  const clone = element.cloneNode(true);
  clone.removeAttribute('style');
  clone.setAttribute('aria-hidden', 'true');
  clone.classList.add('v5-static');
  clone.querySelectorAll('.v5-stage > :not(.v5-header):not(.v5-corner):not(.v5-envelope):not(.v5-footer)').forEach(node => node.remove());
  clone.querySelector('.v5-fan')?.remove();
  clone.querySelector('dialog')?.remove();
  clone.querySelectorAll('[style]').forEach(node => node.removeAttribute('style'));
  clone.querySelectorAll('button').forEach(node => node.setAttribute('tabindex', '-1'));
  return clone.outerHTML;
});
await browser.close();
const replacement = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<meta name="theme-color" content="#efeee1"/>
<title>校园来信 · 拾花一叶</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml"/>
<link rel="preload" href="/v5/fonts/text.woff2" as="font" type="font/woff2" crossorigin/>
<link rel="preload" href="/v5/botanical-a.svg" as="image"/>
<link rel="stylesheet" href="/src/v5/experience.css"/>
<link rel="stylesheet" href="/src/v4/base.css"/>
<link rel="stylesheet" href="/src/v4/scene.css"/>
<script>(function(){function resize(){document.documentElement.style.setProperty('--stage-scale',String(Math.min(innerWidth/1440,innerHeight/810)));}resize();addEventListener('resize',resize);})();</script>
<style>html,body{margin:0;padding:0;background:#efeee1}#root{min-height:100dvh}#first-frame{position:fixed;inset:0;z-index:300;background:#efeee1}.v5-static{pointer-events:auto}.v5-static .v5-open{pointer-events:auto}</style>
</head>
<body>
<div id="first-frame">${shell}</div>
<template id="legacy-v4-shell">${legacy}</template>
<div id="root"></div>
<script>(function(){var params=new URLSearchParams(location.search),shell=document.getElementById('first-frame'),legacy=document.getElementById('legacy-v4-shell');if(params.has('v4')){shell.replaceWith(legacy.content.firstElementChild.cloneNode(true));document.getElementById('first-frame').addEventListener('pointerdown',function(){window.__v4WantOpen=true;},{once:true});}else if(params.has('v1')||params.has('v3')||params.has('postoffice')||params.has('direction')){shell.remove();}else{shell.querySelector('.v5-open').addEventListener('pointerdown',function(){window.__v5WantOpen=true;},{once:true});}legacy.remove();})();</script>
<script type="module" src="/src/main.tsx"></script>
</body>
</html>
`;
process.stdout.write(JSON.stringify({ original, replacement }));
