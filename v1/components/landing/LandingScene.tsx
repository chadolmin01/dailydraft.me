'use client';

import { Suspense, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Preload, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import KoreaMap from './KoreaMap';
import UniversityMarkers from './UniversityMarkers';
import CampusScene from './CampusScene';
import CameraController, { type ViewLevel } from './CameraController';
import Particles from './Particles';
import UIOverlay from './UIOverlay';
import type { University, ClubData } from './data/universities';

export default function LandingScene() {
  const [level, setLevel] = useState<ViewLevel>('korea');
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [selectedClub, setSelectedClub] = useState<ClubData | null>(null);
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);

  const [mapOpacity, setMapOpacity] = useState(1);
  const [campusOpacity, setCampusOpacity] = useState(0);

  const handleSelectUniversity = useCallback((uni: University) => {
    setSelectedUniversity(uni);
    setSelectedClub(null);
    setLevel('campus');
    setMapOpacity(0.2);
    setCampusOpacity(1);
  }, []);

  const handleBack = useCallback(() => {
    setLevel('korea');
    setSelectedUniversity(null);
    setSelectedClub(null);
    setMapOpacity(1);
    setCampusOpacity(0);
  }, []);

  const handleClubSelect = useCallback((club: ClubData | null) => {
    setSelectedClub(club);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #e8f4fd 0%, #f0f7ff 40%, #fefefe 100%)',
      }}
    >
      <Canvas
        camera={{
          fov: 45,
          near: 0.01,
          far: 50,
          position: [1, 12, 8],
        }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.5,
        }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          {/* 밝고 따뜻한 조명 — 맑은 날 캠퍼스 */}
          <ambientLight intensity={0.8} color="#fff5e6" />
          <directionalLight
            position={[5, 12, 5]}
            intensity={1.2}
            color="#fff8f0"
            castShadow
          />
          {/* 하늘 반사광 (블루) */}
          <hemisphereLight
            color="#87ceeb"
            groundColor="#f5e6d3"
            intensity={0.6}
          />

          <OrbitControls
            enablePan={false}
            enableZoom={true}
            enableRotate={true}
            minDistance={3}
            maxDistance={18}
            minPolarAngle={0.2}
            maxPolarAngle={Math.PI / 2.2}
            zoomSpeed={0.5}
            rotateSpeed={0.4}
            enableDamping
            dampingFactor={0.05}
            makeDefault
          />

          <CameraController
            level={level}
            targetUniversity={selectedUniversity}
          />

          <KoreaMap
            visible={true}
            opacity={mapOpacity}
            onProvinceHover={setHoveredProvince}
          />

          <UniversityMarkers
            visible={true}
            opacity={level === 'korea' ? 1 : 0.1}
            onSelect={handleSelectUniversity}
            selectedId={selectedUniversity?.id ?? null}
          />

          <CampusScene
            university={selectedUniversity}
            visible={level === 'campus'}
            opacity={campusOpacity}
            onClubSelect={handleClubSelect}
            selectedClub={selectedClub}
          />

          <Particles count={80} />

          <Preload all />
        </Suspense>
      </Canvas>

      <UIOverlay
        level={level}
        selectedUniversity={selectedUniversity}
        selectedClub={selectedClub}
        hoveredProvince={hoveredProvince}
        onBack={handleBack}
        onClubClose={() => setSelectedClub(null)}
      />
    </div>
  );
}
