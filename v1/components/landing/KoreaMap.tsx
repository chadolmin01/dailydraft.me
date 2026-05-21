'use client';

import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { parseKoreaTopology, type ProvinceData } from './utils/geo-to-shape';
import topoData from './data/korea-topo.json';

interface KoreaMapProps {
  onProvinceHover?: (name: string | null) => void;
  visible: boolean;
  opacity: number;
}

const EXTRUDE_SETTINGS: THREE.ExtrudeGeometryOptions = {
  depth: 0.08,
  bevelEnabled: true,
  bevelThickness: 0.015,
  bevelSize: 0.01,
  bevelSegments: 2,
};

// 도별 높이 + 색상 (밝은 파스텔 톤)
const PROVINCE_STYLE: Record<string, { height: number; color: string }> = {
  '서울특별시':     { height: 0.14, color: '#6C9CE3' },
  '경기도':         { height: 0.10, color: '#81C784' },
  '인천광역시':     { height: 0.11, color: '#64B5F6' },
  '부산광역시':     { height: 0.12, color: '#FF8A65' },
  '대구광역시':     { height: 0.10, color: '#FFB74D' },
  '대전광역시':     { height: 0.10, color: '#A5D6A7' },
  '광주광역시':     { height: 0.09, color: '#CE93D8' },
  '울산광역시':     { height: 0.09, color: '#F48FB1' },
  '세종특별자치시': { height: 0.08, color: '#80DEEA' },
  '강원도':         { height: 0.07, color: '#A5D6A7' },
  '충청북도':       { height: 0.07, color: '#C5E1A5' },
  '충청남도':       { height: 0.07, color: '#B2DFDB' },
  '전라북도':       { height: 0.06, color: '#FFCC80' },
  '전라남도':       { height: 0.06, color: '#FFE082' },
  '경상북도':       { height: 0.07, color: '#BCAAA4' },
  '경상남도':       { height: 0.07, color: '#EF9A9A' },
  '제주특별자치도': { height: 0.08, color: '#80CBC4' },
};

const DEFAULT_STYLE = { height: 0.06, color: '#B0BEC5' };

export default function KoreaMap({ onProvinceHover, visible, opacity }: KoreaMapProps) {
  const provinces = useMemo(
    () => parseKoreaTopology(topoData as any),
    []
  );

  if (!visible) return null;

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      {provinces.map((prov) => (
        <Province
          key={prov.code}
          data={prov}
          opacity={opacity}
          onHover={onProvinceHover}
        />
      ))}
    </group>
  );
}

function Province({
  data,
  opacity,
  onHover,
}: {
  data: ProvinceData;
  opacity: number;
  onHover?: (name: string | null) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const edgeRef = useRef<THREE.LineSegments>(null);
  const [hovered, setHovered] = useState(false);

  const style = PROVINCE_STYLE[data.name] ?? DEFAULT_STYLE;

  const geometry = useMemo(() => {
    return new THREE.ExtrudeGeometry(data.shape, {
      ...EXTRUDE_SETTINGS,
      depth: style.height,
    });
  }, [data.shape, style.height]);

  const edges = useMemo(() => {
    return new THREE.EdgesGeometry(geometry, 15);
  }, [geometry]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;

    // 호버 시 살짝 밝아짐
    const targetEmissive = hovered ? 0.3 : 0.05;
    mat.emissiveIntensity = THREE.MathUtils.lerp(
      mat.emissiveIntensity,
      targetEmissive,
      delta * 5
    );
    mat.opacity = THREE.MathUtils.lerp(mat.opacity, opacity, delta * 3);

    if (edgeRef.current) {
      const edgeMat = edgeRef.current.material as THREE.LineBasicMaterial;
      edgeMat.opacity = THREE.MathUtils.lerp(edgeMat.opacity, opacity * 0.4, delta * 3);
    }
  });

  return (
    <group>
      <mesh
        ref={meshRef}
        geometry={geometry}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          onHover?.(data.name);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          onHover?.(null);
          document.body.style.cursor = 'default';
        }}
      >
        <meshStandardMaterial
          color={style.color}
          emissive={style.color}
          emissiveIntensity={0.05}
          metalness={0.1}
          roughness={0.6}
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
        />
      </mesh>
      <lineSegments ref={edgeRef} geometry={edges}>
        <lineBasicMaterial
          color="#ffffff"
          transparent
          opacity={opacity * 0.4}
          linewidth={1}
        />
      </lineSegments>
    </group>
  );
}
