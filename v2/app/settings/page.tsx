import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsClient } from './SettingsClient'

export const metadata = { title: '설정' }

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  return <SettingsClient email={user.email ?? null} />
}
