<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor Bank Details — Full CRUD bank account management          -->
<!-- Uses payoutService bank account endpoints (GET/POST/PUT/DELETE)  -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useBreadcrumbStore } from '@/stores'
import { payoutService } from '@/services'
import { useToast, useConfirm } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import type { BankAccount } from '@/services/payout.service'
import {
  BanknotesIcon,
  ShieldCheckIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  StarIcon,
  CheckBadgeIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const confirm = useConfirm()

// ── State ────────────────────────────────────────────────────────

const accounts = ref<BankAccount[]>([])
const isLoading = ref(true)
const showModal = ref(false)
const editingAccount = ref<BankAccount | null>(null)
const isSaving = ref(false)

// ── Options ──────────────────────────────────────────────────────

const accountTypeOptions = [
  { value: 'bank', label: 'Bank Account' },
  { value: 'bkash', label: 'bKash' },
  { value: 'nagad', label: 'Nagad' },
  { value: 'rocket', label: 'Rocket' },
]

const bankOptions = [
  { value: 'Dutch Bangla Bank Ltd', label: 'Dutch Bangla Bank Ltd (DBBL)' },
  { value: 'BRAC Bank', label: 'BRAC Bank' },
  { value: 'Eastern Bank Ltd', label: 'Eastern Bank Ltd (EBL)' },
  { value: 'City Bank', label: 'City Bank' },
  { value: 'United Commercial Bank', label: 'United Commercial Bank (UCB)' },
  { value: 'Standard Chartered Bank', label: 'Standard Chartered Bank' },
  { value: 'HSBC Bangladesh', label: 'HSBC Bangladesh' },
  { value: 'Mutual Trust Bank', label: 'Mutual Trust Bank' },
  { value: 'Prime Bank', label: 'Prime Bank' },
  { value: 'Islami Bank Bangladesh', label: 'Islami Bank Bangladesh' },
]

// ── Form ─────────────────────────────────────────────────────────

const bankSchema = toTypedSchema(z.object({
  account_type: z.enum(['bank', 'bkash', 'nagad', 'rocket']),
  bank_name: z.string().optional(),
  account_name: z.string().min(2, 'Account name must be at least 2 characters'),
  account_number: z.string().min(5, 'Invalid account number'),
  branch_name: z.string().optional(),
  routing_number: z.string().optional(),
  is_primary: z.boolean().optional(),
}))

const {
  handleSubmit,
  errors,
  defineField,
  isSubmitting,
  resetForm,
  setValues,
} = useForm({
  validationSchema: bankSchema,
  initialValues: {
    account_type: 'bank' as 'bank' | 'bkash' | 'nagad' | 'rocket',
    bank_name: '',
    account_name: '',
    account_number: '',
    branch_name: '',
    routing_number: '',
    is_primary: false,
  },
})

const [accountType, accountTypeAttrs] = defineField('account_type')
const [bankName, bankNameAttrs] = defineField('bank_name')
const [accountName, accountNameAttrs] = defineField('account_name')
const [accountNumber, accountNumberAttrs] = defineField('account_number')
const [branchName, branchNameAttrs] = defineField('branch_name')
const [routingNumber, routingNumberAttrs] = defineField('routing_number')
const [isPrimary, isPrimaryAttrs] = defineField('is_primary')

const isBankType = computed(() => accountType.value === 'bank')
const modalTitle = computed(() => editingAccount.value ? 'Edit Account' : 'Add Bank Account')

// ── Fetch ────────────────────────────────────────────────────────

async function fetchAccounts() {
  isLoading.value = true
  try {
    accounts.value = await payoutService.getBankAccounts()
  } catch {
    toast.error('Failed to load bank accounts')
  } finally {
    isLoading.value = false
  }
}

// ── CRUD ─────────────────────────────────────────────────────────

function openAddModal() {
  editingAccount.value = null
  resetForm()
  showModal.value = true
}

function openEditModal(account: BankAccount) {
  editingAccount.value = account
  setValues({
    account_type: account.account_type,
    bank_name: account.bank_name || '',
    account_name: account.account_name,
    account_number: account.account_number,
    branch_name: account.branch_name || '',
    routing_number: account.routing_number || '',
    is_primary: account.is_primary,
  })
  showModal.value = true
}

const onSubmit = handleSubmit(async (values) => {
  isSaving.value = true
  try {
    if (editingAccount.value) {
      await payoutService.updateBankAccount(editingAccount.value.id, values)
      toast.success('Bank account updated')
    } else {
      await payoutService.addBankAccount(values as any)
      toast.success('Bank account added')
    }
    showModal.value = false
    await fetchAccounts()
  } catch {
    toast.error(editingAccount.value ? 'Failed to update account' : 'Failed to add account')
  } finally {
    isSaving.value = false
  }
})

async function deleteAccount(account: BankAccount) {
  const confirmed = await confirm.require({
    title: 'Delete Bank Account',
    message: `Are you sure you want to delete "${account.account_name}" (****${account.account_number.slice(-4)})?`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    variant: 'danger',
  })
  if (!confirmed) return

  try {
    await payoutService.deleteBankAccount(account.id)
    toast.success('Bank account deleted')
    await fetchAccounts()
  } catch {
    toast.error('Failed to delete bank account')
  }
}

async function setPrimary(account: BankAccount) {
  try {
    await payoutService.setPrimaryBankAccount(account.id)
    toast.success('Primary account updated')
    await fetchAccounts()
  } catch {
    toast.error('Failed to set primary account')
  }
}

// ── Helpers ──────────────────────────────────────────────────────

function getAccountTypeLabel(type: string): string {
  const map: Record<string, string> = {
    bank: 'Bank',
    bkash: 'bKash',
    nagad: 'Nagad',
    rocket: 'Rocket',
  }
  return map[type] || type
}

function maskNumber(num: string): string {
  if (num.length <= 4) return num
  return '****' + num.slice(-4)
}

// ── Init ─────────────────────────────────────────────────────────

onMounted(() => {
  breadcrumbStore.setPageInfo('Bank Details', [
    { label: 'Settings' },
    { label: 'Bank Details' },
  ], 'Manage your payout accounts')
  fetchAccounts()
})
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-6">
    <!-- Info banner -->
    <div class="flex items-start gap-4 rounded-lg border border-info-200 bg-info-50 p-4 dark:border-info-800 dark:bg-info-900/20">
      <ShieldCheckIcon class="h-6 w-6 shrink-0 text-info-600 dark:text-info-400" />
      <div>
        <h4 class="font-medium text-info-800 dark:text-info-200">
          Secure Bank Information
        </h4>
        <p class="mt-1 text-sm text-info-600 dark:text-info-400">
          Your bank details are encrypted and securely stored. We use this information only for processing your payouts.
        </p>
      </div>
    </div>

    <!-- Header with Add button -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Your Accounts
      </h3>
      <BaseButton variant="primary" size="sm" @click="openAddModal">
        <PlusIcon class="mr-1 h-4 w-4" />
        Add Account
      </BaseButton>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
    </div>

    <!-- Empty State -->
    <EmptyState
      v-else-if="accounts.length === 0"
      title="No bank accounts"
      description="Add a bank account or mobile wallet to receive your payouts."
    >
      <template #action>
        <BaseButton variant="primary" @click="openAddModal">
          <PlusIcon class="mr-1 h-4 w-4" />
          Add Bank Account
        </BaseButton>
      </template>
    </EmptyState>

    <!-- Account List -->
    <div v-else class="space-y-4">
      <BaseCard
        v-for="account in accounts"
        :key="account.id"
        :class="{ 'ring-2 ring-primary-500': account.is_primary }"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-start gap-4">
            <div
              class="flex h-12 w-12 items-center justify-center rounded-xl"
              :class="account.is_primary ? 'bg-primary-100 dark:bg-primary-900/50' : 'bg-gray-100 dark:bg-gray-700'"
            >
              <BanknotesIcon
                class="h-6 w-6"
                :class="account.is_primary ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'"
              />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h4 class="font-semibold text-gray-900 dark:text-white">
                  {{ account.account_name }}
                </h4>
                <BaseBadge v-if="account.is_primary" variant="primary" size="sm">
                  Primary
                </BaseBadge>
                <BaseBadge v-if="account.is_verified" variant="success" size="sm">
                  <CheckBadgeIcon class="mr-1 h-3 w-3" />
                  Verified
                </BaseBadge>
              </div>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {{ getAccountTypeLabel(account.account_type) }}
                <template v-if="account.bank_name"> — {{ account.bank_name }}</template>
              </p>
              <p class="mt-1 font-mono text-sm text-gray-700 dark:text-gray-300">
                {{ maskNumber(account.account_number) }}
              </p>
              <p v-if="account.branch_name" class="mt-0.5 text-xs text-gray-400">
                {{ account.branch_name }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-1">
            <BaseButton
              v-if="!account.is_primary"
              variant="ghost"
              size="sm"
              title="Set as primary"
              @click="setPrimary(account)"
            >
              <StarIcon class="h-4 w-4" />
            </BaseButton>
            <BaseButton
              variant="ghost"
              size="sm"
              title="Edit"
              @click="openEditModal(account)"
            >
              <PencilSquareIcon class="h-4 w-4" />
            </BaseButton>
            <BaseButton
              v-if="!account.is_primary"
              variant="ghost"
              size="sm"
              title="Delete"
              class="text-danger-600 hover:text-danger-700"
              @click="deleteAccount(account)"
            >
              <TrashIcon class="h-4 w-4" />
            </BaseButton>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Add/Edit Modal -->
    <BaseModal
      :show="showModal"
      :title="modalTitle"
      size="md"
      @close="showModal = false"
    >
      <form @submit.prevent="onSubmit" class="space-y-4">
        <FormSelect
          v-model="accountType"
          v-bind="accountTypeAttrs"
          label="Account Type"
          name="account_type"
          :options="accountTypeOptions"
          :error="errors.account_type"
          required
        />

        <FormSelect
          v-if="isBankType"
          v-model="bankName"
          v-bind="bankNameAttrs"
          label="Bank Name"
          name="bank_name"
          :options="bankOptions"
          :error="errors.bank_name"
        />

        <FormInput
          v-model="accountName"
          v-bind="accountNameAttrs"
          label="Account Holder Name"
          name="account_name"
          :error="errors.account_name"
          :hint="isBankType ? 'Name as it appears on your bank account' : 'Registered name'"
          required
        />

        <FormInput
          v-model="accountNumber"
          v-bind="accountNumberAttrs"
          :label="isBankType ? 'Account Number' : 'Wallet Number'"
          name="account_number"
          :error="errors.account_number"
          :placeholder="isBankType ? 'Enter account number' : 'e.g. 01XXXXXXXXX'"
          required
        />

        <template v-if="isBankType">
          <div class="grid gap-4 sm:grid-cols-2">
            <FormInput
              v-model="branchName"
              v-bind="branchNameAttrs"
              label="Branch Name"
              name="branch_name"
              :error="errors.branch_name"
            />

            <FormInput
              v-model="routingNumber"
              v-bind="routingNumberAttrs"
              label="Routing Number"
              name="routing_number"
              :error="errors.routing_number"
              hint="9-digit routing number"
            />
          </div>
        </template>

        <div class="flex items-center gap-2">
          <input
            v-model="isPrimary"
            v-bind="isPrimaryAttrs"
            type="checkbox"
            id="is_primary"
            class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800"
          />
          <label for="is_primary" class="text-sm text-gray-700 dark:text-gray-300">
            Set as primary payout account
          </label>
        </div>

        <div class="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
          <BaseButton variant="secondary" type="button" @click="showModal = false">
            Cancel
          </BaseButton>
          <BaseButton variant="primary" type="submit" :loading="isSaving">
            {{ editingAccount ? 'Update' : 'Add Account' }}
          </BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
