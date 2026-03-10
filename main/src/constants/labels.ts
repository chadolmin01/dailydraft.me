// UI Label Configuration
// Change these values to switch between "훈수" and "피드백" terminology

// Set to 'hunsu' for 훈수, 'feedback' for 피드백
const LABEL_MODE: string = 'feedback'

export const COMMENT_LABEL = LABEL_MODE === 'hunsu' ? '훈수' : '피드백'
export const COMMENT_VERB = LABEL_MODE === 'hunsu' ? '훈수' : '피드백'
export const COMMENT_PLURAL = LABEL_MODE === 'hunsu' ? '훈수들' : '피드백'

// Example usage in components:
// import { COMMENT_LABEL, COMMENT_VERB } from '@/src/constants/labels'
// <h3>{COMMENT_LABEL} ({count})</h3>
// <p>{COMMENT_VERB}를 남겨주세요</p>
