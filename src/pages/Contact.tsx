import { useState } from "react";
import { SEO } from "@/components/layout/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, MessageSquare, MapPin, Send, CheckCircle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { BrandLogo } from "@/components/layout/BrandLogo";

export default function Contact() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            setSubmitted(true);
            toast({
                title: "Message Sent!",
                description: "We'll get back to you as soon as possible.",
            });
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEO
                title="Contact Us"
                description="Questions about Boltfy forms, campaigns, or your account? Reach our team at support@boltfy.io."
                path="/contact"
            />

            {/* Navigation */}
            <nav className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 group">
                        <BrandLogo size="md" />
                    </Link>
                    <div className="flex items-center gap-6">
                        <Link to="/blog" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Blog</Link>
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
                                <h1 className="text-5xl font-bold tracking-tight mb-6">Let's <span className="text-primary">connect</span></h1>
                                <p className="text-xl text-muted-foreground mb-12 max-w-lg leading-relaxed">
                                    Whether you have a question about features, pricing, need a demo, or anything else, our team is ready to answer all your questions.
                                </p>

                                <div className="space-y-8">
                                    <div className="flex gap-6">
                                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                            <Mail className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold mb-1">Email us</h3>
                                            <p className="text-muted-foreground">support@boltfy.io</p>
                                            <p className="text-muted-foreground">hello@boltfy.io</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-6">
                                        <div className="h-12 w-12 rounded-2xl bg-success/10 flex items-center justify-center shrink-0">
                                            <MessageSquare className="h-6 w-6 text-success" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold mb-1">Live Chat</h3>
                                            <p className="text-muted-foreground">Our support team is online</p>
                                            <p className="text-primary font-medium mt-1 cursor-pointer hover:underline">Start a conversation</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-6">
                                        <div className="h-12 w-12 rounded-2xl bg-warning/10 flex items-center justify-center shrink-0">
                                            <MapPin className="h-6 w-6 text-warning" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold mb-1">Base</h3>
                                            <p className="text-muted-foreground">Remote first, globally distributed.</p>
                                            <p className="text-muted-foreground">San Francisco, CA</p>
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
                                                <h2 className="text-3xl font-bold mb-4">Message Sent!</h2>
                                                <p className="text-muted-foreground mb-8">
                                                    Thank you for reaching out. A member of our team will be in touch shortly.
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
                                                        <Label htmlFor="name">Full Name</Label>
                                                        <Input id="name" placeholder="John Doe" required className="h-12 bg-background border-border" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="email">Email Address</Label>
                                                        <Input id="email" type="email" placeholder="john@example.com" required className="h-12 bg-background border-border" />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="subject">Subject</Label>
                                                    <Input id="subject" placeholder="How can we help?" required className="h-12 bg-background border-border" />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="message">Message</Label>
                                                    <Textarea
                                                        id="message"
                                                        placeholder="Tell us more about your needs..."
                                                        required
                                                        className="min-h-[150px] bg-background border-border resize-none"
                                                    />
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
