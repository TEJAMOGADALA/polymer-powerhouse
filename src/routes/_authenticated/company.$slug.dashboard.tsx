import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { getProfile } from "@/lib/company-profiles";
import {
  deleteDocument, downloadPdfBlob, listAllDocuments,
  type DocumentRow, type DocStatus, type DocType,
} from "@/lib/documents";
import { downloadBlob } from "@/lib/pdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Download, Trash2, FileText, Plus, Receipt, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/company/$slug/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { slug } = Route.useParams();
  const profile = useMemo(() => getProfile(slug), [slug]);
  const navigate = useNavigate();

  const { data: all = [], isLoading, refetch } = useQuery({
    queryKey: ["documents", slug],
    queryFn: () => listAllDocuments(slug),
  });

  if (!profile) {
    navigate({ to: "/" });
    return null;
  }

  const challans = all.filter((d) => d.document_type === "challan");
  const invoices = all.filter((d) => d.document_type === "invoice");
  const cancelled = all.filter((d) => d.status === "cancelled").length;
  const today = new Date().toDateString();
  const todaysCount = all.filter((d) => new Date(d.created_at).toDateString() === today).length;

  return (
    <div className="min-h-screen">
      <AppHeader title={`${profile.name} · Dashboard`} />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">{profile.name} Dashboard</h1>
            <p className="text-sm text-muted-foreground">Delivery challans and tax invoices.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline">
              <Link to="/company/$slug/challan/new" params={{ slug }}>
                <Plus className="mr-1.5 h-4 w-4" /> New Challan
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/company/$slug/invoice/new" params={{ slug }}>
                <Plus className="mr-1.5 h-4 w-4" /> New Invoice
              </Link>
            </Button>
          </div>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Challans" value={challans.length} />
          <StatCard label="Total Invoices" value={invoices.length} />
          <StatCard label="Cancelled Documents" value={cancelled} />
          <StatCard label="Today's Documents" value={todaysCount} />
        </div>

        <Tabs defaultValue="challan">
          <TabsList>
            <TabsTrigger value="challan">
              <FileText className="mr-1.5 h-4 w-4" /> Delivery Challans
            </TabsTrigger>
            <TabsTrigger value="invoice">
              <Receipt className="mr-1.5 h-4 w-4" /> Invoices
            </TabsTrigger>
          </TabsList>
          <TabsContent value="challan" className="mt-4">
            <DocList slug={slug} type="challan" rows={challans} loading={isLoading} onChanged={refetch} />
          </TabsContent>
          <TabsContent value="invoice" className="mt-4">
            <DocList slug={slug} type="invoice" rows={invoices} loading={isLoading} onChanged={refetch} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: DocStatus }) {
  if (status === "cancelled") {
    return <Badge variant="outline" className="border-red-300 bg-red-100 text-red-800">CANCELLED</Badge>;
  }
  return <Badge variant="outline" className="border-green-300 bg-green-100 text-green-800">ACTIVE</Badge>;
}

const PAGE_SIZE = 10;

function DocList({
  slug, type, rows: allRows, loading, onChanged,
}: {
  slug: string; type: DocType; rows: DocumentRow[]; loading: boolean; onChanged: () => void;
}) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [docNo, setDocNo] = useState("");
  const [customer, setCustomer] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<DocumentRow | null>(null);

  const filtered = useMemo(() => {
    return allRows.filter((r) => {
      if (dateFrom && new Date(r.created_at) < new Date(dateFrom)) return false;
      if (dateTo && new Date(r.created_at) > new Date(dateTo + "T23:59:59")) return false;
      if (docNo && !r.document_number.toLowerCase().includes(docNo.toLowerCase())) return false;
      if (customer && !r.customer_name.toLowerCase().includes(customer.toLowerCase())) return false;
      if (status === "active" && r.status === "cancelled") return false;
      if (status === "cancelled" && r.status !== "cancelled") return false;
      return true;
    });
  }, [allRows, dateFrom, dateTo, docNo, customer, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  async function download(row: DocumentRow) {
    if (!row.pdf_path) return;
    try {
      const blob = await downloadPdfBlob(row.pdf_path);
      downloadBlob(blob, `${row.document_type}-${row.document_number}-${row.company_slug}.pdf`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to download");
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await deleteDocument(pendingDelete.id);
      toast.success("Document deleted.");
      setPendingDelete(null);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed.");
    }
  }

  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
        <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
        <Input value={docNo} onChange={(e) => { setDocNo(e.target.value); setPage(1); }} placeholder="Doc Number" />
        <Input value={customer} onChange={(e) => { setCustomer(e.target.value); setPage(1); }} placeholder="Customer name" />
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-md border bg-background/40">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">S.No</TableHead>
              <TableHead>Doc No.</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Loading…</TableCell></TableRow>
            )}
            {!loading && paged.length === 0 && (
              <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                No {type === "challan" ? "challans" : "invoices"} found.
              </TableCell></TableRow>
            )}
            {paged.map((r, i) => {
              const dt = new Date(r.created_at);
              return (
                <TableRow key={r.id}>
                  <TableCell>{(currentPage - 1) * PAGE_SIZE + i + 1}</TableCell>
                  <TableCell className="font-mono font-semibold">{r.document_number}</TableCell>
                  <TableCell className="max-w-xs truncate">{r.customer_name}</TableCell>
                  <TableCell>{dt.toLocaleDateString()}</TableCell>
                  <TableCell>{dt.toLocaleTimeString()}</TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => download(r)} title="Download">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" asChild title="Open">
                        <Link to="/company/$slug/document/$id" params={{ slug, id: r.id }}>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setPendingDelete(r)}
                        title="Delete" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Page {currentPage} of {totalPages} — {filtered.length} record{filtered.length === 1 ? "" : "s"}
        </p>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
          <Button size="sm" variant="outline" disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
          <Button size="sm" variant="ghost" onClick={() => onChanged()}>Refresh</Button>
        </div>
      </div>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this document? This cannot be undone.
              {pendingDelete && (
                <span className="mt-2 block text-foreground">
                  <strong>{pendingDelete.document_type === "challan" ? "Challan" : "Invoice"}</strong>
                  {" "}#{pendingDelete.document_number} — {pendingDelete.customer_name}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Yes, delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
