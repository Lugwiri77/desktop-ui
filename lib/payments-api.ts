/**
 * Payments & Invoices GraphQL API
 *
 * This file contains all GraphQL queries for payment accounts and invoices.
 * These correspond to the backend queries in:
 * - backend/src/graphql/queries/payments.rs
 * - backend/src/graphql/queries/invoices.rs
 *
 * NOTE: This project uses a custom GraphQL client (lib/graphql.ts), NOT Apollo Client.
 * Queries are plain template strings, not gql tagged templates.
 */

import { graphql } from './graphql';
import { loadUserInfo } from './roles';

// Re-export graphql for use in components
export { graphql };

// ============================================================================
// ENUMS
// ============================================================================

export enum OwnerType {
  BusinessAccount = 'business_account',
  InstitutionAccount = 'institution_account',
  PersonalAccount = 'personal_account',
  BusinessLocation = 'business_location',
  InstitutionLocation = 'institution_location',
  Property = 'property',
}

export enum InvoiceStatus {
  Pending = 'pending',
  PartiallyPaid = 'partially_paid',
  Paid = 'paid',
  Overdue = 'overdue',
  Cancelled = 'cancelled',
  Refunded = 'refunded',
}

export enum PaymentAccountStatus {
  Active = 'active',
  Inactive = 'inactive',
  Suspended = 'suspended',
  PendingVerification = 'pending_verification',
}

export enum PaymentMethodType {
  Mpesa = 'mpesa',
  BankAccount = 'bank_account',
  Card = 'card',
  Wallet = 'wallet',
}

// ============================================================================
// TYPES
// ============================================================================

