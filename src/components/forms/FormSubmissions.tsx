import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Inbox, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Json } from "@/integrations/supabase/types";

interface Submission {
  id: string;
  created_at: string;
  metadata: Json;
  form_name: string | null;
}

interface FormSubmissionsProps {
  formId: string;
  formName: string;
}

export function FormSubmissions({ formId, formName }: FormSubmissionsProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("form_submissions")
      .select("*")
      .eq("form_id", formId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setSubmissions(data);
    }
    setLoading(false);
  }, [formId]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const getMetadataPreview = (metadata: Json) => {
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return "-";
    const entries = Object.entries(metadata as Record<string, unknown>).slice(0, 2);
    return entries.map(([key, value]) => `${key}: ${String(value).substring(0, 20)}`).join(", ");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{formName} Submissions</CardTitle>
          <CardDescription>{submissions.length} total submissions</CardDescription>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Inbox className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No submissions yet</p>
              <p className="text-sm">Submissions will appear here when users fill out this form</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Preview</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium">
                        {format(new Date(submission.created_at), "MMM d, yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-[300px] truncate">
                        {getMetadataPreview(submission.metadata)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedSubmission(submission)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
            <DialogDescription>
              {selectedSubmission && format(new Date(selectedSubmission.created_at), "MMMM d, yyyy 'at' HH:mm")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {selectedSubmission?.metadata &&
              typeof selectedSubmission.metadata === "object" &&
              !Array.isArray(selectedSubmission.metadata) &&
              Object.entries(selectedSubmission.metadata as Record<string, unknown>).map(([key, value]) => (
                <div key={key} className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase">{key}</span>
                  <span className="text-sm bg-muted/50 p-2 rounded">{String(value) || "-"}</span>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
