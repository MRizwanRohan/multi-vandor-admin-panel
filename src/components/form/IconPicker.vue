<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Icon Picker — Visual icon selection component -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Popover,
  PopoverButton,
  PopoverPanel,
} from '@headlessui/vue'
import {
  // Common/General
  HomeIcon,
  CogIcon,
  BellIcon,
  StarIcon,
  HeartIcon,
  UserIcon,
  UsersIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon,
  MinusIcon,
  // Communication
  ChatBubbleLeftIcon,
  EnvelopeIcon,
  PhoneIcon,
  InboxIcon,
  PaperAirplaneIcon,
  // Shopping/E-commerce
  ShoppingCartIcon,
  ShoppingBagIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  GiftIcon,
  TagIcon,
  ReceiptPercentIcon,
  BuildingStorefrontIcon,
  // Shipping/Logistics
  TruckIcon,
  GlobeAltIcon,
  MapPinIcon,
  MapIcon,
  // Documents
  DocumentIcon,
  DocumentTextIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentListIcon,
  BookOpenIcon,
  NewspaperIcon,
  // Security
  LockClosedIcon,
  ShieldCheckIcon,
  KeyIcon,
  FingerPrintIcon,
  // Time/Calendar
  ClockIcon,
  CalendarIcon,
  CalendarDaysIcon,
  // Media
  PhotoIcon,
  VideoCameraIcon,
  CameraIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  // Tech
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  WifiIcon,
  SignalIcon,
  CloudIcon,
  ServerIcon,
  // Navigation
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  Bars3Icon,
  MagnifyingGlassIcon,
  // Actions
  PencilIcon,
  TrashIcon,
  ArchiveBoxIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ShareIcon,
  LinkIcon,
  // Info/Help
  QuestionMarkCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  // Charts/Data
  ChartBarIcon,
  ChartPieIcon,
  PresentationChartBarIcon,
  TableCellsIcon,
  // Other
  LightBulbIcon,
  FireIcon,
  BoltIcon,
  SparklesIcon,
  FlagIcon,
  HashtagIcon,
  AdjustmentsHorizontalIcon,
  WrenchScrewdriverIcon,
  CubeIcon,
  BeakerIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  BanknotesIcon,
  TicketIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  EyeIcon,
  EyeSlashIcon,
  PrinterIcon,
  QrCodeIcon,
  CommandLineIcon,
  CodeBracketIcon,
  PuzzlePieceIcon,
  RocketLaunchIcon,
  LifebuoyIcon,
  ShieldExclamationIcon,
} from '@heroicons/vue/24/outline'

interface IconOption {
  name: string
  component: any
  category: string
}

interface Props {
  modelValue?: string | null
  label?: string
  placeholder?: string
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select an icon',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null): void
}>()

const searchQuery = ref('')

