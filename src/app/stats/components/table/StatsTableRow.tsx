import { useState } from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, BarChart2 } from 'lucide-react';
import type { ImageStats } from '@/app/actions/stats';
import { formatDate } from '../../utils/formatters';
import { getImageName } from '../../utils/imageUtils';
import { highlightText } from '../../utils/searchUtils';

interface StatsTableRowProps {
  stat: ImageStats;
  searchQuery: string;
  onPromotionAdd: () => void;
  onViewDetails: () => void;
  onCopyTrackingUrl: () => void;
}

export function StatsTableRow({ stat, searchQuery, onPromotionAdd, onViewDetails, onCopyTrackingUrl }: StatsTableRowProps) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <TableRow>
      <TableCell>
        {stat.promotion ? (
          <div
            className="text-sm text-gray-900"
            dangerouslySetInnerHTML={{
              __html: highlightText(stat.promotion, searchQuery)
            }}
          />
        ) : (
          <Button variant="outline" size="sm" onClick={onPromotionAdd}>
            추가
          </Button>
        )}
      </TableCell>

      <TableCell>
        <div className="w-16 h-16 overflow-hidden rounded-md">
          {imageFailed ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs">
              이미지 없음
            </div>
          ) : (
            <img
              src={stat.image_url}
              alt="Thumbnail"
              className="w-full h-full object-cover"
              onError={() => setImageFailed(true)}
            />
          )}
        </div>
      </TableCell>

      <TableCell>
        <div className="text-sm text-gray-900 max-w-xs truncate">
          {getImageName(stat.image_url)}
        </div>
        <Button variant="ghost" size="sm" asChild className="h-6 px-2">
          <a href={stat.image_url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-1" />
            열기
          </a>
        </Button>
      </TableCell>

      <TableCell>
        <Badge variant="secondary" className="font-medium">
          {stat.access_count}회
        </Badge>
      </TableCell>

      <TableCell>
        <Badge variant="outline" className="font-medium">
          {stat.unique_ips}명
        </Badge>
      </TableCell>

      <TableCell>
        <div className="text-sm text-gray-900">
          {stat.last_accessed ? formatDate(stat.last_accessed) : '-'}
        </div>
      </TableCell>

      <TableCell>
        <div className="text-sm text-gray-900">{formatDate(stat.created_at)}</div>
      </TableCell>

      <TableCell>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onViewDetails}>
            <BarChart2 className="h-4 w-4 mr-1" />
            상세 통계
          </Button>
          <Button variant="outline" size="sm" onClick={onCopyTrackingUrl}>
            <Copy className="h-4 w-4 mr-1" />
            추적 URL
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
