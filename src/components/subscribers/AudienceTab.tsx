import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Download, Loader2, MailX, MoreHorizontal, Plus, Search, Trash2, Upload, UserCheck, UserX, Users } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { parseSubscriberCsv, toCsv, type ParsedSubscribers } from "@/lib/csv";

type Subscriber = Pick<Tables<"subscribers">, "id" | "email" | "name" | "status" | "source" | "created_at">;
type StatusFilter = "all" | "active" | "unsubscribed" | "pending";

const PAGE_SIZE = 25;
const IMPORT_CHUNK = 500;
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

const statusStyles: Record<string, string> = {
  active: "bg-success/10 text-success border-success/20",
  unsubscribed: "bg-muted text-muted-foreground border-border",
  pending: "bg-warning/10 text-warning border-warning/20",
};

/** PostgREST treats , ( ) as syntax inside .or(); % and * are wildcards. Drop them from user input. */
const safeSearch = (q: string) => q.replace(/[,()%*\\"]/g, " ").trim();

export function AudienceTab() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [rows, setRows] = useState<Subscriber[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState({ active: 0, unsubscribed: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [exporting, setExporting] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  const [importOpen, setImportOpen] = useState(false);
  const [parsed, setParsed] = useState<ParsedSubscribers | null>(null);
  const [consent, setConsent] = useState(false);
  const [importing, setImporting] = useState(false);

  const [toDelete, setToDelete] = useState<Subscriber | null>(null);
  const [toResubscribe, setToResubscribe] = useState<Subscriber | null>(null);

  // Ignore responses from superseded requests (fast typing / filter changes).
  const requestId = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(safeSearch(search)), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => setPage(0), [debouncedSearch, status]);

  const fetchCounts = useCallback(async () => {
    if (!user) return;
    const head = (s: string) =>
      supabase.from("subscribers").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", s);
    const [a, u, p] = await Promise.all([head("active"), head("unsubscribed"), head("pending")]);
    setCounts({ active: a.count ?? 0, unsubscribed: u.count ?? 0, pending: p.count ?? 0 });
  }, [user]);

  const fetchPage = useCallback(async () => {
    if (!user) return;
    const id = ++requestId.current;
    setLoading(true);

    let query = supabase
      .from("subscribers")
      .select("id, email, name, status, source, created_at", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    if (status !== "all") query = query.eq("status", status);
    if (debouncedSearch) query = query.or(`email.ilike.%${debouncedSearch}%,name.ilike.%${debouncedSearch}%`);

    const { data, count, error } = await query;
    if (id !== requestId.current) return;

    if (error) {
      toast({ title: "Could not load subscribers", description: error.message, variant: "destructive" });
    } else {
      setRows(data ?? []);
      setTotal(count ?? 0);
    }
    setLoading(false);
  }, [user, page, status, debouncedSearch, toast]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  const refresh = () => Promise.all([fetchPage(), fetchCounts()]);

  // ------------------------------------------------------------- add
  const handleAdd = async () => {
    if (!user) return;
    const email = newEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    setAdding(true);
    const { error } = await supabase.from("subscribers").insert({
      email,
      name: newName.trim() || email.split("@")[0],
      status: "active",
      source: "Manual",
      user_id: user.id,
    });
    setAdding(false);

    if (error) {
      toast({
        title: "Could not add subscriber",
        description: error.code === "23505" ? "That address is already on your list." : error.message,
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Subscriber added", description: email });
    setAddOpen(false);
    setNewEmail("");
    setNewName("");
    refresh();
  };

  // ---------------------------------------------------------- import
  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please import files under 5 MB.", variant: "destructive" });
      return;
    }
    setParsed(parseSubscriberCsv(await file.text()));
  };

  const closeImport = () => {
    setImportOpen(false);
    setParsed(null);
    setConsent(false);
  };

  const handleImport = async () => {
    if (!user || !parsed || parsed.valid.length === 0) return;
    setImporting(true);
    let added = 0;
    try {
      for (let i = 0; i < parsed.valid.length; i += IMPORT_CHUNK) {
        const chunk = parsed.valid.slice(i, i + IMPORT_CHUNK).map((s) => ({
          email: s.email,
          name: s.name,
          status: "active",
          source: "Import",
          user_id: user.id,
        }));
        // ignoreDuplicates: people already on the list (including anyone who
        // unsubscribed) are left exactly as they are.
        const { data, error } = await supabase
          .from("subscribers")
          .upsert(chunk, { onConflict: "user_id,email", ignoreDuplicates: true })
          .select("id");
        if (error) throw error;
        added += data?.length ?? 0;
      }
      const skipped = parsed.valid.length - added;
      toast({
        title: `Imported ${added.toLocaleString()} subscriber${added === 1 ? "" : "s"}`,
        description: skipped > 0 ? `${skipped.toLocaleString()} were already on your list and were left unchanged.` : undefined,
      });
      closeImport();
    } catch (error) {
      const message = (error as { message?: string })?.message ?? "Please try again.";
      toast({
        title: "Import stopped",
        description: `${added.toLocaleString()} added before the error: ${message}`,
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      refresh();
    }
  };

  // ---------------------------------------------------- status/delete
  const setSubscriberStatus = async (sub: Subscriber, next: "active" | "unsubscribed") => {
    const { error } = await supabase.from("subscribers").update({ status: next }).eq("id", sub.id);
    if (error) {
      toast({ title: "Could not update", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: next === "active" ? "Resubscribed" : "Unsubscribed", description: sub.email });
    refresh();
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    const { error } = await supabase.from("subscribers").delete().eq("id", toDelete.id);
    if (error) {
      toast({ title: "Could not delete", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Subscriber removed", description: toDelete.email });
      refresh();
    }
    setToDelete(null);
  };

  // ---------------------------------------------------------- export
  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const all: Subscriber[] = [];
      for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase
          .from("subscribers")
          .select("id, email, name, status, source, created_at")
          .eq("user_id", user.id)
          .order("created_at")
          .order("id")
          .range(from, from + 999);
        if (error) throw error;
        all.push(...(data ?? []));
        if (!data || data.length < 1000) break;
      }
      const csv = toCsv(
        ["Email", "Name", "Status", "Source", "Subscribed at"],
        all.map((s) => [s.email, s.name, s.status, s.source, s.created_at]),
      );
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `boltfy-subscribers-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Exported", description: `${all.length.toLocaleString()} subscribers downloaded.` });
    } catch (error) {
      toast({ title: "Export failed", description: (error as { message?: string })?.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const totalAll = counts.active + counts.unsubscribed + counts.pending;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Total", value: totalAll, icon: Users },
          { label: "Active", value: counts.active, icon: UserCheck },
          { label: "Unsubscribed", value: counts.unsubscribed, icon: MailX },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold text-foreground">{value.toLocaleString()}</p>
              </div>
              <Icon className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border bg-card/50">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email or name..."
                  className="pl-10 bg-background"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
                <SelectTrigger className="w-full sm:w-[160px] bg-background" aria-label="Filter by status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="gap-2" onClick={handleExport} disabled={exporting || totalAll === 0}>
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Export
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => setImportOpen(true)}>
                <Upload className="h-4 w-4" /> Import CSV
              </Button>
              <Button variant="gradient" className="gap-2" onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4" /> Add subscriber
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading && rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p>Loading subscribers...</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 gap-3 text-center">
              <div className="p-4 rounded-full bg-muted/50 border border-border/50">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">{debouncedSearch || status !== "all" ? "No matches" : "No subscribers yet"}</h3>
              <p className="text-muted-foreground max-w-sm">
                {debouncedSearch || status !== "all"
                  ? "Try a different search or filter."
                  : "Add people by hand, import a CSV, or share a newsletter form and they'll appear here."}
              </p>
            </div>
          ) : (
            <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="border-border/50">
                      <TableHead className="min-w-[220px]">Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead className="w-[60px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((sub) => (
                      <TableRow key={sub.id} className="border-border/50">
                        <TableCell className="font-medium text-foreground">{sub.email}</TableCell>
                        <TableCell className="text-muted-foreground">{sub.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`capitalize ${statusStyles[sub.status] ?? ""}`}>
                            {sub.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{sub.source ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {format(new Date(sub.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label={`Actions for ${sub.email}`}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {sub.status === "active" ? (
                                <DropdownMenuItem onClick={() => setSubscriberStatus(sub, "unsubscribed")}>
                                  <UserX className="mr-2 h-4 w-4" /> Mark unsubscribed
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => setToResubscribe(sub)}>
                                  <UserCheck className="mr-2 h-4 w-4" /> Resubscribe
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setToDelete(sub)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-border/50 px-4 py-3 text-sm text-muted-foreground">
                <span>
                  {(page * PAGE_SIZE + 1).toLocaleString()}–{Math.min((page + 1) * PAGE_SIZE, total).toLocaleString()} of{" "}
                  {total.toLocaleString()}
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={page === 0 || loading} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </Button>
                  <span>
                    Page {page + 1} / {pageCount}
                  </span>
                  <Button variant="outline" size="sm" disabled={page + 1 >= pageCount || loading} onClick={() => setPage((p) => p + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add subscriber</DialogTitle>
            <DialogDescription>Only add people who have agreed to receive your emails.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-email">Email</Label>
              <Input id="new-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="name@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-name">Name (optional)</Label>
              <Input id="new-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Jane Doe" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={adding || !newEmail.trim()}>
              {adding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import */}
      <Dialog open={importOpen} onOpenChange={(open) => (open ? setImportOpen(true) : closeImport())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import subscribers</DialogTitle>
            <DialogDescription>
              Upload a CSV with an <code>email</code> column and, optionally, a <code>name</code> column.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input type="file" accept=".csv,text/csv,text/plain" onChange={(e) => handleFile(e.target.files?.[0])} />
            {parsed && (
              <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm space-y-1">
                <p>
                  <strong>{parsed.valid.length.toLocaleString()}</strong> valid address{parsed.valid.length === 1 ? "" : "es"} ready to import
                </p>
                {parsed.duplicates > 0 && <p className="text-muted-foreground">{parsed.duplicates.toLocaleString()} duplicate rows skipped</p>}
                {parsed.invalid.length > 0 && (
                  <p className="text-destructive">
                    {parsed.invalid.length.toLocaleString()} invalid skipped
                    {parsed.invalid.length <= 3 ? `: ${parsed.invalid.join(", ")}` : ""}
                  </p>
                )}
                <p className="text-muted-foreground">People already on your list (including anyone who unsubscribed) are left unchanged.</p>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Checkbox id="consent" checked={consent} onCheckedChange={(c) => setConsent(c === true)} className="mt-0.5" />
              <Label htmlFor="consent" className="text-sm font-normal leading-snug">
                I confirm that everyone in this file agreed to receive emails from me. I'm not importing a purchased or scraped list.
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeImport}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={importing || !consent || !parsed || parsed.valid.length === 0}>
              {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import {parsed ? parsed.valid.length.toLocaleString() : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {toDelete?.email}?</AlertDialogTitle>
            <AlertDialogDescription>
              They'll be removed from your list. If they sign up again through a form they'll be added as a new subscriber.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Resubscribe: re-enrolling someone who opted out needs their say-so. */}
      <AlertDialog open={!!toResubscribe} onOpenChange={(open) => !open && setToResubscribe(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resubscribe {toResubscribe?.email}?</AlertDialogTitle>
            <AlertDialogDescription>
              Only do this if this person has asked to receive your emails again. Emailing people who unsubscribed can breach
              anti-spam law and get your sending blocked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (toResubscribe) setSubscriberStatus(toResubscribe, "active");
                setToResubscribe(null);
              }}
            >
              They asked me to
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
