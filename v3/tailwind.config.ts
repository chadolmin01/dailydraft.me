import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // v2 design.md 토큰 일부 차용 — 행정 톤 미니멀.
        ink: '#111827',
        muted: '#6B7280',
        'muted-soft': '#9CA3AF',
        hairline: '#E5E7EB',
        surface: '#F9FAFB',
        primary: '#1D4ED8',
      },
      borderRadius: {
        xl: '14px',
        '2xl': '20px',
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
