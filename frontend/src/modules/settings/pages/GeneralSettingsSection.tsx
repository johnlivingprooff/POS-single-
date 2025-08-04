import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/authStore';
import { useForm } from 'react-hook-form';
import CurrencySettings from '../components/CurrencySettings';


// API helpers with JWT auth
function getAuthHeaders(token: string) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchGeneralSettingsWithAuth(token: string) {
  const res = await fetch('/api/settings/general', {
    credentials: 'include',
    headers: {
      ...getAuthHeaders(token)
    }
  });
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

async function updateGeneralSettingsWithAuth(data: any, token: string) {
  const res = await fetch('/api/settings/general', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(token)
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update settings');
  return res.json();
}

const allowedUnits = ['pcs', 'kg', 'g', 'l', 'ml', 'm', 'cm', 'ft', 'custom'];
const allowedCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'INR', 'custom'];

export default function GeneralSettingsSection() {
  const queryClient = useQueryClient();
  const token = useAuthStore(state => state.token);

  // Wrap fetchers to inject token
  const { data, isLoading, error } = useQuery(['generalSettings', token], () => fetchGeneralSettingsWithAuth(token));
  const mutation = useMutation((formData: any) => updateGeneralSettingsWithAuth(formData, token), {
    onSuccess: () => queryClient.invalidateQueries(['generalSettings', token])
  });
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: data || {}
  });

  React.useEffect(() => {
    if (data) reset(data);
  }, [data, reset]);

  const onSubmit = (formData: any) => {
    mutation.mutate(formData);
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">Error loading settings</div>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-6">
      {/* Unit of Measurement */}
      <div>
        <label className="block mb-1 font-medium">Unit of Measurement</label>
        <select {...register('unitOfMeasurement', {
          required: true,
          validate: v => allowedUnits.includes(v) || 'Invalid unit'
        })} className="w-full px-2 py-1 border rounded">
          {allowedUnits.map(u => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
        {errors.unitOfMeasurement && <span className="text-sm text-red-500">{String(errors.unitOfMeasurement.message)}</span>}
      </div>
      {/* Currency */}
      <div className="col-span-2">
        <CurrencySettings />
      </div>

      {/* Company Name */}
      <div>
        <label className="block mb-1 font-medium">Company Name</label>
        <input
          {...register('companyName', { required: false })}
          placeholder="Company Name"
          className="w-full px-2 py-1 border rounded"
        />
      </div>
      <button
        type="submit"
        className="px-4 py-2 text-white rounded bg-primary disabled:opacity-50"
        disabled={mutation.isLoading}
      >
        {mutation.isLoading ? 'Saving...' : 'Save Settings'}
      </button>
      {mutation.isError && <div className="text-red-500">{(mutation.error as Error).message}</div>}
      {mutation.isSuccess && <div className="text-green-600">Settings updated!</div>}
    </form>
  );
}
