import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/authStore';
import { useAppToast } from '../../../hooks/useAppToast';

const pricingMethods = [
  {
    value: 'markup',
    label: 'Markup-Based Pricing',
    description: 'Calculate selling price by adding a percentage markup to the cost price',
    formula: 'Selling Price = Cost × (1 + Markup %)',
  },
  {
    value: 'margin',
    label: 'Margin-Based Pricing',
    description: 'Calculate selling price to achieve a specific profit margin percentage',
    formula: 'Selling Price = Cost ÷ (1 - Margin %)',
  },
  {
    value: 'fixed',
    label: 'Fixed Price',
    description: 'Manually set selling price with automatic markup calculation for reference',
    formula: 'Manual input with calculations for reference',
  },
];

const roundingRules = [
  { value: 'nearest_cent', label: 'Nearest Cent' },
  { value: 'end_in_99', label: 'End in .99' },
  { value: 'round_to_5', label: 'Round to 5' },
];

const SalesPricingConfiguration: React.FC = () => {
  const { token } = useAuthStore();
  const { showToast } = useAppToast();
  const queryClient = useQueryClient();

  // Fetch current config
  const { data, isLoading } = useQuery({
    queryKey: ['salesPricingConfiguration'],
    queryFn: async () => {
      const res = await fetch('/api/settings/sales/pricingConfiguration', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch pricing configuration');
      return res.json();
    },
  });

  // Local state for form
  const [method, setMethod] = useState(data?.defaultPricingMethod || 'markup');
  const [markup, setMarkup] = useState(data?.defaultMarkupPercentage || 25);
  const [margin, setMargin] = useState(data?.defaultMarginPercentage || 20);
  const [enableRounding, setEnableRounding] = useState(data?.enablePriceRounding ?? true);
  const [roundingRule, setRoundingRule] = useState(data?.roundingRule || 'nearest_cent');
  const [showDetails, setShowDetails] = useState(data?.showCalculationDetails ?? true);
  const [allowOverrides, setAllowOverrides] = useState(data?.allowProductLevelOverrides ?? true);

  // Update config mutation
  const mutation = useMutation({
    mutationFn: async (config: any) => {
      const res = await fetch('/api/settings/sales/pricingConfiguration', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error('Failed to update pricing configuration');
      return res.json();
    },
    onSuccess: () => {
      showToast('Pricing configuration updated!', 'success');
      queryClient.invalidateQueries(['salesPricingConfiguration']);
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to update pricing configuration', 'error');
    },
  });

  // Validation helpers
  const isMarkupValid = markup >= 0 && markup <= 1000;
  const isMarginValid = margin >= 0 && margin < 100;

  // Example calculation
  const cost = 100;
  let exampleSellingPrice = 0;
  let exampleMarkup = 0;
  let exampleMargin = 0;
  if (method === 'markup') {
    exampleSellingPrice = cost * (1 + markup / 100);
    exampleMargin = ((exampleSellingPrice - cost) / exampleSellingPrice) * 100;
  } else if (method === 'margin') {
    exampleSellingPrice = cost / (1 - margin / 100);
    exampleMarkup = ((exampleSellingPrice - cost) / cost) * 100;
  } else if (method === 'fixed') {
    exampleSellingPrice = 120;
    exampleMarkup = ((exampleSellingPrice - cost) / cost) * 100;
    exampleMargin = ((exampleSellingPrice - cost) / exampleSellingPrice) * 100;
  }

  const handleSave = () => {
    mutation.mutate({
      defaultPricingMethod: method,
      defaultMarkupPercentage: markup,
      defaultMarginPercentage: margin,
      enablePriceRounding: enableRounding,
      roundingRule,
      showCalculationDetails: showDetails,
      allowProductLevelOverrides: allowOverrides,
    });
  };

  return (
    <div className="w-full mt-4">
      <h2 className="mb-8 text-2xl font-semibold text-gray-800">Pricing Configuration</h2>
      <div className="grid w-full grid-cols-1 gap-8 mb-8 md:grid-cols-2">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">Pricing Method</label>
          <div className="flex gap-4">
            {pricingMethods.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="pricingMethod"
                  value={opt.value}
                  checked={method === opt.value}
                  onChange={() => setMethod(opt.value)}
                  className="accent-primary"
                />
                <span className="font-medium">{opt.label}</span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            {pricingMethods.find((m) => m.value === method)?.description}
          </p>
          <p className="mt-1 text-xs italic text-gray-400">
            Formula: {pricingMethods.find((m) => m.value === method)?.formula}
          </p>
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">Rounding Rule</label>
          <select
            value={roundingRule}
            onChange={(e) => setRoundingRule(e.target.value)}
            className="w-full px-3 py-2 mb-4 border border-gray-300 rounded-md"
          >
            {roundingRules.map((rule) => (
              <option key={rule.value} value={rule.value}>{rule.label}</option>
            ))}
          </select>
        </div>
      </div>
      {/* Default Values Section */}
      <div className="grid w-full grid-cols-1 gap-8 mb-8 md:grid-cols-2">
        {method === 'markup' && (
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Default Markup Percentage (%)</label>
            <input
              type="number"
              value={markup}
              min={0}
              max={1000}
              step={0.01}
              onChange={(e) => setMarkup(Number(e.target.value))}
              className="w-32 px-3 py-2 border border-gray-300 rounded-md"
            />
            {!isMarkupValid && (
              <p className="mt-1 text-xs text-red-600">Markup must be between 0 and 1000%. Warning: Above 100% is unusual.</p>
            )}
          </div>
        )}
        {method === 'margin' && (
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Default Margin Percentage (%)</label>
            <input
              type="number"
              value={margin}
              min={0}
              max={99}
              step={0.01}
              onChange={(e) => setMargin(Number(e.target.value))}
              className="w-32 px-3 py-2 border border-gray-300 rounded-md"
            />
            {!isMarginValid && (
              <p className="mt-1 text-xs text-red-600">Margin must be between 0 and 99%. Cannot be 100% or higher.</p>
            )}
          </div>
        )}
      </div>
      {/* Additional Options */}
      <div className="grid w-full grid-cols-1 gap-8 mb-8 md:grid-cols-2">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">Enable Price Rounding</label>
          <input
            type="checkbox"
            checked={enableRounding}
            onChange={() => setEnableRounding((v: any) => !v)}
            className="accent-primary"
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">Show Calculation Details</label>
          <input
            type="checkbox"
            checked={showDetails}
            onChange={() => setShowDetails((v: any) => !v)}
            className="accent-primary"
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">Allow Product-Level Overrides</label>
          <input
            type="checkbox"
            checked={allowOverrides}
            onChange={() => setAllowOverrides((v: any) => !v)}
            className="accent-primary"
          />
        </div>
      </div>
      {/* Example Calculation */}
      <div className="w-full p-6 mt-8 border rounded-lg bg-gray-50">
        <h3 className="mb-4 text-lg font-semibold text-gray-700">Example Calculation</h3>
        <div className="mb-2 text-base text-gray-800">Cost Price: <span className="font-bold">${cost.toFixed(2)}</span></div>
        <div className="mb-2 text-base text-gray-800">Selling Price: <span className="font-bold">${exampleSellingPrice.toFixed(2)}</span></div>
        {method === 'markup' && (
          <div className="mb-2 text-base text-gray-800">Profit Margin: <span className="font-bold">{exampleMargin.toFixed(2)}%</span></div>
        )}
        {method === 'margin' && (
          <div className="mb-2 text-base text-gray-800">Markup: <span className="font-bold">{exampleMarkup.toFixed(2)}%</span></div>
        )}
        {method === 'fixed' && (
          <>
            <div className="mb-2 text-base text-gray-800">Markup: <span className="font-bold">{exampleMarkup.toFixed(2)}%</span></div>
            <div className="mb-2 text-base text-gray-800">Profit Margin: <span className="font-bold">{exampleMargin.toFixed(2)}%</span></div>
          </>
        )}
      </div>
      <div className="flex justify-end mt-8">
        <button
          onClick={handleSave}
          disabled={mutation.isLoading}
          className="px-6 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {mutation.isLoading ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
      {isLoading && <p className="mt-8 text-gray-500">Loading current configuration...</p>}
    </div>
  );
};

export default SalesPricingConfiguration;
