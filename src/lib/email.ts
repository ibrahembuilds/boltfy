/**
 * Client for the `send-email` Supabase Edge Function.
 *
 * The browser never sees the Resend key, never chooses recipients and never
 * supplies HTML for delivery to other people: campaigns are sent by id (the
 * server loads the campaign and the sender's own active subscribers), and
 * form notifications are sent by submission id (the server loads the stored
 * submission). See supabase/functions/send-email/index.ts.
 */
import { supabase } from "@/integrations/supabase/client";

export interface SendResult {
    success: boolean;
    /** True when the server has no email provider key: nothing was really delivered. */
    dryRun?: boolean;
    error?: string;
}

export interface CampaignSendResult extends SendResult {
    status?: "sent" | "failed";
    delivered?: number;
    failed?: number;
    total?: number;
    timedOut?: boolean;
}

/** supabase-js hides the response body of non-2xx replies; dig the server's message out. */
async function messageFromError(error: unknown): Promise<string> {
    const fallback = error instanceof Error ? error.message : "Request failed";
    const context = (error as { context?: unknown } | null)?.context;
    if (context instanceof Response) {
        try {
            const body = await context.clone().json();
            if (body && typeof body.error === "string") return body.error;
        } catch {
            /* not JSON */
        }
    }
    return fallback;
}

async function invoke<T>(body: Record<string, unknown>): Promise<T> {
    const { data, error } = await supabase.functions.invoke("send-email", { body });
    if (error) throw new Error(await messageFromError(error));
    return data as T;
}

export const emailService = {
    /** Send a saved campaign to the signed-in user's active subscribers. */
    sendCampaign(campaignId: string): Promise<CampaignSendResult> {
        return invoke<CampaignSendResult>({ action: "send-campaign", campaignId });
    },

    /** Send a preview to the signed-in user's own login address. */
    sendTestCampaign(subject: string, content: string): Promise<SendResult & { sentTo?: string }> {
        return invoke({ action: "test-campaign", subject, content });
    },

    /** Notify the form owner about a stored submission (at most once per submission). */
    sendFormNotification(submissionId: string): Promise<SendResult & { skipped?: boolean }> {
        return invoke({ action: "form-notification", submissionId });
    },
};
