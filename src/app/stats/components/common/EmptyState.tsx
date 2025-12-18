import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  searchQuery: string;
  onClear: () => void;
}

export function EmptyState({ searchQuery, onClear }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        {searchQuery.trim() ? (
          <div className="space-y-2">
            <p className="text-gray-600">
              "<span className="font-semibold text-gray-900">{searchQuery}</span>" 검색 결과가 없습니다.
            </p>
            <Button variant="outline" onClick={onClear}>
              검색 초기화
            </Button>
          </div>
        ) : (
          <p className="text-gray-600">아직 기록된 공정위 이미지가 없습니다.</p>
        )}
      </CardContent>
    </Card>
  );
}
