# Draft Design System

Anthropic Design을 흑백 톤으로 재해석. 종이/잉크 + Noto Serif KR + Pretendard.

---

## Colors

### Surface

```css
:root {
  --color-canvas: #faf9f5;          /* 페이지 기본, 종이 톤 */
  --color-surface-soft: #f5f0e8;    /* 섹션 디바이더, 옅은 밴드 */
  --color-surface-card: #efe9de;    /* 카드 배경, 콘텐츠 카드 */
  --color-surface-strong: #e8e0d2;  /* 강조 카드, 선택 탭 */
  --color-hairline: #e6dfd8;        /* 1px border */
  --color-hairline-soft: #ebe6df;   /* 같은 밴드 내 디바이더 */
}
```

### Ink (Black)

```css
:root {
  --color-ink: #141413;             /* 헤딩, 본문 */
  --color-body-strong: #252523;     /* 강조 본문 */
  --color-body: #3d3d3a;            /* 본문 기본 */
  --color-muted: #6c6a64;           /* 서브헤딩, 보조 */
  --color-muted-soft: #8e8b82;      /* 캡션, 메타 */
  --color-disabled: #b8b5ac;        /* 비활성 */
}
```

### Dark Surface

```css
:root {
  --color-surface-dark: #181715;          /* 챗봇 패널, 다크 카드 */
  --color-surface-dark-elevated: #252320; /* 다크 위 카드 */
  --color-surface-dark-soft: #1f1e1b;     /* 다크 내 코드 블록 */
  --color-on-dark: #faf9f5;               /* 다크 위 본문 */
  --color-on-dark-soft: #a09d96;          /* 다크 위 보조 */
  --color-hairline-dark: #2e2c28;         /* 다크 내 디바이더 */
}
```

### Grayscale (브릿지)

```css
:root {
  --color-gray-50: #f7f5f0;
  --color-gray-100: #ede8df;
  --color-gray-200: #d9d4ca;
  --color-gray-300: #b8b5ac;
  --color-gray-400: #8e8b82;
  --color-gray-500: #6c6a64;
  --color-gray-600: #4f4d48;
  --color-gray-700: #3d3d3a;
  --color-gray-800: #252523;
  --color-gray-900: #141413;
}
```

### Status (절제된 흑백 변형)

```css
:root {
  --color-status-done: #141413;           /* 완료, 진한 잉크 */
  --color-status-pending: #6c6a64;        /* 진행, 회색 */
  --color-status-late: #141413;           /* 지연, 진한 잉크 + 패턴 */
  --color-status-empty: #e6dfd8;          /* 미시작, 옅은 톤 */
}
```

상태는 색 대신 **명도 + 기호**로 구분. `●` `◐` `✕` `○`.

---

## Typography

### Font Family

```css
:root {
  --font-display: "Noto Serif KR", "함초롬바탕", "Nanum Myeongjo",
                  Georgia, "Times New Roman", serif;
  --font-body: "Pretendard Variable", "Pretendard",
               -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", "D2Coding", ui-monospace,
               SFMono-Regular, Monaco, monospace;
}
```

**페어링 원칙**
- Display (헤딩): Noto Serif KR — 한국 공문서 명조 톤
- Body (본문, UI): Pretendard — 모던, 한글 가독성
- Mono (코드, 파일명): JetBrains Mono / D2Coding

### Scale

| Token | Size | Weight | Line | Tracking | Use |
|---|---|---|---|---|---|
| `--text-display-xl` | 56px | 400 | 1.1 | -1.5px | Serif | Hero |
| `--text-display-lg` | 40px | 400 | 1.15 | -1px | Serif | Page title |
| `--text-display-md` | 28px | 400 | 1.2 | -0.5px | Serif | Section |
| `--text-display-sm` | 22px | 400 | 1.3 | -0.3px | Serif | Sub-section |
| `--text-title-lg` | 18px | 600 | 1.4 | 0 | Sans | Card title |
| `--text-title-md` | 16px | 600 | 1.4 | 0 | Sans | List label |
| `--text-title-sm` | 14px | 600 | 1.4 | 0 | Sans | Small label |
| `--text-body-lg` | 16px | 400 | 1.7 | 0 | Sans | Body |
| `--text-body-md` | 15px | 400 | 1.7 | 0 | Sans | Default |
| `--text-body-sm` | 13px | 400 | 1.55 | 0 | Sans | Caption |
| `--text-caption` | 12px | 500 | 1.4 | 0 | Sans | Meta |
| `--text-caption-upper` | 11px | 600 | 1.4 | 1.5px | Sans | Badge |
| `--text-button` | 14px | 500 | 1.0 | 0 | Sans | Button |
| `--text-mono-md` | 13px | 400 | 1.55 | 0 | Mono | Filename |
| `--text-mono-sm` | 12px | 400 | 1.5 | 0 | Mono | Inline code |