// Define all available icons
const icons: IconOption[] = [
  // Common/General
  { name: 'home', component: HomeIcon, category: 'General' },
  { name: 'cog', component: CogIcon, category: 'General' },
  { name: 'bell', component: BellIcon, category: 'General' },
  { name: 'star', component: StarIcon, category: 'General' },
  { name: 'heart', component: HeartIcon, category: 'General' },
  { name: 'user', component: UserIcon, category: 'General' },
  { name: 'users', component: UsersIcon, category: 'General' },
  { name: 'check', component: CheckIcon, category: 'General' },
  { name: 'x-mark', component: XMarkIcon, category: 'General' },
  { name: 'plus', component: PlusIcon, category: 'General' },
  { name: 'minus', component: MinusIcon, category: 'General' },
  // Communication
  { name: 'chat', component: ChatBubbleLeftIcon, category: 'Communication' },
  { name: 'envelope', component: EnvelopeIcon, category: 'Communication' },
  { name: 'phone', component: PhoneIcon, category: 'Communication' },
  { name: 'inbox', component: InboxIcon, category: 'Communication' },
  { name: 'paper-airplane', component: PaperAirplaneIcon, category: 'Communication' },
  // Shopping/E-commerce
  { name: 'shopping-cart', component: ShoppingCartIcon, category: 'Shopping' },
  { name: 'shopping-bag', component: ShoppingBagIcon, category: 'Shopping' },
  { name: 'credit-card', component: CreditCardIcon, category: 'Shopping' },
  { name: 'currency-dollar', component: CurrencyDollarIcon, category: 'Shopping' },
  { name: 'gift', component: GiftIcon, category: 'Shopping' },
  { name: 'tag', component: TagIcon, category: 'Shopping' },
  { name: 'receipt-percent', component: ReceiptPercentIcon, category: 'Shopping' },
  { name: 'storefront', component: BuildingStorefrontIcon, category: 'Shopping' },
  // Shipping/Logistics
  { name: 'truck', component: TruckIcon, category: 'Shipping' },
  { name: 'globe', component: GlobeAltIcon, category: 'Shipping' },
  { name: 'map-pin', component: MapPinIcon, category: 'Shipping' },
  { name: 'map', component: MapIcon, category: 'Shipping' },
  // Documents
  { name: 'document', component: DocumentIcon, category: 'Documents' },
  { name: 'document-text', component: DocumentTextIcon, category: 'Documents' },
  { name: 'clipboard', component: ClipboardDocumentIcon, category: 'Documents' },
  { name: 'clipboard-list', component: ClipboardDocumentListIcon, category: 'Documents' },
  { name: 'book-open', component: BookOpenIcon, category: 'Documents' },
  { name: 'newspaper', component: NewspaperIcon, category: 'Documents' },
  // Security
  { name: 'lock', component: LockClosedIcon, category: 'Security' },
  { name: 'shield-check', component: ShieldCheckIcon, category: 'Security' },
  { name: 'key', component: KeyIcon, category: 'Security' },
  { name: 'fingerprint', component: FingerPrintIcon, category: 'Security' },
  // Time/Calendar
  { name: 'clock', component: ClockIcon, category: 'Time' },
  { name: 'calendar', component: CalendarIcon, category: 'Time' },
  { name: 'calendar-days', component: CalendarDaysIcon, category: 'Time' },
  // Media
  { name: 'photo', component: PhotoIcon, category: 'Media' },
  { name: 'video-camera', component: VideoCameraIcon, category: 'Media' },
  { name: 'camera', component: CameraIcon, category: 'Media' },
  { name: 'microphone', component: MicrophoneIcon, category: 'Media' },
  { name: 'speaker-wave', component: SpeakerWaveIcon, category: 'Media' },
  // Tech
  { name: 'computer', component: ComputerDesktopIcon, category: 'Tech' },
  { name: 'phone-mobile', component: DevicePhoneMobileIcon, category: 'Tech' },
  { name: 'wifi', component: WifiIcon, category: 'Tech' },
  { name: 'signal', component: SignalIcon, category: 'Tech' },
  { name: 'cloud', component: CloudIcon, category: 'Tech' },
  { name: 'server', component: ServerIcon, category: 'Tech' },
  // Navigation
  { name: 'arrow-left', component: ArrowLeftIcon, category: 'Navigation' },
  { name: 'arrow-right', component: ArrowRightIcon, category: 'Navigation' },
  { name: 'chevron-up', component: ChevronUpIcon, category: 'Navigation' },
  { name: 'chevron-down', component: ChevronDownIcon, category: 'Navigation' },
  { name: 'bars', component: Bars3Icon, category: 'Navigation' },
  { name: 'search', component: MagnifyingGlassIcon, category: 'Navigation' },
  // Actions
  { name: 'pencil', component: PencilIcon, category: 'Actions' },
  { name: 'trash', component: TrashIcon, category: 'Actions' },
  { name: 'archive', component: ArchiveBoxIcon, category: 'Actions' },
  { name: 'refresh', component: ArrowPathIcon, category: 'Actions' },
  { name: 'download', component: ArrowDownTrayIcon, category: 'Actions' },
  { name: 'upload', component: ArrowUpTrayIcon, category: 'Actions' },
  { name: 'share', component: ShareIcon, category: 'Actions' },
  { name: 'link', component: LinkIcon, category: 'Actions' },
  // Info/Help
  { name: 'question-circle', component: QuestionMarkCircleIcon, category: 'Info' },
  { name: 'info-circle', component: InformationCircleIcon, category: 'Info' },
  { name: 'warning', component: ExclamationTriangleIcon, category: 'Info' },
  { name: 'error', component: ExclamationCircleIcon, category: 'Info' },
  { name: 'check-circle', component: CheckCircleIcon, category: 'Info' },
  { name: 'x-circle', component: XCircleIcon, category: 'Info' },
  // Charts/Data
  { name: 'chart-bar', component: ChartBarIcon, category: 'Charts' },
  { name: 'chart-pie', component: ChartPieIcon, category: 'Charts' },
  { name: 'presentation', component: PresentationChartBarIcon, category: 'Charts' },
  { name: 'table', component: TableCellsIcon, category: 'Charts' },
  // Other
  { name: 'lightbulb', component: LightBulbIcon, category: 'Other' },
  { name: 'fire', component: FireIcon, category: 'Other' },
  { name: 'bolt', component: BoltIcon, category: 'Other' },
  { name: 'sparkles', component: SparklesIcon, category: 'Other' },
  { name: 'flag', component: FlagIcon, category: 'Other' },
  { name: 'hashtag', component: HashtagIcon, category: 'Other' },
  { name: 'adjustments', component: AdjustmentsHorizontalIcon, category: 'Other' },
  { name: 'wrench', component: WrenchScrewdriverIcon, category: 'Other' },
  { name: 'cube', component: CubeIcon, category: 'Other' },
  { name: 'beaker', component: BeakerIcon, category: 'Other' },
  { name: 'academic-cap', component: AcademicCapIcon, category: 'Other' },
  { name: 'briefcase', component: BriefcaseIcon, category: 'Other' },
  { name: 'building-office', component: BuildingOfficeIcon, category: 'Other' },
  { name: 'banknotes', component: BanknotesIcon, category: 'Other' },
  { name: 'ticket', component: TicketIcon, category: 'Other' },
  { name: 'thumb-up', component: HandThumbUpIcon, category: 'Other' },
  { name: 'thumb-down', component: HandThumbDownIcon, category: 'Other' },
  { name: 'eye', component: EyeIcon, category: 'Other' },
  { name: 'eye-slash', component: EyeSlashIcon, category: 'Other' },
  { name: 'printer', component: PrinterIcon, category: 'Other' },
  { name: 'qr-code', component: QrCodeIcon, category: 'Other' },
  { name: 'terminal', component: CommandLineIcon, category: 'Other' },
  { name: 'code', component: CodeBracketIcon, category: 'Other' },
  { name: 'puzzle', component: PuzzlePieceIcon, category: 'Other' },
  { name: 'rocket', component: RocketLaunchIcon, category: 'Other' },
  { name: 'lifebuoy', component: LifebuoyIcon, category: 'Other' },
  { name: 'shield-alert', component: ShieldExclamationIcon, category: 'Other' },
]

