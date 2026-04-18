import { redirect } from 'next/navigation'

export default async function AutomationsRedirect({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  redirect(`/clubs/${slug}/contents?tab=calendar`)
}
