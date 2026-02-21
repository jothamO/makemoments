import React, { createContext, useContext, useState, useEffect } from 'react';

// Paystack-supported African countries
const PAYSTACK_COUNTRIES = ['NG', 'GH', 'KE', 'ZA', 'CI'];

// Country → Currency mapping
const COUNTRY_CURRENCY_MAP: Record<string, { code: string; symbol: string }> = {
    NG: { code: 'NGN', symbol: '₦' },
    GH: { code: 'GHS', symbol: 'GH₵' },
    KE: { code: 'KES', symbol: 'KSh' },
    ZA: { code: 'ZAR', symbol: 'R' },
    CI: { code: 'XOF', symbol: 'CFA' },
};

// Default for rest of world
const DEFAULT_CURRENCY = { code: 'USD', symbol: '$' };

export type Gateway = 'paystack' | 'stripe';

interface CurrencyContextType {
    currency: string;        // "NGN", "GHS", "USD", etc.
    symbol: string;          // "₦", "GH₵", "$", etc.
    country: string;         // ISO country code: "NG", "GH", "US", etc.
    gateway: Gateway;        // "paystack" or "stripe"
    isNigeria: boolean;      // Shortcut: true if country === "NG"
    setCurrency: (currency: string) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [country, setCountry] = useState('NG');
    const [currency, setCurrency] = useState('NGN');
    const [symbol, setSymbol] = useState('₦');
    const [gateway, setGateway] = useState<Gateway>('paystack');

    useEffect(() => {
        // Detect country from cookie (set by edge/CDN)
        const cookies = document.cookie.split(';');
        const countryCookie = cookies.find(c => c.trim().startsWith('mx-country='));

        if (countryCookie) {
            const code = countryCookie.split('=')[1].trim();
            setCountry(code);

            // Determine currency + symbol
            const match = COUNTRY_CURRENCY_MAP[code];
            if (match) {
                setCurrency(match.code);
                setSymbol(match.symbol);
            } else {
                setCurrency(DEFAULT_CURRENCY.code);
                setSymbol(DEFAULT_CURRENCY.symbol);
            }

            // Determine gateway
            setGateway(PAYSTACK_COUNTRIES.includes(code) ? 'paystack' : 'stripe');
        }
    }, []);

    const isNigeria = country === 'NG';

    return (
        <CurrencyContext.Provider value={{ currency, symbol, country, gateway, isNigeria, setCurrency }}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (context === undefined) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
};
