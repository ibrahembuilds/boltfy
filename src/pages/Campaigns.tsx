import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { emailService } from "@/lib/email";
import {
  Send,
  FileText,
  Clock,
  CheckCircle,
  Mail,
  Loader2,
  AlertTriangle,
  Pencil,
  Trash2,
  FlaskConical,
  RotateCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type Campaign = Tables<"campaigns">;

const statusConfig: Record<string, { icon: typeof FileText; color: string; label: string }> = {
  draft: { icon: FileText, color: "bg-muted text-muted-foreground", label: "Draft" },
  scheduled: { icon: Clock, color: "bg-warning/10 text-warning", label: "Scheduled" },
  sending: { icon: Loader2, color: "bg-primary/10 text-primary", label: "Sending" },
  sent: { icon: CheckCircle, color: "bg-success/10 text-success", label: "Sent" },
  failed: { icon: AlertTriangle, color: "bg-destructive/10 text-destructive", label: "Failed" },
};

export default function Campaigns() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [tab, setTab] = useState("compose");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // The campaign being composed. `editingId` is set once it exists in the
  // database (a saved draft, or a failed send being retried) so retrying
  // never creates a second row.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [campaignsRes, activeRes] = await Promise.all([
        supabase.from("campaigns").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase
          .from("subscribers")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "active"),
      ]);

      if (campaignsRes.error) throw campaignsRes.error;
      if (activeRes.error) throw activeRes.error;

      setCampaigns(campaignsRes.data || []);
      setActiveCount(activeRes.count ?? 0);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error loading data",
        description: "Could not load campaigns. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetComposer = () => {
    setEditingId(null);
    setSubject("");
    setContent("");
  };

  const loadIntoComposer = (campaign: Campaign) => {
    setEditingId(campaign.id);
    setSubject(campaign.subject);
    setContent(campaign.content ?? "");
    setTab("compose");
  };

  /** Create the draft, or update it if it already exists. Returns its id. */
  const persistDraft = async (): Promise<string> => {
    if (!user) throw new Error("Not signed in");
    if (editingId) {
      const { error } = await supabase
        .from("campaigns")
        .update({ subject: subject.trim(), content })
        .eq("id", editingId);
      if (error) throw error;
      return editingId;
    }
    const { data, error } = await supabase
      .from("campaigns")
      .insert({ subject: subject.trim(), content, status: "draft", user_id: user.id })
      .select("id")
      .single();
    if (error) throw error;
    setEditingId(data.id);
    return data.id;
  };

  const validate = (needContent: boolean): boolean => {
    if (!subject.trim() || (needContent && !content.trim())) {
      toast({
        title: "Missing fields",
        description: needContent ? "Please fill in the subject and content." : "Please enter a subject.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleSaveDraft = async () => {
    if (!validate(false)) return;
    setIsSaving(true);
    try {
      await persistDraft();
      toast({ title: "Draft saved", description: "You can pick it up again from the History tab." });
      await fetchData();
    } catch (error) {
      console.error("Error saving draft:", error);
      toast({ title: "Error saving draft", description: "Could not save the draft. Please try again.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!validate(true)) return;
    setIsTesting(true);
    try {
      const result = await emailService.sendTestCampaign(subject.trim(), content);
      if (result.dryRun) {
        toast({
          title: "Email delivery is not set up",
          description: "The server has no email provider key (RESEND_API_KEY), so nothing was actually sent.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Test email sent", description: `Check the inbox of ${result.sentTo ?? "your account"}.` });
      }
    } catch (error) {
      toast({
        title: "Could not send the test",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSend = async () => {
    setConfirmSend(false);
    if (!validate(true)) return;

    setIsSending(true);
    try {
      const id = await persistDraft();
      const result = await emailService.sendCampaign(id);

      if (result.dryRun) {
        toast({
          title: "Nothing was delivered",
          description:
            "The server has no email provider key (RESEND_API_KEY), so this was a dry run. Set the secret and send again.",
          variant: "destructive",
        });
      } else if (result.timedOut) {
        toast({
          title: "Partially sent",
          description: `${result.delivered} of ${result.total} delivered before the time limit. Open it from History to continue.`,
          variant: "destructive",
        });
      } else if ((result.failed ?? 0) > 0) {
        toast({
          title: "Campaign sent with errors",
          description: `Delivered to ${result.delivered} of ${result.total}. ${result.error ?? ""}`.trim(),
          variant: "destructive",
        });
        resetComposer();
      } else {
        toast({ title: "Campaign sent!", description: `Delivered to ${result.delivered} of ${result.total} subscribers.` });
        resetComposer();
      }
    } catch (error) {
      console.error("Error sending campaign:", error);
      toast({
        title: "Campaign was not sent",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
      fetchData();
    }
  };

  const handleDelete = async () => {
    if (!campaignToDelete) return;
    const { error } = await supabase.from("campaigns").delete().eq("id", campaignToDelete.id);
    if (error) {
      toast({ title: "Could not delete", description: "Please try again.", variant: "destructive" });
    } else {
      if (editingId === campaignToDelete.id) resetComposer();
      toast({ title: "Deleted", description: "The draft was removed." });
      fetchData();
    }
    setCampaignToDelete(null);
  };

  const busy = isSending || isSaving || isTesting;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-slide-up">
          <h1 className="text-3xl font-bold text-foreground">Campaigns</h1>
          <p className="text-muted-foreground mt-1">Create and manage your email campaigns.</p>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="compose" className="gap-2">
              <Mail className="h-4 w-4" />
              Compose
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Clock className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>{editingId ? "Edit Campaign" : "Create New Campaign"}</CardTitle>
                    <CardDescription>
                      Compose your email and send it to {activeCount.toLocaleString()} active{" "}
                      {activeCount === 1 ? "subscriber" : "subscribers"}.
                    </CardDescription>
                  </div>
                  {editingId && (
                    <Button variant="ghost" size="sm" onClick={resetComposer} disabled={busy}>
                      Start a new one
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject Line</Label>
                  <Input
                    id="subject"
                    placeholder="Enter your email subject..."
                    value={subject}
                    maxLength={200}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Email Content</Label>
                  <Textarea
                    id="content"
                    placeholder={"Hi {{first_name}},\n\nWrite your email here. Blank lines start a new paragraph."}
                    className="min-h-[300px] resize-y"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Plain text or HTML. Personalise with <code>{"{{first_name}}"}</code>, <code>{"{{name}}"}</code> or{" "}
                    <code>{"{{email}}"}</code>. An unsubscribe link and your postal address (Settings) are added
                    automatically.
                  </p>
                </div>
                <div className="flex flex-col gap-4 pt-4 border-t border-border sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    This email will be sent to{" "}
                    <span className="font-semibold text-foreground">{activeCount.toLocaleString()}</span> active{" "}
                    {activeCount === 1 ? "subscriber" : "subscribers"}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" onClick={handleSaveDraft} disabled={busy}>
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Draft"}
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={handleSendTest} disabled={busy}>
                      {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
                      Send test to me
                    </Button>
                    <Button
                      variant="gradient"
                      className="gap-2"
                      onClick={() => (validate(true) ? setConfirmSend(true) : undefined)}
                      disabled={busy || activeCount === 0}
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Send Campaign
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                {isSending && (
                  <p className="text-sm text-muted-foreground">
                    Sending in batches. Large lists can take a minute or two, so keep this tab open.
                  </p>
                )}
                {activeCount === 0 && !isLoading && (
                  <p className="text-sm text-muted-foreground">
                    You have no active subscribers yet. Add some on the Subscribers page, or share a newsletter form.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4 animate-fade-in">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : campaigns.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="rounded-full bg-accent p-4 mb-4">
                    <Mail className="h-8 w-8 text-accent-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No campaigns yet</h3>
                  <p className="text-muted-foreground text-center max-w-sm">
                    Create your first campaign to start reaching your subscribers.
                  </p>
                </CardContent>
              </Card>
            ) : (
              campaigns.map((campaign, index) => {
                const config = statusConfig[campaign.status] || statusConfig.draft;
                const StatusIcon = config.icon;
                const editable = campaign.status === "draft" || campaign.status === "failed";
                return (
                  <Card key={campaign.id} className="animate-slide-up" style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}>
                    <CardContent className="p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className={cn("p-3 rounded-xl shrink-0", config.color)}>
                            <StatusIcon className={cn("h-5 w-5", campaign.status === "sending" && "animate-spin")} />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-foreground truncate">{campaign.subject}</h3>
                            <div className="flex flex-wrap items-center gap-x-3 mt-1 text-sm text-muted-foreground">
                              {campaign.status !== "draft" && (
                                <span>{(campaign.recipients_count ?? 0).toLocaleString()} delivered</span>
                              )}
                              {campaign.failed_count > 0 && (
                                <span className="text-destructive">{campaign.failed_count.toLocaleString()} failed</span>
                              )}
                              {campaign.status === "draft" && <span>Not sent yet</span>}
                            </div>
                            {campaign.last_error && (
                              <p className="text-xs text-destructive mt-1 break-words">{campaign.last_error}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 sm:text-right">
                          <div>
                            <Badge variant="outline" className={cn("capitalize", config.color)}>
                              {config.label}
                            </Badge>
                            <p className="text-sm text-muted-foreground mt-1">
                              {format(new Date(campaign.sent_at ?? campaign.created_at), "MMM d, yyyy")}
                            </p>
                          </div>
                          {editable && (
                            <div className="flex gap-1">
                              <Button variant="outline" size="sm" className="gap-2" onClick={() => loadIntoComposer(campaign)}>
                                {campaign.status === "failed" ? <RotateCw className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                                {campaign.status === "failed" ? "Retry" : "Edit"}
                              </Button>
                              {campaign.status === "draft" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label="Delete draft"
                                  onClick={() => setCampaignToDelete(campaign)}
                                >
                                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Sending is irreversible: always confirm, and say to how many people. */}
      <AlertDialog open={confirmSend} onOpenChange={setConfirmSend}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Send to {activeCount.toLocaleString()} {activeCount === 1 ? "person" : "people"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              “{subject.trim()}” will be emailed to every active subscriber right now. This can't be undone. Not sure how
              it looks? Cancel and use “Send test to me” first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSend}>Send now</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!campaignToDelete} onOpenChange={(open) => !open && setCampaignToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this draft?</AlertDialogTitle>
            <AlertDialogDescription>“{campaignToDelete?.subject}” will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
