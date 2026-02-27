import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, History, RefreshCcw, DollarSign, Activity, AlertCircle, CircleDashed, Save, ArrowUpDown, TrendingUp, Wallet, Shield, RefreshCw, CheckCircle2, XCircle, Search, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { GlobalLoader } from "@/components/ui/GlobalLoader";
import { formatPlatformDate } from "@/lib/utils";

// Currency definitions for exchange rate management
const SUPPORTED_CURRENCIES = [
    { code: "NGN", name: "Nigerian Naira", symbol: "₦", flag: "🇳🇬" },
    { code: "GHS", name: "Ghanaian Cedi", symbol: "GH₵", flag: "🇬🇭" },
    { code: "KES", name: "Kenyan Shilling", symbol: "KSh", flag: "🇰🇪" },
    { code: "ZAR", name: "South African Rand", symbol: "R", flag: "🇿🇦" },
    { code: "XOF", name: "CFA Franc", symbol: "CFA", flag: "🇨🇮" },
    { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧" },
    { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
    { code: "CAD", name: "Canadian Dollar", symbol: "CA$", flag: "🇨🇦" },
];

export default function PaymentsPage() {
    const { toast } = useToast();

    // ── Queries ──
    const exchangeRates = useQuery(api.exchangeRates.list) || [];
    const gatewayConfig = useQuery(api.gatewayConfig.get);
    const celebrations = useQuery(api.celebrations.list) || [];
    const events = useQuery(api.events.getAll) || [];

    // ── Mutations ──
    const upsertRate = useMutation(api.exchangeRates.upsert);
    const upsertGateway = useMutation(api.gatewayConfig.upsert);

    // ── Local State ──
    const [rates, setRates] = useState<Record<string, number>>({});
    const [paystackEnabled, setPaystackEnabled] = useState(true);
    const [stripeEnabled, setStripeEnabled] = useState(true);
    const [paystackTestMode, setPaystackTestMode] = useState(false);
    const [stripeTestMode, setStripeTestMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTx, setSearchTx] = useState("");
    // API keys
    const [paystackPublicKey, setPaystackPublicKey] = useState("");
    const [paystackSecretKey, setPaystackSecretKey] = useState("");
    const [stripePublishableKey, setStripePublishableKey] = useState("");
    const [stripeSecretKey, setStripeSecretKey] = useState("");

    // Initialize from queries
    useEffect(() => {
        if (exchangeRates.length) {
            const rateMap: Record<string, number> = {};
            exchangeRates.forEach((r) => {
                rateMap[r.toCurrency] = r.rate;
            });
            setRates((prev) => {
                const next = { ...prev };
                let changed = false;
                Object.entries(rateMap).forEach(([k, v]) => {
                    if (next[k] === undefined) { next[k] = v; changed = true; }
                });
                return changed ? next : prev;
            });
        }
    }, [exchangeRates]);

    useEffect(() => {
        if (gatewayConfig && '_id' in gatewayConfig) {
            setPaystackEnabled(gatewayConfig.paystackEnabled);
            setStripeEnabled(gatewayConfig.stripeEnabled);
            setPaystackTestMode(!!gatewayConfig.paystackTestMode);
            setStripeTestMode(!!gatewayConfig.stripeTestMode);
            setPaystackPublicKey((gatewayConfig as any).paystackPublicKey || "");
            setPaystackSecretKey((gatewayConfig as any).paystackSecretKey || "");
            setStripePublishableKey((gatewayConfig as any).stripePublishableKey || "");
            setStripeSecretKey((gatewayConfig as any).stripeSecretKey || "");
        }
    }, [gatewayConfig]);

    // ── Revenue metrics ──
    const metrics = useMemo(() => {
        const paid = celebrations.filter((c) => c.paymentStatus === "paid");
        const totalRevenue = paid.reduce((sum, c) => sum + c.totalPaid, 0);
        const paystackRevenue = paid.filter((c) => c.gateway === "paystack").reduce((sum, c) => sum + c.totalPaid, 0);
        const stripeRevenue = paid.filter((c) => c.gateway === "stripe").reduce((sum, c) => sum + c.totalPaid, 0);
        const avgOrder = paid.length > 0 ? totalRevenue / paid.length : 0;

        // This month
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const thisMonth = paid.filter((c) => c.createdAt >= monthStart);
        const monthRevenue = thisMonth.reduce((sum, c) => sum + c.totalPaid, 0);

        return { totalRevenue, paystackRevenue, stripeRevenue, avgOrder, monthRevenue, totalPaid: paid.length, thisMonthCount: thisMonth.length };
    }, [celebrations]);

    // ── Transaction list ──
    const transactions = useMemo(() => {
        const eventMap: Record<string, string> = {};
        events.forEach((e) => { eventMap[e._id] = e.name; });

        return celebrations
            .filter((c) => {
                if (!searchTx) return true;
                const q = searchTx.toLowerCase();
                return c.slug.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (eventMap[c.eventId] || "").toLowerCase().includes(q);
            })
            .sort((a, b) => b.createdAt - a.createdAt);
    }, [celebrations, events, searchTx]);

    // ── Save ──
    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Save exchange rates
            for (const [currency, rate] of Object.entries(rates)) {
                if (rate > 0) {
                    await upsertRate({ fromCurrency: "USD", toCurrency: currency, rate });
                }
            }

            // Save gateway config
            await upsertGateway({
                paystackEnabled,
                stripeEnabled,
                paystackTestMode,
                stripeTestMode,
                paystackPublicKey: paystackPublicKey || undefined,
                paystackSecretKey: paystackSecretKey || undefined,
                stripePublishableKey: stripePublishableKey || undefined,
                stripeSecretKey: stripeSecretKey || undefined,
            });

            toast({ title: "Payment settings saved" });
        } catch (error) {
            console.error(error);
            toast({ title: "Failed to save settings", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    // ── Export CSV ──
    const exportCSV = () => {
        const eventMap: Record<string, string> = {};
        events.forEach((e) => { eventMap[e._id] = e.name; });

        const headers = ["Date", "Event", "Email", "Slug", "Amount", "Currency", "Gateway", "Status"];
        const rows = transactions.map((t) => [
            new Date(t.createdAt).toISOString().slice(0, 10),
            eventMap[t.eventId] || "Unknown",
            t.email,
            t.slug,
            t.totalPaid.toString(),
            t.currency || "NGN",
            t.gateway || "paystack",
            t.paymentStatus,
        ]);

        const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (!gatewayConfig) {
        return <GlobalLoader transparent />;
    }

    return (
        <div className="space-y-8 p-6 bg-white min-h-screen text-zinc-950">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
                        <Wallet className="h-8 w-8 text-emerald-600" /> Payments
                    </h1>
                    <p className="text-zinc-500 text-sm">Gateway configuration, exchange rates, and transaction history.</p>
                </div>
                <Button onClick={handleSave} className="gap-2 bg-zinc-900 text-white hover:bg-zinc-800" disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Changes
                </Button>
            </div>

            {/* Revenue cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Total Revenue" value={`₦${metrics.totalRevenue.toLocaleString()}`} icon={TrendingUp} subtitle={`${metrics.totalPaid} payments`} />
                <MetricCard label="This Month" value={`₦${metrics.monthRevenue.toLocaleString()}`} icon={TrendingUp} subtitle={`${metrics.thisMonthCount} payments`} />
                <MetricCard label="Paystack" value={`₦${metrics.paystackRevenue.toLocaleString()}`} icon={Shield} subtitle="African payments" color="text-green-600" />
                <MetricCard label="Stripe" value={`₦${metrics.stripeRevenue.toLocaleString()}`} icon={Shield} subtitle="Global payments" color="text-indigo-600" />
            </div>

            <Tabs defaultValue="rates" className="w-full">
                <TabsList className="bg-zinc-100 p-1">
                    <TabsTrigger value="rates" className="gap-2"><ArrowUpDown className="h-4 w-4" /> Exchange Rates</TabsTrigger>
                    <TabsTrigger value="gateways" className="gap-2"><Shield className="h-4 w-4" /> Gateways</TabsTrigger>
                    <TabsTrigger value="transactions" className="gap-2"><RefreshCw className="h-4 w-4" /> Transactions</TabsTrigger>
                </TabsList>

                {/* Exchange Rates */}
                <TabsContent value="rates" className="mt-4">
                    <Card className="border-zinc-200">
                        <CardHeader>
                            <CardTitle className="text-lg">Exchange Rates (USD → Local)</CardTitle>
                            <CardDescription>Set conversion rates from USD to each supported currency. Nigeria always uses hardcoded NGN prices.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {SUPPORTED_CURRENCIES.map((cur) => (
                                    <div key={cur.code} className="flex items-center gap-3 p-3 rounded-xl border border-zinc-100 bg-zinc-50/50">
                                        <span className="text-2xl">{cur.flag}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-zinc-900">{cur.name}</p>
                                            <p className="text-[10px] text-zinc-400 uppercase">{cur.code}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs text-zinc-400">$1 =</span>
                                            <span className="text-xs text-zinc-400">{cur.symbol}</span>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                className="w-24 h-8 text-sm text-right"
                                                placeholder="0.00"
                                                value={rates[cur.code] ?? ""}
                                                onChange={(e) => setRates((prev) => ({ ...prev, [cur.code]: parseFloat(e.target.value) || 0 }))}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Gateways */}
                <TabsContent value="gateways" className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Paystack */}
                        <Card className="border-zinc-200">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                                            <span className="text-green-700 font-bold text-sm">P</span>
                                        </div>
                                        Paystack
                                    </CardTitle>
                                    <Switch checked={paystackEnabled} onCheckedChange={setPaystackEnabled} />
                                </div>
                                <CardDescription>Handles payments for Nigeria, Ghana, Kenya, South Africa, and Côte d'Ivoire.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-zinc-50">
                                    <div className="flex items-center gap-2">
                                        {paystackTestMode ? (
                                            <span className="h-2 w-2 rounded-full bg-amber-400" />
                                        ) : (
                                            <span className="h-2 w-2 rounded-full bg-green-500" />
                                        )}
                                        <span className="text-sm text-zinc-600">{paystackTestMode ? "Test mode" : "Live mode"}</span>
                                    </div>
                                    <Switch checked={paystackTestMode} onCheckedChange={setPaystackTestMode} />
                                </div>
                                <div className="text-xs text-zinc-400 space-y-1">
                                    <p className="flex items-center gap-1.5">
                                        {paystackEnabled ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <XCircle className="h-3.5 w-3.5 text-red-400" />}
                                        {paystackEnabled ? "Accepting payments" : "Disabled"}
                                    </p>
                                    <p>Currencies: NGN, GHS, KES, ZAR, XOF</p>
                                </div>
                                <div className="space-y-3 pt-3 border-t border-zinc-100">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-zinc-500">Public Key</Label>
                                        <Input type="text" placeholder="pk_test_..." className="h-8 text-xs font-mono" value={paystackPublicKey} onChange={(e) => setPaystackPublicKey(e.target.value)} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-zinc-500">Secret Key</Label>
                                        <Input type="password" placeholder="sk_test_..." className="h-8 text-xs font-mono" value={paystackSecretKey} onChange={(e) => setPaystackSecretKey(e.target.value)} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Stripe */}
                        <Card className="border-zinc-200">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <div className="h-8 w-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                            <span className="text-indigo-700 font-bold text-sm">S</span>
                                        </div>
                                        Stripe
                                    </CardTitle>
                                    <Switch checked={stripeEnabled} onCheckedChange={setStripeEnabled} />
                                </div>
                                <CardDescription>Handles payments for the rest of the world — global card coverage.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-zinc-50">
                                    <div className="flex items-center gap-2">
                                        {stripeTestMode ? (
                                            <span className="h-2 w-2 rounded-full bg-amber-400" />
                                        ) : (
                                            <span className="h-2 w-2 rounded-full bg-green-500" />
                                        )}
                                        <span className="text-sm text-zinc-600">{stripeTestMode ? "Test mode" : "Live mode"}</span>
                                    </div>
                                    <Switch checked={stripeTestMode} onCheckedChange={setStripeTestMode} />
                                </div>
                                <div className="text-xs text-zinc-400 space-y-1">
                                    <p className="flex items-center gap-1.5">
                                        {stripeEnabled ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <XCircle className="h-3.5 w-3.5 text-red-400" />}
                                        {stripeEnabled ? "Accepting payments" : "Disabled"}
                                    </p>
                                    <p>Currencies: USD, GBP, EUR, CAD + all Stripe-supported</p>
                                </div>
                                <div className="space-y-3 pt-3 border-t border-zinc-100">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-zinc-500">Publishable Key</Label>
                                        <Input type="text" placeholder="pk_test_..." className="h-8 text-xs font-mono" value={stripePublishableKey} onChange={(e) => setStripePublishableKey(e.target.value)} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-zinc-500">Secret Key</Label>
                                        <Input type="password" placeholder="sk_test_..." className="h-8 text-xs font-mono" value={stripeSecretKey} onChange={(e) => setStripeSecretKey(e.target.value)} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Transactions */}
                <TabsContent value="transactions" className="mt-4">
                    <Card className="border-zinc-200">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">Transaction Log</CardTitle>
                                    <CardDescription>{celebrations.length} total transactions</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                                        <Input
                                            placeholder="Search by slug, email, event..."
                                            className="pl-8 h-8 w-64 text-sm"
                                            value={searchTx}
                                            onChange={(e) => setSearchTx(e.target.value)}
                                        />
                                    </div>
                                    <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5">
                                        <Download className="h-3.5 w-3.5" /> CSV
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Desktop Table */}
                            <div className="hidden sm:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Event</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Slug</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                            <TableHead>Gateway</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transactions.slice(0, 50).map((tx) => {
                                            const eventName = events.find((e) => e._id === tx.eventId)?.name || "—";
                                            return (
                                                <TableRow key={tx._id} className="border-zinc-100 hover:bg-zinc-50 transition-colors">
                                                    <TableCell className="text-xs text-zinc-500">
                                                        {formatPlatformDate(tx.createdAt)}
                                                    </TableCell>
                                                    <TableCell className="text-sm font-medium text-zinc-900">{eventName}</TableCell>
                                                    <TableCell className="text-sm text-zinc-500">{tx.email}</TableCell>
                                                    <TableCell className="text-xs font-mono text-zinc-400">{tx.slug}</TableCell>
                                                    <TableCell className="text-sm text-right font-bold text-zinc-900">
                                                        {tx.currency === "USD" ? "$" : "₦"}{tx.totalPaid.toLocaleString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${tx.gateway === "stripe"
                                                            ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                                                            : "bg-green-50 text-green-700 border border-green-100"
                                                            }`}>
                                                            {tx.gateway || "paystack"}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${tx.paymentStatus === "paid"
                                                            ? "text-emerald-600"
                                                            : tx.paymentStatus === "failed"
                                                                ? "text-rose-500"
                                                                : "text-amber-500"
                                                            }`}>
                                                            {tx.paymentStatus === "paid" && <CheckCircle2 className="h-3 w-3" />}
                                                            {tx.paymentStatus === "failed" && <XCircle className="h-3 w-3" />}
                                                            {tx.paymentStatus}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="sm:hidden divide-y divide-zinc-100 -mx-6">
                                {transactions.slice(0, 50).map((tx) => {
                                    const eventName = events.find((e) => e._id === tx.eventId)?.name || "—";
                                    return (
                                        <div key={tx._id} className="p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <p className="text-sm font-bold text-zinc-900 leading-tight">{eventName}</p>
                                                    <p className="text-[10px] text-zinc-500">{formatPlatformDate(tx.createdAt)} • {tx.email}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-zinc-900">
                                                        {tx.currency === "USD" ? "$" : "₦"}{tx.totalPaid.toLocaleString()}
                                                    </p>
                                                    <span className={`text-[9px] font-black uppercase tracking-tighter ${tx.paymentStatus === "paid" ? "text-emerald-600" : "text-amber-500"}`}>
                                                        {tx.paymentStatus}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between bg-zinc-50 px-3 py-2 rounded-lg border border-zinc-100">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tight ${tx.gateway === "stripe" ? "bg-indigo-100 text-indigo-700" : "bg-green-100 text-green-700"}`}>
                                                        {tx.gateway || "paystack"}
                                                    </span>
                                                    <code className="text-[9px] text-zinc-400 font-mono">{tx.slug}</code>
                                                </div>
                                                {tx.paymentStatus === "paid" ? (
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                                ) : (
                                                    <RefreshCw className="h-3.5 w-3.5 text-amber-500 animate-spin-slow" />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {transactions.length === 0 && (
                                <div className="text-center text-zinc-400 py-12 border-t border-zinc-100">
                                    No transactions yet
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent >
            </Tabs >
        </div >
    );
}

// ── Metric Card Component ──
function MetricCard({ label, value, icon: Icon, subtitle, color = "text-emerald-600" }: {
    label: string; value: string; icon: any; subtitle: string; color?: string;
}) {
    return (
        <Card className="border-zinc-200">
            <CardContent className="pt-5">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{label}</p>
                        <p className="text-2xl font-bold text-zinc-900 mt-1">{value}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>
                    </div>
                    <Icon className={`h-5 w-5 ${color}`} />
                </div>
            </CardContent>
        </Card>
    );
}