```css
:root {
  --text-display-xl: 3.5rem;
  --text-display-lg: 2.5rem;
  --text-display-md: 1.75rem;
  --text-display-sm: 1.375rem;
  --text-title-lg: 1.125rem;
  --text-title-md: 1rem;
  --text-title-sm: 0.875rem;
  --text-body-lg: 1rem;
  --text-body-md: 0.9375rem;
  --text-body-sm: 0.8125rem;
  --text-caption: 0.75rem;
  --text-caption-upper: 0.6875rem;
  --text-button: 0.875rem;
  --text-mono-md: 0.8125rem;
  --text-mono-sm: 0.75rem;

  --line-display: 1.15;
  --line-heading: 1.4;
  --line-body: 1.7;

  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;

  --tracking-display: -0.02em;
  --tracking-tight: -0.01em;
  --tracking-wide: 0.1em;
}
```

### Rules

- Display는 항상 Noto Serif KR weight 400 (bold 금지)
- Display에 `letter-spacing: -0.02em` 필수 (없으면 어색함)
- Body는 항상 Pretendard, 본문 line-height 1.7
- 숫자 정렬 필요한 곳: `font-variant-numeric: tabular-nums`
- 파일명/코드: 항상 mono

---

## Spacing

```css
:root {
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.5rem;    /* 24px */
  --space-6: 2rem;      /* 32px */
  --space-7: 3rem;      /* 48px */
  --space-8: 4rem;      /* 64px */
  --space-section: 6rem; /* 96px */
}
```

8px base. 카드 내부 `--space-6` (32px), 섹션 간격 `--space-section` (96px, 마케팅 페이지용).

---

## Radius

```css
:root {
  --radius-xs: 0.25rem;   /* 4px, 작은 뱃지 */
  --radius-sm: 0.375rem;  /* 6px, 작은 버튼 */
  --radius-md: 0.5rem;    /* 8px, 버튼, 인풋 */
  --radius-lg: 0.75rem;   /* 12px, 카드 */
  --radius-xl: 1rem;      /* 16px, 큰 카드 */
  --radius-pill: 9999px;  /* 뱃지 pill */
  --radius-full: 9999px;  /* 원형 */
}
```

---

## Shadows

```css
:root {
  /* 잉크 색 기반, 컬러 글로우 없음 */
  --shadow-sm: 0 1px 2px 0 rgba(20, 20, 19, 0.04);
  --shadow-md: 0 2px 8px -2px rgba(20, 20, 19, 0.08),
               0 1px 3px 0 rgba(20, 20, 19, 0.04);
  --shadow-lg: 0 8px 24px -4px rgba(20, 20, 19, 0.12),
               0 2px 8px -2px rgba(20, 20, 19, 0.06);
  --shadow-hover: 0 4px 12px -2px rgba(20, 20, 19, 0.10),
                  0 2px 4px -1px rgba(20, 20, 19, 0.06);
}
```

**원칙**: 깊이는 color block (cream vs dark)으로, 그림자는 최소.

---

## Borders

```css
:root {
  --border-thin: 1px solid var(--color-hairline);
  --border-medium: 1px solid var(--color-gray-200);
  --border-strong: 1px solid var(--color-gray-300);
  --border-focus: 2px solid var(--color-ink);
  --border-dark: 1px solid var(--color-hairline-dark);
}
```

---

## Motion

```css
:root {
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);

  --duration-instant: 100ms;
  --duration-fast: 200ms;
  --duration-base: 300ms;
  --duration-slow: 500ms;
}
```

**원칙**: 200ms 이하 우선. 바운스/스프링 금지. `prefers-reduced-motion: reduce` 존중.

---

## Layout

```css
:root {
  --layout-chat-width: 24rem;       /* 384px */
  --layout-workspace-min: 48rem;    /* 768px */
  --layout-content-max: 75rem;      /* 1200px */
}
```

### Main Grid

```css
.app {
  display: grid;
  grid-template-columns: var(--layout-chat-width) 1fr;
  height: 100vh;
  background: var(--color-canvas);
}

.app__chat {
  background: var(--color-surface-dark);
  color: var(--color-on-dark);
  border-right: var(--border-dark);
}

.app__workspace {
  background: var(--color-canvas);
  color: var(--color-ink);
  overflow-y: auto;
  padding: var(--space-6);
}
```

**페이싱**: 좌측 dark (도구), 우측 cream (콘텐츠).

### Breakpoints

```css
:root {
  --bp-tablet: 768px;
  --bp-desktop: 1024px;
  --bp-wide: 1440px;
}
```

---

## Components

### Button

```css
.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  height: 2.5rem;
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: var(--text-button);
  font-weight: var(--weight-medium);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
  border: none;
}

.btn--primary {
  background: var(--color-ink);
  color: var(--color-canvas);
}
.btn--primary:active {
  background: var(--color-body);
}

.btn--secondary {
  background: var(--color-canvas);
  color: var(--color-ink);
  border: var(--border-thin);
}
.btn--secondary:active {
  background: var(--color-surface-soft);
}

.btn--on-dark {
  background: var(--color-surface-dark-elevated);
  color: var(--color-on-dark);
}

.btn--ghost {
  background: transparent;
  color: var(--color-muted);
}
.btn--ghost:active {
  background: var(--color-surface-soft);
  color: var(--color-ink);
}

.btn--icon-circle {
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  border-radius: var(--radius-full);
  background: var(--color-canvas);
  border: var(--border-thin);
  color: var(--color-ink);
  justify-content: center;
}
```

