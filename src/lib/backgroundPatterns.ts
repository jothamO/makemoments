import React from 'react';

export type PatternAnimation = 'drift' | 'rising' | 'falling' | 'static';

export interface PatternDefinition {
    name: string;
    type: 'svg-pattern' | 'css-only' | 'none';
    svg?: string;
    css: React.CSSProperties;
    animation?: PatternAnimation;
}

/**
 * BACKGROUND_PATTERNS
 * 
 * Phase 1: Implementing "Scattered" SVG tiles.
 * Internal emojis are placed at non-integer offsets to hide repetition.
 */
export const BACKGROUND_PATTERNS: Record<string, PatternDefinition> = {
    'fire': {
        name: 'Fire',
        type: 'svg-pattern',
        animation: 'rising',
        // Large 250x250 tile with scattered flickers
        svg: `<svg width="250" height="250" xmlns="http://www.w3.org/2000/svg">
          <text x="15.5%" y="22.1%" font-size="32" opacity="0.4">🔥</text>
          <text x="65.3%" y="8.4%" font-size="24" opacity="0.2">🔥</text>
          <text x="42.8%" y="75.9%" font-size="38" opacity="0.3">🔥</text>
          <text x="88.1%" y="54.2%" font-size="28" opacity="0.2">🔥</text>
          <text x="5.2%" y="88.7%" font-size="22" opacity="0.15">🔥</text>
        </svg>`,
        css: {
            backgroundSize: '250px 250px',
            backgroundRepeat: 'repeat',
        }
    },
    'hearts': {
        name: 'Hearts',
        type: 'svg-pattern',
        animation: 'rising',
        svg: `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 22.5 L7.5 15 Q5 12.5 5 10 Q5 5 10 5 Q12.5 5 15 7.5 Q17.5 5 20 5 Q25 5 25 10 Q25 12.5 22.5 15 Z" 
                fill="currentColor" opacity="0.3" transform="translate(32, 45) scale(1.4)"/>
          <path d="M15 22.5 L7.5 15 Q5 12.5 5 10 Q5 5 10 5 Q12.5 5 15 7.5 Q17.5 5 20 5 Q25 5 25 10 Q25 12.5 22.5 15 Z" 
                fill="currentColor" opacity="0.15" transform="translate(145, 22) scale(0.9)"/>
          <path d="M15 22.5 L7.5 15 Q5 12.5 5 10 Q5 5 10 5 Q12.5 5 15 7.5 Q17.5 5 20 5 Q25 5 25 10 Q25 12.5 22.5 15 Z" 
                fill="currentColor" opacity="0.2" transform="translate(88, 154) scale(1.1)"/>
          <path d="M15 22.5 L7.5 15 Q5 12.5 5 10 Q5 5 10 5 Q12.5 5 15 7.5 Q17.5 5 20 5 Q25 5 25 10 Q25 12.5 22.5 15 Z" 
                fill="currentColor" opacity="0.1" transform="translate(10, 110) scale(0.7)"/>
        </svg>`,
        css: {
            backgroundSize: '200px 200px',
            backgroundRepeat: 'repeat',
        }
    },
    'balloons': {
        name: 'Balloons',
        type: 'svg-pattern',
        animation: 'rising',
        svg: `<svg width="250" height="250" xmlns="http://www.w3.org/2000/svg">
          <text x="12.5%" y="15.4%" font-size="38" opacity="0.3">🎈</text>
          <text x="58.2%" y="42.1%" font-size="30" opacity="0.2">🎈</text>
          <text x="31.7%" y="78.5%" font-size="44" opacity="0.3">🎈</text>
          <text x="82.4%" y="12.8%" font-size="28" opacity="0.2">🎈</text>
          <text x="8.9%" y="92.1%" font-size="34" opacity="0.15">🎈</text>
          <text x="75.3%" y="65.4%" font-size="30" opacity="0.2">🎈</text>
        </svg>`,
        css: {
            backgroundSize: '250px 250px',
            backgroundRepeat: 'repeat',
        }
    },
    'stars': {
        name: 'Stars',
        type: 'svg-pattern',
        animation: 'drift',
        svg: `<svg width="180" height="180" xmlns="http://www.w3.org/2000/svg">
          <polygon points="15,3 18,12 27,12 20,17 23,26 15,21 7,26 10,17 3,12 12,12" 
                   fill="currentColor" opacity="0.3" transform="translate(22, 34) scale(1.5)"/>
          <polygon points="15,3 18,12 27,12 20,17 23,26 15,21 7,26 10,17 3,12 12,12" 
                   fill="currentColor" opacity="0.15" transform="translate(130, 48) scale(0.9)"/>
          <polygon points="15,3 18,12 27,12 20,17 23,26 15,21 7,26 10,17 3,12 12,12" 
                   fill="currentColor" opacity="0.2" transform="translate(75, 120) scale(1.2)"/>
          <polygon points="15,3 18,12 27,12 20,17 23,26 15,21 7,26 10,17 3,12 12,12" 
                   fill="currentColor" opacity="0.1" transform="translate(10, 140) scale(0.8)"/>
        </svg>`,
        css: {
            backgroundSize: '180px 180px',
            backgroundRepeat: 'repeat',
        }
    },
    'halloween': {
        name: 'Halloween',
        type: 'svg-pattern',
        animation: 'drift',
        svg: `<svg width="250" height="250" xmlns="http://www.w3.org/2000/svg">
          <text x="15.5%" y="22.1%" font-size="32" opacity="0.4">🎃</text>
          <text x="65.3%" y="45.4%" font-size="28" opacity="0.2">👻</text>
          <text x="32.8%" y="75.9%" font-size="30" opacity="0.3">🕷️</text>
          <text x="88.1%" y="15.2%" font-size="35" opacity="0.2">💀</text>
          <text x="10.2%" y="88.7%" font-size="24" opacity="0.15">🎃</text>
          <text x="75.4%" y="80.1%" font-size="26" opacity="0.2">🕸️</text>
        </svg>`,
        css: {
            backgroundSize: '250px 250px',
            backgroundRepeat: 'repeat',
        }
    },
    'crowns': {
        name: 'Crowns',
        type: 'svg-pattern',
        animation: 'falling',
        svg: `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
          <text x="25.4%" y="28.1%" font-size="38" opacity="0.3">👑</text>
          <text x="72.8%" y="65.4%" font-size="25" opacity="0.2">💎</text>
          <text x="12.1%" y="82.7%" font-size="30" opacity="0.3">✨</text>
          <text x="60.5%" y="18.1%" font-size="22" opacity="0.1">👑</text>
        </svg>`,
        css: {
            backgroundSize: '200px 200px',
            backgroundRepeat: 'repeat',
        }
    },
    'flowers': {
        name: 'Flowers',
        type: 'svg-pattern',
        animation: 'falling',
        svg: `<svg width="220" height="220" xmlns="http://www.w3.org/2000/svg">
          <text x="18.2%" y="25.5%" font-size="34" opacity="0.3">🌸</text>
          <text x="62.4%" y="48.1%" font-size="26" opacity="0.2">🌺</text>
          <text x="35.7%" y="78.2%" font-size="30" opacity="0.3">🌼</text>
          <text x="80.1%" y="12.4%" font-size="22" opacity="0.2">🌷</text>
          <text x="10.5%" y="90.1%" font-size="28" opacity="0.15">🌸</text>
        </svg>`,
        css: {
            backgroundSize: '220px 220px',
            backgroundRepeat: 'repeat',
        }
    },
    'waves': {
        name: 'Waves',
        type: 'svg-pattern',
        animation: 'drift',
        svg: `<svg width="150" height="80" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 20 Q37.5 0, 75 20 T150 20" stroke="currentColor" stroke-width="2" fill="none" opacity="0.2"/>
          <path d="M0 60 Q37.5 40, 75 60 T150 60" stroke="currentColor" stroke-width="1.5" fill="none" opacity="0.1" transform="translate(15, 0)"/>
        </svg>`,
        css: {
            backgroundSize: '150px 80px',
            backgroundRepeat: 'repeat',
        }
    },
    'dots': {
        name: 'Dots',
        type: 'css-only',
        animation: 'drift',
        css: {
            backgroundImage: 'radial-gradient(circle, currentColor 2px, transparent 2px)',
            backgroundSize: '40px 40px',
            backgroundRepeat: 'repeat',
        }
    },
    'grid': {
        name: 'Grid',
        type: 'css-only',
        animation: 'static',
        css: {
            backgroundImage: `linear-gradient(currentColor 1px, transparent 1px),
                        linear-gradient(90deg, currentColor 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
            backgroundRepeat: 'repeat',
        }
    },
    'minimal': {
        name: 'Minimal',
        type: 'none',
        css: {}
    }
};

export type PatternId = keyof typeof BACKGROUND_PATTERNS | string;
