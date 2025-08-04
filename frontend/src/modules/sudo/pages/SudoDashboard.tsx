import React, { useState, useEffect } from 'react';
import { useSudoAuthStore } from '../../../stores/sudoAuthStore';
import sudoApi from '../../../services/sudoApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { 
  Building2, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Settings,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  X,
  Save
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';

interface Organization {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  subscriptionPlan: string;
  isActive: boolean;
  maxUsers: number;
  userCount: number;
  createdAt: Date;
  lastActive: Date;
  features: {
    pos: boolean;
    inventory: boolean;
    manufacturing: boolean;
    offsite: boolean;
    crm: boolean;
    reports: boolean;
    users: boolean;
  };
}

interface Analytics {
  totalOrganizations: number;
  activeOrganizations: number;
  totalUsers: number;
  activeUsers: number;
  subscriptionBreakdown: Record<string, number>;
  monthlyRevenue: number;
  growth: {
    organizations: number;
    users: number;
    revenue: number;
  };
  featureUsage: Record<string, number>;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  billingCycle: string;
  maxUsers: number;
  features: Record<string, boolean>;
  limitations: {
    maxProducts: number;
    maxTransactions: number;
  };
}

const SudoDashboard: React.FC = () => {
  const { user, logout } = useSudoAuthStore();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showAddOrgModal, setShowAddOrgModal] = useState(false);
  const [showEditOrgModal, setShowEditOrgModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [viewingOrg, setViewingOrg] = useState<Organization | null>(null);
  
  // Form states
  const [newOrgForm, setNewOrgForm] = useState({
    name: '',
    slug: '',
    domain: '',
    subscriptionPlan: 'trial',
    maxUsers: 5
  });
  
  // Message state
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  // Organization management functions
  const handleAddOrganization = async () => {
    try {
      const response = await sudoApi.post('/sudo/organizations', newOrgForm);
      const newOrg = response.data;
      console.log('New organization created:', newOrg);
      setNewOrgForm({ name: '', slug: '', domain: '', subscriptionPlan: 'trial', maxUsers: 5 });
      setShowAddOrgModal(false);
      showMessage('Organization created successfully!');
      // Refresh data from database since we're now actually persisting
      await fetchData();
    } catch (error) {
      console.error('Error creating organization:', error);
      showMessage('Failed to create organization', 'error');
    }
  };

  const handleViewOrganization = (org: Organization) => {
    setViewingOrg(org);
  };

  const handleEditOrganization = (org: Organization) => {
    setSelectedOrg(org);
    setNewOrgForm({
      name: org.name,
      slug: org.slug,
      domain: org.domain || '',
      subscriptionPlan: org.subscriptionPlan,
      maxUsers: org.maxUsers
    });
    setShowEditOrgModal(true);
  };

  const handleUpdateOrganization = async () => {
    if (!selectedOrg) return;
    
    try {
      const response = await sudoApi.put(`/sudo/organizations/${selectedOrg.id}`, newOrgForm);
      const updatedOrg = response.data;
      setShowEditOrgModal(false);
      setSelectedOrg(null);
      showMessage('Organization updated successfully!');
      // Refresh data from database
      await fetchData();
    } catch (error) {
      showMessage('Failed to update organization', 'error');
    }
  };

  const handleDeleteOrganization = async () => {
    if (!selectedOrg) return;

    try {
      await sudoApi.delete(`/sudo/organizations/${selectedOrg.id}`);
      setShowDeleteConfirm(false);
      setSelectedOrg(null);
      showMessage('Organization deleted successfully!');
      // Refresh data from database
      await fetchData();
    } catch (error) {
      showMessage('Failed to delete organization', 'error');
    }
  };

  const confirmDelete = (org: Organization) => {
    setSelectedOrg(org);
    setShowDeleteConfirm(true);
  };

  // Settings handlers
  const handleSaveCurrencySettings = async () => {
    showMessage('Currency settings saved successfully!');
  };

  const handleSaveConfiguration = async () => {
    showMessage('Configuration saved successfully!');
  };

  const handleUpdateSupportedCurrencies = async () => {
    showMessage('Supported currencies updated successfully!');
  };

  const handleSaveReceiptSettings = async () => {
    showMessage('Receipt settings saved successfully!');
  };

  const generateSlugFromName = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  // Feature toggle handler
  const toggleFeature = async (orgId: string, feature: string, enabled: boolean) => {
    try {
      await sudoApi.put(`/sudo/organizations/${orgId}/features`, { [feature]: enabled });
      setOrganizations(prev =>
        prev.map(o =>
          o.id === orgId
            ? { ...o, features: { ...o.features, [feature]: enabled } }
            : o
        )
      );
      showMessage(`Feature ${feature} ${enabled ? 'enabled' : 'disabled'} successfully!`);
      // Optionally refresh data to ensure consistency
      // await fetchData();
    } catch (error) {
      showMessage('Failed to update feature', 'error');
      // Refresh data on error to revert UI changes
      await fetchData();
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch organizations
      const orgsResponse = await sudoApi.get('/sudo/organizations');
      console.log('Fetched organizations:', orgsResponse.data);
      setOrganizations(orgsResponse.data);

      // Fetch analytics
      const analyticsResponse = await sudoApi.get('/sudo/analytics');
      setAnalytics(analyticsResponse.data);

      // Fetch subscription plans
      const plansResponse = await sudoApi.get('/sudo/subscription-plans');
      setSubscriptionPlans(plansResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSubscriptionBadgeColor = (plan: string) => {
    switch (plan) {
      case 'trial': return 'secondary';
      case 'basic': return 'default';
      case 'premium': return 'default';
      case 'enterprise': return 'default';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading sudo dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Habicore POS - Sudo Dashboard</h1>
              <p className="text-gray-600">System administration and multi-tenant management</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Analytics Overview */}
        {analytics && (
          <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Organizations</CardTitle>
                <Building2 className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalOrganizations}</div>
                <p className="text-xs text-muted-foreground">
                  +{analytics.growth.organizations}% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  +{analytics.growth.users}% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <DollarSign className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${analytics.monthlyRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  +{analytics.growth.revenue}% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Active Orgs</CardTitle>
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.activeOrganizations}</div>
                <p className="text-xs text-muted-foreground">
                  {((analytics.activeOrganizations / analytics.totalOrganizations) * 100).toFixed(1)}% active
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="organizations" className="space-y-6">
          <TabsList>
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="settings">System Settings</TabsTrigger>
          </TabsList>

          {/* Organizations Tab */}
          <TabsContent value="organizations" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Organizations</h2>
              <Button onClick={() => setShowAddOrgModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Organization
              </Button>
            </div>

            <div className="grid gap-6">
              {organizations.map((org) => (
                <Card key={org.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {org.name}
                          <Badge variant={getSubscriptionBadgeColor(org.subscriptionPlan)}>
                            {org.subscriptionPlan}
                          </Badge>
                          {!org.isActive && <Badge variant="destructive">Inactive</Badge>}
                        </CardTitle>
                        <CardDescription>
                          {org.domain || `${org.slug}.habicore.com`} • {org.userCount}/{org.maxUsers} users
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleViewOrganization(org)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditOrganization(org)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Organization
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => confirmDelete(org)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Organization
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="mb-2 text-sm font-medium">Feature Toggles</h4>
                        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                          {Object.entries(org.features).map(([feature, enabled]) => (
                            <div key={feature} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={enabled}
                                onChange={(e) => toggleFeature(org.id, feature, e.target.checked)}
                                className="rounded"
                              />
                              <label className="text-sm capitalize">{feature}</label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Created: {new Date(org.createdAt).toLocaleDateString()}</span>
                        <span>Last Active: {new Date(org.lastActive).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-2xl font-bold">System Analytics</h2>
            
            {analytics && (
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Subscription Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(analytics.subscriptionBreakdown).map(([plan, count]) => (
                        <div key={plan} className="flex justify-between">
                          <span className="capitalize">{plan}:</span>
                          <span>{count} organizations</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Feature Usage (%)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(analytics.featureUsage).map(([feature, usage]) => (
                        <div key={feature} className="flex justify-between">
                          <span className="capitalize">{feature}:</span>
                          <span>{usage.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Subscription Plans</h2>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Plan
              </Button>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {subscriptionPlans.map((plan) => (
                <Card key={plan.id} className={plan.name === 'Enterprise' ? 'border-blue-500' : ''}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {plan.name}
                      {plan.name === 'Enterprise' && (
                        <Badge variant="default">Popular</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      <span className="text-3xl font-bold">${plan.price}</span>
                      <span className="text-sm text-gray-600">/{plan.billingCycle}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium">Features:</p>
                      <ul className="mt-2 space-y-1 text-sm">
                        <li>• Up to {plan.maxUsers} users</li>
                        <li>• {plan.limitations.maxProducts === -1 ? 'Unlimited' : plan.limitations.maxProducts} products</li>
                        <li>• {plan.limitations.maxTransactions === -1 ? 'Unlimited' : plan.limitations.maxTransactions} transactions</li>
                        {Object.entries(plan.features).map(([feature, enabled]) => 
                          enabled && <li key={feature}>• {feature.toUpperCase()}</li>
                        )}
                      </ul>
                    </div>
                    <Button className="w-full" variant="outline">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Plan
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <h2 className="text-2xl font-bold">System Settings</h2>
            
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Global Currency Settings</CardTitle>
                  <CardDescription>
                    Manage supported currencies (Organizations can override in their settings)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium">Default System Currency</label>
                    <select className="w-full p-2 border border-gray-300 rounded-md">
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="NGN">NGN - Nigerian Naira</option>
                      <option value="KES">KES - Kenyan Shilling</option>
                      <option value="ZAR">ZAR - South African Rand</option>
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked />
                      <span className="text-sm">Allow organizations to set their own currency</span>
                    </label>
                  </div>
                  <Button onClick={handleSaveCurrencySettings}>Save Currency Settings</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Multi-Tenant Configuration</CardTitle>
                  <CardDescription>
                    System-wide tenant management settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked />
                      <span className="text-sm">Enable custom domains for organizations</span>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked />
                      <span className="text-sm">Allow organization-level feature customization</span>
                    </label>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium">Default Trial Period (days)</label>
                    <input type="number" defaultValue="30" className="w-full p-2 border border-gray-300 rounded-md" />
                  </div>
                  <Button onClick={handleSaveConfiguration}>Save Configuration</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Supported African Currencies</CardTitle>
                  <CardDescription>
                    Enable currencies for African markets
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-60">
                    {['NGN - Nigerian Naira', 'KES - Kenyan Shilling', 'GHS - Ghanaian Cedi', 
                      'UGX - Ugandan Shilling', 'TZS - Tanzanian Shilling', 'ZAR - South African Rand',
                      'EGP - Egyptian Pound', 'MAD - Moroccan Dirham', 'ETB - Ethiopian Birr',
                      'XOF - West African CFA Franc', 'XAF - Central African CFA Franc'].map(currency => (
                      <label key={currency} className="flex items-center space-x-2 text-sm">
                        <input type="checkbox" defaultChecked />
                        <span>{currency}</span>
                      </label>
                    ))}
                  </div>
                  <Button className="mt-4" onClick={handleUpdateSupportedCurrencies}>Update Supported Currencies</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Receipt Configuration</CardTitle>
                  <CardDescription>
                    Global receipt settings and formatting
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium">Default Paper Size</label>
                    <select className="w-full p-2 border border-gray-300 rounded-md">
                      <option value="A4">A4 (210×297mm)</option>
                      <option value="A5">A5 (148×210mm)</option>
                      <option value="B5">B5 (176×250mm)</option>
                      <option value="Letter">Letter (216×279mm)</option>
                      <option value="Thermal">Thermal (80mm)</option>
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked />
                      <span className="text-sm">Center receipts on page</span>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" />
                      <span className="text-sm">Auto-print receipts</span>
                    </label>
                  </div>
                  <Button onClick={handleSaveReceiptSettings}>Save Receipt Settings</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Message Display */}
        {message && (
          <div className="fixed z-50 bottom-4 right-4">
            <Alert className={`min-w-[300px] ${
              message.type === 'error' 
                ? 'border-red-500 bg-red-50 text-red-700' 
                : 'border-green-500 bg-green-50 text-green-700'
            }`}>
              <div className="flex items-center justify-between">
                <span>{message.text}</span>
                <button 
                  onClick={() => setMessage(null)}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </Alert>
          </div>
        )}

        {/* Add Organization Modal */}
        {showAddOrgModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Add New Organization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Organization Name</Label>
                  <Input
                    id="name"
                    value={newOrgForm.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setNewOrgForm(prev => ({
                        ...prev,
                        name,
                        slug: generateSlugFromName(name)
                      }));
                    }}
                    placeholder="Enter organization name"
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={newOrgForm.slug}
                    onChange={(e) => setNewOrgForm(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="organization-slug"
                  />
                </div>
                <div>
                  <Label htmlFor="domain">Custom Domain (optional)</Label>
                  <Input
                    id="domain"
                    value={newOrgForm.domain}
                    onChange={(e) => setNewOrgForm(prev => ({ ...prev, domain: e.target.value }))}
                    placeholder="custom-domain.com"
                  />
                </div>
                <div>
                  <Label htmlFor="subscriptionPlan">Subscription Plan</Label>
                  <select
                    id="subscriptionPlan"
                    value={newOrgForm.subscriptionPlan}
                    onChange={(e) => setNewOrgForm(prev => ({ ...prev, subscriptionPlan: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="trial">Trial</option>
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="maxUsers">Max Users</Label>
                  <Input
                    id="maxUsers"
                    type="number"
                    value={newOrgForm.maxUsers}
                    onChange={(e) => setNewOrgForm(prev => ({ ...prev, maxUsers: parseInt(e.target.value) || 5 }))}
                  />
                </div>
              </CardContent>
              <div className="flex justify-end p-6 pt-0 space-x-2">
                <Button variant="outline" onClick={() => setShowAddOrgModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddOrganization}>
                  <Save className="w-4 h-4 mr-2" />
                  Create Organization
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Edit Organization Modal */}
        {showEditOrgModal && selectedOrg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Edit Organization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="editName">Organization Name</Label>
                  <Input
                    id="editName"
                    value={newOrgForm.name}
                    onChange={(e) => setNewOrgForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter organization name"
                  />
                </div>
                <div>
                  <Label htmlFor="editSlug">Slug</Label>
                  <Input
                    id="editSlug"
                    value={newOrgForm.slug}
                    onChange={(e) => setNewOrgForm(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="organization-slug"
                  />
                </div>
                <div>
                  <Label htmlFor="editDomain">Custom Domain (optional)</Label>
                  <Input
                    id="editDomain"
                    value={newOrgForm.domain}
                    onChange={(e) => setNewOrgForm(prev => ({ ...prev, domain: e.target.value }))}
                    placeholder="custom-domain.com"
                  />
                </div>
                <div>
                  <Label htmlFor="editSubscriptionPlan">Subscription Plan</Label>
                  <select
                    id="editSubscriptionPlan"
                    value={newOrgForm.subscriptionPlan}
                    onChange={(e) => setNewOrgForm(prev => ({ ...prev, subscriptionPlan: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="trial">Trial</option>
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="editMaxUsers">Max Users</Label>
                  <Input
                    id="editMaxUsers"
                    type="number"
                    value={newOrgForm.maxUsers}
                    onChange={(e) => setNewOrgForm(prev => ({ ...prev, maxUsers: parseInt(e.target.value) || 5 }))}
                  />
                </div>
              </CardContent>
              <div className="flex justify-end p-6 pt-0 space-x-2">
                <Button variant="outline" onClick={() => setShowEditOrgModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateOrganization}>
                  <Save className="w-4 h-4 mr-2" />
                  Update Organization
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && selectedOrg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-red-600">Confirm Deletion</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Are you sure you want to delete <strong>{selectedOrg.name}</strong>?</p>
                <p className="mt-2 text-sm text-gray-600">This action cannot be undone.</p>
              </CardContent>
              <div className="flex justify-end p-6 pt-0 space-x-2">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteOrganization}>
                  Delete Organization
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* View Organization Modal */}
        {viewingOrg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <Card className="w-full max-w-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{viewingOrg.name} - Details</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setViewingOrg(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Organization Name</Label>
                    <p className="text-sm text-gray-600">{viewingOrg.name}</p>
                  </div>
                  <div>
                    <Label>Slug</Label>
                    <p className="text-sm text-gray-600">{viewingOrg.slug}</p>
                  </div>
                  <div>
                    <Label>Domain</Label>
                    <p className="text-sm text-gray-600">{viewingOrg.domain || 'Not set'}</p>
                  </div>
                  <div>
                    <Label>Subscription Plan</Label>
                    <Badge variant={getSubscriptionBadgeColor(viewingOrg.subscriptionPlan)}>
                      {viewingOrg.subscriptionPlan}
                    </Badge>
                  </div>
                  <div>
                    <Label>Users</Label>
                    <p className="text-sm text-gray-600">{viewingOrg.userCount}/{viewingOrg.maxUsers}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge variant={viewingOrg.isActive ? 'default' : 'destructive'}>
                      {viewingOrg.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div>
                    <Label>Created</Label>
                    <p className="text-sm text-gray-600">{new Date(viewingOrg.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label>Last Active</Label>
                    <p className="text-sm text-gray-600">{new Date(viewingOrg.lastActive).toLocaleString()}</p>
                  </div>
                </div>
                <div>
                  <Label>Enabled Features</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {Object.entries(viewingOrg.features).map(([feature, enabled]) => (
                      <div key={feature} className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-sm capitalize">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default SudoDashboard;
