import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api-utils';

// setCurrency.ts


const currencySymbols: Record<string, string> = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CNY': '¥',
    'INR': '₹'
};

export function useCurrency(token: string | null) {
    const { data, isLoading, error } = useQuery(
        ['currency', token],
        async () => {
            if (!token) return null;
            const res = await apiFetch('/settings/currency', token);
            if (!res.ok) throw new Error('Failed to fetch currency');
            return res.json();
        },
        {
            enabled: !!token
        }
    );

    const currencyValue = data?.currency
        ? currencySymbols[data.currency] || data.currency
        : undefined;

    return { currencyValue, isLoading, error };
}