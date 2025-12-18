import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatsTableRow } from './StatsTableRow';
import type { ImageStats } from '@/app/actions/stats';

interface StatsTableProps {
  stats: ImageStats[];
  searchQuery: string;
  onPromotionAdd: (stat: ImageStats) => void;
  onViewDetails: (imageUrl: string) => void;
  onCopyTrackingUrl: (imageUrl: string) => void;
}

export function StatsTable({ stats, searchQuery, onPromotionAdd, onViewDetails, onCopyTrackingUrl }: StatsTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>프로모션 명</TableHead>
              <TableHead>이미지</TableHead>
              <TableHead>파일명</TableHead>
              <TableHead>접근 횟수</TableHead>
              <TableHead>고유 IP</TableHead>
              <TableHead>최근 접근</TableHead>
              <TableHead>생성일</TableHead>
              <TableHead>액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.map((stat) => (
              <StatsTableRow
                key={stat.id}
                stat={stat}
                searchQuery={searchQuery}
                onPromotionAdd={() => onPromotionAdd(stat)}
                onViewDetails={() => onViewDetails(stat.image_url)}
                onCopyTrackingUrl={() => onCopyTrackingUrl(stat.image_url)}
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
