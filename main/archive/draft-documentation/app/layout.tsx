import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/src/context/AuthContext'

export const metadata: Metadata = {
  title: '사업계획서 생성기 - Draft Documentation',
  description: '정부지원 창업패키지 사업계획서를 쉽고 빠르게 작성하세요',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-white antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
