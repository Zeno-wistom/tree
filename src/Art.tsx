import { useId } from 'react';

// Original paper-cut illustrations. Buildings are imagined, not official campus portraits.
export function Art({ kind = 'campus', className = '' }: { kind?: string; className?: string }) {
  const id = useId().replace(/:/g, '');
  return <svg className={className} viewBox="0 0 800 560" preserveAspectRatio="xMidYMid slice" fill="none" role="img" aria-label={{ campus: '冬日校园原创剪纸插画', print: '双色版画与树叶原创插画', taste: '热饮与澳门点心原创插画', music: '树下音乐原创插画' }[kind] ?? '校园原创插画'}>
    <defs><pattern id={`${id}-grain`} width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="1" cy="2" r=".6" fill="#203d31" opacity=".13"/><circle cx="5" cy="6" r=".5" fill="#fff" opacity=".5"/></pattern></defs>
    <path fill={kind === 'taste' ? '#ebd083' : kind === 'print' ? '#e9baa2' : kind === 'music' ? '#bfcede' : '#cbded0'} d="M0 0h800v560H0z"/>
    <circle cx="633" cy="112" r="65" fill="#f9e8ad"/>
    <path d="M0 417Q180 343 390 424T800 397V560H0Z" fill="#739780"/>
    <path d="M0 498Q270 392 800 490V560H0Z" fill="#344e3b"/>
    {kind === 'campus' && <>
      <path d="M136 422V260h395v162" fill="#e8cda0"/>
      <path d="M105 264l225-120 235 120z" fill="#d14d35"/>
      <path d="M177 252l155-79 161 79" stroke="#f5e2b6" strokeWidth="5"/>
      <path d="M295 422V322a39 39 0 0 1 78 0v100" fill="#3c6656"/>
      {[168,222,400,454].map(x => <g key={x}><path d={`M${x} 321v-24a13 13 0 0 1 26 0v24z`} fill="#476f61"/><path d={`M${x} 387v-29a13 13 0 0 1 26 0v29z`} fill="#476f61"/></g>)}
      <path d="M113 423h439v15H113z" fill="#b48a60"/>
      <path d="M323 438h46l140 122H198z" fill="#dccba3"/>
      <path d="M621 225v238" stroke="#8d623e" strokeWidth="17"/>
      <path d="M620 87l-79 127h35l-65 102h43l-70 102h273l-76-102h40l-67-102h38z" fill="#234c3d"/>
      <path d="M572 258q47 24 98 0m-118 66q69 30 137 0" stroke="#f1ca7c" strokeWidth="5"/>
      <circle cx="589" cy="238" r="9" fill="#df623e"/><circle cx="651" cy="288" r="11" fill="#f6d58c"/><circle cx="580" cy="343" r="10" fill="#df623e"/>
      <path d="M620 57l7 19 20 1-16 13 5 20-16-12-17 12 6-20-16-13 20-1z" fill="#d45132"/>
      <path d="M60 430V291m0 70l-25-26m25-10l28-33" stroke="#335c46" strokeWidth="9"/>
      <ellipse cx="51" cy="291" rx="30" ry="56" fill="#456e51" transform="rotate(-15 51 291)"/>
      <path d="M102 477l44 4-22 45-45-5z" fill="#d94e34"/><path d="M109 477l8 48m-26-28l45 5" stroke="#efcf93" strokeWidth="5"/>
      <path d="M674 455h60v57h-60z" fill="#e5bc6c"/><path d="M700 455v57m-26-34h60" stroke="#ce5036" strokeWidth="7"/>
    </>}
    {kind === 'print' && <>
      <g transform="translate(185 90) rotate(-12 180 190)"><path fill="#fbf0ce" d="M0 0h330v380H0z"/><path d="M48 45h234v290H48z" fill="#d24e36"/><path d="M165 318V110m0 160q-120-30-83-90 70-6 83 90m0-50q100-18 84-89-70 2-84 89m0-60q-89-34-56-84 53 5 56 84" stroke="#f0cd8d" strokeWidth="8" fill="#f0cd8d"/></g>
      <g transform="translate(509 215) rotate(13)"><path d="M0 0h157v186H0z" fill="#f8e3aa"/><circle cx="78" cy="90" r="51" fill="#345b46"/><path d="M20 153l117-122" stroke="#e8b08a" strokeWidth="17"/></g>
      <path d="M100 105l52-21 9 23-52 21zM445 90l67 7-3 25-67-7z" fill="#c4a977" opacity=".7"/>
    </>}
    {kind === 'taste' && <>
      <ellipse cx="414" cy="442" rx="245" ry="43" fill="#d4b68b"/><path d="M250 222h244l-23 170q-100 62-198 0z" fill="#fbecd0"/><path d="M494 244q111-17 75 81-16 35-82 26" stroke="#fbecd0" strokeWidth="27"/>
      <ellipse cx="372" cy="221" rx="122" ry="29" fill="#d79d69"/><ellipse cx="372" cy="219" rx="105" ry="18" fill="#775338"/><path d="M342 165q-34-27 0-60t0-60m64 120q-34-27 0-60t0-60" stroke="#fff6d9" strokeWidth="12" strokeLinecap="round"/>
      <path d="M207 316l20 95 102 6 20-91z" fill="#c68749"/><ellipse cx="278" cy="323" rx="72" ry="30" fill="#edb44e"/><ellipse cx="278" cy="320" rx="52" ry="21" fill="#f5d86b"/><path d="M466 429l29-74 82-10 57 64-22 38z" fill="#bc723d"/><ellipse cx="552" cy="395" rx="65" ry="28" fill="#f4c657"/>
    </>}
    {kind === 'music' && <>
      <path d="M180 406V195m0 98l-75-64m75 13l73-76" stroke="#685e43" strokeWidth="17"/><path d="M78 245Q12 152 102 127q-10-107 92-86 66-40 96 41 93 10 50 103-16 86-99 65-115 45-163-5" fill="#3a6552"/>
      <path d="M401 196l126-30v181m-126-1V196m0 26l126-30" stroke="#d84d39" strokeWidth="16"/><ellipse cx="374" cy="349" rx="36" ry="25" fill="#d84d39" transform="rotate(-20 374 349)"/><ellipse cx="500" cy="351" rx="36" ry="25" fill="#d84d39" transform="rotate(-20 500 351)"/>
      <path d="M604 323v-91l65 22" stroke="#e3ac54" strokeWidth="12"/><ellipse cx="583" cy="327" rx="26" ry="19" fill="#e3ac54"/>
      <path d="M118 420h167m-149-30h134m-118 0v62m103-62v62" stroke="#c9a773" strokeWidth="12"/>
    </>}
    <g fill="#fff6dc"><path d="M99 68v22m-11-11h22m608 92v20m-10-10h20M427 75v14m-7-7h14M727 365v20m-10-10h20" stroke="#fff6dc" strokeWidth="3"/>
      <circle cx="51" cy="176" r="4"/><circle cx="742" cy="68" r="4"/><circle cx="391" cy="124" r="3"/><circle cx="669" cy="35" r="3"/>
    </g>
    <path fill={`url(#${id}-grain)`} d="M0 0h800v560H0z"/>
  </svg>;
}
