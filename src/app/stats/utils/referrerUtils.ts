/**
 * 리퍼러 URL 파싱
 */
export const parseReferrer = (referrer: string) => {
  if (referrer === 'direct') return { hostname: '직접 접속', fullUrl: '' };

  try {
    const url = new URL(referrer);
    // & 이전까지만 사용
    const baseUrl = referrer.split('&')[0];
    return {
      hostname: url.hostname,
      baseUrl: baseUrl,
    };
  } catch {
    return { hostname: referrer, baseUrl: referrer };
  }
};
