// ═══════════════════════════════════════════════════════════════════
// Payout Service — Payout API calls
// ═══════════════════════════════════════════════════════════════════

import api, { getRolePrefix } from './api'
import type {
  Payout,
  PayoutDetail,
  PayoutStatus,
  PayoutMethod,
  Commission,
  RequestPayoutRequest,
  ProcessPayoutRequest,
  PayoutListParams,
  EarningsSummary,
} from '@/types'
import type { PaginatedResponse } from '@/types'

const prefix = () => `${getRolePrefix()}/payouts`

export interface PayoutFilters extends PayoutListParams {
  search?: string
}

export interface PayoutStats {
  total_pending: number
  pending_count: number
  total_processing: number
  processing_count: number
  total_completed: number
  completed_count: number
  total_rejected: number
  rejected_count: number
}

export interface BankAccount {
  id: number
  account_holder_name: string
  account_number_masked: string
  bank_name: string | null
  branch_name: string | null
  routing_number: string | null
  account_type: string // 'savings' | 'current' | 'salary'
  is_primary: boolean
  is_verified: boolean
  verified_at: string | null
  created_at: string | null
}

export interface CreateBankAccountRequest {
  account_holder_name: string
  account_number: string
  bank_name: string
  branch_name?: string
  routing_number?: string
  swift_code?: string
  account_type?: 'savings' | 'current' | 'salary'
  is_primary?: boolean
}

export const payoutService = {
  // ─────────────────────────────────────────────────────────────────
  // Payout Management
  // ─────────────────────────────────────────────────────────────────

  /**
   * Get paginated payouts
   */
  async getAll(params?: PayoutFilters): Promise<PaginatedResponse<Payout>> {
    const response = await api.get<PaginatedResponse<Payout>>(prefix(), { params })
    return response.data
  },

  /**
   * Get single payout
   */
  async getById(id: number): Promise<PayoutDetail> {
    const response = await api.get<{ data: PayoutDetail }>(`${prefix()}/${id}`)
    return response.data.data
  },

  /**
   * Get payout statistics
   */
  async getStats(): Promise<PayoutStats> {
    const response = await api.get<{ data: PayoutStats }>(`${prefix()}/stats`)
    return response.data.data
  },

  /**
   * Request payout (vendor)
   */
  async requestPayout(data: RequestPayoutRequest): Promise<Payout> {
    const response = await api.post<{ data: Payout }>(`${prefix()}/request`, data)
    return response.data.data
  },

  /**
   * Process payout (admin)
   */
  async processPayout(id: number, data: ProcessPayoutRequest): Promise<Payout> {
    const response = await api.post<{ data: Payout }>(`${prefix()}/${id}/process`, data)
    return response.data.data
  },

  /**
   * Approve payout (admin)
   */
  async approve(id: number, transactionReference?: string): Promise<Payout> {
    const response = await api.put<{ data: Payout }>(`${prefix()}/${id}/approve`, {
      transaction_reference: transactionReference,
    })
    return response.data.data
  },

  /**
   * Reject payout (admin)
   */
  async reject(id: number, reason: string): Promise<Payout> {
    const response = await api.put<{ data: Payout }>(`${prefix()}/${id}/reject`, { reason })
    return response.data.data
  },

  /**
   * Cancel payout (vendor - only if pending)
   */
  async cancel(id: number): Promise<void> {
    await api.patch(`${prefix()}/${id}/cancel`)
  },

  /**
   * Mark payout as processing (admin)
   */
  async markProcessing(id: number): Promise<Payout> {
    const response = await api.patch<{ data: Payout }>(`${prefix()}/${id}/processing`)
    return response.data.data
  },

  /**
   * Bulk approve payouts (admin)
   */
  async bulkApprove(ids: number[]): Promise<{ success: number; failed: number }> {
    const response = await api.post<{ data: { success: number; failed: number } }>(
      `${prefix()}/bulk-approve`,
      { ids }
    )
    return response.data.data
  },

  /**
   * Bulk reject payouts (admin)
   */
  async bulkReject(ids: number[], reason: string): Promise<{ success: number; failed: number }> {
    const response = await api.post<{ data: { success: number; failed: number } }>(
      `${prefix()}/bulk-reject`,
      { ids, reason }
    )
    return response.data.data
  },

  /**
   * Complete payout (admin) — marks PROCESSING → COMPLETED
   */
  async complete(id: number, data: { transaction_reference: string; notes?: string }): Promise<Payout> {
    const response = await api.put<{ data: Payout }>(`${prefix()}/${id}/complete`, data)
    return response.data.data
  },

  /**
   * Add note to payout (admin)
   */
  async addNote(id: number, note: string): Promise<Payout> {
    const response = await api.post<{ data: Payout }>(`${prefix()}/${id}/notes`, { note })
    return response.data.data
  },

  /**
   * Export payouts
   */
  async export(params?: PayoutFilters): Promise<Blob> {
    const response = await api.get(`${prefix()}/export`, {
      params,
      responseType: 'blob',
    })
    return response.data
  },

  // ─────────────────────────────────────────────────────────────────
  // Vendor Earnings
  // ─────────────────────────────────────────────────────────────────

  /**
   * Get earnings summary (vendor)
   * Uses /vendor/payouts/balance for balance data
   */
  async getEarningsSummary(): Promise<EarningsSummary> {
    const response = await api.get<{ data: EarningsSummary }>(`/vendor/payouts/balance`)
    return response.data.data
  },

  /**
   * Get commissions list (vendor)
   * Uses /vendor/commissions endpoint
   */
  async getCommissions(params?: {
    page?: number
    per_page?: number
    status?: 'pending' | 'available' | 'paid'
    date_from?: string
    date_to?: string
  }): Promise<PaginatedResponse<Commission>> {
    const response = await api.get<PaginatedResponse<Commission>>(`/vendor/commissions`, {
      params,
    })
    return response.data
  },

  /**
   * Get available balance for payout
   */
  async getAvailableBalance(): Promise<{ available: number; pending: number; minimum: number }> {
    const response = await api.get<{
      data: { available: number; pending: number; minimum: number }
    }>(`${prefix()}/balance`)
    return response.data.data
  },

  // ─────────────────────────────────────────────────────────────────
  // Bank Accounts (Vendor)
  // ─────────────────────────────────────────────────────────────────

  /**
   * Get vendor bank accounts
   * Backend route: /vendor/bank-accounts (not under /payouts)
   */
  async getBankAccounts(): Promise<BankAccount[]> {
    const response = await api.get<{ data: { bank_accounts: BankAccount[] } }>(`/vendor/bank-accounts`)
    return response.data.data.bank_accounts
  },

  /**
   * Add bank account
   */
  async addBankAccount(data: CreateBankAccountRequest): Promise<BankAccount> {
    const response = await api.post<{ data: BankAccount }>(`/vendor/bank-accounts`, data)
    return response.data.data
  },

  /**
   * Update bank account
   */
  async updateBankAccount(id: number, data: Partial<CreateBankAccountRequest>): Promise<BankAccount> {
    const response = await api.put<{ data: BankAccount }>(`/vendor/bank-accounts/${id}`, data)
    return response.data.data
  },

  /**
   * Delete bank account
   */
  async deleteBankAccount(id: number): Promise<void> {
    await api.delete(`/vendor/bank-accounts/${id}`)
  },

  /**
   * Set primary bank account
   */
  async setPrimaryBankAccount(id: number): Promise<BankAccount> {
    const response = await api.put<{ data: BankAccount }>(
      `/vendor/bank-accounts/${id}/primary`
    )
    return response.data.data
  },
}
