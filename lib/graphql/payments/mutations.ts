import { graphql } from '@/lib/graphql';
import type {
  CreatePaymentAccountInput,
  UpdatePaymentAccountInput,
  CreateInvoiceInput,
  UpdateInvoiceInput,
  CreatePaymentTransactionInput,
  UpdatePaymentTransactionInput,
  TopUpWalletInput,
  WalletToWalletTransferInput,
  PaymentAccountPayload,
  InvoicePayload,
  PaymentTransactionPayload,
  WalletPayload,
  PaymentInitiationResponse,
} from './types';

// ============================================================================
// Payment Account Mutations
// ============================================================================

/**
 * Create a new payment account
 */
export async function createPaymentAccount(
  input: CreatePaymentAccountInput
): Promise<PaymentAccountPayload> {
  const mutation = `
    mutation CreatePaymentAccount($input: CreatePaymentAccountInput!) {
      createPaymentAccount(input: $input) {
        success
        message
        paymentAccount {
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
    }
  `;

  const data = await graphql<{ createPaymentAccount: PaymentAccountPayload }>(mutation, { input });
  return data.createPaymentAccount;
}

/**
 * Update an existing payment account
 */
export async function updatePaymentAccount(
  input: UpdatePaymentAccountInput
): Promise<PaymentAccountPayload> {
  const mutation = `
    mutation UpdatePaymentAccount($input: UpdatePaymentAccountInput!) {
      updatePaymentAccount(input: $input) {
        success
        message
        paymentAccount {
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
    }
  `;

  const data = await graphql<{ updatePaymentAccount: PaymentAccountPayload }>(mutation, { input });
  return data.updatePaymentAccount;
}

/**
 * Delete a payment account
 */
export async function deletePaymentAccount(accountId: string): Promise<PaymentAccountPayload> {
  const mutation = `
    mutation DeletePaymentAccount($accountId: String!) {
      deletePaymentAccount(accountId: $accountId) {
        success
        message
      }
    }
  `;

  const data = await graphql<{ deletePaymentAccount: PaymentAccountPayload }>(mutation, {
    accountId,
  });
  return data.deletePaymentAccount;
}

// ============================================================================
// Invoice Mutations
// ============================================================================

/**
 * Create a new invoice
 */
export async function createInvoice(input: CreateInvoiceInput): Promise<InvoicePayload> {
  const mutation = `
    mutation CreateInvoice($input: CreateInvoiceInput!) {
      createInvoice(input: $input) {
        success
        message
        invoice {
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
    }
  `;

  const data = await graphql<{ createInvoice: InvoicePayload }>(mutation, { input });
  return data.createInvoice;
}

/**
 * Update an existing invoice
 */
export async function updateInvoice(input: UpdateInvoiceInput): Promise<InvoicePayload> {
  const mutation = `
    mutation UpdateInvoice($input: UpdateInvoiceInput!) {
      updateInvoice(input: $input) {
        success
        message
        invoice {
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
    }
  `;

  const data = await graphql<{ updateInvoice: InvoicePayload }>(mutation, { input });
  return data.updateInvoice;
}

/**
 * Cancel an invoice
 */
export async function cancelInvoice(invoiceId: string): Promise<InvoicePayload> {
  const mutation = `
    mutation CancelInvoice($invoiceId: String!) {
      cancelInvoice(invoiceId: $invoiceId) {
        success
        message
        invoice {
          id
          invoiceNumber
          status
          updatedAt
        }
      }
    }
  `;

  const data = await graphql<{ cancelInvoice: InvoicePayload }>(mutation, { invoiceId });
  return data.cancelInvoice;
}

/**
 * Generate invoice PDF
 */
export async function generateInvoicePDF(invoiceId: string): Promise<{ success: boolean; pdfUrl?: string }> {
  const mutation = `
    mutation GenerateInvoicePDF($invoiceId: String!) {
      generateInvoicePDF(invoiceId: $invoiceId) {
        success
        pdfUrl
      }
    }
  `;

  const data = await graphql<{ generateInvoicePDF: { success: boolean; pdfUrl?: string } }>(
    mutation,
    { invoiceId }
  );
  return data.generateInvoicePDF;
}

// ============================================================================
// Payment Transaction Mutations
// ============================================================================

