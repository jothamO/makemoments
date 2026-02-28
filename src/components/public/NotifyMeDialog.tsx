import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Bell, Loader2 } from "lucide-react";

// Correcting the Dialog imports based on view_file
import {
    Dialog as ShadcnDialog,
    DialogContent as ShadcnDialogContent,
    DialogHeader as ShadcnDialogHeader,
    DialogTitle as ShadcnDialogTitle,
    DialogDescription as ShadcnDialogDescription,
    DialogFooter as ShadcnDialogFooter,
} from "@/components/ui/dialog";

interface NotifyMeDialogProps {
    event: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        _id: any;
        name: string;
        theme: {
            glowColor: string;
            primary: string;
        };
    };
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function NotifyMeDialog({ event, open, onOpenChange }: NotifyMeDialogProps) {
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user, isLoggedIn } = useAuth();
    const { toast } = useToast();
    const subscribe = useMutation(api.notifications.subscribe);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!isLoggedIn && !email) {
            toast({
                title: "Email required",
                description: "Please enter your email to be notified.",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await subscribe({
                eventId: event._id,
                email: isLoggedIn ? undefined : email,
                userId: user?._id,
            });

            toast({
                title: "All set!",
                description: `We'll let you know as soon as ${event.name} launches.`,
            });
            onOpenChange(false);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            toast({
                title: "Subscription failed",
                description: error.message || "Something went wrong. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // If logged in, we could theoretically just call handleSubmit on mount or when button is clicked
    // but the user wants a popup style matching the platform for guests.
    // Actually, for logged in users, clicking "Notify Me" should just work (toast).
    // But this dialog serves as the guest collection point.

    return (
        <ShadcnDialog open={open} onOpenChange={onOpenChange}>
            <ShadcnDialogContent className="sm:max-w-md">
                <ShadcnDialogHeader>
                    <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 mx-auto"
                        style={{ backgroundColor: `${event.theme.glowColor}20` }}
                    >
                        <Bell className="w-6 h-6" style={{ color: event.theme.glowColor }} />
                    </div>
                    <ShadcnDialogTitle className="text-center text-xl">
                        Notify Me about {event.name}
                    </ShadcnDialogTitle>
                    <ShadcnDialogDescription className="text-center">
                        {isLoggedIn
                            ? `Stay updated on ${event.name}! Click below to confirm.`
                            : `Enter your email and we'll send you a link as soon as ${event.name} is available for creation.`}
                    </ShadcnDialogDescription>
                </ShadcnDialogHeader>

                {!isLoggedIn && (
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <Input
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="h-12"
                        />
                    </form>
                )}

                <ShadcnDialogFooter className="sm:justify-center">
                    <Button
                        type="button"
                        className="w-full h-12 rounded-xl text-white font-bold transition-all"
                        style={{
                            backgroundColor: event.theme.glowColor,
                            boxShadow: `0 8px 24px -6px ${event.theme.glowColor}60`
                        }}
                        onClick={() => handleSubmit()}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Remind Me ✨"}
                    </Button>
                </ShadcnDialogFooter>
            </ShadcnDialogContent>
        </ShadcnDialog>
    );
}
