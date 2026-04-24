'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/src/lib/utils'
import type { MemberSource, UserConnection, WizardStep } from './_types'
import { PRESETS } from './_constants'

// 위저드 뷰 + 6 step 컴포넌트.
// PermissionsSettingsClient.tsx 에서 분리. 동작 1:1 보존.

// ──────────────────────────────────────────────
// WizardView — step dispatcher
// ──────────────────────────────────────────────
export function WizardView(p: {
  step: WizardStep
  userDiscordLinked: boolean
  discordConnected: boolean
  discordGuildName: string | null
  pendingSetups: UserConnection['pending_setups']
  memberCount: number
  memberSource: MemberSource | null
  installStarted: boolean
  importing: boolean
  onStartAccountLink: () => void
  onStartBotInstall: () => void
  onRefreshState: () => void
  onLinkPending: (guildId: string) => void
  onImportFromDiscord: () => void
  onGoPreset: () => void
  onPickPreset: (key: string) => void
  onBackSource: () => void
  onBackFromMembers: () => void
  onChooseMemberSource: (src: MemberSource) => void
  onFinish: () => void
}) {
  return (
    <div className="max-w-[720px] mx-auto">
      <WizardProgress step={p.step} />
      {p.step === 'connect-account' && <ConnectAccountStep onStart={p.onStartAccountLink} />}
      {p.step === 'invite-bot' && (
        <InviteBotStep
          installStarted={p.installStarted}
          onStart={p.onStartBotInstall}
          onRefresh={p.onRefreshState}
        />
      )}
      {p.step === 'pending-link' && (
        <PendingLinkStep
          pendingSetups={p.pendingSetups}
          onLink={p.onLinkPending}
          onRefresh={p.onRefreshState}
        />
      )}
      {p.step === 'source' && (
        <SourceStep
          guildName={p.discordGuildName}
          memberCount={p.memberCount}
          importing={p.importing}
          onImport={p.onImportFromDiscord}
          onPreset={p.onGoPreset}
        />
      )}
      {p.step === 'preset' && <PresetPicker onPick={p.onPickPreset} onBack={p.onBackSource} />}
      {p.step === 'members' && (
        <MembersStep
          selected={p.memberSource}
          memberCount={p.memberCount}
          onSelect={p.onChooseMemberSource}
          onBack={p.onBackFromMembers}
          onFinish={p.onFinish}
        />
      )}
    </div>
  )
}

function WizardProgress({ step }: { step: WizardStep }) {
  const steps = [
    { key: 'connect-account', label: '1  계정 연결' },
    { key: 'invite-bot', label: '2  봇 초대' },
    { key: 'source', label: '3  구조 선택' },
    { key: 'members', label: '4  멤버' },
  ]
  const currentKey =
    step === 'connect-account'
      ? 'connect-account'
      : step === 'invite-bot' || step === 'pending-link'
      ? 'invite-bot'
      : step === 'source' || step === 'preset'
      ? 'source'
      : 'members'
  const activeIdx = steps.findIndex((s) => s.key === currentKey)
  return (
    <div className="flex items-center gap-2 mb-8 text-xs flex-wrap">
      {steps.map((s, i) => {
        const done = i < activeIdx
        const active = i === activeIdx
        const cls = done
          ? 'text-brand'
          : active
          ? 'text-txt-primary font-semibold'
          : 'text-txt-tertiary/60'
        return (
          <React.Fragment key={s.key}>
            <span className={cls}>{s.label}</span>
            {i < steps.length - 1 && <span className="text-txt-tertiary/40">—</span>}
          </React.Fragment>
        )
      })}
    </div>
  )
}

function ConnectAccountStep({ onStart }: { onStart: () => void }) {
  return (
    <div>
      <h1 className="text-[28px] font-bold tracking-tight mb-2">
        Discord 계정을 먼저 연결해주세요
      </h1>
      <p className="text-txt-secondary mb-8">
        봇을 서버에 초대하려면 내 Discord 계정을 Draft에 연결해야 합니다.
      </p>

      <div className="bg-surface-card rounded-2xl border border-border p-8 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#5865F2] flex items-center justify-center text-white text-2xl font-bold mb-4">
          D
        </div>
        <h3 className="font-bold text-txt-primary mb-2">Discord 계정 연결</h3>
        <p className="text-sm text-txt-secondary mb-6 max-w-sm mx-auto">
          한 번만 연결하면 이후 봇 초대·서버 감지가 자동으로 진행됩니다.
        </p>
        <button
          onClick={onStart}
          className="w-full max-w-xs mx-auto px-5 py-3 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold text-sm inline-flex items-center justify-center gap-2 shadow-sm transition"
        >
          Discord로 연결하기
        </button>
      </div>

      <div className="mt-6 bg-surface-sunken rounded-2xl p-5 text-xs text-txt-secondary leading-relaxed">
        <div className="font-semibold text-txt-primary mb-2">이 단계에서 요청하는 권한</div>
        <ul className="space-y-1">
          <li>· Discord 유저 ID·닉네임 (본인 확인용)</li>
          <li>· 가입한 서버 목록 열람</li>
        </ul>
        <p className="mt-3 text-txt-tertiary">메시지 내용은 읽지 않습니다.</p>
      </div>
    </div>
  )
}

