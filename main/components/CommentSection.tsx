'use client'

import React, { useState, useEffect } from 'react'
import { MessageCircle, ThumbsUp, Flag, Send, Loader2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { useComments, Comment } from '@/src/hooks/useComments'
import { useAuth } from '@/src/context/AuthContext'
import { COMMENT_LABEL, COMMENT_VERB } from '@/src/constants/labels'
import { cleanNickname } from '@/src/lib/clean-nickname'

const INITIAL_VISIBLE = 5

interface CommentSectionProps {
  opportunityId: string
  onLoginClick?: () => void
}

export const CommentSection: React.FC<CommentSectionProps> = ({ opportunityId, onLoginClick }) => {
  const { user, profile } = useAuth()
  const { comments, loading, addComment, voteHelpful, reportComment } = useComments({
    opportunityId,
  })

  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [votedComments, setVotedComments] = useState<Set<string>>(new Set())
  const [reportedComments, setReportedComments] = useState<Set<string>>(new Set())
  const [showAll, setShowAll] = useState(false)

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
      toast.success('댓글이 등록되었습니다')
    } else {
      toast.error('댓글 등록에 실패했어요')
    }
    setSubmitting(false)
  }

  const handleVote = async (commentId: string) => {
    if (votedComments.has(commentId)) { toast('이미 평가한 댓글이에요'); return }

    const identifier = getVoterIdentifier()
    const success = await voteHelpful(commentId, identifier)

    if (success) {
      const newVoted = new Set(votedComments).add(commentId)
      setVotedComments(newVoted)
      localStorage.setItem(`voted_${opportunityId}`, JSON.stringify([...newVoted]))
      toast.success('도움이 됐어요!')
    }
  }

  const handleReport = async (commentId: string) => {
    if (reportedComments.has(commentId)) { toast('이미 신고한 댓글이에요'); return }

    const identifier = getVoterIdentifier()
    const success = await reportComment(commentId, identifier, 'inappropriate')

    if (success) {
      const newReported = new Set(reportedComments).add(commentId)
      setReportedComments(newReported)
      localStorage.setItem(`reported_${opportunityId}`, JSON.stringify([...newReported]))
      toast.success('신고가 접수되었습니다')
    } else {
      toast.error('신고 처리에 실패했어요')
    }
  }

  const visibleComments = showAll ? comments : comments.slice(0, INITIAL_VISIBLE)
  const hasMore = comments.length > INITIAL_VISIBLE

  return (
    <div className="bg-surface-card rounded-xl border border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h3 className="text-[0.625rem] font-medium text-txt-tertiary flex items-center gap-2">
          <MessageCircle size={14} />
          {COMMENT_LABEL} ({comments.length})
        </h3>
      </div>

      {/* Comment Form — login only */}
      {user && profile ? (
        <form onSubmit={handleSubmit} className="p-4 bg-surface-sunken border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-surface-inverse text-txt-inverse rounded-full flex items-center justify-center text-xs font-bold shrink-0">
              {cleanNickname(profile.nickname).charAt(0)}
            </div>
            <span className="text-sm font-medium text-txt-primary">{cleanNickname(profile.nickname)}</span>
            {profile.university && (
              <>
                <span className="text-border-strong">·</span>
                <span className="text-xs text-txt-disabled font-mono">{profile.university}</span>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={`${COMMENT_VERB}을 남겨주세요...`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm border border-border focus:outline-none focus:border-border bg-surface-card rounded-xl text-txt-primary placeholder-txt-disabled"
              maxLength={500}
            />
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="px-3 py-1.5 bg-surface-inverse text-txt-inverse border border-surface-inverse hover:bg-surface-inverse/90 transition-colors disabled:bg-surface-sunken disabled:text-txt-disabled disabled:border-border disabled:cursor-not-allowed flex items-center justify-center"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
        </form>
      ) : (
        <div className="p-5 bg-surface-sunken border-b border-border text-center">
          <p className="text-sm text-txt-tertiary mb-3">로그인하고 {COMMENT_VERB}을 남겨보세요</p>
          <button
            onClick={onLoginClick}
            className="inline-flex items-center gap-2 bg-surface-inverse text-txt-inverse px-5 py-2 text-xs font-bold border border-surface-inverse hover:bg-surface-inverse/90 transition-colors hover:opacity-90 active:scale-[0.97]"
          >
            로그인하기 <ArrowRight size={12} />
          </button>
        </div>
      )}

      {/* Comments List */}
      <div className="divide-y divide-border">
        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="animate-spin text-txt-disabled" size={24} />
          </div>
        ) : comments.length === 0 ? (
          <div className="p-8 text-center text-txt-disabled text-sm">
            아직 {COMMENT_LABEL}이 없습니다. 첫 번째 {COMMENT_VERB}을 남겨보세요!
          </div>
        ) : (
          <>
            {visibleComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                hasVoted={votedComments.has(comment.id)}
                hasReported={reportedComments.has(comment.id)}
                onVote={() => handleVote(comment.id)}
                onReport={() => handleReport(comment.id)}
              />
            ))}
            {hasMore && !showAll && (
              <button
                onClick={() => setShowAll(true)}
                className="w-full p-3 text-xs font-medium text-txt-tertiary hover:text-txt-primary hover:bg-surface-sunken transition-colors"
              >
                {COMMENT_LABEL} {comments.length - INITIAL_VISIBLE}개 더 보기
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

interface CommentItemProps {
  comment: Comment
  hasVoted: boolean
  hasReported: boolean
  onVote: () => void
  onReport: () => void
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  hasVoted,
  hasReported,
  onVote,
  onReport,
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
    <div className="p-4">
      {/* Author info */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 bg-surface-inverse text-txt-inverse rounded-full flex items-center justify-center text-[0.625rem] font-bold shrink-0">
          {cleanNickname(comment.nickname).charAt(0)}
        </div>
        <span className="font-bold text-sm text-txt-primary">{cleanNickname(comment.nickname)}</span>
        {comment.school && (
          <>
            <span className="text-border-strong">·</span>
            <span className="text-xs text-txt-disabled font-mono">{comment.school}</span>
          </>
        )}
        <span className="text-xs text-txt-disabled ml-auto">{formatDate(comment.created_at)}</span>
      </div>

      {/* Content */}
      <p className="text-sm text-txt-secondary leading-relaxed mb-3 break-keep pl-8">{comment.content}</p>

      {/* Actions */}
      <div className="flex items-center gap-4 pl-8">
        <button
          onClick={onVote}
          disabled={hasVoted}
          className={`flex items-center gap-1.5 text-xs transition-colors ${
            hasVoted
              ? 'text-brand font-bold cursor-default'
              : 'text-txt-disabled hover:text-brand'
          }`}
        >
          <ThumbsUp size={14} />
          <span>도움이 됐어요 {comment.helpful_count > 0 && `(${comment.helpful_count})`}</span>
        </button>

        <button
          onClick={onReport}
          disabled={hasReported}
          className={`flex items-center gap-1.5 text-xs transition-colors ${
            hasReported ? 'text-status-danger-text cursor-default' : 'text-txt-disabled hover:text-status-danger-text'
          }`}
        >
          <Flag size={12} />
          <span>{hasReported ? '신고됨' : '신고'}</span>
        </button>
      </div>
    </div>
  )
}
