'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import type { ViewLevel } from './CameraController';
import type { University, ClubData } from './data/universities';

interface UIOverlayProps {
  level: ViewLevel;
  selectedUniversity: University | null;
  selectedClub: ClubData | null;
  hoveredProvince: string | null;
  onBack: () => void;
  onClubClose: () => void;
}

export default function UIOverlay({
  level,
  selectedUniversity,
  selectedClub,
  hoveredProvince,
  onBack,
  onClubClose,
}: UIOverlayProps) {
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* 상단: 로고 + 네비게이션 */}
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-lg bg-[#0095F6] flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">D</span>
          </div>
          <span className="text-gray-800 font-bold text-lg tracking-tight">Draft</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-4 pointer-events-auto"
        >
          <Link
            href="/login"
            className="text-gray-500 hover:text-gray-800 text-sm transition-colors"
          >
            로그인
          </Link>
          <Link
            href="/login"
            className="bg-[#0095F6] hover:bg-[#0080d9] text-white text-sm px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            시작하기
          </Link>
        </motion.div>
      </div>

      {/* 중앙: 히어로 텍스트 (한국 맵 뷰일 때만) */}
      <AnimatePresence>
        {level === 'korea' && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="absolute top-[15%] left-8 md:left-16 max-w-lg"
          >
            <h1 className="text-gray-900 text-3xl md:text-5xl font-bold tracking-tight leading-tight">
              동아리의 세대를
              <br />
              <span className="text-[#0095F6]">잇는 인프라</span>
            </h1>
            <p className="text-gray-400 text-base md:text-lg mt-4">
              대학교를 클릭해서 탐험하세요
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 도 이름 표시 (호버) */}
      <AnimatePresence>
        {hoveredProvince && level === 'korea' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2"
          >
            <div className="text-gray-400 text-sm bg-white/80 backdrop-blur-xs px-3 py-1 rounded-full shadow-sm">
              {hoveredProvince}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 뒤로가기 (캠퍼스 뷰) */}
      <AnimatePresence>
        {level === 'campus' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute top-20 left-6 pointer-events-auto"
          >
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm transition-colors bg-white/90 hover:bg-white backdrop-blur-xs px-4 py-2 rounded-lg border border-gray-200 shadow-sm"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M10 12L6 8L10 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              전체 지도
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 동아리 상세 패널 */}
      <AnimatePresence>
        {selectedClub && selectedUniversity && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-auto w-80"
          >
            <div className="rounded-2xl p-6 bg-white/95 backdrop-blur-xl border border-gray-100 shadow-xl">
              {/* 클럽 헤더 */}
              <div className="flex items-start justify-between">
                <div>
                  <div
                    className="text-xs font-medium px-2 py-0.5 rounded-full inline-block mb-2"
                    style={{
                      background: `${selectedClub.color}15`,
                      color: selectedClub.color,
                    }}
                  >
                    {selectedClub.category}
                  </div>
                  <h3 className="text-gray-900 text-xl font-bold">
                    {selectedClub.name}
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">
                    {selectedUniversity.name}
                  </p>
                </div>
                <button
                  onClick={onClubClose}
                  className="text-gray-300 hover:text-gray-500 transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M15 5L5 15M5 5L15 15"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              {/* 스탯 */}
              <div className="grid grid-cols-3 gap-3 mt-5">
                <StatBox label="멤버" value={selectedClub.memberCount} suffix="명" color={selectedClub.color} />
                <StatBox label="프로젝트" value={selectedClub.projectCount} suffix="개" color={selectedClub.color} />
                <StatBox label="활동지수" value={selectedClub.activityScore} suffix="" color={selectedClub.color} />
              </div>

              {/* 활동 바 */}
              <div className="mt-5">
                <div className="text-gray-400 text-xs mb-2">활동 현황</div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${selectedClub.activityScore}%` }}
                    transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: selectedClub.color }}
                  />
                </div>
              </div>

              {/* CTA */}
              <Link
                href="/login"
                className="block w-full text-center mt-6 py-3 rounded-xl text-white font-medium text-sm transition-all hover:brightness-110 shadow-sm"
                style={{ background: selectedClub.color }}
              >
                Draft에서 보기
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 하단 힌트 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center"
      >
        <p className="text-gray-300 text-xs">
          {level === 'korea'
            ? '마커를 클릭하여 대학교 탐험 · 드래그로 회전 · 스크롤로 확대'
            : '건물을 클릭하여 동아리 정보 확인'}
        </p>
      </motion.div>
    </div>
  );
}

function StatBox({
  label,
  value,
  suffix,
  color,
}: {
  label: string;
  value: number;
  suffix: string;
  color: string;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <div className="text-gray-900 font-bold text-lg">
        {value}
        <span className="text-xs font-normal text-gray-400">{suffix}</span>
      </div>
      <div className="text-gray-400 text-xs mt-0.5">{label}</div>
    </div>
  );
}
