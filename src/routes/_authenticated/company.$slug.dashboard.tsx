import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { getProfile } from "@/lib/company-profiles";
import { listDocuments, getSignedPdfUrl, downloadPdfBlob, type DocumentRow, type DocStatus } from "@/lib/documents";
import { downloadBlob } from "@/lib/pdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Eye, FileText, Plus, Receipt } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/company/$slug/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { slug } = Route.useParams();
  const profile = useMemo(() => getProfile(slug), [slug]);
  const navigate = useNavigate();

  if (!profile) {
    navigate({ to: "/" });
    return null;
  }

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
            <DocList slug={slug} type="challan" />
          </TabsContent>
          <TabsContent value="invoice" className="mt-4">
            <DocList slug={slug} type="invoice" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: DocStatus }) {
  const map: Record<DocStatus, string> = {
    generated: "bg-yellow-100 text-yellow-800 border-yellow-300",
    approved: "bg-green-100 text-green-800 border-green-300",
    cancelled: "bg-red-100 text-red-800 border-red-300",
  };
  return (
    <Badge variant="outline" className={map[status]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function DocList({ slug, type }: { slug: string; type: "challan" | "invoice" }) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["documents", slug, type],
    queryFn: () => listDocuments(slug, type),
  });

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [docNo, setDocNo] = useState("");
  const [customer, setCustomer] = useState("");
  const [status, setStatus] = useState<string>("all");

  const rows = useMemo(() => {
    const list = data ?? [];
    return list.filter((r) => {
      if (dateFrom && new Date(r.created_at) < new Date(dateFrom)) return false;
      if (dateTo && new Date(r.created_at) > new Date(dateTo + "T23:59:59")) return false;
      if (docNo && !r.document_number.toLowerCase().includes(docNo.toLowerCase())) return false;
      if (customer && !r.customer_name.toLowerCase().includes(customer.toLowerCase())) return false;
      if (status !== "all" && r.status !== status) return false;
      return true;
    });
  }, [data, dateFrom, dateTo, docNo, customer, status]);

  async function view(row: DocumentRow) {
    if (!row.pdf_path) return;
    try {
      const url = await getSignedPdfUrl(row.pdf_path, 300);
      window.open(url, "_blank");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to open");
    }
  }
  async function download(row: DocumentRow) {
    if (!row.pdf_path) return;
    try {
      const blob = await downloadPdfBlob(row.pdf_path);
      downloadBlob(blob, `${row.document_type}-${row.document_number}-${row.company_slug}.pdf`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to download");
    }
  }

  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="From" />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="To" />
        <Input value={docNo} onChange={(e) => setDocNo(e.target.value)} placeholder="Doc Number" />
        <Input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Customer name" />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="generated">Generated</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
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
            {isLoading && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Loading…</TableCell></TableRow>
            )}
            {!isLoading && rows.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No documents.</TableCell></TableRow>
            )}
            {rows.map((r, i) => {
              const dt = new Date(r.created_at);
              return (
                <TableRow key={r.id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell className="font-mono font-semibold">{r.document_number}</TableCell>
                  <TableCell className="max-w-xs truncate">{r.customer_name}</TableCell>
                  <TableCell>{dt.toLocaleDateString()}</TableCell>
                  <TableCell>{dt.toLocaleTimeString()}</TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => view(r)} title="View PDF">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => download(r)} title="Download">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" asChild title="Open">
                        <Link to="/company/$slug/document/$id" params={{ slug, id: r.id }}>Open</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <div className="mt-3 flex justify-end">
        <Button size="sm" variant="outline" onClick={() => refetch()}>Refresh</Button>
      </div>
    </div>
  );
}
