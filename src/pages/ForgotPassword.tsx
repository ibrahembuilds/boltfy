import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { NoIndexSEO } from "@/components/layout/SEO";

export default function ForgotPassword() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [email, setEmail] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            toast({
                title: "Email required",
                description: "Please enter your email address",
                variant: "destructive",
            });
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast({
                title: "Invalid email",
                description: "Please enter a valid email address",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) {
                toast({
                    title: "Error",
                    description: error.message,
                    variant: "destructive",
                });
                setIsLoading(false);
                return;
            }

            setEmailSent(true);
            toast({
                title: "Email sent!",
                description: "Check your inbox for password reset instructions.",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Something went wrong. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <NoIndexSEO title="Forgot password" />
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-brand/20 rounded-full blur-[100px]" />
                <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-brand-light/15 rounded-full blur-[100px]" />
            </div>

            {/* Back to login */}
            <Link to="/login" className="absolute top-6 left-6 z-20">
                <Button variant="ghost" size="sm" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Login
                </Button>
            </Link>

            <Card className="w-full max-w-md relative z-10 border-border/50 shadow-2xl backdrop-blur-sm bg-card/95">
                <CardHeader className="text-center space-y-4">
                    <Link to="/" className="mx-auto">
                        <img src="/icon.png" alt="Boltfy" className="w-16 h-16 rounded-2xl shadow-lg" />
                    </Link>
                    <div>
                        <CardTitle className="text-2xl font-bold">
                            {emailSent ? "Check Your Email" : "Reset Password"}
                        </CardTitle>
                        <CardDescription className="mt-2">
                            {emailSent
                                ? "We've sent you a link to reset your password"
                                : "Enter your email and we'll send you reset instructions"
                            }
                        </CardDescription>
                    </div>
                </CardHeader>

                {emailSent ? (
                    <CardContent className="text-center py-8">
                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="h-8 w-8 text-green-500" />
                        </div>
                        <p className="text-muted-foreground mb-6">
                            We sent an email to <strong className="text-foreground">{email}</strong>
                        </p>
                        <p className="text-sm text-muted-foreground mb-6">
                            Didn't receive it? Check your spam folder or try again.
                        </p>
                        <Button variant="outline" onClick={() => setEmailSent(false)}>
                            Try Another Email
                        </Button>
                    </CardContent>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        className="pl-10"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={isLoading}
                                        autoComplete="email"
                                    />
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="flex flex-col gap-4">
                            <Button
                                type="submit"
                                className="w-full bg-brand hover:bg-brand/90"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    "Send Reset Link"
                                )}
                            </Button>

                            <p className="text-sm text-center text-muted-foreground">
                                Remember your password?{" "}
                                <Link to="/login" className="text-brand hover:underline font-medium">
                                    Sign in
                                </Link>
                            </p>
                        </CardFooter>
                    </form>
                )}
            </Card>
        </div>
    );
}
