// ═══════════════════════════════════════════════════════════════════
// Payment Service — Payment Gateway Interface (Strategy Pattern)
// Handles Stripe, PayPal, SSLCommerz integrations via backend API
// ═══════════════════════════════════════════════════════════════════

import api, { getRolePrefix } from './api'
import type { PaginatedResponse } from '@/types'
import type {
  PaymentTransaction,
  PaymentTransactionDetail,
  PaymentTransactionFilters,
  PaymentStatistics,
  PaymentGatewayConfig,
  PaymentRefund,
  RefundFilters,
  RefundStatistics,
  CreateRefundRequest,
  WebhookEvent,
  WebhookFilters,
  WebhookStatistics,
  InitiatePaymentRequest,
  InitiatePaymentResponse,
} from '@/types/payment'

const prefix = () => `${getRolePrefix()}/payments`

// ─────────────────────────────────────────────────────────────────
// Payment Transaction Service
// ─────────────────────────────────────────────────────────────────

export const paymentService = {
  // ── Gateway Configuration ──

  /**
   * Get all payment gateway configurations
   */
  async getGateways(): Promise<PaymentGatewayConfig[]> {
    const response = await api.get<{ data: PaymentGatewayConfig[] }>(`${prefix()}/gateways`)
    return response.data.data
  },

  /**
   * Get single gateway config
   */
  async getGateway(gateway: string): Promise<PaymentGatewayConfig> {
    const response = await api.get<{ data: PaymentGatewayConfig }>(`${prefix()}/gateways/${gateway}`)
    return response.data.data
  },

  /**
   * Update gateway configuration (admin only)
   */
  async updateGateway(gateway: string, data: Partial<PaymentGatewayConfig>): Promise<PaymentGatewayConfig> {
    const response = await api.put<{ data: PaymentGatewayConfig }>(`${prefix()}/gateways/${gateway}`, data)
    return response.data.data
  },

  /**
   * Toggle gateway enabled/disabled
   */
  async toggleGateway(gateway: string, enabled: boolean): Promise<PaymentGatewayConfig> {
    const response = await api.patch<{ data: PaymentGatewayConfig }>(`${prefix()}/gateways/${gateway}/toggle`, {
      is_enabled: enabled,
    })
    return response.data.data
  },

  /**
   * Test gateway connection (admin only)
   */
  async testGatewayConnection(gateway: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post<{ success: boolean; message: string }>(
      `${prefix()}/gateways/${gateway}/test`
    )
    return response.data
  },

  // ── Payment Transactions ──

  /**
   * Get paginated payment transactions
   */
  async getTransactions(filters?: PaymentTransactionFilters): Promise<PaginatedResponse<PaymentTransaction>> {
    const response = await api.get<PaginatedResponse<PaymentTransaction>>(`${prefix()}/transactions`, {
      params: filters,
    })
    return response.data
  },

  /**
   * Get single payment transaction with full details
   */
  async getTransaction(id: number): Promise<PaymentTransactionDetail> {
    const response = await api.get<{ data: PaymentTransactionDetail }>(`${prefix()}/transactions/${id}`)
    return response.data.data
  },

  /**
   * Get payment statistics
   */
  async getStatistics(params?: { date_from?: string; date_to?: string }): Promise<PaymentStatistics> {
    const response = await api.get<{ data: PaymentStatistics }>(`${prefix()}/statistics`, { params })
    return response.data.data
  },

  /**
   * Export transactions
   */
  async exportTransactions(filters?: PaymentTransactionFilters): Promise<Blob> {
    const response = await api.get(`${prefix()}/transactions/export`, {
      params: filters,
      responseType: 'blob',
    })
    return response.data
  },

  // ── Payment Initiation (Strategy Pattern — gateway selected at runtime) ──

  /**
   * Initiate payment for an order
   * Backend uses Strategy Pattern to route to correct gateway (Stripe/PayPal/SSLCommerz)
   */
  async initiatePayment(data: InitiatePaymentRequest): Promise<InitiatePaymentResponse> {
    const response = await api.post<{ data: InitiatePaymentResponse }>(`${prefix()}/initiate`, data)
    return response.data.data
  },

  /**
   * Confirm payment (for gateway callbacks)
   */
  async confirmPayment(transactionId: string, data?: Record<string, unknown>): Promise<PaymentTransaction> {
    const response = await api.post<{ data: PaymentTransaction }>(
      `${prefix()}/confirm/${transactionId}`,
      data
    )
    return response.data.data
  },

  /**
   * Cancel a pending payment
   */
  async cancelPayment(transactionId: number, reason?: string): Promise<PaymentTransaction> {
    const response = await api.post<{ data: PaymentTransaction }>(
      `${prefix()}/transactions/${transactionId}/cancel`,
      { reason }
    )
    return response.data.data
  },

  /**
   * Retry a failed payment
   */
  async retryPayment(transactionId: number): Promise<InitiatePaymentResponse> {
    const response = await api.post<{ data: InitiatePaymentResponse }>(
      `${prefix()}/transactions/${transactionId}/retry`
    )
    return response.data.data
  },

  // ── Stripe-specific Methods ──

  /**
   * Create Stripe checkout session
   */
  async createStripeSession(orderId: number, returnUrl?: string): Promise<{ session_id: string; url: string }> {
    const response = await api.post<{ data: { session_id: string; url: string } }>(
      `${prefix()}/stripe/checkout-session`,
      { order_id: orderId, return_url: returnUrl }
    )
    return response.data.data
  },

  /**
   * Create Stripe payment intent (for embedded checkout)
   */
  async createStripeIntent(orderId: number): Promise<{ client_secret: string; payment_intent_id: string }> {
    const response = await api.post<{ data: { client_secret: string; payment_intent_id: string } }>(
      `${prefix()}/stripe/payment-intent`,
      { order_id: orderId }
    )
    return response.data.data
  },

  // ── PayPal-specific Methods ──

  /**
   * Create PayPal order
   */
  async createPayPalOrder(orderId: number, returnUrl?: string, cancelUrl?: string): Promise<{ paypal_order_id: string; approval_url: string }> {
    const response = await api.post<{ data: { paypal_order_id: string; approval_url: string } }>(
      `${prefix()}/paypal/create-order`,
      { order_id: orderId, return_url: returnUrl, cancel_url: cancelUrl }
    )
    return response.data.data
  },

  /**
   * Capture PayPal order after approval
   */
  async capturePayPalOrder(paypalOrderId: string): Promise<PaymentTransaction> {
    const response = await api.post<{ data: PaymentTransaction }>(
      `${prefix()}/paypal/capture`,
      { paypal_order_id: paypalOrderId }
    )
    return response.data.data
  },

  // ── SSLCommerz-specific Methods ──

  /**
   * Initiate SSLCommerz payment
   */
  async initSSLCommerz(orderId: number): Promise<{ gateway_url: string; session_key: string }> {
    const response = await api.post<{ data: { gateway_url: string; session_key: string } }>(
      `${prefix()}/sslcommerz/initiate`,
      { order_id: orderId }
    )
    return response.data.data
  },

  /**
   * Validate SSLCommerz transaction
   */
  async validateSSLCommerz(validationId: string): Promise<PaymentTransaction> {
    const response = await api.post<{ data: PaymentTransaction }>(
      `${prefix()}/sslcommerz/validate`,
      { val_id: validationId }
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
   */
  async getAll(filters?: RefundFilters): Promise<PaginatedResponse<PaymentRefund>> {
    const response = await api.get<PaginatedResponse<PaymentRefund>>(`${prefix()}/refunds`, {
      params: filters,
    })
    return response.data
  },

  /**
   * Get single refund
   */
  async getById(id: number): Promise<PaymentRefund> {
    const response = await api.get<{ data: PaymentRefund }>(`${prefix()}/refunds/${id}`)
    return response.data.data
  },

  /**
   * Get refund statistics
   */
  async getStatistics(params?: { date_from?: string; date_to?: string }): Promise<RefundStatistics> {
    const response = await api.get<{ data: RefundStatistics }>(`${prefix()}/refunds/statistics`, {
      params,
    })
    return response.data.data
  },

  /**
   * Create refund request
   */
  async create(data: CreateRefundRequest): Promise<PaymentRefund> {
    const response = await api.post<{ data: PaymentRefund }>(`${prefix()}/refunds`, data)
    return response.data.data
  },

  /**
   * Process refund (admin approve/reject)
   */
  async process(id: number, action: 'approve' | 'reject', notes?: string): Promise<PaymentRefund> {
    const response = await api.post<{ data: PaymentRefund }>(`${prefix()}/refunds/${id}/process`, {
      action,
      notes,
    })
    return response.data.data
  },

  /**
   * Cancel refund request
   */
  async cancel(id: number, reason?: string): Promise<PaymentRefund> {
    const response = await api.post<{ data: PaymentRefund }>(`${prefix()}/refunds/${id}/cancel`, {
      reason,
    })
    return response.data.data
  },

  /**
   * Export refunds
   */
  async export(filters?: RefundFilters): Promise<Blob> {
    const response = await api.get(`${prefix()}/refunds/export`, {
      params: filters,
      responseType: 'blob',
    })
    return response.data
  },
}

// ─────────────────────────────────────────────────────────────────
// Webhook Service
// ─────────────────────────────────────────────────────────────────

export const webhookService = {
  /**
   * Get paginated webhook events
   */
  async getAll(filters?: WebhookFilters): Promise<PaginatedResponse<WebhookEvent>> {
    const response = await api.get<PaginatedResponse<WebhookEvent>>(`${prefix()}/webhooks`, {
      params: filters,
    })
    return response.data
  },

  /**
   * Get single webhook event
   */
  async getById(id: number): Promise<WebhookEvent> {
    const response = await api.get<{ data: WebhookEvent }>(`${prefix()}/webhooks/${id}`)
    return response.data.data
  },

  /**
   * Get webhook statistics
   */
  async getStatistics(params?: { date_from?: string; date_to?: string }): Promise<WebhookStatistics> {
    const response = await api.get<{ data: WebhookStatistics }>(`${prefix()}/webhooks/statistics`, {
      params,
    })
    return response.data.data
  },

  /**
   * Retry failed webhook
   */
  async retry(id: number): Promise<WebhookEvent> {
    const response = await api.post<{ data: WebhookEvent }>(`${prefix()}/webhooks/${id}/retry`)
    return response.data.data
  },

  /**
   * Bulk retry failed webhooks
   */
  async bulkRetry(ids: number[]): Promise<{ success_count: number; fail_count: number }> {
    const response = await api.post<{ data: { success_count: number; fail_count: number } }>(
      `${prefix()}/webhooks/bulk-retry`,
      { ids }
    )
    return response.data.data
  },

  /**
   * Get available event types for a gateway
   */
  async getEventTypes(gateway: string): Promise<string[]> {
    const response = await api.get<{ data: string[] }>(`${prefix()}/webhooks/event-types/${gateway}`)
    return response.data.data
  },
}
