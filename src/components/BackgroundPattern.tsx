import { BACKGROUND_PATTERNS } from '@/lib/backgroundPatterns';
import { useMemo } from 'react';

interface BackgroundPatternProps {
    pattern: string;
    color?: string;
    opacity?: number;
    animated?: boolean;
    customEmojis?: string[]; // Legacy
    type?: string;         // Legacy
}

// Map legacy emoji-based IDs to new SVG/CSS patterns
const LEGACY_PATTERN_MAP: Record<string, string> = {
    'hearts': 'hearts',
    'stars': 'stars',
    'dots': 'dots',
    'grid': 'grid',
    'waves': 'waves',
    'confetti': 'confetti',
    'minimal': 'minimal',
    'fire': 'fire',
    'falling-flowers': 'flowers',
    'floral': 'flowers',
    'celebration': 'confetti',
    'balloons': 'balloons',
    'geometric': 'grid',
    'halloween': 'halloween',
    'crowns': 'crowns',
    'sparkles': 'stars',
    'ghost': 'halloween',
    'pumpkin': 'halloween',
};

/**
 * BackgroundPattern Component (v3 Parallax)
 * 
 * Renders three overlapping layers of SVG/CSS patterns at different speeds
 * and scales to create an organic particle/depth effect.
 */
export function BackgroundPattern({
    pattern,
    color,
    opacity = 0.15,
    animated = true
}: BackgroundPatternProps) {
    // 1. Resolve the pattern (handle legacy IDs and fallbacks)
    let actualPattern = pattern;
    if (pattern in LEGACY_PATTERN_MAP) {
        actualPattern = LEGACY_PATTERN_MAP[pattern];
    }
    const patternKey = (actualPattern in BACKGROUND_PATTERNS) ? actualPattern : 'minimal';
    const patternDef = BACKGROUND_PATTERNS[patternKey];

    // 2. Convert SVG path/text to data URL
    const backgroundImage = useMemo(() => {
        if (patternDef.type === 'svg-pattern' && patternDef.svg) {
            const encoded = encodeURIComponent(patternDef.svg)
                .replace(/'/g, '%27')
                .replace(/"/g, '%22');
            return `url("data:image/svg+xml,${encoded}")`;
        }
        return (patternDef.css as React.CSSProperties).backgroundImage;
    }, [patternDef]);

    if (patternDef.type === 'none') return null;

    // 3. Layer Configuration (Particle Depth System)
    const layers = [
        {
            key: 'bg',
            scale: 0.5,
            speed: 'slow',
            opacity: opacity * 0.4,
            filter: 'brightness(0.6) contrast(1.2) blur(1px)'
        },
        {
            key: 'mid',
            scale: 0.8,
            speed: 'med',
            opacity: opacity * 0.7,
            filter: 'brightness(0.8)'
        },
        {
            key: 'fg',
            scale: 1.2,
            speed: 'fast',
            opacity: opacity,
            filter: 'none'
        }
    ];

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
            {layers.map((layer) => {
                let animationClass = '';
                if (animated && patternDef.animation && patternDef.animation !== 'static') {
                    animationClass = `animate-pattern-${patternDef.animation}-${layer.speed}`;
                }

                return (
                    <div
                        key={layer.key}
                        className={`absolute inset-0 ${animationClass}`}
                        style={{
                            ...patternDef.css,
                            backgroundImage,
                            backgroundSize: patternDef.css.backgroundSize ?
                                `calc(${patternDef.css.backgroundSize} * ${layer.scale})` : undefined,
                            color: color || 'rgba(255,255,255,0.4)',
                            opacity: layer.opacity,
                            mixBlendMode: 'overlay',
                            filter: layer.filter,
                            // Performance optimization: 
                            // transform is already handled by animation classes in index.css
                        }}
                    />
                );
            })}
        </div>
    );
}
