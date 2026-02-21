import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useAuth() {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem("mm_auth_token"));

    const viewer = useQuery(api.auth.getViewer, { token: token || undefined });
    const logoutMutation = useMutation(api.auth.logout);

    const login = useCallback((newToken: string) => {
        localStorage.setItem("mm_auth_token", newToken);
        setToken(newToken);
    }, []);

    const logout = useCallback(async () => {
        if (token) {
            try {
                await logoutMutation({ token });
            } catch (e) {
                console.error("Logout failed", e);
            }
        }
        localStorage.removeItem("mm_auth_token");
        setToken(null);
    }, [token, logoutMutation]);

    return {
        user: viewer,
        isAdmin: viewer?.role === "admin",
        isLoggedIn: !!viewer,
        isLoading: viewer === undefined,
        token,
        login,
        logout
    };
}
