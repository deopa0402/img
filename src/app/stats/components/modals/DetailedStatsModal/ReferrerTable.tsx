import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { parseReferrer } from '../../../utils/referrerUtils';

interface ReferrerTableProps {
  referrers: { referrer: string; count: number }[];
}

export function ReferrerTable({ referrers }: ReferrerTableProps) {
  // 리퍼러 그룹화
  const groupedReferrers = referrers
    .filter(item => item.referrer !== 'direct')
    .reduce((acc: Record<string, { hostname: string; count: number; urls: Set<string> }>, item) => {
      const { hostname, baseUrl } = parseReferrer(item.referrer);
      if (!acc[baseUrl]) {
        acc[baseUrl] = {
          hostname,
          count: 0,
          urls: new Set<string>()
        };
      }
      acc[baseUrl].count += item.count;
      acc[baseUrl].urls.add(item.referrer);
      return acc;
    }, {} as Record<string, { hostname: string; count: number; urls: Set<string> }>);

  const sortedReferrers = Object.entries(groupedReferrers)
    .map(([baseUrl, data]) => ({
      hostname: data.hostname,
      baseUrl,
      count: data.count,
      urls: Array.from(data.urls)
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-6">
        <CardTitle className="text-xl">참조 사이트</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[400px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="text-lg">사이트</TableHead>
                <TableHead className="text-lg text-right">접근 횟수</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedReferrers.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-lg font-medium">{item.hostname}</div>
                      <div className="text-sm text-gray-500 truncate">
                        {item.baseUrl}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary" className="text-lg px-4 py-2">
                      {item.count}회
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
