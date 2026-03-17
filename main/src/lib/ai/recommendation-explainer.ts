/**
 * AI Recommendation Explainer
 *
 * Generates human-readable explanations for why events are recommended to users.
 */

interface RecommendationScores {
  tagMatchScore: number;      // 0-1
  embeddingSimilarity: number | null; // 0-1
  deadlineUrgency: number;    // 0-1
  freshnessScore: number;     // 0-1
  overallScore: number;       // 0-1
}

interface EventInfo {
  title: string;
  eventType: string;
  interestTags: string[];
  registrationEndDate: string;
  organizer: string;
}

interface UserInfo {
  interestTags: string[];
  nickname?: string;
}

/**
 * Generate explanation for event recommendation
 */
export function generateRecommendationExplanation(
  event: EventInfo,
  user: UserInfo,
  scores: RecommendationScores
): string {
  const reasons: string[] = [];

  // Tag matching explanation
  if (scores.tagMatchScore > 0.5) {
    const matchingTags = event.interestTags.filter((tag) =>
      user.interestTags.some((ut) => ut.toLowerCase() === tag.toLowerCase())
    );
    if (matchingTags.length > 0) {
      if (matchingTags.length === 1) {
        reasons.push(`${matchingTags[0]} 관심사와 일치해요`);
      } else if (matchingTags.length === 2) {
        reasons.push(`${matchingTags[0]}, ${matchingTags[1]} 관심사와 일치해요`);
      } else {
        reasons.push(`${matchingTags[0]} 외 ${matchingTags.length - 1}개 관심사와 일치해요`);
      }
    }
  } else if (scores.tagMatchScore > 0.2) {
    reasons.push('관심 분야와 관련이 있어요');
  }

  // Embedding similarity explanation
  if (scores.embeddingSimilarity !== null) {
    if (scores.embeddingSimilarity > 0.8) {
      reasons.push('내 프로필과 매우 잘 맞아요');
    } else if (scores.embeddingSimilarity > 0.6) {
      reasons.push('내 프로필과 잘 맞는 편이에요');
    } else if (scores.embeddingSimilarity > 0.4) {
      reasons.push('관심사와 연관성이 있어요');
    }
  }

  // Deadline urgency explanation
  const daysUntilDeadline = Math.ceil(
    (new Date(event.registrationEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilDeadline <= 3) {
    reasons.push('마감이 임박했어요!');
  } else if (daysUntilDeadline <= 7) {
    reasons.push('마감이 가까워요');
  }

  // Freshness explanation
  if (scores.freshnessScore > 0.8) {
    reasons.push('새로 등록된 행사예요');
  }

  // Event type specific reasons
  const eventTypeReasons: Record<string, string> = {
    '공모전': '실력을 뽐낼 기회에요',
    '대외활동': '다양한 경험을 쌓을 수 있어요',
    '인턴십': '실무 경험을 쌓을 수 있어요',
    '창업교육': '창업 역량을 키울 수 있어요',
    '사업화': '아이디어를 실현할 기회에요',
    '행사·네트워크': '네트워킹 기회가 있어요',
    '글로벌': '글로벌 경험을 쌓을 수 있어요',
  };

  if (eventTypeReasons[event.eventType] && reasons.length < 3) {
    reasons.push(eventTypeReasons[event.eventType]);
  }

  // Default reason if nothing specific
  if (reasons.length === 0) {
    reasons.push('추천 알고리즘이 선정했어요');
  }

  // Return top 2 reasons
  return reasons.slice(0, 2).join(' · ');
}

/**
 * Generate short match percentage label
 */
export function getMatchLabel(score: number): string {
  if (score >= 0.8) return '최고 매칭';
  if (score >= 0.6) return '좋은 매칭';
  if (score >= 0.4) return '관심 가능';
  return '관련 있음';
}

/**
 * Generate match badge color class
 */
export function getMatchColorClass(score: number): string {
  if (score >= 0.8) return 'bg-green-100 text-green-700';
  if (score >= 0.6) return 'bg-blue-100 text-blue-700';
  if (score >= 0.4) return 'bg-yellow-100 text-yellow-700';
  return 'bg-gray-100 text-gray-600';
}

/**
 * Calculate similarity between two tag arrays (Jaccard similarity)
 */
export function calculateTagSimilarity(tags1: string[], tags2: string[]): number {
  if (tags1.length === 0 && tags2.length === 0) return 0;

  const set1 = new Set(tags1.map((t) => t.toLowerCase()));
  const set2 = new Set(tags2.map((t) => t.toLowerCase()));

  const intersection = [...set1].filter((t) => set2.has(t)).length;
  const union = new Set([...set1, ...set2]).size;

  return union > 0 ? intersection / union : 0;
}

/**
 * Generate digest summary for weekly email
 */
export function generateDigestSummary(
  events: EventInfo[],
  userName: string
): string {
  if (events.length === 0) {
    return `${userName}님을 위한 추천 행사가 준비되어 있어요.`;
  }

  const eventTypes = [...new Set(events.map((e) => e.eventType))];
  const urgentEvents = events.filter((e) => {
    const days = Math.ceil(
      (new Date(e.registrationEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return days <= 7;
  });

  let summary = `${userName}님, `;

  if (urgentEvents.length > 0) {
    summary += `곧 마감되는 행사 ${urgentEvents.length}개를 포함해 `;
  }

  if (eventTypes.length === 1) {
    summary += `${eventTypes[0]} 분야의 행사 ${events.length}개를 추천드려요.`;
  } else if (eventTypes.length <= 3) {
    summary += `${eventTypes.join(', ')} 분야의 행사 ${events.length}개를 추천드려요.`;
  } else {
    summary += `다양한 분야의 행사 ${events.length}개를 추천드려요.`;
  }

  return summary;
}
