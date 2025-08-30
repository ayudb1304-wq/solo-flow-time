import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  userId: string;
  userEmail: string;
  userName?: string;
  plan: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, userEmail, userName, plan }: WelcomeEmailRequest = await req.json();

    console.log('Sending welcome email to:', { userId, userEmail, userName, plan });

    const emailResponse = await resend.emails.send({
      from: "Freelance Dashboard <onboarding@resend.dev>",
      to: [userEmail],
      subject: `🎉 Welcome to ${plan.toUpperCase()} - Your Freelance Journey Starts Now!`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Pro!</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
            .feature { display: flex; align-items: center; margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; }
            .feature-icon { font-size: 24px; margin-right: 15px; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Welcome to ${plan.toUpperCase()}!</h1>
            <p>Hi ${userName || 'there'}, your freelance business just got supercharged!</p>
          </div>
          
          <div class="content">
            <h2>🚀 You now have access to:</h2>
            
            <div class="feature">
              <div class="feature-icon">📊</div>
              <div>
                <strong>Advanced Analytics</strong><br>
                Track your revenue, client performance, and project insights with detailed charts and reports.
              </div>
            </div>
            
            <div class="feature">
              <div class="feature-icon">🏆</div>
              <div>
                <strong>Unlimited Projects & Clients</strong><br>
                No more limits! Manage as many projects and clients as your business needs.
              </div>
            </div>
            
            <div class="feature">
              <div class="feature-icon">📄</div>
              <div>
                <strong>Professional PDF Export</strong><br>
                Export beautiful, branded invoices and reports to impress your clients.
              </div>
            </div>
            
            <div class="feature">
              <div class="feature-icon">⏰</div>
              <div>
                <strong>Advanced Time Tracking</strong><br>
                Detailed time tracking with project categorization and billing integration.
              </div>
            </div>
            
            <div class="feature">
              <div class="feature-icon">🎨</div>
              <div>
                <strong>Custom Branding</strong><br>
                Add your logo and brand colors to make your invoices uniquely yours.
              </div>
            </div>
            
            <h3>🎯 What's Next?</h3>
            <p>Ready to take your freelance business to the next level? Here's how to get started:</p>
            
            <ol>
              <li><strong>Set up your profile:</strong> Add your business details and branding</li>
              <li><strong>Create your first project:</strong> Organize your work professionally</li>
              <li><strong>Track your time:</strong> Start logging hours for accurate billing</li>
              <li><strong>Generate invoices:</strong> Create professional invoices in minutes</li>
              <li><strong>Analyze your growth:</strong> Use the analytics dashboard to track your success</li>
            </ol>
            
            <div style="text-align: center;">
              <a href="${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'vercel.app') || 'https://your-app.com'}" class="cta-button">
                🚀 Start Building Your Business
              </a>
            </div>
            
            <h3>💡 Pro Tips for Success:</h3>
            <ul>
              <li>Set up automatic time tracking to never miss billable hours</li>
              <li>Use project templates to streamline your workflow</li>
              <li>Review your analytics monthly to identify growth opportunities</li>
              <li>Customize your invoice branding to look more professional</li>
            </ul>
            
            <p><strong>Need help getting started?</strong> Reply to this email and we'll be happy to assist you!</p>
          </div>
          
          <div class="footer">
            <p>Thanks for choosing our Freelance Dashboard!</p>
            <p>Questions? Just reply to this email - we're here to help! 🤝</p>
            <p style="font-size: 12px; margin-top: 20px;">
              This email was sent because you upgraded to our ${plan.toUpperCase()} plan. 
              If you have any questions, please don't hesitate to reach out.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);