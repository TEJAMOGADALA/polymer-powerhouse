import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { AppHeader } from "@/components/AppHeader";
import { getProfile } from "@/lib/company-profiles";
import {
  deleteDocument,
  downloadPdfBlob,
  listAllDocuments,
  type DocumentRow,
  type DocStatus,
  type DocType,
} from "@/lib/documents";
import { downloadBlob } from "@/lib/pdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import {
  Download,
  Trash2,
  FileText,
  Plus,
  Receipt,
  ExternalLink,
  ArrowLeft,
  Search,
  FileDown,
  FileSpreadsheet,
  Activity,
  IndianRupee,
  Ban,
  Calendar as CalendarIcon,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/company/$slug/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { slug } = Route.useParams();
  const profile = useMemo(() => getProfile(slug), [slug]);
  const navigate = useNavigate();
  const [globalSearch, setGlobalSearch] = useState("");

  const {
    data: all = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["documents", slug],
    queryFn: () => listAllDocuments(slug),
  });

  if (!profile) {
    navigate({ to: "/" });
    return null;
  }

  const q = globalSearch.trim().toLowerCase();
  const searched = q
    ? all.filter((d) => {
        const p = d.payload as Record<string, unknown> | null;
        const gstin = (p?.["buyerGstin"] ?? p?.["gstin"] ?? "") as string;
        return (
          d.document_number.toLowerCase().includes(q) ||
          d.customer_name.toLowerCase().includes(q) ||
          String(gstin).toLowerCase().includes(q)
        );
      })
    : all;

  const challans = searched.filter((d) => d.document_type === "challan");
  const invoices = searched.filter((d) => d.document_type === "invoice");
  const cancelled = all.filter((d) => d.status === "cancelled").length;
  const today = new Date().toDateString();
  const todaysCount = all.filter((d) => new Date(d.created_at).toDateString() === today).length;

  const now = new Date();
  const monthlyRevenue = all.reduce((sum, d) => {
    if (d.document_type !== "invoice" || d.status === "cancelled") return sum;
    const dt = new Date(d.created_at);
    if (dt.getMonth() !== now.getMonth() || dt.getFullYear() !== now.getFullYear()) return sum;
    return sum + computeInvoiceTotal(d.payload as Record<string, unknown> | null);
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50 dark:from-slate-950 dark:to-slate-900">
      <AppHeader title={profile.name} />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Breadcrumb */}
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Companies
        </Link>

        {/* Header block */}
        <div className="mt-3 mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{profile.name}</h1>
            <p className="mt-0.5 text-sm font-medium uppercase tracking-widest text-primary">Document Control Center</p>
            <p className="mt-1 text-xs text-muted-foreground">GSTIN {profile.gstin}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link to="/company/$slug" params={{ slug }}>
                Workspace
              </Link>
            </Button>
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

        {/* KPI cards */}
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            label="Total Challans"
            value={all.filter((d) => d.document_type === "challan").length}
            icon={<FileText className="h-4 w-4" />}
            tone="blue"
          />
          <StatCard
            label="Total Invoices"
            value={all.filter((d) => d.document_type === "invoice").length}
            icon={<Receipt className="h-4 w-4" />}
            tone="purple"
          />
          <StatCard label="Cancelled" value={cancelled} icon={<Ban className="h-4 w-4" />} tone="red" />
          <StatCard
            label="Today's Documents"
            value={todaysCount}
            icon={<CalendarIcon className="h-4 w-4" />}
            tone="emerald"
          />
          <StatCard
            label="Monthly Revenue"
            value={`₹ ${monthlyRevenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
            icon={<IndianRupee className="h-4 w-4" />}
            tone="amber"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Tables */}
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

          {/* Activity */}
          <RecentActivity rows={all} />
        </div>
      </div>
    </div>
  );
}

function computeInvoiceTotal(payload: Record<string, unknown> | null): number {
  if (!payload) return 0;
  const rows = (payload["rows"] ?? []) as Array<{ qty?: string; rate?: string }>;
  const sub = rows.reduce((a, r) => {
    const q = parseFloat(r.qty ?? "");
    const rt = parseFloat(r.rate ?? "");
    return isNaN(q) || isNaN(rt) ? a : a + q * rt;
  }, 0);
  const cgst = parseFloat((payload["cgstRate"] ?? "0") as string) || 0;
  const sgst = parseFloat((payload["sgstRate"] ?? "0") as string) || 0;
  const igst = parseFloat((payload["igstRate"] ?? "0") as string) || 0;
  return sub * (1 + (cgst + sgst + igst) / 100);
}

const TONE: Record<string, string> = {
  blue: "from-blue-500/20 to-blue-500/5 text-blue-700 dark:text-blue-300",
  purple: "from-purple-500/20 to-purple-500/5 text-purple-700 dark:text-purple-300",
  red: "from-red-500/20 to-red-500/5 text-red-700 dark:text-red-300",
  emerald: "from-emerald-500/20 to-emerald-500/5 text-emerald-700 dark:text-emerald-300",
  amber: "from-amber-500/20 to-amber-500/5 text-amber-700 dark:text-amber-300",
};

function StatCard({
  label,
  value,
  icon,
  tone = "blue",
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  tone?: keyof typeof TONE;
}) {
  return (
    <div className={`glass relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br ${TONE[tone]}`}>
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-background/60">{icon}</span>
      </div>
      <p className="mt-3 text-2xl font-black leading-tight">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: DocStatus }) {
  if (status === "cancelled") {
    return (
      <Badge variant="outline" className="border-red-300 bg-red-100 text-red-800">
        CANCELLED
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-green-300 bg-green-100 text-green-800">
      ACTIVE
    </Badge>
  );
}

const PAGE_SIZE = 10;

function DocList({
  slug,
  type,
  rows: allRows,
  loading,
  onChanged,
}: {
  slug: string;
  type: DocType;
  rows: DocumentRow[];
  loading: boolean;
  onChanged: () => void;
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

  function toExportRows() {
    return filtered.map((r, i) => ({
      "S.No": i + 1,
      Type: r.document_type,
      "Doc No": r.document_number,
      Customer: r.customer_name,
      Date: new Date(r.created_at).toLocaleDateString(),
      Time: new Date(r.created_at).toLocaleTimeString(),
      Status: r.status,
    }));
  }

  function exportCsv() {
    const rows = toExportRows();
    if (rows.length === 0) {
      toast.error("Nothing to export.");
      return;
    }
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((r) => headers.map((h) => JSON.stringify((r as Record<string, unknown>)[h] ?? "")).join(",")),
    ].join("\n");
    downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), `${type}-${slug}-${Date.now()}.csv`);
  }

  function exportXlsx() {
    const rows = toExportRows();
    if (rows.length === 0) {
      toast.error("Nothing to export.");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, type === "challan" ? "Challans" : "Invoices");
    XLSX.writeFile(wb, `${type}-${slug}-${Date.now()}.xlsx`);
  }

  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(1);
          }}
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setPage(1);
          }}
        />
        <Input
          value={docNo}
          onChange={(e) => {
            setDocNo(e.target.value);
            setPage(1);
          }}
          placeholder="Doc Number"
        />
        <Input
          value={customer}
          onChange={(e) => {
            setCustomer(e.target.value);
            setPage(1);
          }}
          placeholder="Customer name"
        />
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {filtered.length} record{filtered.length === 1 ? "" : "s"} shown
        </p>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={exportCsv}>
            <FileDown className="mr-1.5 h-4 w-4" /> CSV
          </Button>
          <Button size="sm" variant="outline" onClick={exportXlsx}>
            <FileSpreadsheet className="mr-1.5 h-4 w-4" /> Excel
          </Button>
        </div>
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
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!loading && paged.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No {type === "challan" ? "challans" : "invoices"} found.
                </TableCell>
              </TableRow>
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
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
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
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPendingDelete(r)}
                        title="Delete"
                        className="text-red-600 hover:text-red-700"
                      >
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
          Page {currentPage} of {totalPages}
        </p>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onChanged()}>
            Refresh
          </Button>
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
                  <strong>{pendingDelete.document_type === "challan" ? "Challan" : "Invoice"}</strong> #
                  {pendingDelete.document_number} — {pendingDelete.customer_name}
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

function RecentActivity({ rows }: { rows: DocumentRow[] }) {
  const events = useMemo(() => {
    const evs: { at: Date; kind: "Created" | "Cancelled"; row: DocumentRow }[] = [];
    for (const r of rows) {
      evs.push({ at: new Date(r.created_at), kind: "Created", row: r });
      if (r.cancelled_at) evs.push({ at: new Date(r.cancelled_at), kind: "Cancelled", row: r });
    }
    return evs.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, 10);
  }, [rows]);

  return (
    <div className="glass h-fit rounded-2xl p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
          <Activity className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-sm font-bold">Recent Activity</h3>
          <p className="text-[11px] text-muted-foreground">Latest document actions</p>
        </div>
      </div>
      {events.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">No activity yet.</p>
      ) : (
        <ul className="space-y-2.5">
          {events.map((e, i) => (
            <li key={i} className="flex items-start gap-3 rounded-lg border border-border/60 bg-background/40 p-2.5">
              <span
                className={`mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full ${e.kind === "Cancelled" ? "bg-red-500" : "bg-emerald-500"}`}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold">
                  {e.kind} · {e.row.document_type === "challan" ? "Challan" : "Invoice"} #{e.row.document_number}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">{e.row.customer_name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {e.at.toLocaleDateString()} · {e.at.toLocaleTimeString()}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
