import { useParams, Link, useNavigate } from "react-router-dom";
import { findArticle, blogArticles } from "@/seo/blog";
import { absoluteUrl, formatLongDate } from "@/seo/site";
import { Blocks } from "@/components/content/Blocks";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Calendar, Clock, Facebook, Twitter, Linkedin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";

export default function BlogPost() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const post = findArticle(slug);

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
            {/* Article Navigation */}
            <nav className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link to="/blog" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-all group">
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Blog
                    </Link>
                        <div className="hidden md:flex items-center gap-4">
                        <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Share:</span>
                        <ShareLinks title={post.title} path={`/blog/${post.slug}`} />
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
                                    {formatLongDate(post.published)}
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
                    <div className="max-w-none">
                        <p className="text-xl text-muted-foreground leading-relaxed mb-8 border-l-4 border-primary pl-6 py-2">
                            {post.description}
                        </p>
                        <Blocks blocks={post.sections} />
                    </div>

                    {/* Post Footer */}
                    <footer className="mt-24 pt-12 border-t border-border">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                            <ShareLinks title={post.title} path={`/blog/${post.slug}`} />
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
                        {blogArticles.filter((p) => p.slug !== post.slug).slice(0, 3).map(p => (
                            <Link key={p.slug} to={`/blog/${p.slug}`} className="group">
                                <div className="bg-card rounded-2xl overflow-hidden border border-border transition-all hover:shadow-xl hover:-translate-y-1">
                                    <div className="aspect-video overflow-hidden">
                                        <img src={p.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={p.title} />
                                    </div>
                                    <div className="p-6">
                                        <h3 className="font-bold mb-2 group-hover:text-primary transition-colors">{p.title}</h3>
                                        <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
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
                    <Link to="/" className="text-xs text-muted-foreground underline">Back to Home</Link>
                </div>
            </footer>
        </div>
    );
}

function ShareLinks({ title, path }: { title: string; path: string }) {
    const url = encodeURIComponent(absoluteUrl(path));
    const text = encodeURIComponent(title);
    const links = [
        { label: "Share on X", href: `https://twitter.com/intent/tweet?url=${url}&text=${text}`, icon: Twitter },
        { label: "Share on Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${url}`, icon: Facebook },
        { label: "Share on LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`, icon: Linkedin },
    ];

    return (
        <div className="flex gap-2">
            {links.map((link) => {
                const Icon = link.icon;
                return (
                    <Button key={link.label} variant="ghost" size="icon" className="h-8 w-8 rounded-full" asChild>
                        <a href={link.href} target="_blank" rel="noopener noreferrer" aria-label={link.label}>
                            <Icon className="h-4 w-4" />
                        </a>
                    </Button>
                );
            })}
        </div>
    );
}
