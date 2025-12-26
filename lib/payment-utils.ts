/**
 * Payment Utilities
 * Centralized payment-specific functions to prevent code duplication
 */

import { Badge } from '@/app/components/badge';

/**
 * Payment status types
 */
export type PaymentStatus =
  | 'pending'
  | 'completed'
  | 'failed'
  | 'processing'
  | 'cancelled'
  | 'refunded';

/**
 * Invoice status types
 */
export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'paid'
  | 'overdue'
  | 'cancelled'
  | 'partially_paid';

/**
 * Payment method types
 */
export type PaymentMethod =
  | 'MPESA'
  | 'CARD'
  | 'BANK_ACCOUNT'
  | 'CASH'
  | 'CHEQUE';

/**
 * Get badge color for payment status
 * @param status - Payment status
 * @returns Badge color string
 */
export function getPaymentStatusColor(status: PaymentStatus): 'zinc' | 'green' | 'red' | 'yellow' | 'blue' {
  switch (status) {
    case 'completed':
    case 'refunded':
      return 'green';
    case 'failed':
    case 'cancelled':
      return 'red';
    case 'pending':
      return 'yellow';
    case 'processing':
      return 'blue';
    default:
      return 'zinc';
  }
}

/**
 * Get display label for payment status
 * @param status - Payment status
 * @returns Human-readable status label
 */
export function getPaymentStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    case 'processing':
      return 'Processing';
    case 'cancelled':
      return 'Cancelled';
    case 'refunded':
      return 'Refunded';
    default:
      return 'Unknown';
  }
}

/**
 * Get badge color for invoice status
 * @param status - Invoice status
 * @returns Badge color string
 */
export function getInvoiceStatusColor(status: InvoiceStatus): 'zinc' | 'green' | 'red' | 'yellow' | 'blue' {
  switch (status) {
    case 'paid':
      return 'green';
    case 'overdue':
    case 'cancelled':
      return 'red';
    case 'sent':
    case 'partially_paid':
      return 'yellow';
    case 'draft':
      return 'zinc';
    default:
      return 'zinc';
  }
}

/**
 * Get display label for invoice status
 * @param status - Invoice status
 * @returns Human-readable status label
 */
export function getInvoiceStatusLabel(status: InvoiceStatus): string {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'sent':
      return 'Sent';
    case 'paid':
      return 'Paid';
    case 'overdue':
      return 'Overdue';
    case 'cancelled':
      return 'Cancelled';
    case 'partially_paid':
      return 'Partially Paid';
    default:
      return 'Unknown';
  }
}

/**
 * Get icon for payment method
 * @param method - Payment method
 * @returns Icon emoji
 */
export function getPaymentMethodIcon(method: PaymentMethod): string {
  switch (method) {
    case 'MPESA':
      return '📱';
    case 'CARD':
      return '💳';
    case 'BANK_ACCOUNT':
      return '🏦';
    case 'CASH':
      return '💵';
    case 'CHEQUE':
      return '📝';
    default:
      return '💰';
  }
}

/**
 * Get display label for payment method
 * @param method - Payment method
 * @returns Human-readable method label
 */
export function getPaymentMethodLabel(method: PaymentMethod): string {
  switch (method) {
    case 'MPESA':
      return 'M-Pesa';
    case 'CARD':
      return 'Card Payment';
    case 'BANK_ACCOUNT':
      return 'Bank Transfer';
    case 'CASH':
      return 'Cash';
    case 'CHEQUE':
      return 'Cheque';
    default:
      return 'Unknown';
  }
}

/**
 * Get color for payment method (for UI display)
 * @param method - Payment method
 * @returns Tailwind color class
 */
export function getPaymentMethodColor(method: PaymentMethod): string {
  switch (method) {
    case 'MPESA':
      return 'text-green-600';
    case 'CARD':
      return 'text-blue-600';
    case 'BANK_ACCOUNT':
      return 'text-purple-600';
    case 'CASH':
      return 'text-yellow-600';
    case 'CHEQUE':
      return 'text-gray-600';
    default:
      return 'text-gray-600';
  }
}

/**
 * Calculate platform fee from amount
 * @param amount - Transaction amount
 * @param feePercentage - Fee percentage (e.g., 2.5 for 2.5%)
 * @returns Fee amount
 */
export function calculatePlatformFee(amount: number, feePercentage: number = 2.5): number {
  if (isNaN(amount) || amount <= 0) return 0;
  return parseFloat((amount * (feePercentage / 100)).toFixed(2));
}

/**
 * Calculate net amount after deducting fee
 * @param amount - Gross amount
 * @param fee - Fee amount
 * @returns Net amount
 */
export function calculateNetAmount(amount: number, fee: number): number {
  if (isNaN(amount) || isNaN(fee)) return 0;
  return parseFloat((amount - fee).toFixed(2));
}

/**
 * Validate payment amount
 * @param amount - Amount to validate
 * @param min - Minimum allowed amount (default: 1)
 * @param max - Maximum allowed amount (optional)
 * @returns Validation result object
 */
