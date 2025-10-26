'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthLayout } from '../components/auth-layout';
import { Button } from '../components/button';
import { Field, Label } from '../components/fieldset';
import { Heading } from '../components/heading';
import { Input } from '../components/input';
import { Text, TextLink, Strong } from '../components/text';
import { Logo } from '../components/logo';
import { post } from '@/lib/api';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError('Invalid or missing reset token');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError('Please enter and confirm your new password');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await post('/auth/staff/reset-password', {
        token,
        new_password: newPassword,
      });

      if (response.status === 'success') {
        setSuccess('Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(response.message || 'Failed to reset password');
      }
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="grid w-full max-w-sm grid-cols-1 gap-8">
        <Logo className="h-6 text-zinc-950 dark:text-white forced-colors:text-[CanvasText]" />

        <div>
          <Heading>Set new password</Heading>
          <Text className="mt-2">
            Enter your new password below. Make sure it's at least 8 characters long.
          </Text>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
            {success}
          </div>
        )}

        <Field>
          <Label>New Password</Label>
          <Input
            type="password"
            name="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Minimum 8 characters"
            required
          />
        </Field>

        <Field>
          <Label>Confirm Password</Label>
          <Input
            type="password"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            required
          />
        </Field>

        <Button type="submit" className="w-full" disabled={loading || success !== ''}>
          {loading ? 'Resetting...' : 'Reset password'}
        </Button>

        <Text>
          Remember your password?{' '}
          <TextLink href="/login">
            <Strong>Sign in</Strong>
          </TextLink>
        </Text>
      </form>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <AuthLayout>
        <div className="grid w-full max-w-sm grid-cols-1 gap-8">
          <Logo className="h-6 text-zinc-950 dark:text-white forced-colors:text-[CanvasText]" />
          <Text>Loading...</Text>
        </div>
      </AuthLayout>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
