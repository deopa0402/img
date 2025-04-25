'use server'

// 중앙화된 Supabase 클라이언트 사용
import { supabase, serviceSupabase, getImagePublicUrl } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

// 서버 액션: 이미지 업로드
export async function uploadImage(formData: FormData) {
  try {
    // 파일 가져오기
    const file = formData.get('file') as File
    if (!file) {
      return { error: '파일이 제공되지 않았습니다.' }
    }

    // 파일 유효성 검사
    const validationError = validateFile(file)
    if (validationError) {
      return { error: validationError }
    }

    // 고유한 파일명 생성
    const fileExt = file.name.split('.').pop()
    const fileName = `image-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`

    // Arrayuffer로 변환
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // 이미지 업로드
    const { data, error: uploadError } = await supabase.storage
      .from('images')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      return { error: `이미지 업로드 실패: ${uploadError.message}` }
    }

    // 공개 URL 생성
    const imageUrl = getImagePublicUrl(fileName)

    // RLS 정책을 우회하기 위해 서비스 롤을 사용하여 데이터베이스에 로그 추가
    await logImageAccess(imageUrl)

    revalidatePath('/')
    return { success: true, imageUrl }
  } catch (error) {
    console.error('서버 업로드 오류:', error)
    return { error: '이미지 업로드 중 오류가 발생했습니다.' }
  }
}

// 이미지 로그 저장 (서비스 롤 사용)
async function logImageAccess(imageUrl: string) {
  try {
    const { error } = await serviceSupabase
      .from('image_access_logs')
      .insert([{
        image_url: imageUrl,
        access_count: 0,
        created_at: new Date().toISOString()
      }])

    if (error) {
      console.error('로그 저장 오류:', error)
      return { error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('로그 저장 오류:', error)
    return { error: '로그 저장 중 오류가 발생했습니다.' }
  }
}

// 파일 유효성 검사
function validateFile(file: File): string | null {
  // 파일 크기 제한 (5MB)
  const MAX_FILE_SIZE = 5 * 1024 * 1024
  if (file.size > MAX_FILE_SIZE) {
    return '파일 크기는 5MB를 초과할 수 없습니다.'
  }

  // 허용되는 파일 형식
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return 'JPEG, PNG, GIF, WebP 형식의 이미지만 업로드 가능합니다.'
  }

  return null
} 