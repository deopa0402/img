/**
 * 검색어 하이라이트 함수
 * @param text 원본 텍스트
 * @param search 검색어
 * @returns 하이라이트가 적용된 HTML 문자열
 */
export const highlightText = (text: string, search: string): string => {
  if (!search.trim() || !text) return text;

  try {
    // 특수문자 이스케이프 처리
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedSearch})`, 'gi');

    return text.replace(regex, '<mark class="bg-yellow-200 font-semibold">$1</mark>');
  } catch (e) {
    // 정규식 오류 시 원본 반환
    return text;
  }
};
