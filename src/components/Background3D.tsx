import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { MeshDistortMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';

const ACCENT_COLORS = ['#7c5cff', '#22d3ee', '#34d399', '#60a5fa'];

interface BlobProps {
  position: [number, number, number];
  color: string;
  scale: number;
  speed: number;
  distort: number;
  mouseRef: React.MutableRefObject<{ x: number; y: number }>;
}

function Blob({ position, color, scale, speed, distort, mouseRef }: BlobProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const targetPos = useRef(new THREE.Vector3(...position));

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();

    // Autonomous floating motion
    targetPos.current.x = position[0] + Math.sin(t * speed * 0.3) * 0.5 + mouseRef.current.x * 0.8;
    targetPos.current.y = position[1] + Math.cos(t * speed * 0.4) * 0.4 + mouseRef.current.y * 0.6;
    targetPos.current.z = position[2] + Math.sin(t * speed * 0.2) * 0.3;

    meshRef.current.position.lerp(targetPos.current, 0.03);
    meshRef.current.rotation.x = t * 0.08 * speed;
    meshRef.current.rotation.y = t * 0.12 * speed;
    meshRef.current.rotation.z = t * 0.05 * speed;
  });

  return (
    <Float speed={speed * 0.5} rotationIntensity={0.3} floatIntensity={0.4}>
      <mesh ref={meshRef} scale={scale}>
        <icosahedronGeometry args={[1, 6]} />
        <MeshDistortMaterial
          color={color}
          distort={distort}
          speed={speed * 0.8}
          transparent
          opacity={0.12}
          roughness={0.2}
          metalness={0.8}
          depthWrite={false}
        />
      </mesh>
    </Float>
  );
}

function Scene({ mouseRef }: { mouseRef: React.MutableRefObject<{ x: number; y: number }> }) {
  const { camera } = useThree();

  useFrame(() => {
    camera.position.x += (mouseRef.current.x * 0.5 - camera.position.x) * 0.02;
    camera.position.y += (mouseRef.current.y * 0.5 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);
  });

  const blobs = useMemo(
    () => [
      { position: [-3.5, 1.5, -2] as [number, number, number], color: ACCENT_COLORS[0], scale: 1.8, speed: 0.6, distort: 0.4 },
      { position: [3.2, -1.2, -1.5] as [number, number, number], color: ACCENT_COLORS[1], scale: 1.5, speed: 0.5, distort: 0.35 },
      { position: [0.5, 2.5, -3] as [number, number, number], color: ACCENT_COLORS[2], scale: 1.2, speed: 0.4, distort: 0.45 },
      { position: [-2, -2.5, -2.5] as [number, number, number], color: ACCENT_COLORS[3], scale: 1.3, speed: 0.55, distort: 0.3 },
    ],
    [],
  );

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={0.6} color="#7c5cff" />
      <pointLight position={[-10, -10, 5]} intensity={0.4} color="#22d3ee" />
      {blobs.map((blob, i) => (
        <Blob key={i} {...blob} mouseRef={mouseRef} />
      ))}
    </>
  );
}

export default function Background3D() {
  const mouseRef = useRef({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
  };

  // Autonomous motion for mobile / no-mouse
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      mouseRef.current.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
    }
  };

  return (
    <div
      className="fixed inset-0 -z-10"
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 6], fov: 50 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <Scene mouseRef={mouseRef} />
      </Canvas>
    </div>
  );
}
