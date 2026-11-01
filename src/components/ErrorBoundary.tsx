import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

// A deploy replaces the hashed chunk files; a tab opened before it then fails to
// import the next route. That is "there is a newer version", not "a bug".
const STALE_CHUNK = /dynamically imported module|importing a module script failed|ChunkLoadError|Loading chunk/i;

/** Catches render errors so one broken page shows a message instead of a blank white screen. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const stale = STALE_CHUNK.test(error.message);
    return (
      <div role="alert" className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <div className="mx-auto h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {stale ? "A new version is available" : "Something went wrong"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {stale
              ? "Reload the page to get the latest version."
              : "This page hit an unexpected error. Your data is safe. Try reloading, or go back to the dashboard."}
          </p>
          <div className="flex justify-center gap-3">
            <Button onClick={() => window.location.reload()}>Reload</Button>
            {!stale && (
              <Button variant="outline" onClick={() => window.location.assign("/dashboard")}>
                Dashboard
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }
}
