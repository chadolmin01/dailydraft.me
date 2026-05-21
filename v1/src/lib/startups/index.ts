/**
 * Startup Ideas Crawling System
 *
 * Main entry point for all startup-related functionality
 */

// Types
export * from './types';

// Collectors
export {
  collectors,
  getCollectorsByTier,
  getAutomatedCollectors,
  producthuntCollector,
  ycombinatorCollector,
  betalistCollector,
  collectProductHuntStartups,
  collectYCStartups,
  collectBetaListStartups,
} from './collectors';

// Sync Manager
export {
  syncStartupsToDatabase,
  markDuplicateStartups,
  updateKoreaFitAnalysis,
  getStartupsPendingAnalysis,
} from './startup-sync-manager';

// Tag Classification
export {
  classifyStartupTags,
  classifyStartupCategory,
} from './startup-tag-classifier';
