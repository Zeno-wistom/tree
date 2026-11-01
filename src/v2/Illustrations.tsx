export function Scenery({ direction, className = '' }: { direction: string; className?: string }) {
  return <svg className={className} viewBox="0 0 900 600" role="img" aria-label={{ a: '校园绘本里的漫步场景', b: '校园玩具邮局的来信场景', c: '校园奇遇地图里的探索场景' }[direction]}>
    <path fill={direction === 'a' ? '#e4efdc' : direction === 'b' ? '#f8d994' : '#dcefe5'} d={direction === 'c' ? 'M45 278C-14 104 152-9 346 34c138-69 363-15 397 128 149 15 174 189 58 283 48 129-146 167-290 123-136 58-351 34-381-82C-1 440-2 350 45 278Z' : 'M18 68Q300-40 570 30t314 68v465q-290 79-493 19T0 500Z'}/>
    <ellipse cx="466" cy="510" rx="352" ry="48" fill={direction === 'b' ? '#c18d5440' : '#5b845133'}/>
    <path d="M190 558c60-63 139-91 171-179 31-83 19-169 135-192 107-21 146 62 238 87" stroke="#fff1cd" strokeWidth="77" fill="none" strokeLinecap="round"/>
    <path d="M212 451V260h368v191" fill="#fbe8b9" stroke="#516847" strokeWidth="5" strokeLinejoin="round"/>
    <path d="M179 265 386 128l223 137Q395 310 179 265Z" fill={direction === 'b' ? '#e57550' : '#d79167'} stroke="#516847" strokeWidth="5" strokeLinejoin="round"/>
    <path d="M353 451v-94a35 35 0 0 1 70 0v94" fill="#759981" stroke="#516847" strokeWidth="4"/>
    {[246, 297, 466, 517].map(x => <path key={x} d={`M${x} 319v-25a13 13 0 0 1 26 0v25Z`} fill="#8cad98" stroke="#516847" strokeWidth="3"/>)}
    <path d="M332 181q55-20 111-1" stroke="#fff0c7" strokeWidth="5" fill="none" strokeLinecap="round"/>
    <g className="v2-leaf"><path d="M653 126q-16 188-1 347" stroke="#876548" strokeWidth="18" fill="none" strokeLinecap="round"/><path d="M641 170q-126-17-104-86-9-69 72-66 59-32 87 28 74 10 54 75 12 77-77 74-23 40-62 6" fill={direction === 'b' ? '#86a651' : '#7fa877'} stroke="#516847" strokeWidth="5" strokeLinejoin="round"/><path d="M654 202q-45-63-64-99m64 124q60-58 66-117" stroke="#587f58" strokeWidth="4" fill="none" strokeLinecap="round"/><circle cx="610" cy="91" r="10" fill="#efc767"/><circle cx="698" cy="127" r="8" fill="#f4cf80"/></g>
    <g className="v2-person" stroke="#465e4d" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"><circle cx="444" cy="358" r="18" fill="#e6b78c"/><path d="M426 354q7-29 33-8l-2 15-18-10-9 8" fill="#4e5240" strokeWidth="3"/><path d="M430 384q18-10 31 0l12 58h-57Z" fill={direction === 'c' ? '#e8aa55' : '#5b8c84'}/><path d="m425 439-4 49m38-49 12 49m-42-80-31 31m60-28 34 13"/><path d="M430 487h-12m53 0h-12"/><path d="M414 390q-17 5-12 35l14 8 8-30Z" fill="#da8c59" strokeWidth="3"/></g>
    <g className="v2-person"><circle cx="530" cy="395" r="14" fill="#eac19b"/><path d="M515 391q2-24 29-7l-2 12-12-9-11 9" fill="#544739"/><path d="M516 416h25l8 45h-41Z" fill="#da9b89" stroke="#516847" strokeWidth="4"/><path d="m519 459-4 35m23-35 10 35m-28-60-19 20m36-17 26 7" stroke="#516847" strokeWidth="5" strokeLinecap="round"/></g>
    <g fill="none" stroke="#668b61" strokeWidth="4" strokeLinecap="round"><path d="M117 476q15-59 5-117m2 66q-44-39-43-66 37 2 43 66m1-11q37-58 57-45-2 35-57 45"/><path d="M760 453q-14-69 5-122m-7 74q-43-14-41-49 40 0 41 49m0-11q34-39 57-29-7 34-57 29"/></g>
    <path d="M91 498q46-20 83 0m566-10q49-26 89-2" stroke="#6f9362" strokeWidth="7" fill="none" strokeLinecap="round"/>
    {direction === 'b' && <g className="v2-mailbox"><path d="M142 276h116v143H142Z" fill="#de7556" stroke="#685840" strokeWidth="5"/><path d="M142 276q58-82 116 0" fill="#ed8961" stroke="#685840" strokeWidth="5"/><rect x="163" y="306" width="73" height="14" rx="7" fill="#685840"/><path d="M177 337h46v33h-46z" fill="#fff4d4" transform="rotate(-7 200 354)"/><path d="M200 419v86" stroke="#685840" strokeWidth="12"/></g>}
    {direction === 'c' && <g fill="#efb754" stroke="#657646" strokeWidth="3"><path d="m123 168 9 23 25 1-20 16 6 25-20-14-21 14 7-25-20-16 25-1Z"/><path d="m769 262 6 15 16 1-13 10 5 16-14-9-13 9 4-16-12-10 16-1Z"/></g>}
    <g fill="#fff3cd"><circle cx="168" cy="160" r="6"/><circle cx="795" cy="188" r="5"/><circle cx="86" cy="275" r="4"/></g>
  </svg>;
}

