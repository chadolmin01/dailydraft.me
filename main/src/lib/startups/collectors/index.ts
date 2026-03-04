/**
 * Startup Idea Collectors
 *
 * Tier 1 (Daily): Product Hunt, Y Combinator
 * Tier 2 (3x/week): BetaList
 * Tier 3 (Manual): There's An AI, Indie Hackers
 */

export { producthuntCollector, collectProductHuntStartups } from './producthunt';
export { ycombinatorCollector, collectYCStartups } from './ycombinator';
export { betalistCollector, collectBetaListStartups } from './betalist';

import { producthuntCollector } from './producthunt';
import { ycombinatorCollector } from './ycombinator';
import { betalistCollector } from './betalist';
import { StartupCollector, StartupSource } from '../types';

// All available collectors
export const collectors: Record<StartupSource, StartupCollector | null> = {
  producthunt: producthuntCollector,
  ycombinator: ycombinatorCollector,
  betalist: betalistCollector,
  crunchbase: null,     // Phase 2
  theresanai: null,     // Manual only
  indiehackers: null,   // Manual only
  manual: null,         // Manual upload
};

// Get collectors by tier
export function getCollectorsByTier(tier: 1 | 2 | 3 | 4): StartupCollector[] {
  return Object.values(collectors).filter(
    (c): c is StartupCollector => c !== null && c.tier === tier
  );
}

// Get all automated collectors (Tier 1 & 2)
export function getAutomatedCollectors(): StartupCollector[] {
  return Object.values(collectors).filter(
    (c): c is StartupCollector => c !== null && (c.tier === 1 || c.tier === 2)
  );
}
