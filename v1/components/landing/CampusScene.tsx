'use client';

import { useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html, Billboard } from '@react-three/drei';
import { type University, type ClubData, CATEGORY_COLORS } from './data/universities';
import { latLngToWorld } from './utils/geo-to-shape';

interface CampusSceneProps {
  university: University | null;
  visible: boolean;
  opacity: number;
  onClubSelect: (club: ClubData | null) => void;
  selectedClub: ClubData | null;
}

export default function CampusScene({
  university,
  visible,
  opacity,
  onClubSelect,
  selectedClub,
}: CampusSceneProps) {
  if (!university || !visible) return null;

  const [wx, wz] = latLngToWorld(university.lat, university.lng);

  return (
    <group position={[wx, 0, wz]}>
      {/* 캠퍼스 바닥 */}
      <CampusGround radius={1.5} opacity={opacity} />

      {/* 동아리 빌딩 — 원형 배치 */}
      {university.clubs.map((club, i) => {
        const angle = (i / university.clubs.length) * Math.PI * 2 - Math.PI / 2;
        const radius = 0.6 + (university.clubs.length > 4 ? 0.15 : 0);
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        return (
          <ClubBuilding
            key={club.id}
            club={club}
            position={[x, 0, z]}
            index={i}
            opacity={opacity}
            isSelected={selectedClub?.id === club.id}
            onSelect={() => onClubSelect(club)}
          />
        );
      })}

      {/* 대학 이름 */}
      {opacity > 0.3 && (
        <Billboard position={[0, 2.2, 0]}>
          <Html center distanceFactor={6} style={{ pointerEvents: 'none' }}>
            <div className="text-gray-800 font-bold text-base whitespace-nowrap">
              {university.name}
            </div>
          </Html>
        </Billboard>
      )}
    </group>
  );
}

function CampusGround({
  radius,
  opacity,
}: {
  radius: number;
  opacity: number;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const mat = ref.current.material as THREE.MeshStandardMaterial;
    mat.opacity = opacity * 0.4;
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
      <circleGeometry args={[radius, 64]} />
      <meshStandardMaterial
        color="#c8e6c9"
        transparent
        opacity={opacity * 0.4}
        side={THREE.DoubleSide}
        roughness={0.8}
      />
    </mesh>
  );
}

function ClubBuilding({
  club,
  position,
  index,
  opacity,
  isSelected,
  onSelect,
}: {
  club: ClubData;
  position: [number, number, number];
  index: number;
  opacity: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const roofRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const height = 0.15 + (club.activityScore / 100) * 0.8;
  const width = 0.1 + (club.memberCount / 60) * 0.12;
  const color = club.color || CATEGORY_COLORS[club.category] || '#3B82F6';

  const currentScale = useRef(0);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // 등장 애니메이션
    const delay = index * 0.12;
    const elapsed = state.clock.elapsedTime;
    const progress = Math.max(0, Math.min(1, (elapsed - delay) * 2));
    const eased = 1 - Math.pow(1 - progress, 3);

    currentScale.current = THREE.MathUtils.lerp(currentScale.current, eased, delta * 4);
    meshRef.current.scale.y = Math.max(0.01, currentScale.current);
    meshRef.current.position.y = (height * currentScale.current) / 2;

    // 호버 시 살짝 위로
    if (hovered || isSelected) {
      meshRef.current.position.y += 0.04;
    }

    // 지붕도 같이 이동
    if (roofRef.current) {
      roofRef.current.position.y = height * currentScale.current + 0.01;
      roofRef.current.scale.set(
        currentScale.current,
        currentScale.current,
        currentScale.current
      );
    }

    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    mat.opacity = THREE.MathUtils.lerp(mat.opacity, opacity, delta * 3);
  });

  return (
    <group position={position}>
      {/* 건물 본체 */}
      <mesh
        ref={meshRef}
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
          onSelect();
        }}
      >
        <boxGeometry args={[width, height, width]} />
        <meshStandardMaterial
          color={color}
          metalness={0.05}
          roughness={0.5}
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* 지붕 (밝은 색) */}
      <mesh ref={roofRef} position={[0, height, 0]}>
        <boxGeometry args={[width + 0.02, 0.02, width + 0.02]} />
        <meshStandardMaterial
          color="#ffffff"
          metalness={0.1}
          roughness={0.4}
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* 라벨 */}
      {(hovered || isSelected) && opacity > 0.5 && (
        <Billboard position={[0, height + 0.25, 0]}>
          <Html center distanceFactor={5} style={{ pointerEvents: 'none' }}>
            <div
              className="px-3 py-2 rounded-xl text-center whitespace-nowrap shadow-lg"
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(0,0,0,0.06)',
              }}
            >
              <div className="text-gray-900 font-bold text-sm">{club.name}</div>
              <div className="text-xs mt-0.5" style={{ color }}>
                {club.category}
              </div>
              <div className="text-gray-400 text-xs mt-0.5">
                {club.memberCount}명 · 프로젝트 {club.projectCount}개
              </div>
            </div>
          </Html>
        </Billboard>
      )}
    </group>
  );
}
