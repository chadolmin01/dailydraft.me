# 개인정보처리방침 체크리스트 (Meta App Review 대응)

Meta는 앱 리뷰 시 **공개 접근 가능한 개인정보처리방침 URL**과 **데이터 삭제 안내 URL** 을 심사 항목으로 확인합니다. 이 문서는:

1. Meta가 반드시 확인하는 필수 항목을 체크리스트 형태로 정리하고
2. Draft 코드베이스의 현재 상태를 실측하여 "작성 필요/보강 필요/완료" 로 분류합니다.

도메인: https://dailydraft.me

---

## 현재 Draft 상태 감사 결과

**중요**: 2026-04-21 기준 코드베이스 실측 결과, 아래 파일들이 **존재하지 않습니다**. App Review 제출 전 생성이 필수입니다.

| 필요 페이지 | 예상 경로 | 현재 상태 |
|-------------|-----------|----------|
| 개인정보처리방침 | `app/legal/privacy/page.tsx` | **미존재 — 신규 작성 필요** |
| 이용약관 | `app/legal/terms/page.tsx` | **미존재 — 신규 작성 필요** |
| 데이터 삭제 안내 | `app/legal/data-deletion/page.tsx` | **미존재 — 신규 작성 필요** |

확인 방법: `ls app/legal/` 또는 `Glob "app/**/privacy*"` 실행 시 `No files found` 반환됨. `app/` 디렉토리 구조상 legal 서브디렉토리 자체가 존재하지 않음.

**Meta 제출 전 선행 작업**:
1. `app/legal/privacy/page.tsx` 작성 (아래 7개 필수 항목 모두 포함)
2. `app/legal/terms/page.tsx` 작성
3. `app/legal/data-deletion/page.tsx` 작성 (Meta 심사 시 별도 URL 제출란 있음)
4. 프로덕션 배포 후 3개 URL 모두 공개 접근 가능 확인
5. 로그인 없이 접근 가능해야 함 (Meta 심사 중 익명 접근)

---

## Meta App Review 필수 항목 체크리스트

### 항목 1. 수집 데이터 목록 (What data is collected)

**Meta 요구사항**: Threads API를 통해 어떤 데이터를 수집·저장하는지 명시.

**Draft 기준 문구** (개인정보처리방침 본문에 포함할 내용):

```
Threads 계정 연동 시 Draft가 수집·저장하는 정보:
- Threads 사용자 ID (user_id)
- Threads 사용자명 (username)
- OAuth 액세스 토큰 (AES-256-GCM으로 암호화하여 저장)
- 토큰 발급 scope: threads_basic, threads_content_publish
- 토큰 만료 시각 (expires_at, 보통 발급 후 60일)

수집하지 않는 정보:
- 기존 게시물, 팔로워/팔로잉 목록, DM, 피드 콘텐츠
- 다른 Threads 사용자의 정보
- 기기 식별자 등 Threads API가 반환하지 않는 임의 정보
```

- [ ] 위 내용이 privacy policy 본문에 포함되어 있는가?

### 항목 2. 수집 목적 (Purpose of data collection)

**Meta 요구사항**: 각 데이터가 왜 필요한지 구체적으로 명시. 일반적 문구("서비스 제공을 위해") 만으로는 부족.

**Draft 기준 문구**:

```
Threads API로 수집한 정보는 오직 다음 목적에만 사용됩니다:
1. user_id — 운영진이 승인한 콘텐츠를 올바른 계정에 게시하기 위한 식별자
2. username — Draft UI에 "연결된 계정: @username" 으로 표시하여 운영진이 올바른 계정인지 확인하기 위함
3. 액세스 토큰 — 운영진이 Draft 안에서 명시적으로 승인한 텍스트 콘텐츠를 Threads Graph API로 게시하기 위함

수집된 정보는 광고, 프로파일링, 제3자 분석에 사용되지 않습니다.
```

- [ ] 각 필드별 목적이 1대1로 매칭되어 명시되어 있는가?

### 항목 3. 제3자 공유 (Third-party sharing)

**Meta 요구사항**: Meta Platform Data (Threads/Instagram/Facebook API로 받은 데이터)가 제3자와 공유되지 않음을 명시. 공유되는 경우 대상과 범위를 모두 열거.

**Draft 기준 문구**:

