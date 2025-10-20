'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApplicationLayout } from '../components/application-layout';
import { Heading } from '../components/heading';
import { Text } from '../components/text';
import { Button } from '../components/button';
import { Field, Label, Description } from '../components/fieldset';
import { Input } from '../components/input';
import { Select } from '../components/select';
import { Radio, RadioField, RadioGroup } from '../components/radio';
import { isAuthenticated, get, put, post } from '@/lib/api';
import {
  loadUserInfo,
  isAdministrator,
  getUserRoleDisplayName,
  UserInfo,
} from '@/lib/roles';

type DatabaseStrategy = 'kastaem_only' | 'own_db_only' | 'dual_db';

interface DatabaseConfig {
  database_strategy: DatabaseStrategy;
  own_database_type?: string;
  own_database_host?: string;
  own_database_port?: number;
  own_database_name?: string;
  own_database_username?: string;
  database_connection_status?: string;
  last_database_connection_test?: string;
  database_connection_error?: string;
}

interface DatabaseConfigResponse {
  status: string;
  message: string;
  data: DatabaseConfig;
}

export default function SettingsPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [databaseStrategy, setDatabaseStrategy] = useState<DatabaseStrategy>('kastaem_only');
  const [databaseType, setDatabaseType] = useState('postgresql');
  const [databaseHost, setDatabaseHost] = useState('');
  const [databasePort, setDatabasePort] = useState('5432');
  const [databaseName, setDatabaseName] = useState('');
  const [databaseUsername, setDatabaseUsername] = useState('');
  const [databasePassword, setDatabasePassword] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<string>('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    const info = loadUserInfo();
    if (!info) {
      router.push('/login');
      return;
    }

    // Only administrators can access settings
    // Personal accounts cannot configure database settings
    if (!isAdministrator(info.userRole) || info.accountType === 'personal') {
      router.push('/dashboard');
      return;
    }

    setUserInfo(info);
    fetchDatabaseConfig();
  }, [router]);

  const fetchDatabaseConfig = async () => {
    try {
      setLoading(true);
      const response = await get<DatabaseConfigResponse>('/auth/settings/database-config');
      const config = response.data;

      setDatabaseStrategy(config.database_strategy);
      setDatabaseType(config.own_database_type || 'postgresql');
      setDatabaseHost(config.own_database_host || '');
      setDatabasePort(String(config.own_database_port || 5432));
      setDatabaseName(config.own_database_name || '');
      setDatabaseUsername(config.own_database_username || '');
      setConnectionStatus(config.database_connection_status || 'not_configured');
    } catch (err: any) {
      console.error('Error fetching database config:', err);
      setError('Failed to load database configuration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setError('');
    setSuccess('');
    setTesting(true);

    try {
      await post('/auth/settings/test-database-connection', {
        database_strategy: databaseStrategy,
        own_database_type: databaseType,
        own_database_host: databaseHost,
        own_database_port: parseInt(databasePort),
        own_database_name: databaseName,
        own_database_username: databaseUsername,
        own_database_password: databasePassword || undefined,
      });

      setSuccess('Database connection test successful!');
      setConnectionStatus('connected');
    } catch (err: any) {
      setError(err.message || 'Database connection test failed. Please check your credentials.');
      setConnectionStatus('failed');
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      await put('/auth/settings/database-config', {
        database_strategy: databaseStrategy,
        own_database_type: databaseType,
        own_database_host: databaseHost,
        own_database_port: parseInt(databasePort),
        own_database_name: databaseName,
        own_database_username: databaseUsername,
        own_database_password: databasePassword || undefined,
      });

      setSuccess('Database configuration updated successfully!');
      setDatabasePassword(''); // Clear password field after saving
    } catch (err: any) {
      setError(err.message || 'Failed to update database configuration. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    localStorage.clear();
    router.push('/login');
  };

  if (!userInfo || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const isAdmin = isAdministrator(userInfo.userRole);
  const roleDisplayName = getUserRoleDisplayName(userInfo.userRole);

  const layoutUserInfo = {
    username: userInfo.username,
    email: userInfo.email,
    profilePicUrl: userInfo.profilePicUrl,
    logoUrl: userInfo.logoUrl,
    organizationName: userInfo.organizationName,
    accountType: userInfo.accountType,
    organizationType: userInfo.organizationType,
    isAdministrator: isAdmin,
  };

  const showDatabaseFields = databaseStrategy !== 'kastaem_only';

  return (
    <ApplicationLayout
      userInfo={layoutUserInfo}
      onLogout={handleLogout}
      roleDisplayName={roleDisplayName}
      isAdmin={isAdmin}
    >
      <div className="max-w-4xl space-y-6">
        <div>
          <Heading>Settings</Heading>
          <Text className="mt-2">Configure your organization settings and preferences</Text>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
            <strong>Error:</strong> {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
            <strong>Success:</strong> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Database Configuration Section */}
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
            <h3 className="text-base font-semibold text-zinc-950 dark:text-white mb-4">
              Database Configuration
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              Choose how and where your organization's data is stored. Only administrators of business and institution accounts can configure this.
            </p>

            <div className="space-y-6">
              <Field>
                <Label>Database Storage Strategy</Label>
                <Description>
                  Select where you want to store your organization's data
                </Description>
                <RadioGroup value={databaseStrategy} onChange={setDatabaseStrategy} className="mt-3">
                  <RadioField>
                    <Radio value="kastaem_only" />
                    <Label>Kastaem Database Only (Default)</Label>
                    <Description>
                      All your data is securely stored in Kastaem's cloud database. Recommended for most users.
                    </Description>
                  </RadioField>

                  <RadioField>
                    <Radio value="own_db_only" />
                    <Label>Your Own Database Only</Label>
                    <Description>
                      All your data is stored exclusively in your own database. You have full control over your data.
                    </Description>
                  </RadioField>

                  <RadioField>
                    <Radio value="dual_db" />
                    <Label>Dual Database (Your DB + Kastaem Backup)</Label>
                    <Description>
                      Data is stored in your database with automatic backup to Kastaem's cloud. Best of both worlds.
                    </Description>
                  </RadioField>
                </RadioGroup>
              </Field>

              {showDatabaseFields && (
                <>
                  <div className="border-t border-zinc-200 dark:border-zinc-700 pt-6">
                    <h4 className="text-sm font-semibold text-zinc-950 dark:text-white mb-4">
                      Your Database Connection Details
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field>
                        <Label>Database Type</Label>
                        <Select
                          value={databaseType}
                          onChange={(e) => setDatabaseType(e.target.value)}
                          required
                        >
                          <option value="postgresql">PostgreSQL</option>
                          <option value="mysql">MySQL</option>
                          <option value="mongodb">MongoDB</option>
                          <option value="mariadb">MariaDB</option>
                        </Select>
                      </Field>

                      <Field>
                        <Label>Database Host</Label>
                        <Input
                          type="text"
                          value={databaseHost}
                          onChange={(e) => setDatabaseHost(e.target.value)}
                          placeholder="localhost or db.example.com"
                          required={showDatabaseFields}
                        />
                      </Field>

                      <Field>
                        <Label>Database Port</Label>
                        <Input
                          type="number"
                          value={databasePort}
                          onChange={(e) => setDatabasePort(e.target.value)}
                          placeholder="5432"
                          required={showDatabaseFields}
                        />
                      </Field>

                      <Field>
                        <Label>Database Name</Label>
                        <Input
                          type="text"
                          value={databaseName}
                          onChange={(e) => setDatabaseName(e.target.value)}
                          placeholder="my_organization_db"
                          required={showDatabaseFields}
                        />
                      </Field>

                      <Field>
                        <Label>Database Username</Label>
                        <Input
                          type="text"
                          value={databaseUsername}
                          onChange={(e) => setDatabaseUsername(e.target.value)}
                          placeholder="db_user"
                          required={showDatabaseFields}
                        />
                      </Field>

                      <Field>
                        <Label>Database Password</Label>
                        <Input
                          type="password"
                          value={databasePassword}
                          onChange={(e) => setDatabasePassword(e.target.value)}
                          placeholder="Leave empty to keep current password"
                        />
                        <Description>
                          Password is encrypted before storage. Leave empty if not changing.
                        </Description>
                      </Field>
                    </div>

                    {connectionStatus && (
                      <div className="mt-4">
                        <p className="text-sm">
                          <span className="font-medium">Connection Status: </span>
                          <span
                            className={
                              connectionStatus === 'connected'
                                ? 'text-green-600 dark:text-green-400'
                                : connectionStatus === 'failed'
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-zinc-500 dark:text-zinc-400'
                            }
                          >
                            {connectionStatus === 'connected' && '✓ Connected'}
                            {connectionStatus === 'failed' && '✗ Failed'}
                            {connectionStatus === 'not_configured' && 'Not Configured'}
                          </span>
                        </p>
                      </div>
                    )}

                    <div className="mt-4">
                      <Button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={testing || !databaseHost || !databaseName}
                        className="bg-zinc-600 hover:bg-zinc-700"
                      >
                        {testing ? 'Testing Connection...' : 'Test Connection'}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Configuration'}
            </Button>
            <Button
              type="button"
              onClick={() => fetchDatabaseConfig()}
              className="bg-zinc-500 hover:bg-zinc-600"
            >
              Reset to Current
            </Button>
          </div>
        </form>

        {/* Additional Settings Sections - Placeholders */}
        <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
          <h3 className="text-base font-semibold text-zinc-950 dark:text-white mb-2">
            Additional Settings
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            More settings options coming soon (notifications, security, integrations, etc.)
          </p>
        </div>
      </div>
    </ApplicationLayout>
  );
}
