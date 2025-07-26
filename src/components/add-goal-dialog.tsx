import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddGoalDialogProps {
  onGoalAdded: () => void;
}

export function AddGoalDialog({ onGoalAdded }: AddGoalDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    goalType: "",
    targetValue: "",
    startDate: undefined as Date | undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.goalType || !formData.targetValue) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to create goals");
        return;
      }

      const { error } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          goal_type: formData.goalType,
          target_value: parseFloat(formData.targetValue),
          current_value: 0,
          status: 'active'
        });

      if (error) throw error;

      toast.success("Goal created successfully! 🎯");
      setOpen(false);
      setFormData({
        title: "",
        description: "",
        goalType: "",
        targetValue: "",
        startDate: undefined,
      });
      onGoalAdded();
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error("Failed to create goal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Goal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Plus className="h-5 w-5" />
            Create Your Wellness Goal
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Goal Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Walk 20 minutes daily"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Add details about your goal..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="resize-none"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goalType">Goal Type *</Label>
            <Select value={formData.goalType} onValueChange={(value) => setFormData({ ...formData, goalType: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select goal type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily_log">Daily Activity</SelectItem>
                <SelectItem value="mood_average">Mood Average</SelectItem>
                <SelectItem value="streak">Positive Streak</SelectItem>
                <SelectItem value="weekly_target">Weekly Target</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetValue">Target Value *</Label>
            <Input
              id="targetValue"
              type="number"
              placeholder={
                formData.goalType === 'mood_average' ? "e.g., 4.0" :
                formData.goalType === 'daily_log' ? "e.g., 7 (days)" :
                formData.goalType === 'streak' ? "e.g., 5 (consecutive days)" :
                "e.g., 10"
              }
              value={formData.targetValue}
              onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
              step={formData.goalType === 'mood_average' ? "0.1" : "1"}
              min="0"
              required
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Goal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}