/**
 * Email Service for Boltfy
 * Actual sending happens in the send-email Supabase Edge Function, which
 * holds the Resend API key server-side. Nothing here ever sees the key —
 * a VITE_-prefixed secret would ship straight into the browser bundle.
 */
import { supabase } from "@/integrations/supabase/client";

export interface EmailResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

// Email template types
export type EmailTemplateType =
    | 'welcome'
    | 'password_reset'
    | 'form_submission'
    | 'campaign';

// Base email template with branding
export function getBaseTemplate(content: string, previewText?: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Boltfy</title>
  ${previewText ? `<span style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${previewText}</span>` : ''}
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f8fafc;
      color: #1e293b;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      padding: 40px;
    }
    .logo {
      text-align: center;
      margin-bottom: 32px;
    }
    .logo img {
      height: 48px;
      width: 48px;
      border-radius: 12px;
    }
    .content {
      line-height: 1.7;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      color: white !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 10px;
      font-weight: 600;
      margin: 24px 0;
    }
    .footer {
      text-align: center;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e2e8f0;
      color: #64748b;
      font-size: 14px;
    }
    h1 {
      color: #1e293b;
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 16px;
    }
    p {
      color: #475569;
      margin: 16px 0;
    }
    .highlight {
      background: #f1f5f9;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <img src="{{logoUrl}}" alt="Boltfy" />
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <p>Sent with ❤️ from Boltfy</p>
        <p>© ${new Date().getFullYear()} Boltfy. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;
}

// Pre-built email templates
export const emailTemplates = {
    welcome: (name: string) => getBaseTemplate(`
    <h1>Welcome to Boltfy, ${name}! 🎉</h1>
    <p>We're thrilled to have you on board. Boltfy helps you create beautiful forms, manage subscribers, and send email campaigns with ease.</p>
    <p>Here's what you can do:</p>
    <ul>
      <li>📝 Create stunning forms in minutes</li>
      <li>👥 Manage your subscriber lists</li>
      <li>📧 Send beautiful email campaigns</li>
      <li>📊 Track your growth with analytics</li>
    </ul>
    <p style="text-align: center;">
      <a href="{{dashboardUrl}}" class="button">Get Started</a>
    </p>
    <p>Need help? We're here for you. Just reply to this email!</p>
    <p>Cheers,<br>The Boltfy Team</p>
  `, `Welcome to Boltfy, ${name}! Let's build something amazing.`),

    passwordReset: (resetLink: string) => getBaseTemplate(`
    <h1>Reset Your Password</h1>
    <p>Hey there! 👋</p>
    <p>We received a request to reset your password. No worries, it happens to the best of us!</p>
    <p style="text-align: center;">
      <a href="${resetLink}" class="button">Reset Password</a>
    </p>
    <p>This link will expire in 1 hour for security reasons.</p>
    <div class="highlight">
      <strong>Didn't request this?</strong><br>
      If you didn't request a password reset, you can safely ignore this email. Your password won't change.
    </div>
    <p>Stay secure,<br>The Boltfy Team</p>
  `, 'Reset your Boltfy password'),

    formSubmission: (formName: string, data: Record<string, string>) => getBaseTemplate(`
    <h1>New Submission: ${formName} 📬</h1>
    <p>Great news! Someone just submitted your form.</p>
    <div class="highlight">
      ${Object.entries(data).map(([key, value]) => `
        <p style="margin: 8px 0;"><strong>${key}:</strong> ${value}</p>
      `).join('')}
    </div>
    <p style="text-align: center;">
      <a href="{{dashboardUrl}}/forms" class="button">View All Submissions</a>
    </p>
    <p>Keep growing! 🚀<br>The Boltfy Team</p>
  `, `New submission on ${formName}`),

    campaign: (subject: string, content: string, unsubscribeLink: string) => getBaseTemplate(`
    ${content}
    <div class="footer" style="margin-top: 40px;">
      <p style="font-size: 12px; color: #94a3b8;">
        You're receiving this because you subscribed to our updates.<br>
        <a href="${unsubscribeLink}" style="color: #6366f1;">Unsubscribe</a> from future emails.
      </p>
    </div>
  `, subject),
};

class EmailService {
    async sendFormNotification(
        formId: string,
        formName: string,
        data: Record<string, string>
    ): Promise<EmailResult> {
        const { data: result, error } = await supabase.functions.invoke('send-email', {
            body: {
                action: 'form-notification',
                formId,
                formName,
                submissionData: data,
            },
        });

        if (error) return { success: false, error: error.message };
        return result as EmailResult;
    }

    async sendCampaign(
        emails: string[],
        subject: string,
        content: string,
        unsubscribeBaseUrl: string
    ): Promise<EmailResult[]> {
        const results: EmailResult[] = [];

        for (const email of emails) {
            const unsubscribeLink = `${unsubscribeBaseUrl}&email=${encodeURIComponent(email)}`;
            const html = emailTemplates.campaign(subject, content, unsubscribeLink)
                .replace('{{logoUrl}}', `${window.location.origin}/icon.png`);

            const { data: result, error } = await supabase.functions.invoke('send-email', {
                body: { action: 'campaign', to: email, subject, html },
            });

            results.push(error ? { success: false, error: error.message } : (result as EmailResult));

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return results;
    }

    async sendContactMessage(input: {
        name: string;
        email: string;
        subject: string;
        message: string;
        website?: string;
    }): Promise<EmailResult> {
        try {
            const { data: result, error } = await supabase.functions.invoke("send-email", {
                body: { action: "contact", ...input },
            });

            if (error) return { success: false, error: error.message };
            if (result && typeof result === "object" && "success" in result && result.success === false) {
                const message = "error" in result ? String(result.error) : "Failed to send";
                return { success: false, error: message };
            }
            return (result as EmailResult) ?? { success: false, error: "No response from the email service" };
        } catch (err) {
            return {
                success: false,
                error: err instanceof Error ? err.message : "Could not reach the email service",
            };
        }
    }
}

// Export singleton instance
export const emailService = new EmailService();
