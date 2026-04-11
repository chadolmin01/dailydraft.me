-- profiles에 discord_username 추가
-- Discord OAuth 연결 시 저장 (표시용)
-- discord_user_id는 이미 존재함

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS discord_username text;
