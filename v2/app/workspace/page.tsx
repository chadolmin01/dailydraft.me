import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { WorkspaceClient } from './WorkspaceClient'

export default async function WorkspacePage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <WorkspaceClient
      userEmail={user?.email ?? null}
    />
  )
}
