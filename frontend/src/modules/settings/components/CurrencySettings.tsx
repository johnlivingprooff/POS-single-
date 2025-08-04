import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { useAuthStore } from '../../../stores/authStore';

interface Currency {
  code: string;
  name: string;
  symbol: string;
  region: string;
}

const CurrencySettings: React.FC = () => {
  const { token } = useAuthStore();
  const [currentCurrency, setCurrentCurrency] = useState<string>('USD');
  const [availableCurrencies, setAvailableCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchCurrencySettings();
    fetchAvailableCurrencies();
  }, []);

  const fetchCurrencySettings = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/settings/currency`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setCurrentCurrency(data.currency);
    } catch (error) {
      console.error('Error fetching currency settings:', error);
    }
  };

  const fetchAvailableCurrencies = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/settings/currencies`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setAvailableCurrencies(data);
    } catch (error) {
      console.error('Error fetching available currencies:', error);
    }
  };

  const updateCurrency = async (newCurrency: string) => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/settings/currency`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ currency: newCurrency }),
      });

      if (response.ok) {
        setCurrentCurrency(newCurrency);
        setMessage({ type: 'success', text: 'Currency updated successfully!' });
        
        // Clear message after 3 seconds
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

  // Group currencies by region
  const groupedCurrencies = availableCurrencies.reduce((groups, currency) => {
    const region = currency.region;
    if (!groups[region]) {
      groups[region] = [];
    }
    groups[region].push(currency);
    return groups;
  }, {} as Record<string, Currency[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Currency Settings</CardTitle>
        <CardDescription>
          Set the currency for the system. This will be used for all pricing, receipts, and financial reports.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">
            Current Currency: {currentCurrency}
          </label>
          
          <div className="space-y-4">
            {Object.entries(groupedCurrencies).map(([region, currencies]) => (
              <div key={region}>
                <h4 className="text-sm font-medium text-gray-700 mb-2">{region}</h4>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {currencies.map((currency) => (
                    <button
                      key={currency.code}
                      onClick={() => updateCurrency(currency.code)}
                      disabled={loading || currency.code === currentCurrency}
                      className={`p-3 text-left border rounded-md transition-colors ${
                        currency.code === currentCurrency
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="font-medium">{currency.code}</div>
                      <div className="text-sm text-gray-600">{currency.symbol} {currency.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t">
          <p className="text-sm text-gray-600">
            <strong>Note:</strong> Changing your currency will affect all new transactions, pricing displays, and reports. 
            Existing transaction history will remain in their original currencies.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrencySettings;
