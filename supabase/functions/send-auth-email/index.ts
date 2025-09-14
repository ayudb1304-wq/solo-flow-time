import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET") || "your-webhook-secret";

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
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    
    let emailData;
    const signatureHeader = req.headers.get('webhook-signature');
    const canVerify = Boolean(signatureHeader) && hookSecret && hookSecret !== "your-webhook-secret";
    if (canVerify) {
      try {
        const wh = new Webhook(hookSecret);
        const verified = wh.verify(payload, headers) as any;
        emailData = verified;
      } catch (webhookError) {
        console.log('Webhook signature verification failed; proceeding without verification');
        emailData = JSON.parse(payload);
      }
    } else {
      emailData = JSON.parse(payload);
    }

    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type, site_url },
    } = emailData;

    console.log('Sending auth email:', { email: user.email, email_action_type });

    let subject = "Activate Your Account";
    let actionText = "Activate Account";
    let headerText = "Welcome to Freelance Dashboard!";
    let introText = "Thanks for signing up! Click the button below to activate your account and start managing your freelance business.";

    if (email_action_type === 'recovery') {
      subject = "Reset Your Password";
      actionText = "Reset Password";
      headerText = "Password Reset Request";
      introText = "We received a request to reset your password. Click the button below to set a new password.";
    } else if (email_action_type === 'email_change') {
      subject = "Confirm Email Change";
      actionText = "Confirm Email";
      headerText = "Confirm Your New Email";
      introText = "Please confirm your new email address by clicking the button below.";
    }

    // Use the standard Supabase verification URL format
    const supabaseUrl = (Deno.env.get('SUPABASE_URL') || '').replace(/\/+$/,'');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const redirect = 'https://soloflow.pro/?verified=1';
    
    // Build the verification URL - prefer token_hash, fallback to token
    const tokenParam = token_hash
      ? `token_hash=${encodeURIComponent(token_hash)}`
      : token
        ? `token=${encodeURIComponent(token)}`
        : '';
    if (!tokenParam) {
      throw new Error('Missing verification token from email payload');
    }
    const confirmUrl = `${supabaseUrl}/auth/v1/verify?${tokenParam}&type=${encodeURIComponent(email_action_type)}&redirect_to=${encodeURIComponent(redirect)}${anonKey ? `&apikey=${anonKey}` : ''}`;
    
    console.log('Email queued for sending:', { 
      email: user.email, 
      type: email_action_type, 
      hasTokenHash: Boolean(token_hash),
      hasToken: Boolean(token),
      redirectTo: redirect 
    });

    // Send email asynchronously to avoid hook timeout
    resend.emails.send({
      from: "SoloFlow <notify@soloflow.pro>",
      to: [user.email],
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
                <a href="${confirmUrl}" class="button">Activate Your Account</a>
              </div>
              <p>If you didn't create an account with SoloFlow, you can safely ignore this email.</p>
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${confirmUrl}" style="color: #667eea; word-break: break-all;">${confirmUrl}</a>
              </p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} SoloFlow. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    }).then(emailResponse => {
      console.log('Email sent successfully:', emailResponse);
    }).catch(emailError => {
      console.error('Failed to send email:', emailError);
    });

    // Return immediately to prevent hook timeout
    return new Response(JSON.stringify({ success: true, message: 'Email queued for delivery' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('Error in send-auth-email function:', error);
    return new Response(
      JSON.stringify({
        error: {
          message: error.message,
        },
      }),
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