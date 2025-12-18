import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { RefreshCw } from 'lucide-react';

interface StatsHeaderProps {
  onRefresh: () => void;
  refreshing?: boolean;
}

export function StatsHeader({ onRefresh, refreshing = false }: StatsHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">공정위 이미지 발행</h1>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          갱신
        </Button>
        <Button asChild>
          <Link href="/">홈으로</Link>
        </Button>
      </div>
    </div>
  );
}
