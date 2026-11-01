import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormBuilder, FormField, FormStyle, defaultFormStyle } from "@/components/forms/FormBuilder";
import { FormPreview } from "@/components/forms/FormPreview";
import { FormSubmissions } from "@/components/forms/FormSubmissions";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Save, Loader2, Code, Copy, Check, Eye, Database, Settings, Link2, Mail } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";
import { resolveSlug, slugify } from "@/lib/slug";

interface CustomForm {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  fields: Json;
  settings: Json;
}

export default function FormEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const isNew = id === "new" || !id;

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<FormField[]>([]);
  const [style, setStyle] = useState<FormStyle>(defaultFormStyle);
  const [notificationEmail, setNotificationEmail] = useState("");
  const [formId, setFormId] = useState<string | null>(isNew ? null : id || null);

  // New state for builder orchestration
  const [activeEditorTab, setActiveEditorTab] = useState("builder");
  const [activeBuilderTab, setActiveBuilderTab] = useState("fields");
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);

  const fetchForm = useCallback(async (formId: string) => {
    const { data, error } = await supabase
      .from("custom_forms")
      .select("*")
      .eq("id", formId)
      .maybeSingle();

    if (error || !data) {
      toast({ title: "Error", description: "Form not found", variant: "destructive" });
      navigate("/forms");
      return;
    }

    setName(data.name);
    setSlug(data.slug);
    setDescription(data.description || "");
    setFields(Array.isArray(data.fields) ? (data.fields as unknown as FormField[]) : []);

    const settings = data.settings as { style?: FormStyle; notification_email?: string } | null;
    if (settings?.style) {
      setStyle({ ...defaultFormStyle, ...settings.style });
    }
    if (settings?.notification_email) {
      setNotificationEmail(settings.notification_email);
    }

    setFormId(data.id);
    setLoading(false);
  }, [navigate, toast]);

  useEffect(() => {
    if (!isNew && id) {
      fetchForm(id);
    }
  }, [id, isNew, fetchForm]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "Error", description: "Form name is required", variant: "destructive" });
      return;
    }

    if (!user) {
      toast({ title: "Error", description: "You must be logged in", variant: "destructive" });
      return;
    }

    const trimmedNotification = notificationEmail.trim();
    if (trimmedNotification && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedNotification)) {
      toast({ title: "Check the notification email", description: "That doesn't look like a valid email address.", variant: "destructive" });
      return;
    }

    // URL-safe, and never empty (names with no Latin letters used to produce "" and collide)
    const formSlug = resolveSlug(slug, name);
    setSaving(true);

    try {
      const formData = {
        name,
        slug: formSlug,
        description: description || null,
        fields: fields as unknown as Json,
        settings: {
          style,
          notification_email: trimmedNotification || user.email || null
        } as unknown as Json,
        user_id: user.id,
      };

      if (isNew) {
        const { data, error } = await supabase
          .from("custom_forms")
          .insert([formData])
          .select()
          .single();

        if (error) throw error;
        toast({ title: "Form Created", description: "Your form is ready to share" });
        navigate(`/forms/${data.id}`);
      } else {
        const { error } = await supabase
          .from("custom_forms")
          .update(formData)
          .eq("id", id);

        if (error) throw error;
        setSlug(formSlug);
        toast({ title: "Form Saved", description: "Changes saved successfully" });
      }
    } catch (error) {
      // PostgREST errors are plain objects, not Error instances.
      const e = error as { code?: string; message?: string } | null;
      const description =
        e?.code === "23505"
          ? "That URL is already taken by another form. Choose a different slug."
          : e?.message || "Failed to save form";
      toast({ title: "Could not save form", description, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleTestSubmit = async (data: Record<string, string | boolean>) => {
    if (!formId || !user) {
      toast({ title: "Save First", description: "Save the form to test submissions" });
      return;
    }

    try {
      const { error } = await supabase.from("form_submissions").insert([{
        form_id: formId,
        form_name: name,
        metadata: data as unknown as Json,
        user_id: user.id,
      }]);

      if (error) throw error;
      toast({ title: "Test Submitted", description: "Submission recorded successfully" });
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Please try again", variant: "destructive" });
    }
  };

  const getFormLink = (embed = false) => {
    // Priority: Saved Slug > Generated Slug from Name > Form ID
    const finalSlug = slugify(slug) || slugify(name) || formId || id || "";

    // In some cases 'id' might be 'new', we don't want a link to /f/new
    if (finalSlug === "new") return "";

    const baseUrl = `${window.location.origin}/f/${finalSlug}`;
    return embed ? `${baseUrl}?embed=true` : baseUrl;
  };

  const copyFormLink = () => {
    navigator.clipboard.writeText(getFormLink());
    setCopied(true);
    toast({ title: "Link Copied", description: "Share this link with your clients" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectField = (id: string | null) => {
    if (!id) return;

    // Switch to builder tab
    setActiveEditorTab("builder");

    if (id === "branding" || id === "style" || id === "settings") {
      setActiveBuilderTab(id === "settings" ? "fields" : id);
      setActiveFieldId(null);
    } else {
      setActiveBuilderTab("fields");
      setActiveFieldId(id);
    }

    toast({
      title: "Editing Mode",
      description: `Focusing on ${id === "branding" ? "logo & branding" : id === "style" ? "styling" : "field properties"}`,
      duration: 2000
    });
  };

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/forms")}
              className="text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">{isNew ? "Create Form" : "Edit Form"}</h1>
              <p className="text-muted-foreground text-sm truncate">{isNew ? "Build a custom form" : name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 ml-auto sm:ml-0">
            {!isNew && (
              <Button
                variant="outline"
                size="sm"
                onClick={copyFormLink}
                className="border-border text-foreground hover:bg-muted"
              >
                {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                <span className="hidden sm:inline ml-2">{copied ? "Copied" : "Copy Link"}</span>
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={saving}
              size="sm"
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span className="hidden sm:inline">Save Form</span>
            </Button>
          </div>
        </div>

        <Tabs value={activeEditorTab} onValueChange={setActiveEditorTab} className="space-y-4 sm:space-y-6">
          <TabsList className="bg-muted border border-border w-full sm:w-auto overflow-x-auto flex-nowrap">
            <TabsTrigger value="builder" className="gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Builder</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Preview</span>
            </TabsTrigger>
            {!isNew && (
              <TabsTrigger value="submissions" className="gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Database className="h-4 w-4" />
                <span className="hidden sm:inline">Responses</span>
              </TabsTrigger>
            )}
            {!isNew && (
              <TabsTrigger value="embed" className="gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Code className="h-4 w-4" />
                <span className="hidden sm:inline">Embed</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="builder" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Form Settings */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg text-foreground">Form Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-foreground/80">Form Name</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Contact Form"
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground/80">Slug (URL-friendly name)</Label>
                    <Input
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="e.g., contact-form"
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                    />
                    <p className="text-xs text-muted-foreground">
                      Form URL: {getFormLink()}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground/80">Description</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Optional description for your form"
                      rows={3}
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground/80 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      Notification Email
                    </Label>
                    <Input
                      type="email"
                      value={notificationEmail}
                      onChange={(e) => setNotificationEmail(e.target.value)}
                      placeholder={user?.email || "your@email.com"}
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                    />
                    <p className="text-xs text-muted-foreground">
                      Get an email when someone submits this form. Leave empty to use your login email.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Form Builder with Style */}
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <FormBuilder
                  fields={fields}
                  onChange={setFields}
                  style={style}
                  onStyleChange={setStyle}
                  activeTab={activeBuilderTab}
                  onActiveTabChange={setActiveBuilderTab}
                  activeFieldId={activeFieldId}
                  onActiveFieldChange={setActiveFieldId}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview">
            <div className="max-w-md mx-auto">
              <FormPreview
                name={name || "Untitled Form"}
                description={description}
                fields={fields}
                style={style}
                onSubmit={handleTestSubmit}
                onSelectField={handleSelectField}
              />
              <p className="text-xs text-slate-500 text-center mt-4">
                This is a preview. Test submissions will be saved.
              </p>
            </div>
          </TabsContent>

          {!isNew && formId && (
            <TabsContent value="submissions">
              <FormSubmissions formId={formId} formName={name} />
            </TabsContent>
          )}

          <TabsContent value="embed">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Code className="h-5 w-5 text-primary" />
                  Embed Your Form
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-2">Share Link</h3>
                    <div className="flex items-center gap-2">
                      <Input
                        value={getFormLink()}
                        readOnly
                        className="bg-background border-border text-foreground"
                      />
                      <Button
                        variant="outline"
                        onClick={copyFormLink}
                        className="border-border text-foreground hover:bg-muted"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Share this link directly with your audience.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <h3 className="text-sm font-medium text-foreground mb-4">Embed on your website</h3>
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-indigo-500/20 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                      <div className="relative bg-muted p-4 rounded-lg border border-border">
                        <pre className="text-xs text-foreground overflow-x-auto whitespace-pre-wrap font-mono">
                          {`<div id="boltfy-form-container" style="width: 100%;">
  <iframe 
    src="${getFormLink(true)}" 
    id="boltfy-form-iframe"
    width="100%" 
    height="600px" 
    frameborder="0" 
    style="border: none; width: 100%;"
  >Loading...</iframe>
  <script>
    window.addEventListener('message', function(e) {
      if (e.data.type === 'resize') {
        const iframe = document.getElementById('boltfy-form-iframe');
        if (iframe) iframe.style.height = e.data.height + 'px';
      }
    }, false);
  </script>
</div>`}
                        </pre>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            const code = `<div id="boltfy-form-container" style="width: 100%;"><iframe src="${getFormLink(true)}" id="boltfy-form-iframe" width="100%" height="600px" frameborder="0" style="border: none; width: 100%;">Loading...</iframe><script>window.addEventListener('message', function(e) { if (e.data.type === 'resize') { const iframe = document.getElementById('boltfy-form-iframe'); if (iframe) iframe.style.height = e.data.height + 'px'; } }, false);</script></div>`;
                            navigator.clipboard.writeText(code);
                            toast({ title: "Copied!", description: "Embed code copied to clipboard" });
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4 italic">
                      Copy the code above and paste it into your website's HTML where you want the form to appear.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
