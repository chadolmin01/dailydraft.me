import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans KR"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Nanum Gothic Coding"', 'monospace'],
      },
      colors: {
        draft: {
          black: '#222222',
          gray: '#666666',
          light: '#F4F4F5',
          paper: '#FFFFFF',
          blue: '#0052CC',
          accent: '#FF4D4D',
        },
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
