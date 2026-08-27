import React from 'react';
import InventorySettingsSection from './InventorySettingsSection';
import SalesPricingConfiguration from './SalesPricingConfiguration';
import CategorySettingsSection from './CategorySettingsSection';
import GeneralSettingsSection from './GeneralSettingsSection';
import TaxSettingsSection from './TaxSettingsSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';

const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your store preferences, pricing, and system configuration.
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="flex flex-wrap gap-1">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="tax">Tax</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          <div className="rounded-lg border bg-card p-6 shadow-sm min-h-[500px]">
            <TabsContent value="general">
              <GeneralSettingsSection />
            </TabsContent>
            <TabsContent value="inventory">
              <InventorySettingsSection />
            </TabsContent>
            <TabsContent value="sales">
              <SalesPricingConfiguration />
            </TabsContent>
            <TabsContent value="tax">
              <TaxSettingsSection />
            </TabsContent>
            <TabsContent value="categories">
              <CategorySettingsSection />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default SettingsPage;
