import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { useAuthStore } from '../../../stores/authStore';
import { apiFetch } from '../../../lib/api-utils';

interface Currency {
  code: string;
  name: string;
  symbol: string;
  region: string;
}

const REGION_LABELS: Record<string, string> = {
  global: 'Global Currencies',
  africa: 'African Currencies',
};

const CurrencySettings: React.FC = () => {
  const { token } = useAuthStore();
  const [currentCurrency, setCurrentCurrency] = useState<string>('USD');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [availableCurrencies, setAvailableCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchCurrencySettings();
    fetchAvailableCurrencies();
  }, []);

  const fetchCurrencySettings = async () => {
    try {
      const response = await apiFetch(`/settings/currency`, token);
      const data = await response.json();
      setCurrentCurrency(data.currency);
      setSelectedCurrency(data.currency);
    } catch (error) {
      console.error('Error fetching currency settings:', error);
    }
  };

  const fetchAvailableCurrencies = async () => {
    try {
      const response = await apiFetch(`/settings/currencies`, token);
      const data = await response.json();
      setAvailableCurrencies(data);
    } catch (error) {
      console.error('Error fetching available currencies:', error);
    }
  };

  // Deduplicate by code and group by region for the dropdown
  const groupedCurrencies = useMemo(() => {
    const seen = new Set<string>();
    const groups: Record<string, Currency[]> = {};
    for (const currency of availableCurrencies) {
      if (seen.has(currency.code)) continue;
      seen.add(currency.code);
      const region = currency.region || 'global';
      if (!groups[region]) groups[region] = [];
      groups[region].push(currency);
    }
    return groups;
  }, [availableCurrencies]);

  const currentInfo = availableCurrencies.find(c => c.code === currentCurrency);
  const selectedInfo = availableCurrencies.find(c => c.code === selectedCurrency);
  const isChanged = selectedCurrency !== currentCurrency;

  const updateCurrency = async (newCurrency: string) => {
    try {
      setLoading(true);
      const response = await apiFetch(`/settings/currency`, token, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currency: newCurrency }),
      });

      if (response.ok) {
        setCurrentCurrency(newCurrency);
        setMessage({ type: 'success', text: 'Currency updated successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error('Failed to update currency');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update currency. Please try again.' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Currency</CardTitle>
            <CardDescription>
              Choose the currency used for pricing, receipts, and financial reports.
            </CardDescription>
          </div>
          {currentInfo && (
            <Badge variant="secondary" className="shrink-0 text-sm">
              {currentInfo.symbol} {currentInfo.code}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <label htmlFor="currency-select" className="text-sm font-medium">
            Display currency
          </label>
          <select
            id="currency-select"
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            disabled={loading}
            className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {Object.entries(groupedCurrencies).map(([region, currencies]) => (
              <optgroup key={region} label={REGION_LABELS[region] || region}>
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} — {currency.name} ({currency.symbol})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          <div className="flex items-center justify-between pt-1">
            <p className="text-sm text-muted-foreground">
              {selectedInfo
                ? `Selected: ${selectedInfo.name} (${selectedInfo.symbol})`
                : 'Select a currency'}
            </p>
            <Button
              onClick={() => updateCurrency(selectedCurrency)}
              disabled={loading || !isChanged}
            >
              {loading ? 'Saving…' : 'Update Currency'}
            </Button>
          </div>
        </div>

        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <strong>Note:</strong> Changing the currency affects all new transactions, pricing
          displays, and reports. Existing transaction history remains in its original currency.
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrencySettings;
