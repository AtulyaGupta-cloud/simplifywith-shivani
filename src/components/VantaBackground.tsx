import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface VantaNetEffect {
  destroy: () => void;
}

interface VantaNetConstructor {
  (options: {
    el: HTMLElement;
    THREE: typeof THREE;
    color: number;
    backgroundColor: number;
    points?: number;
    maxDistance?: number;
    spacing?: number;
    showDots?: boolean;
  }): VantaNetEffect;
}

export default function VantaBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const effectRef = useRef<VantaNetEffect | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const probe = document.createElement('canvas');
        if (!probe.getContext('webgl2') && !probe.getContext('webgl')) return;

        const mod = await import('vanta/dist/vanta.net.min');
        const exported = mod.default as unknown;
        const VANTA = (
          typeof exported === 'function'
            ? exported
            : (exported as { default?: unknown } | null)?.default
        ) as VantaNetConstructor | undefined;
        if (cancelled || !containerRef.current) return;

      // Vanta is CommonJS and Vite 8 wraps its callable export in `default`.
      // If its export shape changes again, keep the app usable without the
      // decorative background instead of crashing the page.
        if (typeof VANTA !== 'function') {
          console.warn('Vanta background could not be initialized.');
          return;
        }

        effectRef.current = VANTA({
          el: containerRef.current,
          THREE,
          color: 0x7c5cff,
          backgroundColor: 0x0a0a0f,
          points: 12,
          maxDistance: 24,
          spacing: 18,
          showDots: true,
        });
      } catch (error) {
        console.warn('Vanta background could not be initialized:', error);
      }
    })();

    return () => {
      cancelled = true;
      if (effectRef.current) {
        effectRef.current.destroy();
        effectRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      aria-hidden
    />
  );
}
