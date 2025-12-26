'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heading } from '@/app/components/heading';
import { Button } from '@/app/components/button';
import { Input } from '@/app/components/input';
import { Select } from '@/app/components/select';
import { Field, Label } from '@/app/components/fieldset';
import { Text } from '@/app/components/text';
import { topUpWallet } from '@/lib/graphql/payments/mutations';
import type { UserInfo } from '@/lib/roles';

enum PaymentMethod {
  MPESA = 'MPESA',
  CARD = 'CARD',
  BANK_ACCOUNT = 'BANK_ACCOUNT',
}

export default function TopUpPage() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.MPESA);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUserInfo = localStorage.getItem('userInfo');
      if (storedUserInfo) {
        setUserInfo(JSON.parse(storedUserInfo));
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!userInfo?.organizationId) {
      setError('Organization ID not found');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (paymentMethod === PaymentMethod.MPESA && !phoneNumber) {
      setError('Phone number is required for M-Pesa');
      return;
    }

    // Validate phone number format for M-Pesa
    if (paymentMethod === PaymentMethod.MPESA) {
      const phoneRegex = /^254[0-9]{9}$/;
      if (!phoneRegex.test(phoneNumber)) {
        setError('Phone number must be in format: 254XXXXXXXXX');
        return;
      }
    }

    try {
      setLoading(true);

      const result = await topUpWallet({
        organizationId: userInfo.organizationId,
        amountKes: parseFloat(amount),
        paymentMethod,
        phoneNumber: paymentMethod === PaymentMethod.MPESA ? phoneNumber : undefined,
        reference: `TOPUP_${Date.now()}`,
      });

      if (result.success) {
        setSuccess(true);
        setMessage(result.message || 'Top-up initiated successfully');

        // Redirect after 3 seconds
        setTimeout(() => {
          router.push('/wallet');
        }, 3000);
      } else {
        setError(result.message || 'Top-up failed');
      }
    } catch (err) {
      console.error('Top-up error:', err);
      setError('An error occurred during top-up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodInstructions = () => {
    switch (paymentMethod) {
      case PaymentMethod.MPESA:
        return 'Enter your M-Pesa phone number to receive an STK push prompt on your phone.';
      case PaymentMethod.CARD:
        return 'You will be redirected to Flutterwave to complete your card payment securely.';
      case PaymentMethod.BANK_ACCOUNT:
        return 'You will be redirected to IntaSend to complete your bank transfer.';
      default:
        return '';
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">✅</div>
          <Heading>Top-Up Initiated!</Heading>
          <Text className="mt-4">{message}</Text>

          {paymentMethod === PaymentMethod.MPESA && (
            <div className="mt-6 rounded-lg bg-blue-50 p-4">
              <Text className="text-sm text-blue-800">
                📱 Check your phone (****{phoneNumber.slice(-4)}) for the M-Pesa prompt.
                Enter your PIN to complete the payment.
              </Text>
            </div>
          )}

          <Text className="mt-6 text-sm text-gray-500">
            Redirecting to wallet...
          </Text>

          <div className="mt-4">
            <Button onClick={() => router.push('/wallet')}>
              Go to Wallet Now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Button
          color="white"
          className="mb-4"
          onClick={() => router.push('/wallet')}
        >
          ← Back to Wallet
        </Button>
        <Heading>Top Up Wallet</Heading>
        <Text className="mt-2">
          Add funds to your organization's wallet
        </Text>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4 border border-red-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400">⚠️</span>
              </div>
              <div className="ml-3">
                <Text className="text-sm text-red-800">{error}</Text>
              </div>
            </div>
          </div>
        )}

        <Field>
          <Label>Amount (KES)</Label>
          <Input
            type="number"
            step="0.01"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount in Kenyan Shillings"
            required
            disabled={loading}
          />
          <Text className="mt-1 text-xs text-gray-500">
            Minimum: KES 1.00
          </Text>
        </Field>

        <Field>
          <Label>Payment Method</Label>
          <Select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            disabled={loading}
          >
            <option value={PaymentMethod.MPESA}>M-Pesa (Mobile Money)</option>
            <option value={PaymentMethod.CARD}>Card (Visa/Mastercard via Flutterwave)</option>
            <option value={PaymentMethod.BANK_ACCOUNT}>Bank Transfer (via IntaSend)</option>
          </Select>
          <div className="mt-2 rounded-md bg-blue-50 p-3">
            <Text className="text-sm text-blue-800">
              ℹ️ {getPaymentMethodInstructions()}
            </Text>
          </div>
        </Field>

        {paymentMethod === PaymentMethod.MPESA && (
          <Field>
            <Label>M-Pesa Phone Number</Label>
            <Input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="254XXXXXXXXX"
              pattern="254[0-9]{9}"
              required
              disabled={loading}
            />
            <Text className="mt-1 text-xs text-gray-500">
              Format: 254XXXXXXXXX (Kenya country code + 9 digits)
            </Text>
          </Field>
        )}

        {/* Summary */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <Heading level={3} className="mb-3">Transaction Summary</Heading>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-semibold">
                KES {amount ? parseFloat(amount).toFixed(2) : '0.00'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method:</span>
              <span className="font-semibold">
                {paymentMethod === PaymentMethod.MPESA && 'M-Pesa'}
                {paymentMethod === PaymentMethod.CARD && 'Card'}
                {paymentMethod === PaymentMethod.BANK_ACCOUNT && 'Bank Transfer'}
              </span>
            </div>
            {paymentMethod === PaymentMethod.MPESA && phoneNumber && (
              <div className="flex justify-between">
                <span className="text-gray-600">Phone Number:</span>
                <span className="font-semibold">{phoneNumber}</span>
              </div>
            )}
            <div className="border-t border-gray-300 pt-2 mt-2 flex justify-between">
              <span className="text-gray-900 font-semibold">Total:</span>
              <span className="text-lg font-bold text-gray-900">
                KES {amount ? parseFloat(amount).toFixed(2) : '0.00'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                Processing...
              </span>
            ) : (
              'Complete Top-Up'
            )}
          </Button>
          <Button
            type="button"
            color="white"
            onClick={() => router.push('/wallet')}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
