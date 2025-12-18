import { useState, useEffect } from 'react';
import { getImageStats, type ImageStats } from '@/app/actions/stats';

/**
 * 통계 데이터 페칭 훅
 */
export function useStatsData(page: number, limit: number, searchQuery: string) {
  const [stats, setStats] = useState<ImageStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const result = await getImageStats(page, limit, searchQuery);

        if (result.error) {
          setError(result.error);
        } else if (result.data) {
          setStats(result.data);
          setTotalPages(result.pagination?.totalPages || 1);
          setTotal(result.pagination?.total || 0);
        }
      } catch (err) {
        console.error('통계 데이터 로드 오류:', err);
        setError('통계 데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [page, limit, searchQuery]);

  const refetch = async () => {
    const result = await getImageStats(page, limit, searchQuery);
    if (result.data) {
      setStats(result.data);
      setTotalPages(result.pagination?.totalPages || 1);
      setTotal(result.pagination?.total || 0);
    }
  };

  return {
    stats,
    loading,
    error,
    total,
    totalPages,
    refetch,
  };
}
