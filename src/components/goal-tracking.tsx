import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, Trophy, Clock, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AddGoalDialog } from "./add-goal-dialog";

interface Goal {
  id: string;
  title: string;
  description: string;
  target_value: number;
  current_value: number;
  goal_type: string;
  status: string;
}

export function GoalTracking() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Update current values based on actual mood data
      const updatedGoals = await Promise.all(data.map(async (goal) => {
        let currentValue = goal.current_value;

        if (goal.goal_type === 'mood_average') {
          // Calculate average mood for the week
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

          const { data: moodData } = await supabase
            .from('mood_entries')
            .select('mood_rating')
            .gte('created_at', oneWeekAgo.toISOString());

          if (moodData && moodData.length > 0) {
            currentValue = moodData.reduce((sum, entry) => sum + entry.mood_rating, 0) / moodData.length;
          }
        } else if (goal.goal_type === 'daily_log') {
          // Count entries this week
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

          const { data: moodData } = await supabase
            .from('mood_entries')
            .select('id')
            .gte('created_at', oneWeekAgo.toISOString());

          currentValue = moodData?.length || 0;
        } else if (goal.goal_type === 'streak') {
          // Calculate positive mood streak
          const { data: moodData } = await supabase
            .from('mood_entries')
            .select('mood_rating, created_at')
            .order('created_at', { ascending: false })
            .limit(10);

          let streak = 0;
          if (moodData) {
            for (const entry of moodData) {
              if (entry.mood_rating >= 4) {
                streak++;
              } else {
                break;
              }
            }
          }
          currentValue = streak;
        }

        return { ...goal, current_value: currentValue };
      }));

      setGoals(updatedGoals);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getStatusColor = (current: number, target: number, status: string) => {
    if (status === 'completed') return 'default';
    if (current >= target) return 'default';
    if (current >= target * 0.8) return 'secondary';
    return 'outline';
  };

  const getGoalIcon = (goalType: string) => {
    switch (goalType) {
      case 'mood_average':
        return <Target className="h-4 w-4" />;
      case 'daily_log':
        return <Clock className="h-4 w-4" />;
      case 'streak':
        return <Trophy className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-secondary shadow-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Target className="h-5 w-5" />
            Goal Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading goals...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-secondary shadow-card border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-primary">
            <Target className="h-5 w-5" />
            Goal Tracking
          </CardTitle>
          <AddGoalDialog onGoalAdded={fetchGoals} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.length === 0 ? (
          <div className="space-y-4">
            <div className="text-center text-muted-foreground mb-4">
              Here's a sample goal to inspire your peace journey. 🌱
            </div>
            {/* Dummy Goal */}
            <div className="p-4 rounded-lg bg-white/30 space-y-3 opacity-75 border-2 border-dashed border-primary/30">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <div>
                    <h3 className="font-medium text-sm">Practice 5 minutes of meditation daily</h3>
                    <p className="text-xs text-muted-foreground">Build a daily meditation habit for inner peace</p>
                  </div>
                </div>
                <Badge variant="outline" className="border-primary/50 text-primary/70">
                  Suggested Goal
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>0/7 days</span>
                </div>
                <Progress 
                  value={0} 
                  className="h-2 opacity-60"
                />
              </div>
            </div>
          </div>
        ) : (
          goals.map((goal) => (
            <div key={goal.id} className="p-4 rounded-lg bg-white/50 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getGoalIcon(goal.goal_type)}
                  <div>
                    <h3 className="font-medium text-sm">{goal.title}</h3>
                    <p className="text-xs text-muted-foreground">{goal.description}</p>
                  </div>
                </div>
                <Badge variant={getStatusColor(goal.current_value, goal.target_value, goal.status)}>
                  {goal.current_value >= goal.target_value ? 'Achieved' : 'In Progress'}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>
                    {goal.goal_type === 'mood_average' 
                      ? `${goal.current_value.toFixed(1)}/${goal.target_value}`
                      : `${Math.floor(goal.current_value)}/${goal.target_value}`}
                  </span>
                </div>
                <Progress 
                  value={getProgressPercentage(goal.current_value, goal.target_value)} 
                  className="h-2"
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}