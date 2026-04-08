-- event_notifications.notification_type CHECK 확장
-- 배경: 기존 CHECK가 'coffee_chat', 'project_invitation', 'comment', 'direct_message' 등을
-- 누락하여, createNotification() 호출 시 DB가 조용히 거부 → 인앱 알림 종 아이콘이 비어있던 버그.
-- 이메일/푸시는 별도 경로라 정상이었음.

ALTER TABLE event_notifications DROP CONSTRAINT IF EXISTS event_notifications_notification_type_check;

ALTER TABLE event_notifications ADD CONSTRAINT event_notifications_notification_type_check
  CHECK (notification_type = ANY (ARRAY[
    'deadline','new_match','reminder',
    'application_received','application_accepted','application_rejected',
    'connection','recommendation',
    'coffee_chat','project_invitation','comment','direct_message',
    'profile_interest','profile_milestone','project_update'
  ]));
