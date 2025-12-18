import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingCard() {
  return (
    <Card>
      <CardContent className="flex items-center justify-center p-12">
        <Skeleton className="w-6 h-6 rounded-full mr-2" />
        <p className="text-gray-600">공정위 이미지 로드 중...</p>
      </CardContent>
    </Card>
  );
}
