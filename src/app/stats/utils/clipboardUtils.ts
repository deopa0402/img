import { toast } from 'sonner';
import { createShortUrlAction } from '@/app/actions';

/**
 * 클립보드에 텍스트 복사
 */
export const copyToClipboard = async (text: string): Promise<void> => {
  try {
    const input = document.createElement('input');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    input.setSelectionRange(0, 99999);
    document.execCommand('copy');
    document.body.removeChild(input);

    toast.success('URL이 클립보드에 복사되었습니다');
  } catch (err) {
    console.error('클립보드 복사 실패:', err);
    toast.error('클립보드 복사에 실패했습니다');
  }
};

/**
 * 추적 URL 생성 (Vercel 호스팅용)
 */
export const getExternalTrackingUrl = async (url: string): Promise<string> => {
  try {
    const result = await createShortUrlAction(url);
    if (result.error) {
      throw new Error(result.error);
    }
    return result.short_url;
  } catch (err) {
    console.error('단축 URL 생성 실패:', err);
    return `${process.env.NEXT_PUBLIC_API_URL}/api/track?image_url=${encodeURIComponent(url)}`;
  }
};

/**
 * 추적 URL 바로 복사하기
 */
export const copyTrackingUrl = async (imageUrl: string): Promise<void> => {
  const trackingUrl = await getExternalTrackingUrl(imageUrl);
  if (trackingUrl) {
    copyToClipboard(trackingUrl);
  }
};
