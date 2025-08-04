import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import { 
  Store, 
  Package, 
  Users, 
  TrendingUp, 
  Settings,
  LogOut,
  Building2
} from 'lucide-react';

const OrganizationDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, organization, logout } = useAuthStore();

  useEffect(() => {
    // Redirect if no organization context
    if (!organization || !user) {
      navigate('/org/login');
      return;
    }
  }, [organization, user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/org/login');
  };

  const handleFeatureAccess = (feature: string, path: string) => {
    if (!organization?.features[feature]) {
      alert(`${feature.toUpperCase()} feature is not available in your current plan.`);
      return;
    }
    navigate(path);
  };

  if (!organization || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const features = [
    {
      key: 'pos',
      title: 'Point of Sale',
      description: 'Process sales transactions and manage checkout',
      icon: Store,
      path: '/pos',
      color: 'bg-blue-500'
    },
    {
      key: 'inventory',
      title: 'Inventory Management',
      description: 'Track stock levels, manage products and suppliers',
      icon: Package,
      path: '/inventory',
      color: 'bg-green-500'
    },
    {
      key: 'manufacturing',
      title: 'Manufacturing',
      description: 'Manage production orders and bill of materials',
      icon: Settings,
      path: '/manufacturing',
      color: 'bg-purple-500'
    },
    {
      key: 'crm',
      title: 'Customer Management',
      description: 'Manage customer relationships and sales history',
      icon: Users,
      path: '/customers',
      color: 'bg-orange-500'
    },
    {
      key: 'reports',
      title: 'Reports & Analytics',
      description: 'View sales reports and business analytics',
      icon: TrendingUp,
      path: '/reports',
      color: 'bg-red-500'
    },
    {
      key: 'users',
      title: 'User Management',
      description: 'Manage team members and permissions',
      icon: Users,
      path: '/users',
      color: 'bg-indigo-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Building2 className="w-8 h-8 mr-3 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{organization.name}</h1>
                <p className="text-sm text-gray-500">
                  {organization.subscriptionPlan.charAt(0).toUpperCase() + organization.subscriptionPlan.slice(1)} Plan
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="mb-2 text-3xl font-bold text-gray-900">
              Welcome back, {user.name}!
            </h2>
            <p className="text-gray-600">
              Access your business management tools below. Your current plan includes the following features:
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const isEnabled = organization.features[feature.key] === true;
              const Icon = feature.icon;
              
              return (
                <div key={feature.key} className={`bg-white rounded-lg shadow ${!isEnabled ? 'opacity-50' : 'hover:shadow-lg transition-shadow cursor-pointer'}`}>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-2 rounded-lg ${feature.color} text-white w-fit`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      {!isEnabled && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Disabled
                        </span>
                      )}
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-gray-900">{feature.title}</h3>
                    <p className="mb-4 text-gray-600">{feature.description}</p>
                    <button
                      className={`w-full py-2 px-4 rounded-md text-sm font-medium ${
                        isEnabled 
                          ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500' 
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                      disabled={!isEnabled}
                      onClick={() => handleFeatureAccess(feature.key, feature.path)}
                    >
                      {isEnabled ? 'Access' : 'Upgrade Required'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Organization Info */}
          <div className="mt-8 bg-white rounded-lg shadow">
            <div className="p-6">
              <h3 className="flex items-center mb-4 text-lg font-semibold text-gray-900">
                <Building2 className="w-5 h-5 mr-2" />
                Organization Details
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Organization Name</p>
                  <p className="text-lg font-semibold">{organization.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Organization Slug</p>
                  <p className="text-lg font-semibold">{organization.slug}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Subscription Plan</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                    {organization.subscriptionPlan.charAt(0).toUpperCase() + organization.subscriptionPlan.slice(1)}
                  </span>
                </div>
              </div>
              
              {organization.domain && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-500">Custom Domain</p>
                  <p className="text-lg font-semibold">{organization.domain}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrganizationDashboardPage;
