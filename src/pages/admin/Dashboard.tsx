import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DollarSign, Heart, Calendar, TrendingUp, Loader2 } from "lucide-react";

const AdminDashboard = () => {
  const celebrations = useQuery(api.celebrations.list) || [];
  const events = useQuery(api.events.getAll) || [];

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
        name: d.toLocaleDateString("en", { weekday: "short" }),
        revenue: dayCelebrations.reduce((a, c) => a + (c.totalPaid || 0), 0),
      };
    });
  }, [celebrations]);

  if (!celebrations.length && !events.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
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
          <Card key={m.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{m.title}</CardTitle>
              <m.icon className={`h-4 w-4 ${m.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{m.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Celebrations</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
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
                .sort((a, b) => b.createdAt - a.createdAt)
                .slice(0, 10)
                .map((c) => (
                  <TableRow key={c._id}>
                    <TableCell className="font-medium">{c.slug}</TableCell>
                    <TableCell>{c.email}</TableCell>
                    <TableCell>{c.currency === "USD" ? "$" : "₦"}{(c.totalPaid || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium ${c.paymentStatus === "paid" ? "text-green-600"
                          : c.paymentStatus === "failed" ? "text-red-500"
                            : "text-amber-500"
                        }`}>
                        {c.paymentStatus}
                      </span>
                    </TableCell>
                    <TableCell>{c.views || 0}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
