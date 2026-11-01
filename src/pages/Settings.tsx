import { useCallback, useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Save, Send, User as UserIcon, Trash2, Mail, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export default function Settings() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [fullName, setFullName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [senderName, setSenderName] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [postalAddress, setPostalAddress] = useState("");
  const [loadingSender, setLoadingSender] = useState(true);
  const [savingSender, setSavingSender] = useState(false);

  const [confirmEmail, setConfirmEmail] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setFullName(user?.user_metadata?.full_name ?? "");
  }, [user]);

  const loadSenderSettings = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle();
    if (error) {
      toast({ title: "Could not load sender settings", description: error.message, variant: "destructive" });
    } else if (data) {
      setSenderName(data.sender_name ?? "");
      setReplyTo(data.reply_to_email ?? "");
      setPostalAddress(data.postal_address ?? "");
    }
    setLoadingSender(false);
  }, [user, toast]);

  useEffect(() => {
    loadSenderSettings();
  }, [loadSenderSettings]);

  const saveProfile = async () => {
    setSavingProfile(true);
    const { error } = await supabase.auth.updateUser({ data: { full_name: fullName.trim() } });
    setSavingProfile(false);
    if (error) {
      toast({ title: "Could not save profile", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile saved" });
    }
  };

  const saveSender = async () => {
    if (!user) return;
    const reply = replyTo.trim();
    if (reply && !EMAIL_RE.test(reply)) {
      toast({ title: "Check the reply-to address", description: "That doesn't look like a valid email address.", variant: "destructive" });
      return;
    }
    setSavingSender(true);
    const { error } = await supabase.from("user_settings").upsert(
      {
        user_id: user.id,
        sender_name: senderName.trim() || null,
        reply_to_email: reply || null,
        postal_address: postalAddress.trim() || null,
      },
      { onConflict: "user_id" },
    );
    setSavingSender(false);
    if (error) {
      toast({ title: "Could not save sender settings", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sender settings saved", description: "They'll be used on your next campaign." });
    }
  };

  const deleteAccount = async () => {
    if (!user?.email) return;
    setDeleting(true);
    const { data, error } = await supabase.functions.invoke("delete-account", { body: { email: confirmEmail.trim() } });
    if (error || !data?.success) {
      let message = "Please try again or contact support.";
      const ctx = (error as { context?: unknown } | null)?.context;
      if (ctx instanceof Response) {
        try {
          const body = await ctx.clone().json();
          if (typeof body?.error === "string") message = body.error;
        } catch {
          /* not JSON */
        }
      }
      toast({ title: "Could not delete your account", description: message, variant: "destructive" });
      setDeleting(false);
      return;
    }
    // The user no longer exists server-side; just clear the local session.
    await supabase.auth.signOut({ scope: "local" });
    window.location.assign("/");
  };

  const emailMatches = !!user?.email && confirmEmail.trim().toLowerCase() === user.email.toLowerCase();

  return (
    <Layout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account and how your emails look</p>
        </div>

        {/* Profile */}
        <Card className="overflow-hidden border-border bg-card/50 animate-fade-in">
          <CardHeader className="border-b border-border/50 bg-muted/30">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-2 border-primary/20 p-1 bg-background">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                  {(user?.user_metadata?.full_name || user?.email || "?").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-1">
                <CardTitle className="text-2xl font-bold">{user?.user_metadata?.full_name || "Your account"}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  {user?.email}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-foreground/70 flex items-center gap-2">
                <UserIcon className="h-4 w-4" /> Full name
              </Label>
              <Input id="fullName" value={fullName} maxLength={100} onChange={(e) => setFullName(e.target.value)} className="bg-background" />
            </div>
            <div className="flex justify-end">
              <Button onClick={saveProfile} disabled={savingProfile} className="gap-2">
                {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sender */}
        <Card className="animate-fade-in border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl">Email sender</CardTitle>
                <CardDescription>How your campaigns appear in your subscribers' inboxes</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="senderName">Sender name</Label>
              <Input
                id="senderName"
                value={senderName}
                maxLength={60}
                placeholder="Your brand or business name"
                disabled={loadingSender}
                onChange={(e) => setSenderName(e.target.value)}
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground">Shown as the “From” name. Emails are sent from Boltfy's address, so replies need the next field.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="replyTo">Reply-to email</Label>
              <Input
                id="replyTo"
                type="email"
                value={replyTo}
                placeholder={user?.email ?? "you@example.com"}
                disabled={loadingSender}
                onChange={(e) => setReplyTo(e.target.value)}
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground">Where replies go. Leave empty to use your login email.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalAddress">Postal address</Label>
              <Textarea
                id="postalAddress"
                rows={3}
                value={postalAddress}
                maxLength={300}
                placeholder={"123 Main Street\nCity, Country"}
                disabled={loadingSender}
                onChange={(e) => setPostalAddress(e.target.value)}
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground">
                Shown in the footer of every campaign. Anti-spam laws (such as CAN-SPAM) require a valid postal address in marketing emails.
              </p>
            </div>
            <div className="flex justify-end">
              <Button onClick={saveSender} disabled={savingSender || loadingSender} className="gap-2">
                {savingSender ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save sender settings
              </Button>
            </div>
            <p className="text-xs text-muted-foreground border-t border-border pt-4">
              Form-response notifications are set per form: open a form and use its “Notification Email” field.
            </p>
          </CardContent>
        </Card>

        {/* Danger zone */}
        <Card className="animate-fade-in border-destructive/20 bg-destructive/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-destructive/10 text-destructive">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl text-destructive">Danger zone</CardTitle>
                <CardDescription className="text-destructive/80">These actions are permanent</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-foreground">Delete account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently deletes your forms, responses, subscribers, campaigns and templates.
                </p>
              </div>
              <AlertDialog onOpenChange={(open) => !open && setConfirmEmail("")}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    Delete my account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This cannot be undone. To confirm, type your email address <strong>{user?.email}</strong>.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Input
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    placeholder={user?.email ?? ""}
                    aria-label="Type your email to confirm"
                    autoComplete="off"
                  />
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                    {/* A plain Button, not AlertDialogAction: the dialog must stay open until the request finishes. */}
                    <Button variant="destructive" disabled={!emailMatches || deleting} onClick={deleteAccount}>
                      {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Delete everything
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
