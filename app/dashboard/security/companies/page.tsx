'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Users,
  Calendar,
  Phone,
  Mail,
  Search,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  FileText,
  RotateCw,
} from 'lucide-react';
import {
  getSecurityCompanies,
  updateSecurityCompany,
  type SecurityCompany,
} from '@/lib/security-approval';

type StatusFilter = 'all' | 'active' | 'inactive' | 'suspended';

export default function SecurityCompaniesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [editModal, setEditModal] = useState<{
    company: SecurityCompany | null;
    isOpen: boolean;
  }>({ company: null, isOpen: false });
  const [viewModal, setViewModal] = useState<{
    company: SecurityCompany | null;
    isOpen: boolean;
  }>({ company: null, isOpen: false });

  const queryClient = useQueryClient();

  // Fetch security companies
  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['securityCompanies'],
    queryFn: getSecurityCompanies,
    refetchInterval: 30000,
  });

  // Update company mutation
  const updateMutation = useMutation({
    mutationFn: updateSecurityCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['securityCompanies'] });
      setEditModal({ company: null, isOpen: false });
    },
  });

  // Filter companies
  const filteredCompanies = useMemo(() => {
    let filtered = companies;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.companyName.toLowerCase().includes(query) ||
          c.registrationNumber.toLowerCase().includes(query) ||
          c.contactPerson.toLowerCase().includes(query) ||
          c.contactEmail.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [companies, statusFilter, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const now = new Date();
    return {
      total: companies.length,
      active: companies.filter((c) => c.status === 'active').length,
      totalStaff: companies.reduce((sum, c) => sum + c.staffCount, 0),
      expiringSoon: companies.filter((c) => {
        const endDate = new Date(c.contractEndDate);
        const daysUntilExpiry = Math.ceil(
          (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysUntilExpiry > 0 && daysUntilExpiry <= 30 && c.status === 'active';
      }).length,
    };
  }, [companies]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-400 border-green-500/50';
      case 'inactive':
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/50';
      case 'suspended':
        return 'bg-red-500/10 text-red-400 border-red-500/50';
      default:
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/50';
    }
  };

  const getContractStatus = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const daysUntilExpiry = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return { label: 'Expired', color: 'text-red-400', bgColor: 'bg-red-500/10' };
    } else if (daysUntilExpiry <= 30) {
      return {
        label: `${daysUntilExpiry} days left`,
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
      };
    } else if (daysUntilExpiry <= 90) {
      return {
        label: `${Math.ceil(daysUntilExpiry / 30)} months left`,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
      };
    } else {
      return {
        label: 'Active',
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
      };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Security Companies</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Manage security companies and their contracts
            </p>
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
              <div className="rounded-xl bg-blue-500/10 p-3">
                <Building2 className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Active Contracts</p>
                <p className="mt-2 text-3xl font-bold text-white">{stats.active}</p>
              </div>
              <div className="rounded-xl bg-green-500/10 p-3">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Total Staff</p>
                <p className="mt-2 text-3xl font-bold text-white">{stats.totalStaff}</p>
              </div>
              <div className="rounded-xl bg-purple-500/10 p-3">
                <Users className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Expiring Soon</p>
                <p className="mt-2 text-3xl font-bold text-white">{stats.expiringSoon}</p>
              </div>
              <div className="rounded-xl bg-orange-500/10 p-3">
                <AlertTriangle className="h-6 w-6 text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by company name, registration number, or contact..."
                className="w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 py-2 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* Companies List */}
        <div className="rounded-xl border border-white/10 bg-zinc-900 overflow-hidden">
          {filteredCompanies.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8 text-zinc-500" />
              </div>
              <p className="text-zinc-400 text-sm">No companies found</p>
              <p className="text-zinc-500 text-xs mt-1">
                {searchQuery
                  ? 'Try adjusting your search or filters'
                  : 'No security companies registered'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-white/10 bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Contract Period
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Staff Count
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredCompanies.map((company) => {
                    const contractStatus = getContractStatus(company.contractEndDate);
                    return (
                      <tr key={company.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-white">
                              {company.companyName}
                            </p>
                            <p className="text-xs text-zinc-400 flex items-center gap-1 mt-1">
                              <FileText className="h-3 w-3" />
                              {company.registrationNumber}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <p className="text-xs text-zinc-300">{company.contactPerson}</p>
                            <p className="text-xs text-zinc-400 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {company.contactEmail}
                            </p>
                            <p className="text-xs text-zinc-400 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {company.contactPhone}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <p className="text-xs text-zinc-300 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(company.contractStartDate)} -{' '}
                              {formatDate(company.contractEndDate)}
                            </p>
                            <div
                              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${contractStatus.bgColor} ${contractStatus.color}`}
                            >
                              {contractStatus.label}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-zinc-400" />
                            <span className="text-sm font-medium text-white">
                              {company.staffCount}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div
                            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium border ${getStatusBadgeColor(
                              company.status
                            )}`}
                          >
                            {company.status === 'active' ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            {company.status.charAt(0).toUpperCase() + company.status.slice(1)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setViewModal({ company, isOpen: true })}
                              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditModal({ company, isOpen: true })}
                              className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                              title="Edit Contract"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              className="p-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors"
                              title="Renew Contract"
                            >
                              <RotateCw className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editModal.isOpen && editModal.company && (
        <EditCompanyModal
          company={editModal.company}
          onClose={() => setEditModal({ company: null, isOpen: false })}
          onSave={(updates) => {
            updateMutation.mutate({
              companyId: editModal.company!.id,
              ...updates,
            });
          }}
          isLoading={updateMutation.isPending}
        />
      )}

      {/* View Modal */}
      {viewModal.isOpen && viewModal.company && (
        <ViewCompanyModal
          company={viewModal.company}
          onClose={() => setViewModal({ company: null, isOpen: false })}
        />
      )}
    </div>
  );
}

// Edit Company Modal
function EditCompanyModal({
  company,
  onClose,
  onSave,
  isLoading,
}: {
  company: SecurityCompany;
  onClose: () => void;
  onSave: (updates: {
    contractEndDate?: string;
    status?: 'active' | 'inactive' | 'suspended';
    contactPerson?: string;
    contactEmail?: string;
    contactPhone?: string;
  }) => void;
  isLoading: boolean;
}) {
  const [contractEndDate, setContractEndDate] = useState(
    company.contractEndDate.split('T')[0]
  );
  const [status, setStatus] = useState<'active' | 'inactive' | 'suspended'>(company.status);
  const [contactPerson, setContactPerson] = useState(company.contactPerson);
  const [contactEmail, setContactEmail] = useState(company.contactEmail);
  const [contactPhone, setContactPhone] = useState(company.contactPhone);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-xl border border-white/10 max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Edit className="h-6 w-6 text-blue-400" />
            Edit Company Contract
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Contract End Date
            </label>
            <input
              type="date"
              value={contractEndDate}
              onChange={(e) => setContractEndDate(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Status</label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as 'active' | 'inactive' | 'suspended')
              }
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Contact Person
            </label>
            <input
              type="text"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Contact Email
            </label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Contact Phone
            </label>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              onSave({
                contractEndDate,
                status,
                contactPerson,
                contactEmail,
                contactPhone,
              })
            }
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// View Company Modal
function ViewCompanyModal({
  company,
  onClose,
}: {
  company: SecurityCompany;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-xl border border-white/10 max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="h-6 w-6 text-blue-400" />
            {company.companyName}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-zinc-400 mb-1">Registration Number</p>
            <p className="text-sm text-white">{company.registrationNumber}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 mb-1">Status</p>
            <p className="text-sm text-white capitalize">{company.status}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 mb-1">Contact Person</p>
            <p className="text-sm text-white">{company.contactPerson}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 mb-1">Contact Email</p>
            <p className="text-sm text-white">{company.contactEmail}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 mb-1">Contact Phone</p>
            <p className="text-sm text-white">{company.contactPhone}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 mb-1">Staff Count</p>
            <p className="text-sm text-white">{company.staffCount}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 mb-1">Contract Start Date</p>
            <p className="text-sm text-white">
              {new Date(company.contractStartDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 mb-1">Contract End Date</p>
            <p className="text-sm text-white">
              {new Date(company.contractEndDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
