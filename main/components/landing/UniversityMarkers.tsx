'use client';

import { useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html, Billboard } from '@react-three/drei';
import { latLngToWorld } from './utils/geo-to-shape';
import { UNIVERSITIES, type University } from './data/universities';

interface UniversityMarkersProps {
  visible: boolean;
  opacity: number;
  onSelect: (university: University) => void;
  selectedId: string | null;
}

export default function UniversityMarkers({
  visible,
  opacity,
  onSelect,
  selectedId,
}: UniversityMarkersProps) {
  if (!visible) return null;

  return (
    <group>
      {UNIVERSITIES.map((uni) => (
        <UniversityPin
          key={uni.id}
          university={uni}
          opacity={opacity}
          onSelect={onSelect}
          isSelected={selectedId === uni.id}
        />
      ))}
    </group>
  );
}

function UniversityPin({
  university,
  opacity,
  onSelect,
  isSelected,
}: {
  university: University;
  opacity: number;
  onSelect: (uni: University) => void;
  isSelected: boolean;
}) {
  const pinRef = useRef<THREE.Group>(null);
  const sphereRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const [wx, wz] = useMemo(
    () => latLngToWorld(university.lat, university.lng),
    [university.lat, university.lng]
  );

  const baseY = 0.12;
  const pinHeight = 0.4 + university.clubs.length * 0.1;

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // 핀 위의 구체 — 통통 튀는 애니메이션
    if (sphereRef.current) {
      const bounce = Math.sin(t * 2 + wx * 10) * 0.03;
      sphereRef.current.position.y = pinHeight + 0.08 + bounce;

      const scale = hovered || isSelected ? 1.4 : 1.0;
      sphereRef.current.scale.lerp(
        new THREE.Vector3(scale, scale, scale),
        delta * 6
      );
    }
  });

  return (
    <group position={[wx, baseY, wz]} ref={pinRef}>
      {/* 핀 기둥 */}
      <mesh position={[0, pinHeight / 2, 0]}>
        <cylinderGeometry args={[0.008, 0.008, pinHeight, 8]} />
        <meshStandardMaterial
          color="#555555"
          transparent
          opacity={opacity * 0.7}
        />
      </mesh>

      {/* 핀 상단 구체 */}
      <mesh
        ref={sphereRef}
        position={[0, pinHeight + 0.08, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'default';
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(university);
        }}
      >
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial
          color={university.color}
          emissive={university.color}
          emissiveIntensity={hovered || isSelected ? 0.4 : 0.1}
          metalness={0.2}
          roughness={0.3}
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* 바닥 그림자 원 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <circleGeometry args={[0.06, 16]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0.1 * opacity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 라벨 */}
      {(hovered || isSelected) && opacity > 0.5 && (
        <Billboard position={[0, pinHeight + 0.35, 0]}>
          <Html
            center
            distanceFactor={10}
            style={{ pointerEvents: 'none' }}
          >
            <div
              className="px-3 py-1.5 rounded-xl text-center whitespace-nowrap shadow-lg"
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(0,0,0,0.08)',
              }}
            >
              <div className="text-gray-900 font-bold text-sm">
                {university.name}
              </div>
              <div className="text-xs mt-0.5" style={{ color: university.color }}>
                {university.clubs.length}개 동아리 · {university.clubs.reduce((s, c) => s + c.memberCount, 0)}명
              </div>
            </div>
          </Html>
        </Billboard>
      )}
    </group>
  );
}
