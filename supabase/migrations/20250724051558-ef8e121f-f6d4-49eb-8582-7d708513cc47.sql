
-- Create profiles table to store user names
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can create their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'last_name', '')
  );
  RETURN new;
END;
$$;

-- Create trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create goals table
CREATE TABLE public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_value NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('mood_average', 'daily_log', 'streak')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS for goals
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own goals" 
  ON public.goals 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own goals" 
  ON public.goals 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" 
  ON public.goals 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" 
  ON public.goals 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Insert some dummy mood data for the last 15 days
INSERT INTO public.mood_entries (user_id, mood_rating, note, created_at) 
SELECT 
  auth.uid(),
  (RANDOM() * 4 + 1)::INTEGER,
  CASE 
    WHEN (RANDOM() * 4 + 1)::INTEGER >= 4 THEN 'Had a great day today!'
    WHEN (RANDOM() * 4 + 1)::INTEGER = 3 THEN 'Feeling okay, nothing special'
    WHEN (RANDOM() * 4 + 1)::INTEGER = 2 THEN 'Bit of a tough day'
    ELSE 'Struggling a bit today'
  END,
  NOW() - INTERVAL '1 day' * generate_series(0, 14)
WHERE auth.uid() IS NOT NULL;

-- Insert some default goals
INSERT INTO public.goals (user_id, title, description, target_value, current_value, goal_type)
SELECT 
  auth.uid(),
  'Maintain Good Mood',
  'Keep your average mood rating above 3.5',
  3.5,
  3.2,
  'mood_average'
WHERE auth.uid() IS NOT NULL;

INSERT INTO public.goals (user_id, title, description, target_value, current_value, goal_type)
SELECT 
  auth.uid(),
  'Daily Mood Logging',
  'Log your mood every day this week',
  7,
  5,
  'daily_log'
WHERE auth.uid() IS NOT NULL;

INSERT INTO public.goals (user_id, title, description, target_value, current_value, goal_type)
SELECT 
  auth.uid(),
  'Positive Mood Streak',
  'Maintain a mood rating of 4 or higher for 5 consecutive days',
  5,
  3,
  'streak'
WHERE auth.uid() IS NOT NULL;
