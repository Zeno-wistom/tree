import type { CSSProperties } from 'react';
import { events, schoolName } from '../data';
import type { CampusEvent, Postcard } from '../data';

export const leafColors = ['#617956', '#8e9e77', '#b5bc96'];
export const petalColors = ['#d77f83', '#e4a09e', '#edc1b6'];

export function Botanical({ className = '', variant = 0 }: { className?: string; variant?: number }) {
  return <img className={className} src={`/v5/botanical-${['a', 'b', 'c'][variant % 3]}.svg`} alt="" draggable={false} />;
}

export function BrandMark({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 48 48" aria-hidden="true"><rect x="1" y="1" width="46" height="46" rx="15" fill="#f8f3e6" stroke="currentColor" strokeWidth="1.4" /><path d="M12 17h24v16H12zM12 18l12 10 12-10M20 11l4-4 4 4M24 7v8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function TreeBranch({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 500 370" fill="none" aria-hidden="true"><path d="M510-28C413 30 362 76 293 171S162 267 36 332M426 34c-13 93-4 151-40 211M329 125c-63-3-109 16-152 61M266 199c5 51-6 79-35 113M201 250c-50-4-83 8-121 33" stroke="#7e8364" strokeWidth="12" strokeLinecap="round" />{[[427, 36, -45], [391, 93, 35], [386, 151, -25], [373, 212, 35], [318, 122, -65], [272, 136, -35], [227, 163, -65], [182, 189, -35], [275, 218, 30], [265, 268, -15], [229, 305, 45], [198, 252, -55], [153, 266, 30], [104, 287, -35], [60, 315, 25]].map(([x, y, r], i) => <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}><path d="M0 0C-15-31-5-53 19-61 35-38 26-12 0 0Z" fill={i % 3 ? '#8e9e77' : '#b5bc96'} /><path d="M0 0 16-52" stroke="#f6f0df" strokeWidth="1.5" opacity=".7" /></g>)}</svg>;
}

export function Leaf({ index = 0 }: { index?: number }) {
  return <svg viewBox="0 0 40 56" aria-hidden="true"><path d={index % 2 ? 'M20 52C-3 36 0 10 29 3c15 26 4 40-9 49Z' : 'M20 53C3 35 5 17 17 2c22 13 22 36 3 51Z'} fill={leafColors[index % 3]} stroke="#fbf6e7" strokeWidth="1.5" /><path d="M20 51 20 12M20 32 10 22M20 39l10-12" stroke="#f6f0df" strokeWidth="1.4" fill="none" /></svg>;
}

export function Breeze() {
  return <svg className="v5-breeze" viewBox="0 0 1440 810" preserveAspectRatio="none" aria-hidden="true"><g fill="none" strokeLinecap="round"><path className="v5-wind-line" d="M-140 420C140 420 163 302 382 331S704 469 962 358s343-54 586 26" stroke="#fffaf0" strokeWidth="2.6" /><path className="v5-wind-line" d="M-180 490C73 476 160 381 369 414s322 87 570 16 367-57 625 29" stroke="#c1c9a9" strokeWidth="1.8" /><path className="v5-wind-line" d="M-120 285c197 11 263-65 444-30s297 97 504 37 362-53 645 11" stroke="#fffaf0" strokeWidth="1.4" /></g></svg>;
}

export function EventArt({ event, className = '' }: { event: CampusEvent; className?: string }) {
  const index = Math.max(0, events.findIndex(item => item.id === event.id));
  const common = { fill: 'none', stroke: '#52694c', strokeWidth: 2.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return <svg className={className} viewBox="0 0 360 200" aria-hidden="true"><rect width="360" height="200" fill="#f3ecda" /><circle cx="290" cy="42" r="27" fill="#e5c6b1" opacity=".55" /><path d="M0 157Q80 141 180 157t180-2v45H0Z" fill="#dce0c8" opacity=".8" />
    {index === 0 && <g {...common}><path d="M74 160V89m-34 71h81M59 89h36l-8-27H68ZM75 62V39M38 160l37-71 40 71M168 159V94m-37 65h106m-91-65h57l-10-34h-37ZM183 60V35M149 159l34-65 40 65M260 160v-44m-22 44h50M246 116l16-28 18 28M262 88V67" /><path d="M26 167q86-13 163 0t150 0" strokeWidth="1.5" /><path d="M43 54q8-8 16 0 8-8 16 0M228 44q8-8 16 0 8-8 16 0" strokeWidth="2" /></g>}
    {index === 1 && <g {...common}><path d="M89 42h117v117H89z" fill="#fbf5e7" /><path d="M109 138c30-70 40-68 75-68M120 121c-20-1-26-14-24-29 22-2 34 11 24 29Zm20-22c-4-20 6-31 19-36 12 18 4 32-19 36Zm1 25c19-3 31 5 35 18-16 13-32 6-35-18Z" fill="#8e9e77" /><path d="m213 48 83 12-12 98-83-12z" fill="#e4a09e" /><path d="M223 79h48M220 94h35M218 109h42" stroke="#fbf5e7" /></g>}
    {index === 2 && <g {...common}><ellipse cx="178" cy="156" rx="93" ry="14" fill="#d5d7b9" /><path d="M104 73h134l-13 69q-4 17-25 17h-62q-21 0-24-17Z" fill="#fbf5e7" /><path d="M238 86h17q34 0 26 28-6 21-39 18M116 73q59 17 121 0M138 57c-17-15 15-19 1-36m36 36c-17-15 15-19 1-36m36 36c-17-15 15-19 1-36" /><path d="m272 145 31-25m-19 33 31-25M88 145l-25 18" strokeWidth="2" /></g>}
    {index === 3 && <g {...common}><path d="M44 157q115-83 261 0M79 157q88-55 178 0M112 157q63-36 118 0" /><path d="M176 153V73m0 0V45a22 22 0 1 1 22 22M176 94a25 25 0 1 0-25-25" strokeWidth="4" /><path d="M39 63q14-14 28 0 14-14 28 0M266 55q14-14 28 0 14-14 28 0" strokeWidth="1.8" /></g>}
    {index === 4 && <g {...common}><path d="m100 35 147 0-43 126H62Z" fill="#fbf5e7" /><path d="m100 35 52 126 95-126M62 161l90-126M152 161h52" /><path d="m248 35 44 126h-88M276 77l-31 20" /><circle cx="174" cy="98" r="22" fill="#edc1b6" /></g>}
    {index === 5 && <g {...common}><path d="M57 46h122v83H123l-28 27 4-27H57Z" fill="#fbf5e7" /><path d="M187 72h115v77h-58l-5 22-24-22h-28Z" fill="#e5c6b1" /><path d="M81 75h73M81 94h50M211 100h66M211 119h43" /></g>}
    <path d="M0 177q100-14 188 0t172-2" fill="none" stroke="#52694c" strokeOpacity=".3" strokeWidth="1.4" /></svg>;
}

export function PostcardVisual({ event, postcard, back = false, className = '' }: { event: CampusEvent; postcard: Postcard; back?: boolean; className?: string }) {
  return <div className={`v5-postcard-visual${back ? ' is-back' : ''} ${className}`} style={{ '--event-accent': petalColors[events.indexOf(event) % 3] } as CSSProperties}>
    {back ? <img className="v5-postcard-botanical" src="/v5/botanical-back.svg" alt="" /> : <Botanical className="v5-postcard-botanical" variant={events.indexOf(event)} />}
    {!back ? <div className="v5-postcard-caption"><strong>{event.title}</strong><span>{schoolName(event.schoolId)}</span></div> : <div className="v5-postcard-writing"><strong>写给此刻的你</strong><p>{postcard.postcardText}</p><span>—— {schoolName(event.schoolId)}</span></div>}
  </div>;
}