function InviteBotStep({
  installStarted,
  onStart,
  onRefresh,
}: {
  installStarted: boolean
  onStart: () => void
  onRefresh: () => void
}) {
  return (
    <div>
      <h1 className="text-[28px] font-bold tracking-tight mb-2">
        봇을 Discord 서버에 초대해주세요
      </h1>
      <p className="text-txt-secondary mb-8">
        새 탭에서 Discord로 이동합니다. 봇 초대 완료 후 아래 버튼을 눌러 상태를 확인해주세요.
      </p>

      <div className="bg-surface-card rounded-2xl border border-border p-6 space-y-4">
        <Button variant="blue" fullWidth onClick={onStart}>
          {installStarted ? '봇 초대 다시 열기' : '봇 초대 페이지 열기'}
        </Button>
        {installStarted && (
          <>
            <div className="text-xs text-txt-secondary text-center pt-2 border-t border-border">
              초대 완료하셨나요?
            </div>
            <Button variant="secondary" fullWidth onClick={onRefresh}>
              연결 상태 확인
            </Button>
          </>
        )}
      </div>

      <div className="mt-6 bg-surface-sunken rounded-2xl p-5 text-xs text-txt-secondary leading-relaxed space-y-2">
        <div className="font-semibold text-txt-primary">초대 후 진행 순서</div>
        <div>1. 열린 Discord 탭에서 이 클럽에 연결할 서버 선택</div>
        <div>2. 봇 권한 확인 후 "승인"</div>
        <div>3. Draft 탭으로 돌아와 "연결 상태 확인" 클릭</div>
      </div>
    </div>
  )
}