```
본 서비스는 Threads API에서 수집한 어떠한 데이터도 제3자에게 판매·공유·양도하지 않습니다.
또한 Meta Platform Data를 다른 통합(LinkedIn, Discord 등)에서 수집한 데이터와 결합하지 않습니다.

예외 없음. 법령에 의한 제공 요구 시에도 해당 사실을 공지합니다.

하위 처리자 (Subprocessors):
- Supabase (데이터베이스 호스팅, 미국/유럽 리전) — 암호화된 저장소 제공자로서의 역할만 수행
- Vercel (애플리케이션 호스팅) — 요청 라우팅 및 서버리스 실행만 수행
위 하위 처리자들은 Meta Platform Data에 대한 독립적 접근·분석 권한이 없습니다.
```

- [ ] 제3자 공유가 "없음" 또는 "명시된 하위 처리자만" 으로 정확히 기재되어 있는가?
- [ ] 하위 처리자 명단(Supabase, Vercel 등)이 이용약관 또는 privacy policy에 열거되어 있는가?

### 항목 4. 보관 기간 (Retention period)

**Meta 요구사항**: 데이터 보관 기간과 삭제 조건 명시.

**Draft 기준 문구**:

```
Threads 관련 데이터의 보관 기간:
- 액세스 토큰: 발급 시점부터 60일 (Meta가 발급하는 long-lived token 수명). 만료 시 자동 무효화.
- 운영진이 "연결 해제" 를 누르면 해당 크레덴셜 행을 DB에서 즉시 완전 삭제 (hard delete).
- 이용자가 Draft 계정을 탈퇴하면 관련 크레덴셜이 cascade로 삭제됨.
- Draft가 Threads에 발행한 콘텐츠 기록(게시 ID, 게시 시각, 본문 복사본)은 운영진 요청 전까지 보관.
```

- [ ] 토큰 보관 기간 (60일)이 명시되어 있는가?
- [ ] 연결 해제 시 즉시 삭제 원칙이 명시되어 있는가?

### 항목 5. 삭제 요청 경로 (Deletion request path)

**Meta 요구사항**: 이용자가 자신의 데이터 삭제를 요청할 수 있는 명확한 경로. Meta는 App Review 시 별도의 "Data Deletion Instructions URL" 을 요구하며, 이 URL이 공개 접근 가능해야 함.

**Draft 기준 문구** (data-deletion 페이지 본문에 포함):

```
Draft에서 데이터 삭제 방법:

방법 1. SNS 연결만 해제 (Threads 토큰만 삭제)
  1. https://dailydraft.me 로그인
  2. 동아리 선택 → 설정 → 페르소나 → Threads 카드 → "연결 해제"
  3. 즉시 저장된 액세스 토큰과 계정 참조가 DB에서 완전 삭제됩니다.

방법 2. Draft 계정 전체 삭제
  1. https://dailydraft.me/settings/account → "계정 삭제" 버튼
  2. 확인 절차 완료 시 모든 개인정보·크레덴셜이 cascade 삭제됩니다.

방법 3. 이메일 요청
  privacy@dailydraft.me 로 계정 이메일과 함께 삭제 요청을 보내주세요.
  영업일 기준 7일 이내 처리되며, 처리 완료 후 확인 메일을 드립니다.

방법 4. 본인 계정이 없어진 경우
  예: Draft 미가입 상태에서 누군가 본인의 Threads 계정을 Draft에 연결했다는 사실을 알게 된 경우 — privacy@dailydraft.me 로 Threads 사용자명과 상황을 알려주시면 확인 후 삭제합니다.
```

- [ ] 3가지 이상의 삭제 경로(UI, 이메일, 미가입 사용자용)가 모두 제공되는가?
- [ ] 이 페이지가 로그인 없이 접근 가능한가?
- [ ] Meta가 요구하는 "Data Deletion Instructions URL" 을 Meta 앱 설정에 등록했는가?

### 항목 6. 연락처 (Contact)

**Meta 요구사항**: 데이터 관련 문의 가능한 이메일 주소 또는 담당자 연락처.

**Draft 기준 문구**:

```
개인정보 관련 문의:
이메일: privacy@dailydraft.me
일반 지원: support@dailydraft.me
처리 기한: 영업일 기준 7일 이내 답변
```

- [ ] `privacy@dailydraft.me` 메일박스가 실제로 작동하는가? (자동 응답 포함)
- [ ] 연락처가 privacy policy 본문과 data-deletion 페이지 양쪽에 모두 표시되어 있는가?

