import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DollarSign, ShoppingCart, TrendingUp, Percent, Loader2 } from "lucide-react";

type Range = "today" | "7d" | "30d" | "all";

const AdminSales = () => {
  const [range, setRange] = useState<Range>("7d");
  const celebrations = useQuery(api.celebrations.list) || [];
  const events = useQuery(api.events.getAll) || [];

  const now = Date.now();
  const rangeStart: Record<Range, number> = {
    today: new Date().setHours(0, 0, 0, 0),
    "7d": now - 7 * 86400000,
    "30d": now - 30 * 86400000,
    all: 0,
  };

  const filtered = useMemo(() => {
    return celebrations
      .filter((c) => c.paymentStatus === "paid" && c.createdAt >= rangeStart[range]);
  }, [celebrations, range]);

  const totalRevenue = filtered.reduce((a, c) => a + (c.totalPaid || 0), 0);
  const avgOrder = filtered.length ? Math.round(totalRevenue / filtered.length) : 0;

  // Revenue over time
  const days = range === "today" ? 1 : range === "7d" ? 7 : range === "30d" ? 30 : 14;
  const revenueChart = useMemo(() => {
    return Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      d.setHours(0, 0, 0, 0);
      const next = d.getTime() + 86400000;
      const daySales = filtered.filter((c) => c.createdAt >= d.getTime() && c.createdAt < next);
      return {
        name: d.toLocaleDateString("en", { month: "short", day: "numeric" }),
        revenue: daySales.reduce((a, c) => a + (c.totalPaid || 0), 0),
      };
    });
  }, [filtered, days]);

  // Upsell stats
  const upsellStats = useMemo(() => {
    const total = Math.max(filtered.length, 1);
    return [
      { label: "Remove Watermark", pct: Math.round((filtered.filter((c) => c.removeWatermark).length / total) * 100) },
      { label: "Music", pct: Math.round((filtered.filter((c) => c.hasMusic).length / total) * 100) },
      { label: "Custom Link", pct: Math.round((filtered.filter((c) => c.customLink).length / total) * 100) },
      { label: "HD Download", pct: Math.round((filtered.filter((c) => c.hdDownload).length / total) * 100) },
    ];
  }, [filtered]);

  const conversionRate = celebrations.length > 0
    ? Math.round((celebrations.filter((c) => c.paymentStatus === "paid").length / celebrations.length) * 100)
    : 0;

  const metrics = [
    { title: "Total Revenue", value: `₦${totalRevenue.toLocaleString()}`, icon: DollarSign },
    { title: "Total Sales", value: filtered.length, icon: ShoppingCart },
    { title: "Avg Order Value", value: `₦${avgOrder.toLocaleString()}`, icon: TrendingUp },
    { title: "Conversion Rate", value: `${conversionRate}%`, icon: Percent },
  ];

  if (!celebrations.length && !events.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sales Overview</h1>
        <div className="flex gap-1">
          {(["today", "7d", "30d", "all"] as Range[]).map((r) => (
            <Button key={r} variant={range === r ? "default" : "outline"} size="sm" onClick={() => setRange(r)} className="capitalize">
              {r === "7d" ? "7 Days" : r === "30d" ? "30 Days" : r === "all" ? "All Time" : "Today"}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{m.title}</CardTitle>
              <m.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{m.value}</div></CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Revenue Over Time</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revenueChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {upsellStats.map((u) => (
          <Card key={u.label}>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-indigo-600">{u.pct}%</p>
              <p className="text-xs text-muted-foreground mt-1">{u.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminSales;
