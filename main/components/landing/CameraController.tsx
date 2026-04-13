'use client';

import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { latLngToWorld } from './utils/geo-to-shape';
import type { University } from './data/universities';

export type ViewLevel = 'korea' | 'campus';

interface CameraControllerProps {
  level: ViewLevel;
  targetUniversity: University | null;
  onTransitionComplete?: () => void;
}

// 카메라 프리셋 (스케일 70 기준)
const KOREA_VIEW = {
  position: new THREE.Vector3(1, 8, 5),
  target: new THREE.Vector3(0, 0, -0.5),
};

function getCampusView(uni: University) {
  const [wx, wz] = latLngToWorld(uni.lat, uni.lng);
  return {
    position: new THREE.Vector3(wx + 1.5, 3, wz + 2),
    target: new THREE.Vector3(wx, 0.2, wz),
  };
}

export default function CameraController({
  level,
  targetUniversity,
  onTransitionComplete,
}: CameraControllerProps) {
  const { camera, controls } = useThree();
  const targetPos = useRef(KOREA_VIEW.position.clone());
  const targetTarget = useRef(KOREA_VIEW.target.clone());
  const hasNotified = useRef(false);
  const isTransitioning = useRef(false);

  useEffect(() => {
    hasNotified.current = false;
    isTransitioning.current = true;

    if (level === 'campus' && targetUniversity) {
      const view = getCampusView(targetUniversity);
      targetPos.current.copy(view.position);
      targetTarget.current.copy(view.target);
    } else {
      targetPos.current.copy(KOREA_VIEW.position);
      targetTarget.current.copy(KOREA_VIEW.target);
    }
  }, [level, targetUniversity]);

  useFrame((_, delta) => {
    if (!isTransitioning.current) return;

    const speed = 2.5;

    // OrbitControls의 target을 이동
    const orbitControls = controls as any;
    if (orbitControls?.target) {
      orbitControls.target.lerp(targetTarget.current, delta * speed);
    }

    // 카메라 위치 이동
    camera.position.lerp(targetPos.current, delta * speed);

    // 전환 완료 체크
    const dist = camera.position.distanceTo(targetPos.current);
    if (dist < 0.05) {
      if (!hasNotified.current) {
        hasNotified.current = true;
        isTransitioning.current = false;
        onTransitionComplete?.();
      }
    }
  });

  return null;
}
