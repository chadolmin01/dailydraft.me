-- event_notifications.notification_type 에 'club_verification' 추가
--
-- 배경: /api/admin/clubs/[id]/review 가 legacy `notifications` 테이블에 insert 하던 문제.
-- UI(TopNavbar bell, /notifications 페이지)는 event_notifications 만 읽으므로 승인·거부 알림이
-- 전부 유실되고 있었음. createNotification() 경로로 통일하려면 type 이 enum 에 포함되어야 함.

ALTER TABLE event_notifications DROP CONSTRAINT IF EXISTS event_notifications_notification_type_check;

ALTER TABLE event_notifications ADD CONSTRAINT event_notifications_notification_type_check
  CHECK (notification_type = ANY (ARRAY[
    'deadline','new_match','reminder',
    'application_received','application_accepted','application_rejected',
    'connection','recommendation',
    'coffee_chat','project_invitation','comment','direct_message',
    'profile_interest','profile_milestone','project_update',
    'club_verification'
  ]));
