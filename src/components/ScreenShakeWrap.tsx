'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useGameStore } from '../store/gameStore';

/**
 * Wraps the game scene and applies a transient camera-shake style transform
 * driven by gameStore.screenShake. We animate via requestAnimationFrame so
 * we don't churn React renders on every tick — the only state we read is
 * the shake config object which only changes when a new shake is triggered.
 *
 * The shake applies translate + rotation + scale wobble. Amplitude decays
 * cubically toward the end of the window so the burst feels punchy at the
 * front and tapers smoothly. Brief inverse-color filter on the highest tier
 * gives a cinematic "BOOM" feel on 100x combo.
 */
export default function ScreenShakeWrap({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const screenShake = useGameStore((s) => s.screenShake);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const { until, amp, rotAmp, scaleAmp } = screenShake;
    if (!until || until <= Date.now() || amp <= 0) {
      el.style.transform = '';
      el.style.filter = '';
      return;
    }

    const startedAt = Date.now();
    const totalMs = until - startedAt;
    let raf = 0;
    let mounted = true;

    const tick = () => {
      if (!mounted) return;
      const t = Date.now();
      const elapsed = t - startedAt;
      const remaining = until - t;
      if (remaining <= 0) {
        el.style.transform = '';
        el.style.filter = '';
        return;
      }
      // Decay curve: heavy at the start, gentle at the end (cubic ease-out).
      const norm = Math.max(0, remaining / totalMs); // 1 → 0
      const decay = norm * norm * norm; // cubic
      const dx = (Math.random() - 0.5) * 2 * amp * decay;
      const dy = (Math.random() - 0.5) * 2 * amp * decay;
      const rot = (Math.random() - 0.5) * 2 * rotAmp * decay;
      // Scale pulses on a sin wave so the world "breathes" while shaking.
      const scale = 1 + Math.sin(elapsed * 0.05) * scaleAmp * decay;

      el.style.transform =
        `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) rotate(${rot.toFixed(2)}deg) scale(${scale.toFixed(3)})`;

      // Top-tier shakes flash a brief contrast/saturate boost.
      if (amp >= 30) {
        const f = decay; // 1 → 0
        el.style.filter = `contrast(${(1 + 0.4 * f).toFixed(2)}) saturate(${(1 + 0.5 * f).toFixed(2)})`;
      } else if (el.style.filter) {
        el.style.filter = '';
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      mounted = false;
      if (raf) cancelAnimationFrame(raf);
      el.style.transform = '';
      el.style.filter = '';
    };
  }, [screenShake]);

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        inset: 0,
        // GPU layer hint so transform updates don't trigger layout.
        willChange: 'transform, filter',
      }}
    >
      {children}
    </div>
  );
}
