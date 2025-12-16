import { graphql } from '@/lib/graphql';
import type {
  PaymentAccount,
  Invoice,
  PaymentTransaction,
  WalletBalance,
  WalletTransaction,
  AccountLookupResponse,
  ArrearsReport,
  PaymentStatistics,
  PaymentAnalytics,
  PaymentTransactionFilter,
  InvoiceFilter,
  WalletTransactionFilter,
} from './types';

// ============================================================================
// Payment Account Queries
// ============================================================================

/**
 * Get all payment accounts for the organization
 */
export async function getPaymentAccounts(): Promise<PaymentAccount[]> {
  const query = `
    query GetPaymentAccounts {
      paymentAccounts {
        id
        accountName
        accountNumber
        currency
        balance
        ownerType
        ownerId
        ownerName
        isActive
        metadata
        createdAt
        updatedAt
      }
    }
  `;

  const data = await graphql<{ paymentAccounts: PaymentAccount[] }>(query);
  return data.paymentAccounts;
}

/**
 * Get a specific payment account by ID
 */
export async function getPaymentAccount(accountId: string): Promise<PaymentAccount | null> {
  const query = `
    query GetPaymentAccount($accountId: String!) {
      paymentAccount(accountId: $accountId) {
        id
        accountName
        accountNumber
        currency
        balance
        ownerType
        ownerId
        ownerName
        isActive
        metadata
        createdAt
        updatedAt
      }
    }
  `;

  const data = await graphql<{ paymentAccount: PaymentAccount | null }>(query, { accountId });
  return data.paymentAccount;
}

/**
 * Get payment accounts by owner
 */
export async function getPaymentAccountsByOwner(
  ownerType: string,
  ownerId: string
): Promise<PaymentAccount[]> {
  const query = `
    query GetPaymentAccountsByOwner($ownerType: String!, $ownerId: String!) {
      paymentAccountsByOwner(ownerType: $ownerType, ownerId: $ownerId) {
        id
        accountName
        accountNumber
        currency
        balance
        ownerType
        ownerId
        ownerName
        isActive
        metadata
        createdAt
        updatedAt
      }
    }
  `;

  const data = await graphql<{ paymentAccountsByOwner: PaymentAccount[] }>(query, {
    ownerType,
    ownerId,
  });
  return data.paymentAccountsByOwner;
}

// ============================================================================
// Invoice Queries
// ============================================================================

/**
 * Get invoices with optional filtering
 */
export async function getInvoices(filter?: InvoiceFilter): Promise<Invoice[]> {
  const query = `
    query GetInvoices(
      $paymentAccountId: String
      $status: String
      $recipientAccountType: String
      $recipientAccountId: String
      $startDate: String
      $endDate: String
      $limit: Int
      $offset: Int
    ) {
      invoices(
        paymentAccountId: $paymentAccountId
        status: $status
        recipientAccountType: $recipientAccountType
        recipientAccountId: $recipientAccountId
        startDate: $startDate
        endDate: $endDate
        limit: $limit
        offset: $offset
      ) {
        id
        invoiceNumber
        paymentAccountId
        recipientAccountType
        recipientAccountId
        recipientName
        recipientEmail
        recipientPhone
        amount
        currency
        description
        dueDate
        status
        paidAt
        metadata
        createdAt
        updatedAt
      }
    }
  `;

  const data = await graphql<{ invoices: Invoice[] }>(query, filter);
  return data.invoices;
}

/**
 * Get a specific invoice by ID
 */
export async function getInvoice(invoiceId: string): Promise<Invoice | null> {
  const query = `
    query GetInvoice($invoiceId: String!) {
      invoice(invoiceId: $invoiceId) {
        id
        invoiceNumber
        paymentAccountId
        paymentAccount {
          id
          accountName
          accountNumber
          ownerName
        }
        recipientAccountType
        recipientAccountId
        recipientName
        recipientEmail
        recipientPhone
        amount
        currency
        description
        dueDate
        status
        paidAt
        metadata
        createdAt
        updatedAt
        lineItems {
          id
          description
          quantity
          unitPrice
          amount
        }
      }
    }
  `;

  const data = await graphql<{ invoice: Invoice | null }>(query, { invoiceId });
  return data.invoice;
}