### Text Link

```css
.text-link {
  color: var(--color-ink);
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-thickness: 1px;
}
.text-link:active {
  color: var(--color-body);
}
```

### Input

```css
.input {
  width: 100%;
  height: 2.5rem;
  padding: var(--space-2) var(--space-4);
  background: var(--color-canvas);
  border: var(--border-thin);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: var(--text-body-md);
  color: var(--color-ink);
  transition: border-color var(--duration-fast) var(--ease-out);
}
.input:focus {
  outline: none;
  border-color: var(--color-ink);
  box-shadow: 0 0 0 3px rgba(20, 20, 19, 0.08);
}
.input::placeholder {
  color: var(--color-muted-soft);
}

.input--on-dark {
  background: var(--color-surface-dark-elevated);
  border: var(--border-dark);
  color: var(--color-on-dark);
}
.input--on-dark:focus {
  border-color: var(--color-on-dark);
  box-shadow: 0 0 0 3px rgba(250, 249, 245, 0.08);
}
```

### Card

```css
.card {
  background: var(--color-surface-card);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
}

.card--canvas {
  background: var(--color-canvas);
  border: var(--border-thin);
}

.card--dark {
  background: var(--color-surface-dark);
  color: var(--color-on-dark);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
}

.card--dark-elevated {
  background: var(--color-surface-dark-elevated);
}
```

### Folder Card

```css
.folder-card {
  background: var(--color-surface-card);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}
.folder-card:hover {
  background: var(--color-surface-strong);
  transform: translateY(-2px);
}
.folder-card__icon {
  font-size: 1.5rem;
  margin-bottom: auto;
  color: var(--color-muted);
}
.folder-card__name {
  font-family: var(--font-display);
  font-size: var(--text-display-sm);
  font-weight: var(--weight-regular);
  letter-spacing: var(--tracking-display);
  color: var(--color-ink);
  margin-bottom: var(--space-1);
}
.folder-card__meta {
  font-size: var(--text-body-sm);
  color: var(--color-muted);
}
```

### Progress Cell

```css
.progress-cell {
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  font-size: var(--text-body-sm);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.progress-cell--done {
  background: var(--color-ink);
  color: var(--color-canvas);
}
.progress-cell--pending {
  background: var(--color-gray-400);
  color: var(--color-canvas);
}
.progress-cell--late {
  background: var(--color-ink);
  color: var(--color-canvas);
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 4px,
    rgba(250, 249, 245, 0.15) 4px,
    rgba(250, 249, 245, 0.15) 8px
  );
}
.progress-cell--empty {
  background: var(--color-hairline);
  color: var(--color-muted-soft);
}

.progress-cell:hover {
  transform: scale(1.1);
}
```

### Tab

```css
.tabs {
  display: flex;
  gap: var(--space-5);
  border-bottom: var(--border-thin);
}
.tab {
  padding: var(--space-3) 0;
  margin-bottom: -1px;
  color: var(--color-muted);
  font-size: var(--text-body-md);
  font-weight: var(--weight-medium);
  border-bottom: 2px solid transparent;
  cursor: pointer;
  background: transparent;
  transition: color var(--duration-fast) var(--ease-out);
}
.tab:hover {
  color: var(--color-ink);
}
.tab--active {
  color: var(--color-ink);
  border-bottom-color: var(--color-ink);
}
```

### Chat Message

```css
.message {
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-body-md);
  line-height: var(--line-body);
  max-width: 90%;
}

.message--ai {
  color: var(--color-on-dark);
  border-left: 2px solid var(--color-on-dark);
  padding-left: var(--space-3);
}

.message--user {
  background: var(--color-surface-dark-elevated);
  color: var(--color-on-dark);
  border-radius: var(--radius-lg);
  margin-left: auto;
}
```

### Badge

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px var(--space-3);
  background: var(--color-surface-card);
  color: var(--color-ink);
  font-size: var(--text-caption);
  font-weight: var(--weight-medium);
  border-radius: var(--radius-pill);
}

.badge--upper {
  font-size: var(--text-caption-upper);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  font-weight: var(--weight-semibold);
}

.badge--ink {
  background: var(--color-ink);
  color: var(--color-canvas);
}
```

### Filename Tag

```css
.filename {
  font-family: var(--font-mono);
  font-size: var(--text-mono-md);
  color: var(--color-muted);
  background: var(--color-surface-soft);
  padding: 2px var(--space-2);
  border-radius: var(--radius-xs);
}
```

---

## Utility

```css
.tabular { font-variant-numeric: tabular-nums; }

.fade-in {
  animation: fadeIn var(--duration-fast) var(--ease-out);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Tailwind Config

```js
module.exports = {
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
          50:  'var(--color-gray-50)',
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
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
        mono: ['var(--font-mono)'],
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
    },
  },
};
```

---

## Font Loading

```html
<!-- Noto Serif KR -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;500&display=swap" rel="stylesheet">

<!-- Pretendard -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css">

<!-- JetBrains Mono -->
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```
