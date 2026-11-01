import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Plus,
  FileText,
  TrendingUp,
  Users,
  BarChart3,
  ArrowRight,
  Clock,
  Zap,
} from "lucide-react";
import { format } from "date-fns";

interface DashboardStats {
  totalForms: number;
  totalSubmissions: number;
  thisWeek: number;
  activeSubscribers: number;
}

interface RecentSubmission {
  id: string;
  form_name: string | null;
  created_at: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  // null = not loaded (or failed): show a dash rather than a made-up zero.
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getUserName = () => {
    return user?.user_metadata?.full_name || user?.email?.split("@")[0] || "there";
  };

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // One aggregate query for the counters (the old code counted the rows of a
    // `.limit(5)` query, so "Responses" could never exceed 5) plus the latest few.
    const [statsRes, recentRes] = await Promise.all([
      supabase.rpc("get_dashboard_stats"),
      supabase
        .from("form_submissions")
        .select("id, form_name, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const row = statsRes.data?.[0];
    if (statsRes.error || !row) {
      console.error("Error loading dashboard stats:", statsRes.error);
      setStats(null);
    } else {
      setStats({
        totalForms: Number(row.total_forms),
        totalSubmissions: Number(row.total_submissions),
        thisWeek: Number(row.submissions_this_week),
        activeSubscribers: Number(row.active_subscribers),
      });
    }

    setRecentSubmissions(recentRes.data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const fmt = (n: number | undefined) => (n === undefined ? "\u2014" : n.toLocaleString());

  const statCards = [
    {
      title: "Total Forms",
      value: fmt(stats?.totalForms),
      icon: FileText,
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      title: "Responses",
      value: fmt(stats?.totalSubmissions),
      icon: BarChart3,
      gradient: "from-purple-500 to-pink-500",
    },
    {
      title: "Last 7 Days",
      value: stats ? `+${stats.thisWeek.toLocaleString()}` : "\u2014",
      icon: TrendingUp,
      gradient: "from-green-500 to-emerald-500",
    },
    {
      title: "Active Subscribers",
      value: fmt(stats?.activeSubscribers),
      icon: Users,
      gradient: "from-orange-500 to-red-500",
    },
  ];

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {getGreeting()}, {getUserName()}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Here's what's happening with your forms
            </p>
          </div>
          <Button
            onClick={() => navigate("/forms/new")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Form
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <Card
              key={index}
              className="bg-card border-border hover:border-primary/50 transition-all hover:-translate-y-1 shadow-sm"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Submissions */}
          <Card className="lg:col-span-2 bg-card border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
              <CardTitle className="text-foreground text-lg">Recent Responses</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/forms")}
                className="text-muted-foreground hover:text-foreground"
              >
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {recentSubmissions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">No responses yet</h3>
                  <p className="text-muted-foreground text-sm mb-6">
                    Create a form and share it to start collecting data
                  </p>
                  <Button
                    onClick={() => navigate("/forms/new")}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Create Your First Form
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 pt-4">
                  {recentSubmissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border hover:border-primary/30 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {submission.form_name || "Unknown Form"}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(submission.created_at), "MMM d, h:mm a")}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-foreground text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              <Button
                variant="outline"
                className="w-full justify-start gap-4 h-auto py-4 border-border hover:bg-muted/5 transition-all hover:scale-[1.02]"
                onClick={() => navigate("/forms/new")}
              >
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-md">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">Create Form</p>
                  <p className="text-xs text-muted-foreground">Start from scratch</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-4 h-auto py-4 border-border hover:bg-muted/50 transition-all hover:scale-[1.02] bg-background"
                onClick={() => navigate("/forms")}
              >
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-md">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">Manage Forms</p>
                  <p className="text-xs text-muted-foreground">View and edit forms</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-4 h-auto py-4 border-border hover:bg-muted/50 transition-all hover:scale-[1.02] bg-background"
                onClick={() => navigate("/settings")}
              >
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-md">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">Settings</p>
                  <p className="text-xs text-muted-foreground">Customize your account</p>
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
