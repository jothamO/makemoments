import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, ExternalLink, Search, Loader2, Sparkles, CheckCircle2, XCircle, Clock } from "lucide-react";
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

  if (!celebrations.length && !events.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
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
            className="pl-9 h-9"
          />
        </div>
        <Select value={eventFilter} onValueChange={setEventFilter}>
          <SelectTrigger className="w-48 h-9"><SelectValue placeholder="All Events" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {events.map((e) => <SelectItem key={e._id} value={e._id}>{e.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-9"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border border-zinc-200 rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50/80">
              <TableHead className="text-xs">Date</TableHead>
              <TableHead className="text-xs">Event</TableHead>
              <TableHead className="text-xs">Slug / Link</TableHead>
              <TableHead className="text-xs">Email</TableHead>
              <TableHead className="text-xs text-center">Views</TableHead>
              <TableHead className="text-xs text-right">Amount</TableHead>
              <TableHead className="text-xs">Gateway</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.slice(0, 100).map((c) => (
              <TableRow key={c._id}>
                <TableCell className="text-xs text-zinc-500 whitespace-nowrap">
                  {new Date(c.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-sm font-medium">
                  {eventMap[c.eventId] || "—"}
                </TableCell>
                <TableCell className="text-xs font-mono text-zinc-500 max-w-[140px] truncate">
                  {c.slug}
                </TableCell>
                <TableCell className="text-xs text-zinc-500 max-w-[160px] truncate">
                  {c.email}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <Eye className="h-3 w-3" /> {c.views || 0}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-right font-medium whitespace-nowrap">
                  {c.currency === "USD" ? "$" : "₦"}{c.totalPaid?.toLocaleString() || 0}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${c.gateway === "stripe" ? "bg-indigo-50 text-indigo-700" : "bg-green-50 text-green-700"
                    }`}>
                    {c.gateway || "paystack"}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center gap-1 text-xs ${c.paymentStatus === "paid" ? "text-green-600"
                      : c.paymentStatus === "failed" ? "text-red-500"
                        : "text-amber-500"
                    }`}>
                    {c.paymentStatus === "paid" && <CheckCircle2 className="h-3 w-3" />}
                    {c.paymentStatus === "failed" && <XCircle className="h-3 w-3" />}
                    {c.paymentStatus === "pending" && <Clock className="h-3 w-3" />}
                    {c.paymentStatus}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/${c.slug}`}><ExternalLink className="h-3.5 w-3.5" /></Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-zinc-400 py-10">
                  No celebrations found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {filtered.length > 100 && (
        <p className="text-xs text-zinc-400 text-center">Showing first 100 of {filtered.length} results</p>
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
