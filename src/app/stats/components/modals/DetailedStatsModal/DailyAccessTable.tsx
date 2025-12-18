import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDateLabel } from '../../../utils/formatters';

interface DailyAccessTableProps {
  data: { date: string; count: number }[];
}

export function DailyAccessTable({ data }: DailyAccessTableProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-6">
        <CardTitle className="text-xl">날짜별 접근 통계</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-[500px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-lg">날짜</TableHead>
                <TableHead className="text-lg text-right">접근 횟수</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((item) => (
                  <TableRow key={item.date}>
                    <TableCell className="text-lg">{formatDateLabel(item.date)}</TableCell>
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
