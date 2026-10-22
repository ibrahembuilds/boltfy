import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Send, CheckCircle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { emailService } from "@/lib/email";
import { SITE_EMAIL } from "@/seo/site";

export default function Contact() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [form, setForm] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
        website: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const result = await emailService.sendContactMessage(form);
        setLoading(false);

        if (!result.success) {
            toast({
                title: "Message not sent",
                description: result.error || "Try again, or email support directly.",
                variant: "destructive",
            });
            return;
        }

        setSubmitted(true);
        toast({
            title: "Message sent",
            description: `We sent this to ${SITE_EMAIL}.`,
        });
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Navigation */}
            <nav className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 group">
                        <BrandLogo size="md" />
                    </Link>
                    <div className="flex items-center gap-6">
                        <Link to="/blog" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Guides</Link>
                        <Link to="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">About</Link>
                        <Link to="/login">
                            <Button variant="ghost" className="text-sm">Log in</Button>
                        </Link>
                        <Link to="/signup">
                            <Button size="sm" className="bg-primary hover:bg-primary/90">Sign up</Button>
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="flex-1">
                <section className="py-24 px-6 relative overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 bg-[radial-gradient(circle_at_top,_var(--primary)_0%,_transparent_50%)] opacity-[0.03]" />

                    <div className="max-w-7xl mx-auto">
                        <div className="grid lg:grid-cols-2 gap-16">
                            <div>
                                <h1 className="text-5xl font-bold tracking-tight mb-6">Contact Boltfy</h1>
                                <p className="text-xl text-muted-foreground mb-12 max-w-lg leading-relaxed">
                                    Questions about an account, a published form, or email delivery go to {SITE_EMAIL}. The form on this page sends there, with your address as the reply-to.
                                </p>

                                <div className="space-y-8">
                                    <div className="flex gap-6">
                                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                            <Mail className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold mb-1">Email</h2>
                                            <a href={`mailto:${SITE_EMAIL}`} className="text-primary hover:underline">{SITE_EMAIL}</a>
                                            <p className="text-muted-foreground mt-2">Include the form link if the question is about a form you published. There is no live chat and no public office.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <Card className="border-border bg-card/50 backdrop-blur-sm shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-5">
                                        <Send className="h-32 w-32 rotate-12" />
                                    </div>
                                    <CardContent className="p-8 md:p-12">
                                        {submitted ? (
                                            <div className="text-center py-12">
                                                <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6 scale-animation">
                                                    <CheckCircle className="h-10 w-10 text-success" />
                                                </div>
                                                <h2 className="text-3xl font-bold mb-4">Message sent</h2>
                                                <p className="text-muted-foreground mb-8">
                                                    This went to {SITE_EMAIL}. If email delivery is not configured on the project, the message is logged on the server instead of delivered.
                                                </p>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setSubmitted(false)}
                                                    className="h-12 px-8"
                                                >
                                                    Send another message
                                                </Button>
                                            </div>
                                        ) : (
                                            <form onSubmit={handleSubmit} className="space-y-6">
                                                <div className="grid md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="name">Full name</Label>
                                                        <Input id="name" name="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ada Lovelace" required maxLength={80} className="h-12 bg-background border-border" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="email">Email address</Label>
                                                        <Input id="email" name="email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="ada@example.com" required maxLength={200} className="h-12 bg-background border-border" />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="subject">Subject</Label>
                                                    <Input id="subject" name="subject" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} placeholder="Question about a published form" required maxLength={140} className="h-12 bg-background border-border" />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="message">Message</Label>
                                                    <Textarea
                                                        id="message"
                                                        name="message"
                                                        value={form.message}
                                                        onChange={(event) => setForm({ ...form, message: event.target.value })}
                                                        placeholder="What do you need help with?"
                                                        required
                                                        maxLength={4000}
                                                        className="min-h-[150px] bg-background border-border resize-none"
                                                    />
                                                </div>
                                                <div className="hidden" aria-hidden="true">
                                                    <Label htmlFor="website">Website</Label>
                                                    <Input id="website" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} />
                                                </div>

                                                <Button
                                                    type="submit"
                                                    className="w-full h-14 text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25"
                                                    disabled={loading}
                                                >
                                                    {loading ? (
                                                        <Loader2 className="h-5 w-5 animate-spin" />
                                                    ) : (
                                                        <>
                                                            Send Message
                                                            <Send className="ml-2 h-4 w-4" />
                                                        </>
                                                    )}
                                                </Button>
                                                <p className="text-center text-xs text-muted-foreground">
                                                    By submitting this form, you agree to our{" "}
                                                    <Link to="/terms" className="underline hover:text-foreground">Terms</Link> and{" "}
                                                    <Link to="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
                                                </p>
                                            </form>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Basic Footer for this page */}
            <footer className="border-t border-border py-12 bg-card/30">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p className="text-sm text-muted-foreground">
                        &copy; {new Date().getFullYear()} Boltfy. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
