'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/app/components/button';
import { Input } from '@/app/components/input';
import { Textarea } from '@/app/components/textarea';
import { Badge } from '@/app/components/badge';
import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from '@/app/components/dialog';
import { QrCodeIcon, ArrowRightStartOnRectangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { scanVisitorEntry, scanVisitorExit, verifyVisitorOtp, getActiveVisitors, VisitorLog } from '@/lib/visitor-management';
import { GranularPermissions } from '@/lib/graphql';

interface SecurityGateProps {
  permissions: GranularPermissions | null;
}

export default function SecurityGate({ permissions }: SecurityGateProps) {
  const queryClient = useQueryClient();
  const [scanMode, setScanMode] = useState<'entry' | 'exit'>('entry');
  const [qrData, setQrData] = useState('');
  const [entryNotes, setEntryNotes] = useState('');
  const [exitNotes, setExitNotes] = useState('');
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorLog | null>(null);
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  // Get active visitors for exit scanning
  const { data: activeVisitors = [] } = useQuery({
    queryKey: ['activeVisitors'],
    queryFn: () => getActiveVisitors(),
    enabled: scanMode === 'exit',
    refetchInterval: 30000,
  });

  // Entry scan mutation
  const entryMutation = useMutation({
    mutationFn: scanVisitorEntry,
    onSuccess: (visitor) => {
      queryClient.invalidateQueries({ queryKey: ['activeVisitors'] });
      queryClient.invalidateQueries({ queryKey: ['visitorStats'] });
      setSelectedVisitor(visitor);
      setShowOtpDialog(true);
      setQrData('');
      setEntryNotes('');
    },
  });

  // Exit scan mutation
  const exitMutation = useMutation({
    mutationFn: ({ visitorLogId, exitNotes }: { visitorLogId: string; exitNotes?: string }) =>
      scanVisitorExit(visitorLogId, exitNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeVisitors'] });
      queryClient.invalidateQueries({ queryKey: ['visitorStats'] });
      setSelectedVisitor(null);
      setExitNotes('');
    },
  });

  // OTP verification mutation
  const otpMutation = useMutation({
    mutationFn: ({ visitorLogId, otpCode }: { visitorLogId: string; otpCode: string }) =>
      verifyVisitorOtp(visitorLogId, otpCode),
    onSuccess: (verified) => {
      if (verified) {
        setShowOtpDialog(false);
        setOtpCode('');
        setSelectedVisitor(null);
      } else {
        alert('Invalid OTP code. Please try again.');
      }
    },
  });

  const handleEntryScan = () => {
    if (!qrData.trim()) {
      alert('Please scan or enter QR code data');
      return;
    }

    entryMutation.mutate({
      qrData: qrData.trim(),
      entryNotes: entryNotes.trim() || undefined,
    });
  };

  const handleExitScan = (visitor: VisitorLog) => {
    if (window.confirm(`Check out ${visitor.visitorFullName}?`)) {
      exitMutation.mutate({
        visitorLogId: visitor.id,
        exitNotes: exitNotes.trim() || undefined,
      });
    }
  };

  const handleVerifyOtp = () => {
    if (!selectedVisitor || !otpCode.trim()) {
      alert('Please enter OTP code');
      return;
    }

    otpMutation.mutate({
      visitorLogId: selectedVisitor.id,
      otpCode: otpCode.trim(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex gap-4">
        {permissions?.can_scan_visitor_entry && (
          <Button
            color={scanMode === 'entry' ? 'indigo' : 'white'}
            onClick={() => setScanMode('entry')}
          >
            <QrCodeIcon />
            Entry Scan
          </Button>
        )}
        {permissions?.can_scan_visitor_exit && (
          <Button
            color={scanMode === 'exit' ? 'red' : 'white'}
            onClick={() => setScanMode('exit')}
          >
            <ArrowRightStartOnRectangleIcon />
            Exit Scan
          </Button>
        )}
      </div>

      {/* Entry Scan Interface */}
      {scanMode === 'entry' && permissions?.can_scan_visitor_entry && (
        <div className="rounded-lg border border-zinc-950/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-900">
          <h3 className="text-lg font-semibold text-zinc-950 dark:text-white">
            Scan Visitor Entry
          </h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Scan the visitor's QR code or enter the data manually
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-950 dark:text-white">
                QR Code Data
              </label>
              <Textarea
                value={qrData}
                onChange={(e) => setQrData(e.target.value)}
                rows={4}
                placeholder="Scan QR code or paste encrypted data here..."
                className="mt-1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-950 dark:text-white">
                Entry Notes (Optional)
              </label>
              <Textarea
                value={entryNotes}
                onChange={(e) => setEntryNotes(e.target.value)}
                rows={2}
                placeholder="Any special notes about the entry..."
                className="mt-1"
              />
            </div>

            <Button
              color="indigo"
              onClick={handleEntryScan}
              disabled={entryMutation.isPending || !qrData.trim()}
            >
              {entryMutation.isPending ? 'Processing...' : 'Check In Visitor'}
            </Button>

            {entryMutation.isError && (
              <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                <p className="text-sm text-red-800 dark:text-red-200">
                  Error: {entryMutation.error.message}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Exit Scan Interface */}
      {scanMode === 'exit' && permissions?.can_scan_visitor_exit && (
        <div className="rounded-lg border border-zinc-950/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-900">
          <h3 className="text-lg font-semibold text-zinc-950 dark:text-white">
            Scan Visitor Exit
          </h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Select a visitor to check out
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-950 dark:text-white">
                Exit Notes (Optional)
              </label>
              <Textarea
                value={exitNotes}
                onChange={(e) => setExitNotes(e.target.value)}
                rows={2}
                placeholder="Any special notes about the exit..."
                className="mt-1"
              />
            </div>

            {activeVisitors.length === 0 ? (
              <div className="rounded-md bg-zinc-50 p-8 text-center dark:bg-zinc-800">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  No active visitors to check out
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeVisitors.map((visitor) => (
                  <div
                    key={visitor.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-zinc-950 dark:text-white">
                        {visitor.visitorFullName}
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {visitor.visitorPhoneNumber}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge color={
                          visitor.status === 'completed' ? 'green' :
                          visitor.status === 'in_service' ? 'blue' :
                          visitor.status === 'routed' ? 'amber' :
                          'zinc'
                        }>
                          {visitor.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          Entry: {new Date(visitor.entryTime).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <Button
                      color="red"
                      onClick={() => handleExitScan(visitor)}
                      disabled={exitMutation.isPending}
                    >
                      Check Out
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {exitMutation.isError && (
              <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                <p className="text-sm text-red-800 dark:text-red-200">
                  Error: {exitMutation.error.message}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* OTP Verification Dialog */}
      <Dialog open={showOtpDialog} onClose={() => setShowOtpDialog(false)}>
        <DialogTitle>Verify Visitor OTP</DialogTitle>
        <DialogDescription>
          An OTP has been sent to {selectedVisitor?.visitorPhoneNumber}.
          Please ask the visitor to provide the code.
        </DialogDescription>
        <DialogBody>
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium text-zinc-950 dark:text-white">
                Visitor: {selectedVisitor?.visitorFullName}
              </p>
              <Input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                autoFocus
              />
            </div>
          </div>
        </DialogBody>
        <DialogActions>
          <Button plain onClick={() => setShowOtpDialog(false)}>
            Skip
          </Button>
          <Button
            color="indigo"
            onClick={handleVerifyOtp}
            disabled={otpMutation.isPending || otpCode.length !== 6}
          >
            <CheckCircleIcon />
            {otpMutation.isPending ? 'Verifying...' : 'Verify OTP'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
