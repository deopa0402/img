import { Button } from "@/components/ui/button";

interface SearchBarProps {
  value: string;
  debouncedValue: string;
  onChange: (value: string) => void;
  onClear: () => void;
}

export function SearchBar({ value, debouncedValue, onChange, onClear }: SearchBarProps) {
  const isSearching = value !== debouncedValue;

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1 relative">
        <input
          type="text"
          placeholder="프로모션 명 검색..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2 pl-10 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {value && (
        <Button variant="outline" onClick={onClear} className="whitespace-nowrap">
          ✕ 초기화
        </Button>
      )}
    </div>
  );
}
