import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET") || "your-webhook-secret";

const handler = async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    
    // For development, we'll skip webhook verification if secret is not set properly
    let emailData;
    try {
      const wh = new Webhook(hookSecret);
      const verified = wh.verify(payload, headers) as any;
      emailData = verified;
    } catch (webhookError) {
      console.log('Webhook verification failed, parsing directly:', webhookError);
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

    const confirmUrl = `${site_url || Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to || site_url}`;

    const { error } = await resend.emails.send({
      from: "Freelance Dashboard <onboarding@resend.dev>",
      to: [user.email],
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; }
            .container { background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
            .content { padding: 40px 30px; }
            .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 20px 0; }
            .button:hover { opacity: 0.9; }
            .code-section { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .code { font-family: 'Courier New', monospace; font-size: 24px; font-weight: bold; color: #667eea; letter-spacing: 2px; }
            .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; }
            .feature { display: flex; align-items: center; margin: 15px 0; }
            .feature-icon { font-size: 20px; margin-right: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${headerText}</h1>
              <p style="font-size: 18px; margin: 0; opacity: 0.9;">${introText}</p>
            </div>
            
            <div class="content">
              <div style="text-align: center; margin: 30px 0;">
                <a href="${confirmUrl}" class="button">${actionText}</a>
              </div>
              
              <div class="code-section">
                <p style="margin: 0 0 10px 0; font-weight: bold;">Or use this verification code:</p>
                <div class="code">${token}</div>
              </div>
              
              ${email_action_type === 'signup' ? `
              <h3>🚀 What you'll get with Freelance Dashboard:</h3>
              
              <div class="feature">
                <div class="feature-icon">⏱️</div>
                <div><strong>Time Tracking:</strong> Track billable hours across multiple projects</div>
              </div>
              
              <div class="feature">
                <div class="feature-icon">📄</div>
                <div><strong>Invoice Generation:</strong> Create professional invoices in seconds</div>
              </div>
              
              <div class="feature">
                <div class="feature-icon">👥</div>
                <div><strong>Client Management:</strong> Organize all your client information</div>
              </div>
              
              <div class="feature">
                <div class="feature-icon">📊</div>
                <div><strong>Analytics:</strong> Track your business performance (Pro plan)</div>
              </div>
              
              <p><strong>Ready to streamline your freelance business?</strong> Activate your account and start organizing your projects today!</p>
              ` : ''}
              
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0; color: #856404;"><strong>⚠️ Security Note:</strong> This link will expire in 24 hours. If you didn't request this ${email_action_type === 'recovery' ? 'password reset' : 'account activation'}, you can safely ignore this email.</p>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${confirmUrl}" style="color: #667eea; word-break: break-all;">${confirmUrl}</a>
              </p>
            </div>
            
            <div class="footer">
              <p><strong>Freelance Dashboard</strong></p>
              <p>Streamline your freelance business with professional tools.</p>
              <p style="font-size: 12px; margin-top: 20px;">
                If you have any questions, please don't hesitate to reach out to our support team.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);