# Meta App Review 데모 영상 파이프라인

Draft x Threads 연동 기능을 Meta App Review 에 제출하기 위한 데모 영상 자동 생성 파이프라인입니다.

## 최종 산출물

- `scripts/demo/out/draft-threads-demo.mp4` — 3~4분, 1080p 30fps, 한국어 자막 burn-in.
- `scripts/demo/out/draft-threads-demo.en.srt` — 영문 자막 (external track, Meta 업로드 시 함께 제출).

## 구성

| 파일 | 역할 |
|------|------|
| `record.config.ts` | Playwright 설정 (1920x1080 headed, video: on, slowMo) |
| `record.spec.ts` | 4개 part 로 분리된 녹화 스펙 (intro / connect / publish / verify) |
| `subtitles.ts` | 한국어(합쇼체) + 영어 SRT 생성기 (23 큐) |
| `stitch.mjs` | ffmpeg 기반 합성 (타이틀 카드 + webm->mp4 + concat + 자막 burn-in) |

## 사전 요구사항

1. **ffmpeg** — PATH 에 등록 필수.
   - Windows: `winget install ffmpeg` 또는 https://ffmpeg.org/download.html
   - 확인: `ffmpeg -version`
2. **Playwright 브라우저** — `pnpm demo:install` 한 번 실행.
3. **tsx** — `subtitles.ts` 실행용. devDependency 에 없으므로 설치 필요합니다.
   ```bash
   pnpm add -D tsx
   ```
4. **테스트 계정** — Meta App Dashboard 에서 Threads Tester 로 등록된 계정.
5. **테스트 클럽 페르소나** — 페르소나 경로(`/clubs/<slug>/settings/persona`) 에 접근 가능한 상태.

## 환경변수

`scripts/demo/.env.demo` (gitignore 됨) 를 만들어 아래 값을 채워주십시오.

```env
DEMO_USER_EMAIL=your-tester@example.com
DEMO_USER_PASSWORD=your-test-password
DEMO_PERSONA_PATH=/clubs/your-club-slug/settings/persona
DEMO_BASE_URL=http://localhost:3000
```

Playwright 에 주입할 때는 해당 env 파일을 수동으로 로드해 주십시오.

```bash
# bash
set -a; source scripts/demo/.env.demo; set +a
pnpm demo:record
```

```powershell
# powershell
Get-Content scripts/demo/.env.demo | ForEach-Object {
  if ($_ -match '^\s*([^=#]+?)\s*=\s*(.*)$') { $env:$($matches[1]) = $matches[2] }
}
pnpm demo:record
```

## 실행 순서

```bash
# 0. (최초 1회) Chromium 설치
pnpm demo:install

# 1. 개발 서버 실행 — 별도 터미널
pnpm dev

# 2. Playwright 자동 녹화 (part 1~4)
pnpm demo:record
#    → scripts/demo/tmp/<test-name>/video.webm 생성

# 3. (선택) OAuth 수동 클립 녹화
#    Meta OAuth 동의 화면은 자동화로 건드리면 안 되므로,
#    OBS/QuickTime 등으로 동의 플로우를 직접 녹화한 뒤
#    scripts/demo/tmp/oauth-manual.mp4 로 저장해 주십시오.
#    없으면 3초 placeholder 카드가 자동 삽입됩니다.

# 4. 자막 생성
pnpm demo:subs
#    → scripts/demo/out/draft-threads-demo.ko.srt
#    → scripts/demo/out/draft-threads-demo.en.srt

# 5. ffmpeg 합성
pnpm demo:stitch
#    → scripts/demo/out/draft-threads-demo.mp4

# 6. 단축 실행
pnpm demo:all
```

## 영상 구조

| 구간 | 시간 | 파일 | 내용 |
|------|------|------|------|
| 타이틀 카드 | 0:00 – 0:03 | stitch.mjs 생성 | "Draft x Threads API Demo" |
| Part 1 intro | 0:03 – 0:33 | record.spec.ts | 랜딩 -> 로그인 -> 대시보드 |
| Part 2 connect | 0:33 – 0:53 | record.spec.ts | 페르소나 -> Threads 연결 버튼 hover |
| OAuth 수동 클립 | 0:53 – 1:03 | oauth-manual.mp4 | Meta 동의 화면 (placeholder 가능) |
| Part 3 publish | 1:03 – 2:03 | record.spec.ts | AI 초안 -> 유저 검토 -> 발행 승인 |
| Part 4 verify | 2:03 – 2:23 | record.spec.ts | 결과 확인 -> 데이터 삭제 페이지 |

총 약 2분 20초. 내레이션/보조 슬라이드 추가 시 3~4분 타겟 맞추시면 됩니다.

## 자주 실패하는 이슈

### Viewport 가 1920x1080 이 아닙니다
- Chromium 실행 옵션에 `--force-device-scale-factor=1` 이 들어가 있는지 확인해 주십시오. (config 에 이미 포함)
- 고해상도 디스플레이(2K/4K/Retina) 에서 테스트 시 `DPI scaling` 이 OS 수준에서 100% 인지 확인이 필요합니다.

### 자막 burn-in 시 한글이 깨집니다
- ffmpeg `subtitles` 필터가 시스템 기본 폰트를 찾지 못하는 경우입니다.
- Windows: `C:\Windows\Fonts` 에 맑은 고딕(`malgun.ttf`) 이 있는지 확인 후,
  필요 시 `stitch.mjs` 의 `style` 에 `FontName=Malgun Gothic` 을 추가해 주십시오.

### Playwright timeout
- 페르소나 페이지가 로그인 후 redirect 체인을 타는 경우, `PERSONA_PATH` 가 올바른지 재확인해 주십시오.
- `signIn()` 후 `waitForURL(/\/(dashboard|onboarding)/)` 이 실패하면 테스트 계정이 온보딩을 먼저 마쳐야 합니다.

### ffmpeg 가 concat 에서 멈춥니다
- 각 segment 의 codec/해상도/FPS 가 다르면 stream copy 가 실패합니다.
- `stitch.mjs` 의 `normalizeToMp4()` 를 거친 파일만 concat list 에 들어가는지 확인해 주십시오.

### OAuth 동의 화면 녹화
- Meta 정책상 consent screen 은 자동화 금지. 반드시 수동 녹화해 주십시오.
- 권장 툴: OBS Studio (Windows), QuickTime (macOS).
- 10초 내외로 짧게, 화면 전체(1920x1080) 로 녹화 후 `scripts/demo/tmp/oauth-manual.mp4` 에 저장.

## 제출 체크리스트

- [ ] `draft-threads-demo.mp4` 재생 시간 3~4분 구간인지
- [ ] OAuth consent 화면이 영상에 포함되었는지 (수동 클립)
- [ ] 유저 승인 단계가 명확히 보이는지 (part 3 발행 버튼)
- [ ] 데이터 삭제 경로가 영상에 나오는지 (part 4 `/legal/data-deletion`)
- [ ] 한국어 자막이 burn-in 되어 있는지
- [ ] 영문 `.en.srt` 를 Meta 업로드 폼에 함께 첨부했는지
- [ ] 영상 내 개인정보/실명/실제 토큰이 노출되지 않았는지
