interface StatsInfoProps {
  total: number;
  currentPage: number;
  limit: number;
  searchQuery: string;
  onLimitChange: (limit: number) => void;
}

export function StatsInfo({ total, currentPage, limit, searchQuery, onLimitChange }: StatsInfoProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="text-sm text-gray-600">
        {searchQuery.trim() && (
          <span className="mr-2 text-primary font-medium">
            "{searchQuery}" 검색 결과:
          </span>
        )}
        총 <span className="font-semibold text-gray-900">{total}</span>개 이미지 |{' '}
        <span className="font-semibold text-gray-900">
          {total > 0 ? `${(currentPage - 1) * limit + 1}-${Math.min(currentPage * limit, total)}` : '0'}
        </span>개 표시 중
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="limit-select" className="text-sm text-gray-600">
          페이지당:
        </label>
        <select
          id="limit-select"
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value={25}>25개씩</option>
          <option value={50}>50개씩</option>
          <option value={100}>100개씩</option>
        </select>
      </div>
    </div>
  );
}