/**
 * Create a new payment transaction (record payment)
 */
export async function createPaymentTransaction(
  input: CreatePaymentTransactionInput
): Promise<PaymentTransactionPayload> {
  const mutation = `
    mutation CreatePaymentTransaction($input: CreatePaymentTransactionInput!) {
      createPaymentTransaction(input: $input) {
        success
        message
        transaction {
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
          completedAt
          createdAt
          updatedAt
        }
      }
    }
  `;

  const data = await graphql<{ createPaymentTransaction: PaymentTransactionPayload }>(mutation, {
    input,
  });
  return data.createPaymentTransaction;
}

/**
 * Update payment transaction status
 */
export async function updatePaymentTransaction(
  input: UpdatePaymentTransactionInput
): Promise<PaymentTransactionPayload> {
  const mutation = `
    mutation UpdatePaymentTransaction($input: UpdatePaymentTransactionInput!) {
      updatePaymentTransaction(input: $input) {
        success
        message
        transaction {
          id
          transactionReference
          status
          platformFee
          netAmount
          failureReason
          completedAt
          updatedAt
        }
      }
    }
  `;

  const data = await graphql<{ updatePaymentTransaction: PaymentTransactionPayload }>(mutation, {
    input,
  });
  return data.updatePaymentTransaction;
}

/**
 * Refund a payment transaction
 */
export async function refundPaymentTransaction(
  transactionId: string,
  reason?: string
): Promise<PaymentTransactionPayload> {
  const mutation = `
    mutation RefundPaymentTransaction($transactionId: String!, $reason: String) {
      refundPaymentTransaction(transactionId: $transactionId, reason: $reason) {
        success
        message
        transaction {
          id
          transactionReference
          status
          updatedAt
        }
      }
    }
  `;

  const data = await graphql<{ refundPaymentTransaction: PaymentTransactionPayload }>(mutation, {
    transactionId,
    reason,
  });
  return data.refundPaymentTransaction;
}

// ============================================================================
// Payment Gateway Mutations
// ============================================================================

/**
 * Initiate M-Pesa STK Push payment
 */
export async function initiateMpesaPayment(
  invoiceId: string,
  phoneNumber: string
): Promise<PaymentInitiationResponse> {
  const mutation = `
    mutation InitiateMpesaPayment($invoiceId: String!, $phoneNumber: String!) {
      initiateMpesaPayment(invoiceId: $invoiceId, phoneNumber: $phoneNumber) {
        success
        message
        transactionReference
        checkoutRequestId
      }
    }
  `;

  const data = await graphql<{ initiateMpesaPayment: PaymentInitiationResponse }>(mutation, {
    invoiceId,
    phoneNumber,
  });
  return data.initiateMpesaPayment;
}

/**
 * Initiate Flutterwave card payment
 */
export async function initiateFlutterwavePayment(
  invoiceId: string,
  redirectUrl: string
): Promise<PaymentInitiationResponse> {
  const mutation = `
    mutation InitiateFlutterwavePayment($invoiceId: String!, $redirectUrl: String!) {
      initiateFlutterwavePayment(invoiceId: $invoiceId, redirectUrl: $redirectUrl) {
        success
        message
        transactionReference
        paymentLink
      }
    }
  `;

  const data = await graphql<{ initiateFlutterwavePayment: PaymentInitiationResponse }>(mutation, {
    invoiceId,
    redirectUrl,
  });
  return data.initiateFlutterwavePayment;
}

/**
 * Initiate IntaSend payment (bank transfer or card)
 */
export async function initiateIntaSendPayment(
  invoiceId: string,
  paymentMethod: 'CARD' | 'BANK_TRANSFER',
  redirectUrl: string
): Promise<PaymentInitiationResponse> {
  const mutation = `
    mutation InitiateIntaSendPayment(
      $invoiceId: String!
      $paymentMethod: String!
      $redirectUrl: String!
    ) {
      initiateIntaSendPayment(
        invoiceId: $invoiceId
        paymentMethod: $paymentMethod
        redirectUrl: $redirectUrl
      ) {
        success
        message
        transactionReference
        paymentLink
      }
    }
  `;

  const data = await graphql<{ initiateIntaSendPayment: PaymentInitiationResponse }>(mutation, {
    invoiceId,
    paymentMethod,
    redirectUrl,
  });
  return data.initiateIntaSendPayment;
}

