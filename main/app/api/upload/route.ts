import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'

const BUCKET = 'project-images'
const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponse.unauthorized()
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (files.length === 0) {
      return ApiResponse.badRequest('업로드할 파일이 없습니다')
    }

    if (files.length > 5) {
      return ApiResponse.badRequest('이미지는 최대 5개까지 업로드 가능합니다')
    }

    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets()
    if (!buckets?.find(b => b.name === BUCKET)) {
      await supabase.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: MAX_SIZE,
        allowedMimeTypes: ALLOWED_TYPES,
      })
    }

    const urls: string[] = []

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        continue
      }
      if (file.size > MAX_SIZE) {
        continue
      }

      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type })

      if (uploadError) {
        console.error('Upload error:', uploadError.message)
        continue
      }

      const { data: publicUrl } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(path)

      urls.push(publicUrl.publicUrl)
    }

    return ApiResponse.ok({ urls })
  } catch {
    return ApiResponse.internalError('파일 업로드 중 오류가 발생했습니다')
  }
}
