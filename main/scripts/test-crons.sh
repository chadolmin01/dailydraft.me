#!/bin/bash
# 크론 E2E 스모크 테스트 — 프로덕션 배포 후 실행
# 사용법: CRON_SECRET=xxx ./scripts/test-crons.sh [base_url]
#
# 모든 크론 엔드포인트에 인증된 요청을 보내고,
# 응답에 "success":true 가 포함되는지 확인한다.

set -euo pipefail

BASE_URL="${1:-https://dailydraft.me}"
SECRET="${CRON_SECRET:?CRON_SECRET 환경변수를 설정하세요}"

PASSED=0
FAILED=0
TOTAL=0

test_cron() {
  local method="$1"
  local path="$2"
  local name="$3"
  TOTAL=$((TOTAL + 1))

  local response
  response=$(curl -s -X "$method" "${BASE_URL}${path}" \
    -H "Authorization: Bearer ${SECRET}" \
    -H "Content-Type: application/json" \
    --max-time 30 2>&1) || true

  if echo "$response" | grep -q '"success":true'; then
    echo "  ✅ ${name}"
    PASSED=$((PASSED + 1))
  else
    echo "  ❌ ${name}"
    echo "     응답: ${response:0:200}"
    FAILED=$((FAILED + 1))
  fi
}

echo ""
echo "🔍 크론 스모크 테스트 — ${BASE_URL}"
echo "────────────────────────────────────"

test_cron POST "/api/cron/activity-tracker"        "activity-tracker"
test_cron POST "/api/cron/draft-timeout"           "draft-timeout"
test_cron POST "/api/cron/weekly-checkin-prompt"    "weekly-checkin-prompt"
test_cron POST "/api/cron/ghostwriter-generate"     "ghostwriter-generate"
test_cron POST "/api/cron/checkin-reminder"         "checkin-reminder"
test_cron POST "/api/cron/reaction-collector"       "reaction-collector"
test_cron GET  "/api/cron/coffee-chat-reminders"    "coffee-chat-reminders"

echo "────────────────────────────────────"
echo "  결과: ${PASSED}/${TOTAL} 통과, ${FAILED} 실패"
echo ""

if [ "$FAILED" -gt 0 ]; then
  exit 1
fi
