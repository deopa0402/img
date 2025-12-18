/**
 * URL에서 파일 이름만 추출
 */
export const getImageName = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    return pathParts[pathParts.length - 1];
  } catch (e) {
    // URL 파싱 오류시 전체 URL 반환
    return url;
  }
};

/**
 * 유저 에이전트 간소화
 */
export const simplifyUserAgent = (ua: string): string => {
  if (ua === 'unknown') return '알 수 없음';

  // 브라우저 감지
  let browser = '';
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('MSIE') || ua.includes('Trident')) browser = 'Internet Explorer';
  else browser = '기타 브라우저';

  // 장치 감지
  let device = '';
  if (ua.includes('Mobile')) device = '모바일';
  else if (ua.includes('Tablet')) device = '태블릿';
  else device = '데스크톱';

  return `${browser} (${device})`;
};
