'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';

export default function IdeatePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-txt-primary">Phase 1: Ideate</h2>
        <p className="text-txt-secondary mt-1">팀 빌딩 전 아이디어를 구체화하는 단계입니다.</p>
      </div>

      <Card className="border-dashed border border-border-strong bg-surface-sunken">
        <div className="py-12 text-center">
          <div className="text-4xl mb-4 opacity-30">!</div>
          <h3 className="text-lg font-semibold text-txt-tertiary mb-2">Coming Soon</h3>
          <p className="text-txt-disabled text-sm">
            아이디어 브레인스토밍, 문제 정의, 시장 조사 기능이 추가될 예정입니다.
          </p>
        </div>
      </Card>

      <div className="flex justify-end">
        <a
          href="/project/plan"
          className="px-6 py-2.5 bg-black text-white text-sm font-medium border border-black hover:bg-[#333] transition-colors shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
        >
          다음: Plan &rarr;
        </a>
      </div>
    </div>
  );
}
