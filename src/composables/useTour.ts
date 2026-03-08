// ═══════════════════════════════════════════════════════════════════
// useTour — Interactive guided tour state management
// ═══════════════════════════════════════════════════════════════════

import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getItem, setItem } from '@/utils/storage'

export interface TourStep {
  id: string
  title: string
  titleBn: string
  description: string
  url: string
  color: string
  icon: string           // emoji icon for the step
  mockupType: string     // 'list' | 'form' | 'dashboard' | 'stats' | 'chart'
  highlight?: string     // CSS selector to highlight (optional)
  tip?: string           // pro tip shown at bottom
}

const TOUR_KEY = 'mve_tour_completed'
const TOUR_STEP_KEY = 'mve_tour_step'

const adminTourSteps: TourStep[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    titleBn: 'প্রধান ড্যাশবোর্ড',
    description: 'মার্কেটপ্লেসের সব গুরুত্বপূর্ণ তথ্য এক জায়গায়। মোট বিক্রয়, অর্ডার, কাস্টমার এবং রেভেনিউ চার্ট এখানে দেখা যায়।',
    url: '/admin/dashboard',
    color: 'blue',
    icon: '🏠',
    mockupType: 'dashboard',
    tip: 'Period ফিল্টার দিয়ে আজকের, সাপ্তাহিক বা মাসিক ডেটা দেখুন',
  },
  {
    id: 'products',
    title: 'Products',
    titleBn: 'প্রোডাক্ট ম্যানেজমেন্ট',
    description: 'সব ভেন্ডরের প্রোডাক্ট দেখুন, এডিট করুন, ভ্যারিয়েন্ট বিলডার দিয়ে সাইজ/রঙ যোগ করুন এবং স্টক পরিচালনা করুন।',
    url: '/admin/products',
    color: 'indigo',
    icon: '📦',
    mockupType: 'list',
    tip: 'CSV ইম্পোর্ট করে একবারে ১০০০+ প্রোডাক্ট যোগ করা যাবে',
  },
  {
    id: 'vendors',
    title: 'Vendors',
    titleBn: 'ভেন্ডর অনুমোদন',
    description: 'নতুন ভেন্ডর রেজিস্ট্রেশন রিভিউ করুন। ডকুমেন্ট যাচাই করুন, কমিশন রেট সেট করুন এবং Approve/Suspend করুন।',
    url: '/admin/vendors',
    color: 'emerald',
    icon: '🏪',
    mockupType: 'list',
    tip: 'ভেন্ডর প্রোফাইলে গিয়ে তার সকল অর্ডার ও পেআউট হিস্টোরি দেখা যাবে',
  },
  {
    id: 'orders',
    title: 'Orders',
    titleBn: 'অর্ডার প্রসেসিং',
    description: 'সব অর্ডার এখানে। পেমেন্ট কনফার্ম করুন, শিপিং ট্র্যাকিং নম্বর যোগ করুন এবং স্ট্যাটাস আপডেট করুন।',
    url: '/admin/orders',
    color: 'amber',
    icon: '🛒',
    mockupType: 'list',
    tip: 'Global Search (⌘K) দিয়ে অর্ডার নম্বর টাইপ করে সরাসরি চলে যান',
  },
  {
    id: 'inventory',
    title: 'Inventory',
    titleBn: 'ইনভেন্টরি ও স্টক',
    description: 'স্টক লেভেল রিয়েল-টাইমে দেখুন। লো-স্টক অ্যালার্ট পান এবং স্টক মুভমেন্ট ট্র্যাক করুন।',
    url: '/admin/inventory',
    color: 'cyan',
    icon: '📊',
    mockupType: 'stats',
    tip: 'Stock Alert পেজে গেলে দেখবেন কোন প্রোডাক্টের স্টক শেষ হতে চলেছে',
  },
  {
    id: 'payments',
    title: 'Payments & Payouts',
    titleBn: 'পেমেন্ট ও পেআউট',
    description: 'সব ট্রানজেকশন দেখুন, রিফান্ড অনুমোদন করুন এবং ভেন্ডরদের পেআউট রিকোয়েস্ট প্রসেস করুন।',
    url: '/admin/payments',
    color: 'green',
    icon: '💳',
    mockupType: 'list',
    tip: 'Webhook Log দেখে বুঝুন কোন পেমেন্টে সমস্যা হয়েছে',
  },
  {
    id: 'marketing',
    title: 'Marketing Tools',
    titleBn: 'মার্কেটিং টুলস',
    description: 'কুপন কোড, ফ্ল্যাশ সেল এবং হোমপেজ ব্যানার তৈরি করুন। সময়সীমিত অফার দিয়ে বিক্রয় বাড়ান।',
    url: '/admin/coupons',
    color: 'rose',
    icon: '🎯',
    mockupType: 'form',
    tip: 'Flash Sale-এ Countdown timer দেখালে conversion rate ৩০%+ বাড়ে',
  },
  {
    id: 'analytics',
    title: 'Analytics',
    titleBn: 'এনালিটিক্স ও রিপোর্ট',
    description: 'রেভেনিউ ট্রেন্ড, টপ প্রোডাক্ট, কাস্টমার ইনসাইট এবং ভেন্ডর পারফরম্যান্স বিশ্লেষণ করুন।',
    url: '/admin/analytics/platform',
    color: 'violet',
    icon: '📈',
    mockupType: 'chart',
    tip: 'Reports সেকশন থেকে Excel-এ এক্সপোর্ট করে অফলাইনে বিশ্লেষণ করুন',
  },
  {
    id: 'settings',
    title: 'Settings',
    titleBn: 'সিস্টেম সেটিংস',
    description: 'সাইটের নাম, লোগো, পেমেন্ট গেটওয়ে (bKash/Nagad/Stripe), ইমেইল SMTP এবং কমিশন রেট কনফিগার করুন।',
    url: '/admin/settings/general',
    color: 'slate',
    icon: '⚙️',
    mockupType: 'form',
    tip: 'প্রথমেই Settings → Payment-এ গিয়ে পেমেন্ট গেটওয়ে কনফিগার করুন',
  },
]

