import { Card, CardContent } from "@/components/ui/card";

interface ErrorCardProps {
  error: string;
}

export function ErrorCard({ error }: ErrorCardProps) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="p-4">
        <p className="text-red-600">{error}</p>
      </CardContent>
    </Card>
  );
}