/**
 * Get invoice by invoice number
 */
export async function getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | null> {
  const query = `
    query GetInvoiceByNumber($invoiceNumber: String!) {
      invoiceByNumber(invoiceNumber: $invoiceNumber) {
        id
        invoiceNumber
        paymentAccountId
        recipientAccountType
        recipientAccountId
        recipientName
        recipientEmail
        recipientPhone
        amount
        currency
        description
        dueDate
        status
        paidAt
        metadata
        createdAt
        updatedAt
      }
    }
  `;

  const data = await graphql<{ invoiceByNumber: Invoice | null }>(query, { invoiceNumber });
  return data.invoiceByNumber;
}

// ============================================================================
// Payment Transaction Queries
// ============================================================================

/**
 * Get payment transactions with optional filtering
 */
export async function getPaymentTransactions(
  filter?: PaymentTransactionFilter
): Promise<PaymentTransaction[]> {
  const query = `
    query GetPaymentTransactions(
      $paymentAccountId: String
      $status: String
      $paymentMethod: String
      $startDate: String
      $endDate: String
      $limit: Int
      $offset: Int
    ) {
      paymentTransactions(
        paymentAccountId: $paymentAccountId
        status: $status
        paymentMethod: $paymentMethod
        startDate: $startDate
        endDate: $endDate
        limit: $limit
        offset: $offset
      ) {
        id
        transactionReference
        paymentAccountId
        amount
        currency
        paymentMethod
        status
        description
        payerAccountType
        payerAccountId
        payerName
        payerPhone
        invoiceId
        externalTransactionId
        platformFee
        netAmount
        metadata
        failureReason
        completedAt
        createdAt
        updatedAt
      }
    }
  `;

  const data = await graphql<{ paymentTransactions: PaymentTransaction[] }>(query, filter);
  return data.paymentTransactions;
}

/**
 * Get a specific payment transaction by ID
 */
export async function getPaymentTransaction(transactionId: string): Promise<PaymentTransaction | null> {
  const query = `
    query GetPaymentTransaction($transactionId: String!) {
      paymentTransaction(transactionId: $transactionId) {
        id
        transactionReference
        paymentAccountId
        paymentAccount {
          id
          accountName
          accountNumber
          ownerName
        }
        amount
        currency
        paymentMethod
        status
        description
        payerAccountType
        payerAccountId
        payerName
        payerPhone
        invoiceId
        invoice {
          id
          invoiceNumber
          amount
          status
        }
        externalTransactionId
        platformFee
        netAmount
        metadata
        failureReason
        completedAt
        createdAt
        updatedAt
      }
    }
  `;

  const data = await graphql<{ paymentTransaction: PaymentTransaction | null }>(query, {
    transactionId,
  });
  return data.paymentTransaction;
}

/**
 * Get transaction by reference number
 */
export async function getTransactionByReference(reference: string): Promise<PaymentTransaction | null> {
  const query = `
    query GetTransactionByReference($reference: String!) {
      transactionByReference(reference: $reference) {
        id
        transactionReference
        paymentAccountId
        amount
        currency
        paymentMethod
        status
        description
        completedAt
        createdAt
      }
    }
  `;

  const data = await graphql<{ transactionByReference: PaymentTransaction | null }>(query, {
    reference,
  });
  return data.transactionByReference;
}

// ============================================================================
// Wallet Queries
// ============================================================================

/**
 * Get wallet balance for an account
 */
export async function getWalletBalance(
  accountType: string,
  accountId: string
): Promise<WalletBalance | null> {
  const query = `
    query GetWalletBalance($accountType: String!, $accountId: String!) {
      walletBalance(accountType: $accountType, accountId: $accountId) {
        accountType
        accountId
        accountName
        balance
        currency
      }
    }
  `;

  const data = await graphql<{ walletBalance: WalletBalance | null }>(query, {
    accountType,
    accountId,
  });
  return data.walletBalance;
}

/**
 * Get wallet transaction history
 */
