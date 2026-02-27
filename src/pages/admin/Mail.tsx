import { useState, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Save, Send, Mail, Settings, Layout, Key, AtSign, Bell } from "lucide-react";
import { GlobalLoader } from "@/components/ui/GlobalLoader";

export default function AdminMail() {
    const { toast } = useToast();
    const config = useQuery(api.mail.getConfig);
    const templates = useQuery(api.mail.getTemplates) || [];

    const upsertConfig = useMutation(api.mail.upsertConfig);
    const upsertTemplate = useMutation(api.mail.upsertTemplate);
    const sendTest = useAction(api.mail.sendTestEmail);
    const stats = useQuery(api.notifications.getStats) || [];

    const [apiKey, setApiKey] = useState("");
    const [fromEmail, setFromEmail] = useState("");
    const [fromName, setFromName] = useState("");
    const [bounceAddress, setBounceAddress] = useState("");
    const [isSavingConfig, setIsSavingConfig] = useState(false);
    const [testEmail, setTestEmail] = useState("");
    const [isSendingTest, setIsSendingTest] = useState(false);

    useEffect(() => {
        if (config) {
            setApiKey(config.zeptomailApiKey);
            setFromEmail(config.fromEmail);
            setFromName(config.fromName);
            setBounceAddress(config.bounceAddress || "");
        }
    }, [config]);

    const handleSaveConfig = async () => {
        setIsSavingConfig(true);
        try {
            await upsertConfig({
                zeptomailApiKey: apiKey,
                fromEmail,
                fromName,
                bounceAddress: bounceAddress || undefined,
            });
            toast({ title: "Configuration saved" });
        } catch (error) {
            toast({ title: "Failed to save config", variant: "destructive" });
        } finally {
            setIsSavingConfig(false);
        }
    };

    const handleSendTest = async (category: any) => {
        if (!testEmail) {
            toast({ title: "Please enter a test email", variant: "destructive" });
            return;
        }
        setIsSendingTest(true);
        try {
            await sendTest({ to: testEmail, category });
            toast({ title: "Test email sent!" });
        } catch (error: any) {
            toast({ title: "Failed to send test", description: error.message, variant: "destructive" });
        } finally {
            setIsSendingTest(false);
        }
    };

    if (templates === undefined || config === undefined) {
        return <GlobalLoader transparent />;
    }

    const categories = [
        { id: "post_payment", label: "Post Payment", description: "Sent after a successful purchase (HD Link)" },
        { id: "welcome", label: "Welcome", description: "Sent when a user creates an account" },
        { id: "reminder", label: "Reminder", description: "Sent to users who requested notification" },
        { id: "newsletter", label: "Newsletter", description: "Standard newsletter template" },
        { id: "new_event", label: "New Event", description: "Announcement for new events" },
        { id: "forgot_password", label: "Forgot Password", description: "Password reset link template" },
        { id: "event_launch", label: "Event Launch", description: "Sent to users waiting for an upcoming event" },
    ];


    return (
        <div className="space-y-8 p-6 bg-white min-h-screen">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
                    <Mail className="h-8 w-8 text-indigo-600" /> Mail Settings
                </h1>
                <p className="text-zinc-500 text-sm">Manage ZeptoMail API keys and email templates.</p>
            </div>

            <Tabs defaultValue="settings" className="w-full">
                <TabsList className="bg-zinc-100 p-1">
                    <TabsTrigger value="settings" className="gap-2"><Settings className="h-4 w-4" /> Configuration</TabsTrigger>
                    <TabsTrigger value="templates" className="gap-2"><Layout className="h-4 w-4" /> Templates</TabsTrigger>
                    <TabsTrigger value="notifications" className="gap-2"><Bell className="h-4 w-4" /> Notifications</TabsTrigger>
                </TabsList>

                <TabsContent value="settings" className="mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        <Card className="lg:col-span-2 border-zinc-200">
                            <CardHeader>
                                <CardTitle>API Configuration</CardTitle>
                                <CardDescription>Setup your ZeptoMail credentials.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Key className="h-3.5 w-3.5 text-zinc-400" /> API Key
                                    </Label>
                                    <Input
                                        type="password"
                                        placeholder="SendMail p-..."
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                    />
                                    <p className="text-[10px] text-zinc-400">Your ZeptoMail authorization key.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <AtSign className="h-3.5 w-3.5 text-zinc-400" /> From Email
                                        </Label>
                                        <Input
                                            placeholder="noreply@makemoments.xyz"
                                            value={fromEmail}
                                            onChange={(e) => setFromEmail(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>From Name</Label>
                                        <Input
                                            placeholder="MakeMoments"
                                            value={fromName}
                                            onChange={(e) => setFromName(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Bounce Address (Optional)</Label>
                                    <Input
                                        placeholder="bounce@makemoments.xyz"
                                        value={bounceAddress}
                                        onChange={(e) => setBounceAddress(e.target.value)}
                                    />
                                </div>

                                <Button onClick={handleSaveConfig} disabled={isSavingConfig} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                                    {isSavingConfig ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Save Configuration
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="border-indigo-100 bg-indigo-50/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">Available Merge Tags</CardTitle>
                                <CardDescription className="text-xs">Use these in your ZeptoMail templates.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-bold text-indigo-600">Links</p>
                                        <div className="grid grid-cols-2 text-[11px] gap-y-1">
                                            <code className="text-indigo-700">{"{{moment_url}}"}</code>
                                            <span className="text-zinc-500">Celebration link</span>
                                            <code className="text-indigo-700">{"{{download_url}}"}</code>
                                            <span className="text-zinc-500">HD download link</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-bold text-indigo-600">Credentials</p>
                                        <div className="grid grid-cols-2 text-[11px] gap-y-1">
                                            <code className="text-indigo-700">{"{{username}}"}</code>
                                            <span className="text-zinc-500">Account login</span>
                                            <code className="text-indigo-700">{"{{password}}"}</code>
                                            <span className="text-zinc-500">Account password</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-bold text-indigo-600">Conditionals</p>
                                        <div className="grid grid-cols-2 text-[11px] gap-y-1">
                                            <code className="text-indigo-700">{"{{has_download}}"}</code>
                                            <span className="text-zinc-500">Show/hide HD section</span>
                                            <code className="text-indigo-700">{"{{has_account}}"}</code>
                                            <span className="text-zinc-500">Show/hide credentials</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-indigo-100">
                                        <p className="text-[10px] text-zinc-400 italic">
                                            * Note: These are currently supported for "Post Payment" emails.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="templates" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {categories.map((cat) => (
                            <TemplateCard
                                key={cat.id}
                                category={cat}
                                existing={templates.find(t => t.category === cat.id)}
                                onSave={async (data) => {
                                    await upsertTemplate({ category: cat.id as any, ...data });
                                    toast({ title: `${cat.label} template updated` });
                                }}
                                testEmail={testEmail}
                                setTestEmail={setTestEmail}
                                onTest={() => handleSendTest(cat.id)}
                                isTesting={isSendingTest}
                            />
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="notifications" className="mt-6">
                    <Card className="border-zinc-200">
                        <CardHeader>
                            <CardTitle>Notification Requests</CardTitle>
                            <CardDescription>Track interest for upcoming events.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-zinc-50 border-b">
                                        <tr>
                                            <th className="text-left px-4 py-3 font-semibold">Event</th>
                                            <th className="text-center px-4 py-3 font-semibold">Pending</th>
                                            <th className="text-center px-4 py-3 font-semibold">Notified</th>
                                            <th className="text-center px-4 py-3 font-semibold">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {stats.map((s) => (
                                            <tr key={s.eventId}>
                                                <td className="px-4 py-3 font-medium">{s.eventName}</td>
                                                <td className="px-4 py-3 text-center">{s.pending}</td>
                                                <td className="px-4 py-3 text-center">{s.notified}</td>
                                                <td className="px-4 py-3 text-center">{s.total}</td>
                                            </tr>
                                        ))}
                                        {stats.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-8 text-center text-zinc-500 italic">
                                                    No notification requests yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function TemplateCard({ category, existing, onSave, testEmail, setTestEmail, onTest, isTesting }: any) {
    const [tid, setTid] = useState(existing?.templateId || "");
    const [sub, setSub] = useState(existing?.subject || "");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (existing) {
            setTid(existing.templateId);
            setSub(existing.subject);
        }
    }, [existing]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave({ templateId: tid, subject: sub });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card className="border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg">{category.label}</CardTitle>
                <CardDescription className="text-xs">{category.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-zinc-400">Template ID</Label>
                    <Input
                        placeholder="2d23.44..."
                        className="h-8 text-xs font-mono"
                        value={tid}
                        onChange={(e) => setTid(e.target.value)}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-zinc-400">Subject</Label>
                    <Input
                        placeholder="Welcome to MakeMoments!"
                        className="h-8 text-xs"
                        value={sub}
                        onChange={(e) => setSub(e.target.value)}
                    />
                </div>

                <div className="pt-2 flex flex-col gap-2">
                    <Button
                        size="sm"
                        variant="secondary"
                        className="w-full gap-2 h-8 text-xs"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        Save Template
                    </Button>

                    <div className="pt-4 border-t border-zinc-100 space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-zinc-400">Test this template</Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="test@email.com"
                                className="h-8 text-xs flex-1"
                                value={testEmail}
                                onChange={(e) => setTestEmail(e.target.value)}
                            />
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2"
                                onClick={onTest}
                                disabled={isTesting || !tid}
                            >
                                <Send className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
