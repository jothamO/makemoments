import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { PublicHeader } from "@/components/public/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
    User,
    Lock,
    Bell,
    BellOff,
    Loader2,
    Mail,
    ChevronRight,
    ShieldCheck,
    Settings as SettingsIcon
} from "lucide-react";
import { formatPlatformDate } from "@/lib/utils";
import { motion } from "framer-motion";

export default function Settings() {
    const { user, token } = useAuth();
    const { toast } = useToast();

    // Profile State (Readonly info)
    const [isUpdatingName, setIsUpdatingName] = useState(false);

    // Password State
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    // Notifications State
    const notifications = useQuery(
        api.notifications.listByUser,
        user?._id ? { userId: user._id } : "skip"
    );
    const unsubscribe = useMutation(api.notifications.unsubscribe);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Mutations
    const updateNameMutation = useMutation(api.users.updateName);
    const updatePasswordMutation = useMutation(api.users.updatePassword);

    const handleUpdateName = async (e: React.FormEvent) => {
        e.preventDefault();
        // Disabled as per user request (username/email are readonly)
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        if (newPassword !== confirmPassword) {
            toast({ title: "Passwords do not match", variant: "destructive" });
            return;
        }

        setIsUpdatingPassword(true);
        try {
            await updatePasswordMutation({ token, oldPassword, newPassword });
            toast({ title: "Password updated", description: "Your password has been changed successfully." });
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            toast({ title: "Failed to update password", description: error.message, variant: "destructive" });
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    const handleUnsubscribe = async (eventId: any, email: string) => {
        setProcessingId(eventId);
        try {
            await unsubscribe({ email, eventId });
            toast({ title: "Unsubscribed successfully" });
        } catch (error) {
            toast({ title: "Failed to unsubscribe", variant: "destructive" });
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-white text-zinc-900 relative">
            <PublicHeader />

            <div className="max-w-3xl mx-auto px-6 py-24 md:py-32">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <header className="mb-12">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-zinc-100 rounded-xl">
                                <SettingsIcon className="w-6 h-6 text-zinc-600" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight text-black">Settings</h1>
                        </div>
                        <p className="text-zinc-500 font-medium">Manage your profile and account preferences.</p>
                    </header>

                    <div className="space-y-12">
                        {/* Profile Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-zinc-500 ml-1">Username</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                    <Input
                                        value={user?.username || "Not set"}
                                        readOnly
                                        className="pl-11 bg-zinc-100/50 border-transparent text-zinc-500 cursor-not-allowed h-12 rounded-2xl transition-all"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-zinc-500 ml-1">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                    <Input
                                        value={user?.email || ""}
                                        readOnly
                                        className="pl-11 bg-zinc-100/50 border-transparent text-zinc-500 cursor-not-allowed h-12 rounded-2xl transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-zinc-400 mt-6 ml-1 flex items-center gap-1.5 font-medium">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Personal information is managed by system administrators.
                        </p>

                        {/* Security Section */}
                        <section className="bg-zinc-50/50 rounded-[32px] p-8 border border-black/[0.03]">
                            <div className="flex items-center gap-3 mb-6">
                                <Lock className="w-5 h-5 text-zinc-400" />
                                <h2 className="text-xl font-bold text-black">Account Security</h2>
                            </div>

                            <form onSubmit={handleUpdatePassword} className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-semibold text-zinc-500 ml-1">Current Password</label>
                                        <PasswordInput
                                            value={oldPassword}
                                            onChange={(e) => setOldPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="bg-white border-black/[0.05] rounded-2xl h-12 px-4 shadow-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-zinc-500 ml-1">New Password</label>
                                        <PasswordInput
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="bg-white border-black/[0.05] rounded-2xl h-12 px-4 shadow-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-zinc-500 ml-1">Confirm New Password</label>
                                        <Input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="bg-white border-black/[0.05] rounded-2xl h-12 px-4 shadow-sm"
                                        />
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    disabled={isUpdatingPassword || !newPassword || !oldPassword}
                                    className="w-full bg-zinc-900 hover:bg-black text-white rounded-2xl h-12 font-bold transition-all active:scale-95 shadow-md"
                                >
                                    {isUpdatingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
                                </Button>
                            </form>
                        </section>

                        {/* Notifications Section */}
                        <section className="bg-zinc-50/50 rounded-[32px] p-8 border border-black/[0.03]">
                            <div className="flex items-center gap-3 mb-6">
                                <Bell className="w-5 h-5 text-zinc-400" />
                                <h2 className="text-xl font-bold text-black">Notification Settings</h2>
                            </div>

                            {notifications === undefined ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-zinc-200" />
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-zinc-200">
                                    <Mail className="w-10 h-10 text-zinc-200 mx-auto mb-4" />
                                    <p className="text-zinc-500 font-medium text-lg">No active subscriptions</p>
                                    <p className="text-zinc-400 text-sm mt-1">You haven't subscribed to any event alerts yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {notifications.map((notif) => (
                                        <div
                                            key={notif._id}
                                            className="flex items-center justify-between p-5 rounded-3xl border border-black/[0.03] bg-white shadow-sm hover:shadow-md transition-all duration-300"
                                        >
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-zinc-900 text-lg">{notif.eventName}</span>
                                                    <Badge variant="secondary" className="bg-zinc-100 text-zinc-600 border-0 rounded-lg text-[10px] font-black uppercase tracking-wider px-2">
                                                        {notif.status}
                                                    </Badge>
                                                </div>
                                                <span className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5 font-medium">
                                                    <ShieldCheck className="w-3.5 h-3.5" />
                                                    Alerts set on {formatPlatformDate(notif.createdAt)}
                                                </span>
                                            </div>

                                            {notif.status === "pending" && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-12 h-12 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-colors text-zinc-400"
                                                    onClick={() => handleUnsubscribe(notif.eventId, notif.email)}
                                                    disabled={processingId === notif.eventId}
                                                >
                                                    {processingId === notif.eventId ? (
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                    ) : (
                                                        <BellOff className="w-5 h-5" />
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
