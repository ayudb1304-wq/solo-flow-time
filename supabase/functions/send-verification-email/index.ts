import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate secure random token
function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { userId, email, isResend = false } = await req.json();
    
    if (!userId || !email) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    console.log('Processing verification email:', { userId, email, isResend });

    // Generate secure verification token
    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store verification token in database
    const { error: tokenError } = await supabase
      .from('email_verification_tokens')
      .insert({
        user_id: userId,
        token,
        expires_at: expiresAt.toISOString()
      });

    if (tokenError) {
      console.error('Error storing verification token:', tokenError);
      throw new Error('Failed to store verification token');
    }

    // Update user profile with verification status
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        email_verification_token: token,
        email_verification_expires_at: expiresAt.toISOString(),
        email_verified: false
      }, {
        onConflict: 'user_id'
      });

    if (profileError) {
      console.error('Error updating profile:', profileError);
      throw new Error('Failed to update profile');
    }

    // Create verification URL
    const verificationUrl = `${supabaseUrl}/functions/v1/verify-email-token?token=${token}`;

    const subject = isResend ? "Verify Your Email - New Link" : "Welcome to SoloFlow - Verify Your Email";
    const headerText = isResend ? "New Verification Link" : "Welcome to SoloFlow!";
    const introText = isResend 
      ? "Here's your new verification link. This link will expire in 24 hours."
      : "Thanks for signing up! Please verify your email address to complete registration and access all features.";

    // Send verification email using background task
    EdgeRuntime.waitUntil(
      resend.emails.send({
        from: "SoloFlow <notify@soloflow.pro>",
        to: [email],
        subject,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f7f8fc; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
              .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 600; }
              .content { padding: 40px 30px; }
              .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; transition: transform 0.2s ease; }
              .button:hover { transform: translateY(-2px); }
              .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
              .security-note { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>SoloFlow</h1>
              </div>
              <div class="content">
                <h2>${headerText}</h2>
                <p>${introText}</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${verificationUrl}" class="button">Verify Email Address</a>
                </div>
                <div class="security-note">
                  <strong>Security Note:</strong> This verification link will expire in 24 hours for your security. If you didn't create an account with SoloFlow, you can safely ignore this email.
                </div>
                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                  If the button doesn't work, copy and paste this link into your browser:<br>
                  <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">${verificationUrl}</a>
                </p>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} SoloFlow. All rights reserved.</p>
                <p>This is an automated email. Please do not reply.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }).then(emailResponse => {
        console.log('Verification email sent successfully:', emailResponse);
      }).catch(emailError => {
        console.error('Failed to send verification email:', emailError);
      })
    );

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Verification email sent successfully',
      expiresAt: expiresAt.toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in send-verification-email function:', error);
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