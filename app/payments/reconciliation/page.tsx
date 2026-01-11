'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  uploadStatement,
  autoMatchStatements,
  StatementUploadResult,
  ReconciliationMatchResult,
} from '@/lib/payments-api';

export default function ReconciliationPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [matching, setMatching] = useState(false);
  const [uploadResult, setUploadResult] = useState<StatementUploadResult | null>(null);
  const [matchResult, setMatchResult] = useState<ReconciliationMatchResult | null>(null);
  const [minConfidence, setMinConfidence] = useState(70);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        setUploadError('Please select a CSV file');
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
      setUploadResult(null);
      setMatchResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadError(null);
    setUploadResult(null);
    setMatchResult(null);

    try {
      const csvContent = await selectedFile.text();
      const result = await uploadStatement(selectedFile.name, csvContent);
      setUploadResult(result);

      if (result.success) {
        // Automatically trigger matching after successful upload
        await handleAutoMatch(result.statementReference);
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to upload statement');
    } finally {
      setUploading(false);
    }
  };

  const handleAutoMatch = async (statementRef?: string) => {
    const reference = statementRef || uploadResult?.statementReference;
    if (!reference) return;

    setMatching(true);
    setMatchError(null);
    setMatchResult(null);

    try {
      const result = await autoMatchStatements(reference, minConfidence);
      setMatchResult(result);
    } catch (error) {
      setMatchError(error instanceof Error ? error.message : 'Failed to match statements');
    } finally {
      setMatching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-blue-600 dark:text-blue-400 hover:underline mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Wallet
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bank Reconciliation</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Upload bank or M-Pesa statements and automatically match with your transactions
          </p>
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">How it works:</h3>
          <ol className="list-decimal list-inside space-y-1 text-blue-800 dark:text-blue-200 text-sm">
            <li>Upload your bank or M-Pesa statement CSV file</li>
            <li>The system will parse and import the transactions</li>
            <li>Automatic matching will find corresponding transactions based on amount, date, and reference</li>
          </ol>
        </div>

        {/* Upload Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Step 1: Upload Statement
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select CSV File
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                disabled={uploading}
                className="block w-full text-sm text-gray-900 dark:text-gray-100
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-md file:border-0
                         file:text-sm file:font-semibold
                         file:bg-blue-50 file:text-blue-700
                         dark:file:bg-blue-900 dark:file:text-blue-200
                         hover:file:bg-blue-100 dark:hover:file:bg-blue-800
                         cursor-pointer border border-gray-300 dark:border-gray-600 rounded-lg
                         disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {selectedFile && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
              </div>
            )}

            {uploadError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-red-800 dark:text-red-200 text-sm">{uploadError}</p>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                       flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Uploading...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload Statement
                </>
              )}
            </button>
          </div>

          {/* Upload Results */}
          {uploadResult && (
            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Upload Results</h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Rows</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{uploadResult.totalRows}</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                  <div className="text-sm text-green-600 dark:text-green-400">Imported</div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">{uploadResult.importedRows}</div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                  <div className="text-sm text-yellow-600 dark:text-yellow-400">Skipped</div>
                  <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{uploadResult.skippedRows}</div>
                </div>
                <div className={`rounded-lg p-3 ${uploadResult.success ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                  <div className={`text-sm ${uploadResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    Status
                  </div>
                  <div className={`text-lg font-bold ${uploadResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                    {uploadResult.success ? 'Success' : 'Failed'}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Statement Reference</div>
                <div className="font-mono text-sm text-gray-900 dark:text-white">{uploadResult.statementReference}</div>
              </div>

              {uploadResult.errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">Errors:</h4>
                  <ul className="list-disc list-inside space-y-1 text-red-800 dark:text-red-200 text-sm">
                    {uploadResult.errors.slice(0, 10).map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                    {uploadResult.errors.length > 10 && (
                      <li className="text-red-600 dark:text-red-400">
                        ... and {uploadResult.errors.length - 10} more errors
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Matching Section */}
        {uploadResult?.success && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Step 2: Automatic Matching
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Minimum Confidence: {minConfidence}%
                </label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="5"
                  value={minConfidence}
                  onChange={(e) => setMinConfidence(Number(e.target.value))}
                  disabled={matching}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer
                           disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>50% (More matches)</span>
                  <span>100% (Exact matches)</span>
                </div>
              </div>

              {matchError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-red-800 dark:text-red-200 text-sm">{matchError}</p>
                </div>
              )}

              <button
                onClick={() => handleAutoMatch()}
                disabled={matching}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                         flex items-center gap-2"
              >
                {matching ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Matching...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Run Auto-Match
                  </>
                )}
              </button>
            </div>

            {/* Match Results */}
            {matchResult && (
              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Match Results</h3>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <div className="text-sm text-blue-600 dark:text-blue-400">Total Matches</div>
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{matchResult.totalMatches}</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                    <div className="text-sm text-green-600 dark:text-green-400">Reconciled</div>
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">{matchResult.reconciledCount}</div>
                  </div>
                  <div className={`rounded-lg p-3 ${matchResult.success ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                    <div className={`text-sm ${matchResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      Status
                    </div>
                    <div className={`text-lg font-bold ${matchResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                      {matchResult.success ? 'Success' : 'Failed'}
                    </div>
                  </div>
                </div>

                {matchResult.success && matchResult.reconciledCount > 0 && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h4 className="font-semibold text-green-900 dark:text-green-100">
                          Successfully matched {matchResult.reconciledCount} transaction{matchResult.reconciledCount !== 1 ? 's' : ''}!
                        </h4>
                        <p className="text-green-800 dark:text-green-200 text-sm mt-1">
                          Your bank statements have been reconciled with your payment transactions.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {matchResult.errors.length > 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mt-4">
                    <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">Warnings:</h4>
                    <ul className="list-disc list-inside space-y-1 text-yellow-800 dark:text-yellow-200 text-sm">
                      {matchResult.errors.slice(0, 10).map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                      {matchResult.errors.length > 10 && (
                        <li className="text-yellow-600 dark:text-yellow-400">
                          ... and {matchResult.errors.length - 10} more warnings
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {!matchResult.success && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h4 className="font-semibold text-red-900 dark:text-red-100">No matches found</h4>
                        <p className="text-red-800 dark:text-red-200 text-sm mt-1">
                          Try lowering the minimum confidence level or check if the transactions exist in your system.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-6 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">About Reconciliation</h3>
          <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
            <p>
              The automatic matching algorithm uses multiple criteria to find corresponding transactions:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><strong>Amount Matching (40 points):</strong> Exact or near-exact amount matches</li>
              <li><strong>Date Matching (30 points):</strong> Transactions within 3 days of each other</li>
              <li><strong>Reference Matching (20 points):</strong> External reference numbers or M-Pesa receipts</li>
              <li><strong>Receipt Matching (10 points):</strong> M-Pesa receipt number matching</li>
            </ul>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Minimum confidence of 70% is recommended for accurate matching. Lower values may result in incorrect matches.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
