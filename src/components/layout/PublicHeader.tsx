import { Link, useLocation } from "react-router-dom";
import { ModeToggle } from "@/components/mode-toggle";

const links = [
  { to: "/connect", label: "Connect" },
  { to: "/docs", label: "Docs" },
];

export function PublicHeader() {
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-4 px-5">
        <Link to="/" className="text-sm font-semibold tracking-tight">Boltfy</Link>
        <nav className="flex items-center gap-4 text-sm" aria-label="Primary">
          {links.map((link) => {
            const active = pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={active ? "text-foreground" : "text-muted-foreground hover:text-foreground"}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
          <Link to="/login" className="hidden text-muted-foreground hover:text-foreground sm:inline">Log in</Link>
          <ModeToggle />
        </nav>
      </div>
    </header>
  );
}
