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
 * Purged: All hardcoded patterns removed. 
 * Patterns must now be sourced from Convex database.
 */
export const BACKGROUND_PATTERNS: Record<string, PatternDefinition> = {
    'minimal': {
        name: 'Minimal',
        type: 'none',
        physics: 'static',
        css: {}
    }
};

export type PatternId = string;
