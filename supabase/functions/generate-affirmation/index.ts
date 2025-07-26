import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const createMoodPrompt = (userInput: string, moodRating?: number) => {
  // If we have user text input, use it directly
  if (userInput && userInput.trim().length > 0) {
    return `The user is feeling: "${userInput}". Based on this, generate a short and positive affirmation to uplift their mood. Keep it 1-2 sentences, gentle and encouraging.`;
  }
  
  // Fallback to mood rating prompts if no text input
  const moodPrompts = {
    1: "The user is feeling very low today. Generate a compassionate, gentle affirmation that acknowledges their feelings while offering hope and self-compassion.",
    2: "The user is feeling low today. Generate an encouraging affirmation that validates their experience and reminds them of their strength.",
    3: "The user is feeling neutral today. Generate a motivating affirmation that helps them appreciate the present moment and find small joys.",
    4: "The user is feeling good today. Generate an uplifting affirmation that celebrates their positive energy and encourages them to spread kindness.",
    5: "The user is feeling excellent today. Generate an inspiring affirmation that celebrates their joy and helps them appreciate this wonderful moment."
  };
  
  return moodPrompts[moodRating as keyof typeof moodPrompts] || moodPrompts[3];
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { moodRating, userMood } = await req.json();
    
    // Validate that we have either mood rating or user mood text
    if (!userMood && (!moodRating || moodRating < 1 || moodRating > 5)) {
      throw new Error('Either userMood text or valid moodRating (1-5) is required.');
    }

    const prompt = createMoodPrompt(userMood, moodRating);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a compassionate mental wellness coach. Generate personalized, meaningful affirmations that are 1-2 sentences long. Focus on self-compassion, inner strength, and hope. Make them feel personal and genuine, not generic.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 100,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const affirmation = data.choices[0].message.content.trim();

    console.log(`Generated affirmation for ${userMood ? `mood text: "${userMood}"` : `mood rating: ${moodRating}`}: ${affirmation}`);

    return new Response(JSON.stringify({ affirmation }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-affirmation function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});