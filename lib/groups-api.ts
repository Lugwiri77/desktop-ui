/**
 * Groups & Chamas GraphQL API
 *
 * This file contains all GraphQL queries and mutations for groups/chamas management.
 * These correspond to the backend queries/mutations in:
 * - backend/src/graphql/queries/groups.rs
 * - backend/src/graphql/queries/group_finances.rs
 * - backend/src/graphql/queries/fundraising.rs
 * - backend/src/graphql/mutations/groups.rs
 * - backend/src/graphql/mutations/group_finances.rs
 * - backend/src/graphql/mutations/fundraising.rs
 *
 * NOTE: This project uses a custom GraphQL client (lib/graphql.ts), NOT Apollo Client.
 */

import { graphql } from './graphql';

// Re-export graphql for use in components
export { graphql };

// ============================================================================
// ENUMS
// ============================================================================

export enum GroupType {
  SavingsGroup = 'savings_group',
  Chama = 'chama',
  Fundraising = 'fundraising',
  InvestmentClub = 'investment_club',
}

export enum GroupStatus {
  Active = 'active',
  Inactive = 'inactive',
  Suspended = 'suspended',
  Closed = 'closed',
}

export enum GroupMemberRole {
  Admin = 'admin',
  Chairperson = 'chairperson',
  Treasurer = 'treasurer',
  Secretary = 'secretary',
  Member = 'member',
}

export enum GroupApprovalStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}

export enum GroupContributionType {
  Regular = 'regular',
  Additional = 'additional',
  Penalty = 'penalty',
  Interest = 'interest',
}

export enum GroupTransactionStatus {
  Pending = 'pending',
  Completed = 'completed',
  Failed = 'failed',
  Reversed = 'reversed',
}

export enum GroupWithdrawalType {
  SharePayout = 'share_payout',
  Loan = 'loan',
  Emergency = 'emergency',
  GroupExpense = 'group_expense',
  Dissolution = 'dissolution',
}

export enum GroupWithdrawalStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
  Completed = 'completed',
  Failed = 'failed',
}

export enum GroupLoanStatus {
  Pending = 'pending',
  Approved = 'approved',
  Disbursed = 'disbursed',
  Active = 'active',
  Paid = 'paid',
  Defaulted = 'defaulted',
  WrittenOff = 'written_off',
}

export enum RepaymentFrequency {
  Weekly = 'weekly',
  Monthly = 'monthly',
}

