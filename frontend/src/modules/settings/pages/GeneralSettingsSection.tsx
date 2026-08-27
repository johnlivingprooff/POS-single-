import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/authStore';
import { useForm } from 'react-hook-form';
import CurrencySettings from '../components/CurrencySettings';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { apiFetch } from '../../../lib/api-utils';


async function fetchGeneralSettingsWithAuth(token: string) {
  const res = await apiFetch('/settings/general', token);
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

async function updateGeneralSettingsWithAuth(data: any, token: string) {
  const res = await apiFetch('/settings/general', token, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update settings');
  return res.json();
}

export default function GeneralSettingsSection() {
  const queryClient = useQueryClient();
  const token = useAuthStore(state => state.token);

  // Wrap fetchers to inject token
  const { data, isLoading, error } = useQuery(['generalSettings', token], () => fetchGeneralSettingsWithAuth(token!), {
    enabled: !!token
  });
  const mutation = useMutation((formData: any) => updateGeneralSettingsWithAuth(formData, token!), {
    onSuccess: () => queryClient.invalidateQueries(['generalSettings', token])
  });
  const { register, handleSubmit, reset } = useForm({
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
    <div className="space-y-6">
      <CurrencySettings />

      <Card>
        <CardHeader>
          <CardTitle>Store Details</CardTitle>
          <CardDescription>
            Basic information about your business.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                {...register('companyName', { required: false })}
                placeholder="e.g. Habicore Stores Ltd."
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={mutation.isLoading}>
                {mutation.isLoading ? 'Saving…' : 'Save Settings'}
              </Button>
              {mutation.isError && (
                <span className="text-sm text-red-500">{(mutation.error as Error).message}</span>
              )}
              {mutation.isSuccess && (
                <span className="text-sm text-green-600">Settings updated!</span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
