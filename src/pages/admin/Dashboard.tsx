import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { GlobalLoader } from "@/components/ui/GlobalLoader";
import { DollarSign, Heart, Calendar, TrendingUp } from "lucide-react";
import { formatPlatformDate } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const AdminDashboard = () => {
  const { token } = useAuth();
  const celebrations = useQuery(api.celebrations.list, { token: token || undefined }) || [];
  const events = useQuery(api.events.getAll, { token: token || undefined }) || [];

  const stats = useMemo(() => {
    const now = Date.now();
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const paidCelebrations = celebrations.filter((c) => c.paymentStatus === "paid");
    const todayRevenue = paidCelebrations
      .filter((c) => c.createdAt >= todayStart)
      .reduce((a, c) => a + (c.totalPaid || 0), 0);
    const activeEvent = events.find((e) => e.status === "active");

    return {
      todayRevenue,
      totalCelebrations: celebrations.length,
      activeEvent: activeEvent?.name || "None",
      conversionRate: celebrations.length > 0
        ? Math.round((paidCelebrations.length / celebrations.length) * 100)
        : 0,
    };
  }, [celebrations, events]);

  // Revenue chart data (last 7 days)
  const chartData = useMemo(() => {
    const paidCelebrations = celebrations.filter((c) => c.paymentStatus === "paid");
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      const nextDay = d.getTime() + 86400000;
      const dayCelebrations = paidCelebrations.filter(
        (c) => c.createdAt >= d.getTime() && c.createdAt < nextDay
      );
      return {
        name: formatPlatformDate(d, { weekday: "short" }),
        revenue: dayCelebrations.reduce((a, c) => a + (c.totalPaid || 0), 0),
      };
    });
  }, [celebrations]);

  if (!celebrations.length && !events.length) {
    return <GlobalLoader transparent />;
  }

  const metrics = [
    { title: "Today's Revenue", value: `₦${stats.todayRevenue.toLocaleString()}`, icon: DollarSign, color: "text-green-600" },
    { title: "Celebrations", value: stats.totalCelebrations, icon: Heart, color: "text-pink-600" },
    { title: "Active Event", value: stats.activeEvent, icon: Calendar, color: "text-indigo-600" },
    { title: "Conversion Rate", value: `${stats.conversionRate}%`, icon: TrendingUp, color: "text-amber-600" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.title} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 pt-3 sm:px-6 sm:pt-6">
              <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">{m.title}</CardTitle>
              <m.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${m.color}`} />
            </CardHeader>
            <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
              <div className="text-lg sm:text-2xl font-bold truncate">{m.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-sm sm:text-base">Revenue (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="h-[200px] sm:h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `₦${(value / 1000)}k`}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => [`₦${value.toLocaleString()}`, "Revenue"]}
                />
                <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-sm sm:text-base">Recent Celebrations</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop Table */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Slug</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Views</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {celebrations
                  .filter((c) => c.paymentStatus === "paid")
                  .sort((a, b) => b.createdAt - a.createdAt)
                  .slice(0, 10)
                  .map((c) => (
                    <TableRow key={c._id}>
                      <TableCell className="font-medium">{c.slug}</TableCell>
                      <TableCell>{c.email}</TableCell>
                      <TableCell>{c.currency === "USD" ? "$" : "₦"}{(c.totalPaid || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <span className="text-xs font-bold uppercase tracking-wider text-green-600">
                          {c.paymentStatus}
                        </span>
                      </TableCell>
                      <TableCell>{c.views || 0}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile List Fallback */}
          <div className="sm:hidden divide-y">
            {celebrations
              .filter((c) => c.paymentStatus === "paid")
              .sort((a, b) => b.createdAt - a.createdAt)
              .slice(0, 10)
              .map((c) => (
                <div key={c._id} className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="font-medium text-sm text-zinc-900 truncate max-w-[150px]">{c.email}</div>
                    <div className="text-sm font-bold">{c.currency === "USD" ? "$" : "₦"}{(c.totalPaid || 0).toLocaleString()}</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-[10px] text-muted-foreground font-mono bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-100">/{c.slug}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">{c.views || 0} views</span>
                      <span className="text-[10px] font-bold uppercase text-green-600">
                        {c.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
