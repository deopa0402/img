'use server'

// 중앙화된 Supabase 클라이언트 사용
import { supabase, serviceSupabase, getImagePublicUrl } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// 서버 액션: 이미지 업로드
export async function uploadImage(formData: FormData) {
  try {
    console.log('이미지 업로드 요청 및 프로모션 명:', {
      url: `${API_URL}/api/upload`,
      file: formData.get('file') ? '파일 존재' : '파일 없음',
      promotion: formData.get('promotion')
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

    // 이미지 업로드 성공 후 프로모션 정보 업데이트 시도
    const uploadedImageUrl = data.imageUrl;
    const promotion = formData.get('promotion') as string | null;

    if (uploadedImageUrl && promotion) {
      console.log('업로드 성공 후 프로모션 업데이트 시작');
      const updateResult = await updateImagePromotion(uploadedImageUrl, promotion);
      if (updateResult.error) {
        console.error('업로드 후 프로모션 자동 업데이트 실패:', updateResult.error);
      } else {
        console.log('업로드 후 프로모션 자동 업데이트 성공');
      }
    } else if (uploadedImageUrl && !promotion) {
      console.log('프로모션 정보가 제공되지 않아 업로드 후 프로모션 업데이트를 건너뜀.');
    } else {
      console.error('업로드 응답에서 이미지 URL을 찾을 수 없습니다. 프로모션 업데이트 불가.');
    }

    return data;
  } catch (error) {
    console.error('업로드 오류:', error);
    return { error: error instanceof Error ? error.message : '이미지 업로드 중 오류가 발생했습니다.' };
  }
}

// 단축 URL 조회 (생성하지 않음)
export async function createShortUrlAction(imageUrl: string) {
  try {
    console.log('단축 URL 조회 요청 (생성 안 함):', { imageUrl });

    if (!imageUrl || !imageUrl.startsWith('https://')) {
      throw new Error('유효한 image_url이 필요합니다');
    }
console.log('!!!!!!!!!!!!!!imageUrl', imageUrl)
    // 1. 기존 단축 URL 조회
    // 동일한 URL에 대해 여러 단축 URL이 있을 수 있으므로 limit(1)을 사용
    const { data: existingShortUrl, error: fetchError } = await serviceSupabase
      .from('shortened_urls')
      .select('short_id') // 필요한 short_id만 select하여 효율성 높임
      .eq('original_url', imageUrl)
      .limit(1); // 결과를 하나만 가져오도록 제한

    if (fetchError) { // limit(1) 사용 시 결과 없음은 에러가 아님
      console.error('기존 단축 URL 조회 오류:', fetchError);
      throw new Error(`단축 URL 조회 실패: ${fetchError.message}`);
    }

    // limit(1) 결과는 배열로 오므로 [0] 인덱스로 첫 번째 항목 확인
    if (existingShortUrl && existingShortUrl.length > 0) {
      // 2. 기존 단축 URL이 있다면 반환
      const shortUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/${existingShortUrl[0].short_id}`;
      console.log('기존 단축 URL 반환:', { shortUrl });
      return { short_url: shortUrl };
    } else {
      // 3. 기존 단축 URL이 없다면 없다고 알림 (새로 생성하지 않음)
      console.log('해당 image_url에 대한 단축 URL을 찾을 수 없습니다.', { imageUrl });
      return { short_url: null, error: '해당 이미지의 단축 URL이 존재하지 않습니다.' };
    }

  } catch (error) {
    console.error('단축 URL 조회 오류:', error);
    return { error: error instanceof Error ? error.message : '단축 URL 조회 중 오류가 발생했습니다.' };
  }
}

// 새 함수: 이미지의 프로모션 정보 업데이트 또는 설정
export async function updateImagePromotion(imageUrl: string, promotion: string) {
  try {
    console.log('프로모션 정보 업데이트 요청:', { imageUrl, promotion });

    if (!imageUrl) {
      throw new Error('이미지 URL이 필요합니다.');
    }
    if (!promotion) {
      console.log('프로모션 정보가 없어 업데이트를 건너뜁니다.');
      return { success: false, message: '프로모션 정보 없음' };
    }

    // serviceSupabase를 사용하여 image_access_logs 테이블 업데이트 또는 삽입
    // onConflict: 'image_url' 옵션은 이미 존재하면 업데이트하고 없으면 삽입합니다.
    const { error } = await serviceSupabase
      .from('image_access_logs')
      .upsert(
        {
          image_url: imageUrl,
          promotion: promotion,
        },
        { onConflict: 'image_url', ignoreDuplicates: false }
      );

    if (error) {
      console.error('프로모션 업데이트 실패:', error);
      throw new Error(`프로모션 업데이트 실패: ${error.message}`);
    }

    console.log('프로모션 정보 업데이트 성공:', { imageUrl, promotion });
    return { success: true, message: '프로모션 정보 업데이트 성공' };

  } catch (error) {
    console.error('프로모션 업데이트 오류:', error);
    return { success: false, error: error instanceof Error ? error.message : '프로모션 업데이트 중 오류가 발생했습니다.' };
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

// 새 함수: 이미지의 프로모션 정보 추가/업데이트 (단순 모드)
export async function addPromotionToImage(imageUrl: string, promotion: string) {
  try {
    console.log('프로모션 추가/업데이트 요청 (단순 모드):', { imageUrl, promotion });

    if (!imageUrl || !promotion.trim()) { // 빈 문자열도 유효하지 않도록 trim() 추가
      throw new Error('이미지 URL과 프로모션 정보가 모두 필요합니다.');
    }

    // 프로모션 정보 업데이트 (기존 값 체크 없이 단순 업데이트)
    // 해당 image_url에 대한 레코드가 없으면 업데이트되지 않습니다.
    const { error: updateError, count } = await serviceSupabase
      .from('image_access_logs')
      .update({ promotion: promotion.trim() })
      .eq('image_url', imageUrl); // 해당 image_url 레코드만 업데이트

    if (updateError) {
      console.error('프로모션 업데이트 실패:', updateError);
      throw new Error(`프로모션 업데이트 실패: ${updateError.message}`);
    }
    
    // 업데이트된 행이 없으면 레코드가 존재하지 않는 경우
    if (count === 0) {
         console.error('프로모션 업데이트 실패: 해당 이미지 URL의 로그 기록을 찾을 수 없습니다.', { imageUrl });
         return { success: false, error: '해당 이미지의 로그 기록을 찾을 수 없습니다. 이미지가 한 번 이상 조회된 후에 프로모션을 추가해주세요.' };
    }


    console.log('프로모션 업데이트 성공:', { imageUrl, promotion });
    // stats 페이지에서 데이터를 다시 로드하도록 revalidatePath 호출
    revalidatePath('/stats');
    return { success: true, message: '프로모션이 업데이트되었습니다.' };

  } catch (error) {
    console.error('프로모션 업데이트 오류:', error);
    return { success: false, error: error instanceof Error ? error.message : '프로모션 업데이트 중 오류가 발생했습니다.' };
  }
} 