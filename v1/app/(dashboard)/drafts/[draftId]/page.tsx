import { DraftReviewClient } from '@/components/ghostwriter/DraftReviewClient'

interface PageProps {
  params: Promise<{ draftId: string }>
}

export default async function DraftPage({ params }: PageProps) {
  const { draftId } = await params
  return <DraftReviewClient draftId={draftId} />
}
