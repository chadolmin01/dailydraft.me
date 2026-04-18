/**
 * 채널별 브랜드 팔레트 + 친근한 이름/설명.
 *
 * 목적:
 * 1. "Instagram/LinkedIn/에타" 같은 플랫폼 연동 지점에서 해당 SNS의 색·아이콘을 써서
 *    "진짜 연동된다"는 신뢰감을 준다 (Sign in with Google 패턴).
 * 2. 자동화를 모르는 회장도 각 채널이 무엇에 쓰이는지 한 줄로 이해할 수 있게 설명.
 *
 * 사용 범위:
 * - 번들 상세 페이지 채널 탭 (활성 상태)
 * - 채널 프레임 내부 액센트
 * - R3.4 Connect/OAuth 버튼 (추후)
 *
 * 안 쓰는 곳: 페르소나 슬롯, 설정 페이지 같은 내부 UI — 거긴 Draft Toss Blue 유지.
 */

import {
  Instagram,
  Linkedin,
  Mail,
  MessageCircle,
  AtSign,
  Megaphone,
  type LucideIcon,
} from 'lucide-react'
import type { ChannelFormat } from '@/src/lib/personas/types'

export interface ChannelBrand {
  /** 친근한 표시 이름 (탭·배지용) */
  label: string
  /** 2~3줄로 설명. 자동화 초보자도 이해할 수 있게 */
  description: string
  /** 이 채널에서 하는 일을 한 단어로 — "발행" vs "복사" 구분 */
  action_verb: string
  /** lucide 아이콘 */
  icon: LucideIcon
  /**
   * Tailwind용 색 체계.
   * accent는 solid (버튼·탭 활성), bg는 soft tint (배경), text는 글자.
   */
  accent: string
  bg: string
  text: string
  /** 탭 활성 상태의 hover + 전경 조합 */
  activeClass: string
  /** 탭 비활성 hover */
  inactiveHoverClass: string
  /** 이 채널 출력이 복사 전용(수동 붙여넣기)인지 vs 자동 발행 가능한지 */
  is_copy_only: boolean
}

export const CHANNEL_BRANDS: Record<ChannelFormat, ChannelBrand> = {
  instagram_caption: {
    label: '인스타그램',
    description:
      '팔로워에게 보여줄 피드용 캡션입니다. 해시태그까지 함께 준비해두었습니다.',
    action_verb: '복사해서 올리기',
    icon: Instagram,
    accent: 'bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]',
    bg: 'bg-[#DD2A7B]/5',
    text: 'text-[#DD2A7B]',
    activeClass:
      'bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white',
    inactiveHoverClass: 'hover:text-[#DD2A7B]',
    is_copy_only: true,
  },

  linkedin_post: {
    label: 'LinkedIn',
    description:
      '스폰서·동문·업계 분들께 공유할 장문 포스트입니다. 격식 있는 톤으로 다듬었습니다.',
    action_verb: '복사해서 올리기',
    icon: Linkedin,
    accent: 'bg-[#0A66C2]',
    bg: 'bg-[#0A66C2]/8',
    text: 'text-[#0A66C2]',
    activeClass: 'bg-[#0A66C2] text-white',
    inactiveHoverClass: 'hover:text-[#0A66C2]',
    is_copy_only: true,
  },

  everytime_post: {
    label: '에브리타임',
    description:
      '학교 커뮤니티 동아리 게시판에 올릴 글입니다. 제목 50자·본문 600자 제한에 맞춰드렸습니다.',
    action_verb: '복사해서 올리기',
    icon: Megaphone,
    accent: 'bg-[#FF5722]',
    bg: 'bg-[#FF5722]/8',
    text: 'text-[#FF5722]',
    activeClass: 'bg-[#FF5722] text-white',
    inactiveHoverClass: 'hover:text-[#FF5722]',
    is_copy_only: true,
  },

  email_newsletter: {
    label: '이메일 뉴스레터',
    description:
      '구독자에게 보낼 뉴스레터 초안입니다. 제목·미리보기·본문이 한 세트입니다.',
    action_verb: '구독자에게 발송',
    icon: Mail,
    accent: 'bg-[#10B981]',
    bg: 'bg-[#10B981]/8',
    text: 'text-[#10B981]',
    activeClass: 'bg-[#10B981] text-white',
    inactiveHoverClass: 'hover:text-[#10B981]',
    is_copy_only: false,
  },

  discord_forum_markdown: {
    label: 'Discord',
    description:
      '동아리 Discord 서버 안쪽에 바로 올라갑니다. 멤버들이 제일 먼저 보는 글입니다.',
    action_verb: '승인하면 자동 발행',
    icon: MessageCircle,
    accent: 'bg-[#5865F2]',
    bg: 'bg-[#5865F2]/8',
    text: 'text-[#5865F2]',
    activeClass: 'bg-[#5865F2] text-white',
    inactiveHoverClass: 'hover:text-[#5865F2]',
    is_copy_only: false,
  },
}

/** 유틸: 아이콘만 필요할 때 */
export function getChannelIcon(format: ChannelFormat): LucideIcon {
  return CHANNEL_BRANDS[format]?.icon ?? AtSign
}

/** 유틸: 친근한 라벨 */
export function getChannelLabel(format: ChannelFormat): string {
  return CHANNEL_BRANDS[format]?.label ?? format
}
