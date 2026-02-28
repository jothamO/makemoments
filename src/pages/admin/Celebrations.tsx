import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlobalLoader } from "@/components/ui/GlobalLoader";
import { Eye, ExternalLink, Search, Sparkles, CheckCircle2, XCircle, Clock, MoreHorizontal, Trash2, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { formatPlatformDate, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useSafeMutation } from "@/hooks/useSafeMutation";
import { useAuth } from "@/hooks/useAuth";

const AdminCelebrations = () => {
  const { toast } = useToast();
  const { token } = useAuth();
  const { safeMutation } = useSafeMutation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const celebrations = useQuery(api.celebrations.list, { token: token || undefined }) || [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const events = useQuery(api.events.getAll, { token: token || undefined }) || [];
  const updateCelebrationStatus = useMutation(api.celebrations.updateStatus);
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const eventMap = useMemo(() => {
    const map: Record<string, string> = {};
    events.forEach((e) => { map[e._id] = e.name; });
    return map;
  }, [events]);

  const filtered = useMemo(() => {
    return celebrations
      .filter((c) => {
        if (search) {
          const q = search.toLowerCase();
          if (!c.slug.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q) && !(eventMap[c.eventId] || "").toLowerCase().includes(q)) {
            return false;
          }
        }
        if (eventFilter !== "all" && c.eventId !== eventFilter) return false;
        if (statusFilter !== "all" && c.paymentStatus !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [celebrations, search, eventFilter, statusFilter, eventMap]);

  const stats = useMemo(() => {
    const paid = celebrations.filter((c) => c.paymentStatus === "paid").length;
    const pending = celebrations.filter((c) => c.paymentStatus === "pending").length;
    const totalViews = celebrations.reduce((sum, c) => sum + (c.views || 0), 0);
    return { total: celebrations.length, paid, pending, totalViews };
  }, [celebrations]);

  // Pagination Logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  if (celebrations === undefined) {
    return <GlobalLoader transparent />;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleStatusUpdate = async (id: any, status: "pending" | "paid" | "failed") => {
    await safeMutation(updateCelebrationStatus, { id, status, token: token || undefined }, `Status updated to ${status}`);
  };

  return (
    <div className="space-y-6 p-6 bg-white min-h-screen text-zinc-950">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-pink-500" /> Celebrations
        </h1>
        <p className="text-zinc-500 text-sm">All published moments across events.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Paid" value={stats.paid} color="text-green-600" />
        <StatCard label="Pending" value={stats.pending} color="text-amber-500" />
        <StatCard label="Total Views" value={stats.totalViews} color="text-blue-500" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search by slug, email, or event..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1); // Reset to page 1 on search
            }}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 sm:flex gap-2">
          <Select value={eventFilter} onValueChange={(val) => { setEventFilter(val); setCurrentPage(1); }}>
            <SelectTrigger className="w-full sm:w-48 h-9 text-xs sm:text-sm"><SelectValue placeholder="All Events" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {events.map((e) => <SelectItem key={e._id} value={e._id}>{e.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>
            <SelectTrigger className="w-full sm:w-36 h-9 text-xs sm:text-sm"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table Container */}
      <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50/80">
                <TableHead className="text-[10px] uppercase font-bold tracking-tight">Date</TableHead>
                <TableHead className="text-[10px] uppercase font-bold tracking-tight">Event</TableHead>
                <TableHead className="text-[10px] uppercase font-bold tracking-tight">Slug / Link</TableHead>
                <TableHead className="text-[10px] uppercase font-bold tracking-tight">Email</TableHead>
                <TableHead className="text-[10px] uppercase font-bold tracking-tight text-center">Views</TableHead>
                <TableHead className="text-[10px] uppercase font-bold tracking-tight text-right">Amount</TableHead>
                <TableHead className="text-[10px] uppercase font-bold tracking-tight">Gateway</TableHead>
                <TableHead className="text-[10px] uppercase font-bold tracking-tight">Status</TableHead>
                <TableHead className="text-[10px] uppercase font-bold tracking-tight text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((c) => (
                <TableRow key={c._id} className="hover:bg-zinc-50/50 transition-colors">
                  <TableCell className="text-[11px] text-zinc-500 whitespace-nowrap">
                    {formatPlatformDate(c.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {eventMap[c.eventId] || "—"}
                  </TableCell>
                  <TableCell className="text-[11px] font-mono text-zinc-500 max-w-[140px] truncate">
                    {c.slug}
                  </TableCell>
                  <TableCell className="text-[11px] text-zinc-500 max-w-[160px] truncate">
                    {c.email}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="text-[10px] font-medium h-5 px-1.5 gap-1 bg-zinc-100/80 text-zinc-600 border-none">
                      <Eye className="h-3 w-3" /> {c.views || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-right font-bold whitespace-nowrap">
                    {c.currency === "USD" ? "$" : "₦"}{c.totalPaid?.toLocaleString() || 0}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${c.gateway === "stripe" ? "bg-indigo-50 text-indigo-700" : "bg-green-50 text-green-700"
                      }`}>
                      {c.gateway || "paystack"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <Select defaultValue={c.paymentStatus} onValueChange={(val: any) => handleStatusUpdate(c._id, val)}>
                      <SelectTrigger className={cn(
                        "h-7 w-28 text-[10px] font-bold uppercase tracking-wider border-none bg-transparent shadow-none focus:ring-0",
                        c.paymentStatus === "paid" ? "text-green-600" : c.paymentStatus === "failed" ? "text-red-500" : "text-amber-500"
                      )}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid" className="text-[10px] font-bold uppercase tracking-wider text-green-600">Paid</SelectItem>
                        <SelectItem value="pending" className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Pending</SelectItem>
                        <SelectItem value="failed" className="text-[10px] font-bold uppercase tracking-wider text-red-500">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-900" asChild>
                      <Link to={`/${c.slug}`}><ExternalLink className="h-4 w-4" /></Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card List View */}
        <div className="md:hidden divide-y divide-zinc-100">
          {paginatedData.map((c) => (
            <div key={c._id} className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-pink-400" />
                    <span className="text-[11px] font-mono text-zinc-400">/{c.slug}</span>
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 truncate max-w-[200px]">{eventMap[c.eventId] || "Unknown Event"}</h3>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-zinc-900">{c.currency === "USD" ? "$" : "₦"}{c.totalPaid?.toLocaleString() || 0}</div>
                  <div className="text-[10px] text-zinc-400">{formatPlatformDate(c.createdAt)}</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-500">
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="truncate max-w-[120px]">{c.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>{c.views || 0}</span>
                  </div>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <Select defaultValue={c.paymentStatus} onValueChange={(val: any) => handleStatusUpdate(c._id, val)}>
                    <SelectTrigger className={cn(
                      "h-6 w-24 text-[10px] font-bold uppercase tracking-widest border-none bg-zinc-50 px-2 rounded",
                      c.paymentStatus === "paid" ? "text-green-600" : c.paymentStatus === "failed" ? "text-red-500" : "text-amber-500"
                    )}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid" className="text-[10px] font-bold uppercase text-green-600">Paid</SelectItem>
                      <SelectItem value="pending" className="text-[10px] font-bold uppercase text-amber-500">Pending</SelectItem>
                      <SelectItem value="failed" className="text-[10px] font-bold uppercase text-red-500">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 h-9 text-xs gap-2 font-medium" asChild>
                  <Link to={`/${c.slug}`}><ExternalLink className="h-3.5 w-3.5 text-zinc-400" /> View Moment</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="border-t border-zinc-100 bg-zinc-50/50 p-4 flex items-center justify-between gap-4">
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
              Page {currentPage} of {totalPages} ({filtered.length} total)
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[11px] font-bold"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[11px] font-bold"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center text-zinc-400 py-16">
            <Search className="h-10 w-10 mx-auto mb-4 opacity-10" />
            <p className="text-sm">No celebrations match your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

function StatCard({ label, value, color = "text-zinc-900" }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value.toLocaleString()}</p>
    </div>
  );
}

export default AdminCelebrations;
