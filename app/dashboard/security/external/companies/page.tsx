'use client';

import { useState, useMemo } from 'react';
import { Building2, ArrowLeft, Search, Users, Shield, Calendar, Phone, Mail, User, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSecurityCompanies, useExternalSecurityStaff } from '@/hooks/use-security';
import { formatGateLocation } from '@/lib/security-api';

export default function SecurityCompaniesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Fetch companies and staff
  const { data: companies = [], isLoading, error } = useSecurityCompanies({
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });
  const { data: allStaff = [] } = useExternalSecurityStaff();

  // Filter companies based on search
  const filteredCompanies = useMemo(() => {
    if (!searchQuery) return companies;
    const query = searchQuery.toLowerCase();
    return companies.filter(
      (c) =>
        c.companyName.toLowerCase().includes(query) ||
        c.registrationNumber.toLowerCase().includes(query) ||
        c.contactPerson.toLowerCase().includes(query)
    );
  }, [companies, searchQuery]);

  // Get staff by company
  const getCompanyStaff = (companyId: string) => {
    return allStaff.filter(s => s.securityCompanyId === companyId);
  };

  // Stats
  const stats = useMemo(() => {
    return {
      total: companies.length,
      active: companies.filter(c => c.status === 'active').length,
      totalStaff: companies.reduce((sum, c) => sum + c.staffCount, 0),
      totalAssignments: companies.reduce((sum, c) => sum + c.activeAssignments, 0),
    };
  }, [companies]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-lg mb-2">Error loading companies</div>
          <div className="text-zinc-500 text-sm">{error.message}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Building2 className="h-8 w-8 text-purple-400" />
                Security Companies
              </h1>
              <p className="mt-1 text-sm text-zinc-400">
                Manage contracted security service providers
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Total Companies</p>
                <p className="mt-2 text-3xl font-bold text-white">{stats.total}</p>
              </div>
              <div className="rounded-xl bg-purple-500/10 p-3">
                <Building2 className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Active</p>
                <p className="mt-2 text-3xl font-bold text-white">{stats.active}</p>
              </div>
              <div className="rounded-xl bg-green-500/10 p-3">
                <Shield className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Total Staff</p>
                <p className="mt-2 text-3xl font-bold text-white">{stats.totalStaff}</p>
              </div>
              <div className="rounded-xl bg-blue-500/10 p-3">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Active Assignments</p>
                <p className="mt-2 text-3xl font-bold text-white">{stats.totalAssignments}</p>
              </div>
              <div className="rounded-xl bg-orange-500/10 p-3">
                <Calendar className="h-6 w-6 text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search companies by name, registration number, or contact..."
                className="w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 py-2 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Companies Grid */}
        {filteredCompanies.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-zinc-900 p-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-zinc-500" />
            </div>
            <p className="text-zinc-400 text-sm">No companies found</p>
            <p className="text-zinc-500 text-xs mt-1">
              {searchQuery ? 'Try adjusting your search' : 'No security companies registered yet'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredCompanies.map((company) => {
              const companyStaff = getCompanyStaff(company.id);

              return (
                <div
                  key={company.id}
                  className="rounded-xl border border-white/10 bg-zinc-900 p-6 hover:border-white/20 transition-all"
                >
                  {/* Company Header */}
                  <div className="flex items-start gap-4 mb-4">
                    {company.logoUrl ? (
                      <img
                        src={company.logoUrl}
                        alt={company.companyName}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white truncate">
                        {company.companyName}
                      </h3>
                      <p className="text-sm text-zinc-400">
                        Reg: {company.registrationNumber}
                      </p>
                      <div
                        className={`inline-flex items-center mt-2 px-2 py-1 rounded text-xs font-medium ${
                          company.status === 'active'
                            ? 'bg-green-500/10 text-green-400 border border-green-500/50'
                            : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/50'
                        }`}
                      >
                        {company.status === 'active' ? 'Active Contract' : 'Inactive'}
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 mb-4 pb-4 border-b border-white/10">
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <User className="h-4 w-4" />
                      <span>{company.contactPerson}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <Mail className="h-4 w-4" />
                      <span>{company.contactEmail}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <Phone className="h-4 w-4" />
                      <span>{company.contactPhone}</span>
                    </div>
                  </div>

                  {/* Contract Info */}
                  <div className="space-y-2 mb-4 pb-4 border-b border-white/10">
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(company.contractStartDate).toLocaleDateString()} -{' '}
                        {new Date(company.contractEndDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-white/5">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="h-4 w-4 text-blue-400" />
                        <span className="text-xs text-zinc-400">Staff</span>
                      </div>
                      <p className="text-xl font-bold text-white">{company.staffCount}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="h-4 w-4 text-green-400" />
                        <span className="text-xs text-zinc-400">Assignments</span>
                      </div>
                      <p className="text-xl font-bold text-white">{company.activeAssignments}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() =>
                        router.push(`/dashboard/security/external/staff?companyId=${company.id}`)
                      }
                      className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Users className="h-4 w-4" />
                      View Staff
                    </button>
                  </div>

                  {/* Staff Preview */}
                  {companyStaff.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-xs text-zinc-400 mb-2">Recent Staff:</p>
                      <div className="flex -space-x-2">
                        {companyStaff.slice(0, 5).map((staff) => (
                          <div
                            key={staff.id}
                            className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 border-2 border-zinc-900 flex items-center justify-center text-white text-xs font-semibold"
                            title={`${staff.firstName} ${staff.lastName}`}
                          >
                            {staff.firstName.charAt(0)}{staff.lastName.charAt(0)}
                          </div>
                        ))}
                        {companyStaff.length > 5 && (
                          <div className="h-8 w-8 rounded-full bg-zinc-700 border-2 border-zinc-900 flex items-center justify-center text-white text-xs font-semibold">
                            +{companyStaff.length - 5}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
