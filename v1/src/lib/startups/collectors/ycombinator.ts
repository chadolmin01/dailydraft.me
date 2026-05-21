/**
 * Y Combinator Collector
 * Uses yc-oss/api - free JSON API that scrapes YC's Algolia search index
 * https://github.com/yc-oss/api
 */

import {
  StartupCollector,
  CollectedStartup,
  SyncOptions,
  YCCompany,
  FundingStage,
} from '../types';

// YC batches to fetch (recent ones)
const YC_BATCHES = ['w25', 'f24', 's24', 'w24', 'f23', 's23'];

const YC_API_BASE = 'https://yc-oss.github.io/api';

function mapYCStageToFundingStage(stage: string): FundingStage | undefined {
  const stageMap: Record<string, FundingStage> = {
    'Pre-Seed': 'pre_seed',
    'Seed': 'seed',
    'Series A': 'series_a',
    'Series B': 'series_b',
    'Series C': 'series_c',
    'Series D': 'series_d_plus',
    'Public': 'ipo',
  };
  return stageMap[stage];
}

function mapYCStatusToFundingStage(status: string): FundingStage | undefined {
  if (status === 'Acquired') return 'acquired';
  if (status === 'Public') return 'ipo';
  return undefined;
}

async function fetchBatch(batch: string): Promise<YCCompany[]> {
  const url = `${YC_API_BASE}/batches/${batch}.json`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      console.error(`Failed to fetch YC batch ${batch}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data as YCCompany[];
  } catch (error) {
    console.error(`Error fetching YC batch ${batch}:`, error);
    return [];
  }
}

function transformYCCompany(company: YCCompany, batch: string): CollectedStartup {
  // Determine funding stage from stage field or status
  let fundingStage: FundingStage | undefined = mapYCStageToFundingStage(company.stage);
  if (!fundingStage) {
    fundingStage = mapYCStatusToFundingStage(company.status);
  }

  // Build category from industry and subindustry
  const category: string[] = [];
  if (company.industry) category.push(company.industry);
  if (company.subindustry && company.subindustry !== company.industry) {
    category.push(company.subindustry);
  }
  if (company.industries) {
    company.industries.forEach(ind => {
      if (!category.includes(ind)) category.push(ind);
    });
  }

  return {
    externalId: `ycombinator:${company.slug}`,
    source: 'ycombinator',
    sourceUrl: `https://www.ycombinator.com/companies/${company.slug}`,
    name: company.name,
    tagline: company.one_liner || undefined,
    description: company.long_description || undefined,
    category: category.length > 0 ? category : ['Other'],
    logoUrl: company.small_logo_thumb_url || undefined,
    websiteUrl: company.website || undefined,
    fundingStage,
    upvotes: company.top_company ? 1000 : 0, // top_company as proxy for popularity
    rawData: {
      batch,
      team_size: company.team_size,
      status: company.status,
      stage: company.stage,
      tags: company.tags,
      tags_highlighted: company.tags_highlighted,
      regions: company.regions,
      all_locations: company.all_locations,
      isHiring: company.isHiring,
      nonprofit: company.nonprofit,
      highlight_black: company.highlight_black,
      highlight_latinx: company.highlight_latinx,
      highlight_women: company.highlight_women,
      launched_at: company.launched_at,
    },
  };
}

export const ycombinatorCollector: StartupCollector = {
  source: 'ycombinator',
  tier: 1,

  async collect(options?: SyncOptions): Promise<CollectedStartup[]> {
    const limit = options?.limit;
    const results: CollectedStartup[] = [];

    for (const batch of YC_BATCHES) {
      console.log(`Fetching YC batch: ${batch}`);
      const companies = await fetchBatch(batch);

      for (const company of companies) {
        // Skip inactive/dead companies
        if (company.status === 'Inactive') continue;

        const startup = transformYCCompany(company, batch);
        results.push(startup);

        if (limit && results.length >= limit) {
          return results;
        }
      }
    }

    console.log(`YC Collector: Found ${results.length} startups`);
    return results;
  },
};

// Convenience function for direct use
export async function collectYCStartups(options?: SyncOptions): Promise<CollectedStartup[]> {
  return ycombinatorCollector.collect(options);
}
