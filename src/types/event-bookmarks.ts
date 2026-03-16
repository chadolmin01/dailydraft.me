// Event Bookmarks & Notifications Types

export interface EventBookmark {
  id: string
  user_id: string
  event_id: string
  notify_before_days: number
  created_at: string
}

export interface EventNotification {
  id: string
  user_id: string
  event_id: string
  bookmark_id: string | null
  title: string
  message: string
  notification_type: 'deadline' | 'new_match' | 'reminder'
  status: 'unread' | 'read' | 'dismissed'
  notify_date: string
  read_at: string | null
  created_at: string
}

// API Response types
export interface BookmarkWithEvent extends EventBookmark {
  startup_events: {
    id: string
    title: string
    organizer: string
    event_type: string
    registration_end_date: string
    registration_url: string | null
    interest_tags: string[]
  }
}

export interface NotificationWithEvent extends EventNotification {
  startup_events: {
    id: string
    title: string
    organizer: string
    event_type: string
    registration_end_date: string
    registration_url: string | null
  }
}

// Request types
export interface CreateBookmarkRequest {
  event_id: string
  notify_before_days?: number
}

export interface UpdateBookmarkRequest {
  notify_before_days: number
}

export interface UpdateNotificationRequest {
  status: 'read' | 'dismissed'
}
