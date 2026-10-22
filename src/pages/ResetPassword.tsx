import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Lock, ArrowLeft, Check, CheckCircle } from "lucide-react";
import { NoIndexSEO } from "@/components/layout/SEO";

export default function ResetPassword() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [resetComplete, setResetComplete] = useState(false);
    const [formData, setFormData] = useState({
        password: "",
        confirmPassword: "",
    });

    const passwordRequirements = [
        { met: formData.password.length >= 8, text: "At least 8 characters" },
        { met: /[A-Z]/.test(formData.password), text: "One uppercase letter" },
        { met: /[a-z]/.test(formData.password), text: "One lowercase letter" },
        { met: /[0-9]/.test(formData.password), text: "One number" },
    ];

    const isPasswordStrong = passwordRequirements.filter(r => r.met).length >= 3;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.password) {
            toast({
                title: "Password required",
                description: "Please enter a new password",
                variant: "destructive",
            });
            return;
        }

        if (formData.password.length < 8) {
            toast({
                title: "Password too short",
                description: "Password must be at least 8 characters",
                variant: "destructive",
            });
            return;
        }

        if (!isPasswordStrong) {
            toast({
                title: "Weak password",
                description: "Please create a stronger password",
                variant: "destructive",
            });
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            toast({
                title: "Passwords don't match",
                description: "Please make sure your passwords match",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: formData.password,
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

            setResetComplete(true);
            toast({
                title: "Password updated!",
                description: "Your password has been successfully reset.",
            });

            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
                navigate("/dashboard");
            }, 2000);
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
            <NoIndexSEO title="Reset password" />
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
                            {resetComplete ? "Password Reset!" : "Create New Password"}
                        </CardTitle>
                        <CardDescription className="mt-2">
                            {resetComplete
                                ? "Your password has been updated successfully"
                                : "Enter your new password below"
                            }
                        </CardDescription>
                    </div>
                </CardHeader>

                {resetComplete ? (
                    <CardContent className="text-center py-8">
                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="h-8 w-8 text-green-500" />
                        </div>
                        <p className="text-muted-foreground mb-4">
                            Redirecting you to the dashboard...
                        </p>
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-brand" />
                    </CardContent>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-10"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        disabled={isLoading}
                                        autoComplete="new-password"
                                    />
                                </div>
                                {formData.password && (
                                    <div className="space-y-1.5 mt-2 p-3 bg-muted/50 rounded-lg">
                                        <div className="grid grid-cols-2 gap-1">
                                            {passwordRequirements.map((req, index) => (
                                                <div key={index} className="flex items-center gap-1.5 text-xs">
                                                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${req.met ? 'bg-green-500' : 'bg-muted-foreground/30'}`}>
                                                        {req.met && <Check className="w-2.5 h-2.5 text-white" />}
                                                    </div>
                                                    <span className={req.met ? 'text-green-500' : 'text-muted-foreground'}>
                                                        {req.text}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-10"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        disabled={isLoading}
                                        autoComplete="new-password"
                                    />
                                </div>
                                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                    <p className="text-xs text-destructive">Passwords do not match</p>
                                )}
                                {formData.confirmPassword && formData.password === formData.confirmPassword && formData.confirmPassword.length > 0 && (
                                    <p className="text-xs text-green-500 flex items-center gap-1">
                                        <Check className="h-3 w-3" /> Passwords match
                                    </p>
                                )}
                            </div>
                        </CardContent>

                        <CardFooter>
                            <Button
                                type="submit"
                                className="w-full bg-brand hover:bg-brand/90"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    "Update Password"
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                )}
            </Card>
        </div>
    );
}
