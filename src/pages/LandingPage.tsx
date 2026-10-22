import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ModeToggle } from "@/components/mode-toggle";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { 
    ArrowRight, 
    LayoutTemplate, 
    BarChart3, 
    CheckCircle2, 
    Shield, 
    Sparkles, 
    MousePointer2, 
    Layers, 
    Globe, 
    MessageSquare,
    Star,
    Plus,
    Trash2,
    Smile,
    Mail,
    ChevronRight
} from "lucide-react";
import { faqs, features, pricingFeatures, steps, useCases } from "@/seo/content";
import { HERO_TITLE, SITE_SUMMARY } from "@/seo/site";

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
        className={className}
    >
        {children}
    </motion.div>
);

export default function LandingPage() {
    // Interactive Demo state
    const [activeDemoTab, setActiveDemoTab] = useState<"build" | "preview" | "analytics">("preview");
    const [demoFields, setDemoFields] = useState<string[]>(["Email Address", "Product Rating", "Written Review"]);
    const [rating, setRating] = useState<number>(5);
    const [email, setEmail] = useState<string>("");
    const [feedback, setFeedback] = useState<string>("");
    const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
    const [submissions, setSubmissions] = useState<Array<{ email: string; rating: number; feedback: string; time: string }>>([
        { email: "sarah.m@designlabs.co", rating: 5, feedback: "Incredibly fast load speeds!", time: "2 mins ago" },
        { email: "david.k@codebase.io", rating: 4, feedback: "Clean layout, zero setup friction.", time: "10 mins ago" },
        { email: "elena.g@growthloop.net", rating: 5, feedback: "Best builder UI I've used this year.", time: "15 mins ago" }
    ]);

    const availableFields = ["Full Name", "Phone Number", "Company Size", "Referral Source"];

    const handleAddField = (field: string) => {
        if (!demoFields.includes(field)) {
            setDemoFields([...demoFields, field]);
        }
    };

    const handleRemoveField = (field: string) => {
        setDemoFields(demoFields.filter(f => f !== field));
    };

    const handleSubmitDemoForm = (e: React.FormEvent) => {
        e.preventDefault();
        if (email.trim() === "") return;

        const newSubmission = {
            email: email,
            rating: rating,
            feedback: feedback || "No written review provided.",
            time: "Just now"
        };

        setSubmissions([newSubmission, ...submissions.slice(0, 3)]);
        setHasSubmitted(true);
        setTimeout(() => {
            setHasSubmitted(false);
            setEmail("");
            setFeedback("");
            setRating(5);
        }, 3000);
    };

    // Calculate dynamic analytics from mock submissions
    const avgRating = (submissions.reduce((acc, curr) => acc + curr.rating, 0) / submissions.length).toFixed(1);

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 overflow-x-hidden transition-colors duration-300">
            {/* Ambient Background Effects */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 dark:bg-primary/5 rounded-full blur-[140px]" />
                <div className="absolute top-[15%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[120px]" />
                <div className="absolute top-[60%] left-[5%] w-[45%] h-[45%] bg-violet-500/5 rounded-full blur-[130px]" />
            </div>

            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/75 dark:bg-background/60 backdrop-blur-md transition-all duration-300">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-indigo-600 p-[1px] shadow-sm group-hover:scale-105 transition-transform duration-300">
                            <div className="w-full h-full bg-card rounded-[10px] flex items-center justify-center overflow-hidden">
                                <img src="/icon.png" alt="Boltfy Logo" className="w-5 h-5 object-contain" />
                            </div>
                        </div>
                        <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">Boltfy</span>
                    </Link>
                    <div className="hidden md:flex items-center justify-center text-sm font-medium text-muted-foreground gap-8 flex-1 pl-12">
                         <a href="#features" className="hover:text-foreground transition-colors duration-200">Features</a>
                         <a href="#demo" className="hover:text-foreground transition-colors duration-200">Interactive Demo</a>
                         <a href="#use-cases" className="hover:text-foreground transition-colors duration-200">Use cases</a>
                         <a href="#pricing" className="hover:text-foreground transition-colors duration-200">Pricing</a>
                         <a href="#faq" className="hover:text-foreground transition-colors duration-200">FAQ</a>
                         <Link to="/blog" className="hover:text-foreground transition-colors duration-200">Guides</Link>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block px-3 py-2">
                            Log in
                        </Link>
                        <Link to="/signup">
                            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20 gap-2 h-9 rounded-full px-5 text-sm font-medium">
                                Get Started <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                        <div className="h-6 w-[1px] bg-border/60 mx-1 hidden sm:block" />
                        <ModeToggle />
                    </div>
                </div>
            </nav>

            <main className="relative z-10 pt-32 pb-20">
                {/* HERO SECTION */}
                <section className="px-6 relative mb-24">
                    <div className="max-w-5xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-xs md:text-sm text-primary font-medium mb-8"
                        >
                            <Sparkles className="w-4 h-4 text-primary animate-pulse-soft" /> Build High-Converting Forms in Seconds
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6 text-foreground leading-[1.1] text-balance"
                        >
                            {HERO_TITLE}
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto font-light leading-relaxed text-balance"
                        >
                            {SITE_SUMMARY}
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center max-w-md mx-auto sm:max-w-none"
                        >
                            <Link to="/signup" className="w-full sm:w-auto">
                                <Button size="lg" className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-8 text-lg rounded-full shadow-lg shadow-primary/25 transition-all hover:scale-[1.03]">
                                    Start Building for Free
                                </Button>
                            </Link>
                            <a href="#demo" className="w-full sm:w-auto">
                                <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg rounded-full hover:bg-muted/50 border-border/80 transition-all">
                                    Try Interactive Demo
                                </Button>
                            </a>
                        </motion.div>
                        
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="mt-8 flex items-center justify-center gap-6 text-xs md:text-sm text-muted-foreground"
                        >
                            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> No credit card to sign up</span>
                            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Public link and iframe embed</span>
                            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Subscribers stay in your account</span>
                        </motion.div>
                    </div>
                </section>

                {/* APP PREVIEW MOCKUP */}
                <FadeIn delay={0.2} className="px-6 mb-32 max-w-5xl mx-auto relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent blur-3xl -z-10 rounded-[3rem]" />
                    <div className="rounded-2xl border border-border/60 dark:border-border/30 bg-card shadow-2xl overflow-hidden shadow-primary/5 dark:shadow-indigo-500/5 flex flex-col relative z-10 hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/15 transition-all duration-500">
                        {/* Fake browser header */}
                        <div className="h-11 bg-muted/40 border-b border-border/50 flex items-center px-4 gap-2 justify-between">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-400/80" />
                                <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                                <div className="w-3 h-3 rounded-full bg-green-400/80" />
                            </div>
                            <div className="bg-background border border-border/40 rounded-md w-96 h-6 text-[10px] flex items-center justify-center text-muted-foreground/80 font-mono tracking-wide">
                                boltfy.io/dashboard/workspace
                            </div>
                            <div className="w-12" /> {/* spacing element */}
                        </div>
                        {/* Mockup image */}
                        <div className="w-full bg-background overflow-hidden relative aspect-[16/10]">
                            <img 
                                src="/boltfy_dashboard_preview.png" 
                                alt="Boltfy Form Builder Dashboard Workspace" 
                                className="w-full h-full object-cover object-top border-t border-border/20 shadow-inner"
                            />
                        </div>
                    </div>
                </FadeIn>

                {/* INTERACTIVE DEMO / SIMULATOR SECTION */}
                <section id="demo" className="py-20 px-6 relative bg-muted/20 border-y border-border/40 mb-32">
                    <div className="max-w-6xl mx-auto">
                        <FadeIn className="text-center mb-16">
                            <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">Interactive Demo</span>
                            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mt-4 mb-4">See how easy it is in action</h2>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                                Customize fields, fill out the form, and view instant updates in the simulator dashboard.
                            </p>
                        </FadeIn>

                        <div className="grid lg:grid-cols-12 gap-8 items-stretch">
                            {/* Controller & Tabs Sidebar (4 columns) */}
                            <div className="lg:col-span-4 flex flex-col justify-between gap-6">
                                <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
                                    <h3 className="font-semibold text-lg flex items-center gap-2"><MousePointer2 className="w-5 h-5 text-primary" /> Simulator Steps</h3>
                                    
                                    <div className="flex flex-col gap-2">
                                        <button 
                                            onClick={() => setActiveDemoTab("build")}
                                            className={`flex items-center gap-3 w-full text-left p-3.5 rounded-xl border text-sm font-medium transition-all ${
                                                activeDemoTab === "build" 
                                                    ? "bg-primary/5 text-primary border-primary/30" 
                                                    : "hover:bg-muted/50 border-transparent text-muted-foreground"
                                            }`}
                                        >
                                            <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold">1</span>
                                            Customize Fields
                                        </button>
                                        <button 
                                            onClick={() => setActiveDemoTab("preview")}
                                            className={`flex items-center gap-3 w-full text-left p-3.5 rounded-xl border text-sm font-medium transition-all ${
                                                activeDemoTab === "preview" 
                                                    ? "bg-primary/5 text-primary border-primary/30" 
                                                    : "hover:bg-muted/50 border-transparent text-muted-foreground"
                                            }`}
                                        >
                                            <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold">2</span>
                                            Fill & Submit Form
                                        </button>
                                        <button 
                                            onClick={() => setActiveDemoTab("analytics")}
                                            className={`flex items-center gap-3 w-full text-left p-3.5 rounded-xl border text-sm font-medium transition-all ${
                                                activeDemoTab === "analytics" 
                                                    ? "bg-primary/5 text-primary border-primary/30" 
                                                    : "hover:bg-muted/50 border-transparent text-muted-foreground"
                                            }`}
                                        >
                                            <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold">3</span>
                                            Real-Time Analytics
                                        </button>
                                    </div>

                                    {/* Action instructions corresponding to active tab */}
                                    <div className="pt-4 border-t border-border/50 text-xs text-muted-foreground leading-relaxed">
                                        {activeDemoTab === "build" && (
                                            <p>Add and remove form input blocks using the controls below. Changes propagate instantly to the live form preview.</p>
                                        )}
                                        {activeDemoTab === "preview" && (
                                            <p>Simulate a visitor response! Type an email, leave a review and hit submit to observe database capture.</p>
                                        )}
                                        {activeDemoTab === "analytics" && (
                                            <p>Visual representation of captured database entries. Notice how the average score changes as new ratings arrive.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Customizer controls visible in "build" tab */}
                                <AnimatePresence mode="wait">
                                    {activeDemoTab === "build" && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm flex flex-col gap-4"
                                        >
                                            <h4 className="text-sm font-semibold text-foreground">Available Input Blocks</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {availableFields.map(field => {
                                                    const isAdded = demoFields.includes(field);
                                                    return (
                                                        <Button
                                                            key={field}
                                                            size="sm"
                                                            variant={isAdded ? "secondary" : "outline"}
                                                            onClick={() => isAdded ? handleRemoveField(field) : handleAddField(field)}
                                                            className="text-xs gap-1.5 h-8 rounded-lg"
                                                        >
                                                            {isAdded ? <Trash2 className="w-3 h-3 text-destructive" /> : <Plus className="w-3 h-3" />}
                                                            {field}
                                                        </Button>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Main Interactive Panel (8 columns) */}
                            <div className="lg:col-span-8 bg-card border border-border/85 dark:border-border/30 rounded-3xl shadow-lg p-6 md:p-8 flex flex-col justify-between min-h-[400px]">
                                <AnimatePresence mode="wait">
                                    {/* BUILDER TAB */}
                                    {activeDemoTab === "build" && (
                                        <motion.div
                                            key="build-tab"
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            className="w-full flex-1 flex flex-col gap-6"
                                        >
                                            <div className="flex justify-between items-center pb-4 border-b border-border/50">
                                                <div>
                                                    <h3 className="font-semibold text-foreground">Form Editor Canvas</h3>
                                                    <p className="text-xs text-muted-foreground">Click fields to delete them from active list</p>
                                                </div>
                                                <span className="text-xs bg-indigo-500/10 text-indigo-500 font-bold px-2.5 py-1 rounded-full">{demoFields.length} active fields</span>
                                            </div>

                                            <div className="flex flex-col gap-3">
                                                {demoFields.map((field) => (
                                                    <div 
                                                        key={field} 
                                                        className="flex items-center justify-between p-4 bg-muted/30 border border-border/50 rounded-xl hover:border-primary/20 transition-all group"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-2.5 h-2.5 rounded-full bg-primary/60" />
                                                            <span className="text-sm font-medium text-foreground">{field}</span>
                                                        </div>
                                                        <button 
                                                            onClick={() => handleRemoveField(field)}
                                                            className="text-muted-foreground hover:text-destructive p-1 rounded-md hover:bg-destructive/10 transition-colors"
                                                            aria-label="Remove field"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                                
                                                {demoFields.length === 0 && (
                                                    <div className="py-12 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                                                        <Smile className="w-8 h-8 text-muted-foreground/60" />
                                                        No fields left. Try adding some from the side panel!
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="mt-auto pt-4 flex justify-end">
                                                <Button size="sm" onClick={() => setActiveDemoTab("preview")} className="rounded-full gap-1.5">
                                                    Proceed to Submit <ChevronRight className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* PREVIEW & SUBMIT TAB */}
                                    {activeDemoTab === "preview" && (
                                        <motion.div
                                            key="preview-tab"
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            className="w-full flex-1 flex flex-col gap-6"
                                        >
                                            <div className="flex justify-between items-center pb-4 border-b border-border/50">
                                                <div>
                                                    <h3 className="font-semibold text-foreground">Interactive Live Preview</h3>
                                                    <p className="text-xs text-muted-foreground">Test submission behavior live</p>
                                                </div>
                                                <span className="text-xs bg-emerald-500/10 text-emerald-500 font-bold px-2.5 py-1 rounded-full">Interactive</span>
                                            </div>

                                            {hasSubmitted ? (
                                                <motion.div 
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-2xl border border-emerald-500/20"
                                                >
                                                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 text-emerald-500">
                                                        <CheckCircle2 className="w-6 h-6" />
                                                    </div>
                                                    <h4 className="text-lg font-bold text-foreground mb-2">Form Submitted Successfully!</h4>
                                                    <p className="text-sm text-muted-foreground max-w-sm">
                                                        The submission has been pushed onto our simulated data stream. Click the 'Real-Time Analytics' tab to view it!
                                                    </p>
                                                </motion.div>
                                            ) : (
                                                <form onSubmit={handleSubmitDemoForm} className="space-y-4 max-w-md">
                                                    {demoFields.includes("Email Address") && (
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Email Address</label>
                                                            <input 
                                                                type="email" 
                                                                value={email}
                                                                onChange={(e) => setEmail(e.target.value)}
                                                                placeholder="you@domain.com"
                                                                className="w-full text-sm h-10 px-3.5 rounded-xl border border-border/80 bg-background/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                                                required
                                                            />
                                                        </div>
                                                    )}

                                                    {demoFields.includes("Product Rating") && (
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-semibold text-muted-foreground">Rating Score (1-5 stars)</label>
                                                            <div className="flex gap-2">
                                                                {[1, 2, 3, 4, 5].map((star) => (
                                                                    <button
                                                                        type="button"
                                                                        key={star}
                                                                        onClick={() => setRating(star)}
                                                                        className="p-1 hover:scale-110 transition-transform"
                                                                    >
                                                                        <Star 
                                                                            className={`w-6 h-6 ${
                                                                                star <= rating 
                                                                                    ? "fill-amber-400 text-amber-400" 
                                                                                    : "text-muted-foreground/30"
                                                                            }`} 
                                                                        />
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {demoFields.includes("Written Review") && (
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> Written Review</label>
                                                            <textarea 
                                                                rows={2}
                                                                value={feedback}
                                                                onChange={(e) => setFeedback(e.target.value)}
                                                                placeholder="Tell us what you think..."
                                                                className="w-full text-sm p-3 rounded-xl border border-border/80 bg-background/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                                                            />
                                                        </div>
                                                    )}

                                                    {/* Other placeholder fields */}
                                                    {demoFields.filter(f => f !== "Email Address" && f !== "Product Rating" && f !== "Written Review").map(f => (
                                                        <div key={f} className="space-y-1.5">
                                                            <label className="text-xs font-semibold text-muted-foreground">{f}</label>
                                                            <input 
                                                                type="text" 
                                                                placeholder={`Enter ${f.toLowerCase()}...`}
                                                                disabled
                                                                className="w-full text-sm h-10 px-3.5 rounded-xl border border-border/50 bg-muted/30 cursor-not-allowed opacity-70"
                                                            />
                                                        </div>
                                                    ))}

                                                    <Button type="submit" className="w-full sm:w-auto rounded-full px-6 gap-2">
                                                        Submit Response <ArrowRight className="w-4 h-4" />
                                                    </Button>
                                                </form>
                                            )}
                                        </motion.div>
                                    )}

                                    {/* ANALYTICS TAB */}
                                    {activeDemoTab === "analytics" && (
                                        <motion.div
                                            key="analytics-tab"
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            className="w-full flex-1 flex flex-col gap-6"
                                        >
                                            <div className="flex justify-between items-center pb-4 border-b border-border/50">
                                                <div>
                                                    <h3 className="font-semibold text-foreground">Submission Database & Analytics</h3>
                                                    <p className="text-xs text-muted-foreground">Updated in real-time</p>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-soft" /> Live
                                                </div>
                                            </div>

                                            {/* Key Metrics Cards */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-4 bg-muted/20 border border-border/40 rounded-2xl flex flex-col">
                                                    <span className="text-xs text-muted-foreground font-medium">Total Responses</span>
                                                    <span className="text-3xl font-extrabold text-foreground tracking-tight mt-1">{submissions.length}</span>
                                                </div>
                                                <div className="p-4 bg-muted/20 border border-border/40 rounded-2xl flex flex-col">
                                                    <span className="text-xs text-muted-foreground font-medium">Average Rating</span>
                                                    <span className="text-3xl font-extrabold text-foreground tracking-tight mt-1 flex items-center gap-2">
                                                        {avgRating} <Star className="w-5 h-5 fill-amber-400 text-amber-400 shrink-0" />
                                                    </span>
                                                </div>
                                            </div>

                                            {/* List of submissions */}
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-semibold text-muted-foreground">Recent Submissions Feed</h4>
                                                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                                                    {submissions.map((sub, idx) => (
                                                        <div key={idx} className="p-3 bg-muted/30 border border-border/40 rounded-xl flex items-start justify-between gap-4 text-xs">
                                                            <div className="space-y-1">
                                                                <span className="font-medium text-foreground">{sub.email}</span>
                                                                <p className="text-muted-foreground font-light">{sub.feedback}</p>
                                                            </div>
                                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                                <span className="text-[10px] text-muted-foreground">{sub.time}</span>
                                                                <div className="flex gap-0.5">
                                                                    {[1,2,3,4,5].map(s => (
                                                                        <Star 
                                                                            key={s} 
                                                                            className={`w-3 h-3 ${s <= sub.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`} 
                                                                        />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </section>

                {/* TRUST STRIP / LOGOS */}
                <FadeIn>
                    <section className="py-10 border-y border-border/40 bg-muted/10 mb-32">
                        <div className="max-w-6xl mx-auto px-6 text-center">
                            <p className="text-xs font-semibold tracking-widest text-muted-foreground/80 uppercase mb-8">What you can ship from one account</p>
                            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 text-foreground/80">
                                <div className="flex items-center gap-2 font-semibold"><Globe className="w-5 h-5 text-primary" /> Public link</div>
                                <div className="flex items-center gap-2 font-semibold"><Layers className="w-5 h-5 text-indigo-500" /> Iframe embed</div>
                                <div className="flex items-center gap-2 font-semibold"><Mail className="w-5 h-5 text-amber-500" /> Email campaigns</div>
                                <div className="flex items-center gap-2 font-semibold"><Shield className="w-5 h-5 text-emerald-500" /> Per-account data</div>
                            </div>
                        </div>
                    </section>
                </FadeIn>

                {/* KEY FEATURES */}
                <section id="features" className="py-16 px-6 relative mb-24">
                    <div className="max-w-6xl mx-auto">
                        <FadeIn className="text-center mb-20">
                            <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">Core Capabilities</span>
                            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mt-4 mb-4">Everything you need to collect data</h2>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-light">
                                Design the form, share it, read the responses, and email the people who subscribed.
                            </p>
                        </FadeIn>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {features.map((feat, idx) => {
                                const visuals = [
                                    { icon: <MousePointer2 className="w-6 h-6" />, color: "text-primary bg-primary/10" },
                                    { icon: <LayoutTemplate className="w-6 h-6" />, color: "text-indigo-500 bg-indigo-500/10" },
                                    { icon: <Globe className="w-6 h-6" />, color: "text-amber-500 bg-amber-500/10" },
                                    { icon: <BarChart3 className="w-6 h-6" />, color: "text-emerald-500 bg-emerald-500/10" },
                                    { icon: <Mail className="w-6 h-6" />, color: "text-violet-500 bg-violet-500/10" },
                                    { icon: <Shield className="w-6 h-6" />, color: "text-red-500 bg-red-500/10" },
                                ];
                                const visual = visuals[idx] ?? visuals[0];
                                return (
                                <FadeIn key={idx} delay={0.05 * idx}>
                                    <div className="p-8 rounded-2xl border border-border/80 dark:border-border/30 bg-card hover:border-primary/40 dark:hover:border-primary/30 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${visual.color}`}>
                                            {visual.icon}
                                        </div>
                                        <h3 className="text-xl font-semibold mb-3">{feat.title}</h3>
                                        <p className="text-muted-foreground text-sm leading-relaxed font-light">{feat.description}</p>
                                    </div>
                                </FadeIn>
                            );
                            })}
                        </div>
                    </div>
                </section>

                {/* HOW IT WORKS */}
                <section id="how-it-works" className="py-24 px-6 bg-muted/20 border-y border-border/40 mt-16 mb-24">
                    <div className="max-w-5xl mx-auto">
                        <FadeIn className="text-center mb-20">
                            <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full font-sans">Workflow Flow</span>
                            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mt-4 mb-4">Go live in three simple steps</h2>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-light">
                                Minimize setup overhead. Collect data instantly.
                            </p>
                        </FadeIn>

                        <div className="grid md:grid-cols-3 gap-12 relative">
                            {/* Connecting Line */}
                            <div className="hidden md:block absolute top-[40px] left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-primary/10 via-primary/30 to-primary/10 z-0" />

                            {steps.map((item, i) => (
                                <FadeIn key={i} delay={0.15 * i} className="relative z-10 flex flex-col items-center text-center">
                                    <div className="w-20 h-20 rounded-full bg-background border-4 border-muted/80 shadow-md flex items-center justify-center mb-6 text-2xl font-bold text-primary relative">
                                        {String(i + 1).padStart(2, "0")}
                                        <div className="absolute inset-0 rounded-full shadow-[inset_0_0_15px_rgba(99,102,241,0.06)]" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed font-light">{item.description}</p>
                                </FadeIn>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="use-cases" className="py-16 px-6 mb-24">
                    <div className="max-w-6xl mx-auto">
                        <FadeIn className="text-center mb-16">
                            <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">Use cases</span>
                            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mt-4 mb-4">Three jobs Boltfy is built for</h2>
                            <p className="text-lg text-muted-foreground max-w-xl mx-auto font-light">
                                Contact forms, short surveys, and newsletter signup. Each one stays on your account.
                            </p>
                        </FadeIn>

                        <div className="grid md:grid-cols-3 gap-8">
                            {useCases.map((useCase, idx) => (
                                <FadeIn key={useCase.title} delay={0.1 * idx}>
                                    <div className="p-6 md:p-8 rounded-2xl border border-border/80 dark:border-border/30 bg-card hover:shadow-md transition-all h-full">
                                        <h3 className="text-xl font-semibold mb-3">{useCase.title}</h3>
                                        <p className="text-muted-foreground text-sm leading-relaxed font-light">
                                            {useCase.description}
                                        </p>
                                    </div>
                                </FadeIn>
                            ))}
                        </div>
                    </div>
                </section>

                {/* PRICING SECTION */}
                <section id="pricing" className="py-20 px-6 bg-background relative mb-24">
                    <div className="max-w-6xl mx-auto">
                        <FadeIn className="text-center mb-12">
                            <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">Pricing</span>
                            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mt-4 mb-4">Free to start</h2>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-light">
                                No credit card to create an account, and no paid tier in the app. Campaign email sends when Resend is configured.
                            </p>
                        </FadeIn>

                        <div className="max-w-2xl mx-auto">
                            <FadeIn delay={0.1}>
                                <div className="p-8 md:p-10 rounded-3xl border-2 border-primary bg-card dark:bg-card/90 transition-all flex flex-col justify-between h-full shadow-lg relative overflow-hidden">
                                    <div className="absolute top-4 right-4 bg-gradient-to-r from-primary to-indigo-600 text-primary-foreground text-[10px] font-extrabold px-3 py-1 rounded-full shadow-md tracking-wider">
                                        FREE TO START
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-extrabold text-foreground mb-2">Complete Access</h3>
                                        <p className="text-muted-foreground text-sm font-light mb-6">Get everything you need to build visual forms and collect responses.</p>
                                        <div className="flex items-baseline mb-6">
                                            <span className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500 dark:from-primary dark:to-indigo-400">$0</span>
                                            <span className="text-muted-foreground text-sm ml-2">to start</span>
                                        </div>
                                        <ul className="grid sm:grid-cols-2 gap-4 border-t border-border/50 pt-6">
                                            {pricingFeatures.map((feature) => (
                                                <li key={feature} className="flex items-center gap-3 text-sm text-muted-foreground font-light font-sans">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="pt-10">
                                        <Link to="/signup" className="w-full block">
                                            <Button className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-semibold shadow-md shadow-primary/20 text-md">
                                                Create Your Free Account
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </FadeIn>
                        </div>
                    </div>
                </section>

                {/* FAQ SECTION (Radix Accordion primitive) */}
                <section id="faq" className="py-16 px-6 max-w-4xl mx-auto mb-24">
                    <FadeIn className="text-center mb-12">
                        <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">Support FAQ</span>
                        <h2 className="text-3xl md:text-5xl font-bold tracking-tight mt-4 mb-4">Frequently Asked Questions</h2>
                        <p className="text-base text-muted-foreground max-w-xl mx-auto font-light">
                            Direct answers about price, sharing, email, and how accounts are separated.
                        </p>
                    </FadeIn>

                    <FadeIn>
                        <Accordion type="single" collapsible className="w-full border-t border-border/40">
                            {faqs.map((faq, index) => (
                                <AccordionItem key={faq.question} value={`faq-${index}`} className="border-b border-border/40">
                                    <AccordionTrigger className="text-left font-semibold py-4 hover:no-underline hover:text-primary transition-colors text-sm md:text-base">
                                        {faq.question}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground text-sm font-light leading-relaxed">
                                        {faq.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </FadeIn>
                </section>

                {/* FINAL CTA */}
                <section className="py-24 px-6 relative">
                    <div className="max-w-4xl mx-auto text-center">
                        <FadeIn>
                            <div className="p-8 md:p-16 rounded-[2rem] md:rounded-[2.5rem] bg-card border border-border/60 dark:border-border/30 shadow-2xl relative overflow-hidden">
                                {/* Decorative CTA Background elements */}
                                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[90px] -translate-y-1/2 translate-x-1/2" />
                                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[90px] translate-y-1/2 -translate-x-1/2" />

                                <div className="relative z-10">
                                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 text-foreground">
                                        Ready to compose your first form?
                                    </h2>
                                    <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto font-light leading-relaxed">
                                        Join developers and creators building high-converting forms the visual way. Sign up in under 30 seconds.
                                    </p>
                                    <Link to="/signup">
                                        <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-10 text-lg rounded-full shadow-xl shadow-primary/25 transition-transform hover:scale-[1.03]">
                                            Get Started for Free
                                        </Button>
                                    </Link>
                                    <p className="mt-6 text-xs text-muted-foreground flex items-center justify-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        No credit card required to start
                                    </p>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </section>
            </main>

            {/* FOOTER */}
            <footer className="border-t border-border/40 bg-card/50 pt-16 pb-8 px-6 text-sm transition-colors duration-300">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
                        <div className="col-span-2 lg:col-span-2">
                            <Link to="/" className="flex items-center gap-2 mb-4">
                                <img src="/icon.png" alt="Boltfy" className="w-6 h-6 object-contain" />
                                <span className="font-bold text-lg tracking-tight text-foreground">Boltfy</span>
                            </Link>
                            <p className="text-muted-foreground mb-6 max-w-xs font-light">
                                The premium form editor for developers, growth designers, and creators who value aesthetic perfection.
                            </p>
                        </div>
                        
                        <div>
                            <h4 className="font-semibold mb-4 text-foreground">Product</h4>
                            <ul className="space-y-3 font-light text-muted-foreground">
                                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                                <li><a href="#demo" className="hover:text-foreground transition-colors">Interactive Demo</a></li>
                                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-4 text-foreground">Resources</h4>
                            <ul className="space-y-3 font-light text-muted-foreground">
                                <li><Link to="/blog" className="hover:text-foreground transition-colors">Guides</Link></li>
                                <li><Link to="/about" className="hover:text-foreground transition-colors">About</Link></li>
                                <li><Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-4 text-foreground">Legal</h4>
                            <ul className="space-y-3 font-light text-muted-foreground">
                                <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                                <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-4 text-muted-foreground text-center md:text-left text-xs font-light">
                        <p>© {new Date().getFullYear()} Boltfy. All rights reserved.</p>
                        <div className="flex items-center gap-4">
                            <span>Made with ❤️ for growth builders everywhere.</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
