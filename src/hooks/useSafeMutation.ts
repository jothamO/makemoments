import { useCallback } from "react";
import { useToast } from "./use-toast";

/**
 * A hook that provides a wrapper for Convex mutations with standardized error handling and toast notifications.
 * It parses Convex server errors into user-friendly messages.
 */
export function useSafeMutation() {
    const { toast } = useToast();

    /**
     * Executes a mutation safely with error handling.
     * @param mutation - The Convex mutation function.
     * @param args - The arguments for the mutation.
     * @param successTitle - Optional title for the success toast.
     * @returns The mutation result on success, or null on failure.
     */
    const safeMutation = useCallback(async <T, V>(mutation: (args: V) => Promise<T>, args: V, successTitle?: string): Promise<T | null> => {
        try {
            const result = await mutation(args);
            if (successTitle) {
                toast({ title: successTitle });
            }
            // Return true if result is undefined but successful, to match old boolean behavior where needed
            return result === undefined ? (true as unknown as T) : result;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error("Mutation error:", error);
            let msg = error.message || "An unexpected error occurred";

            // Extract core error message from Convex noise
            const serverErrorMatch = msg.match(/Server Error (?:Uncaught Error: )?(.*?)(?: at handler|$)/);
            if (serverErrorMatch) {
                msg = serverErrorMatch[1];
            } else {
                msg = msg.replace("ConvexError: ", "").replace("Uncaught Error: ", "");
            }

            // Cleanup trailing periods and whitespace
            msg = msg.trim().replace(/\.$/, "");

            // Ensure sentence case
            if (msg.length > 0) {
                msg = msg.charAt(0).toUpperCase() + msg.slice(1);
            }

            toast({
                title: "Action Failed",
                description: msg,
                variant: "destructive"
            });
            return null;
        }
    }, [toast]);

    return { safeMutation };
}
