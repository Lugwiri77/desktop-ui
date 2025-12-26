'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heading } from '@/app/components/heading';
import { Button } from '@/app/components/button';
import { Input } from '@/app/components/input';
import { Field, Label } from '@/app/components/fieldset';
import { Text } from '@/app/components/text';
import { Badge } from '@/app/components/badge';
import type { UserInfo } from '@/lib/roles';

type OfferingType = 'tithe' | 'offering' | 'building_fund' | 'missions' | 'thanksgiving' | 'special';

export default function OfferingPage() {
  const router = useRouter();
  const [offeringType, setOfferingType] = useState<OfferingType>('tithe');
  const [amount, setAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [qrData, setQrData] = useState('');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [generating, setGenerating] = useState(false);

  const quickAmounts = [100, 500, 1000, 2000, 5000, 10000];

  const offeringTypes = [
    { id: 'tithe', label: 'Tithe', icon: '🙏', description: '10% of income' },
    { id: 'offering', label: 'Offering', icon: '❤️', description: 'General offering' },
    { id: 'building_fund', label: 'Building Fund', icon: '🏗️', description: 'Church building project' },
    { id: 'missions', label: 'Missions', icon: '🌍', description: 'Missionary work' },
    { id: 'thanksgiving', label: 'Thanksgiving', icon: '🎉', description: 'Thank you offering' },
    { id: 'special', label: 'Special Offering', icon: '⭐', description: 'Special events' },
  ];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUserInfo = localStorage.getItem('userInfo');
      if (storedUserInfo) {
        setUserInfo(JSON.parse(storedUserInfo));
      }
    }
  }, []);

  const generateOfferingQR = async () => {
    if (!userInfo?.organizationId) {
      alert('Organization information not found');
      return;
    }

    setGenerating(true);

    try {
      // Create QR code data with payment information
      const qrPayload = {
        type: 'church_offering',
        organizationId: userInfo.organizationId,
        organizationName: userInfo.organizationName,
        offeringType,
        amount: amount || undefined, // Optional - can be filled by donor
        timestamp: Date.now(),
        // This QR can be scanned by mobile apps to initiate payment
      };

      const qrString = JSON.stringify(qrPayload);
      setQrData(qrString);

      // In a real implementation, you might want to:
      // 1. Generate a short link/code that maps to this QR data
      // 2. Store the QR session in the backend
      // 3. Use a QR code generation library for better visuals

    } catch (error) {
      console.error('Failed to generate QR code:', error);
      alert('Failed to generate QR code');
    } finally {
      setGenerating(false);
    }
  };

  const downloadQR = () => {
    // TODO: Implement QR code download as PNG/SVG
    alert('QR code download feature coming soon!');
  };

  const printQR = () => {
    // TODO: Implement print functionality
    window.print();
  };

  const getOfferingTypeDetails = () => {
    return offeringTypes.find(t => t.id === offeringType);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Button
          color="white"
          className="mb-4"
          onClick={() => router.push('/wallet')}
        >
          ← Back to Wallet
        </Button>
        <Heading>Church Offering & Tithe</Heading>
        <Text className="mt-2">
          Generate QR codes for members to give offerings via mobile money
        </Text>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Configuration */}
        <div className="space-y-6">
          {/* Offering Type Selection */}
          <div>
            <Label className="mb-3 block">Select Offering Type</Label>
            <div className="grid grid-cols-2 gap-3">
              {offeringTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setOfferingType(type.id as OfferingType)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    offeringType === type.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{type.icon}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{type.label}</div>
                      <div className="text-xs text-gray-600 mt-1">{type.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Amount Selection */}
          <div>
            <Label className="mb-3 block">Suggested Amount (Optional)</Label>
            <Text className="text-xs text-gray-600 mb-3">
              Leave empty for donors to enter their own amount
            </Text>
            <div className="grid grid-cols-3 gap-3">
              {quickAmounts.map((amt) => (
                <Button
                  key={amt}
                  type="button"
                  color={amount === amt ? 'dark' : 'white'}
                  onClick={() => {
                    setAmount(amt);
                    setCustomAmount('');
                  }}
                >
                  KES {amt.toLocaleString()}
                </Button>
              ))}
            </div>

            <div className="mt-3">
              <Field>
                <Label>Or enter custom amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="1"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setAmount(parseFloat(e.target.value) || null);
                  }}
                  placeholder="Enter amount (optional)"
                />
              </Field>
            </div>

            <Button
              type="button"
              color="white"
              className="mt-3 w-full"
              onClick={() => {
                setAmount(null);
                setCustomAmount('');
              }}
            >
              No Suggested Amount (Let donor decide)
            </Button>
          </div>

          {/* Summary */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <Heading level={3} className="mb-3">QR Code Summary</Heading>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <Badge color="blue">{getOfferingTypeDetails()?.label}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-semibold">
                  {amount ? `KES ${amount.toLocaleString()}` : 'Donor chooses'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Organization:</span>
                <span className="font-semibold text-xs">
                  {userInfo?.organizationName || 'Not set'}
                </span>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={generateOfferingQR}
            disabled={generating}
            className="w-full"
          >
            {generating ? 'Generating...' : 'Generate QR Code'}
          </Button>
        </div>

        {/* Right: QR Code Display */}
        <div className="flex flex-col items-center justify-center">
          {!qrData ? (
            <div className="text-center p-12 border-2 border-dashed border-gray-300 rounded-lg w-full">
              <div className="text-6xl mb-4">📱</div>
              <Heading level={3}>No QR Code Yet</Heading>
              <Text className="mt-2 text-gray-600">
                Configure the offering type and amount, then click "Generate QR Code"
              </Text>
            </div>
          ) : (
            <div className="w-full">
              {/* QR Code Display */}
              <div className="p-8 bg-white rounded-lg shadow-lg border-2 border-gray-200">
                <div className="text-center mb-4">
                  <Heading level={2}>{getOfferingTypeDetails()?.icon} {getOfferingTypeDetails()?.label}</Heading>
                  <Text className="text-sm text-gray-600 mt-1">
                    {userInfo?.organizationName}
                  </Text>
                </div>

                {/* QR Code Placeholder - In production, use a QR library like qrcode.react */}
                <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center min-h-[300px]">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📱</div>
                    <Text className="text-sm text-gray-600">
                      QR Code would display here
                    </Text>
                    <Text className="text-xs text-gray-500 mt-2 font-mono break-all max-w-xs">
                      {qrData.substring(0, 50)}...
                    </Text>
                    <Text className="text-xs text-gray-400 mt-4">
                      Install: npm install qrcode.react
                    </Text>
                  </div>
                </div>

                {amount && (
                  <div className="mt-4 text-center">
                    <Text className="text-2xl font-bold">
                      KES {amount.toLocaleString()}
                    </Text>
                  </div>
                )}

                <div className="mt-4 text-center text-xs text-gray-500">
                  Scan with mobile app to give
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <Button color="white" onClick={downloadQR}>
                  📥 Download
                </Button>
                <Button color="white" onClick={printQR}>
                  🖨️ Print
                </Button>
              </div>

              {/* Instructions */}
              <div className="mt-6 rounded-lg bg-blue-50 p-4 border border-blue-200">
                <Heading level={4} className="text-blue-900 mb-2">
                  How to use:
                </Heading>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Display this QR code on screen or print it</li>
                  <li>Members scan with mobile app (Spreang/Kastaem)</li>
                  <li>They confirm amount and complete payment</li>
                  <li>Funds go directly to your wallet</li>
                  <li>Anonymous giving option available in app</li>
                </ol>
              </div>

              <Button
                color="white"
                className="w-full mt-4"
                onClick={() => setQrData('')}
              >
                Generate New QR Code
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
