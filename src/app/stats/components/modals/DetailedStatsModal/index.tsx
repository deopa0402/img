import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart2, RefreshCw } from 'lucide-react';
import { getImageDetailedStats, type DetailedStats } from '@/app/actions/stats';
import { getImageName } from '../../../utils/imageUtils';
import { StatsOverview } from './StatsOverview';
import { DailyAccessTable } from './DailyAccessTable';
import { ReferrerTable } from './ReferrerTable';

interface DetailedStatsModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

export function DetailedStatsModal({ imageUrl, onClose }: DetailedStatsModalProps) {
  const [stats, setStats] = useState<DetailedStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      setStats(null);
      return;
    }

    const fetchDetailedStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getImageDetailedStats(imageUrl);

        if (result.error) {
          setError(result.error);
        } else if (result.data) {
          setStats(result.data);
        }
      } catch (err) {
        console.error('상세 통계 로드 오류:', err);
        setError('상세 통계를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetailedStats();
  }, [imageUrl]);

  const handleRefresh = () => {
    if (imageUrl) {
      setLoading(true);
      getImageDetailedStats(imageUrl)
        .then(result => {
          if (result.data) {
            setStats(result.data);
          }
        })
        .finally(() => setLoading(false));
    }
  };

  return (
    <Dialog open={!!imageUrl} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-8 max-w-6xl">
        <DialogHeader className="pb-8 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 text-3xl">
              <BarChart2 className="h-8 w-8" />
              공정위 이미지 상세: {imageUrl ? getImageName(imageUrl).slice(0, 8) : ''}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={handleRefresh} className="h-8 w-8">
              <RefreshCw className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-20">
            <div className="flex flex-col items-center gap-6">
              <Skeleton className="w-20 h-20 rounded-full" />
              <p className="text-gray-600 text-xl">공정위 이미지 상세 로드 중...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <div className="text-red-600 mb-4 text-5xl">⚠️</div>
            <p className="text-red-600 font-medium text-xl">{error}</p>
          </div>
        ) : stats && (
          <>
            <StatsOverview stats={stats} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              <DailyAccessTable data={stats.dailyAccess} />
              <ReferrerTable referrers={stats.topReferrers} />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
