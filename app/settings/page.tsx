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
  is_using_default_strategy: boolean;
}

interface QueryMetrics {
  strategy: string;
  total_queries: number;
  total_duration_ms: number;
  avg_duration_ms: number;
  min_duration_ms: number;
  max_duration_ms: number;
  error_count: number;
  last_updated: string;
}

interface StorageStats {
  organization_id: string;
  total_size_bytes: number;
  total_files: number;
  last_checked: string;
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
  const [isUsingDefault, setIsUsingDefault] = useState(true);
  const [metrics, setMetrics] = useState<Record<string, QueryMetrics>>({});
  const [migrating, setMigrating] = useState(false);
  const [originalStrategy, setOriginalStrategy] = useState<DatabaseStrategy>('kastaem_only');
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [cleaningUp, setCleaningUp] = useState(false);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [migrationSource, setMigrationSource] = useState<DatabaseStrategy>('kastaem_only');

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
    fetchMetrics();
  }, [router]);

  // Fetch storage stats when configuration changes
  useEffect(() => {
    if (!isUsingDefault) {
      fetchStorageStats();
    }
  }, [isUsingDefault, databaseStrategy]);

  const fetchDatabaseConfig = async () => {
    try {
      setLoading(true);
      const response = await get<DatabaseConfigResponse>('/auth/organization/database-settings');
      const config = response.data;

      setDatabaseStrategy(config.database_strategy);
      setOriginalStrategy(config.database_strategy);
      setDatabaseType(config.own_database_type || 'postgresql');
      setDatabaseHost(config.own_database_host || '');
      setDatabasePort(String(config.own_database_port || 5432));
      setDatabaseName(config.own_database_name || '');
      setDatabaseUsername(config.own_database_username || '');
      setConnectionStatus(config.database_connection_status || 'not_configured');
      setIsUsingDefault(config.is_using_default_strategy);
    } catch (err: any) {
      console.error('Error fetching database config:', err);
      setError('Failed to load database configuration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await get<{ status: string; data: Record<string, QueryMetrics> }>('/auth/organization/query-metrics');
      setMetrics(response.data || {});
    } catch (err: any) {
      console.error('Error fetching metrics:', err);
      // Don't show error for metrics, it's not critical
    }
  };

  const fetchStorageStats = async () => {
    // Only fetch storage stats if not using default configuration
    if (isUsingDefault) return;

    try {
      const response = await get<{ status: string; data: StorageStats }>('/auth/organization/storage-stats');
      setStorageStats(response.data);
    } catch (err: any) {
      console.error('Error fetching storage stats:', err);
      // Don't show error for storage stats, it's not critical
    }
  };

  const handleTestConnection = async () => {
    setError('');
    setSuccess('');
    setTesting(true);

    try {
      await post('/auth/organization/test-database-connection', {
        database_type: databaseType,
        host: databaseHost,
        port: parseInt(databasePort),
        database: databaseName,
        username: databaseUsername,
        password: databasePassword || undefined,
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

  const handleMigrate = async () => {
    console.log('handleMigrate called', { needsMigration, migrationSource, databaseStrategy });

    // Don't check needsMigration here - it might be stale due to React closure
    // The button visibility already handles this
    // Just check if we have valid source and target strategies

    const confirmMsg = `Are you sure you want to migrate data from ${migrationSource} to ${databaseStrategy}? This may take some time.`;
    console.log('Showing confirmation:', confirmMsg);

    if (!window.confirm(confirmMsg)) {
      console.log('User cancelled migration');
      return;
    }

    console.log('Starting migration...');
    setMigrating(true);
    setError('');
    setSuccess('');

    try {
      console.log('Calling migration API with:', { source_strategy: migrationSource, target_strategy: databaseStrategy });
      const response = await post<{ status: string; message: string; details: any }>('/auth/organization/migrate-data', {
        source_strategy: migrationSource,
        target_strategy: databaseStrategy,
      });

      console.log('Migration response:', response);
      const details = response.details;
      const successMsg = `Migration completed! Tables: ${details.tables_migrated.join(', ')}, Rows: ${details.total_rows_copied}, Duration: ${details.duration_seconds.toFixed(2)}s`;
      console.log(successMsg);
      setSuccess(successMsg);

      // Clear migration flag after successful migration
      setNeedsMigration(false);
      fetchDatabaseConfig();
    } catch (err: any) {
      console.error('Migration error:', err);
      setError(err.message || 'Migration failed. Please try again.');
    } finally {
      setMigrating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      await put('/auth/organization/database-settings', {
        database_strategy: databaseStrategy,
        own_database_type: databaseType,
        own_database_host: databaseHost,
        own_database_port: parseInt(databasePort),
        own_database_name: databaseName,
        own_database_username: databaseUsername,
        own_database_password: databasePassword || undefined,
      });

      // Mark that migration is needed if strategy changed
      console.log('Checking if migration needed:', { originalStrategy, databaseStrategy, changed: originalStrategy !== databaseStrategy });

      if (originalStrategy !== databaseStrategy) {
        console.log('Setting needsMigration to TRUE');
        setNeedsMigration(true);
        setMigrationSource(originalStrategy);
        const successMsg = 'Database configuration updated successfully! Click "Migrate Data" below to transfer your existing data.';
        console.log(successMsg);
        setSuccess(successMsg);
        setOriginalStrategy(databaseStrategy); // Update original to current
        console.log('Updated originalStrategy to:', databaseStrategy);
        // Don't fetch config again as it would reset our migration state
        fetchMetrics();
      } else {
        console.log('No migration needed, strategies are the same');
        setSuccess('Database configuration updated successfully!');
        setOriginalStrategy(databaseStrategy); // Update original to current
        fetchDatabaseConfig();
        fetchMetrics();
      }

      setDatabasePassword(''); // Clear password field after saving
    } catch (err: any) {
      setError(err.message || 'Failed to update database configuration. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCleanupTempFiles = async () => {
    setCleaningUp(true);
    setError('');
    setSuccess('');

    try {
      const response = await post<{ status: string; message: string; files_deleted: number }>(
        '/auth/organization/cleanup-temp-files',
        { older_than_hours: 24 }
      );

      setSuccess(`${response.message} - ${response.files_deleted} files removed.`);
      // Refresh storage stats after cleanup
      fetchStorageStats();
    } catch (err: any) {
      setError(err.message || 'Failed to cleanup temporary files.');
    } finally {
      setCleaningUp(false);
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
    staffRole: userInfo.staffRole,
    department: userInfo.department,
  };

  const showDatabaseFields = databaseStrategy !== 'kastaem_only';
  const strategyChanged = databaseStrategy !== originalStrategy;

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

        {/* Default Configuration Badge */}
        {isUsingDefault && (
          <div className="rounded-lg bg-blue-50 p-4 border-2 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  ✓ Using Default Configuration
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  You are currently using the default Kastaem database. All your data is securely stored in our cloud infrastructure with automatic backups and high availability. You can configure your own database below if needed.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Query Performance Metrics */}
        {Object.keys(metrics).length > 0 && (
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
            <h3 className="text-base font-semibold text-zinc-950 dark:text-white mb-4">
              Query Performance Metrics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(metrics).map(([strategy, metric]) => (
                <div key={strategy} className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
                  <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                    {strategy.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                    {metric.total_queries.toLocaleString()}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
                    <div>Avg: {metric.avg_duration_ms.toFixed(2)}ms</div>
                    <div>Min/Max: {metric.min_duration_ms}ms / {metric.max_duration_ms}ms</div>
                    <div>Errors: {metric.error_count}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Storage Statistics */}
        {!isUsingDefault && storageStats && (
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-zinc-950 dark:text-white">
                Storage Statistics
              </h3>
              <Button
                type="button"
                onClick={handleCleanupTempFiles}
                disabled={cleaningUp}
                className="text-sm bg-zinc-600 hover:bg-zinc-700"
              >
                {cleaningUp ? 'Cleaning...' : 'Cleanup Temp Files (24h+)'}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 p-4 border border-blue-200 dark:border-blue-800">
                <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Total Files
                </div>
                <div className="text-3xl font-bold text-blue-950 dark:text-blue-50">
                  {storageStats.total_files.toLocaleString()}
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Across all directories
                </div>
              </div>

              <div className="rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 p-4 border border-green-200 dark:border-green-800">
                <div className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                  Total Size
                </div>
                <div className="text-3xl font-bold text-green-950 dark:text-green-50">
                  {(storageStats.total_size_bytes / (1024 * 1024 * 1024)).toFixed(2)} GB
                </div>
                <div className="text-xs text-green-700 dark:text-green-300 mt-1">
                  {(storageStats.total_size_bytes / (1024 * 1024)).toFixed(0)} MB
                </div>
              </div>

              <div className="rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 p-4 border border-purple-200 dark:border-purple-800">
                <div className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">
                  Last Checked
                </div>
                <div className="text-lg font-semibold text-purple-950 dark:text-purple-50">
                  {new Date(storageStats.last_checked).toLocaleString()}
                </div>
                <div className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                  Organization: {storageStats.organization_id.substring(0, 8)}...
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                <strong>Note:</strong> Storage statistics include profile pictures, documents (PDF, DOCX, Excel), videos, QR codes, chat media, and all other uploaded files in your organization-specific storage.
              </div>
            </div>
          </div>
        )}

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

          {/* Migration Warning */}
          {strategyChanged && (
            <div className="rounded-lg bg-amber-50 p-4 border-2 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="h-6 w-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">
                    Database Strategy Changed
                  </h4>
                  <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
                    You have changed the database strategy from <strong>{originalStrategy}</strong> to <strong>{databaseStrategy}</strong>.
                    You need to save the configuration first, then migrate your existing data.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Debug Info */}
          <div className="rounded-lg bg-yellow-50 p-4 border-2 border-yellow-200">
            <h4 className="text-sm font-semibold mb-2">Debug Info:</h4>
            <p className="text-xs">needsMigration: {String(needsMigration)}</p>
            <p className="text-xs">migrationSource: {migrationSource}</p>
            <p className="text-xs">databaseStrategy: {databaseStrategy}</p>
            <p className="text-xs">originalStrategy: {originalStrategy}</p>
          </div>

          {/* Migration Required Notice */}
          {needsMigration && (
            <div className="rounded-lg bg-blue-50 p-4 border-2 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    Migration Required
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                    Your configuration has been saved. You need to migrate your data from <strong>{migrationSource}</strong> to <strong>{databaseStrategy}</strong>.
                    Click the "Migrate Data" button below to start the migration process.
                  </p>
                </div>
              </div>
            </div>
          )}

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

        {/* Migration button OUTSIDE the form */}
        {needsMigration && (
          <div className="mt-4">
            <button
              onClick={async () => {
                console.log('=== MIGRATE BUTTON CLICKED ===');
                console.log('needsMigration:', needsMigration);
                console.log('migrationSource:', migrationSource);
                console.log('databaseStrategy:', databaseStrategy);

                setMigrating(true);
                setError('');
                setSuccess('');

                try {
                  console.log('Calling migration API...');
                  const response = await post<{ status: string; message: string; details: any }>('/auth/organization/migrate-data', {
                    source_strategy: migrationSource,
                    target_strategy: databaseStrategy,
                  });

                  console.log('✅ Migration API response:', response);
                  const details = response.details;
                  const successMsg = `Migration completed! Tables: ${details.tables_migrated.join(', ')}, Rows: ${details.total_rows_copied}, Duration: ${details.duration_seconds.toFixed(2)}s`;
                  console.log(successMsg);
                  setSuccess(successMsg);
                  setNeedsMigration(false);
                  fetchDatabaseConfig();
                } catch (err: any) {
                  console.error('❌ Migration error:', err);
                  setError(err.message || 'Migration failed');
                } finally {
                  setMigrating(false);
                  console.log('Migration process completed');
                }
              }}
              disabled={migrating}
              style={{ cursor: 'pointer', pointerEvents: 'auto' }}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 py-1.5 px-3 text-sm font-semibold text-white shadow-inner hover:bg-blue-700 disabled:opacity-50"
            >
              {migrating ? 'Migrating Data...' : 'Migrate Data'}
            </button>
          </div>
        )}

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
