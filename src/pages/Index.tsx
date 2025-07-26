import { useState, useEffect, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HeroSection } from "@/components/hero-section";
import { MoodEntryForm } from "@/components/mood-entry-form";
import { AffirmationCard } from "@/components/affirmation-card";
import { MoodTrendsChart } from "@/components/mood-trends-chart";
import { WeeklyReport } from "@/components/weekly-report";
import { GoalTracking } from "@/components/goal-tracking";
import { ErrorBoundary } from "@/components/error-boundary";
import { DashboardSkeleton, ChartSkeleton, WeeklyReportSkeleton } from "@/components/loading-skeleton";
import { LogOut, User, Calendar, TrendingUp, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

const Index = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [affirmation, setAffirmation] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ first_name?: string; last_name?: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const initializeAuth = async () => {
      try {
        // Set a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          setError("Loading is taking longer than expected. Please refresh the page.");
          setLoading(false);
        }, 15000); // 15 seconds timeout

        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            try {
              setSession(session);
              setUser(session?.user ?? null);
              if (session?.user) {
                await fetchUserProfile(session.user.id);
              }
              clearTimeout(timeoutId);
              setLoading(false);
              setError(null);
            } catch (error) {
              console.error('Error in auth state change:', error);
              setError("Failed to load user data. Please try refreshing the page.");
              clearTimeout(timeoutId);
              setLoading(false);
            }
          }
        );

        // Check for existing session with timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 10000)
        );

        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        }
        clearTimeout(timeoutId);
        setLoading(false);
        setError(null);

        return () => {
          clearTimeout(timeoutId);
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing auth:', error);
        setError("Failed to initialize authentication. Please refresh the page.");
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
      );

      const profilePromise = supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', userId)
        .maybeSingle();

      const { data, error } = await Promise.race([profilePromise, timeoutPromise]) as any;

      if (error) {
        console.error('Error fetching profile:', error);
        setUserProfile(null);
        return;
      }

      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserProfile(null);
      // Don't set a global error for profile fetch failures, just log it
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Signed out successfully");
    } catch (error: any) {
      toast.error("Error signing out");
    }
  };

  const handleMoodSubmit = async (entry: { rating: number; note: string }) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('mood_entries')
        .insert({
          user_id: user.id,
          mood_rating: entry.rating,
          note: entry.note
        })
        .select()
        .single();

      if (error) throw error;
      
      // Generate AI affirmation based on mood and note
      generateAffirmation(entry.rating, entry.note);
    } catch (error) {
      console.error('Error saving mood entry:', error);
      toast.error('Failed to save mood entry');
    }
  };

  const generateAffirmation = async (moodRating: number, userMoodText?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-affirmation', {
        body: { 
          moodRating,
          userMood: userMoodText 
        }
      });
      
      if (error) throw error;
      
      // Display affirmation
      setAffirmation(data.affirmation);
    } catch (error) {
      console.error('Error generating affirmation:', error);
      // Show fallback affirmation
      setAffirmation("You are not alone. Brighter days are ahead. You have the strength to overcome any challenge.");
      toast.error("Could not generate personalized affirmation, but remember you are valued and strong.");
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Card className="bg-gradient-card shadow-card border-0 mx-4 max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Connection Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <Button 
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <div className="container mx-auto px-4 py-8">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <nav className="absolute top-0 right-0 p-6 z-20">
          <Button 
            onClick={() => navigate('/auth')}
            variant="outline"
            className="bg-white/10 backdrop-blur-sm border-white/20 text-foreground hover:bg-white/20"
          >
            Sign In
          </Button>
        </nav>
        <HeroSection onGetStarted={() => navigate('/auth')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">MindCare Journal</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>
                {userProfile?.first_name || userProfile?.last_name 
                  ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim()
                  : user.email}
              </span>
            </div>
            <Button 
              onClick={handleSignOut}
              variant="outline"
              size="sm"
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Welcome Message */}
          <Card className="bg-gradient-card shadow-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <TrendingUp className="h-5 w-5" />
                Welcome back!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Ready to track your mood today? Taking a moment to reflect on how you're feeling 
                is an important step toward mental wellness.
              </p>
            </CardContent>
          </Card>

          {/* Mood Entry Form */}
          <ErrorBoundary>
            <MoodEntryForm onSubmit={handleMoodSubmit} />
          </ErrorBoundary>

          {/* AI Affirmation */}
          <ErrorBoundary>
            <AffirmationCard affirmation={affirmation} />
          </ErrorBoundary>

          {/* Mood Trends Chart */}
          <ErrorBoundary>
            <Suspense fallback={<ChartSkeleton />}>
              <MoodTrendsChart />
            </Suspense>
          </ErrorBoundary>

          {/* Weekly Report */}
          <ErrorBoundary>
            <Suspense fallback={<WeeklyReportSkeleton />}>
              <WeeklyReport />
            </Suspense>
          </ErrorBoundary>

          {/* Goal Tracking */}
          <ErrorBoundary>
            <Suspense fallback={<ChartSkeleton />}>
              <GoalTracking />
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
};

export default Index;
