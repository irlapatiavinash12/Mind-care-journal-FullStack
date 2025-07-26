import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MoodRating } from "@/components/ui/mood-rating";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

interface MoodEntryFormProps {
  onSubmit: (entry: { rating: number; note: string }) => void;
}

export function MoodEntryForm({ onSubmit }: MoodEntryFormProps) {
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error("Please select a mood rating");
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit({ rating, note });
      setRating(0);
      setNote("");
      toast.success("Mood entry saved successfully!");
    } catch (error) {
      toast.error("Failed to save mood entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-gradient-card shadow-card border-0">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-primary">
          <Sparkles className="h-5 w-5" />
          How are you feeling today?
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <MoodRating value={rating} onChange={setRating} />
          
          <div className="space-y-2">
            <label htmlFor="note" className="text-sm font-medium text-foreground">
              Share your thoughts (optional)
            </label>
            <Textarea
              id="note"
              placeholder="What's on your mind today? Any thoughts, feelings, or experiences you'd like to note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-24 resize-none border-border bg-background/50"
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={rating === 0 || isSubmitting}
            className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
          >
            {isSubmitting ? "Saving..." : "Save Mood Entry"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}