export function MiniScene({ direction, index }: { direction: string; index: number }) {
  const id = `mini-${direction}-${index}`;
  return <svg viewBox="0 0 360 220" role="img" aria-label="原创校园活动场景插画">
    <defs><clipPath id={id}><rect width="360" height="220" rx={direction === 'a' ? '36' : direction === 'b' ? '16' : '80'}/></clipPath></defs>
    <g clipPath={`url(#${id})`}><path fill={['#d8e8cf', '#f4cbb6', '#f1dda0', '#cedee8'][index % 4]} d="M0 0h360v220H0z"/><circle cx="286" cy="47" r="27" fill="#fff0b3"/><path d="M-15 197q103-83 210-38t183-9v80H-15Z" fill="#88a77b"/>
      {index % 4 === 0 && <><path d="M76 178V79h172v99" fill="#fae6b8" stroke="#617554" strokeWidth="3"/><path d="m61 81 99-56 105 56" fill="#d98b69" stroke="#617554" strokeWidth="3"/><path d="M145 178v-51a18 18 0 0 1 36 0v51" fill="#6c937c"/><path d="M278 74v110" stroke="#81644a" strokeWidth="9"/><path d="M273 16q-68 41-25 73-41 45 19 64 58 16 67-34 48-38-2-78-2-78-2-78-2-34-59-25" fill="#6f9466"/></>}
      {index % 4 === 1 && <><path d="M87 33h147v162H87z" fill="#fff1d3" transform="rotate(-8 160 115)"/><path d="m130 143 31-66 29 66m-60-28 64 0" stroke="#cf7054" strokeWidth="16" strokeLinecap="round"/><path d="m241 103 43-32 32 51-44 33Z" fill="#77956d"/><path d="m244 138 63-36" stroke="#fff1c4" strokeWidth="7"/></>}
      {index % 4 === 2 && <><ellipse cx="175" cy="180" rx="132" ry="24" fill="#bd9c69"/><path d="M111 73h128l-14 95q-52 30-100 0Z" fill="#fff0d3" stroke="#9d7856" strokeWidth="3"/><path d="M237 91q58-13 43 39-8 20-49 15" stroke="#fff0d3" strokeWidth="16" fill="none"/><ellipse cx="174" cy="74" rx="63" ry="15" fill="#a7784f"/><path d="M156 52q-20-16 0-33m34 33q-20-16 0-33" stroke="#fff4d3" strokeWidth="6" fill="none" strokeLinecap="round"/><path d="m44 163 18-56 59-4 31 57Z" fill="#e3b761"/><ellipse cx="90" cy="114" rx="41" ry="15" fill="#f4ce74"/></>}
      {index % 4 === 3 && <><path d="M55 177q-10-84 49-94-17-61 46-63 61-11 64 44 60 13 30 68-32 48-86 28-63 45-103 17" fill="#658d73"/><path d="M165 99v92m0-49-51-36m51 17 48-45" stroke="#80604a" strokeWidth="8"/><path d="m234 84 47-10v65m-47-2V84m0 12 47-10" stroke="#d07855" strokeWidth="7"/><ellipse cx="222" cy="140" rx="15" ry="10" fill="#d07855"/><ellipse cx="270" cy="141" rx="15" ry="10" fill="#d07855"/></>}
      <g fill="#fff4d3"><circle cx="42" cy="38" r="3"/><circle cx="322" cy="160" r="3"/><circle cx="259" cy="31" r="2"/></g>
    </g>
  </svg>;
}
