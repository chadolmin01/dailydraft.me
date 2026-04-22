'use client'

import React, { useState, useEffect, useRef } from 'react'
import { MessageCircle, ThumbsUp, Flag, Send, Loader2, ArrowRight, Trash2, CheckCircle2, AlertCircle } from 'lucide-react'
import { SkeletonFeed } from '@/components/ui/Skeleton'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { useComments, Comment } from '@/src/hooks/useComments'
import { useAuth } from '@/src/context/AuthContext'
import { useProfile } from '@/src/hooks/useProfile'
import { COMMENT_LABEL, COMMENT_VERB } from '@/src/constants/labels'
import { cleanNickname } from '@/src/lib/clean-nickname'

const INITIAL_VISIBLE = 5

type InlineMessage = { type: 'success' | 'error' | 'info'; text: string }

interface CommentSectionProps {
  opportunityId: string
  ownerId?: string | null
  onLoginClick?: () => void
}

export const CommentSection: React.FC<CommentSectionProps> = ({ opportunityId, ownerId, onLoginClick }) => {
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const { comments, loading, addComment, voteHelpful, reportComment, deleteComment } = useComments({
    opportunityId,
  })

  const isOwner = !!user && !!ownerId && user.id === ownerId

  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [votedComments, setVotedComments] = useState<Set<string>>(new Set())
  const [reportedComments, setReportedComments] = useState<Set<string>>(new Set())
  const [showAll, setShowAll] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [message, setMessage] = useState<InlineMessage | null>(null)
  const messageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 인라인 메시지 표시 (3초 후 자동 사라짐) — 사이드바 버튼 z-index 충돌 회피용
  const showMessage = (type: InlineMessage['type'], text: string) => {
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current)
    setMessage({ type, text })
    messageTimerRef.current = setTimeout(() => setMessage(null), 3000)
  }

  useEffect(() => {
    return () => {
      if (messageTimerRef.current) clearTimeout(messageTimerRef.current)
    }
  }, [])

  useEffect(() => {
    try {
      const voted = localStorage.getItem(`voted_${opportunityId}`)
      const reported = localStorage.getItem(`reported_${opportunityId}`)
      if (voted) setVotedComments(new Set(JSON.parse(voted)))
      if (reported) setReportedComments(new Set(JSON.parse(reported)))
    } catch {
      // Ignore corrupted localStorage data
    }
  }, [opportunityId])

  const getVoterIdentifier = () => {
    let identifier = localStorage.getItem('voter_identifier')
    if (!identifier) {
      identifier = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('voter_identifier', identifier)
    }
    return identifier
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || !profile) return

    setSubmitting(true)
    const success = await addComment({
      nickname: profile.nickname,
      school: profile.university || undefined,
      content: content.trim(),
    })

    if (success) {
      setContent('')
      showMessage('success', '댓글이 등록되었습니다')
    } else {
      showMessage('error', '댓글 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    }
    setSubmitting(false)
  }

  const handleVote = async (commentId: string) => {
    if (votedComments.has(commentId)) { showMessage('info', '이미 평가하신 댓글입니다'); return }

    const identifier = getVoterIdentifier()
    const success = await voteHelpful(commentId, identifier)

    if (success) {
      const newVoted = new Set(votedComments).add(commentId)
      setVotedComments(newVoted)
      localStorage.setItem(`voted_${opportunityId}`, JSON.stringify([...newVoted]))
      showMessage('success', '도움이 되셨다고 표시했습니다')
    }
  }

  const handleReport = async (commentId: string) => {
    if (reportedComments.has(commentId)) { showMessage('info', '이미 신고하신 댓글입니다'); return }

    const identifier = getVoterIdentifier()
    const success = await reportComment(commentId, identifier, 'inappropriate')

    if (success) {
      const newReported = new Set(reportedComments).add(commentId)
      setReportedComments(newReported)
      localStorage.setItem(`reported_${opportunityId}`, JSON.stringify([...newReported]))
      showMessage('success', '신고가 접수되었습니다. 확인 후 운영진이 조치합니다.')
    } else {
      showMessage('error', '신고 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    }
  }

  const handleDeleteConfirm = () => {
    if (!pendingDeleteId) return
    const id = pendingDeleteId
    // 모달 즉시 닫기 — 낙관적 업데이트가 이미 화면에서 댓글 제거함
    // 백그라운드 mutation이 hang되어도 UI는 멈추지 않음
    setPendingDeleteId(null)
    deleteComment(id).then((success) => {
      if (success) {
        showMessage('success', '댓글을 삭제했습니다')
      } else {
        showMessage('error', '삭제에 실패했습니다. 페이지 새로고침 후 다시 시도해 주세요.')
      }
    })
  }

  const visibleComments = showAll ? comments : comments.slice(0, INITIAL_VISIBLE)
  const hasMore = comments.length > INITIAL_VISIBLE

  return (
    <div>
      {/* Inline message banner — 사이드바 z-index 충돌 회피용 로컬 알림 */}
      {message && (
        <div
          className={`mb-3 flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium animate-in fade-in slide-in-from-top-1 duration-200 ${
            message.type === 'success'
              ? 'bg-[#E8F5E9] dark:bg-[#1B3A2D] text-[#34C759]'
              : message.type === 'error'
              ? 'bg-[#FFE8E8] dark:bg-[#3A1C1C] text-[#FF3B30]'
              : 'bg-[#F2F3F5] dark:bg-[#2C2C2E] text-txt-secondary'
          }`}
          role="status"
          aria-live="polite"
        >
          {message.type === 'success' && <CheckCircle2 size={14} />}
          {message.type === 'error' && <AlertCircle size={14} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Comment Form */}
      {user && profile ? (
        <form onSubmit={handleSubmit} className="bg-[#F7F8F9] dark:bg-[#1C1C1E] rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-surface-inverse text-txt-inverse rounded-full flex items-center justify-center text-[11px] font-bold shrink-0">
              {cleanNickname(profile.nickname).charAt(0)}
            </div>
            <span className="text-[13px] font-semibold text-txt-primary">{cleanNickname(profile.nickname)}</span>
            {profile.university && (
              <span className="text-[12px] text-txt-disabled">{profile.university}</span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={`${COMMENT_VERB}을 남겨주세요...`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 px-3.5 py-2 text-[14px] bg-white dark:bg-[#2C2C2E] rounded-xl text-txt-primary placeholder-txt-disabled border-0 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/30"
              maxLength={200}
            />
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="px-3.5 py-2 bg-[#5E6AD2] text-white rounded-xl hover:bg-[#4B4FB8] transition-colors disabled:bg-[#F2F3F5] dark:disabled:bg-[#2C2C2E] disabled:text-txt-disabled disabled:cursor-not-allowed flex items-center justify-center active:scale-[0.97]"
              aria-label="댓글 전송"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
          <p className={`text-[11px] text-right mt-1.5 tabular-nums ${
            content.length >= 200 ? 'text-status-danger-text font-semibold' :
            content.length >= 180 ? 'text-status-warning-text' :
            'text-txt-disabled'
          }`}>{content.length}/200</p>
        </form>
      ) : (
        <div className="bg-[#F7F8F9] dark:bg-[#1C1C1E] rounded-2xl p-5 mb-4 text-center">
          <p className="text-[13px] text-txt-tertiary mb-3">로그인하고 {COMMENT_VERB}을 남겨보세요</p>
          <button
            onClick={onLoginClick}
            className="inline-flex items-center gap-1.5 bg-[#5E6AD2] text-white px-5 py-2 rounded-full text-[13px] font-semibold hover:bg-[#4B4FB8] transition-colors active:scale-[0.97]"
          >
            로그인하기 <ArrowRight size={12} />
          </button>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <SkeletonFeed count={3} />
      ) : comments.length === 0 ? (
        <div className="py-8 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#F2F3F5] dark:bg-[#2C2C2E] empty-float mb-3">
            <MessageCircle size={18} className="text-txt-disabled" strokeWidth={1.5} />
          </div>
          <p className="text-[13px] text-txt-tertiary">아직 {COMMENT_LABEL}이 없습니다. 첫 {COMMENT_LABEL}을 남겨 보세요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleComments.map((comment) => {
            const canDelete = !!user && (isOwner || (comment.user_id !== null && comment.user_id === user.id))
            return (
              <CommentItem
                key={comment.id}
                comment={comment}
                hasVoted={votedComments.has(comment.id)}
                hasReported={reportedComments.has(comment.id)}
                canDelete={canDelete}
                onVote={() => handleVote(comment.id)}
                onReport={() => handleReport(comment.id)}
                onDelete={() => setPendingDeleteId(comment.id)}
              />
            )
          })}
          {hasMore && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full py-2.5 text-[13px] font-medium text-[#5E6AD2] hover:text-[#4B4FB8] transition-colors rounded-xl hover:bg-[#F7F8F9] dark:hover:bg-[#1C1C1E]"
            >
              {COMMENT_LABEL} {comments.length - INITIAL_VISIBLE}개 더 보기
            </button>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={pendingDeleteId !== null}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="댓글 삭제"
        message="이 댓글을 삭제하시겠습니까? 삭제한 댓글은 복구되지 않으며, 다른 사용자가 남긴 답글은 그대로 유지됩니다."
        confirmText="삭제하기"
        cancelText="취소"
        variant="danger"
      />
    </div>
  )
}

interface CommentItemProps {
  comment: Comment
  hasVoted: boolean
  hasReported: boolean
  canDelete: boolean
  onVote: () => void
  onReport: () => void
  onDelete: () => void
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  hasVoted,
  hasReported,
  canDelete,
  onVote,
  onReport,
  onDelete,
}) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (hours < 1) return '방금 전'
    if (hours < 24) return `${hours}시간 전`
    if (days < 7) return `${days}일 전`
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="bg-[#F7F8F9] dark:bg-[#1C1C1E] rounded-2xl p-4">
      {/* Author info */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 bg-surface-inverse text-txt-inverse rounded-full flex items-center justify-center text-[11px] font-bold shrink-0">
          {cleanNickname(comment.nickname).charAt(0)}
        </div>
        <span className="font-semibold text-[13px] text-txt-primary">{cleanNickname(comment.nickname)}</span>
        {comment.school && (
          <span className="text-[12px] text-txt-disabled">{comment.school}</span>
        )}
        <span className="text-[12px] text-txt-disabled ml-auto">{formatDate(comment.created_at)}</span>
      </div>

      {/* Content */}
      <p className="text-[14px] text-txt-primary leading-relaxed mb-3 break-keep pl-9 whitespace-pre-line">{comment.content}</p>

      {/* Actions */}
      <div className="flex items-center gap-1 pl-9">
        <button
          onClick={onVote}
          disabled={hasVoted}
          className={`flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-full transition-colors ${
            hasVoted
              ? 'bg-[#5E6AD2]/10 text-[#5E6AD2] cursor-default'
              : 'text-txt-tertiary hover:bg-white dark:hover:bg-[#2C2C2E] hover:text-[#5E6AD2]'
          }`}
        >
          <ThumbsUp size={12} className={hasVoted ? 'icon-bounce' : ''} />
          <span>도움됨{comment.helpful_count > 0 && ` ${comment.helpful_count}`}</span>
        </button>

        <button
          onClick={onReport}
          disabled={hasReported}
          className={`flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-full transition-colors ${
            hasReported
              ? 'text-status-danger-text cursor-default'
              : 'text-txt-disabled hover:bg-white dark:hover:bg-[#2C2C2E] hover:text-status-danger-text'
          }`}
        >
          <Flag size={11} />
          <span>{hasReported ? '신고됨' : '신고'}</span>
        </button>

        {canDelete && (
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-full text-txt-disabled hover:bg-white dark:hover:bg-[#2C2C2E] hover:text-status-danger-text transition-colors ml-auto"
          >
            <Trash2 size={11} />
            <span>삭제</span>
          </button>
        )}
      </div>
    </div>
  )
}
