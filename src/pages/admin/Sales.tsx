import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAllSales, getAllEvents, getAllTemplates } from "@/data/data-service";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DollarSign, ShoppingCart, TrendingUp, Percent } from "lucide-react";

type Range = "today" | "7d" | "30d" | "all";

const AdminSales = () => {
  const [range, setRange] = useState<Range>("7d");
  const sales = getAllSales();
  const events = getAllEvents();
  const templates = getAllTemplates();

  const now = Date.now();
  const rangeStart: Record<Range, number> = {
    today: new Date().setHours(0, 0, 0, 0),
    "7d": now - 7 * 86400000,
    "30d": now - 30 * 86400000,
    all: 0,
  };

  const filtered = sales.filter((s) => s.date >= rangeStart[range]);
  const totalRevenue = filtered.reduce((a, s) => a + s.amount, 0);
  const avgOrder = filtered.length ? Math.round(totalRevenue / filtered.length) : 0;

  // Revenue over time
  const days = range === "today" ? 1 : range === "7d" ? 7 : range === "30d" ? 30 : 14;
  const revenueChart = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    d.setHours(0, 0, 0, 0);
    const next = d.getTime() + 86400000;
    const daySales = filtered.filter((s) => s.date >= d.getTime() && s.date < next);
    return { name: d.toLocaleDateString("en", { month: "short", day: "numeric" }), revenue: daySales.reduce((a, s) => a + s.amount, 0) };
  });

  // Top events
  const eventRevenue = events.map((e) => ({
    name: e.name.split(" ").slice(0, 2).join(" "),
    revenue: filtered.filter((s) => s.eventId === e.id).reduce((a, s) => a + s.amount, 0),
  }));

  // Top templates
  const templateRevenue = templates.map((t) => ({
    name: t.name,
    uses: filtered.filter((s) => s.templateId === t.id).length,
  }));

  // Upsell stats
  const upsellStats = [
    { label: "Remove Watermark", pct: Math.round((filtered.filter((s) => s.upsells.removeWatermark).length / Math.max(filtered.length, 1)) * 100) },
    { label: "Music", pct: Math.round((filtered.filter((s) => s.upsells.music).length / Math.max(filtered.length, 1)) * 100) },
    { label: "Custom Link", pct: Math.round((filtered.filter((s) => s.upsells.customLink).length / Math.max(filtered.length, 1)) * 100) },
    { label: "HD Download", pct: Math.round((filtered.filter((s) => s.upsells.hdDownload).length / Math.max(filtered.length, 1)) * 100) },
  ];

  const metrics = [
    { title: "Total Revenue", value: `₦${totalRevenue.toLocaleString()}`, icon: DollarSign },
    { title: "Total Sales", value: filtered.length, icon: ShoppingCart },
    { title: "Avg Order Value", value: `₦${avgOrder.toLocaleString()}`, icon: TrendingUp },
    { title: "Conversion Rate", value: "68%", icon: Percent },
  ];

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Top Events</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={eventRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Top Templates</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={templateRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="uses" fill="#ec4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

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
