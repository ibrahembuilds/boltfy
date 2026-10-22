import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { Blocks } from "@/components/content/Blocks";
import { aboutBlocks } from "@/seo/content";
import { SITE_EMAIL } from "@/seo/site";

export default function About() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <BrandLogo size="md" />
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/blog" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Guides
            </Link>
            <Link to="/contact" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Contact
            </Link>
            <Link to="/login">
              <Button variant="ghost" className="text-sm">
                Log in
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                Sign up
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 py-20 px-6">
        <article className="max-w-3xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-4">About</p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-8">About Boltfy</h1>
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <Blocks blocks={aboutBlocks} />
          </div>
          <div className="mt-12 flex flex-col sm:flex-row gap-3">
            <Link to="/signup">
              <Button className="bg-primary hover:bg-primary/90">Create a free account</Button>
            </Link>
            <a href={`mailto:${SITE_EMAIL}`}>
              <Button variant="outline">Email {SITE_EMAIL}</Button>
            </a>
          </div>
        </article>
      </main>

      <footer className="border-t border-border py-12 bg-card/30">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Boltfy</p>
          <div className="flex gap-6">
            <Link to="/blog" className="hover:text-foreground">
              Guides
            </Link>
            <Link to="/contact" className="hover:text-foreground">
              Contact
            </Link>
            <Link to="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-foreground">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
