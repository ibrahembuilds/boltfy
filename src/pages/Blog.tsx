import { SEO } from "@/components/layout/SEO";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calendar, User, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/layout/BrandLogo";

export interface BlogPost {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    date: string;
    dateISO: string;
    author: string;
    readTime: string;
    category: string;
    image: string;
}

export const blogPosts: BlogPost[] = [
    {
        id: "1",
        slug: "best-form-builder-for-conversion-optimization-2026",
        title: "The Ultimate Guide to Form Conversion Optimization in 2026",
        excerpt: "Discover how specifically designed form layouts can increase your landing page conversion by up to 400%. SEO and UX matter.",
        date: "Dec 30, 2025",
        dateISO: "2025-12-30",
        author: "Elena Rivers",
        readTime: "7 min",
        category: "Strategy",
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800",
    },
    {
        id: "2",
        slug: "how-to-collect-leads-automatically-no-code",
        title: "How to Build an Automated Lead Collection System with No-Code",
        excerpt: "Learn the secrets of connecting Boltfy with your CRM and Slack for real-time lead notification and automated follow-ups.",
        date: "Dec 25, 2025",
        dateISO: "2025-12-25",
        author: "Marcus Chen",
        readTime: "10 min",
        category: "Automation",
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800",
    },
    {
        id: "3",
        slug: "luxury-web-design-trends-for-saas-forms",
        title: "Luxury Web Design Trends: Why Your SaaS Forms Need an Upgrade",
        excerpt: "Bento grids, soft shadows, and glassmorphism. Why aesthetics define the perceived value of your software product.",
        date: "Dec 18, 2025",
        dateISO: "2025-12-18",
        author: "Elena Rivers",
        readTime: "5 min",
        category: "Aesthetics",
        image: "https://images.unsplash.com/photo-1558655146-23ecdd3f4040?auto=format&fit=crop&q=80&w=800",
    }
];

export default function Blog() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEO
                title="Blog — Form Design, Lead Capture & No-Code Growth"
                description="Guides on form conversion, automated lead collection, and SaaS UX from the Boltfy team. Free form builder tips for 2026."
                path="/blog"
                jsonLd={{
                    "@context": "https://schema.org",
                    "@type": "Blog",
                    name: "Boltfy Blog",
                    description: "Form builder, conversion, and growth guides.",
                    url: "https://boltfy.io/blog",
                    blogPost: blogPosts.map((p) => ({
                        "@type": "BlogPosting",
                        headline: p.title,
                        url: `https://boltfy.io/blog/${p.slug}`,
                        datePublished: p.dateISO,
                        author: { "@type": "Person", name: p.author },
                    })),
                }}
            />

            {/* Brand Navigation */}
            <nav className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 group">
                        <BrandLogo size="md" />
                    </Link>
                    <div className="flex items-center gap-6">
                        <Link to="/contact" className="text-sm font-medium text-muted-foreground hover:text-foreground">Contact</Link>
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
                {/* Hero */}
                <section className="py-24 px-6 border-b border-border bg-muted/20">
                    <div className="max-w-7xl mx-auto text-center">
                        <Badge variant="outline" className="mb-6 px-4 py-1.5 border-primary/20 text-primary bg-primary/5 uppercase tracking-widest text-[10px] font-bold">
                            The Boltfy Blog
                        </Badge>
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
                            Insights on <span className="italic text-primary">data & design.</span>
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                            Discover tips for building high-converting forms, automating your workflow, and the latest in design aesthetics.
                        </p>
                    </div>
                </section>

                {/* Post Grid */}
                <section className="py-24 px-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {blogPosts.map((post) => (
                                <Link key={post.id} to={`/blog/${post.slug}`} className="group">
                                    <Card className="h-full border-border bg-card/30 hover:bg-card transition-all duration-500 hover:-translate-y-2 overflow-hidden flex flex-col shadow-sm hover:shadow-2xl hover:border-primary/20">
                                        <div className="aspect-[16/10] overflow-hidden relative">
                                            <img
                                                src={post.image}
                                                alt={post.title}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                            <div className="absolute top-4 left-4">
                                                <Badge className="bg-background/80 backdrop-blur-md text-foreground border-none hover:bg-background/90 uppercase text-[10px] tracking-widest font-bold">
                                                    {post.category}
                                                </Badge>
                                            </div>
                                        </div>
                                        <CardContent className="p-8 flex-1 flex flex-col">
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="h-3 w-3" />
                                                    {post.date}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Clock className="h-3 w-3" />
                                                    {post.readTime}
                                                </span>
                                            </div>
                                            <h2 className="text-2xl font-bold mb-4 line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                                                {post.title}
                                            </h2>
                                            <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 mb-6 flex-1">
                                                {post.excerpt}
                                            </p>
                                            <div className="flex items-center justify-between pt-6 border-t border-border/50">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                                                        <User className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <span className="text-xs font-medium">{post.author}</span>
                                                </div>
                                                <span className="text-primary font-bold text-xs flex items-center gap-1 group-hover:gap-2 transition-all">
                                                    Read Post <ArrowRight className="h-4 w-4" />
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Newsletter Callout */}
                <section className="py-24 px-6 bg-primary/5 border-y border-primary/10">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-3xl font-bold mb-4">Never miss an update.</h2>
                        <p className="text-muted-foreground mb-8">Join 2,000+ creators getting our weekly insights on form design and lead optimization.</p>
                        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                            <Input placeholder="Enter your email" className="h-12 bg-background" />
                            <Button className="h-12 px-8 bg-primary hover:bg-primary/90 shrink-0">Subscribe</Button>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="py-24 px-6 bg-card">
                <div className="max-w-7xl mx-auto text-center border-t border-border pt-12">
                    <Link to="/" className="inline-flex items-center gap-3 mb-8 group">
                        <BrandLogo size="md" />
                    </Link>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto mb-8">
                        The world's most beautiful form builder for creators who demand quality.
                    </p>
                    <div className="flex justify-center gap-8 mb-12">
                        <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground">About</Link>
                        <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground">Contact</Link>
                        <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground">Privacy</Link>
                        <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground">Terms</Link>
                    </div>
                    <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/40 font-bold">
                        &copy; {new Date().getFullYear()} Boltfy Lab &bull; All Rights Reserved
                    </div>
                </div>
            </footer>
        </div>
    );
}
