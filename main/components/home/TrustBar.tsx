import React from 'react'

const universities = [
  '연세대', '서강대', '이화여대', '중앙대', '경희대',
  '건국대', '한국외대', '시립대', '동국대',
]

export const TrustBar: React.FC = () => {
  return (
    <section className="py-6 border-y border-border">
      <p className="text-center text-sm text-txt-secondary tracking-tight">
        <span className="font-semibold text-txt-primary">{universities.join(' · ')}</span>
        <span className="ml-2">학생들이 참여하고 있습니다</span>
      </p>
    </section>
  )
}
