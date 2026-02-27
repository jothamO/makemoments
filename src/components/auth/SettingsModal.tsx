import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, Loader2, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { formatPlatformDate } from "@/lib/utils";

interface SettingsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: any;
}

export function SettingsModal({ open, onOpenChange, user }: SettingsModalProps) {
    const { toast } = useToast();
    const notifications = useQuery(
        api.notifications.listByUser,
        user?._id ? { userId: user._id } : "skip"
    );
    const unsubscribe = useMutation(api.notifications.unsubscribe);
    const [processingId, setProcessingId] = useState<string | null>(null);

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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <Bell className="w-6 h-6 text-indigo-500" />
                        Notification Settings
                    </DialogTitle>
                    <DialogDescription>
                        Manage your alerts for upcoming events.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Your Subscriptions</h3>
                        {notifications === undefined ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-zinc-300" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center py-10 bg-zinc-50 rounded-2xl border border-dashed">
                                <Mail className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
                                <p className="text-zinc-500 text-sm">No active notifications.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif._id}
                                        className="flex items-center justify-between p-4 rounded-2xl border border-zinc-100 bg-white hover:bg-zinc-50 transition-colors"
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-bold text-zinc-900">{notif.eventName}</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="secondary" className="text-[10px] capitalize">
                                                    {notif.status}
                                                </Badge>
                                                <span className="text-[10px] text-zinc-400">
                                                    Added {formatPlatformDate(notif.createdAt)}
                                                </span>
                                            </div>
                                        </div>

                                        {notif.status === "pending" && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors"
                                                onClick={() => handleUnsubscribe(notif.eventId, notif.email)}
                                                disabled={processingId === notif.eventId}
                                            >
                                                {processingId === notif.eventId ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <BellOff className="w-4 h-4" />
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
