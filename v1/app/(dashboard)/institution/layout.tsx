import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import { getInstitutionId } from '@/src/lib/institution/auth'

export default async function InstitutionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const institutionId = await getInstitutionId(supabase, user.id)
  if (!institutionId) redirect('/explore')

  return <>{children}</>
}