function PendingLinkStep({
  pendingSetups,
  onLink,
  onRefresh,
}: {
  pendingSetups: UserConnection['pending_setups']
  onLink: (gid: string) => void
  onRefresh: () => void
}) {
  return (
    <div>
      <h1 className="text-[28px] font-bold tracking-tight mb-2">
        연결할 서버를 선택해주세요
      </h1>
      <p className="text-txt-secondary mb-8">
        봇이 초대된 서버 중 이 클럽과 연결할 서버를 골라주세요.
      </p>

      <div className="space-y-3 mb-6">
        {pendingSetups.map((s) => (
          <button
            key={s.discord_guild_id}
            onClick={() => onLink(s.discord_guild_id)}
            className="w-full text-left bg-surface-card border-2 border-brand/30 rounded-2xl p-5 hover:border-brand transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-700 font-bold">
                {s.discord_guild_name?.slice(0, 1) ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-txt-primary truncate">
                  {s.discord_guild_name ?? '이름 없음'}
                </div>
                <div className="text-xs text-txt-tertiary">연결 대기</div>
              </div>
              <span className="text-brand font-semibold text-sm">이 서버 선택 →</span>
            </div>
          </button>
        ))}
      </div>

      <Button variant="secondary" fullWidth onClick={onRefresh}>
        목록 새로고침
      </Button>
    </div>
  )
}

function SourceStep({
  guildName,
  memberCount,
  importing,
  onImport,
  onPreset,
}: {
  guildName: string | null
  memberCount: number
  importing: boolean
  onImport: () => void
  onPreset: () => void
}) {
  return (
    <div>
      <h1 className="text-[28px] font-bold tracking-tight mb-2">
        어떻게 시작하시겠어요?
      </h1>
      <p className="text-txt-secondary mb-8">
        <span className="font-medium text-txt-primary">{guildName ?? '연결된 서버'}</span> 의
        구조를 그대로 가져오거나, 프리셋으로 새로 시작할 수 있습니다.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <button
          onClick={onImport}
          disabled={importing}
          className="text-left bg-surface-card border-2 border-brand/30 rounded-2xl p-6 hover:border-brand transition relative disabled:opacity-60 disabled:cursor-wait"
        >
          <span className="absolute top-4 right-4 inline-flex items-center text-xs font-semibold text-brand bg-brand/5 px-2 py-0.5 rounded-md ring-1 ring-brand/20">
            추천
          </span>
          <div className="text-2xl mb-3">📥</div>
          <div className="font-bold text-txt-primary mb-1">기존 서버 구조 가져오기</div>
          <p className="text-sm text-txt-secondary mb-4">
            {guildName ?? '서버'}의 역할·채널·멤버를 지금 권한 시스템으로 불러옵니다.
          </p>
          <div className="text-xs text-txt-secondary space-y-1 bg-surface-sunken rounded-xl p-3">
            <div>· 역할 = Discord 역할 (관리자 비트 자동 감지)</div>
            <div>· 채널 = 카테고리별로 그룹핑</div>
            <div>· 멤버 = Draft 가입자 {memberCount}명과 매칭</div>
          </div>
          {importing && (
            <div className="mt-3 text-xs text-brand flex items-center gap-2">
              <span className="inline-block w-3 h-3 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
              가져오는 중...
            </div>
          )}
        </button>
        <button
          onClick={onPreset}
          disabled={importing}
          className="text-left bg-surface-card border border-border rounded-2xl p-6 hover:border-txt-tertiary transition disabled:opacity-60"
        >
          <div className="text-2xl mb-3">✨</div>
          <div className="font-bold text-txt-primary mb-1">프리셋으로 시작</div>
          <p className="text-sm text-txt-secondary mb-4">Draft 표준 구조 중에서 고릅니다.</p>
          <div className="text-xs text-txt-secondary space-y-1 bg-surface-sunken rounded-xl p-3">
            <div>· 일반형 / 학술형 / 운동형 / 프로젝트형</div>
            <div>· 나중에 Discord에 반영 (Phase 3)</div>
          </div>
        </button>
      </div>
    </div>
  )
}

function PresetPicker({
  onPick,
  onBack,
}: {
  onPick: (key: string) => void
  onBack: () => void
}) {
  return (
    <div>
      <h1 className="text-[28px] font-bold tracking-tight mb-2">어떤 동아리이신가요?</h1>
      <p className="text-txt-secondary mb-8">
        가장 가까운 구조를 선택해주세요. 나중에 자유롭게 바꿀 수 있습니다.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {Object.entries(PRESETS).map(([key, p]) => (
          <button
            key={key}
            onClick={() => onPick(key)}
            className="text-left bg-surface-card border border-border rounded-2xl p-6 hover:border-brand/40 hover:-translate-y-0.5 transition shadow-sm"
          >
            <div className="text-3xl mb-3">{p.icon}</div>
            <div className="font-bold text-txt-primary mb-1">{p.name}</div>
            <div className="text-sm text-txt-secondary mb-3">{p.desc}</div>
            <div className="text-xs text-txt-tertiary">{p.meta}</div>
          </button>
        ))}
      </div>

      <button
        onClick={() => onPick('custom')}
        className="w-full bg-surface-card border border-dashed border-border-strong rounded-2xl p-5 text-left hover:border-txt-tertiary transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-sunken flex items-center justify-center text-txt-tertiary">
            +
          </div>
          <div className="flex-1">
            <div className="font-semibold text-txt-primary">직접 만들기</div>
            <div className="text-sm text-txt-secondary">
              빈 상태에서 역할·채널을 하나씩 추가합니다.
            </div>
          </div>
        </div>
      </button>

      <div className="mt-6">
        <button onClick={onBack} className="text-sm text-txt-tertiary hover:text-txt-primary">
          ← 이전으로
        </button>
      </div>
    </div>
  )
}

function MembersStep(p: {
  selected: MemberSource | null
  memberCount: number
  onSelect: (s: MemberSource) => void
  onBack: () => void
  onFinish: () => void
}) {
  const options: {
    key: MemberSource
    icon: string
    title: string
    desc: string
    badge?: '추천' | '엔터프라이즈' | null
  }[] = [
    {
      key: 'discord-sync',
      icon: '🔄',
      title: 'Discord 서버 멤버 자동 가져오기',
      desc: `Discord 역할에 맞춰 ${p.memberCount}명 배정`,
      badge: '추천',
    },
    {
      key: 'draft-match',
      icon: '🎯',
      title: 'Draft 가입자와 매칭',
      desc: '프로필 검증된 멤버만 가져옴',
      badge: '엔터프라이즈',
    },
    { key: 'manual', icon: '✍️', title: '수동으로 추가', desc: '직접 배정', badge: null },
  ]
  return (
    <div>
      <h1 className="text-[28px] font-bold tracking-tight mb-2">멤버를 어떻게 가져올까요?</h1>
      <p className="text-txt-secondary mb-8">프리셋 적용 후 멤버 배정 방식을 선택합니다.</p>

      <div className="space-y-3 mb-6">
        {options.map((o) => {
          const selected = p.selected === o.key
          return (
            <button
              key={o.key}
              onClick={() => p.onSelect(o.key)}
              className={cn(
                'w-full text-left bg-surface-card border-2 rounded-2xl p-5 hover:border-brand/40 transition',
                selected ? 'border-brand bg-brand/5' : 'border-border'
              )}
            >
              <div className="flex items-start gap-4">
                <div className="text-2xl">{o.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold text-txt-primary">{o.title}</span>
                    {o.badge && (
                      <span
                        className={cn(
                          'text-xs font-semibold px-2 py-0.5 rounded-md ring-1',
                          o.badge === '추천'
                            ? 'text-brand bg-brand/5 ring-brand/20'
                            : 'text-violet-700 bg-violet-50 ring-violet-100'
                        )}
                      >
                        {o.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-txt-secondary">{o.desc}</div>
                </div>
                <div
                  className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5',
                    selected ? 'border-brand bg-brand' : 'border-border-strong'
                  )}
                >
                  {selected && <span className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={p.onBack}>
          이전
        </Button>
        <Button variant="blue" fullWidth onClick={p.onFinish} disabled={!p.selected}>
          {p.selected ? '완료 — 편집 화면으로' : '멤버 가져오기 방식을 선택해주세요'}
        </Button>
      </div>
    </div>
  )
}
