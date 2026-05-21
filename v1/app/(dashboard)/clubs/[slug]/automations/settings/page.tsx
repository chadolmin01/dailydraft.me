import { redirect } from 'next/navigation'

export default async function AutomationSettingsRedirect({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  redirect(`/clubs/${slug}/contents?tab=automations`)
}
