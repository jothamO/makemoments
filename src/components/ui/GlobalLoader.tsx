import { motion } from "framer-motion";

interface GlobalLoaderProps {
    /** Whether the loader should display its light background or inherit from parent */
    transparent?: boolean;
}

export function GlobalLoader({ transparent = false }: GlobalLoaderProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className={`min-h-screen flex items-center justify-center relative overscroll-none overflow-hidden ${transparent ? "bg-transparent" : "bg-white"
                }`}
        >
            <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center pointer-events-none">
                <video
                    src="/assets/animated-logo.webm"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-contain mix-blend-multiply" // Assuming a white bg on the webm, this helps it blend if ever needed
                />
            </div>

            {/* Subtle glow effect behind the logo */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl opacity-50 pointer-events-none" />
        </motion.div>
    );
}
