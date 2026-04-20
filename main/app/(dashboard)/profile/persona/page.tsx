import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PersonalPersonaTeaser } from '@/components/persona/PersonalPersonaTeaser'

export const dynamic = 'force-dynamic'

export default async function ProfilePersonaPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/profile/persona')
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <PersonalPersonaTeaser userEmail={user.email ?? ''} />
    </div>
  )
}