// ============================================================================
// Wallet Mutations
// ============================================================================

/**
 * Top up wallet balance
 */
export async function topUpWallet(input: TopUpWalletInput): Promise<WalletPayload> {
  const mutation = `
    mutation TopUpWallet($input: TopUpWalletInput!) {
      topUpWallet(input: $input) {
        success
        message
        balance
        transactionId
      }
    }
  `;

  const data = await graphql<{ topUpWallet: WalletPayload }>(mutation, { input });
  return data.topUpWallet;
}

/**
 * Transfer funds from one wallet to another
 */
export async function walletToWalletTransfer(
  input: WalletToWalletTransferInput
): Promise<WalletPayload> {
  const mutation = `
    mutation WalletToWalletTransfer($input: WalletToWalletTransferInput!) {
      walletToWalletTransfer(input: $input) {
        success
        message
        balance
        transactionId
      }
    }
  `;

  const data = await graphql<{ walletToWalletTransfer: WalletPayload }>(mutation, { input });
  return data.walletToWalletTransfer;
}

/**
 * Pay invoice using wallet balance
 */
export async function payInvoiceWithWallet(
  invoiceId: string,
  accountType: string,
  accountId: string
): Promise<PaymentTransactionPayload> {
  const mutation = `
    mutation PayInvoiceWithWallet(
      $invoiceId: String!
      $accountType: String!
      $accountId: String!
    ) {
      payInvoiceWithWallet(
        invoiceId: $invoiceId
        accountType: $accountType
        accountId: $accountId
      ) {
        success
        message
        transaction {
          id
          transactionReference
          amount
          currency
          status
          completedAt
          createdAt
        }
      }
    }
  `;

  const data = await graphql<{ payInvoiceWithWallet: PaymentTransactionPayload }>(mutation, {
    invoiceId,
    accountType,
    accountId,
  });
  return data.payInvoiceWithWallet;
}

// ============================================================================
// Reconciliation Mutations
// ============================================================================

/**
 * Reconcile payment transaction with external payment
 */
export async function reconcilePayment(
  transactionId: string,
  externalTransactionId: string,
  platformFee?: string,
  netAmount?: string
): Promise<PaymentTransactionPayload> {
  const mutation = `
    mutation ReconcilePayment(
      $transactionId: String!
      $externalTransactionId: String!
      $platformFee: String
      $netAmount: String
    ) {
      reconcilePayment(
        transactionId: $transactionId
        externalTransactionId: $externalTransactionId
        platformFee: $platformFee
        netAmount: $netAmount
      ) {
        success
        message
        transaction {
          id
          transactionReference
          externalTransactionId
          platformFee
          netAmount
          status
          updatedAt
        }
      }
    }
  `;

  const data = await graphql<{ reconcilePayment: PaymentTransactionPayload }>(mutation, {
    transactionId,
    externalTransactionId,
    platformFee,
    netAmount,
  });
  return data.reconcilePayment;
}

/**
 * Bulk reconcile payments from CSV
 */
export async function bulkReconcilePayments(
  csvData: string
): Promise<{ success: boolean; reconciledCount: number; failedCount: number; message: string }> {
  const mutation = `
    mutation BulkReconcilePayments($csvData: String!) {
      bulkReconcilePayments(csvData: $csvData) {
        success
        reconciledCount
        failedCount
        message
      }
    }
  `;

  const data = await graphql<{
    bulkReconcilePayments: {
      success: boolean;
      reconciledCount: number;
      failedCount: number;
      message: string;
    };
  }>(mutation, { csvData });
  return data.bulkReconcilePayments;
}

/**
 * Generate arrears report for an account
 */
export async function generateArrearsReport(paymentAccountId: string): Promise<{
  success: boolean;
  message: string;
  reportId?: string;
}> {
  const mutation = `
    mutation GenerateArrearsReport($paymentAccountId: String!) {
      generateArrearsReport(paymentAccountId: $paymentAccountId) {
        success
        message
        reportId
      }
    }
  `;

  const data = await graphql<{
    generateArrearsReport: { success: boolean; message: string; reportId?: string };
  }>(mutation, { paymentAccountId });
  return data.generateArrearsReport;
}
