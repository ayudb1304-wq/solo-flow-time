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
  
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    
    if (!token) {
      return new Response(
        '<html><body><h1>Invalid Verification Link</h1><p>No verification token provided.</p></body></html>',
        { 
          status: 400, 
          headers: { 'Content-Type': 'text/html', ...corsHeaders } 
        }
      );
    }

    console.log('Processing email verification for token:', token.substring(0, 8) + '...');

    // Find the verification token
    const { data: tokenData, error: tokenError } = await supabase
      .from('email_verification_tokens')
      .select('*')
      .eq('token', token)
      .is('used_at', null)
      .single();

    if (tokenError || !tokenData) {
      console.log('Invalid or already used token:', tokenError?.message);
      return new Response(
        `<html><body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>Invalid Verification Link</h1>
          <p>This verification link is invalid or has already been used.</p>
          <p><a href="https://soloflow.pro/auth" style="color: #667eea;">Request a new verification email</a></p>
        </body></html>`,
        { 
          status: 400, 
          headers: { 'Content-Type': 'text/html', ...corsHeaders } 
        }
      );
    }

    // Check if token has expired
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    
    if (now > expiresAt) {
      console.log('Token has expired:', { now, expiresAt });
      return new Response(
        `<html><body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>Verification Link Expired</h1>
          <p>This verification link has expired. Please request a new one.</p>
          <p><a href="https://soloflow.pro/auth" style="color: #667eea;">Request a new verification email</a></p>
        </body></html>`,
        { 
          status: 400, 
          headers: { 'Content-Type': 'text/html', ...corsHeaders } 
        }
      );
    }

    // Mark token as used
    const { error: updateTokenError } = await supabase
      .from('email_verification_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id);

    if (updateTokenError) {
      console.error('Error marking token as used:', updateTokenError);
      throw new Error('Failed to update token status');
    }

    // Update user profile as verified
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        email_verified: true,
        email_verification_token: null,
        email_verification_expires_at: null 
      })
      .eq('user_id', tokenData.user_id);

    if (profileError) {
      console.error('Error updating profile verification status:', profileError);
      throw new Error('Failed to update profile');
    }

    console.log('Email verification successful for user:', tokenData.user_id);

    // Redirect to app with success message
    return new Response(null, {
      status: 302,
      headers: {
        'Location': 'https://soloflow.pro/?verified=success',
        ...corsHeaders
      }
    });

  } catch (error: any) {
    console.error('Error in verify-email-token function:', error);
    return new Response(
      `<html><body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
        <h1>Verification Failed</h1>
        <p>An error occurred while processing your verification. Please try again or contact support.</p>
        <p><a href="https://soloflow.pro/auth" style="color: #667eea;">Go to Login</a></p>
      </body></html>`,
      {
        status: 500,
        headers: { 
          'Content-Type': 'text/html',
          ...corsHeaders,
        },
      }
    );
  }
};

serve(handler);