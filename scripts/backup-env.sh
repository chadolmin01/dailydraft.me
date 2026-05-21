#!/bin/bash
# ============================================================
# 환경변수 백업 스크립트
# 사용법: bash scripts/backup-env.sh
# ============================================================
# .env.local 파일을 사용자 홈 디렉토리의 안전한 위치로 복사
# Git에는 절대 커밋되지 않음 (.gitignore 처리됨)
# ============================================================

set -e

BACKUP_DIR="$HOME/.draft-env-backup"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# main/.env.local 백업
if [ -f "main/.env.local" ]; then
  cp main/.env.local "$BACKUP_DIR/env.local.m6.$TIMESTAMP"
  echo "✓ main/.env.local → $BACKUP_DIR/env.local.m6.$TIMESTAMP"
else
  echo "✗ main/.env.local not found"
fi

# main/.env.local.audit 백업 (감사용 사본)
if [ -f "main/.env.local.audit" ]; then
  cp main/.env.local.audit "$BACKUP_DIR/env.local.audit.m6.$TIMESTAMP"
  echo "✓ main/.env.local.audit → $BACKUP_DIR/env.local.audit.m6.$TIMESTAMP"
fi

echo ""
echo "백업 위치: $BACKUP_DIR"
echo "다음 단계: 패스워드 매니저(1Password / Bitwarden 등)에 키별로 옮겨 저장"
echo "확인: ls -la $BACKUP_DIR"
