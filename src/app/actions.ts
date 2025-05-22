'use server'

// 중앙화된 Supabase 클라이언트 사용
import { supabase, serviceSupabase, getImagePublicUrl } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'

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
    console.log('단축 URL 생성 요청:', { imageUrl });

    if (!imageUrl || !imageUrl.startsWith('https://')) {
      throw new Error('유효한 image_url이 필요합니다');
    }

    const shortId = nanoid(7);
    // 서비스 롤을 사용하여 데이터베이스에 저장
    const { error } = await serviceSupabase
      .from('shortened_urls')
      .insert({
        short_id: shortId,
        original_url: imageUrl,
        created_at: new Date().toISOString()
      });

    if (error) throw error;

    const shortUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/${shortId}`;
    console.log('단축 URL 생성 응답:', { shortUrl });
    return { short_url: shortUrl };
  } catch (error) {
    console.error('단축 URL 생성 오류:', error);
    return { error: error instanceof Error ? error.message : '단축 URL 생성 중 오류가 발생했습니다.' };
  }
}

// 파일 유효성 검사
function validateFile(file: File): string | null {
  // 파일 크기 제한 (10MB)
  const MAX_FILE_SIZE = 10 * 1024 * 1024
  if (file.size > MAX_FILE_SIZE) {
    return '파일 크기는 10MB를 초과할 수 없습니다.'
  }

  return null
} 