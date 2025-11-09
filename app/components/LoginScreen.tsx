'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { invoke } from '@tauri-apps/api/core';
import { AuthLayout } from '../components/auth-layout';
import { Button } from '../components/button';
import { Checkbox, CheckboxField } from '../components/checkbox';
import { Field, Label } from '../components/fieldset';
import { Heading } from '../components/heading';
import { Input } from '../components/input';
import { Strong, Text, TextLink } from '../components/text';
import { Logo } from './logo';

interface UserRole {
  [key: string]: any;
}

interface AuthResponse {
  success: boolean;
  token?: string;
  refresh_token?: string;
  message: string;
  username?: string;
  email?: string;
  profile_pic_url?: string;
  logo_url?: string;
  organization_name?: string;
  user_role?: UserRole;
  organization_type?: string;
  tax_identification_number?: string;
  staff_role?: string;
  department?: string;
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Call Tauri command to authenticate with your Rust backend
      const response = await invoke<AuthResponse>('authenticate_user', {
        email,
        password,
      });

      console.log('Login successful:', response);

      if (response.success && response.token) {
        // Check if user_role exists and validate account type
        if (!response.user_role) {
          setError('Invalid response from server. Please try again.');
          return;
        }

        // Extract user role type from the UserRole enum
        const userRoleStr = typeof response.user_role === 'string'
          ? response.user_role
          : JSON.stringify(response.user_role);

        // Check if user is Personal account - reject if so
        if (userRoleStr.toLowerCase().includes('personal')) {
          setError('This application is only accessible to Business and Institution accounts. Personal accounts are not allowed.');
          return;
        }

        // Validate that user is Business, Institution, or External Security staff
        const isValidAccount =
          userRoleStr.toLowerCase().includes('business') ||
          userRoleStr.toLowerCase().includes('institution') ||
          userRoleStr.toLowerCase().includes('externalsecurity') ||
          userRoleStr === 'ExternalSecurityStaff';

        if (!isValidAccount) {
          setError('This application is only accessible to Business and Institution accounts.');
          return;
        }

        // Store the authentication tokens and user data
        localStorage.setItem('auth_token', response.token);

        if (response.refresh_token) {
          localStorage.setItem('refresh_token', response.refresh_token);
        }

        if (response.username) {
          localStorage.setItem('username', response.username);
        }

        if (response.email) {
          localStorage.setItem('user_email', response.email);
        } else {
          localStorage.setItem('user_email', email);
        }

        if (response.profile_pic_url) {
          localStorage.setItem('profile_pic_url', response.profile_pic_url);
        }

        if (response.logo_url) {
          localStorage.setItem('logo_url', response.logo_url);
        }

        console.log('Organization name from response:', response.organization_name);
        if (response.organization_name) {
          localStorage.setItem('organization_name', response.organization_name);
          console.log('Stored organization_name in localStorage');
        } else {
          console.log('No organization_name in response');
        }

        // Store user role and organization data
        localStorage.setItem('user_role', JSON.stringify(response.user_role));

        if (response.organization_type) {
          localStorage.setItem('organization_type', response.organization_type);
        }

        if (response.tax_identification_number) {
          localStorage.setItem('tax_identification_number', response.tax_identification_number);
        }

        // Store staff role and department for staff members
        if (response.staff_role) {
          localStorage.setItem('staff_role', response.staff_role);
          console.log('Stored staff_role in localStorage:', response.staff_role);
        }

        if (response.department) {
          localStorage.setItem('department', response.department);
          console.log('Stored department in localStorage:', response.department);
        }

        // Navigate based on user role
        // External security staff should go to gate scanning UI
        if (userRoleStr.toLowerCase().includes('externalsecurity') || userRoleStr === 'ExternalSecurityStaff') {
          console.log('Redirecting external security staff to gate scanner');

          // Store security staff info for the gate scanner layout
          // Extract first and last names from username
          const nameParts = (response.username || '').split(' ');
          const firstName = nameParts[0] || response.username || 'Security';
          const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Staff';

          const securityStaffInfo = {
            id: '', // Will be populated from backend if needed
            firstName,
            lastName,
            badgeNumber: response.email?.split('@')[0] || 'N/A',
            securityRole: response.staff_role || 'security_guard',
            assignedGate: undefined, // Can be populated if gate assignment is returned
            profilePicUrl: response.profile_pic_url,
          };

          localStorage.setItem('security_staff_info', JSON.stringify(securityStaffInfo));

          router.push('/security-gate');
        } else {
          // All other users go to dashboard
          router.push('/dashboard');
        }
      } else {
        setError(response.message || 'Login failed. Please try again.');
      }

    } catch (err) {
      setError(err as string || 'Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleLogin} className="grid w-full max-w-sm grid-cols-1 gap-8">
        <Logo className="h-6 text-zinc-950 dark:text-white forced-colors:text-[CanvasText]" />

        <div className="space-y-2">
          <Heading>Sign in to your account</Heading>
          <Text>
            Access your Business or Institution dashboard
          </Text>
        </div>

        <Field>
          <Label>Email</Label>
          <Input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            autoComplete="email"
          />
        </Field>

        <Field>
          <Label>Password</Label>
          <Input
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
            autoComplete="current-password"
          />
        </Field>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
            <Strong>Error:</Strong> {error}
          </div>
        )}

        <div className="flex items-center justify-between">
          <CheckboxField>
            <Checkbox
              name="remember"
              checked={rememberMe}
              onChange={(checked) => setRememberMe(checked)}
            />
            <Label>Remember me</Label>
          </CheckboxField>
          <Text>
            <TextLink href="/forgot-password">
              <Strong>Forgot password?</Strong>
            </TextLink>
          </Text>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>

        {/*<Text className="text-center">*/}
        {/*  <span className="text-zinc-500 dark:text-zinc-400">*/}
        {/*    Personal accounts are not supported on this platform*/}
        {/*  </span>*/}
        {/*</Text>*/}
      </form>
    </AuthLayout>
  );
}
