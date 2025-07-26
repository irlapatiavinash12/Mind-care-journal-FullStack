import { Button } from "@/components/ui/button";
import { Heart, TrendingUp, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-wellness.jpg";

interface HeroSectionProps {
  onGetStarted: () => void;
}

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 bg-gradient-hero opacity-90" />
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      
      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <div className="space-y-6 animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold text-foreground">
            Mind<span className="text-primary">Care</span>
            <br />
            <span className="text-4xl md:text-6xl">Journal</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Your personal space for mental wellness. Track your mood, reflect on your thoughts, 
            and discover insights for a healthier mind.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 text-sm md:text-base text-muted-foreground">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              <span>Daily Mood Tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span>Trend Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span>AI-Powered Insights</span>
            </div>
          </div>
          
          <div className="pt-8">
            <Button 
              onClick={onGetStarted}
              size="lg"
              className="bg-gradient-primary hover:shadow-glow transition-all duration-300 text-lg px-8 py-6"
            >
              Start Your Journey
            </Button>
          </div>
        </div>
      </div>
      
      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-32 right-16 w-32 h-32 bg-accent/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-20 w-16 h-16 bg-secondary/30 rounded-full blur-lg animate-pulse" style={{ animationDelay: '2s' }} />
    </section>
  );
}