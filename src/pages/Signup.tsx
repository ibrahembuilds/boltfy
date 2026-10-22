import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Mail, Lock, User, Check, ArrowLeft, Sparkles } from "lucide-react";
import { NoIndexSEO } from "@/components/layout/SEO";

export default function Signup() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { signUp, signInWithGoogle } = useAuth();
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const passwordChecks = [
        { met: formData.password.length >= 8, text: "8+ characters" },
        { met: /[A-Z]/.test(formData.password) && /[a-z]/.test(formData.password), text: "Upper & lowercase" },
        { met: /[0-9]/.test(formData.password), text: "A number" },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.email || !formData.password) {
            toast({
                title: "Missing info",
                description: "Please fill in all fields",
                variant: "destructive",
            });
            return;
        }

        if (formData.name.trim().length < 2) {
            toast({
                title: "Name too short",
                description: "We need at least 2 characters",
                variant: "destructive",
            });
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            toast({
                title: "Invalid email",
                description: "Please enter a valid email",
                variant: "destructive",
            });
            return;
        }

        if (formData.password.length < 8) {
            toast({
                title: "Password too short",
                description: "Use at least 8 characters",
                variant: "destructive",
            });
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            toast({
                title: "Passwords don't match",
                description: "Please check and try again",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);

        const { error } = await signUp(formData.email, formData.password, formData.name);

        if (error) {
            toast({
                title: "Sign up failed",
                description: error.message || "Please try again",
                variant: "destructive",
            });
            setIsLoading(false);
            return;
        }

        toast({
            title: "Account created",
            description: "Check your email to verify your account",
        });

        navigate("/login");
    };

    const handleGoogleSignIn = async () => {
        setIsGoogleLoading(true);
        const { error } = await signInWithGoogle();
        if (error) {
            toast({
                title: "Google sign up failed",
                description: error.message,
                variant: "destructive",
            });
            setIsGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-500">
            <NoIndexSEO title="Sign up" />
            {/* Background effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 dark:opacity-30 mix-blend-multiply dark:mix-blend-normal"
                    style={{
                        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        top: "5%",
                        right: "15%",
                    }}
                />
                <div
                    className="absolute w-[400px] h-[400px] rounded-full blur-[100px] opacity-10 dark:opacity-20 mix-blend-multiply dark:mix-blend-normal"
                    style={{
                        background: "linear-gradient(135deg, #ec4899, #f43f5e)",
                        bottom: "10%",
                        left: "15%",
                    }}
                />
            </div>

            {/* Back to home */}
            <Link to="/" className="absolute top-6 left-6 z-20">
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" />
                    Home
                </Button>
            </Link>

            <Card className="w-full max-w-md border-border bg-card/80 backdrop-blur-xl shadow-2xl relative z-10">
                <CardHeader className="text-center space-y-4">
                    <Link to="/" className="mx-auto group">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 p-0.5 shadow-lg group-hover:scale-110 transition-transform">
                            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center overflow-hidden">
                                <img src="/icon.png" alt="Boltfy" className="w-10 h-10 object-contain" />
                            </div>
                        </div>
                    </Link>
                    <div>
                        <CardTitle className="text-2xl font-bold text-foreground">
                            Create your account
                        </CardTitle>
                        <CardDescription className="mt-2 text-muted-foreground">
                            Start building beautiful forms for free
                        </CardDescription>
                    </div>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-foreground/80">Your name</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="What should we call you?"
                                    className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    disabled={isLoading}
                                    autoComplete="name"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-foreground/80">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    disabled={isLoading}
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-foreground/80">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Create a strong password"
                                    className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    disabled={isLoading}
                                    autoComplete="new-password"
                                />
                            </div>
                            {formData.password && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {passwordChecks.map((check, index) => (
                                        <div
                                            key={index}
                                            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${check.met
                                                ? 'bg-green-500/20 text-green-500 dark:text-green-400'
                                                : 'bg-muted text-muted-foreground'
                                                }`}
                                        >
                                            {check.met && <Check className="w-3 h-3" />}
                                            {check.text}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-foreground/80">Confirm password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Type it again"
                                    className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    disabled={isLoading}
                                    autoComplete="new-password"
                                />
                            </div>
                            {formData.confirmPassword && formData.password === formData.confirmPassword && (
                                <p className="text-xs text-green-400 flex items-center gap-1">
                                    <Check className="h-3 w-3" /> Passwords match
                                </p>
                            )}
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-4">
                        <Button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base shadow-lg shadow-primary/20"
                            disabled={isLoading || isGoogleLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                <>
                                    Get Started
                                    <Sparkles className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>

                        <div className="relative w-full py-2">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full h-12 gap-3 border-border bg-background hover:bg-muted text-foreground"
                            onClick={handleGoogleSignIn}
                            disabled={isLoading || isGoogleLoading}
                        >
                            {isGoogleLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            ) : (
                                <svg className="h-5 w-5" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.16H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.84l3.66-2.75z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.16l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                            )}
                            Google
                        </Button>

                        <p className="text-sm text-center text-muted-foreground mt-2">
                            Already have an account?{" "}
                            <Link to="/login" className="text-primary hover:underline font-medium">
                                Sign in
                            </Link>
                        </p>

                        <div className="mt-4 pt-4 border-t border-border/50 text-center">
                            <p className="text-[10px] text-muted-foreground max-w-[280px] mx-auto leading-relaxed">
                                By signing up, you agree to our{" "}
                                <Link to="/terms" className="underline hover:text-foreground transition-colors">Terms of Service</Link>{" "}
                                and{" "}
                                <Link to="/privacy" className="underline hover:text-foreground transition-colors">Privacy Policy</Link>.
                            </p>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
