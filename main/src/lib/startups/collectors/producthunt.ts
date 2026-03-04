/**
 * Product Hunt Collector
 * Uses official GraphQL API
 * Requires PRODUCTHUNT_ACCESS_TOKEN env variable
 */

import {
  StartupCollector,
  CollectedStartup,
  SyncOptions,
  ProductHuntPost,
  ProductHuntResponse,
} from '../types';

const PH_API_URL = 'https://api.producthunt.com/v2/api/graphql';

const POSTS_QUERY = `
  query GetPosts($first: Int!, $after: String, $order: PostsOrder!) {
    posts(first: $first, after: $after, order: $order) {
      edges {
        node {
          id
          name
          tagline
          description
          url
          website
          votesCount
          commentsCount
          thumbnail {
            url
          }
          topics {
            edges {
              node {
                name
              }
            }
          }
          createdAt
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

interface GraphQLVariables {
  first: number;
  after?: string;
  order: 'VOTES' | 'NEWEST' | 'FEATURED_AT';
}

async function fetchPosts(
  accessToken: string,
  variables: GraphQLVariables
): Promise<{ posts: ProductHuntPost[]; endCursor?: string; hasNextPage: boolean }> {
  const response = await fetch(PH_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query: POSTS_QUERY,
      variables,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Product Hunt API error: ${response.status} - ${error}`);
  }

  const result = (await response.json()) as ProductHuntResponse;

  if (!result.data?.posts) {
    throw new Error('Invalid response from Product Hunt API');
  }

  return {
    posts: result.data.posts.edges.map(edge => ({
      ...edge.node,
      websiteUrl: edge.node.website,
    })),
    endCursor: result.data.posts.pageInfo.endCursor,
    hasNextPage: result.data.posts.pageInfo.hasNextPage,
  };
}

function transformPHPost(post: ProductHuntPost): CollectedStartup {
  const topics = post.topics?.edges?.map(e => e.node.name) || [];

  return {
    externalId: `producthunt:${post.id}`,
    source: 'producthunt',
    sourceUrl: post.url,
    name: post.name,
    tagline: post.tagline,
    description: post.description,
    category: topics.length > 0 ? topics : ['Other'],
    logoUrl: post.thumbnail?.url,
    websiteUrl: post.websiteUrl,
    upvotes: post.votesCount,
    commentsCount: post.commentsCount,
    rawData: {
      createdAt: post.createdAt,
      topics,
    },
  };
}

export const producthuntCollector: StartupCollector = {
  source: 'producthunt',
  tier: 1,

  async collect(options?: SyncOptions): Promise<CollectedStartup[]> {
    const accessToken = process.env.PRODUCTHUNT_ACCESS_TOKEN;

    if (!accessToken) {
      console.warn('PRODUCTHUNT_ACCESS_TOKEN not set, skipping Product Hunt collection');
      return [];
    }

    const limit = options?.limit || 100;
    const results: CollectedStartup[] = [];
    let endCursor: string | undefined;
    let hasNextPage = true;
    const pageSize = Math.min(limit, 20); // PH API max is 20 per request

    try {
      while (hasNextPage && results.length < limit) {
        console.log(`Fetching Product Hunt posts (cursor: ${endCursor || 'start'})`);

        const { posts, endCursor: newCursor, hasNextPage: more } = await fetchPosts(
          accessToken,
          {
            first: pageSize,
            after: endCursor,
            order: 'VOTES', // Get most popular first
          }
        );

        for (const post of posts) {
          const startup = transformPHPost(post);
          results.push(startup);

          if (results.length >= limit) break;
        }

        endCursor = newCursor;
        hasNextPage = more;

        // Rate limiting: 450 requests per 15 minutes
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      console.log(`Product Hunt Collector: Found ${results.length} startups`);
      return results;
    } catch (error) {
      console.error('Product Hunt collection error:', error);
      throw error;
    }
  },
};

// Convenience function for direct use
export async function collectProductHuntStartups(
  options?: SyncOptions
): Promise<CollectedStartup[]> {
  return producthuntCollector.collect(options);
}
