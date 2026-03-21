import type { Area } from 'react-easy-crop'
import imageCompression from 'browser-image-compression'
import { supabase } from '@/src/lib/supabase/client'

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB (압축 전 허용 크기)

const BUCKET = 'project-images'

export async function getCroppedImg(src: string, cropArea: Area): Promise<File> {
  const img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
  const canvas = document.createElement('canvas')
  canvas.width = cropArea.width
  canvas.height = cropArea.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(
    img,
    cropArea.x, cropArea.y, cropArea.width, cropArea.height,
    0, 0, cropArea.width, cropArea.height,
  )
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) return reject(new Error('Canvas to blob failed'))
      resolve(new File([blob], `cropped-${Date.now()}.png`, { type: 'image/png' }))
    }, 'image/png')
  })
}

/** 버킷 존재 확인 및 생성 (최초 1회) */
async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets()
  if (buckets?.find(b => b.name === BUCKET)) return

  await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: ALLOWED_IMAGE_TYPES,
  })
}

/** 클라이언트에서 이미지 압축 후 Supabase Storage에 직접 업로드 */
export async function uploadImagesToSupabase(files: File[]): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('로그인이 필요합니다')

  await ensureBucket()

  const urls: string[] = []

  for (const file of files) {
    // 1. 이미지 압축 (메인 스레드에서 실행 — CSP blob worker 차단 회피)
    const compressed = await imageCompression(file, {
      maxSizeMB: 2,
      maxWidthOrHeight: 1920,
      useWebWorker: false,
    })

    // 2. Supabase Storage에 직접 업로드
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, compressed, {
        contentType: compressed.type,
        cacheControl: '3600',
      })

    if (uploadError) {
      console.error('Upload error:', uploadError.message)
      throw new Error(`이미지 업로드 실패: ${uploadError.message}`)
    }

    // 3. Public URL 획득
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(path)

    urls.push(publicUrl)
  }

  return urls
}
