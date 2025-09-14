import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { email } = await req.json();
    
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    console.log('Processing resend verification request for email:', email);

    // Find user by email in auth.users table
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error fetching users:', userError);
      throw new Error('Failed to find user');
    }

    const user = userData.users.find(u => u.email === email);
    
    if (!user) {
      // Don't reveal if email exists or not for security
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'If this email is registered, a new verification email has been sent' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Check if user is already verified
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email_verified')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      throw new Error('Failed to check verification status');
    }

    if (profile?.email_verified) {
      return new Response(JSON.stringify({ 
        error: 'Email is already verified' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Rate limiting - check if recent verification email was sent
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const { data: recentTokens, error: recentError } = await supabase
      .from('email_verification_tokens')
      .select('created_at')
      .eq('user_id', user.id)
      .gte('created_at', oneHourAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (recentError) {
      console.error('Error checking recent tokens:', recentError);
    } else if (recentTokens && recentTokens.length > 0) {
      return new Response(JSON.stringify({ 
        error: 'Please wait at least 1 hour before requesting a new verification email' 
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Call the send-verification-email function
    const sendEmailResponse = await fetch(`${supabaseUrl}/functions/v1/send-verification-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.id,
        email: user.email,
        isResend: true
      })
    });

    if (!sendEmailResponse.ok) {
      const errorData = await sendEmailResponse.json();
      console.error('Failed to send verification email:', errorData);
      throw new Error('Failed to send verification email');
    }

    console.log('Resend verification email successful for user:', user.id);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'A new verification email has been sent to your inbox' 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in resend-verification function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
};

serve(handler);