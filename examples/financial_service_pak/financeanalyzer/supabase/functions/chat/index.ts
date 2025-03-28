import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  message: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { message } = await req.json() as ChatRequest;

    // Get the user from the auth header
    const authHeader = req.headers.get('Authorization')!;
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get user's portfolio and watchlist for context
    const { data: portfolio } = await supabase
      .from('portfolios')
      .select('symbol, quantity, average_price')
      .eq('user_id', user.id);

    const { data: watchlist } = await supabase
      .from('watchlist')
      .select('symbol, notes')
      .eq('user_id', user.id);

    // TODO: Replace with actual OpenAI API call
    const aiResponse = `This is a mock response. Your portfolio has ${portfolio?.length || 0} stocks and ${watchlist?.length || 0} watched items.`;

    // Store the chat history
    await supabase.from('chat_history').insert({
      user_id: user.id,
      message,
      response: aiResponse,
    });

    return new Response(
      JSON.stringify({ response: aiResponse }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});