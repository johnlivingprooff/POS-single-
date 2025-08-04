import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/authStore';
import { useAppToast } from '../../../hooks/useAppToast';
import { Settings, Bell, Volume2, VolumeX, Clock, Eye } from 'lucide-react';

interface NotificationSettings {
  id?: string;
  soundEnabled: boolean;
  browserNotifications: boolean;
  emailNotifications: boolean;
  lowStockAlerts: boolean;
  salesNotifications: boolean;
  systemUpdates: boolean;
  pollingInterval: number;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

const NotificationSettingsPage: React.FC = () => {
  const { token, user } = useAuthStore();
  const { showToast } = useAppToast();
  const queryClient = useQueryClient();
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['notification-settings'],
    queryFn: async () => {
      const res = await fetch('/api/notifications/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch notification settings');
      return res.json();
    },
    enabled: !!token,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<NotificationSettings>) => {
      const res = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newSettings)
      });
      if (!res.ok) throw new Error('Failed to update settings');
      return res.json();
    },
    onSuccess: () => {
      showToast('Notification settings updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
    },
    onError: () => {
      showToast('Failed to update notification settings', 'error');
    }
  });

  const requestBrowserPermission = async () => {
    setIsRequestingPermission(true);
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          showToast('Browser notifications enabled', 'success');
          updateSettingsMutation.mutate({ browserNotifications: true });
        } else {
          showToast('Browser notification permission denied', 'error');
        }
      } else {
        showToast('Browser notifications not supported', 'error');
      }
    } catch (error) {
      showToast('Failed to request notification permission', 'error');
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const testNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Habicore POS', {
        body: 'This is a test notification from your POS system.',
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
    } else {
      showToast('Test notification sent to system', 'info');
    }
  };

  const handleSettingChange = (key: keyof NotificationSettings, value: any) => {
    updateSettingsMutation.mutate({ [key]: value });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading notification settings...</div>
      </div>
    );
  }

  const currentSettings: NotificationSettings = settings || {
    soundEnabled: true,
    browserNotifications: false,
    emailNotifications: true,
    lowStockAlerts: true,
    salesNotifications: true,
    systemUpdates: true,
    pollingInterval: 30000,
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center space-x-3">
            <Settings className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notification Settings</h1>
              <p className="text-gray-600">Customize how and when you receive notifications</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Sound Settings */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              {currentSettings.soundEnabled ? (
                <Volume2 className="h-5 w-5 text-green-600" />
              ) : (
                <VolumeX className="h-5 w-5 text-red-600" />
              )}
              <span>Sound Notifications</span>
            </h2>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Enable Sound Alerts</h3>
                <p className="text-sm text-gray-600">Play a sound when new notifications arrive</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentSettings.soundEnabled}
                  onChange={(e) => handleSettingChange('soundEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Browser Notifications */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Bell className="h-5 w-5 text-blue-600" />
              <span>Browser Notifications</span>
            </h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Desktop Notifications</h3>
                  <p className="text-sm text-gray-600">Show notifications even when the browser is minimized</p>
                </div>
                <div className="flex items-center space-x-2">
                  {!currentSettings.browserNotifications && (
                    <button
                      onClick={requestBrowserPermission}
                      disabled={isRequestingPermission}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isRequestingPermission ? 'Requesting...' : 'Enable'}
                    </button>
                  )}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentSettings.browserNotifications}
                      onChange={(e) => handleSettingChange('browserNotifications', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {currentSettings.browserNotifications && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <button
                    onClick={testNotification}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Test Notification</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Notification Types */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Notification Types</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'lowStockAlerts', label: 'Low Stock Alerts', description: 'Get notified when inventory is running low' },
                { key: 'salesNotifications', label: 'Sales Updates', description: 'Notifications about sales transactions and daily summaries' },
                { key: 'systemUpdates', label: 'System Updates', description: 'Important system maintenance and feature announcements' },
                { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive notifications via email' },
              ].map(({ key, label, description }) => (
                <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{label}</h3>
                    <p className="text-sm text-gray-600">{description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentSettings[key as keyof NotificationSettings] as boolean}
                      onChange={(e) => handleSettingChange(key as keyof NotificationSettings, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Timing Settings */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Clock className="h-5 w-5 text-purple-600" />
              <span>Timing & Frequency</span>
            </h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Check for new notifications every:
                </label>
                <select
                  value={currentSettings.pollingInterval}
                  onChange={(e) => handleSettingChange('pollingInterval', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={15000}>15 seconds</option>
                  <option value={30000}>30 seconds</option>
                  <option value={60000}>1 minute</option>
                  <option value={300000}>5 minutes</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Quiet Hours Start:
                  </label>
                  <input
                    type="time"
                    value={currentSettings.quietHoursStart || ''}
                    onChange={(e) => handleSettingChange('quietHoursStart', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Quiet Hours End:
                  </label>
                  <input
                    type="time"
                    value={currentSettings.quietHoursEnd || ''}
                    onChange={(e) => handleSettingChange('quietHoursEnd', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              {currentSettings.quietHoursStart && currentSettings.quietHoursEnd && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Quiet Hours:</strong> No sound or browser notifications will be shown between{' '}
                    {currentSettings.quietHoursStart} and {currentSettings.quietHoursEnd}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettingsPage;