export enum CampaignStatus {
  Draft = 'draft',
  Active = 'active',
  Paused = 'paused',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export enum CampaignVerificationStatus {
  Pending = 'pending',
  Verified = 'verified',
  Rejected = 'rejected',
}

export enum DonationStatus {
  Pending = 'pending',
  Completed = 'completed',
  Failed = 'failed',
  Refunded = 'refunded',
}

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Group {
  id: string;
  name: string;
  description?: string;
  groupType: GroupType;
  walletId?: string;
  targetAmount?: string;
  currentBalance: string;
  contributionFrequency?: string;
  contributionAmount?: string;
  contributionDay?: number;
  maxMembers?: number;
  currentMemberCount: number;
  isPublic: boolean;
  requiresApproval: boolean;
  allowLoans: boolean;
  status: GroupStatus;
  logoUrl?: string;
  coverImageUrl?: string;
  location?: string;
  meetingSchedule?: string;
  rules?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  id: string;
  groupId: string;
  memberId: string;
  role: GroupMemberRole;
  joinedAt: string;
  approvalStatus: GroupApprovalStatus;
  totalContributed: string;
  totalWithdrawn: string;
  totalLoansTaken: string;
  totalLoansRepaid: string;
  isActive: boolean;
  createdAt: string;
}

export interface GroupContribution {
  id: string;
  groupId: string;
  memberId: string;
  amount: string;
  contributionType: GroupContributionType;
  contributionPeriod?: string;
  paymentMethod?: string;
  paymentReference?: string;
  status: GroupTransactionStatus;
  contributedAt: string;
}

export interface GroupWithdrawal {
  id: string;
  groupId: string;
  memberId?: string;
  amount: string;
  withdrawalType: GroupWithdrawalType;
  reason: string;
  status: GroupWithdrawalStatus;
  requestedAt: string;
  approvedAt?: string;
}

export interface GroupLoan {
  id: string;
  groupId: string;
  borrowerMemberId: string;
  loanAmount: string;
  interestRate: string;
  loanTermMonths: number;
  repaymentFrequency: RepaymentFrequency;
  totalInterest: string;
  totalAmount: string;
  monthlyPayment: string;
  outstandingBalance: string;
  status: GroupLoanStatus;
  dueDate: string;
  disbursementDate?: string;
}

export interface GroupLoanRepayment {
  id: string;
  loanId: string;
  amount: string;
  principalAmount: string;
  interestAmount: string;
  repaymentDate: string;
}

export interface FundraisingCampaign {
  id: string;
  groupId?: string;
  title: string;
  description: string;
  story?: string;
  category?: string;
  targetAmount: string;
  currentAmount: string;
  currency: string;
  isPublic: boolean;
  status: CampaignStatus;
  verificationStatus: CampaignVerificationStatus;
  totalDonations: number;
  totalDonors: number;
  startDate: string;
  endDate?: string;
  coverImageUrl?: string;
}

export interface CampaignDonation {
  id: string;
  campaignId: string;
  amount: string;
  isAnonymous: boolean;
  donorName?: string;
  message?: string;
  status: DonationStatus;
  donatedAt: string;
}

export interface GroupStats {
  groupId: string;
  activeMembers: number;
  pendingMembers: number;
  totalContributions: string;
  totalWithdrawals: string;
  currentBalance: string;
  activeLoans: number;
  totalLoansDisbursed: string;
}

export interface CampaignStats {
  campaignId: string;
  targetAmount: string;
  currentAmount: string;
  progressPercentage: string;
  totalDonations: number;
  totalDonors: number;
  averageDonation?: string;
  daysRemaining: number;
}

export interface MemberFinancialSummary {
  memberId: string;
  groupId: string;
  totalContributed: string;
  totalWithdrawn: string;
  totalLoansTaken: string;
  totalLoansRepaid: string;
  contributionCount: number;
  activeLoansCount: number;
}

// ============================================================================
// GRAPHQL QUERIES
// ============================================================================

// Group Queries

export const GET_GROUP = `
  query GetGroup($groupId: String!) {
    getGroup(groupId: $groupId) {
      id
      name
      description
      groupType
      currentBalance
      contributionAmount
      contributionFrequency
      contributionDay
      maxMembers
      currentMemberCount
      isPublic
      requiresApproval
      allowLoans
      status
      logoUrl
      coverImageUrl
      location
      meetingSchedule
      rules
      createdAt
      updatedAt
    }
  }
`;

export const LIST_GROUPS = `
  query ListGroups($groupType: GroupTypeGQL, $status: GroupStatusGQL, $limit: Int, $offset: Int) {
    listGroups(groupType: $groupType, status: $status, limit: $limit, offset: $offset) {
      id
      name
      description
      groupType
      currentBalance
      currentMemberCount
      maxMembers
      isPublic
      status
      createdAt
    }
  }
`;

export const GET_MY_GROUPS = `
  query GetMyGroups($status: GroupStatusGQL) {
    getMyGroups(status: $status) {
      id
      name
      description
      groupType
      currentBalance
      currentMemberCount
      status
      createdAt
    }
  }
`;

export const GET_GROUP_MEMBERS = `
  query GetGroupMembers($groupId: String!, $role: GroupMemberRoleGQL, $isActive: Boolean) {
    getGroupMembers(groupId: $groupId, role: $role, isActive: $isActive) {
      id
      memberId
      role
      approvalStatus
      totalContributed
      totalWithdrawn
      totalLoansTaken
      totalLoansRepaid
      isActive
      joinedAt
    }
  }
`;

export const GET_GROUP_STATS = `
  query GetGroupStats($groupId: String!) {
    getGroupStats(groupId: $groupId) {
      groupId
      activeMembers
      pendingMembers
      totalContributions
      totalWithdrawals
      currentBalance
      activeLoans
      totalLoansDisbursed
    }
  }
`;

export const SEARCH_GROUPS = `
  query SearchGroups($searchTerm: String!, $groupType: GroupTypeGQL, $limit: Int) {
    searchGroups(searchTerm: $searchTerm, groupType: $groupType, limit: $limit) {
      id
      name
      description
      groupType
      currentBalance
      currentMemberCount
      status
    }
  }
`;

// Financial Queries

export const GET_GROUP_CONTRIBUTIONS = `
  query GetGroupContributions($groupId: String!, $memberId: String, $limit: Int, $offset: Int) {
    getGroupContributions(groupId: $groupId, memberId: $memberId, limit: $limit, offset: $offset) {
      id
      memberId
      amount
      contributionType
      contributionPeriod
      paymentMethod
      paymentReference
      status
      contributedAt
    }
  }
`;

export const GET_GROUP_WITHDRAWALS = `
  query GetGroupWithdrawals($groupId: String!, $status: GroupWithdrawalStatusGQL, $limit: Int) {
    getGroupWithdrawals(groupId: $groupId, status: $status, limit: $limit) {
      id
      memberId
      amount
      withdrawalType
      reason
      status
      requestedAt
      approvedAt
    }
  }
`;

export const GET_GROUP_LOANS = `
  query GetGroupLoans($groupId: String!, $status: GroupLoanStatusGQL, $limit: Int) {
    getGroupLoans(groupId: $groupId, status: $status, limit: $limit) {
      id
      borrowerMemberId
      loanAmount
      interestRate
      loanTermMonths
      totalAmount
      monthlyPayment
      outstandingBalance
      status
      dueDate
      disbursementDate
    }
  }
`;

export const GET_LOAN_REPAYMENTS = `
  query GetLoanRepayments($loanId: String!, $limit: Int) {
    getLoanRepayments(loanId: $loanId, limit: $limit) {
      id
      amount
      principalAmount
      interestAmount
      repaymentDate
    }
  }
`;

export const GET_MEMBER_FINANCIAL_SUMMARY = `
  query GetMemberFinancialSummary($groupId: String!, $memberId: String!) {
    getMemberFinancialSummary(groupId: $groupId, memberId: $memberId) {
      memberId
      groupId
      totalContributed
      totalWithdrawn
      totalLoansTaken
      totalLoansRepaid
      contributionCount
      activeLoansCount
    }
  }
`;

// Campaign Queries

export const LIST_CAMPAIGNS = `
  query ListCampaigns($category: String, $status: CampaignStatusGQL, $limit: Int) {
    listCampaigns(category: $category, status: $status, limit: $limit) {
      id
      title
      description
      category
      targetAmount
      currentAmount
      status
      verificationStatus
      totalDonations
      totalDonors
      coverImageUrl
      endDate
      currency
    }
  }
`;

export const GET_MY_CAMPAIGNS = `
  query GetMyCampaigns($status: CampaignStatusGQL) {
    getMyCampaigns(status: $status) {
      id
      title
      description
      category
      targetAmount
      currentAmount
      status
      verificationStatus
      totalDonations
      totalDonors
      coverImageUrl
      endDate
      currency
      createdAt
    }
  }
`;

export const GET_CAMPAIGN = `
  query GetCampaign($campaignId: String!) {
    getCampaign(campaignId: $campaignId) {
      id
      groupId
      title
      description
      story
      category
      targetAmount
      currentAmount
      currency
      isPublic
      status
      verificationStatus
      totalDonations
      totalDonors
      startDate
      endDate
      coverImageUrl
    }
  }
`;

export const GET_CAMPAIGN_STATS = `
  query GetCampaignStats($campaignId: String!) {
    getCampaignStats(campaignId: $campaignId) {
      campaignId
      targetAmount
      currentAmount
      progressPercentage
      totalDonations
      totalDonors
      averageDonation
      daysRemaining
    }
  }
`;

export const GET_CAMPAIGN_DONATIONS = `
  query GetCampaignDonations($campaignId: String!, $limit: Int) {
    getCampaignDonations(campaignId: $campaignId, limit: $limit) {
      id
      amount
      isAnonymous
      donorName
      message
      status
      donatedAt
    }
  }
`;

// ============================================================================
// GRAPHQL MUTATIONS
// ============================================================================

// Group Mutations

export const CREATE_GROUP = `
  mutation CreateGroup($input: CreateGroupInput!) {
    createGroup(input: $input) {
      success
      message
      group {
        id
        name
        groupType
        status
      }
    }
  }
`;

export const UPDATE_GROUP = `
  mutation UpdateGroup($groupId: String!, $input: UpdateGroupInput!) {
    updateGroup(groupId: $groupId, input: $input) {
      success
      message
      group {
        id
        name
        status
      }
    }
  }
`;

export const INVITE_MEMBER = `
  mutation InviteMember($input: InviteMemberInput!) {
    inviteMember(input: $input) {
      success
      message
      member {
        id
        memberId
        role
        approvalStatus
      }
    }
  }
`;

export const UPDATE_MEMBER_ROLE = `
  mutation UpdateMemberRole($input: UpdateMemberRoleInput!) {
    updateMemberRole(input: $input) {
      success
      message
      member {
        id
        role
      }
    }
  }
`;

export const APPROVE_MEMBERSHIP = `
  mutation ApproveMembership($input: ApproveMembershipInput!) {
    approveMembership(input: $input) {
      success
      message
      member {
        id
        approvalStatus
      }
    }
  }
`;

export const LEAVE_GROUP = `
  mutation LeaveGroup($groupId: String!, $reason: String) {
    leaveGroup(groupId: $groupId, reason: $reason) {
      success
      message
    }
  }
`;

// Financial Mutations

export const RECORD_CONTRIBUTION = `
  mutation RecordContribution($input: RecordContributionInput!) {
    recordContribution(input: $input) {
      success
      message
      contribution {
        id
        amount
        status
      }
    }
  }
`;

export const REQUEST_WITHDRAWAL = `
  mutation RequestWithdrawal($input: RequestWithdrawalInput!) {
    requestWithdrawal(input: $input) {
      success
      message
      withdrawal {
        id
        amount
        status
      }
    }
  }
`;

export const APPROVE_WITHDRAWAL = `
  mutation ApproveWithdrawal($input: ApproveWithdrawalInput!) {
    approveWithdrawal(input: $input) {
      success
      message
      withdrawal {
        id
        status
      }
    }
  }
`;

export const REQUEST_LOAN = `
  mutation RequestLoan($input: RequestLoanInput!) {
    requestLoan(input: $input) {
      success
      message
      loan {
        id
        loanAmount
        totalAmount
        monthlyPayment
        status
      }
    }
  }
`;

export const APPROVE_LOAN = `
  mutation ApproveLoan($input: ApproveLoanInput!) {
    approveLoan(input: $input) {
      success
      message
      loan {
        id
        status
        disbursementDate
      }
    }
  }
`;

export const RECORD_LOAN_REPAYMENT = `
  mutation RecordLoanRepayment($input: RecordLoanRepaymentInput!) {
    recordLoanRepayment(input: $input) {
      success
      message
      repayment {
        id
        amount
      }
      loan {
        id
        outstandingBalance
        status
      }
    }
  }
`;

// Campaign Mutations

export const CREATE_CAMPAIGN = `
  mutation CreateCampaign($input: CreateCampaignInput!) {
    createCampaign(input: $input) {
      success
      message
      campaign {
        id
        title
        status
        verificationStatus
      }
    }
  }
`;

export const UPDATE_CAMPAIGN = `
  mutation UpdateCampaign($campaignId: String!, $input: UpdateCampaignInput!) {
    updateCampaign(campaignId: $campaignId, input: $input) {
      success
      message
      campaign {
        id
        title
        status
      }
    }
  }
`;

export const MAKE_DONATION = `
  mutation MakeDonation($input: MakeDonationInput!) {
    makeDonation(input: $input) {
      success
      message
      donation {
        id
        amount
        status
      }
    }
  }
`;

// ============================================================================
// API FUNCTIONS
// ============================================================================

// Group Functions

export async function getGroup(groupId: string): Promise<Group> {
  const data = await graphql<{ getGroup: Group }>(GET_GROUP, { groupId });
  return data.getGroup;
}

export async function listGroups(
  filters?: {
    groupType?: GroupType;
    status?: GroupStatus;
    limit?: number;
    offset?: number;
  }
): Promise<Group[]> {
  const data = await graphql<{ listGroups: Group[] }>(LIST_GROUPS, filters || {});
  return data.listGroups;
}

export async function getMyGroups(status?: GroupStatus): Promise<Group[]> {
  const data = await graphql<{ getMyGroups: Group[] }>(GET_MY_GROUPS, { status });
  return data.getMyGroups;
}

export async function getGroupMembers(
  groupId: string,
  filters?: {
    role?: GroupMemberRole;
    isActive?: boolean;
  }
): Promise<GroupMember[]> {
  const data = await graphql<{ getGroupMembers: GroupMember[] }>(
    GET_GROUP_MEMBERS,
    { groupId, ...filters }
  );
  return data.getGroupMembers;
}

export async function getGroupStats(groupId: string): Promise<GroupStats> {
  const data = await graphql<{ getGroupStats: GroupStats }>(GET_GROUP_STATS, { groupId });
  return data.getGroupStats;
}

export async function searchGroups(
  searchTerm: string,
  filters?: {
    groupType?: GroupType;
    limit?: number;
  }
): Promise<Group[]> {
  const data = await graphql<{ searchGroups: Group[] }>(
    SEARCH_GROUPS,
    { searchTerm, ...filters }
  );
  return data.searchGroups;
}

// Financial Functions

export async function getGroupContributions(
  groupId: string,
  options?: {
    memberId?: string;
    limit?: number;
    offset?: number;
  }
): Promise<GroupContribution[]> {
  const data = await graphql<{ getGroupContributions: GroupContribution[] }>(
    GET_GROUP_CONTRIBUTIONS,
    { groupId, ...options }
  );
  return data.getGroupContributions;
}

export async function getGroupWithdrawals(
  groupId: string,
  options?: {
    status?: GroupWithdrawalStatus;
    limit?: number;
  }
): Promise<GroupWithdrawal[]> {
  const data = await graphql<{ getGroupWithdrawals: GroupWithdrawal[] }>(
    GET_GROUP_WITHDRAWALS,
    { groupId, ...options }
  );
  return data.getGroupWithdrawals;
}

export async function getGroupLoans(
  groupId: string,
  options?: {
    status?: GroupLoanStatus;
    limit?: number;
  }
): Promise<GroupLoan[]> {
  const data = await graphql<{ getGroupLoans: GroupLoan[] }>(
    GET_GROUP_LOANS,
    { groupId, ...options }
  );
  return data.getGroupLoans;
}

export async function getMemberFinancialSummary(
  groupId: string,
  memberId: string
): Promise<MemberFinancialSummary> {
  const data = await graphql<{ getMemberFinancialSummary: MemberFinancialSummary }>(
    GET_MEMBER_FINANCIAL_SUMMARY,
    { groupId, memberId }
  );
  return data.getMemberFinancialSummary;
}

// Campaign Functions

export async function listCampaigns(filters?: {
  category?: string;
  status?: CampaignStatus;
  limit?: number;
}): Promise<FundraisingCampaign[]> {
  const data = await graphql<{ listCampaigns: FundraisingCampaign[] }>(
    LIST_CAMPAIGNS,
    filters || {}
  );
  return data.listCampaigns;
}

export async function getMyCampaigns(status?: CampaignStatus): Promise<FundraisingCampaign[]> {
  const data = await graphql<{ getMyCampaigns: FundraisingCampaign[] }>(
    GET_MY_CAMPAIGNS,
    status ? { status } : {}
  );
  return data.getMyCampaigns;
}

export async function getCampaign(campaignId: string): Promise<FundraisingCampaign> {
  const data = await graphql<{ getCampaign: FundraisingCampaign }>(
    GET_CAMPAIGN,
    { campaignId }
  );
  return data.getCampaign;
}

export async function getCampaignStats(campaignId: string): Promise<CampaignStats> {
  const data = await graphql<{ getCampaignStats: CampaignStats }>(
    GET_CAMPAIGN_STATS,
    { campaignId }
  );
  return data.getCampaignStats;
}

export async function getCampaignDonations(
  campaignId: string,
  limit?: number
): Promise<CampaignDonation[]> {
  const data = await graphql<{ getCampaignDonations: CampaignDonation[] }>(
    GET_CAMPAIGN_DONATIONS,
    { campaignId, limit }
  );
  return data.getCampaignDonations;
}

// Mutation Functions

export async function createGroup(input: any): Promise<{
  success: boolean;
  message: string;
  group?: Group;
}> {
  const data = await graphql<{ createGroup: any }>(CREATE_GROUP, { input });
  return data.createGroup;
}

export async function recordContribution(input: any): Promise<{
  success: boolean;
  message: string;
  contribution?: GroupContribution;
}> {
  const data = await graphql<{ recordContribution: any }>(RECORD_CONTRIBUTION, { input });
  return data.recordContribution;
}

export async function requestWithdrawal(input: any): Promise<{
  success: boolean;
  message: string;
  withdrawal?: GroupWithdrawal;
}> {
  const data = await graphql<{ requestWithdrawal: any }>(REQUEST_WITHDRAWAL, { input });
  return data.requestWithdrawal;
}

export async function requestLoan(input: any): Promise<{
  success: boolean;
  message: string;
  loan?: GroupLoan;
}> {
  const data = await graphql<{ requestLoan: any }>(REQUEST_LOAN, { input });
  return data.requestLoan;
}

export async function createCampaign(input: any): Promise<{
  success: boolean;
  message: string;
  campaign?: FundraisingCampaign;
}> {
  const data = await graphql<{ createCampaign: any }>(CREATE_CAMPAIGN, { input });
  return data.createCampaign;
}

export async function updateCampaign(input: any): Promise<{
  success: boolean;
  message: string;
  campaign?: FundraisingCampaign;
}> {
  const data = await graphql<{ updateCampaign: any }>(UPDATE_CAMPAIGN, { input });
  return data.updateCampaign;
}

export async function makeDonation(input: any): Promise<{
  success: boolean;
  message: string;
  donation?: CampaignDonation;
}> {
  const data = await graphql<{ makeDonation: any }>(MAKE_DONATION, { input });
  return data.makeDonation;
}

export async function inviteMember(input: any): Promise<{
  success: boolean;
  message: string;
  member?: GroupMember;
}> {
  const data = await graphql<{ inviteMember: any }>(INVITE_MEMBER, { input });
  return data.inviteMember;
}

export async function updateMemberRole(input: any): Promise<{
  success: boolean;
  message: string;
  member?: GroupMember;
}> {
  const data = await graphql<{ updateMemberRole: any }>(UPDATE_MEMBER_ROLE, { input });
  return data.updateMemberRole;
}

export async function approveMembership(input: any): Promise<{
  success: boolean;
  message: string;
  member?: GroupMember;
}> {
  const data = await graphql<{ approveMembership: any }>(APPROVE_MEMBERSHIP, { input });
  return data.approveMembership;
}

export async function leaveGroup(groupId: string, reason?: string): Promise<{
  success: boolean;
  message: string;
}> {
  const data = await graphql<{ leaveGroup: any }>(LEAVE_GROUP, { groupId, reason });
  return data.leaveGroup;
}
