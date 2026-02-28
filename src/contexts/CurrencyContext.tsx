import React, { createContext, useContext, useState, useEffect } from 'react';

// Country → Currency mapping
const COUNTRY_CURRENCY_MAP: Record<string, { code: string; symbol: string }> = {
    // African (Paystack native)
    NG: { code: 'NGN', symbol: '₦' },
    GH: { code: 'GHS', symbol: 'GH₵' },
    KE: { code: 'KES', symbol: 'KSh' },
    ZA: { code: 'ZAR', symbol: 'R' },
    CI: { code: 'XOF', symbol: 'CFA' },

    // North America
    CA: { code: 'CAD', symbol: 'CA$' },

    // UK
    GB: { code: 'GBP', symbol: '£' },

    // Eurozone
    AT: { code: 'EUR', symbol: '€' },
    BE: { code: 'EUR', symbol: '€' },
    CY: { code: 'EUR', symbol: '€' },
    EE: { code: 'EUR', symbol: '€' },
    FI: { code: 'EUR', symbol: '€' },
    FR: { code: 'EUR', symbol: '€' },
    DE: { code: 'EUR', symbol: '€' },
    GR: { code: 'EUR', symbol: '€' },
    IE: { code: 'EUR', symbol: '€' },
    IT: { code: 'EUR', symbol: '€' },
    LV: { code: 'EUR', symbol: '€' },
    LT: { code: 'EUR', symbol: '€' },
    LU: { code: 'EUR', symbol: '€' },
    MT: { code: 'EUR', symbol: '€' },
    NL: { code: 'EUR', symbol: '€' },
    PT: { code: 'EUR', symbol: '€' },
    SK: { code: 'EUR', symbol: '€' },
    SI: { code: 'EUR', symbol: '€' },
    ES: { code: 'EUR', symbol: '€' },
    HR: { code: 'EUR', symbol: '€' }
};

// Default for rest of world
const DEFAULT_CURRENCY = { code: 'USD', symbol: '$' };

interface CurrencyContextType {
    currency: string;        // "NGN", "GHS", "USD", etc.
    symbol: string;          // "₦", "GH₵", "$", etc.
    country: string;         // ISO country code: "NG", "GH", "US", etc.
    isNigeria: boolean;      // Shortcut: true if country === "NG"
    setCurrency: (currency: string) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [country, setCountry] = useState('NG');
    const [currency, setCurrency] = useState('NGN');
    const [symbol, setSymbol] = useState('₦');

    useEffect(() => {
        const detectCountry = async () => {
            // 1. Try cookie (set by optional edge middleware)
            const cookies = document.cookie.split(';');
            const countryCookie = cookies.find(c => c.trim().startsWith('mx-country='));
            let code = countryCookie ? countryCookie.split('=')[1].trim() : null;

            // 2. Try fetching from free IP API if no cookie is present
            if (!code) {
                try {
                    const res = await fetch('https://ipapi.co/json/');
                    if (res.ok) {
                        const data = await res.json();
                        if (data.country_code) {
                            code = data.country_code;
                            // Set the cookie so we don't spam the API on reloads
                            document.cookie = `mx-country=${code}; Path=/; Max-Age=2592000; SameSite=Lax`;
                        }
                    }
                } catch (e) {
                    console.error("Failed to fetch IP country fallback:", e);
                }
            }

            // 3. Ultimate fallback
            if (!code) code = 'NG';
            setCountry(code);

            // Determine currency + symbol
            // eslint-disable-next-line security/detect-object-injection
            const match = COUNTRY_CURRENCY_MAP[code];
            if (match) {
                setCurrency(match.code);
                setSymbol(match.symbol);
            } else {
                setCurrency(DEFAULT_CURRENCY.code);
                setSymbol(DEFAULT_CURRENCY.symbol);
            }
        };

        detectCountry();
    }, []);

    const isNigeria = country === 'NG';

    return (
        <CurrencyContext.Provider value={{ currency, symbol, country, isNigeria, setCurrency }}>
            {children}
        </CurrencyContext.Provider>
    );
};

{/* eslint-disable-next-line react-refresh/only-export-components */}
export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (context === undefined) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
};
