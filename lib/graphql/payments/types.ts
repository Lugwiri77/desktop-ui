// Payment System Types - matches backend GraphQL schema

// ============================================================================
// Enums
// ============================================================================

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  MPESA = 'MPESA',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CARD = 'CARD',
  CASH = 'CASH',
  WALLET = 'WALLET',
  AIRTEL_MONEY = 'AIRTEL_MONEY',
}

export enum TransactionType {
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
  WITHDRAWAL = 'WITHDRAWAL',
  DEPOSIT = 'DEPOSIT',
  TRANSFER = 'TRANSFER',
  FEE = 'FEE',
}

export enum AccountType {
  PERSONAL = 'PERSONAL',
  BUSINESS = 'BUSINESS',
  INSTITUTION = 'INSTITUTION',
}

export enum PaymentAccountOwnerType {
  BUSINESS = 'BUSINESS',
  INSTITUTION = 'INSTITUTION',
  PROPERTY = 'PROPERTY',
  LOCATION = 'LOCATION',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

// ============================================================================
// Payment Account Types
// ============================================================================

export interface PaymentAccount {
  id: string;
  accountName: string;
  accountNumber: string;
  currency: string;
  balance: string;
  ownerType: PaymentAccountOwnerType;
  ownerId: string;
  ownerName?: string;
  isActive: boolean;
  metadata?: string; // JSON string
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentAccountInput {
  accountName: string;
  currency: string;
  ownerType: PaymentAccountOwnerType;
  ownerId: string;
  metadata?: string;
}

export interface UpdatePaymentAccountInput {
  accountId: string;
  accountName?: string;
  isActive?: boolean;
  metadata?: string;
}

// ============================================================================
// Invoice Types
// ============================================================================

export interface Invoice {
  id: string;
  invoiceNumber: string;
  paymentAccountId: string;
  paymentAccount?: PaymentAccount;
  recipientAccountType: AccountType;
  recipientAccountId: string;
  recipientName?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  amount: string;
  currency: string;
  description?: string;
  dueDate?: string;
  status: InvoiceStatus;
  lineItems?: InvoiceLineItem[];
  paidAt?: string;
  metadata?: string; // JSON string
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: string;
  amount: string;
}

export interface CreateInvoiceInput {
  paymentAccountId: string;
  recipientAccountType: AccountType;
  recipientAccountId: string;
  recipientName?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  amount: string;
  currency: string;
  description?: string;
  dueDate?: string;
  lineItems?: CreateInvoiceLineItemInput[];
  metadata?: string;
}

export interface CreateInvoiceLineItemInput {
  description: string;
  quantity: number;
  unitPrice: string;
}

export interface UpdateInvoiceInput {
  invoiceId: string;
  description?: string;
  dueDate?: string;
  status?: InvoiceStatus;
  metadata?: string;
}

// ============================================================================
// Payment Transaction Types
// ============================================================================

export interface PaymentTransaction {
  id: string;
  transactionReference: string;
  paymentAccountId: string;
  paymentAccount?: PaymentAccount;
  amount: string;
  currency: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  description?: string;
  payerAccountType?: AccountType;
  payerAccountId?: string;
  payerName?: string;
  payerPhone?: string;
  invoiceId?: string;
  invoice?: Invoice;
  externalTransactionId?: string;
  platformFee?: string;
  netAmount?: string;
  metadata?: string; // JSON string
  failureReason?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentTransactionInput {
  paymentAccountId: string;
  amount: string;
  currency: string;
  paymentMethod: PaymentMethod;
  description?: string;
  payerAccountType?: AccountType;
  payerAccountId?: string;
  payerName?: string;
  payerPhone?: string;
  invoiceId?: string;
  externalTransactionId?: string;
  metadata?: string;
}

export interface UpdatePaymentTransactionInput {
  transactionId: string;
  status?: PaymentStatus;
  externalTransactionId?: string;
  platformFee?: string;
  netAmount?: string;
  failureReason?: string;
  completedAt?: string;
  metadata?: string;
}

// ============================================================================
// Wallet Types
// ============================================================================

export interface WalletBalance {
  accountType: AccountType;
  accountId: string;
  accountName: string;
  balance: string;
  currency: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  transactionType: TransactionType;
  amount: string;
  currency: string;
  balance: string;
  description?: string;
  relatedTransactionId?: string;
  metadata?: string; // JSON string
  createdAt: string;
}

export interface AccountLookupResponse {
  accountType: AccountType;
  accountId: string;
  accountName: string;
  accountNumber: string;
}

export interface TopUpWalletInput {
  accountType: AccountType;
  accountId: string;
  amount: string;
  paymentMethod: PaymentMethod;
  phoneNumber?: string;
}

export interface WalletToWalletTransferInput {
  sourceAccountType: AccountType;
  sourceAccountId: string;
  destinationAccountNumber: string;
  amount: string;
  description?: string;
}

// ============================================================================
// Arrears & Analytics Types
// ============================================================================

export interface ArrearsReport {
  id: string;
  paymentAccountId: string;
  paymentAccount?: PaymentAccount;
  totalArrears: string;
  overdueInvoices: Invoice[];
  generatedAt: string;
}

export interface PaymentStatistics {
  totalCollected: string;
  totalPending: string;
  totalOverdue: string;
  transactionCount: number;
  successRate: number;
  averageTransactionAmount: string;
  currency: string;
}

export interface PaymentAnalytics {
  period: string; // e.g., "2024-01", "2024-Q1"
  paymentsByMethod: Record<PaymentMethod, string>;
  transactionVolume: number;
  totalAmount: string;
  successfulTransactions: number;
  failedTransactions: number;
}

// ============================================================================
// Query Filter Types
// ============================================================================

export interface PaymentTransactionFilter {
  paymentAccountId?: string;
  status?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface InvoiceFilter {
  paymentAccountId?: string;
  status?: InvoiceStatus;
  recipientAccountType?: AccountType;
  recipientAccountId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface WalletTransactionFilter {
  accountType: AccountType;
  accountId: string;
  transactionType?: TransactionType;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// Response Payload Types
// ============================================================================

export interface PaymentAccountPayload {
  success: boolean;
  message: string;
  paymentAccount?: PaymentAccount;
}

export interface InvoicePayload {
  success: boolean;
  message: string;
  invoice?: Invoice;
}

export interface PaymentTransactionPayload {
  success: boolean;
  message: string;
  transaction?: PaymentTransaction;
}

export interface WalletPayload {
  success: boolean;
  message: string;
  balance?: string;
  transactionId?: string;
}

export interface PaymentInitiationResponse {
  success: boolean;
  message: string;
  transactionReference?: string;
  checkoutRequestId?: string; // For M-Pesa STK Push
  paymentLink?: string; // For card payments
}
