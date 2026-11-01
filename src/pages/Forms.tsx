import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, FileText, Inbox, Loader2, Trash2, Eye, Database, Edit, Link2, Copy, ExternalLink, Bell, Clock, Users } from "lucide-react";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import type { Json } from "@/integrations/supabase/types";

interface CustomForm {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  fields: Json;
  created_at: string;
  submission_count?: number;
}

interface Submission {
  id: string;
  created_at: string;
  form_name: string | null;
  metadata: Json;
  form_id: string | null;
}

export default function Forms() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [forms, setForms] = useState<CustomForm[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [seenSubmissions, setSeenSubmissions] = useState<Set<string>>(new Set());
  // `submissions` below is only the latest 100; this is the real total.
  const [totalResponses, setTotalResponses] = useState(0);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [formsRes, subsRes, countsRes] = await Promise.all([
      supabase.from("custom_forms").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("form_submissions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
      supabase.rpc("get_form_submission_counts"),
    ]);

    // Real per-form totals from the database, not a count of the 100 rows we happen to have loaded.
    const counts = new Map<string, number>();
    (countsRes.data ?? []).forEach((c) => counts.set(c.form_id, Number(c.submissions)));

    if (formsRes.data) {
      setForms(formsRes.data.map((form) => ({ ...form, submission_count: counts.get(form.id) ?? 0 })));
    }
    if (subsRes.data) {
      setSubmissions(subsRes.data);
    }
    setTotalResponses([...counts.values()].reduce((sum, n) => sum + n, 0));

    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchData();
      try {
        const seen = localStorage.getItem(`seen_submissions_${user.id}`);
        if (seen) {
          setSeenSubmissions(new Set(JSON.parse(seen)));
        }
      } catch {
        // corrupted/blocked storage must not break the page
      }
    }
  }, [user, fetchData]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('form-submissions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'form_submissions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newSubmission = payload.new as Submission;
          setSubmissions((prev) => [newSubmission, ...prev]);
          setTotalResponses((n) => n + 1);
          setForms((prev) =>
            prev.map((f) =>
              f.id === newSubmission.form_id ? { ...f, submission_count: (f.submission_count ?? 0) + 1 } : f
            )
          );

          toast({
            title: "New Response",
            description: `Someone filled out "${newSubmission.form_name || 'your form'}"`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  const handleDelete = async (formId: string) => {
    const { error } = await supabase.from("custom_forms").delete().eq("id", formId);
    if (error) {
      toast({ title: "Error", description: "Failed to delete form", variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Form deleted successfully" });
      fetchData();
    }
  };

  const getFieldCount = (fields: Json): number => {
    return Array.isArray(fields) ? fields.length : 0;
  };

  const getSubmissionPreview = (metadata: Json): Record<string, string> => {
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return {};
    return metadata as Record<string, string>;
  };

  const copyFormLink = (form: CustomForm) => {
    const link = `${window.location.origin}/f/${form.slug || form.id}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link Copied",
      description: "Share this link with your clients",
    });
  };

  const getFormLink = (form: CustomForm) => {
    return `${window.location.origin}/f/${form.slug || form.id}`;
  };

  const markAsSeen = (submissionId: string) => {
    if (!user) return;
    const newSeen = new Set(seenSubmissions);
    newSeen.add(submissionId);
    setSeenSubmissions(newSeen);
    localStorage.setItem(`seen_submissions_${user.id}`, JSON.stringify([...newSeen]));
  };

  const newSubmissionsCount = submissions.filter(s => !seenSubmissions.has(s.id)).length;

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Forms</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Create and manage your forms
            </p>
          </div>
          <Button
            onClick={() => navigate("/forms/new")}
            className="bg-gradient-to-r from-brand to-purple-500 hover:from-brand-dark hover:to-purple-600 shadow-lg shadow-brand/25 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Form
          </Button>
        </div>

        <Tabs defaultValue="forms" className="space-y-4 sm:space-y-6">
          <TabsList className="bg-muted border border-border w-full sm:w-auto overflow-x-auto">
            <TabsTrigger value="forms" className="gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="h-4 w-4" />
              <span>Forms ({forms.length})</span>
            </TabsTrigger>
            <TabsTrigger value="submissions" className="gap-1 sm:gap-2 text-xs sm:text-sm relative data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Database className="h-4 w-4" />
              <span>Responses ({totalResponses})</span>
              {newSubmissionsCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                  {newSubmissionsCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="forms" className="animate-fade-in">
            {forms.length === 0 ? (
              <Card className="bg-card border-border border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
                    <FileText className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-medium text-foreground mb-2">No forms yet</h3>
                  <p className="text-muted-foreground text-sm mb-6 text-center max-w-sm">
                    Create your first form to start collecting data from your clients
                  </p>
                  <Button
                    onClick={() => navigate("/forms/new")}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Form
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {forms.map((form, index) => (
                  <Card
                    key={form.id}
                    className="bg-card border-border hover:border-primary/30 transition-all group hover:-translate-y-1 shadow-sm"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 cursor-pointer" onClick={() => navigate(`/forms/${form.id}`)}>
                          <CardTitle className="text-lg text-foreground group-hover:text-primary transition-colors">
                            {form.name}
                          </CardTitle>
                          {form.description && (
                            <CardDescription className="line-clamp-2 mt-1 text-muted-foreground">
                              {form.description}
                            </CardDescription>
                          )}
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 hover:bg-red-500/10">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-slate-900 border-white/10">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">Delete form?</AlertDialogTitle>
                              <AlertDialogDescription className="text-slate-400">
                                This will permanently delete "{form.name}" and all its responses.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-slate-800 border-white/10 text-white hover:bg-slate-700">Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(form.id)} className="bg-red-500 hover:bg-red-600">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-muted text-muted-foreground border-border">
                          {getFieldCount(form.fields)} fields
                        </Badge>
                        <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                          <Users className="h-3 w-3 mr-1" />
                          {form.submission_count} responses
                        </Badge>
                      </div>

                      {/* Shareable Link */}
                      <div className="bg-muted/30 rounded-xl p-3 border border-border">
                        <div className="flex items-center gap-2 mb-2">
                          <Link2 className="h-4 w-4 text-primary" />
                          <span className="text-xs font-medium text-primary">Share Link</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            value={getFormLink(form)}
                            readOnly
                            className="text-xs h-8 bg-background border-border text-foreground"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 shrink-0 border-border text-muted-foreground hover:text-foreground"
                            onClick={() => copyFormLink(form)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 shrink-0 border-border text-muted-foreground hover:text-foreground"
                            onClick={() => window.open(getFormLink(form), '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(form.created_at), "MMM d, yyyy")}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 h-7 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => navigate(`/forms/${form.id}`)}
                        >
                          <Edit className="h-3 w-3" />
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="submissions" className="animate-fade-in">
            {submissions.length === 0 ? (
              <Card className="bg-card border-border border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
                    <Inbox className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-medium text-foreground mb-2">No responses yet</h3>
                  <p className="text-muted-foreground text-sm text-center max-w-sm">
                    Share your forms to start receiving responses
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {submissions.map((submission) => {
                  const form = forms.find((f) => f.id === submission.form_id);
                  const isNew = !seenSubmissions.has(submission.id);
                  const data = getSubmissionPreview(submission.metadata);

                  return (
                    <Card
                      key={submission.id}
                      className={`bg-card border-border transition-all cursor-pointer hover:border-primary/50 shadow-sm ${isNew ? 'ring-1 ring-primary/50 bg-primary/5' : ''}`}
                      onClick={() => markAsSeen(submission.id)}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-wrap">
                            {isNew && (
                              <Badge className="bg-primary text-primary-foreground w-fit">New</Badge>
                            )}
                            <Badge variant="secondary" className="bg-muted text-muted-foreground border-border w-fit">
                              {form?.name || submission.form_name || "Unknown Form"}
                            </Badge>
                            <span className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(submission.created_at), "MMM d, yyyy 'at' HH:mm")}
                            </span>
                          </div>
                          {form && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); navigate(`/forms/${form.id}`); }}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Form
                            </Button>
                          )}
                        </div>

                        {/* Response Data */}
                        <div className="bg-muted/30 rounded-xl p-4 space-y-2 border border-border">
                          {Object.entries(data).slice(0, 5).map(([key, value]) => (
                            <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-1">
                              <span className="text-xs font-semibold text-muted-foreground tracking-tight capitalize min-w-[120px]">
                                {key.replace(/_/g, ' ')}:
                              </span>
                              <span className="text-sm text-foreground">{String(value)}</span>
                            </div>
                          ))}
                          {Object.keys(data).length > 5 && (
                            <p className="text-xs text-muted-foreground">+{Object.keys(data).length - 5} more fields</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
