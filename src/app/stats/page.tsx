'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { refreshMaterializedView, type ImageStats } from '../actions/stats';
import { toast } from 'sonner';

// Components
import { StatsHeader } from './components/layout/StatsHeader';
import { SearchBar } from './components/layout/SearchBar';
import { StatsInfo } from './components/layout/StatsInfo';
import { LoadingCard, ErrorCard, EmptyState } from './components/common';
import { StatsTable } from './components/table/StatsTable';
import { CompactPagination } from './components/pagination/CompactPagination';
import { AddPromotionModal } from './components/modals/AddPromotionModal';
import { DetailedStatsModal } from './components/modals/DetailedStatsModal';

// Hooks
import { useDebounce } from './hooks/useDebounce';
import { useStatsURL } from './hooks/useStatsURL';
import { useStatsData } from './hooks/useStatsData';

// Utils
import { copyTrackingUrl } from './utils/clipboardUtils';

export default function StatsPage() {
  const searchParams = useSearchParams();

  // Custom Hooks
  const { currentPage, handlePageChange, updateURL } = useStatsURL();
  const { value: searchInput, debouncedValue: debouncedSearch, setValue: setSearchInput } = useDebounce(
    searchParams.get('search') || ''
  );

  const [limit, setLimit] = useState(50);
  const { stats, loading, error, total, totalPages, refetch } = useStatsData(
    currentPage,
    limit,
    debouncedSearch
  );

  // 모달 상태
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [promotionModal, setPromotionModal] = useState<{ open: boolean; image: ImageStats | null }>({
    open: false,
    image: null,
  });
  const [refreshing, setRefreshing] = useState(false);

  // 검색어 변경 시 URL 업데이트
  useEffect(() => {
    if (searchInput !== debouncedSearch) {
      updateURL(1, searchInput);
    }
  }, [debouncedSearch]);

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // 입력 필드나 모달이 열려있을 때는 작동 안 함
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        promotionModal.open ||
        selectedImageUrl !== null
      ) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          if (currentPage > 1) {
            handlePageChange(currentPage - 1, debouncedSearch);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (currentPage < totalPages) {
            handlePageChange(currentPage + 1, debouncedSearch);
          }
          break;
        case 'Home':
          e.preventDefault();
          handlePageChange(1, debouncedSearch);
          break;
        case 'End':
          e.preventDefault();
          handlePageChange(totalPages, debouncedSearch);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPage, totalPages, promotionModal.open, selectedImageUrl, debouncedSearch]);

  // 수동 갱신
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const result = await refreshMaterializedView();
      if (result.success) {
        toast.success('공정위 이미지가 갱신되었습니다');
        await refetch();
      } else {
        toast.error(result.error || '갱신 실패');
      }
    } catch (error) {
      console.error('갱신 오류:', error);
      toast.error('갱신 중 오류가 발생했습니다');
    } finally {
      setRefreshing(false);
    }
  };

  // 검색 초기화
  const handleClearSearch = () => {
    setSearchInput('');
    updateURL(1, '');
  };

  // Limit 변경
  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    handlePageChange(1, debouncedSearch);
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 bg-gray-50">
      <div className="mx-auto space-y-8">
        <div className="flex flex-col gap-4">
          <StatsHeader onRefresh={handleRefresh} refreshing={refreshing} />

          <div className="flex flex-col gap-4">
            <SearchBar
              value={searchInput}
              debouncedValue={debouncedSearch}
              onChange={setSearchInput}
              onClear={handleClearSearch}
            />

            <StatsInfo
              total={total}
              currentPage={currentPage}
              limit={limit}
              searchQuery={searchInput}
              onLimitChange={handleLimitChange}
            />
          </div>
        </div>

        {loading && <LoadingCard />}
        {error && <ErrorCard error={error} />}
        {!loading && stats.length === 0 && !error && (
          <EmptyState searchQuery={searchInput} onClear={handleClearSearch} />
        )}

        {stats.length > 0 && (
          <>
            <StatsTable
              stats={stats}
              searchQuery={debouncedSearch}
              onPromotionAdd={(stat) => setPromotionModal({ open: true, image: stat })}
              onViewDetails={setSelectedImageUrl}
              onCopyTrackingUrl={copyTrackingUrl}
            />

            {totalPages > 1 && (
              <CompactPagination
                currentPage={currentPage}
                totalPages={totalPages}
                total={total}
                onPageChange={(page) => handlePageChange(page, debouncedSearch)}
              />
            )}
          </>
        )}

        <AddPromotionModal
          open={promotionModal.open}
          image={promotionModal.image}
          onClose={() => setPromotionModal({ open: false, image: null })}
          onSuccess={refetch}
        />

        <DetailedStatsModal imageUrl={selectedImageUrl} onClose={() => setSelectedImageUrl(null)} />
      </div>
    </div>
  );
}
