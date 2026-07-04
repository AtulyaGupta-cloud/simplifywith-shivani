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
      const mod = await import('vanta/dist/vanta.net.min');
      const VANTA = (mod.default ?? mod) as unknown as VantaNetConstructor;
      if (cancelled || !containerRef.current) return;

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
