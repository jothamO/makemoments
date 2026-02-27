import { useState, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, Mail, ChevronLeft, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isAdminLogin, setIsAdminLogin] = useState(false);

    const { login } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();

    const loginUser = useMutation(api.auth.loginUser);
    const loginAdmin = useMutation(api.auth.loginAdmin);

    const from = location.state?.from?.pathname || (isAdminLogin ? "/admin" : "/");

    const longPressTimer = useRef<NodeJS.Timeout | null>(null);

    const handlePressStart = () => {
        if (!email && !password && !isAdminLogin) {
            longPressTimer.current = setTimeout(() => {
                setIsAdminLogin(true);
                toast({
                    title: "Administrator Mode",
                    description: "Secret handshake accepted.",
                    duration: 2000
                });
            }, 5000);
        }
    };

    const handlePressEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            let result;
            if (isAdminLogin) {
                result = await loginAdmin({ password });
            } else {
                result = await loginUser({ email, password });
            }

            login(result.token);
            toast({ title: "Welcome back!", description: "Successfully logged in." });
            navigate(from, { replace: true });
        } catch (error: any) {
            toast({
                title: "Login failed",
                description: error.message || "Invalid credentials. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7] p-4 relative overflow-hidden">
            {/* Background Decorations - Apple-style soft pastels */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-200/40 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-pink-100/40 blur-[120px] rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-indigo-50/30 blur-[120px] rounded-full" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-[420px] z-10"
            >
                <Link to="/" className="inline-flex items-center text-zinc-500 hover:text-zinc-900 mb-8 transition-colors text-sm font-medium">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Link>

                <div className="mb-10 text-center">
                    <div className="inline-flex items-center justify-center mb-6">
                        <img
                            src="/assets/logo.webp"
                            alt="MakeMoments"
                            className="h-10 w-auto scale-[3.5] drop-shadow-sm"
                        />
                    </div>
                    <p className="text-zinc-500 mt-2 font-medium">Sign in to your account</p>
                </div>

                <Card className="bg-white/80 border-black/[0.05] backdrop-blur-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="pb-4 pt-8 px-8">
                        <CardTitle className="text-2xl text-zinc-900 font-bold tracking-tight">
                            {isAdminLogin ? "Admin Access" : "Welcome Back"}
                        </CardTitle>
                        <CardDescription className="text-zinc-500 text-sm mt-1">
                            {isAdminLogin
                                ? "Enter the administrator password to continue."
                                : "Enter your credentials to access your moments."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-8 flex flex-col gap-5">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {!isAdminLogin && (
                                <div className="space-y-2">
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
                                        <Input
                                            type="email"
                                            placeholder="Email address"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="pl-11 bg-zinc-100/50 border-transparent focus:border-indigo-500/20 text-zinc-900 placeholder:text-zinc-400 h-13 rounded-2xl transition-all"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <PasswordInput
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="pl-11 bg-zinc-100/50 border-transparent focus:border-indigo-500/20 text-zinc-900 placeholder:text-zinc-400 h-13 rounded-2xl transition-all"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                onMouseDown={handlePressStart}
                                onMouseUp={handlePressEnd}
                                onMouseLeave={handlePressEnd}
                                onTouchStart={handlePressStart}
                                onTouchEnd={handlePressEnd}
                                className="w-full h-13 bg-zinc-900 hover:bg-black text-white rounded-2xl font-bold shadow-lg shadow-black/5 transition-all active:scale-[0.98] mt-2 group"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <span className="flex items-center gap-2">
                                        {isAdminLogin ? "Access Portal" : "Sign In"}
                                        <ChevronLeft className="w-4 h-4 rotate-180 group-hover:translate-x-0.5 transition-transform" />
                                    </span>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                    {isAdminLogin && (
                        <CardFooter className="pb-8 px-8">
                            <Button
                                variant="ghost"
                                onClick={() => setIsAdminLogin(false)}
                                className="text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-2xl w-full h-10 transition-all text-xs font-medium"
                            >
                                Exit Administrator Mode
                            </Button>
                        </CardFooter>
                    )}
                </Card>

                {!isAdminLogin && (
                    <p className="text-center text-zinc-400 text-sm mt-10 font-medium">
                        Don't have an account? <span className="text-zinc-900">Create one during your next moment</span>
                    </p>
                )}
            </motion.div>
        </div>
    );
}
