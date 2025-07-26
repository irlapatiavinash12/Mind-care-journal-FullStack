import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart } from "lucide-react";

interface AffirmationCardProps {
  affirmation: string | null;
}

export function AffirmationCard({ affirmation }: AffirmationCardProps) {
  if (!affirmation) return null;

  return (
    <Card className="bg-gradient-card shadow-card border-0">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-primary">
          <Heart className="h-5 w-5" />
          Your Daily Affirmation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-center text-lg leading-relaxed text-foreground/90 font-medium">
          "{affirmation}"
        </p>
      </CardContent>
    </Card>
  );
}