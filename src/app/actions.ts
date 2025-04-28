'use server'

// 중앙화된 Supabase 클라이언트 사용
import { supabase, serviceSupabase, getImagePublicUrl } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

// 서버 액션: 이미지 업로드 (로그인 없이도 가능)
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

    // 이미지 업로드 - 서비스 롤을 사용하여 스토리지에 업로드 (RLS 우회)
    const { data, error: uploadError } = await serviceSupabase.storage
      .from('images')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      return { error: `이미지 업로드 실패: ${uploadError.message}` }
    }

    // 공개 URL 생성 (서비스 롤 사용)
    const { data: urlData } = serviceSupabase.storage
      .from('images')
      .getPublicUrl(fileName)
    
    const imageUrl = urlData.publicUrl

    try {
      // RLS 정책을 우회하기 위해 서비스 롤을 사용하여 데이터베이스에 로그 추가
      const { error: logError } = await serviceSupabase
        .from('image_access_logs')
        .insert([{
          image_url: imageUrl,
          access_count: 0,
          created_at: new Date().toISOString()
        }])

      if (logError) {
        // 로그 저장 실패해도 이미지 업로드는 성공한 것으로 처리
        console.error('로그 저장 실패 (이미지 업로드는 성공):', logError.message)
      }
    } catch (logError) {
      // 로그 저장 실패해도 이미지 업로드는 성공한 것으로 처리
      console.error('로그 초기화 오류 (이미지 업로드는 성공):', logError)
    }

    revalidatePath('/')
    return { success: true, imageUrl }
  } catch (error) {
    console.error('서버 업로드 오류:', error)
    return { error: '이미지 업로드 중 오류가 발생했습니다.' }
  }
}

// 파일 유효성 검사
function validateFile(file: File): string | null {
  // 파일 크기 제한 (5MB)
  const MAX_FILE_SIZE = 5 * 1024 * 1024
  if (file.size > MAX_FILE_SIZE) {
    return '파일 크기는 5MB를 초과할 수 없습니다.'
  }

  return null
} 