import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { apiFetch } from '../../../lib/api-utils';

interface TaxSettings {
  id?: string;
  taxEnabled: boolean;
  taxType: 'inclusive' | 'exclusive'; // inclusive = embedded, exclusive = on top
  taxPercentage: number;
  taxName: string;
}

const TaxSettingsSection: React.FC = () => {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [settings, setSettings] = useState<TaxSettings>({
    taxEnabled: false,
    taxType: 'exclusive',
    taxPercentage: 0,
    taxName: 'Tax'
  });

  // Fetch current tax settings
  useEffect(() => {
    if (token) {
      fetchTaxSettings();
    }
  }, [token]);

  const fetchTaxSettings = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/settings/tax', token);
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching tax settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiFetch('/settings/tax', token, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (!res.ok) {
        const error = await res.json();
        setMessage({ type: 'error', text: error.error || 'Failed to save tax settings' });
        return;
      }
      
      setMessage({ type: 'success', text: 'Tax settings saved successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save tax settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof TaxSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="w-1/4 h-4 mb-4 bg-gray-200 rounded"></div>
        <div className="space-y-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 text-2xl font-semibold text-gray-900">Tax Configuration</h2>
        <p className="mb-6 text-gray-600">
          Configure tax settings for your point of sale system. These settings will apply to all transactions.
        </p>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid gap-6">
        {/* Enable Tax */}
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="taxEnabled"
            checked={settings.taxEnabled}
            onChange={(e) => handleChange('taxEnabled', e.target.checked)}
            className="w-4 h-4 border-gray-300 rounded text-primary focus:ring-primary"
          />
          <label htmlFor="taxEnabled" className="text-sm font-medium text-gray-700">
            Enable Tax Calculation
          </label>
        </div>

        {settings.taxEnabled && (
          <>
            {/* Tax Name */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Tax Name
              </label>
              <input
                type="text"
                value={settings.taxName}
                onChange={(e) => handleChange('taxName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., VAT, GST, Sales Tax"
              />
            </div>

            {/* Tax Percentage */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Tax Percentage (%)
              </label>
              <input
                type="number"
                value={settings.taxPercentage}
                onChange={(e) => handleChange('taxPercentage', parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="0.00"
              />
            </div>

            {/* Tax Type */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Tax Calculation Method
              </label>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="taxInclusive"
                    name="taxType"
                    value="inclusive"
                    checked={settings.taxType === 'inclusive'}
                    onChange={(e) => handleChange('taxType', e.target.value)}
                    className="w-4 h-4 border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="taxInclusive" className="text-sm text-gray-700">
                    <span className="font-medium">Tax Inclusive</span> - Tax is embedded in the product price
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="taxExclusive"
                    name="taxType"
                    value="exclusive"
                    checked={settings.taxType === 'exclusive'}
                    onChange={(e) => handleChange('taxType', e.target.value)}
                    className="w-4 h-4 border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="taxExclusive" className="text-sm text-gray-700">
                    <span className="font-medium">Tax Exclusive</span> - Tax is added on top of the product price
                  </label>
                </div>
              </div>
            </div>

            {/* Example */}
            <div className="p-4 rounded-md bg-gray-50">
              <h3 className="mb-2 text-sm font-medium text-gray-900">Example Calculation</h3>
              <div className="text-sm text-gray-600">
                {settings.taxType === 'inclusive' ? (
                  <>
                    <p><strong>Product Price:</strong> $100.00 (includes {settings.taxPercentage}% {settings.taxName})</p>
                    <p><strong>Net Amount:</strong> ${(100 / (1 + settings.taxPercentage / 100)).toFixed(2)}</p>
                    <p><strong>{settings.taxName}:</strong> ${(100 - (100 / (1 + settings.taxPercentage / 100))).toFixed(2)}</p>
                    <p><strong>Total:</strong> $100.00</p>
                  </>
                ) : (
                  <>
                    <p><strong>Product Price:</strong> $100.00</p>
                    <p><strong>{settings.taxName} ({settings.taxPercentage}%):</strong> ${(100 * settings.taxPercentage / 100).toFixed(2)}</p>
                    <p><strong>Total:</strong> ${(100 + (100 * settings.taxPercentage / 100)).toFixed(2)}</p>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end pt-6 border-t">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 text-white rounded-md bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Tax Settings'}
        </button>
      </div>
    </div>
  );
};

export default TaxSettingsSection;
