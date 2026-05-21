import type { Config } from 'tailwindcss'

// V2 Tailwind config — design.md 토큰을 매핑.
// design.md 가 단일 진실 소스. 새 토큰 추가 시 design.md 먼저 수정 후 여기 반영.

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--color-canvas)',
        surface: {
          soft: 'var(--color-surface-soft)',
          card: 'var(--color-surface-card)',
          strong: 'var(--color-surface-strong)',
          dark: 'var(--color-surface-dark)',
          'dark-elevated': 'var(--color-surface-dark-elevated)',
          'dark-soft': 'var(--color-surface-dark-soft)',
        },
        ink: 'var(--color-ink)',
        body: {
          DEFAULT: 'var(--color-body)',
          strong: 'var(--color-body-strong)',
        },
        muted: {
          DEFAULT: 'var(--color-muted)',
          soft: 'var(--color-muted-soft)',
        },
        hairline: {
          DEFAULT: 'var(--color-hairline)',
          soft: 'var(--color-hairline-soft)',
          dark: 'var(--color-hairline-dark)',
        },
        gray: {
          50: 'var(--color-gray-50)',
          100: 'var(--color-gray-100)',
          200: 'var(--color-gray-200)',
          300: 'var(--color-gray-300)',
          400: 'var(--color-gray-400)',
          500: 'var(--color-gray-500)',
          600: 'var(--color-gray-600)',
          700: 'var(--color-gray-700)',
          800: 'var(--color-gray-800)',
          900: 'var(--color-gray-900)',
        },
        'on-dark': {
          DEFAULT: 'var(--color-on-dark)',
          soft: 'var(--color-on-dark-soft)',
        },
        disabled: 'var(--color-disabled)',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
        mono: ['var(--font-mono)'],
      },
      fontSize: {
        'display-xl': ['var(--text-display-xl)', { lineHeight: 'var(--line-display)', letterSpacing: 'var(--tracking-display)' }],
        'display-lg': ['var(--text-display-lg)', { lineHeight: 'var(--line-display)', letterSpacing: 'var(--tracking-display)' }],
        'display-md': ['var(--text-display-md)', { lineHeight: 'var(--line-display)', letterSpacing: 'var(--tracking-display)' }],
        'display-sm': ['var(--text-display-sm)', { lineHeight: 'var(--line-display)', letterSpacing: 'var(--tracking-display)' }],
        'title-lg': ['var(--text-title-lg)', { lineHeight: 'var(--line-heading)' }],
        'title-md': ['var(--text-title-md)', { lineHeight: 'var(--line-heading)' }],
        'title-sm': ['var(--text-title-sm)', { lineHeight: 'var(--line-heading)' }],
        'body-lg': ['var(--text-body-lg)', { lineHeight: 'var(--line-body)' }],
        'body-md': ['var(--text-body-md)', { lineHeight: 'var(--line-body)' }],
        'body-sm': ['var(--text-body-sm)', { lineHeight: 'var(--line-body)' }],
        caption: ['var(--text-caption)', { lineHeight: 'var(--line-heading)' }],
        'caption-upper': ['var(--text-caption-upper)', { lineHeight: 'var(--line-heading)', letterSpacing: 'var(--tracking-wide)' }],
        button: ['var(--text-button)', { lineHeight: '1' }],
        'mono-md': ['var(--text-mono-md)', { lineHeight: 'var(--line-body)' }],
        'mono-sm': ['var(--text-mono-sm)', { lineHeight: 'var(--line-body)' }],
      },
      fontWeight: {
        regular: 'var(--weight-regular)',
        medium: 'var(--weight-medium)',
        semibold: 'var(--weight-semibold)',
      },
      letterSpacing: {
        display: 'var(--tracking-display)',
        tight: 'var(--tracking-tight)',
        wide: 'var(--tracking-wide)',
      },
      spacing: {
        section: 'var(--space-section)',
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        pill: 'var(--radius-pill)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        hover: 'var(--shadow-hover)',
      },
      transitionTimingFunction: {
        out: 'var(--ease-out)',
        'in-out': 'var(--ease-in-out)',
      },
      transitionDuration: {
        instant: 'var(--duration-instant)',
        fast: 'var(--duration-fast)',
        base: 'var(--duration-base)',
        slow: 'var(--duration-slow)',
      },
      maxWidth: {
        'layout-chat': 'var(--layout-chat-width)',
        'layout-workspace': 'var(--layout-workspace-min)',
        'layout-content': 'var(--layout-content-max)',
      },
    },
  },
  plugins: [],
}

export default config