// Get all unique categories
const categories = computed(() => {
  return [...new Set(icons.map(i => i.category))]
})

// Filter icons based on search and category
const filteredIcons = computed(() => {
  if (!searchQuery.value) return icons
  
  const query = searchQuery.value.toLowerCase()
  return icons.filter(icon => 
    icon.name.toLowerCase().includes(query) ||
    icon.category.toLowerCase().includes(query)
  )
})

// Group filtered icons by category
const groupedIcons = computed(() => {
  const groups: Record<string, IconOption[]> = {}
  
  for (const icon of filteredIcons.value) {
    if (!groups[icon.category]) {
      groups[icon.category] = []
    }
    groups[icon.category].push(icon)
  }
  
  return groups
})

// Get selected icon
const selectedIcon = computed(() => {
  if (!props.modelValue) return null
  return icons.find(i => i.name === props.modelValue)
})

// Handle icon selection
function selectIcon(iconName: string, close: () => void) {
  emit('update:modelValue', iconName)
  close()
}

// Clear selection
function clearIcon(event: Event) {
  event.stopPropagation()
  emit('update:modelValue', null)
}
</script>

<template>
  <div class="space-y-1">
    <!-- Label -->
    <label v-if="label" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {{ label }}
    </label>

    <Popover v-slot="{ open, close }" class="relative">
      <!-- Trigger Button -->
      <PopoverButton
        :class="[
          'flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500',
          error
            ? 'border-danger-500 bg-danger-50 dark:bg-danger-900/20'
            : 'border-gray-300 bg-white hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800',
        ]"
      >
        <div class="flex items-center gap-3">
          <div
            v-if="selectedIcon"
            class="flex h-8 w-8 items-center justify-center rounded-md bg-primary-100 dark:bg-primary-900"
          >
            <component :is="selectedIcon.component" class="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div v-else class="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-700">
            <PlusIcon class="h-4 w-4 text-gray-400" />
          </div>
          <span :class="selectedIcon ? 'text-gray-900 dark:text-white' : 'text-gray-400'">
            {{ selectedIcon ? selectedIcon.name : placeholder }}
          </span>
        </div>
        
        <div class="flex items-center gap-2">
          <button
            v-if="selectedIcon"
            type="button"
            class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
            @click="clearIcon"
          >
            <XMarkIcon class="h-4 w-4" />
          </button>
          <ChevronDownIcon
            :class="['h-5 w-5 text-gray-400 transition-transform', open ? 'rotate-180' : '']"
          />
        </div>
      </PopoverButton>

      <!-- Icon Picker Panel -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="translate-y-1 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-1 opacity-0"
      >
        <PopoverPanel
          class="absolute left-0 z-20 mt-2 w-96 rounded-xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-gray-800 dark:ring-gray-700"
        >
          <div class="p-4">
            <!-- Search -->
            <div class="relative mb-4">
              <MagnifyingGlassIcon class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search icons..."
                class="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <!-- Icons Grid -->
            <div class="max-h-80 space-y-4 overflow-y-auto pr-2">
              <template v-for="(categoryIcons, category) in groupedIcons" :key="category">
                <div>
                  <h4 class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {{ category }}
                  </h4>
                  <div class="grid grid-cols-8 gap-1">
                    <button
                      v-for="icon in categoryIcons"
                      :key="icon.name"
                      type="button"
                      :class="[
                        'flex h-9 w-9 items-center justify-center rounded-md transition-colors',
                        modelValue === icon.name
                          ? 'bg-primary-100 text-primary-600 ring-2 ring-primary-500 dark:bg-primary-900 dark:text-primary-400'
                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                      ]"
                      :title="icon.name"
                      @click="selectIcon(icon.name, close)"
                    >
                      <component :is="icon.component" class="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </template>

              <!-- No Results -->
              <div v-if="Object.keys(groupedIcons).length === 0" class="py-8 text-center text-gray-500">
                <MagnifyingGlassIcon class="mx-auto h-8 w-8 text-gray-300" />
                <p class="mt-2">No icons found for "{{ searchQuery }}"</p>
              </div>
            </div>
          </div>
        </PopoverPanel>
      </Transition>
    </Popover>

    <!-- Error -->
    <p v-if="error" class="text-sm text-danger-600 dark:text-danger-400">
      {{ error }}
    </p>
  </div>
</template>
