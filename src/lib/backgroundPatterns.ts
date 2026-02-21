import React from 'react';

export type PhysicsType = 'static' | 'drift' | 'rising' | 'falling' | 'burst';

export interface PatternDefinition {
    name: string;
    type: 'emoji-canvas' | 'css-only' | 'none';
    emojis?: string[];
    physics: PhysicsType;
    count?: number; // Optional override for particle count
    css: React.CSSProperties;
}

/**
 * BACKGROUND_PATTERNS
 * 
 * Phase 4: Premium Emoji Physics.
 * Matches ourheart.xyz exact configuration.
 */
export const BACKGROUND_PATTERNS: Record<string, PatternDefinition> = {
    'fire': {
        name: 'Fire',
        type: 'emoji-canvas',
        physics: 'rising',
        emojis: ['🔥', '✨'],
        css: {}
    },
    'hearts': {
        name: 'Hearts',
        type: 'emoji-canvas',
        physics: 'rising',
        emojis: ['❤️', '💕', '💗', '💖', '💘'],
        count: 20,
        css: {}
    },
    'balloons': {
        name: 'Balloons',
        type: 'emoji-canvas',
        physics: 'rising',
        emojis: ['🎈', '🎁'],
        count: 15,
        css: {}
    },
    'celebration': {
        name: 'Celebration',
        type: 'emoji-canvas',
        physics: 'falling',
        emojis: ['🎊', '🎉', '✨', '🎀'],
        count: 30,
        css: {}
    },
    'sparkles': {
        name: 'Sparkles',
        type: 'emoji-canvas',
        physics: 'falling',
        emojis: ['✨', '⭐', '💫', '🌟'],
        count: 25,
        css: {}
    },
    'stars': {
        name: 'Stars',
        type: 'emoji-canvas',
        physics: 'burst',
        emojis: ['⭐', '🌟', '💛', '✦'],
        count: 20,
        css: {}
    },
    'halloween': {
        name: 'Halloween',
        type: 'emoji-canvas',
        physics: 'drift',
        emojis: ['🎃', '👻', '💀', '🕸️'],
        css: {}
    },
    'crowns': {
        name: 'Crowns',
        type: 'emoji-canvas',
        physics: 'falling',
        emojis: ['👑', '💎', '✨'],
        css: {}
    },
    'floral': {
        name: 'Floral',
        type: 'emoji-canvas',
        physics: 'falling',
        emojis: ['🌸', '🌺', '🌼', '🌷'],
        count: 20,
        css: {}
    },
    'butterflies': { // New from research
        name: 'Butterflies',
        type: 'emoji-canvas',
        physics: 'rising',
        emojis: ['🦋', '🌿', '🍃'],
        count: 12,
        css: {}
    },
    'snow': { // New from research
        name: 'Snow',
        type: 'emoji-canvas',
        physics: 'falling',
        emojis: ['❄️', '❅', '❆', '✦'],
        count: 30,
        css: {}
    },
    'waves': {
        name: 'Waves',
        type: 'emoji-canvas',
        physics: 'drift',
        emojis: ['🌊', '💧', '🌀'],
        css: {}
    },
    'dots': {
        name: 'Dots',
        type: 'css-only',
        physics: 'static',
        // Fallback or specific CSS pattern
        css: {
            backgroundImage: 'radial-gradient(circle, #e4e4e7 2px, transparent 2px)',
            backgroundSize: '30px 30px',
        }
    },
    'grid': {
        name: 'Grid',
        type: 'css-only',
        physics: 'static',
        css: {
            backgroundImage: `linear-gradient(#e4e4e7 1px, transparent 1px),
                        linear-gradient(90deg, #e4e4e7 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
        }
    },
    'minimal': {
        name: 'Minimal',
        type: 'none',
        physics: 'static',
        css: {}
    }
};

export type PatternId = keyof typeof BACKGROUND_PATTERNS | string;
