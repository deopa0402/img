import { Card, CardContent } from "@/components/ui/card";
import { Users, Calendar, Clock } from 'lucide-react';
import { formatDate } from '../../../utils/formatters';
import type { DetailedStats } from '@/app/actions/stats';

interface StatsOverviewProps {
  stats: DetailedStats;
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <Users className="h-6 w-6 text-gray-500" />
            <h3 className="text-lg font-medium text-gray-500">고유 IP 접근 수</h3>
          </div>
          <p className="text-4xl font-bold">{stats.uniqueIPs}</p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <Calendar className="h-6 w-6 text-gray-500" />
            <h3 className="text-lg font-medium text-gray-500">전체 접근</h3>
          </div>
          <p className="text-4xl font-bold">
            {stats.dailyAccess.reduce((sum, item) => sum + item.count, 0)}회
          </p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <Clock className="h-6 w-6 text-gray-500" />
            <h3 className="text-lg font-medium text-gray-500">최근 접근</h3>
          </div>
          <p className="text-xl font-medium">{formatDate(stats.lastAccessed)}</p>
        </CardContent>
      </Card>
    </div>
  );
}
