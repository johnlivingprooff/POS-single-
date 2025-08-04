// Currency support for top 50 African currencies plus major world currencies
export interface Currency {
  code: string;
  name: string;
  symbol: string;
  country: string;
  region: 'africa' | 'global';
  decimals: number;
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  // Major Global Currencies
  { code: 'USD', name: 'US Dollar', symbol: '$', country: 'United States', region: 'global', decimals: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', country: 'European Union', region: 'global', decimals: 2 },
  { code: 'GBP', name: 'British Pound', symbol: '£', country: 'United Kingdom', region: 'global', decimals: 2 },
  
  // Top 50 African Currencies
  { code: 'DZD', name: 'Algerian Dinar', symbol: 'د.ج', country: 'Algeria', region: 'africa', decimals: 2 },
  { code: 'AOA', name: 'Angolan Kwanza', symbol: 'Kz', country: 'Angola', region: 'africa', decimals: 2 },
  { code: 'BWP', name: 'Botswana Pula', symbol: 'P', country: 'Botswana', region: 'africa', decimals: 2 },
  { code: 'BIF', name: 'Burundian Franc', symbol: 'Fr', country: 'Burundi', region: 'africa', decimals: 0 },
  { code: 'XAF', name: 'Central African CFA Franc', symbol: 'Fr', country: 'Cameroon, CAR, Chad, Congo, Equatorial Guinea, Gabon', region: 'africa', decimals: 0 },
  { code: 'CVE', name: 'Cape Verdean Escudo', symbol: '$', country: 'Cape Verde', region: 'africa', decimals: 2 },
  { code: 'KMF', name: 'Comorian Franc', symbol: 'Fr', country: 'Comoros', region: 'africa', decimals: 0 },
  { code: 'CDF', name: 'Congolese Franc', symbol: 'Fr', country: 'Democratic Republic of Congo', region: 'africa', decimals: 2 },
  { code: 'DJF', name: 'Djiboutian Franc', symbol: 'Fr', country: 'Djibouti', region: 'africa', decimals: 0 },
  { code: 'EGP', name: 'Egyptian Pound', symbol: '£', country: 'Egypt', region: 'africa', decimals: 2 },
  { code: 'ERN', name: 'Eritrean Nakfa', symbol: 'Nfk', country: 'Eritrea', region: 'africa', decimals: 2 },
  { code: 'SZL', name: 'Swazi Lilangeni', symbol: 'L', country: 'Eswatini', region: 'africa', decimals: 2 },
  { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br', country: 'Ethiopia', region: 'africa', decimals: 2 },
  { code: 'GMD', name: 'Gambian Dalasi', symbol: 'D', country: 'Gambia', region: 'africa', decimals: 2 },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', country: 'Ghana', region: 'africa', decimals: 2 },
  { code: 'GNF', name: 'Guinean Franc', symbol: 'Fr', country: 'Guinea', region: 'africa', decimals: 0 },
  { code: 'XOF', name: 'West African CFA Franc', symbol: 'Fr', country: 'Guinea-Bissau, Mali, Niger, Senegal, Togo', region: 'africa', decimals: 0 },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', country: 'Kenya', region: 'africa', decimals: 2 },
  { code: 'LSL', name: 'Lesotho Loti', symbol: 'L', country: 'Lesotho', region: 'africa', decimals: 2 },
  { code: 'LRD', name: 'Liberian Dollar', symbol: '$', country: 'Liberia', region: 'africa', decimals: 2 },
  { code: 'LYD', name: 'Libyan Dinar', symbol: 'ل.د', country: 'Libya', region: 'africa', decimals: 3 },
  { code: 'MGA', name: 'Malagasy Ariary', symbol: 'Ar', country: 'Madagascar', region: 'africa', decimals: 2 },
  { code: 'MWK', name: 'Malawian Kwacha', symbol: 'MK', country: 'Malawi', region: 'africa', decimals: 2 },
  { code: 'MRU', name: 'Mauritanian Ouguiya', symbol: 'UM', country: 'Mauritania', region: 'africa', decimals: 2 },
  { code: 'MUR', name: 'Mauritian Rupee', symbol: '₨', country: 'Mauritius', region: 'africa', decimals: 2 },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.', country: 'Morocco', region: 'africa', decimals: 2 },
  { code: 'MZN', name: 'Mozambican Metical', symbol: 'MT', country: 'Mozambique', region: 'africa', decimals: 2 },
  { code: 'NAD', name: 'Namibian Dollar', symbol: '$', country: 'Namibia', region: 'africa', decimals: 2 },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', country: 'Nigeria', region: 'africa', decimals: 2 },
  { code: 'RWF', name: 'Rwandan Franc', symbol: 'Fr', country: 'Rwanda', region: 'africa', decimals: 0 },
  { code: 'STN', name: 'São Tomé and Príncipe Dobra', symbol: 'Db', country: 'São Tomé and Príncipe', region: 'africa', decimals: 2 },
  { code: 'SCR', name: 'Seychellois Rupee', symbol: '₨', country: 'Seychelles', region: 'africa', decimals: 2 },
  { code: 'SLL', name: 'Sierra Leonean Leone', symbol: 'Le', country: 'Sierra Leone', region: 'africa', decimals: 2 },
  { code: 'SOS', name: 'Somali Shilling', symbol: 'Sh', country: 'Somalia', region: 'africa', decimals: 2 },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', country: 'South Africa', region: 'africa', decimals: 2 },
  { code: 'SSP', name: 'South Sudanese Pound', symbol: '£', country: 'South Sudan', region: 'africa', decimals: 2 },
  { code: 'SDG', name: 'Sudanese Pound', symbol: 'ج.س.', country: 'Sudan', region: 'africa', decimals: 2 },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', country: 'Tanzania', region: 'africa', decimals: 2 },
  { code: 'TND', name: 'Tunisian Dinar', symbol: 'د.ت', country: 'Tunisia', region: 'africa', decimals: 3 },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', country: 'Uganda', region: 'africa', decimals: 0 },
  { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'ZK', country: 'Zambia', region: 'africa', decimals: 2 },
  { code: 'ZWL', name: 'Zimbabwean Dollar', symbol: '$', country: 'Zimbabwe', region: 'africa', decimals: 2 },
];

// Currency formatting utility
export function formatCurrency(amount: number, currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  if (!currency) {
    return `${amount.toFixed(2)}`; // Default formatting
  }

  const formattedAmount = amount.toFixed(currency.decimals);
  return `${currency.symbol}${formattedAmount}`;
}

// Get currency by code
export function getCurrency(currencyCode: string): Currency | undefined {
  return SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
}

// Get African currencies only
export function getAfricanCurrencies(): Currency[] {
  return SUPPORTED_CURRENCIES.filter(c => c.region === 'africa');
}

// Get global currencies only
export function getGlobalCurrencies(): Currency[] {
  return SUPPORTED_CURRENCIES.filter(c => c.region === 'global');
}

// Default currency (can be changed via settings)
export const DEFAULT_CURRENCY = 'USD';

// Currency context hook for React components
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CurrencyContextType {
  currentCurrency: string;
  setCurrency: (currencyCode: string) => void;
  formatPrice: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currentCurrency, setCurrentCurrency] = useState(DEFAULT_CURRENCY);

  useEffect(() => {
    // Load currency from settings or localStorage
    const savedCurrency = localStorage.getItem('habicore_currency');
    if (savedCurrency && getCurrency(savedCurrency)) {
      setCurrentCurrency(savedCurrency);
    }
  }, []);

  const setCurrency = (currencyCode: string) => {
    setCurrentCurrency(currencyCode);
    localStorage.setItem('habicore_currency', currencyCode);
  };

  const formatPrice = (amount: number) => {
    return formatCurrency(amount, currentCurrency);
  };

  return (
    <CurrencyContext.Provider value={{ currentCurrency, setCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
