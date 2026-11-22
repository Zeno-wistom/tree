import { useCallback, useRef } from 'react';
import { useDemoState } from './useDemoState';

type ChimeKind = 'tap' | 'envelope' | 'branch' | 'landed' | 'stamp' | 'alert';

export function useChime() {
  const { config } = useDemoState();
  const ctxRef = useRef<AudioContext | null>(null);

  const play = useCallback(
    (kind: ChimeKind) => {
      if (config.muted || typeof window === 'undefined') return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        if (!ctxRef.current) ctxRef.current = new AudioCtx();
        const ctx = ctxRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        const now = ctx.currentTime;

        const playTone = (freq: number, start: number, dur: number, vol = 0.06, type: OscillatorType = 'sine') => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = type;
          osc.frequency.setValueAtTime(freq, now + start);
          gain.gain.setValueAtTime(0.0001, now + start);
          gain.gain.exponentialRampToValueAtTime(vol, now + start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + start);
          osc.stop(now + start + dur + 0.02);
        };

        if (kind === 'tap') {
          playTone(523.25, 0, 0.14, 0.035);
        } else if (kind === 'envelope') {
          playTone(440, 0, 0.22, 0.04);
          playTone(587.33, 0.08, 0.28, 0.04);
        } else if (kind === 'branch') {
          playTone(587.33, 0, 0.35, 0.045);
          playTone(783.99, 0.14, 0.42, 0.04);
        } else if (kind === 'landed') {
          // Gentle two-note arrival chime for side tray
          playTone(659.25, 0, 0.28, 0.055);
          playTone(880, 0.12, 0.48, 0.055);
        } else if (kind === 'stamp') {
          playTone(220, 0, 0.12, 0.06, 'triangle');
          playTone(523.25, 0.08, 0.28, 0.04);
        } else if (kind === 'alert') {
          playTone(349.23, 0, 0.18, 0.045, 'triangle');
          playTone(311.13, 0.16, 0.24, 0.04, 'triangle');
        }
      } catch {
        // Silent fallback when audio is restricted by browser policy
      }
    },
    [config.muted]
  );

  return { play };
}
