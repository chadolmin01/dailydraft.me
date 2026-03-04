'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import IdeaValidator from '@/components/idea-validator/IdeaValidator';
import type { StartupKoreaAnalysis } from '@/src/lib/startups/types';

interface StartupData {
  id: string;
  name: string;
  description: string | null;
  korea_deep_analysis: StartupKoreaAnalysis | null;
}

function IdeaValidatorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [startupData, setStartupData] = useState<StartupData | null>(null);
  const [loading, setLoading] = useState(true);

  const startupId = searchParams.get('startupId');
  const startupName = searchParams.get('name');

  useEffect(() => {
    const fetchStartupData = async () => {
      if (!startupId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch startup details from API
        const res = await fetch(`/api/startup-ideas/${startupId}`);
        if (res.ok) {
          const data = await res.json();
          setStartupData(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch startup data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStartupData();
  }, [startupId]);

  const handleClose = () => {
    router.push('/explore');
  };

  const handleComplete = (result: { id: string; projectIdea: string }) => {
    // Navigate to validated ideas or project page
    router.push(`/validated-ideas?resultId=${result.id}`);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  // Build preloaded context if we have startup data
  const preloadedContext = startupData ? {
    startupId: startupData.id,
    startupName: startupData.name,
    description: startupData.description || undefined,
    koreaFitReason: startupData.korea_deep_analysis?.korea_fit_reason,
    suggestedLocalization: startupData.korea_deep_analysis?.suggested_localization,
  } : startupName ? {
    startupId: startupId || '',
    startupName: startupName,
  } : undefined;

  return (
    <div className="h-screen w-full">
      <IdeaValidator
        onClose={handleClose}
        onComplete={handleComplete}
        preloadedContext={preloadedContext}
        skipToLevelSelect={!!preloadedContext}
      />
    </div>
  );
}

export default function IdeaValidatorPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <IdeaValidatorContent />
    </Suspense>
  );
}