### 항목 7. Meta 관련 특례 (Meta-specific clauses)

**Meta 요구사항**: 앱 리뷰 정책은 특히 아래 조항을 별도 섹션으로 분리하여 명시할 것을 권장합니다. 일반 privacy policy 문구에 묻히지 않도록 주의.

**Draft 기준 문구** (privacy policy 하단에 별도 섹션):

```
## Meta 플랫폼 데이터에 관한 고지

Draft는 Meta Platforms, Inc.의 Threads API를 통합합니다. 본 조항은 Threads API를 통해 수집되는 데이터에만 적용됩니다.

1. 수집 범위: 본 고지의 "수집 데이터 목록" 섹션에 명시된 항목에 한함.
2. 사용 제한: 수집된 데이터는 (i) 이용자가 Draft 안에서 명시적으로 승인한 콘텐츠를 이용자 본인의 Threads 계정에 게시하는 용도, 그리고 (ii) 연결된 계정을 UI에 표시하는 용도로만 사용됩니다.
3. 자동 발행 없음: 이용자의 명시적 승인 없이 콘텐츠가 Threads에 게시되지 않습니다.
4. 데이터 삭제: 이용자는 언제든지 페르소나 설정 > Threads 카드 > 연결 해제로 토큰을 즉시 삭제할 수 있습니다. 또한 privacy@dailydraft.me 로 계정 단위 전체 삭제를 요청할 수 있습니다.
5. 제3자 비공유: Meta Platform Data는 제3자에게 판매·공유·양도되지 않으며, 다른 통합 데이터와 결합되지 않습니다.
6. 보안 조치: 모든 액세스 토큰은 AES-256-GCM으로 저장 시 암호화되며, 평문 토큰은 브라우저·로그·백업 어디에도 기록되지 않습니다.
7. Meta 정책 준수: 본 서비스는 Meta Platform Terms (https://developers.facebook.com/terms/) 및 Developer Policies (https://developers.facebook.com/devpolicy/) 를 준수합니다.

문의: privacy@dailydraft.me
```

- [ ] 별도 섹션("Meta 플랫폼 데이터에 관한 고지")이 privacy policy에 포함되어 있는가?
- [ ] Meta Platform Terms 링크가 실제 URL로 연결되어 있는가?

---

## Meta 제출 시 입력할 URL 요약

| 항목 | URL | 공개 접근 필수 |
|------|-----|----------------|
| Privacy Policy URL | https://dailydraft.me/legal/privacy | 예 |
| Terms of Service URL | https://dailydraft.me/legal/terms | 예 |
| Data Deletion Instructions URL | https://dailydraft.me/legal/data-deletion | 예 |
| App Website URL | https://dailydraft.me | 예 |
| OAuth Redirect URI | https://dailydraft.me/api/oauth/threads/callback | 공개 불필요 (Meta 앱 설정에만 등록) |

**검증 체크리스트** (Meta 제출 직전):

- [ ] 위 3개 legal URL을 시크릿 브라우저에서 로그인 없이 열 수 있는가?
- [ ] 각 페이지가 한국어/영어 중 최소 한 언어로 완전히 렌더링되는가? (Meta 리뷰어는 영어 기반. 한국어만 있을 경우 영어 섹션 병기 권장)
- [ ] 페이지에 "마지막 갱신일 (Last updated)" 이 표시되는가?
- [ ] 개인정보처리방침 하단에 Meta 관련 특례 섹션이 있는가?
- [ ] `privacy@dailydraft.me` 이메일이 실제 수신 가능한가?

---

## 작업 순서 요약

1. **Phase 1 — 법적 문서 작성** (Meta 제출 전 필수)
   - `app/legal/privacy/page.tsx` 신규 작성 — 항목 1~7 모두 포함
   - `app/legal/terms/page.tsx` 신규 작성
   - `app/legal/data-deletion/page.tsx` 신규 작성 — 4가지 삭제 경로 명시

2. **Phase 2 — 이메일 인프라**
   - `privacy@dailydraft.me` MX/수신 설정
   - 자동 응답 템플릿 ("영업일 기준 7일 이내 처리") 등록

3. **Phase 3 — 배포 및 검증**
   - 프로덕션 배포
   - 3개 URL 공개 접근 확인
   - Meta for Developers 앱 설정의 Privacy Policy, Terms, Data Deletion URL 필드 기입
   - App Review 제출
