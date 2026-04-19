import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import CertificateClient from '@/components/club/CertificateClient'

export const dynamic = 'force-dynamic'

export default async function CertificatePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ user_id?: string }>
}) {
  const { slug } = await params
  const { user_id } = await searchParams
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/clubs/${slug}/certificate`)

  return <CertificateClient slug={slug} targetUserId={user_id ?? null} />
}
