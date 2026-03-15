'use client'

import React, { useState, useEffect } from 'react'
import { MessageCircle, ThumbsUp, Flag, Send, Loader2 } from 'lucide-react'
import { useComments, Comment } from '@/src/hooks/useComments'
import { COMMENT_LABEL, COMMENT_VERB } from '@/src/constants/labels'

// CEREAL 5 schools + others
const SCHOOLS = [
  '고려대학교',
  '연세대학교',
  '서울대학교',
  '성균관대학교',
  '한양대학교',
  '카이스트',
  '포스텍',
  '기타',
]

interface CommentSectionProps {
  opportunityId: string
}

export const CommentSection: React.FC<CommentSectionProps> = ({ opportunityId }) => {
  const { comments, loading, addComment, voteHelpful, reportComment } = useComments({
    opportunityId,
  })

  const [nickname, setNickname] = useState('')
  const [school, setSchool] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [votedComments, setVotedComments] = useState<Set<string>>(new Set())
  const [reportedComments, setReportedComments] = useState<Set<string>>(new Set())

  // Load voted/reported state from localStorage
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

  // Generate unique voter identifier
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
    if (!nickname.trim() || !content.trim()) return

    setSubmitting(true)
    const success = await addComment({
      nickname: nickname.trim(),
      school: school || undefined,
      content: content.trim(),
    })

    if (success) {
      setContent('')
    }
    setSubmitting(false)
  }

  const handleVote = async (commentId: string) => {
    if (votedComments.has(commentId)) return

    const identifier = getVoterIdentifier()
    const success = await voteHelpful(commentId, identifier)

    if (success) {
      const newVoted = new Set(votedComments).add(commentId)
      setVotedComments(newVoted)
      localStorage.setItem(`voted_${opportunityId}`, JSON.stringify([...newVoted]))
    }
  }

  const handleReport = async (commentId: string) => {
    if (reportedComments.has(commentId)) return

    const identifier = getVoterIdentifier()
    const success = await reportComment(commentId, identifier, 'inappropriate')

    if (success) {
      const newReported = new Set(reportedComments).add(commentId)
      setReportedComments(newReported)
      localStorage.setItem(`reported_${opportunityId}`, JSON.stringify([...newReported]))
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <MessageCircle size={18} />
          {COMMENT_LABEL} ({comments.length})
        </h3>
      </div>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="p-4 bg-gray-50 border-b border-gray-100">
        <div className="flex gap-3 mb-3">
          <input
            type="text"
            placeholder="닉네임"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-sm focus:outline-none focus:border-black"
            maxLength={20}
          />
          <select
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-sm focus:outline-none focus:border-black bg-white"
          >
            <option value="">학교 선택 (선택)</option>
            {SCHOOLS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <textarea
            placeholder={`${COMMENT_VERB}를 남겨주세요...`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-sm focus:outline-none focus:border-black resize-none"
            rows={2}
            maxLength={500}
          />
          <button
            type="submit"
            disabled={submitting || !nickname.trim() || !content.trim()}
            className="px-4 bg-black text-white rounded-sm hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="divide-y divide-gray-100">
        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="animate-spin text-gray-400" size={24} />
          </div>
        ) : comments.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            아직 {COMMENT_LABEL}이 없습니다. 첫 번째 {COMMENT_VERB}를 남겨보세요!
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              hasVoted={votedComments.has(comment.id)}
              hasReported={reportedComments.has(comment.id)}
              onVote={() => handleVote(comment.id)}
              onReport={() => handleReport(comment.id)}
            />
          ))
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
        <span className="font-bold text-sm text-gray-900">{comment.nickname}</span>
        {comment.school && (
          <>
            <span className="text-gray-300">|</span>
            <span className="text-xs text-gray-500 font-mono">{comment.school}</span>
          </>
        )}
        <span className="text-xs text-gray-400 ml-auto">{formatDate(comment.created_at)}</span>
      </div>

      {/* Content */}
      <p className="text-sm text-gray-700 leading-relaxed mb-3 break-keep">{comment.content}</p>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={onVote}
          disabled={hasVoted}
          className={`flex items-center gap-1.5 text-xs transition-colors ${
            hasVoted
              ? 'text-indigo-600 font-bold cursor-default'
              : 'text-gray-400 hover:text-indigo-600'
          }`}
        >
          <ThumbsUp size={14} />
          <span>도움이 됐어요 {comment.helpful_count > 0 && `(${comment.helpful_count})`}</span>
        </button>

        <button
          onClick={onReport}
          disabled={hasReported}
          className={`flex items-center gap-1.5 text-xs transition-colors ${
            hasReported ? 'text-red-400 cursor-default' : 'text-gray-300 hover:text-red-500'
          }`}
        >
          <Flag size={12} />
          <span>{hasReported ? '신고됨' : '신고'}</span>
        </button>
      </div>
    </div>
  )
}
