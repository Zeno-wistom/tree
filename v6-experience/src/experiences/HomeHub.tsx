import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { seasonLeaves, type RouteId } from '../data/catalog';
import { useDemoState } from '../hooks/useDemoState';
import { useChime } from '../hooks/useChime';
import { GardenBough, SwingRig } from '../components/GardenBackdrop';
import { MacauTileBorder } from '../components/MacauOrnaments';
import './home.css';

gsap.registerPlugin(useGSAP);

interface HomeHubProps {
  active: boolean;
  onNavigate: (route: RouteId) => void;
}

export function HomeHub({ active, onNavigate }: HomeHubProps) {
  const scene = useRef<HTMLDivElement>(null);
  const canopy = useRef<HTMLDivElement>(null);
  const { config } = useDemoState();
  const { play } = useChime();
  const leaf = seasonLeaves[config.season];

  useGSAP(() => {
    const stage = scene.current;
    const branches = canopy.current;
    if (!stage || !branches) return;

    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference) and (any-hover: hover)', () => {
      const moveX = gsap.quickTo(branches, 'x', { duration: 0.8, ease: 'power2.out' });
      const moveY = gsap.quickTo(branches, 'y', { duration: 0.8, ease: 'power2.out' });
      const lean = gsap.quickTo(branches, 'rotation', { duration: 1.2, ease: 'sine.out' });
      const followPointer = (event: PointerEvent) => {
        if (stage.inert || event.pointerType !== 'mouse') return;
        const bounds = stage.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - .5;
        const y = (event.clientY - bounds.top) / bounds.height - .5;
        moveX(x * 17);
        moveY(y * 9);
        lean(x * 2.4);
      };
      const rest = () => {
        moveX(0);
        moveY(0);
        lean(0);
      };
      // Keep the hit areas steady. Only the paper art follows the pointer.
      const magnetCleanups = Array.from(stage.querySelectorAll<HTMLElement>('.v6-home-object')).map((button) => {
        const object = button.querySelector<HTMLElement>('.v6-home-object-motion')!;
        const attractX = gsap.quickTo(object, 'x', { duration: 0.38, ease: 'power3.out' });
        const attractY = gsap.quickTo(object, 'y', { duration: 0.38, ease: 'power3.out' });
        const attract = (event: PointerEvent) => {
          if (event.pointerType !== 'mouse') return;
          const bounds = button.getBoundingClientRect();
          attractX(((event.clientX - bounds.left) / bounds.width - 0.5) * 18);
          attractY(((event.clientY - bounds.top) / bounds.height - 0.5) * 14);
        };
        const settle = () => {
          attractX(0);
          attractY(0);
        };
        button.addEventListener('pointermove', attract, { passive: true });
        button.addEventListener('pointerleave', settle);
        return () => {
          button.removeEventListener('pointermove', attract);
          button.removeEventListener('pointerleave', settle);
        };
      });

      const stageSurface = stage.closest<HTMLElement>('.v6a');
      stageSurface?.addEventListener('pointermove', followPointer, { passive: true });
      stageSurface?.addEventListener('pointerleave', rest);
      return () => {
        stageSurface?.removeEventListener('pointermove', followPointer);
        stageSurface?.removeEventListener('pointerleave', rest);
        magnetCleanups.forEach((cleanup) => cleanup());
      };
    });

    return () => media.revert();
  }, { scope: scene });

  return (
    <div className="v6-home" ref={scene} inert={!active}>
      <div className="v6-home-canopy" ref={canopy} aria-hidden="true">
        <GardenBough className="v6-home-bough" />
      </div>

      <svg className="v6-home-wind" viewBox="0 0 280 64" fill="none" aria-hidden="true">
        <path d="M-5 43C50 2 105 1 176 27c37 13 70 11 101-10" stroke="#fffae4" strokeWidth="1.5" />
        <path d="M26 51c44-24 90-22 131-9 33 10 63 9 87-4" stroke="#788469" strokeOpacity=".57" strokeWidth="1" />
      </svg>
      <div className="v6-home-intro">
        <p className="v6-home-place">澳门 · 德智广场</p>
        <h1 tabIndex={-1}>拾一片花叶，<br />读一封来信。</h1>
      </div>

      <button
        className="v6-home-object v6-home-swing"
        aria-label="B 秋千停留"
        onClick={() => {
          play('tap');
          onNavigate('swing');
        }}
      >
        <span className="v6-home-object-motion" aria-hidden="true">
          <span className="v6-home-swing-art">
            <svg viewBox="-113 0 226 248" preserveAspectRatio="xMidYMin meet"><SwingRig /></svg>
          </span>
        </span>
        <span className="v6-home-object-label">秋千停留 <b aria-hidden="true">↗</b></span>
      </button>

      <button
        className="v6-home-object v6-home-leaf"
        aria-label="C 实体领卡"
        onClick={() => {
          play('branch');
          onNavigate('leaf-drop');
        }}
      >
        <span className="v6-home-object-motion" aria-hidden="true">
          <span className="v6-home-leaf-art">
            <img src={leaf.frontImage} alt="" draggable={false} />
          </span>
        </span>
        <span className="v6-home-object-label">实体领卡 <b aria-hidden="true">↗</b></span>
      </button>

      <button
        className="v6-home-object v6-home-mail"
        aria-label="D 时光邮局"
        onClick={() => {
          play('tap');
          onNavigate('post-office');
        }}
      >
        <span className="v6-home-object-motion" aria-hidden="true">
          <span className="v6-home-mail-art">
            <img src="/assets/postcards/schools/utm-front.webp" alt="" draggable={false} />
          </span>
        </span>
        <span className="v6-home-object-label">时光邮局 <b aria-hidden="true">↗</b></span>
      </button>

      <MacauTileBorder className="v6-home-tile" bg="#456253" stroke="#F5EBD1" accent="#D8AE67" />
    </div>
  );
}
