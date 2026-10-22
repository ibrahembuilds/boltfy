import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, MailX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/layout/SEO";

type Status = "loading" | "success" | "error";

export default function Unsubscribe() {
    const [searchParams] = useSearchParams();
    const email = searchParams.get("email");
    const owner = searchParams.get("owner");
    const [status, setStatus] = useState<Status>("loading");

    useEffect(() => {
        const run = async () => {
            if (!email || !owner) {
                setStatus("error");
                return;
            }

            const { data, error } = await supabase.rpc("unsubscribe_email", {
                p_email: email,
                p_owner_id: owner,
            });

            setStatus(!error && data ? "success" : "error");
        };

        run();
    }, [email, owner]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#f8fafc]">
            <SEO
                title="Unsubscribe"
                description="Manage your email subscription preferences for Boltfy campaigns."
                path="/unsubscribe"
                robots="noindex, follow"
            />
            <Card className="max-w-md w-full text-center shadow-2xl">
                <CardContent className="pt-12 pb-12 flex flex-col items-center">
                    {status === "loading" && (
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
                                {email} won't receive any more emails from this sender.
                            </p>
                        </>
                    )}

                    {status === "error" && (
                        <>
                            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
                                <XCircle className="h-10 w-10 text-destructive" />
                            </div>
                            <h1 className="text-2xl font-bold text-foreground mb-2">Something went wrong</h1>
                            <p className="text-muted-foreground text-sm max-w-[280px]">
                                We couldn't process this unsubscribe link. It may be invalid or expired.
                            </p>
                        </>
                    )}

                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 mt-8 text-sm font-medium text-primary hover:underline"
                    >
                        <MailX className="h-4 w-4" />
                        Back to Boltfy
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}
