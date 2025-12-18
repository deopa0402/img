/**
 * 날짜 형식화 유틸 함수
 */
export const formatDate = (dateString: string | null) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR');
  } catch (e) {
    return dateString;
  }
};

/**
 * 날짜 레이블 형식화 (년월일 + 요일)
 */
export const formatDateLabel = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  } catch {
    return dateString;
  }
};
