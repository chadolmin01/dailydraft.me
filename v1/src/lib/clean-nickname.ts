/**
 * Parses nicknames that may contain affiliation/major info
 * e.g. "이성민[학생](공과대학 사회기반시스템공학과)" → { name: "이성민", affiliation: "학생", department: "공과대학 사회기반시스템공학과" }
 */

const NICKNAME_PATTERN = /^[\u200D\s]*(.*?)[\s]*(?:\[(.*?)\])?[\s]*(?:\((.*?)\))?[\s]*$/

export function parseNickname(raw: string): {
  name: string
  affiliation: string | null
  department: string | null
} {
  const match = raw.match(NICKNAME_PATTERN)
  if (!match) return { name: raw.trim(), affiliation: null, department: null }

  return {
    name: match[1]?.trim() || raw.trim(),
    affiliation: match[2]?.trim() || null,
    department: match[3]?.trim() || null,
  }
}

/** Returns only the clean name portion of a nickname */
export function cleanNickname(raw: string): string {
  return parseNickname(raw).name || raw
}
