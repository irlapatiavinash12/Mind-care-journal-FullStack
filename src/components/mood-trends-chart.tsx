import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";

interface MoodData {
  date: string;
  mood: number;
}

const chartConfig = {
  mood: {
    label: "Mood Rating",
    color: "hsl(var(--primary))",
  },
};

export function MoodTrendsChart() {
  const [moodData, setMoodData] = useState<MoodData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMoodData();
  }, []);

  const fetchMoodData = async () => {
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Mood data fetch timeout')), 8000)
      );

      const dataPromise = supabase
        .from('mood_entries')
        .select('mood_rating, created_at')
        .gte('created_at', format(subDays(new Date(), 30), 'yyyy-MM-dd'))
        .order('created_at', { ascending: true });

      const { data, error } = await Promise.race([dataPromise, timeoutPromise]) as any;

      if (error) throw error;

      // Group by date and average mood ratings
      const groupedData = data.reduce((acc: Record<string, number[]>, entry) => {
        const date = format(new Date(entry.created_at), 'MMM dd');
        if (!acc[date]) acc[date] = [];
        acc[date].push(entry.mood_rating);
        return acc;
      }, {});

      const chartData = Object.entries(groupedData).map(([date, ratings]) => ({
        date,
        mood: Math.round(((ratings as number[]).reduce((sum, rating) => sum + rating, 0) / (ratings as number[]).length) * 10) / 10
      }));

      setMoodData(chartData);
    } catch (error) {
      console.error('Error fetching mood data:', error);
      // Set empty data instead of leaving in loading state
      setMoodData([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-card shadow-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <TrendingUp className="h-5 w-5" />
            Mood Trends (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground">Loading mood trends...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (moodData.length === 0) {
    return (
      <Card className="bg-gradient-card shadow-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <TrendingUp className="h-5 w-5" />
            Mood Trends (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground">No mood data yet. Start tracking your mood to see trends!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-card shadow-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <TrendingUp className="h-5 w-5" />
          Mood Trends (Last 30 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={moodData}>
              <XAxis 
                dataKey="date" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                domain={[1, 5]}
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="mood"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}