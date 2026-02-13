// Profile hooks
export {
  useProfile,
  useProfileById,
  useUpdateProfile,
  useCreateProfile,
  profileKeys,
} from './useProfile'

// Opportunities hooks
export {
  useOpportunities,
  useOpportunity,
  useMyOpportunities,
  useRecommendedOpportunities,
  useCreateOpportunity,
  useUpdateOpportunity,
  useDeleteOpportunity,
  calculateDaysLeft,
  opportunityKeys,
  type OpportunityWithCreator,
} from './useOpportunities'

// Applications hooks
export {
  useMyApplications,
  useReceivedApplications,
  useApplicationsForOpportunity,
  useCreateApplication,
  useUpdateApplicationStatus,
  useAcceptApplication,
  useHasApplied,
  applicationKeys,
  type ApplicationWithDetails,
} from './useApplications'

// Events hooks
export {
  useEvents,
  useEvent,
  useBookmarkedEvents,
  useRecommendedEvents,
  useBookmarkEvent,
  useRemoveBookmark,
  calculateDaysUntilDeadline,
  eventKeys,
  type EventWithBookmark,
} from './useEvents'
