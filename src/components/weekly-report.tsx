import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Calendar, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface WeeklyStats {
  averageMood: number;
  totalEntries: number;
  moodTrend: number;
  streakDays: number;
}

export function WeeklyReport() {
  const [stats, setStats] = useState<WeeklyStats>({
    averageMood: 0,
    totalEntries: 0,
    moodTrend: 0,
    streakDays: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeeklyStats();
  }, []);

  const fetchWeeklyStats = async () => {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Weekly stats fetch timeout')), 8000)
      );

      const dataPromise = supabase
        .from('mood_entries')
        .select('mood_rating, created_at')
        .gte('created_at', oneWeekAgo.toISOString())
        .order('created_at', { ascending: true });

      const { data: weekData, error } = await Promise.race([dataPromise, timeoutPromise]) as any;

      if (error) throw error;

      if (weekData && weekData.length > 0) {
        const avgMood = weekData.reduce((sum, entry) => sum + entry.mood_rating, 0) / weekData.length;
        const firstHalf = weekData.slice(0, Math.floor(weekData.length / 2));
        const secondHalf = weekData.slice(Math.floor(weekData.length / 2));
        
        const firstHalfAvg = firstHalf.length > 0 ? firstHalf.reduce((sum, entry) => sum + entry.mood_rating, 0) / firstHalf.length : 0;
        const secondHalfAvg = secondHalf.length > 0 ? secondHalf.reduce((sum, entry) => sum + entry.mood_rating, 0) / secondHalf.length : 0;
        
        const trend = secondHalfAvg - firstHalfAvg;
        
        // Calculate streak
        let streak = 0;
        for (let i = weekData.length - 1; i >= 0; i--) {
          if (weekData[i].mood_rating >= 4) {
            streak++;
          } else {
            break;
          }
        }

        setStats({
          averageMood: avgMood,
          totalEntries: weekData.length,
          moodTrend: trend,
          streakDays: streak
        });
      }
    } catch (error) {
      console.error('Error fetching weekly stats:', error);
      // Keep default stats instead of leaving in loading state
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-card shadow-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Calendar className="h-5 w-5" />
            Weekly Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-card shadow-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Calendar className="h-5 w-5" />
          Weekly Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 rounded-lg bg-white/50">
            <div className="text-2xl font-bold text-primary">{stats.averageMood.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">Average Mood</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-white/50">
            <div className="text-2xl font-bold text-primary">{stats.totalEntries}</div>
            <div className="text-sm text-muted-foreground">Entries This Week</div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {stats.moodTrend >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
            <span className="text-sm">
              Mood {stats.moodTrend >= 0 ? 'improved' : 'declined'} by {Math.abs(stats.moodTrend).toFixed(1)} points
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-sm">
              {stats.streakDays} day{stats.streakDays !== 1 ? 's' : ''} of positive mood
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Weekly Progress</div>
          <Progress value={(stats.totalEntries / 7) * 100} className="h-2" />
          <div className="text-xs text-muted-foreground">
            {stats.totalEntries}/7 days logged
          </div>
        </div>
      </CardContent>
    </Card>
  );
}