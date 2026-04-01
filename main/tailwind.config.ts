import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
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
        'container-wide': '90rem',
      },
      fontFamily: {
        sans: ['var(--font-noto-sans-kr)', '"Noto Sans KR"', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', '"JetBrains Mono"', 'monospace'],
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
        brand: {
          DEFAULT: 'var(--brand)',
          hover: 'var(--brand-hover)',
          bg: 'var(--brand-bg)',
          border: 'var(--brand-border)',
        },
        indicator: {
          online: 'var(--indicator-online)',
          premium: 'var(--indicator-premium)',
          'premium-border': 'var(--indicator-premium-border)',
          alert: 'var(--indicator-alert)',
          trending: 'var(--indicator-trending)',
        },
      },
      borderRadius: {
        none: '0px',
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-xl)',
        '3xl': 'var(--radius-xl)',
        full: '9999px',
      },
      boxShadow: {
        // Override Tailwind defaults → soft diffused shadows
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        '2xl': 'var(--shadow-xl)',
        // Legacy aliases — now map to soft equivalents
        soft: 'var(--shadow-sm)',
        sharp: 'var(--shadow-md)',
        brutal: 'var(--shadow-lg)',
        'brutal-xl': 'var(--shadow-xl)',
        solid: 'var(--shadow-solid)',
        'solid-sm': 'var(--shadow-solid-sm)',
        none: 'none',
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
        'modal-in': 'modalIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'backdrop-in': 'backdropIn 0.2s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'page-enter': 'pageEnter 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        shimmer: 'shimmer 1.5s ease-in-out infinite',
        'stagger-in': 'staggerFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'badge-pop': 'badgePop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
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
        modalIn: {
          '0%': { opacity: '0', transform: 'scale(0.95) translateY(20px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        backdropIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pageEnter: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        staggerFadeIn: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        badgePop: {
          '0%': { opacity: '0', transform: 'scale(0.4) translateY(-6px)' },
          '60%': { opacity: '1', transform: 'scale(1.18) translateY(0)' },
          '80%': { transform: 'scale(0.94)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
