import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext } from "@/components/ui/pagination";

interface CompactPaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function CompactPagination({ currentPage, totalPages, total, onPageChange }: CompactPaginationProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <Pagination>
        <PaginationContent className="gap-2">
          {/* 처음 버튼 */}
          <PaginationItem>
            <button
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              className="h-10 px-4 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
            >
              « 처음
            </button>
          </PaginationItem>

          <PaginationItem>
            <PaginationPrevious
              onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
              className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>

          {/* 페이지 입력 영역 */}
          <div className="flex items-center gap-2 px-4">
            <span className="text-sm text-gray-600">페이지</span>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                if (!isNaN(value) && value >= 1 && value <= totalPages) {
                  onPageChange(value);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const value = parseInt(e.currentTarget.value, 10);
                  if (!isNaN(value) && value >= 1 && value <= totalPages) {
                    onPageChange(value);
                  }
                }
              }}
              className="w-16 h-10 px-2 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <span className="text-sm text-gray-600">/ {totalPages}</span>
          </div>

          <PaginationItem>
            <PaginationNext
              onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
              className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>

          {/* 마지막 버튼 */}
          <PaginationItem>
            <button
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="h-10 px-4 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
            >
              마지막 »
            </button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      <p className="text-sm text-gray-600">
        총 {total}개 이미지
      </p>
    </div>
  );
}
