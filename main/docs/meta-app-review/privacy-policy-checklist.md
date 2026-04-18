# 개인정보처리방침 체크리스트 (Meta 리뷰 대응)

Meta는 앱 리뷰 시 **공개 접근 가능한 개인정보처리방침 URL**을 요구합니다.
Draft 기존 개인정보처리방침에 아래 항목이 모두 포함되어 있어야 리뷰 통과가
수월합니다.

## 필수 명시 항목

### 1. 수집하는 Meta 플랫폼 데이터
```
본 서비스는 이용자가 연결한 Threads/Instagram 계정으로부터 다음 정보를
수집합니다:
- 계정 식별자 (user id)
- 사용자명 (username)
- 본 서비스가 발급받은 OAuth 액세스 토큰
```

### 2. 수집 목적
```
수집된 정보는 오직 다음 목적으로만 사용됩니다:
- 이용자가 Draft 내에서 승인한 콘텐츠를 본인의 Threads/Instagram 계정에
  게시하기 위해
- 연결된 계정의 표시 (UI상 "@username으로 연결됨")
```

### 3. 보관 기간
```
OAuth 액세스 토큰은 이용자가 연결을 해제하거나 60일 만료 시까지 보관하며,
해제 즉시 완전 삭제됩니다.
```

### 4. 암호화·보안
```
OAuth 액세스 토큰은 AES-256-GCM으로 암호화하여 저장하며, 서버 환경변수로
분리 보관되는 키로만 복호화 가능합니다. 평문 토큰은 브라우저·로그·백업
어디에도 저장되지 않습니다.
```

### 5. 제3자 공유
```
본 서비스는 Meta 플랫폼에서 수집한 어떠한 정보도 제3자에게 판매·공유·
양도하지 않습니다.
```

### 6. 이용자 권리
```
이용자는 언제든지 Draft 내 "페르소나 설정" 페이지에서 연결을 해제할 수
있으며, 해제 시 관련 토큰 및 계정 참조 정보는 즉시 완전 삭제됩니다.
또한 개인정보 삭제 요청은 privacy@draft.co.kr로 보내실 수 있습니다.
```

### 7. 데이터 삭제 안내 URL
```
Meta 리뷰에서 별도로 요구: "Data Deletion Instructions URL"
예시: https://draft.co.kr/legal/data-deletion
```

**이 페이지에는 다음이 있어야 합니다:**
- 이용자가 Draft 계정을 완전히 삭제하는 방법
- 이용자가 SNS 연결만 해제하는 방법
- 문의처 이메일 (privacy@draft.co.kr)

## 현재 Draft 상태 점검

아래 파일을 확인해 누락 항목을 채워주세요:

```
main/app/legal/privacy/page.tsx       (있으면 갱신, 없으면 신규 생성)
main/app/legal/data-deletion/page.tsx (신규 필요)
main/app/legal/terms/page.tsx         (확인)
```

## Meta 제출 시 입력할 URL

| 항목 | URL |
|------|-----|
| Privacy Policy URL | https://draft.co.kr/legal/privacy |
| Terms of Service URL | https://draft.co.kr/legal/terms |
| Data Deletion Instructions URL | https://draft.co.kr/legal/data-deletion |
| App Website URL | https://draft.co.kr |
