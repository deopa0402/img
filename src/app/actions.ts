'use server'

// 중앙화된 Supabase 클라이언트 사용
import { supabase, serviceSupabase, getImagePublicUrl } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// 서버 액션: 이미지 업로드
export async function uploadImage(formData: FormData) {
  try {
    console.log('이미지 업로드 요청:', {
      url: `${API_URL}/api/upload`,
      file: formData.get('file')
    });

    const response = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('이미지 업로드 실패:', error);
      throw new Error(error.error || '이미지 업로드 중 오류가 발생했습니다.');
    }

    const data = await response.json();
    console.log('이미지 업로드 응답:', data);
    return data;
  } catch (error) {
    console.error('업로드 오류:', error);
    return { error: error instanceof Error ? error.message : '이미지 업로드 중 오류가 발생했습니다.' };
  }
}

// 단축 URL 생성
export async function createShortUrlAction(imageUrl: string) {
  try {
    console.log('단축 URL 생성 요청:', {
      url: `${API_URL}/api/shorten`,
      imageUrl
    });

    const response = await fetch(`${API_URL}/api/shorten`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image_url: imageUrl }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('단축 URL 생성 실패:', error);
      throw new Error(error.error || '단축 URL 생성 중 오류가 발생했습니다.');
    }

    const data = await response.json();
    console.log('단축 URL 생성 응답:', data);
    return { short_url: data.short_url };
  } catch (error) {
    console.error('단축 URL 생성 오류:', error);
    return { error: error instanceof Error ? error.message : '단축 URL 생성 중 오류가 발생했습니다.' };
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