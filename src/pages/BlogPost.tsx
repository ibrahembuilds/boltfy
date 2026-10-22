import { useParams, Link, useNavigate } from "react-router-dom";
import { SEO } from "@/components/layout/SEO";
import { articleSchema, breadcrumbSchema } from "@/lib/seo-schemas";
import { blogPosts } from "./Blog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Calendar, Clock, Share2, Facebook, Twitter, Linkedin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";

export default function BlogPost() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const post = blogPosts.find((p) => p.slug === slug);

    useEffect(() => {
        if (!post) {
            // Small delay to allow react-router to catch up if needed
            const timer = setTimeout(() => {
                if (!post) navigate("/blog");
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [post, navigate]);

    if (!post) return null;

    return (
        <div className="min-h-screen bg-background">
            <SEO
                title={post.title}
                description={post.excerpt}
                path={`/blog/${post.slug}`}
                image={post.image}
                type="article"
                article={{
                    publishedTime: post.dateISO,
                    author: post.author,
                    section: post.category,
                }}
                jsonLd={[
                    breadcrumbSchema([
                        { name: "Home", path: "/" },
                        { name: "Blog", path: "/blog" },
                        { name: post.title, path: `/blog/${post.slug}` },
                    ]),
                    articleSchema({
                        title: post.title,
                        description: post.excerpt,
                        path: `/blog/${post.slug}`,
                        image: post.image,
                        datePublished: post.dateISO,
                        authorName: post.author,
                    }),
                ]}
            />

            {/* Article Navigation */}
            <nav className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link to="/blog" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-all group">
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Blog
                    </Link>
                    <div className="hidden md:flex items-center gap-4">
                        <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Share:</span>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><Twitter className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><Facebook className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><Linkedin className="h-4 w-4" /></Button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="py-24 px-6">
                <article className="max-w-3xl mx-auto">
                    {/* Header */}
                    <header className="mb-12">
                        <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 mb-6 uppercase text-[10px] tracking-widest font-bold">
                            {post.category}
                        </Badge>
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-8 leading-[1.1]">
                            {post.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-6 py-8 border-y border-border/50">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                    <User className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-foreground">{post.author}</p>
                                    <p className="text-xs text-muted-foreground">Editor at Boltfy</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground ml-auto">
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4" />
                                    {post.date}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Clock className="h-4 w-4" />
                                    {post.readTime} read
                                </span>
                            </div>
                        </div>
                    </header>

                    {/* Featured Image */}
                    <div className="aspect-[21/9] rounded-3xl overflow-hidden mb-16 shadow-2xl">
                        <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
                    </div>

                    {/* Content */}
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                        <p className="text-xl text-muted-foreground leading-relaxed italic mb-8 border-l-4 border-primary pl-6 py-2">
                            "{post.excerpt}"
                        </p>

                        <h2 className="text-2xl font-bold mt-12 mb-6">The Power of First Impressions</h2>
                        <p>
                            In today's digital landscape, a form is more than just a data entry point; it's a conversation. It's the moment where a potential lead decides whether to trust you with their information or leave forever. This is where <strong>design aesthetics</strong> play a critical role.
                        </p>

                        <p className="mt-6">
                            When we built Boltfy, we realized that traditional form builders were focused 100% on logic and 0% on feel. They provided functional inputs, but they felt cold, clinical, and often frustrating on mobile devices.
                        </p>

                        <h3 className="text-xl font-bold mt-10 mb-4">Key takeaways for high conversion:</h3>
                        <ul className="list-disc pl-6 space-y-3 mt-4">
                            <li><strong>Minimalist Layout:</strong> Never ask for more than you need. Every extra field decreases conversion by 5-10%.</li>
                            <li><strong>Visual Harmony:</strong> Match your form style to your brand identity. A disjointed experience feels untrustworthy.</li>
                            <li><strong>Micro-interactions:</strong> Provide instant feedback. Success animations and clean error states keep users engaged.</li>
                            <li><strong>Mobile Persistence:</strong> Ensure hit-boxes are large and inputs are properly spaced for thumbs.</li>
                        </ul>

                        <div className="bg-primary/5 rounded-3xl p-8 my-12 border border-primary/10">
                            <h4 className="font-bold text-lg mb-2 text-primary">Pro Tip</h4>
                            <p className="text-sm text-foreground mb-0">
                                Try using "Step Forms" for longer surveys. Breaking 10 questions into 3-4 distinct steps reduces cognitive load and increases completion rates by up to 40%.
                            </p>
                        </div>

                        <p className="mt-10">
                            As we look toward 2026, the intersection of AI and design will continue to evolve. At Boltfy, we're already experimenting with generative UI that adapts to the user's intent in real-time.
                        </p>

                        <blockquote className="border-l-4 border-primary pl-8 my-12 italic text-2xl font-medium text-foreground/80">
                            "Design is not just what it looks like and feels like. Design is how it works."
                        </blockquote>

                        <p>
                            The future of data collection is beautiful, fast, and respectful. By prioritizing the user experience, you're not just getting a lead; you're starting a high-quality relationship.
                        </p>
                    </div>

                    {/* Post Footer */}
                    <footer className="mt-24 pt-12 border-t border-border">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex items-center gap-4">
                                <Button variant="outline" className="gap-2 h-12 rounded-xl">
                                    <Share2 className="h-4 w-4" />
                                    Share Article
                                </Button>
                            </div>
                            <div className="flex items-center gap-6">
                                <Link to="/contact" className="text-sm font-medium hover:text-primary underline">Report an issue</Link>
                            </div>
                        </div>
                    </footer>
                </article>
            </main>

            {/* Recommended Posts */}
            <aside className="bg-muted/30 py-24 border-t border-border mt-24">
                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="text-3xl font-bold mb-12 text-center">More from Boltfy</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {blogPosts.filter(p => p.id !== post.id).slice(0, 3).map(p => (
                            <Link key={p.id} to={`/blog/${p.slug}`} className="group">
                                <div className="bg-card rounded-2xl overflow-hidden border border-border transition-all hover:shadow-xl hover:-translate-y-1">
                                    <div className="aspect-video overflow-hidden">
                                        <img src={p.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={p.title} />
                                    </div>
                                    <div className="p-6">
                                        <h3 className="font-bold mb-2 group-hover:text-primary transition-colors">{p.title}</h3>
                                        <p className="text-xs text-muted-foreground line-clamp-2">{p.excerpt}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </aside>

            <footer className="py-12 bg-card border-t border-border">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <Link to="/" className="flex items-center gap-2 justify-center mb-6">
                        <img src="/icon.png" alt="Logo" className="h-6 w-6" />
                        <span className="font-bold">Boltfy</span>
                    </Link>
                    <p className="text-xs text-muted-foreground underline">Back to Home</p>
                </div>
            </footer>
        </div>
    );
}
