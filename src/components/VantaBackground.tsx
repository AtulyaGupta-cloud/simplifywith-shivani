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
    mouseControls?: boolean;
    touchControls?: boolean;
    gyroControls?: boolean;
    scale?: number;
    scaleMobile?: number;
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

      const isMobile = window.innerWidth < 768;

      effectRef.current = VANTA({
        el: containerRef.current,
        THREE,
        color: 0x7c5cff,
        backgroundColor: 0x0a0a0f,
        points: isMobile ? 5 : 12,
        maxDistance: isMobile ? 14 : 24,
        spacing: isMobile ? 28 : 18,
        showDots: !isMobile,
        mouseControls: !isMobile,
        touchControls: false,
        gyroControls: false,
        scale: 1.0,
        scaleMobile: 1.0,
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
