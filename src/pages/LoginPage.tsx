import { useState, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/10 blur-[120px] rounded-full" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md z-10"
            >
                <Link to="/" className="inline-flex items-center text-zinc-400 hover:text-white mb-8 transition-colors text-sm">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back to Home
                </Link>

                <div className="mb-8 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 shadow-2xl mb-4">
                        <Sparkles className="w-6 h-6 text-indigo-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">MakeMoments</h1>
                    <p className="text-zinc-500 mt-2">Sign in to your account</p>
                </div>

                <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-xl text-white">
                            {isAdminLogin ? "Admin Access" : "User Login"}
                        </CardTitle>
                        <CardDescription className="text-zinc-500">
                            {isAdminLogin
                                ? "Enter the administrator password to continue."
                                : "Enter your email and password to access your moments."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {!isAdminLogin && (
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                        <Input
                                            type="email"
                                            placeholder="Email address"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="pl-10 bg-zinc-950/50 border-white/10 text-white placeholder:text-zinc-600 h-12 rounded-xl focus:ring-indigo-500/20"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <Input
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="pl-10 bg-zinc-950/50 border-white/10 text-white placeholder:text-zinc-600 h-12 rounded-xl focus:ring-indigo-500/20"
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
                                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98]"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
                            </Button>
                        </form>
                    </CardContent>
                    {isAdminLogin && (
                        <CardFooter className="pb-6">
                            <Button
                                variant="ghost"
                                onClick={() => setIsAdminLogin(false)}
                                className="text-zinc-500 hover:text-white rounded-xl w-full h-10 transition-colors text-xs"
                            >
                                Exit Administrator Mode
                            </Button>
                        </CardFooter>
                    )}
                </Card>

                {!isAdminLogin && (
                    <p className="text-center text-zinc-500 text-sm mt-8">
                        Don't have an account? Create one during your next moment!
                    </p>
                )}
            </motion.div>
        </div>
    );
}
