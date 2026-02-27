import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlobalLoader } from "@/components/ui/GlobalLoader";
import { Eye, ExternalLink, Search, Sparkles, CheckCircle2, XCircle, Clock, MoreHorizontal, Trash2, Download } from "lucide-react";
import { Link } from "react-router-dom";

const AdminCelebrations = () => {
  const celebrations = useQuery(api.celebrations.list) || [];
  const events = useQuery(api.events.getAll) || [];
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

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
  }, [celebrations, events, search, eventFilter, statusFilter, eventMap]);

  const stats = useMemo(() => {
    const paid = celebrations.filter((c) => c.paymentStatus === "paid").length;
    const pending = celebrations.filter((c) => c.paymentStatus === "pending").length;
    const totalViews = celebrations.reduce((sum, c) => sum + (c.views || 0), 0);
    return { total: celebrations.length, paid, pending, totalViews };
  }, [celebrations]);

  if (celebrations === undefined) {
    return <GlobalLoader transparent />;
  }

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
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 sm:flex gap-2">
          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger className="w-full sm:w-48 h-9 text-xs sm:text-sm"><SelectValue placeholder="All Events" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {events.map((e) => <SelectItem key={e._id} value={e._id}>{e.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
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
              {filtered.slice(0, 100).map((c) => (
                <TableRow key={c._id} className="hover:bg-zinc-50/50 transition-colors">
                  <TableCell className="text-[11px] text-zinc-500 whitespace-nowrap">
                    {new Date(c.createdAt).toLocaleDateString()}
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
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${c.paymentStatus === "paid" ? "text-green-600"
                      : c.paymentStatus === "failed" ? "text-red-500"
                        : "text-amber-500"
                      }`}>
                      {c.paymentStatus === "paid" && <CheckCircle2 className="h-3.5 w-3.5" />}
                      {c.paymentStatus === "failed" && <XCircle className="h-3.5 w-3.5" />}
                      {c.paymentStatus === "pending" && <Clock className="h-3.5 w-3.5" />}
                      {c.paymentStatus}
                    </span>
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
          {filtered.slice(0, 100).map((c) => (
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
                  <div className="text-[10px] text-zinc-400">{new Date(c.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <span className="truncate max-w-[120px]">{c.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>{c.views || 0}</span>
                  </div>
                  <span className={`font-bold uppercase ${c.paymentStatus === "paid" ? "text-green-600"
                    : c.paymentStatus === "failed" ? "text-red-500"
                      : "text-amber-500"
                    }`}>
                    {c.paymentStatus}
                  </span>
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

        {filtered.length === 0 && (
          <div className="text-center text-zinc-400 py-16">
            <Search className="h-10 w-10 mx-auto mb-4 opacity-10" />
            <p className="text-sm">No celebrations match your filters.</p>
          </div>
        )}
      </div>

      {filtered.length > 100 && (
        <p className="text-[10px] font-medium text-zinc-400 text-center bg-zinc-50 py-2 rounded-lg">Showing first 100 of {filtered.length} results</p>
      )}
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