export function validatePaymentAmount(
  amount: string | number,
  min: number = 1,
  max?: number
): { valid: boolean; error?: string } {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return { valid: false, error: 'Please enter a valid amount' };
  }

  if (numAmount < min) {
    return { valid: false, error: `Minimum amount is ${min}` };
  }

  if (max !== undefined && numAmount > max) {
    return { valid: false, error: `Maximum amount is ${max}` };
  }

  return { valid: true };
}

/**
 * Format transaction reference for display
 * @param ref - Transaction reference
 * @returns Formatted reference
 */
export function formatTransactionReference(ref: string): string {
  if (!ref) return 'N/A';

  // If reference is too long, show first 8 and last 4 characters
  if (ref.length > 20) {
    return `${ref.substring(0, 8)}...${ref.substring(ref.length - 4)}`;
  }

  return ref;
}

/**
 * Generate unique transaction reference
 * @param prefix - Reference prefix (e.g., 'INV', 'PAY', 'TOPUP')
 * @returns Unique reference string
 */
export function generateTransactionReference(prefix: string = 'TXN'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Validate M-Pesa phone number format
 * @param phone - Phone number to validate
 * @returns Validation result object
 */
export function validateMpesaPhone(phone: string): { valid: boolean; error?: string } {
  if (!phone) {
    return { valid: false, error: 'Phone number is required' };
  }

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Check for Kenya format: 254XXXXXXXXX (12 digits total)
  const phoneRegex = /^254[0-9]{9}$/;
  if (!phoneRegex.test(cleaned)) {
    return {
      valid: false,
      error: 'Phone number must be in format: 254XXXXXXXXX'
    };
  }

  return { valid: true };
}

/**
 * Format M-Pesa phone number to standard format
 * @param phone - Phone number to format
 * @returns Formatted phone number or null if invalid
 */
export function formatMpesaPhone(phone: string): string | null {
  if (!phone) return null;

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // If starts with 0, replace with 254
  if (cleaned.startsWith('0')) {
    const formatted = `254${cleaned.substring(1)}`;
    return validateMpesaPhone(formatted).valid ? formatted : null;
  }

  // If starts with 254, validate and return
  if (cleaned.startsWith('254')) {
    return validateMpesaPhone(cleaned).valid ? cleaned : null;
  }

  // Otherwise, add 254 prefix
  const formatted = `254${cleaned}`;
  return validateMpesaPhone(formatted).valid ? formatted : null;
}

/**
 * Get transaction type label based on description or type
 * @param type - Transaction type or description
 * @returns Human-readable label
 */
export function getTransactionTypeLabel(type: string): string {
  const lowerType = type.toLowerCase();

  if (lowerType.includes('topup') || lowerType.includes('top-up') || lowerType.includes('deposit')) {
    return 'Wallet Top-Up';
  }
  if (lowerType.includes('invoice')) {
    return 'Invoice Payment';
  }
  if (lowerType.includes('fee')) {
    return 'Fee Payment';
  }
  if (lowerType.includes('tithe')) {
    return 'Tithe';
  }
  if (lowerType.includes('offering')) {
    return 'Offering';
  }
  if (lowerType.includes('rent')) {
    return 'Rent Payment';
  }
  if (lowerType.includes('refund')) {
    return 'Refund';
  }
  if (lowerType.includes('withdrawal')) {
    return 'Withdrawal';
  }

  return 'Transaction';
}

/**
 * Check if transaction is a credit (incoming money)
 * @param type - Transaction type or description
 * @returns True if credit, false if debit
 */
export function isTransactionCredit(type: string): boolean {
  const lowerType = type.toLowerCase();
  return (
    lowerType.includes('topup') ||
    lowerType.includes('top-up') ||
    lowerType.includes('deposit') ||
    lowerType.includes('refund') ||
    lowerType.includes('payment received') ||
    lowerType.includes('income')
  );
}

/**
 * Calculate percentage completion for partial payments
 * @param paidAmount - Amount already paid
 * @param totalAmount - Total amount due
 * @returns Percentage (0-100)
 */
export function calculatePaymentProgress(paidAmount: number, totalAmount: number): number {
  if (totalAmount <= 0) return 0;
  const percentage = (paidAmount / totalAmount) * 100;
  return Math.min(Math.max(percentage, 0), 100); // Clamp between 0-100
}

/**
 * Get payment gateway display name
 * @param gateway - Gateway identifier
 * @returns Display name
 */
export function getPaymentGatewayName(gateway: string): string {
  const lowerGateway = gateway.toLowerCase();

  if (lowerGateway.includes('mpesa')) return 'M-Pesa';
  if (lowerGateway.includes('flutterwave')) return 'Flutterwave';
  if (lowerGateway.includes('intasend')) return 'IntaSend';
  if (lowerGateway.includes('paypal')) return 'PayPal';
  if (lowerGateway.includes('stripe')) return 'Stripe';

  return gateway;
}

/**
 * Determine if a payment requires immediate action
 * @param status - Payment status
 * @param createdAt - Creation timestamp
 * @returns True if action needed
 */
export function requiresPaymentAction(status: PaymentStatus, createdAt: Date | string): boolean {
  if (status === 'completed' || status === 'cancelled' || status === 'refunded') {
    return false;
  }

  // If pending for more than 10 minutes, requires attention
  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  const now = new Date();
  const diffMinutes = (now.getTime() - created.getTime()) / (1000 * 60);

  return status === 'pending' && diffMinutes > 10;
}