export async function getWalletTransactions(
  filter: WalletTransactionFilter
): Promise<WalletTransaction[]> {
  const query = `
    query GetWalletTransactions(
      $accountType: String!
      $accountId: String!
      $transactionType: String
      $startDate: String
      $endDate: String
      $limit: Int
      $offset: Int
    ) {
      walletTransactions(
        accountType: $accountType
        accountId: $accountId
        transactionType: $transactionType
        startDate: $startDate
        endDate: $endDate
        limit: $limit
        offset: $offset
      ) {
        id
        walletId
        transactionType
        amount
        currency
        balance
        description
        relatedTransactionId
        metadata
        createdAt
      }
    }
  `;

  const data = await graphql<{ walletTransactions: WalletTransaction[] }>(query, filter);
  return data.walletTransactions;
}

/**
 * Lookup account by account number (for QR code payments)
 */
export async function lookupAccountByNumber(
  accountNumber: string
): Promise<AccountLookupResponse | null> {
  const query = `
    query LookupAccountByNumber($accountNumber: String!) {
      lookupAccountByNumber(accountNumber: $accountNumber) {
        accountType
        accountId
        accountName
        accountNumber
      }
    }
  `;

  const data = await graphql<{ lookupAccountByNumber: AccountLookupResponse | null }>(query, {
    accountNumber,
  });
  return data.lookupAccountByNumber;
}

// ============================================================================
// Analytics & Reports Queries
// ============================================================================

/**
 * Get payment statistics for an account or organization
 */
export async function getPaymentStatistics(
  paymentAccountId?: string,
  startDate?: string,
  endDate?: string
): Promise<PaymentStatistics> {
  const query = `
    query GetPaymentStatistics(
      $paymentAccountId: String
      $startDate: String
      $endDate: String
    ) {
      paymentStatistics(
        paymentAccountId: $paymentAccountId
        startDate: $startDate
        endDate: $endDate
      ) {
        totalCollected
        totalPending
        totalOverdue
        transactionCount
        successRate
        averageTransactionAmount
        currency
      }
    }
  `;

  const data = await graphql<{ paymentStatistics: PaymentStatistics }>(query, {
    paymentAccountId,
    startDate,
    endDate,
  });
  return data.paymentStatistics;
}

/**
 * Get payment analytics for a time period
 */
export async function getPaymentAnalytics(
  period: string,
  paymentAccountId?: string
): Promise<PaymentAnalytics> {
  const query = `
    query GetPaymentAnalytics($period: String!, $paymentAccountId: String) {
      paymentAnalytics(period: $period, paymentAccountId: $paymentAccountId) {
        period
        paymentsByMethod
        transactionVolume
        totalAmount
        successfulTransactions
        failedTransactions
      }
    }
  `;

  const data = await graphql<{ paymentAnalytics: PaymentAnalytics }>(query, {
    period,
    paymentAccountId,
  });
  return data.paymentAnalytics;
}

/**
 * Get arrears report for an account
 */
export async function getArrearsReport(paymentAccountId: string): Promise<ArrearsReport> {
  const query = `
    query GetArrearsReport($paymentAccountId: String!) {
      arrearsReport(paymentAccountId: $paymentAccountId) {
        id
        paymentAccountId
        paymentAccount {
          id
          accountName
          accountNumber
        }
        totalArrears
        overdueInvoices {
          id
          invoiceNumber
          amount
          dueDate
          status
          recipientName
          createdAt
        }
        generatedAt
      }
    }
  `;

  const data = await graphql<{ arrearsReport: ArrearsReport }>(query, { paymentAccountId });
  return data.arrearsReport;
}

/**
 * Get all arrears reports for the organization
 */
export async function getAllArrearsReports(): Promise<ArrearsReport[]> {
  const query = `
    query GetAllArrearsReports {
      allArrearsReports {
        id
        paymentAccountId
        paymentAccount {
          id
          accountName
          accountNumber
          ownerName
        }
        totalArrears
        generatedAt
      }
    }
  `;

  const data = await graphql<{ allArrearsReports: ArrearsReport[] }>(query);
  return data.allArrearsReports;
}
