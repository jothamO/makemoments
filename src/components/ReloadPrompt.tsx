import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from 'sonner';

export function ReloadPrompt() {
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered:', r);
            // Check for updates every 60 minutes
            if (r) {
                setInterval(() => {
                    r.update();
                }, 60 * 60 * 1000);
            }
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    useEffect(() => {
        if (needRefresh) {
            toast.info("New version available! Updating...", {
                description: "The app will refresh in a moment to apply the latest changes.",
                duration: 5000,
            });

            // Since we use 'autoUpdate' in vite.config, it might already handle this,
            // but explicitly calling updateServiceWorker(true) ensures it reloads.
            const timeout = setTimeout(() => {
                updateServiceWorker(true);
            }, 1500);

            return () => clearTimeout(timeout);
        }
    }, [needRefresh, updateServiceWorker]);

    return null;
}
