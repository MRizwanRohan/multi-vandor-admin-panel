// ═══════════════════════════════════════════════════════════════════
// Payment Service — Matches AdminPaymentController endpoints
// ═══════════════════════════════════════════════════════════════════

import api, { getRolePrefix } from './api'
import type {
  PaymentTransaction,
  PaymentTransactionFilters,
  PaymentStatistics,
  PaymentRefund,
  RefundFilters,
  CreateRefundRequest,
  WebhookEvent,
  WebhookFilters,
} from '@/types/payment'

const prefix = () => `${getRolePrefix()}/payments`

// ─────────────────────────────────────────────────────────────────
// Payment Transaction Service
// ─────────────────────────────────────────────────────────────────

export const paymentService = {
  /**
   * Get paginated payment transactions
   * GET /admin/payments/transactions
   */
  async getTransactions(filters?: PaymentTransactionFilters) {
    const response = await api.get<{ data: { transactions: PaymentTransaction[]; pagination: any } }>(
      `${prefix()}/transactions`,
      { params: filters }
    )
    return response.data.data
  },

  /**
   * Get single payment transaction with full details
   * GET /admin/payments/transactions/{id}
   */
  async getTransaction(id: number): Promise<PaymentTransaction> {
    const response = await api.get<{ data: PaymentTransaction }>(`${prefix()}/transactions/${id}`)
    return response.data.data
  },

  /**
   * Get payment statistics
   * GET /admin/payments/statistics
   */
  async getStatistics(params?: { from_date?: string; to_date?: string }): Promise<PaymentStatistics> {
    const response = await api.get<{ data: PaymentStatistics }>(`${prefix()}/statistics`, { params })
    return response.data.data
  },

  /**
   * Export transactions to CSV/Excel
   * GET /admin/payments/transactions/export
   */
  async exportTransactions(filters?: PaymentTransactionFilters & { format?: 'xlsx' | 'csv' }): Promise<Blob> {
    const response = await api.get(`${prefix()}/transactions/export`, {
      params: filters,
      responseType: 'blob',
    })
    return response.data
  },

  /**
   * Cancel a pending payment
   * POST /admin/payments/transactions/{id}/cancel
   */
  async cancelPayment(id: number, reason?: string): Promise<PaymentTransaction> {
    const response = await api.post<{ data: PaymentTransaction }>(
      `${prefix()}/transactions/${id}/cancel`,
      { reason }
    )
    return response.data.data
  },
}

// ─────────────────────────────────────────────────────────────────
// Refund Service
// ─────────────────────────────────────────────────────────────────

export const refundService = {
  /**
   * Get paginated refunds
   * GET /admin/payments/refunds
   */
  async getAll(filters?: RefundFilters) {
    const response = await api.get<{ data: { refunds: PaymentRefund[]; pagination: any } }>(
      `${prefix()}/refunds`,
      { params: filters }
    )
    return response.data.data
  },

  /**
   * Process a refund
   * POST /admin/payments/refunds
   */
  async create(data: CreateRefundRequest): Promise<{ refund: any; payment: PaymentTransaction }> {
    const response = await api.post<{ data: { refund: any; payment: PaymentTransaction } }>(
      `${prefix()}/refunds`,
      data
    )
    return response.data.data
  },
}

// ─────────────────────────────────────────────────────────────────
// Webhook Service
// ─────────────────────────────────────────────────────────────────

export const webhookService = {
  /**
   * Get paginated webhook logs
   * GET /admin/payments/webhook-logs
   */
  async getAll(filters?: WebhookFilters) {
    const response = await api.get<{ data: { webhook_logs: WebhookEvent[]; pagination: any } }>(
      `${prefix()}/webhook-logs`,
      { params: filters }
    )
    return response.data.data
  },
}
