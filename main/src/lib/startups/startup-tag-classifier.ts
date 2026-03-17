/**
 * Startup Tag Classifier
 * Uses Gemini 2.0 Flash to classify startup ideas into relevant tags
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { INTEREST_TAGS, STARTUP_CATEGORIES } from './types';

interface StartupInput {
  name: string;
  tagline: string | null;
  description: string | null;
  category: string[];
}

/**
 * Classify startup interest tags using Gemini AI
 */
export async function classifyStartupTags(startup: StartupInput): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return getFallbackTags(startup);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = buildPrompt(startup);
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    return parseTagsFromResponse(response);
  } catch (error) {
    console.warn('Tag classification failed:', error);
    return getFallbackTags(startup);
  }
}

/**
 * Build classification prompt
 */
function buildPrompt(startup: StartupInput): string {
  const interestTagList = INTEREST_TAGS.join(', ');

  return `You are a startup classification expert. Analyze the following startup and extract relevant interest tags.

Available tags:
${interestTagList}

Startup information:
Name: ${startup.name}
Tagline: ${startup.tagline || 'N/A'}
Description: ${startup.description?.substring(0, 500) || 'N/A'}
Category: ${startup.category.join(', ') || 'N/A'}

Rules:
1. Select only tags that are highly relevant to this startup
2. Select 3-6 tags
3. Return ONLY a JSON array (no other text)
4. Example: ["automation", "api", "enterprise", "productivity"]

Tags array:`;
}

/**
 * Parse tags from Gemini response
 */
function parseTagsFromResponse(response: string): string[] {
  try {
    // Remove markdown code blocks if present
    const cleaned = response
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    // Extract JSON array
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (!match) {
      throw new Error('No JSON array found in response');
    }

    const tags: unknown = JSON.parse(match[0]);

    if (!Array.isArray(tags)) {
      throw new Error('Response is not an array');
    }

    // Validate and filter tags
    const validTags = tags
      .filter((tag): tag is string => typeof tag === 'string')
      .map(tag => tag.toLowerCase().replace(/[^a-z-]/g, ''))
      .filter(tag => (INTEREST_TAGS as readonly string[]).includes(tag))
      .slice(0, 6);

    if (validTags.length < 2) {
      // Try to salvage by keyword matching
      return getFallbackTags({
        ...{ name: '', tagline: null, description: null, category: [] },
        description: response,
      });
    }

    return validTags;
  } catch {
    return [];
  }
}

/**
 * Fallback tags based on category keywords
 */
function getFallbackTags(startup: StartupInput): string[] {
  const tags: string[] = [];
  const text = `${startup.name} ${startup.tagline || ''} ${startup.description || ''} ${startup.category.join(' ')}`.toLowerCase();

  // Keyword-based tag inference
  if (text.includes('automat') || text.includes('workflow')) tags.push('automation');
  if (text.includes('productiv') || text.includes('efficienc')) tags.push('productivity');
  if (text.includes('collaborat') || text.includes('team')) tags.push('collaboration');
  if (text.includes('analytic') || text.includes('dashboard') || text.includes('insight')) tags.push('analytics');
  if (text.includes('payment') || text.includes('billing') || text.includes('invoice')) tags.push('payments');
  if (text.includes('subscript') || text.includes('recurring')) tags.push('subscription');
  if (text.includes('api') || text.includes('integrat') || text.includes('connect')) tags.push('api');
  if (text.includes('no-code') || text.includes('nocode') || text.includes('no code')) tags.push('no-code');
  if (text.includes('low-code') || text.includes('lowcode')) tags.push('low-code');
  if (text.includes('mobile') || text.includes('app')) tags.push('mobile-first');
  if (text.includes('enterprise') || text.includes('corporate')) tags.push('enterprise');
  if (text.includes('small business') || text.includes('smb')) tags.push('smb');
  if (text.includes('consumer') || text.includes('personal')) tags.push('consumer');
  if (text.includes('creator') || text.includes('influencer')) tags.push('creator-economy');
  if (text.includes('remote') || text.includes('distributed')) tags.push('remote-work');
  if (text.includes('sustain') || text.includes('green') || text.includes('carbon')) tags.push('sustainability');
  if (text.includes('personal') || text.includes('custom') || text.includes('tailor')) tags.push('personalization');
  if (text.includes('communit') || text.includes('social')) tags.push('community');
  if (text.includes('platform') || text.includes('marketplace')) tags.push('platform');

  // Category-based inference
  const categoryText = startup.category.join(' ').toLowerCase();
  if (categoryText.includes('saas') || categoryText.includes('b2b')) {
    if (!tags.includes('enterprise') && !tags.includes('smb')) {
      tags.push('smb');
    }
  }

  // Ensure minimum tags
  if (tags.length < 2) {
    tags.push('productivity');
  }

  return tags.slice(0, 6);
}

/**
 * Classify startup into primary categories
 */
export async function classifyStartupCategory(startup: StartupInput): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || !startup.description) {
    return startup.category.length > 0 ? startup.category : ['Other'];
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const categoryList = STARTUP_CATEGORIES.join(', ');

    const prompt = `Classify this startup into 1-3 categories from the list below.

Categories: ${categoryList}

Startup: ${startup.name}
Description: ${startup.description.substring(0, 300)}

Return ONLY a JSON array of category names. Example: ["AI/ML", "SaaS", "B2B"]`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    const match = response.match(/\[[\s\S]*\]/);
    if (!match) return startup.category;

    const categories = JSON.parse(match[0]) as string[];
    return categories
      .filter(c => (STARTUP_CATEGORIES as readonly string[]).includes(c))
      .slice(0, 3);
  } catch {
    return startup.category.length > 0 ? startup.category : ['Other'];
  }
}
