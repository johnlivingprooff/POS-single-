import React, { useState, useEffect } from 'react';
import { SUPPORTED_CURRENCIES, formatCurrency, getCurrency } from '../../../lib/currencies';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { Badge } from '../../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Globe, DollarSign, MapPin } from 'lucide-react';

interface CurrencySettingsProps {
  organizationId?: string; // Optional for system-wide settings
}

const CurrencySettings: React.FC<CurrencySettingsProps> = ({ organizationId }) => {
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [loading, setLoading] = useState(false);

  const africanCurrencies = SUPPORTED_CURRENCIES.filter(c => c.region === 'africa');
  const globalCurrencies = SUPPORTED_CURRENCIES.filter(c => c.region === 'global');

  const handleCurrencyChange = async (currencyCode: string) => {
    setLoading(true);
    try {
      // In a real implementation, this would update the backend
      console.log(`Updating currency to ${currencyCode} for ${organizationId || 'system'}`);
      setSelectedCurrency(currencyCode);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      alert(`Currency updated to ${currencyCode}`);
    } catch (error) {
      console.error('Error updating currency:', error);
      alert('Error updating currency');
    } finally {
      setLoading(false);
    }
  };

  const CurrencyCard = ({ currency }: { currency: typeof SUPPORTED_CURRENCIES[0] }) => (
    <Card 
      className={`cursor-pointer transition-all ${
        selectedCurrency === currency.code 
          ? 'ring-2 ring-blue-500 bg-blue-50' 
          : 'hover:shadow-md'
      }`}
      onClick={() => handleCurrencyChange(currency.code)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl font-bold text-gray-600">
              {currency.symbol}
            </div>
            <div>
              <div className="font-medium">{currency.code}</div>
              <div className="text-sm text-gray-500">{currency.name}</div>
            </div>
          </div>
          <div className="text-right">
            <Badge variant={currency.region === 'africa' ? 'default' : 'secondary'}>
              {currency.region === 'africa' ? 'African' : 'Global'}
            </Badge>
            <div className="text-xs text-gray-500 mt-1">{currency.country}</div>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t">
          <div className="text-sm text-gray-600">
            Example: {formatCurrency(1234.56, currency.code)}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Currency Settings
          </CardTitle>
          <CardDescription>
            {organizationId 
              ? 'Select the primary currency for this organization' 
              : 'Manage system-wide currency support and defaults'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <h4 className="font-medium">Current Currency</h4>
                <p className="text-sm text-gray-600">
                  {getCurrency(selectedCurrency)?.name} ({selectedCurrency})
                </p>
              </div>
              <div className="text-3xl font-bold text-blue-600">
                {getCurrency(selectedCurrency)?.symbol}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-medium text-amber-800 mb-2">Important Note</h4>
              <p className="text-sm text-amber-700">
                Changing currency affects display only. No automatic conversion is performed. 
                All prices remain in their original amounts with the new currency symbol.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="global" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="global" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Global Currencies
          </TabsTrigger>
          <TabsTrigger value="african" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            African Currencies
          </TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {globalCurrencies.map((currency) => (
              <CurrencyCard key={currency.code} currency={currency} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="african" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {africanCurrencies.map((currency) => (
              <CurrencyCard key={currency.code} currency={currency} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Currency System Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">50+ African currencies supported</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Major global currencies (USD, EUR, GBP)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Display-only system (no automatic conversion)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Proper decimal handling per currency</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">System-wide currency changes</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CurrencySettings;