// ── Singleton state (shared across all components) ──
const isActive = ref(false)
const currentStep = ref(0)
const isCompleted = ref(getItem<boolean>(TOUR_KEY) ?? false)

export function useTour() {
  const router = useRouter()

  const steps = adminTourSteps
  const totalSteps = steps.length

  const step = computed(() => steps[currentStep.value])
  const isFirst = computed(() => currentStep.value === 0)
  const isLast = computed(() => currentStep.value === totalSteps - 1)
  const progress = computed(() => Math.round(((currentStep.value + 1) / totalSteps) * 100))

  function startTour(fromStep = 0) {
    currentStep.value = fromStep
    isActive.value = true
    router.push(steps[fromStep].url)
  }

  function next() {
    if (currentStep.value < totalSteps - 1) {
      currentStep.value++
      router.push(steps[currentStep.value].url)
    } else {
      completeTour()
    }
  }

  function prev() {
    if (currentStep.value > 0) {
      currentStep.value--
      router.push(steps[currentStep.value].url)
    }
  }

  function jumpTo(index: number) {
    currentStep.value = index
    router.push(steps[index].url)
  }

  function completeTour() {
    isActive.value = false
    isCompleted.value = true
    setItem(TOUR_KEY, true)
  }

  function dismissTour() {
    isActive.value = false
  }

  function resetTour() {
    isCompleted.value = false
    currentStep.value = 0
    setItem(TOUR_KEY, false)
  }

  return {
    steps,
    totalSteps,
    step,
    currentStep,
    isActive,
    isFirst,
    isLast,
    isCompleted,
    progress,
    startTour,
    next,
    prev,
    jumpTo,
    completeTour,
    dismissTour,
    resetTour,
  }
}
