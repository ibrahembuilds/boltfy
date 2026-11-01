import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, FileText, Trash2, Copy, Loader2 } from "lucide-react";
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
import { format } from "date-fns";

interface Template {
  id: string;
  name: string;
  subject: string | null;
  preview_text: string | null;
  created_at: string;
  updated_at: string;
}

export default function Templates() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);

  const fetchTemplates = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast({
        title: "Error loading templates",
        description: "Could not load your templates. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleDelete = async (id: string, name: string) => {
    try {
      const { error } = await supabase.from("email_templates").delete().eq("id", id);
      if (error) throw error;

      setTemplates((prev) => prev.filter((t) => t.id !== id));
      toast({
        title: "Template deleted",
        description: `"${name}" has been deleted.`,
      });
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({
        title: "Error deleting template",
        description: "Could not delete the template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDuplicate = async (template: Template) => {
    if (!user) return;

    try {
      const { data: original, error: fetchError } = await supabase
        .from("email_templates")
        .select("*")
        .eq("id", template.id)
        .single();

      if (fetchError) throw fetchError;

      const { error: insertError } = await supabase.from("email_templates").insert({
        name: `${original.name} (Copy)`,
        subject: original.subject,
        content: original.content,
        preview_text: original.preview_text,
        user_id: user.id,
      });

      if (insertError) throw insertError;

      toast({
        title: "Template duplicated",
        description: `A copy of "${template.name}" has been created.`,
      });

      fetchTemplates();
    } catch (error) {
      console.error("Error duplicating template:", error);
      toast({
        title: "Error duplicating template",
        description: "Could not duplicate the template. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slide-up">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Email Templates</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage reusable email templates
            </p>
          </div>
          <Button variant="gradient" className="gap-2" onClick={() => navigate("/templates/new")}>
            <Plus className="h-4 w-4" />
            Create Template
          </Button>
        </div>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : templates.length === 0 ? (
          <Card className="animate-fade-in">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-accent p-4 mb-4">
                <FileText className="h-8 w-8 text-accent-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No templates yet</h3>
              <p className="text-muted-foreground text-center max-w-sm mb-6">
                Create your first email template to get started with beautiful, branded emails.
              </p>
              <Button variant="gradient" className="gap-2" onClick={() => navigate("/templates/new")}>
                <Plus className="h-4 w-4" />
                Create Your First Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template, index) => (
              <Card
                key={template.id}
                className="group animate-slide-up hover:shadow-lg transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="line-clamp-1">{template.name}</CardTitle>
                      <CardDescription className="line-clamp-1 mt-1">
                        {template.subject || "No subject set"}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Duplicate ${template.name}`}
                        onClick={() => handleDuplicate(template)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        aria-label={`Delete ${template.name}`}
                        onClick={() => setTemplateToDelete(template)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-24 rounded-lg bg-muted mb-4 flex items-center justify-center overflow-hidden">
                    <div className="text-center text-sm text-muted-foreground p-4">
                      {template.preview_text || "Email template preview"}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Updated {format(new Date(template.updated_at), "MMM d, yyyy")}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!templateToDelete} onOpenChange={(open) => !open && setTemplateToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this template?</AlertDialogTitle>
            <AlertDialogDescription>“{templateToDelete?.name}” will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (templateToDelete) handleDelete(templateToDelete.id, templateToDelete.name);
                setTemplateToDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