export interface PaymentAccount {
  id: string;
  ownerType: OwnerType;
  ownerId: string;
  businessId?: string;
  accountName: string;
  paymentMethodType: PaymentMethodType;
  status: PaymentAccountStatus;
  mpesaPaybill?: string;
  mpesaAccountName?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankBranch?: string;
  accountHolderName?: string;
  cardLastFour?: string;
  cardBrand?: string;
  cardExpiryMonth?: number;
  cardExpiryYear?: number;
  isDefault: boolean;
  isVerified: boolean;
  verifiedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  issuerType: OwnerType;
  issuerId: string;
  businessId?: string;
  recipientType: OwnerType;
  recipientId: string;
  invoiceType: string;
  title: string;
  description?: string;
  subtotalKes: string;
  taxKes: string;
  discountKes: string;
  totalAmountKes: string;
  paidAmountKes: string;
  balanceKes: string;
  lateFeeKes: string;
  lateFeePercentage?: string;
  lateFeeAppliedAt?: string;
  issueDate: string;
  dueDate: string;
  paidAt?: string;
  status: InvoiceStatus;
  paymentAccountId?: string;
  billingScheduleId?: string;
  notes?: string;
  termsAndConditions?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentStatistics {
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  totalAmountKes: string;
  paidAmountKes: string;
  pendingAmountKes: string;
  overdueAmountKes: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the owner type and ID for the current user
 */
function getCurrentOwnerInfo(): { ownerType: OwnerType; ownerId: string } {
  const userInfo = loadUserInfo();
  if (!userInfo?.organizationId) {
    throw new Error('No organization ID found');
  }

  // Determine owner type based on organization type
  let ownerType: OwnerType;
  if (userInfo.organizationType === 'EducationalInstitution' ||
      userInfo.organizationType === 'ReligiousOrganization' ||
      userInfo.organizationType === 'GovernmentEntity' ||
      userInfo.organizationType === 'HealthcareProvider' ||
      userInfo.organizationType === 'NonProfitOrganization') {
    ownerType = OwnerType.InstitutionAccount;
  } else {
    ownerType = OwnerType.BusinessAccount;
  }

  return {
    ownerType,
    ownerId: userInfo.organizationId,
  };
}

// ============================================================================
// PAYMENT ACCOUNT QUERIES
// ============================================================================

export const GET_PAYMENT_ACCOUNTS_BY_OWNER = `
  query GetPaymentAccountsByOwner($ownerType: OwnerType!, $ownerId: String!) {
    getPaymentAccountsByOwner(ownerType: $ownerType, ownerId: $ownerId) {
      id
      ownerType
      ownerId
      businessId
      accountName
      paymentMethodType
      status
      mpesaPaybill
      mpesaAccountName
      bankName
      bankAccountNumber
      bankBranch
      accountHolderName
      cardLastFour
      cardBrand
      cardExpiryMonth
      cardExpiryYear
      isDefault
      isVerified
      verifiedAt
      notes
      createdAt
      updatedAt
    }
  }
`;

export const GET_PAYMENT_ACCOUNT = `
  query GetPaymentAccount($accountId: String!) {
    getPaymentAccount(accountId: $accountId) {
      id
      ownerType
      ownerId
      businessId
      accountName
      paymentMethodType
      status
      mpesaPaybill
      mpesaAccountName
      bankName
      bankAccountNumber
      bankBranch
      accountHolderName
      cardLastFour
      cardBrand
      cardExpiryMonth
      cardExpiryYear
      isDefault
      isVerified
      verifiedAt
      notes
      createdAt
      updatedAt
    }
  }
`;

// ============================================================================
// INVOICE QUERIES
// ============================================================================

export const GET_INVOICES_BY_ISSUER = `
  query GetInvoicesByIssuer(
    $issuerType: OwnerType!
    $issuerId: String!
    $status: InvoiceStatus
  ) {
    getInvoicesByIssuer(
      issuerType: $issuerType
      issuerId: $issuerId
      status: $status
    ) {
      id
      invoiceNumber
      issuerType
      issuerId
      businessId
      recipientType
      recipientId
      invoiceType
      title
      description
      subtotalKes
      taxKes
      discountKes
      totalAmountKes
      paidAmountKes
      balanceKes
      lateFeeKes
      lateFeePercentage
      lateFeeAppliedAt
      issueDate
      dueDate
      paidAt
      status
      paymentAccountId
      billingScheduleId
      notes
      termsAndConditions
      createdBy
      createdAt
      updatedAt
    }
  }
`;

export const GET_INVOICE = `
  query GetInvoice($invoiceId: String!) {
    getInvoice(invoiceId: $invoiceId) {
      id
      invoiceNumber
      issuerType
      issuerId
      businessId
      recipientType
      recipientId
      invoiceType
      title
      description
      subtotalKes
      taxKes
      discountKes
      totalAmountKes
      paidAmountKes
      balanceKes
      lateFeeKes
      lateFeePercentage
      lateFeeAppliedAt
      issueDate
      dueDate
      paidAt
      status
      paymentAccountId
      billingScheduleId
      notes
      termsAndConditions
      createdBy
      createdAt
      updatedAt
    }
  }
`;

export const GET_OVERDUE_INVOICES_BY_ISSUER = `
  query GetOverdueInvoicesByIssuer(
    $issuerType: OwnerType!
    $issuerId: String!
  ) {
    getOverdueInvoicesByIssuer(
      issuerType: $issuerType
      issuerId: $issuerId
    ) {
      id
      invoiceNumber
      issuerType
      issuerId
      businessId
      recipientType
      recipientId
      invoiceType
      title
      description
      subtotalKes
      taxKes
      discountKes
      totalAmountKes
      paidAmountKes
      balanceKes
      lateFeeKes
      issueDate
      dueDate
      paidAt
      status
      paymentAccountId
      createdAt
      updatedAt
    }
  }
`;

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Get payment accounts owned by current user
 */
export async function getPaymentAccountsByOwner(): Promise<PaymentAccount[]> {
  const { ownerType, ownerId } = getCurrentOwnerInfo();

  const data = await graphql<{ getPaymentAccountsByOwner: PaymentAccount[] }>(
    GET_PAYMENT_ACCOUNTS_BY_OWNER,
    { ownerType, ownerId }
  );
  return data.getPaymentAccountsByOwner || [];
}

/**
 * Get a specific payment account
 */
export async function getPaymentAccount(accountId: string): Promise<PaymentAccount> {
  const data = await graphql<{ getPaymentAccount: PaymentAccount }>(
    GET_PAYMENT_ACCOUNT,
    { accountId }
  );
  return data.getPaymentAccount;
}

/**
 * Get invoices issued by current user
 */
export async function getInvoicesByIssuer(status?: InvoiceStatus): Promise<Invoice[]> {
  const { ownerType, ownerId } = getCurrentOwnerInfo();

  const data = await graphql<{ getInvoicesByIssuer: Invoice[] }>(
    GET_INVOICES_BY_ISSUER,
    { issuerType: ownerType, issuerId: ownerId, status }
  );
  return data.getInvoicesByIssuer || [];
}

/**
 * Get a specific invoice
 */
export async function getInvoice(invoiceId: string): Promise<Invoice> {
  const data = await graphql<{ getInvoice: Invoice }>(
    GET_INVOICE,
    { invoiceId }
  );
  return data.getInvoice;
}

/**
 * Get overdue invoices issued by current user
 */
export async function getOverdueInvoicesByIssuer(): Promise<Invoice[]> {
  const { ownerType, ownerId } = getCurrentOwnerInfo();

  const data = await graphql<{ getOverdueInvoicesByIssuer: Invoice[] }>(
    GET_OVERDUE_INVOICES_BY_ISSUER,
    { issuerType: ownerType, issuerId: ownerId }
  );
  return data.getOverdueInvoicesByIssuer || [];
}
