'use client';

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface ParticlesProps {
  count?: number;
}

// 밝은 파스텔 파티클 (꽃잎/반짝이 느낌)
export default function Particles({ count = 80 }: ParticlesProps) {
  const meshRef = useRef<THREE.Points>(null);

  const { positions, speeds, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    const col = new Float32Array(count * 3);

    const palette = [
      [0.95, 0.85, 0.7],  // warm cream
      [0.7, 0.85, 0.95],  // sky blue
      [0.85, 0.95, 0.75], // soft green
      [0.95, 0.75, 0.8],  // soft pink
      [0.9, 0.8, 0.95],   // lavender
    ];

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = Math.random() * 4 + 0.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12;
      spd[i] = 0.05 + Math.random() * 0.15;

      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = c[0];
      col[i * 3 + 1] = c[1];
      col[i * 3 + 2] = c[2];
    }

    return { positions: pos, speeds: spd, colors: col };
  }, [count]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [positions, colors]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    const posAttr = meshRef.current.geometry.attributes.position;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      // 천천히 떠오르면서 좌우 흔들림 (꽃잎 느낌)
      arr[i * 3 + 1] += speeds[i] * 0.002;
      arr[i * 3] += Math.sin(t * 0.3 + i * 0.5) * 0.0008;
      arr[i * 3 + 2] += Math.cos(t * 0.2 + i * 0.7) * 0.0005;

      if (arr[i * 3 + 1] > 5) {
        arr[i * 3 + 1] = 0.3;
      }
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={meshRef} geometry={geometry}>
      <pointsMaterial
        size={0.04}
        vertexColors
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
