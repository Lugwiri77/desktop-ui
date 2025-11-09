'use client';

import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Camera, X, Check, AlertCircle, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { scanVisitorEntry, scanVisitorExit } from '@/lib/security-gate';

interface QRScannerProps {
  onScanSuccess?: () => void;
}

export default function QRScanner({ onScanSuccess }: QRScannerProps) {
  const [scanMode, setScanMode] = useState<'entry' | 'exit'>('entry');
  const [qrData, setQrData] = useState('');
  const [lastScanResult, setLastScanResult] = useState<{
    success: boolean;
    message: string;
    visitorName?: string;
    time?: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input for barcode scanners
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Entry scan mutation
  const entryMutation = useMutation({
    mutationFn: scanVisitorEntry,
    onSuccess: (data) => {
      setLastScanResult({
        success: true,
        message: 'Entry recorded successfully',
        visitorName: data.visitorFullName,
        time: new Date().toLocaleTimeString(),
      });
      setQrData('');
      onScanSuccess?.();

      // Auto-clear result after 3 seconds
      setTimeout(() => setLastScanResult(null), 3000);
    },
    onError: (error: any) => {
      setLastScanResult({
        success: false,
        message: error.message || 'Scan failed',
        time: new Date().toLocaleTimeString(),
      });
      setQrData('');

      // Auto-clear error after 5 seconds
      setTimeout(() => setLastScanResult(null), 5000);
    },
  });

  // Exit scan mutation
  const exitMutation = useMutation({
    mutationFn: scanVisitorExit,
    onSuccess: (data) => {
      setLastScanResult({
        success: true,
        message: 'Exit recorded successfully',
        visitorName: data.visitorFullName,
        time: new Date().toLocaleTimeString(),
      });
      setQrData('');
      onScanSuccess?.();

      setTimeout(() => setLastScanResult(null), 3000);
    },
    onError: (error: any) => {
      setLastScanResult({
        success: false,
        message: error.message || 'Scan failed',
        time: new Date().toLocaleTimeString(),
      });
      setQrData('');

      setTimeout(() => setLastScanResult(null), 5000);
    },
  });

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrData.trim()) return;

    if (scanMode === 'entry') {
      entryMutation.mutate({ qrData });
    } else {
      // For exit, we need to find the visitor by QR code first
      // In a real implementation, you'd extract visitor_log_id from QR data
      exitMutation.mutate({ visitorLogId: qrData });
    }
  };

  const isPending = entryMutation.isPending || exitMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setScanMode('entry')}
          className={`flex-1 rounded-lg border px-6 py-4 text-sm font-medium transition-all ${
            scanMode === 'entry'
              ? 'border-green-500/50 bg-green-500/10 text-green-400'
              : 'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <ArrowDownToLine className="h-5 w-5" />
            <span>Entry Scan</span>
          </div>
        </button>
        <button
          onClick={() => setScanMode('exit')}
          className={`flex-1 rounded-lg border px-6 py-4 text-sm font-medium transition-all ${
            scanMode === 'exit'
              ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
              : 'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <ArrowUpFromLine className="h-5 w-5" />
            <span>Exit Scan</span>
          </div>
        </button>
      </div>

      {/* Scan Result Notification */}
      {lastScanResult && (
        <div
          className={`rounded-lg border p-4 ${
            lastScanResult.success
              ? 'border-green-500/50 bg-green-500/10'
              : 'border-red-500/50 bg-red-500/10'
          }`}
        >
          <div className="flex items-start gap-3">
            {lastScanResult.success ? (
              <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p
                className={`font-medium ${
                  lastScanResult.success ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {lastScanResult.message}
              </p>
              {lastScanResult.visitorName && (
                <p className="mt-1 text-sm text-zinc-300">
                  Visitor: {lastScanResult.visitorName}
                </p>
              )}
              {lastScanResult.time && (
                <p className="mt-1 text-xs text-zinc-400">
                  Time: {lastScanResult.time}
                </p>
              )}
            </div>
            <button
              onClick={() => setLastScanResult(null)}
              className="text-zinc-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Scanner Interface */}
      <form onSubmit={handleScan} className="space-y-4">
        <div className="rounded-xl border-2 border-dashed border-white/20 bg-white/5 p-12">
          <div className="text-center space-y-6">
            <div className="mx-auto w-32 h-32 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
              <Camera className="h-16 w-16 text-blue-400" />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white">
                {scanMode === 'entry' ? 'Scan Visitor Entry' : 'Scan Visitor Exit'}
              </h3>
              <p className="mt-1 text-sm text-zinc-400">
                Place QR code in front of scanner or type manually
              </p>
            </div>

            {/* Manual Input (hidden but functional for barcode scanners) */}
            <input
              ref={inputRef}
              type="text"
              value={qrData}
              onChange={(e) => setQrData(e.target.value)}
              onBlur={() => inputRef.current?.focus()}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="QR Code data or barcode..."
              autoFocus
              disabled={isPending}
            />

            {isPending && (
              <div className="flex items-center justify-center gap-2 text-blue-400">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                <span className="text-sm">Processing...</span>
              </div>
            )}
          </div>
        </div>

        {/* Manual Scan Button */}
        <button
          type="submit"
          disabled={!qrData || isPending}
          className={`w-full rounded-lg px-6 py-4 font-medium transition-all ${
            scanMode === 'entry'
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isPending
            ? 'Processing...'
            : `Record ${scanMode === 'entry' ? 'Entry' : 'Exit'}`}
        </button>
      </form>

      {/* Instructions */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <h4 className="text-sm font-medium text-white mb-2">Instructions:</h4>
        <ul className="text-sm text-zinc-400 space-y-1">
          <li>• Use a barcode scanner for fastest entry</li>
          <li>• Ensure QR code is clear and well-lit</li>
          <li>• Verify visitor details before confirming</li>
          <li>• Report any scanning issues immediately</li>
        </ul>
      </div>
    </div>
  );
}
