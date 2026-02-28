import { useEffect, useRef } from "react";
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

interface BackgroundPatternProps {
    patternId: string;
    variant?: 'default' | 'subtle';
    className?: string;
}

interface Particle {
    char: string;
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    rotation: number;
    rotationSpeed: number;
    opacity: number;
    baseOpacity: number;
    delay: number;
    swayOffset: number;
    swayAmplitude: number;
    swayFrequency: number;   // per-particle sway speed — more chaos
    age: number;
    layer: 'back' | 'front';
}

export function BackgroundPattern({
    patternId,
    variant = 'default',
    className = ''
}: BackgroundPatternProps) {
    const backCanvasRef = useRef<HTMLCanvasElement>(null);
    const frontCanvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);
    const particlesRef = useRef<Particle[]>([]);

    // Fetch dynamic patterns
    const dynamicPatterns = useQuery(api.patterns.list) || [];

    // Resolve pattern
    const getPattern = () => {
        const dynamic = dynamicPatterns.find(p => p.id === patternId);
        if (dynamic) {
            return {
                name: dynamic.name,
                type: 'emoji-canvas',
                emojis: dynamic.emojis,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                physics: dynamic.type as any,
                css: {}
            };
        }
        return null;
    };

    const pattern = getPattern();
    const isEmojiCanvas = pattern?.type === 'emoji-canvas' && pattern?.emojis && pattern.emojis.length > 0;

    // Helper: full re-roll of a particle's visual properties
    const rerollVisuals = (p: Particle, emojis: string[]) => {
        p.char = emojis[Math.floor(Math.random() * emojis.length)];
        p.size = 14 + Math.random() * 16;
        p.rotationSpeed = (Math.random() - 0.5) * 3.0;
        p.swayAmplitude = 0.04 + Math.random() * 0.12;  // wider range for more chaos
        p.swayFrequency = 600 + Math.random() * 800;     // each particle sways at its own tempo
        p.opacity = 0;
        const mul = 0.7 + Math.random() * 0.6;
        p.speedX = (Math.random() - 0.5) * 0.4 * mul;
    };

    // Initialize Particles
    useEffect(() => {
        if (!isEmojiCanvas || !pattern?.emojis) {
            particlesRef.current = [];
            return;
        }

        const count = variant === 'subtle' ? 15 : 25;
        const particles: Particle[] = [];

        // Physics constants per type
        const type = pattern.physics || 'falling';
        const isBurst = type === 'burst';
        const isRise = type === 'rising';
        const isStatic = type === 'static';

        for (let i = 0; i < count; i++) {
            const emoji = pattern.emojis[Math.floor(Math.random() * pattern.emojis.length)];
            const baseOpacity = 0.4 + Math.random() * 0.6;

            let startX = Math.random() * 100;
            let startY = Math.random() * 100;

            if (isBurst) {
                // Loose cluster around center
                startX = 40 + Math.random() * 20;
                startY = 40 + Math.random() * 20;
            } else if (isRise) {
                startY = 100 + Math.random() * 20;
            } else if (type === 'falling') {
                startY = -(Math.random() * 20);
            } else if (type === 'drift') {
                startY = 20 + Math.random() * 50;
            } else if (isStatic) {
                startX = 10 + Math.random() * 80;
                startY = 15 + Math.random() * 70;
            }

            // Per-particle speed multiplier (0.7x to 1.3x)
            const speedMul = 0.7 + Math.random() * 0.6;

            // 70% back layer, 30% front layer
            const layer: 'back' | 'front' = Math.random() < 0.7 ? 'back' : 'front';

            particles.push({
                char: emoji,
                x: startX,
                y: startY,
                size: 14 + Math.random() * 16,
                speedX: isBurst
                    ? (Math.random() - 0.5) * 2.4 * speedMul
                    : (Math.random() - 0.5) * 0.4 * speedMul,
                speedY: isBurst
                    ? (Math.random() - 0.5) * 2.4 * speedMul
                    : isRise
                        ? -(0.16 + Math.random() * 0.3) * speedMul
                        : isStatic
                            ? 0
                            : (0.16 + Math.random() * 0.3) * speedMul,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 3.0,
                opacity: 0,
                baseOpacity: baseOpacity,
                delay: Math.random() * 3000,
                swayOffset: Math.random() * 1000,
                swayAmplitude: 0.04 + Math.random() * 0.12,
                swayFrequency: 600 + Math.random() * 800,
                age: 0,
                layer: layer,
            });
        }

        particlesRef.current = particles;
        startTimeRef.current = performance.now();

    }, [patternId, variant, isEmojiCanvas, pattern]);

    // The Animation Loop
    useEffect(() => {
        const backCanvas = backCanvasRef.current;
        const frontCanvas = frontCanvasRef.current;
        if (!backCanvas || !frontCanvas || !isEmojiCanvas) return;

        const backCtx = backCanvas.getContext('2d');
        const frontCtx = frontCanvas.getContext('2d');
        if (!backCtx || !frontCtx) return;

        let isRunning = true;

        const handleResize = (entries: ResizeObserverEntry[]) => {
            const entry = entries[0];
            if (entry) {
                const { width: logicalWidth, height: logicalHeight } = entry.contentRect;
                const dpr = window.devicePixelRatio;

                backCanvas.width = logicalWidth * dpr;
                backCanvas.height = logicalHeight * dpr;
                frontCanvas.width = logicalWidth * dpr;
                frontCanvas.height = logicalHeight * dpr;

                backCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
                frontCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
            }
        };

        const observer = new ResizeObserver(handleResize);
        if (backCanvas.parentElement) {
            observer.observe(backCanvas.parentElement);
        }

        // Draw a single particle onto a context
        const drawParticle = (ctx: CanvasRenderingContext2D, p: Particle, lw: number, lh: number) => {
            const drawX = (p.x / 100) * lw;
            const drawY = (p.y / 100) * lh;

            ctx.save();
            ctx.translate(drawX, drawY);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.globalAlpha = p.opacity;
            ctx.font = `${p.size}px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.char, 0, 0);
            ctx.restore();
        };

        // Render Frame
        const animate = (time: number) => {
            if (!isRunning) return;

            const elapsed = time - startTimeRef.current;
            const dpr = window.devicePixelRatio;
            const logicalWidth = backCanvas.width / dpr;
            const logicalHeight = backCanvas.height / dpr;

            backCtx.clearRect(0, 0, logicalWidth, logicalHeight);
            frontCtx.clearRect(0, 0, logicalWidth, logicalHeight);

            particlesRef.current.forEach(p => {
                // Wait for delay
                if (elapsed < p.delay) return;

                // 1. Move — constant speed, no friction
                p.x += p.speedX;
                p.y += p.speedY;
                p.rotation += p.rotationSpeed;

                // 2. Physics Logic
                if (pattern?.physics === 'burst') {
                    // NO friction — constant velocity chaos
                    // Per-particle chaotic sway
                    p.x += Math.sin((elapsed + p.swayOffset) / p.swayFrequency) * p.swayAmplitude;

                    // Snappy fade in
                    if (p.opacity < p.baseOpacity) p.opacity += 0.02;

                    // Re-explode when particle leaves the viewport
                    if (p.x < -15 || p.x > 115 || p.y < -15 || p.y > 115) {
                        p.x = 40 + Math.random() * 20;
                        p.y = 40 + Math.random() * 20;
                        p.opacity = 0;
                        const mul = 0.7 + Math.random() * 0.6;
                        p.speedX = (Math.random() - 0.5) * 2.4 * mul;
                        p.speedY = (Math.random() - 0.5) * 2.4 * mul;
                        rerollVisuals(p, pattern?.emojis!);
                        p.layer = Math.random() < 0.7 ? 'back' : 'front';
                    }
                } else if (pattern?.physics === 'drift') {
                    // Chaotic wandering — two overlapping sine waves at different frequencies
                    const t1 = (elapsed + p.swayOffset) / p.swayFrequency;
                    const t2 = (elapsed + p.delay) / (p.swayFrequency * 0.7);
                    p.x += Math.sin(t1) * p.swayAmplitude * 1.5;
                    p.y += Math.cos(t2) * p.swayAmplitude * 1.2;

                    // Lifetime and fading
                    p.age += 0.005;
                    if (p.age < 0.15) p.opacity = p.baseOpacity * (p.age / 0.15);
                    else if (p.age > 0.75) p.opacity = p.baseOpacity * (1 - (p.age - 0.75) / 0.25);
                    else p.opacity = p.baseOpacity;

                    if (p.age >= 1) {
                        p.age = 0;
                        p.x = 10 + Math.random() * 80;
                        p.y = 20 + Math.random() * 50;
                        rerollVisuals(p, pattern?.emojis!);
                        p.layer = Math.random() < 0.7 ? 'back' : 'front';
                    }
                } else if (pattern?.physics !== 'static') {
                    // Rise/Fall — chaotic per-particle sway
                    p.x += Math.sin((elapsed + p.swayOffset) / p.swayFrequency) * p.swayAmplitude;

                    // Snappy fade in
                    if (p.opacity < p.baseOpacity) p.opacity += 0.02;

                    // Wrap around — full re-roll on recycle
                    if (p.y > 110) {
                        p.y = -10;
                        p.x = Math.random() * 100;
                        rerollVisuals(p, pattern?.emojis!);
                        p.layer = Math.random() < 0.7 ? 'back' : 'front';
                    }
                    if (p.y < -10) {
                        p.y = 105;
                        p.x = Math.random() * 100;
                        rerollVisuals(p, pattern?.emojis!);
                        p.layer = Math.random() < 0.7 ? 'back' : 'front';
                    }
                } else {
                    // Static — chaotic wander with erratic breathing
                    const t1 = (elapsed + p.swayOffset) / (p.swayFrequency * 1.5);
                    const t2 = (elapsed + p.delay) / (p.swayFrequency * 0.9);
                    p.x += Math.sin(t1) * p.swayAmplitude * 0.6;
                    p.y += Math.cos(t2) * p.swayAmplitude * 0.5;

                    // Erratic breathing — two overlapping waves
                    const breath1 = Math.sin((elapsed + p.swayOffset) / 1200) * 0.1;
                    const breath2 = Math.sin((elapsed + p.delay) / 800) * 0.06;
                    if (p.opacity < p.baseOpacity && p.age < 1) {
                        p.opacity += 0.008;
                        p.age = 1; // flag: initial fade done
                    } else {
                        p.opacity = Math.max(0.1, p.baseOpacity + breath1 + breath2);
                    }
                }

                // 3. Draw to the correct canvas
                const ctx = p.layer === 'back' ? backCtx : frontCtx;
                drawParticle(ctx, p, logicalWidth, logicalHeight);
            });

            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);

        return () => {
            isRunning = false;
            observer.disconnect();
            cancelAnimationFrame(requestRef.current);
        };
    }, [patternId, isEmojiCanvas, pattern]);

    // CSS Fallback (Dots/Grid)
    if (pattern?.type === 'css-only') {
        return (
            <div
                className={`absolute inset-0 pointer-events-none -z-10 ${className}`}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                style={(pattern as any).css}
            />
        );
    }

    // Canvas Render — dual layer
    if (pattern?.type === 'emoji-canvas') {
        return (
            <>
                {/* Back layer — behind content (z-10) */}
                <canvas
                    ref={backCanvasRef}
                    className={`absolute inset-0 w-full h-full pointer-events-none z-10 ${className}`}
                    style={{ touchAction: 'none' }}
                />
                {/* Front layer — over content (z-30) */}
                <canvas
                    ref={frontCanvasRef}
                    className={`absolute inset-0 w-full h-full pointer-events-none z-30 ${className}`}
                    style={{ touchAction: 'none' }}
                />
            </>
        );
    }

    return null;
}
