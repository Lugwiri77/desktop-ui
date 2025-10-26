'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '../components/auth-layout';
import { Button } from '../components/button';
import { Field, Label } from '../components/fieldset';
import { Heading } from '../components/heading';
import { Input } from '../components/input';
import { Strong, Text, TextLink } from '../components/text';
import { Logo } from '../components/logo';
import { post } from '@/lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      const response = await post('/auth/staff/request-password-reset', { email });

      if (response.status === 'success') {
        setSuccess(response.message || 'Password reset instructions sent to your email');
        setEmail('');
      } else {
        setError(response.message || 'Failed to send password reset email');
      }
    } catch (err: any) {
      console.error('Password reset request error:', err);
      setError(err.message || 'Failed to send password reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="grid w-full max-w-sm grid-cols-1 gap-8">
        <Logo className="h-6 text-zinc-950 dark:text-white forced-colors:text-[CanvasText]" />

        <div>
          <Heading>Reset your password</Heading>
          <Text className="mt-2">
            Enter your email and we'll send you a link to reset your password.
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
          <Label>Email</Label>
          <Input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </Field>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Sending...' : 'Reset password'}
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
