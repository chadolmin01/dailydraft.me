/**
 * 자산 URL → 유형 자동 인식 + 권한 페이지 딥링크 추출.
 *
 * 운영진이 URL 만 붙여넣으면 Draft 가:
 *   1. asset_type 을 추론 (등록 시 자동 채워줌)
 *   2. resourceUrl: 자산 자체로 가는 정상 링크
 *   3. adminPageUrl: 각 플랫폼의 권한·멤버 관리 페이지로 *바로* 점프하는 딥링크
 *
 * 핵심 트레이드오프:
 *   - URL 패턴이 플랫폼 변경에 따라 깨질 수 있음. fallback 은 항상 resourceUrl.
 *   - ID 추출 정규식은 보수적으로 — 잘못된 ID 로 redirect 되는 게 더 위험.
 */

export type AssetType =
  | 'drive'
  | 'gmail'
  | 'notion'
  | 'github'
  | 'discord'
  | 'figma'
  | 'instagram'
  | 'email'
  | 'other'

export interface DeepLinks {
  /** 자산 자체로 가는 URL (사용자가 입력한 것 그대로). */
  resourceUrl: string
  /** 권한·멤버 관리 페이지 딥링크. 추출 실패 시 null. */
  adminPageUrl: string | null
  /** 딥링크 버튼 라벨 (한국어). */
  adminPageLabel: string | null
}

/** URL 패턴으로 asset_type 추론. 매칭 실패 시 'other'. */
export function detectAssetType(url: string): AssetType {
  if (!url) return 'other'
  const u = url.toLowerCase().trim()

  if (u.includes('drive.google.com')) return 'drive'
  if (u.includes('docs.google.com') || u.includes('sheets.google.com')) return 'drive'
  if (u.includes('notion.so') || u.includes('notion.site')) return 'notion'
  if (u.includes('github.com')) return 'github'
  if (u.includes('discord.com') || u.includes('discord.gg')) return 'discord'
  if (u.includes('figma.com')) return 'figma'
  if (u.includes('instagram.com')) return 'instagram'

  // 이메일 — gmail 우선, 그 외는 email
  if (/^[\w.+-]+@gmail\.com$/i.test(u)) return 'gmail'
  if (/^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i.test(u)) return 'email'

  return 'other'
}

/**
 * URL 에서 ID 를 추출해 권한 관리 페이지로 점프하는 딥링크 생성.
 * 추출 실패해도 throw 하지 않음 — 항상 resourceUrl 은 살려두고 adminPageUrl 만 null.
 */
export function deriveDeepLinks(type: AssetType, url: string): DeepLinks {
  const fallback: DeepLinks = { resourceUrl: url, adminPageUrl: null, adminPageLabel: null }
  if (!url) return fallback

  try {
    switch (type) {
      case 'drive': {
        const m = url.match(/folders\/([\w-]+)/)
        if (m) {
          // ths=true: 공유 패널이 자동으로 열림
          return {
            resourceUrl: url,
            adminPageUrl: `https://drive.google.com/drive/folders/${m[1]}?ths=true`,
            adminPageLabel: '폴더 공유 패널 열기',
          }
        }
        return fallback
      }
      case 'notion': {
        // notion.so/{workspace}/{page-with-id} 형태에서 워크스페이스 추출
        const m = url.match(/notion\.so\/([\w-]+)\//)
        return {
          resourceUrl: url,
          adminPageUrl: m
            ? `https://www.notion.so/${m[1]}/settings/people`
            : 'https://www.notion.so/me/settings/people',
          adminPageLabel: '워크스페이스 멤버 설정',
        }
      }
      case 'github': {
        const m = url.match(/github\.com\/([\w-]+)/)
        if (m) {
          return {
            resourceUrl: url,
            adminPageUrl: `https://github.com/orgs/${m[1]}/people`,
            adminPageLabel: 'Org 멤버 관리',
          }
        }
        return fallback
      }
      case 'discord': {
        // discord.com/channels/{guildId}/{channelId} 또는 .../channels/{guildId}
        const m = url.match(/channels\/(\d+)/)
        if (m) {
          return {
            resourceUrl: url,
            adminPageUrl: `https://discord.com/channels/${m[1]}`,
            adminPageLabel: '서버 설정 → 멤버',
          }
        }
        return fallback
      }
      case 'figma': {
        const m = url.match(/team\/(\d+)/)
        if (m) {
          return {
            resourceUrl: url,
            adminPageUrl: `https://www.figma.com/files/team/${m[1]}/settings/members`,
            adminPageLabel: '팀 멤버 설정',
          }
        }
        return fallback
      }
      case 'instagram':
        return {
          resourceUrl: url,
          adminPageUrl: 'https://business.facebook.com/settings/instagram-accounts',
          adminPageLabel: '비즈니스 매니저 → IG 계정',
        }
      case 'gmail':
        return {
          resourceUrl: url,
          adminPageUrl: 'https://admin.google.com/ac/users',
          adminPageLabel: 'Workspace 사용자 관리',
        }
      default:
        return fallback
    }
  } catch {
    return fallback
  }
}

/** 어떤 플랫폼이 OAuth 자동 양도를 지원하는지 — Phase 0 시점 capability matrix */
export function supportsAutoTransfer(type: AssetType): boolean {
  return ['drive', 'gmail', 'notion', 'github', 'discord', 'figma'].includes(type)
}

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  drive: '구글 드라이브',
  gmail: '구글 메일',
  notion: '노션',
  github: 'GitHub',
  discord: '디스코드',
  figma: 'Figma',
  instagram: '인스타그램',
  email: '이메일',
  other: '기타',
}

export const ASSET_TYPE_ICONS: Record<AssetType, string> = {
  drive: '📁',
  gmail: '✉️',
  notion: '📝',
  github: '⌨️',
  discord: '💬',
  figma: '🎨',
  instagram: '📷',
  email: '✉️',
  other: '🔗',
}
