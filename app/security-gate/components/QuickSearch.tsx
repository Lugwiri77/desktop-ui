'use client';

import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Search,
  X,
  Loader2,
  UserCheck,
  UserX,
  Clock,
  MapPin,
  AlertCircle,
  LogOut,
} from 'lucide-react';
import { searchVisitor, scanVisitorExit } from '@/lib/security-gate';

interface QuickSearchProps {
  onClose?: () => void;
}

interface SearchResult {
  id: string;
  visitorFullName: string;
  visitorPhoneNumber: string;
  status: 'inside' | 'outside';
  entryTime?: string;
  destinationDepartment?: {
    name: string;
  };
}

export default function QuickSearch({ onClose }: QuickSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVisitor, setSelectedVisitor] = useState<SearchResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus search input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Manual checkout mutation
  const checkoutMutation = useMutation({
    mutationFn: (visitorLogId: string) => scanVisitorExit({ visitorLogId }),
    onSuccess: () => {
      // Refresh search results
      handleSearch();
      setSelectedVisitor(null);
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to check out visitor');
    },
  });

  // Mask phone number for privacy
  const maskPhone = (phone: string): string => {
    if (!phone || phone.length < 4) return '****';
    return `****${phone.slice(-4)}`;
  };

  // Format relative time
  const formatRelativeTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);

    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString();
  };

  const handleSearch = async () => {
    if (!query.trim() || query.length < 3) {
      setError('Please enter at least 3 characters');
      return;
    }

    setIsSearching(true);
    setError(null);
    setResults([]);

    try {
      const searchResults = await searchVisitor(query);
      setResults(searchResults);

      if (searchResults.length === 0) {
        setError('No visitors found matching your search');
      }
    } catch (err: any) {
      setError(err.message || 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleManualCheckout = (visitor: SearchResult) => {
    setSelectedVisitor(visitor);
  };

  const confirmCheckout = () => {
    if (selectedVisitor) {
      checkoutMutation.mutate(selectedVisitor.id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <Search className="h-4 w-4 text-zinc-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Search by name or phone (last 4 digits)..."
          className="w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-24 py-3 text-sm text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          disabled={isSearching}
          aria-label="Search for visitor"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setResults([]);
                setError(null);
                inputRef.current?.focus();
              }}
              className="p-1.5 rounded hover:bg-white/10 transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4 text-zinc-400" />
            </button>
          )}
          <button
            onClick={handleSearch}
            disabled={isSearching || !query.trim()}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Search'
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          <p className="text-xs text-zinc-400 mb-2">
            Found {results.length} visitor{results.length !== 1 ? 's' : ''}
          </p>
          {results.map((visitor) => (
            <div
              key={visitor.id}
              className="rounded-lg border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Visitor Name & Phone */}
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-white">
                      {visitor.visitorFullName}
                    </h4>
                    <span className="text-xs text-zinc-500">•</span>
                    <span className="text-sm text-zinc-400">
                      {maskPhone(visitor.visitorPhoneNumber)}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${
                        visitor.status === 'inside'
                          ? 'bg-green-500/10 text-green-400 border border-green-500/50'
                          : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/50'
                      }`}
                    >
                      {visitor.status === 'inside' ? (
                        <UserCheck className="h-3 w-3" />
                      ) : (
                        <UserX className="h-3 w-3" />
                      )}
                      {visitor.status === 'inside' ? 'Inside' : 'Outside'}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5 text-xs text-zinc-400">
                    {visitor.entryTime && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>
                          Entered {formatRelativeTime(visitor.entryTime)}
                        </span>
                      </div>
                    )}
                    {visitor.destinationDepartment && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span>{visitor.destinationDepartment.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {visitor.status === 'inside' && (
                  <button
                    onClick={() => handleManualCheckout(visitor)}
                    disabled={checkoutMutation.isPending}
                    className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <LogOut className="h-3 w-3" />
                    Check Out
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loading State */}
      {isSearching && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
        </div>
      )}

      {/* Confirmation Dialog */}
      {selectedVisitor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-xl border border-white/10 max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-white mb-2">
              Confirm Manual Checkout
            </h3>
            <p className="text-sm text-zinc-400 mb-4">
              Are you sure you want to manually check out{' '}
              <span className="text-white font-medium">
                {selectedVisitor.visitorFullName}
              </span>
              ?
            </p>

            <div className="rounded-lg border border-orange-500/50 bg-orange-500/10 p-3 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-orange-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-orange-400">
                  This action will record an exit without scanning their QR code.
                  Only use this if the visitor has already left the premises.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedVisitor(null)}
                disabled={checkoutMutation.isPending}
                className="flex-1 px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmCheckout}
                disabled={checkoutMutation.isPending}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
              >
                {checkoutMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm Checkout'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
        <p className="text-xs text-zinc-400">
          <strong className="text-zinc-300">Search tips:</strong> Enter at least 3
          characters. You can search by full/partial name or the last 4 digits of
          the phone number.
        </p>
      </div>
    </div>
  );
}
