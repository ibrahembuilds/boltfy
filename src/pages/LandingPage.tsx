import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SEO } from "@/components/layout/SEO";

const steps = [
  { title: "Paste your page", body: "Drop in the HTML you already have. If it has no form, Boltfy adds name, email, and message." },
  { title: "Copy the link", body: "That link is the form’s address. Put it on your site, or use the HTML Boltfy rewrites for you." },
  { title: "Read the responses", body: "Every submission shows up on Connect. You can also send a test before the page is live." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Boltfy"
        description="Paste an HTML page. Boltfy gives the form a link and keeps every response."
      />
      <PublicHeader />
      <main className="mx-auto max-w-2xl px-5 py-16 sm:py-24">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">A form needs a place to go.</h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">
          Paste a page you already have. Boltfy gives you one link and keeps every response.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button asChild className="h-11 px-5">
            <Link to="/connect">Connect a page</Link>
          </Button>
          <Button asChild variant="outline" className="h-11 px-5">
            <Link to="/connect?example=1">Try an example</Link>
          </Button>
        </div>
        <ol className="mt-16 space-y-8">
          {steps.map((step, index) => (
            <li key={step.title} className="grid grid-cols-[2rem_1fr] gap-4">
              <span className="text-sm font-medium text-muted-foreground">{index + 1}</span>
              <div>
                <h2 className="text-lg font-semibold">{step.title}</h2>
                <p className="mt-1 text-base leading-7 text-muted-foreground">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-16 text-sm leading-6 text-muted-foreground">
          <Link to="/docs" className="text-foreground underline-offset-4 hover:underline">Read how Boltfy works</Link>
          <span className="mx-2">·</span>
          <Link to="/login" className="text-foreground underline-offset-4 hover:underline">Log in</Link>
          <span> to build a form inside Boltfy</span>
        </p>
      </main>
    </div>
  );
}
