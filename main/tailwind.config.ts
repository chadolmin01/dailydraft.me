import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      zIndex: {
        dropdown: '100',
        sticky: '200',
        fixed: '300',
        'modal-backdrop': '400',
        modal: '401',
        popover: '500',
        tooltip: '600',
      },
      maxWidth: {
        'container-narrow': '48rem',
        'container-standard': '72rem',
        'container-wide': '82rem',
      },
      fontFamily: {
        sans: ['"Noto Sans KR"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Nanum Gothic Coding"', 'monospace'],
      },
      colors: {
        // ── Design System Tokens ──
        surface: {
          bg: 'var(--surface-bg)',
          card: 'var(--surface-card)',
          elevated: 'var(--surface-elevated)',
          sunken: 'var(--surface-sunken)',
          inverse: 'var(--surface-inverse)',
        },
        txt: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          disabled: 'var(--text-disabled)',
          inverse: 'var(--text-inverse)',
        },
        border: {
          DEFAULT: 'var(--border-default)',
          strong: 'var(--border-strong)',
          subtle: 'var(--border-subtle)',
        },
        accent: {
          DEFAULT: 'var(--accent-primary)',
          hover: 'var(--accent-primary-hover)',
          secondary: 'var(--accent-secondary)',
          'secondary-hover': 'var(--accent-secondary-hover)',
        },
        status: {
          'success-bg': 'var(--status-success-bg)',
          'success-text': 'var(--status-success-text)',
          'warning-bg': 'var(--status-warning-bg)',
          'warning-text': 'var(--status-warning-text)',
          'danger-bg': 'var(--status-danger-bg)',
          'danger-text': 'var(--status-danger-text)',
          'info-bg': 'var(--status-info-bg)',
          'info-text': 'var(--status-info-text)',
          'neutral-bg': 'var(--status-neutral-bg)',
          'neutral-text': 'var(--status-neutral-text)',
          'danger-accent': 'var(--status-danger-accent)',
        },
        tag: {
          'default-bg': 'var(--tag-default-bg)',
          'default-text': 'var(--tag-default-text)',
          'strong-bg': 'var(--tag-strong-bg)',
          'strong-text': 'var(--tag-strong-text)',
        },
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        soft: '0 2px 8px rgba(0,0,0,0.05)',
        sharp: '2px 2px 0px 0px rgba(0,0,0,0.1)',
      },
      animation: {
        marquee: 'marquee 30s linear infinite',
        'marquee-vertical-up': 'marqueeUp 40s linear infinite',
        'marquee-vertical-down': 'marqueeDown 40s linear infinite',
        'scan-line': 'scanline 2s ease-in-out forwards',
        blink: 'blink 1s step-end infinite',
        'slide-up-fade': 'slideUpFade 1s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        float: 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out infinite 2s',
        'float-slow': 'float 8s ease-in-out infinite 1s',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        marqueeUp: {
          '0%': { transform: 'translateY(0%)' },
          '100%': { transform: 'translateY(-50%)' },
        },
        marqueeDown: {
          '0%': { transform: 'translateY(-50%)' },
          '100%': { transform: 'translateY(0%)' },
        },
        scanline: {
          '0%': { top: '0%', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { top: '100%', opacity: '0' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        slideUpFade: {
          '0%': { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
