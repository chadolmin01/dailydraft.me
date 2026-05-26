'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

// 의도: recharts 는 client component 만. 서버 컴포넌트에서 data prop 전달.

export function TeamProgressBar({ data }: { data: Array<{ team: string; pct: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
        <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} stroke="#9CA3AF" fontSize={11} />
        <YAxis type="category" dataKey="team" width={80} stroke="#6B7280" fontSize={12} />
        <Tooltip formatter={(v: number) => `${v}%`} cursor={{ fill: '#F3F4F6' }} />
        <Bar dataKey="pct" radius={[0, 6, 6, 0]}>
          {data.map((d) => (
            <Cell key={d.team} fill={d.pct >= 80 ? '#10B981' : d.pct >= 40 ? '#3B82F6' : '#EF4444'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
