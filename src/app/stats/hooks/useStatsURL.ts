import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * URL 파라미터 동기화 훅
 */
export function useStatsURL() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentPage, setCurrentPage] = useState(() => {
    const page = Number(searchParams.get('page') || '1');
    return Math.max(1, page);
  });

  // URL 변경 감지 (뒤로가기/앞으로가기 지원)
  useEffect(() => {
    const page = Number(searchParams.get('page') || '1');
    setCurrentPage(Math.max(1, page));
  }, [searchParams]);

  // URL 업데이트 함수
  const updateURL = (page: number, search: string) => {
    const params = new URLSearchParams();
    params.set('page', page.toString());

    if (search.trim()) {
      params.set('search', search.trim());
    }

    router.push(`/stats?${params.toString()}`, { scroll: false });
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page: number, search: string = '') => {
    setCurrentPage(page);
    updateURL(page, search);
  };

  return {
    currentPage,
    setCurrentPage,
    handlePageChange,
    updateURL,
  };
}
