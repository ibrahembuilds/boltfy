import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ModeToggle } from "@/components/mode-toggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  FileCode,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Users,
  HelpCircle,
  Zap,
  Menu,
  X,
  Mail,
  FileText,
  Plug,
} from "lucide-react";
import { BrandLogo } from "./BrandLogo";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: FileCode, label: "Forms", path: "/forms" },
  { icon: Plug, label: "Connect", path: "/connect" },
  { icon: Users, label: "Subscribers", path: "/subscribers" },
  { icon: Mail, label: "Campaigns", path: "/campaigns" },
  { icon: FileText, label: "Templates", path: "/templates" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  collapsed?: boolean;
  onCollapse?: () => void;
}

// Sidebar content component (shared between desktop and mobile)
function SidebarContent({ collapsed, onCollapse, onNavigate }: {
  collapsed: boolean;
  onCollapse?: () => void;
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const getUserInitials = () => {
    if (!user) return "U";
    const name = user.user_metadata?.full_name || user.email || "User";
    return name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserName = () => {
    if (!user) return "User";
    return user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
  };

  const getUserEmail = () => {
    return user?.email || "";
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 md:h-20 items-center justify-between px-4 border-b border-border">
        {!collapsed && (
          <Link to="/dashboard" className="flex items-center gap-3 group" onClick={onNavigate}>
            <BrandLogo size="md" />
          </Link>
        )}
        {collapsed && (
          <Link to="/dashboard" className="mx-auto group" onClick={onNavigate}>
            <BrandLogo size="md" iconOnly />
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 md:py-6 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path === "/forms" && location.pathname.startsWith("/forms")) ||
            (item.path === "/templates" && location.pathname.startsWith("/templates"));
          return (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Pro Badge */}
      {!collapsed && (
        <div className="mx-3 mb-4 p-4 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Zap className="h-4 w-4" />
            <span className="text-sm font-medium">Free Forever</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Unlimited forms and responses. No hidden fees.
          </p>
        </div>
      )}

      {/* User Profile */}
      <div className="border-t border-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 h-auto py-3 hover:bg-muted/50 text-foreground",
                collapsed && "justify-center px-0"
              )}
            >
              <Avatar className="h-9 w-9 border border-border shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex flex-col items-start text-left min-w-0">
                  <span className="text-sm font-medium text-foreground truncate max-w-[140px]">
                    {getUserName()}
                  </span>
                  <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                    {getUserEmail()}
                  </span>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-card border-border shadow-lg">
            <DropdownMenuLabel className="text-foreground">
              <div className="flex flex-col">
                <span className="font-medium">{getUserName()}</span>
                <span className="font-normal text-xs text-muted-foreground">
                  {getUserEmail()}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem onClick={() => { navigate("/settings"); onNavigate?.(); }} className="text-muted-foreground focus:text-foreground focus:bg-muted">
              <User className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="text-muted-foreground focus:text-foreground focus:bg-muted">
              <HelpCircle className="mr-2 h-4 w-4" />
              Help
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-red-500 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Collapse Button & Theme Toggle - Desktop only */}
      <div className="border-t border-border p-2 hidden md:block">
        <button
          onClick={onCollapse}
          className="flex w-full items-center justify-center rounded-lg p-2.5 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <div className="flex items-center gap-2">
              <ChevronLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Collapse</span>
            </div>
          )}
        </button>
        {!collapsed && (
          <div className="mt-2 flex items-center justify-between px-2 py-1 bg-muted/30 rounded-lg border border-border">
            <span className="text-xs font-medium text-muted-foreground">Appearance</span>
            <ModeToggle />
          </div>
        )}
        {collapsed && (
          <div className="mt-2 flex justify-center">
            <ModeToggle />
          </div>
        )}
      </div>

      {/* Theme Toggle - Mobile only */}
      <div className="border-t border-border p-3 md:hidden">
        <div className="flex items-center justify-between px-2 py-1 bg-muted/30 rounded-lg border border-border">
          <span className="text-xs font-medium text-muted-foreground">Appearance</span>
          <ModeToggle />
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ 
  mobileOpen, 
  onMobileClose,
  collapsed: controlledCollapsed,
  onCollapse
}: SidebarProps) {
  const [localCollapsed, setLocalCollapsed] = useState(false);
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : localCollapsed;
  const handleCollapse = onCollapse || (() => setLocalCollapsed(!localCollapsed));

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out hidden md:block",
          "bg-background border-r border-border",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent
          collapsed={isCollapsed}
          onCollapse={handleCollapse}
        />
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={mobileOpen} onOpenChange={onMobileClose}>
        <SheetContent side="left" className="p-0 w-72 bg-background border-border">
          <SidebarContent
            collapsed={false}
            onNavigate={onMobileClose}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}

// Export collapsed state hook for Layout component
export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(false);
  return { collapsed, setCollapsed };
}
