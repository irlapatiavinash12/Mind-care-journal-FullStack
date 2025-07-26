import { cn } from "@/lib/utils";
import { useState } from "react";

interface MoodRatingProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

const moodEmojis = ['😢', '😔', '😐', '😊', '😄'];
const moodLabels = ['Very Low', 'Low', 'Neutral', 'Good', 'Excellent'];
const moodColors = [
  'text-red-400',
  'text-orange-400', 
  'text-yellow-400',
  'text-green-400',
  'text-blue-400'
];

export function MoodRating({ value, onChange, className }: MoodRatingProps) {
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);
  
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex justify-center space-x-2">
        {moodEmojis.map((emoji, index) => {
          const moodValue = index + 1;
          const isSelected = value === moodValue;
          const isHovered = hoveredValue === moodValue;
          
          return (
            <button
              key={moodValue}
              type="button"
              onClick={() => onChange(moodValue)}
              onMouseEnter={() => setHoveredValue(moodValue)}
              onMouseLeave={() => setHoveredValue(null)}
              className={cn(
                "text-4xl p-3 rounded-full transition-all duration-200",
                "hover:scale-110 hover:shadow-soft",
                isSelected || isHovered 
                  ? "bg-primary/10 shadow-soft scale-110" 
                  : "hover:bg-accent/50"
              )}
            >
              {emoji}
            </button>
          );
        })}
      </div>
      
      <div className="text-center">
        <p className={cn(
          "text-lg font-medium transition-colors",
          value > 0 ? moodColors[value - 1] : "text-muted-foreground"
        )}>
          {value > 0 ? moodLabels[value - 1] : "Select your mood"}
        </p>
      </div>
    </div>
  );
}