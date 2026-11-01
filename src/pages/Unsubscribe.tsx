import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, MailX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/layout/SEO";

type Status = "idle" | "working" | "success" | "error";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Unsubscribe landing page.
 *
 * The unsubscribe only happens when the visitor presses the button. Doing it
 * on page load (as before) lets link scanners that pre-open every URL in an
 * email (Outlook SafeLinks, Mimecast, ...) silently unsubscribe everybody.
 *
 * New emails carry ?token=<per-subscriber secret>. Old emails carry
 * ?owner=&email= and are still honoured through the legacy RPC.
 */
export default function Unsubscribe() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const legacyEmail = searchParams.get("email");
    const legacyOwner = searchParams.get("owner");
    const [status, setStatus] = useState<Status>("idle");

    const hasValidToken = !!token && UUID_RE.test(token);
    const hasValidLegacy = !!legacyEmail && !!legacyOwner && UUID_RE.test(legacyOwner);
    const linkIsValid = hasValidToken || hasValidLegacy;

    const handleUnsubscribe = async () => {
        if (!linkIsValid) return;
        setStatus("working");

        const { data, error } = hasValidToken
            ? await supabase.rpc("unsubscribe_by_token", { p_token: token! })
            : await supabase.rpc("unsubscribe_email", { p_email: legacyEmail!, p_owner_id: legacyOwner! });

        setStatus(!error && data ? "success" : "error");
    };

    const showError = status === "error" || (!linkIsValid && status === "idle");

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#f8fafc]">
            <SEO title="Unsubscribe - Boltfy" description="Manage your email subscription preferences." />
            <Card className="max-w-md w-full text-center shadow-2xl">
                <CardContent className="pt-12 pb-12 flex flex-col items-center">
                    {status === "idle" && linkIsValid && (
                        <>
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                                <MailX className="h-10 w-10 text-primary" />
                            </div>
                            <h1 className="text-2xl font-bold text-foreground mb-2">Unsubscribe from these emails?</h1>
                            <p className="text-muted-foreground text-sm max-w-[300px] mb-6">
                                You'll stop receiving emails from this sender. You can always sign up again later.
                            </p>
                            <Button onClick={handleUnsubscribe} size="lg">
                                Yes, unsubscribe me
                            </Button>
                        </>
                    )}

                    {status === "working" && (
                        <>
                            <Loader2 className="h-10 w-10 animate-spin text-primary mb-6" />
                            <h1 className="text-xl font-bold text-foreground mb-2">Processing your request...</h1>
                        </>
                    )}

                    {status === "success" && (
                        <>
                            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6">
                                <CheckCircle className="h-10 w-10 text-success" />
                            </div>
                            <h1 className="text-2xl font-bold text-foreground mb-2">You're unsubscribed</h1>
                            <p className="text-muted-foreground text-sm max-w-[280px]">
                                You won't receive any more emails from this sender.
                            </p>
                        </>
                    )}

                    {showError && (
                        <>
                            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
                                <XCircle className="h-10 w-10 text-destructive" />
                            </div>
                            <h1 className="text-2xl font-bold text-foreground mb-2">Something went wrong</h1>
                            <p className="text-muted-foreground text-sm max-w-[280px]">
                                We couldn't process this unsubscribe link. It may be incomplete or no longer valid.
                            </p>
                            {status === "error" && linkIsValid && (
                                <Button variant="outline" className="mt-6" onClick={handleUnsubscribe}>
                                    Try again
                                </Button>
                            )}
                        </>
                    )}

                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 mt-8 text-sm font-medium text-primary hover:underline"
                    >
                        Back to Boltfy
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}
