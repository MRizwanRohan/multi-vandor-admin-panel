<!-- Admin Guide — Interactive visual guide with Tour integration -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { useTour } from '@/composables/useTour'
import BaseCard from '@/components/ui/BaseCard.vue'
import {
  PlayIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  RocketLaunchIcon,
  SparklesIcon,
  LightBulbIcon,
  BookOpenIcon,
  MapIcon,
  ArrowPathIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const tour = useTour()

onMounted(() => {
  breadcrumbStore.setPageInfo('Admin Guide', [{ label: 'Guide' }], 'ইন্টারেক্টিভ ট্যুর ও সম্পূর্ণ ব্যবহার গাইড')
})

interface CheckItem { id: string; label: string; url: string; done: boolean }
const checklist = ref<CheckItem[]>([
  { id: 'settings', label: 'Settings কনফিগার করুন (সাইটের নাম, পেমেন্ট গেটওয়ে)', url: '/admin/settings/general', done: false },
  { id: 'category', label: 'প্রথম ক্যাটাগরি তৈরি করুন', url: '/admin/categories', done: false },
  { id: 'vendor',   label: 'একজন ভেন্ডর Approve করুন', url: '/admin/vendors', done: false },
  { id: 'product',  label: 'প্রথম প্রোডাক্ট পাবলিশ করুন', url: '/admin/products', done: false },
  { id: 'shipping', label: 'শিপিং জোন ও চার্জ সেটআপ করুন', url: '/admin/shipping', done: false },
  { id: 'order',    label: 'প্রথম অর্ডার প্রসেস করুন', url: '/admin/orders', done: false },
])
const checklistProgress = computed(() => {
  const done = checklist.value.filter(c => c.done).length
  return Math.round((done / checklist.value.length) * 100)
})

const sections = [
  { idx: 0, emoji: '🏠', title: 'Dashboard', titleBn: 'প্রধান ড্যাশবোর্ড', color: 'blue', url: '/admin/dashboard', mockup: 'dashboard',
    whatYouSee: ['মোট বিক্রয় ও অর্ডার কাউন্ট', 'রেভেনিউ বার চার্ট', 'টপ ভেন্ডর তালিকা', 'সাম্প্রতিক অর্ডার'],
    whatYouCan: ['Period ফিল্টার (দৈনিক/মাসিক)', 'যেকোনো সেকশনে ক্লিক করুন', 'Notification Bell চেক করুন'] },
  { idx: 1, emoji: '📦', title: 'Products', titleBn: 'প্রোডাক্ট ম্যানেজমেন্ট', color: 'indigo', url: '/admin/products', mockup: 'list',
    whatYouSee: ['সব ভেন্ডরের প্রোডাক্ট লিস্ট', 'স্ট্যাটাস ফিল্টার ট্যাব', 'স্টক লেভেল ব্যাজ'],
    whatYouCan: ['নতুন প্রোডাক্ট তৈরি করুন', 'CSV ইম্পোর্ট করুন', 'ভ্যারিয়েন্ট বিলডার ব্যবহার করুন'] },
  { idx: 2, emoji: '🏪', title: 'Vendors', titleBn: 'ভেন্ডর অনুমোদন', color: 'emerald', url: '/admin/vendors', mockup: 'list',
    whatYouSee: ['Pending অনুমোদনের ভেন্ডর', 'ভেন্ডর পারফরম্যান্স স্কোর', 'কমিশন রেট'],
    whatYouCan: ['Approve / Suspend করুন', 'কমিশন রেট কাস্টমাইজ করুন', 'ডকুমেন্ট ভেরিফাই করুন'] },
  { idx: 3, emoji: '🛒', title: 'Orders', titleBn: 'অর্ডার প্রসেসিং', color: 'amber', url: '/admin/orders', mockup: 'list',
    whatYouSee: ['সব অর্ডার স্ট্যাটাস ফিল্টার', 'পেমেন্ট কনফার্মেশন স্ট্যাটাস', 'শিপিং তথ্য'],
    whatYouCan: ['স্ট্যাটাস আপডেট করুন', 'ট্র্যাকিং নম্বর যোগ করুন', 'রিফান্ড অনুমোদন করুন'] },
  { idx: 4, emoji: '📊', title: 'Inventory', titleBn: 'ইনভেন্টরি ও স্টক', color: 'cyan', url: '/admin/inventory', mockup: 'stats',
    whatYouSee: ['রিয়েল-টাইম স্টক লেভেল', 'লো-স্টক অ্যালার্ট', 'স্টক মুভমেন্ট হিস্টোরি'],
    whatYouCan: ['স্টক কোয়ান্টিটি আপডেট করুন', 'অ্যালার্ট থ্রেশহোল্ড সেট করুন', 'রিপোর্ট এক্সপোর্ট করুন'] },
  { idx: 5, emoji: '💳', title: 'Payments', titleBn: 'পেমেন্ট ও পেআউট', color: 'green', url: '/admin/payments', mockup: 'list',
    whatYouSee: ['সব ট্রানজেকশন লগ', 'Webhook ইভেন্ট', 'পেআউট রিকোয়েস্ট তালিকা'],
    whatYouCan: ['রিফান্ড অনুমোদন করুন', 'পেআউট প্রসেস করুন', 'Webhook লগ ডিবাগ করুন'] },
  { idx: 6, emoji: '🎯', title: 'Marketing', titleBn: 'মার্কেটিং টুলস', color: 'rose', url: '/admin/coupons', mockup: 'form',
    whatYouSee: ['সক্রিয় কুপন কোড', 'ফ্ল্যাশ সেল টাইমার', 'ব্যানার প্রিভিউ'],
    whatYouCan: ['নতুন কুপন তৈরি করুন', 'Flash Sale শিডিউল করুন', 'হোমপেজ ব্যানার আপলোড করুন'] },
  { idx: 7, emoji: '📈', title: 'Analytics', titleBn: 'এনালিটিক্স ও রিপোর্ট', color: 'violet', url: '/admin/analytics/platform', mockup: 'chart',
    whatYouSee: ['রেভেনিউ ট্রেন্ড চার্ট', 'টপ প্রোডাক্ট র‍্যাংকিং', 'কাস্টমার ইনসাইট'],
    whatYouCan: ['Period কাস্টমাইজ করুন', 'Excel-এ এক্সপোর্ট করুন', 'ভেন্ডর পারফরম্যান্স তুলনা করুন'] },
  { idx: 8, emoji: '⚙️', title: 'Settings', titleBn: 'সিস্টেম সেটিংস', color: 'slate', url: '/admin/settings/general', mockup: 'form',
    whatYouSee: ['সাইট কনফিগারেশন ফর্ম', 'পেমেন্ট গেটওয়ে স্ট্যাটাস', 'ইমেইল SMTP সেটিং'],
    whatYouCan: ['সাইটের নাম ও লোগো পরিবর্তন করুন', 'bKash/Nagad/Stripe সেটআপ করুন', 'কমিশন রেট নির্ধারণ করুন'] },
]

const cc: Record<string, { hero: string; bullet: string }> = {
  blue:   { hero: 'from-blue-600 to-blue-700',     bullet: 'bg-blue-500' },
  indigo: { hero: 'from-indigo-600 to-indigo-700', bullet: 'bg-indigo-500' },
  emerald:{ hero: 'from-emerald-600 to-emerald-700', bullet: 'bg-emerald-500' },
  amber:  { hero: 'from-amber-500 to-amber-600',   bullet: 'bg-amber-500' },
  cyan:   { hero: 'from-cyan-600 to-cyan-700',     bullet: 'bg-cyan-500' },
  green:  { hero: 'from-green-600 to-green-700',   bullet: 'bg-green-500' },
  rose:   { hero: 'from-rose-600 to-rose-700',     bullet: 'bg-rose-500' },
  violet: { hero: 'from-violet-600 to-violet-700', bullet: 'bg-violet-500' },
  slate:  { hero: 'from-slate-600 to-slate-700',   bullet: 'bg-slate-500' },
}
</script>

<template>
  <div class="space-y-8 pb-12">

    <!-- HERO BANNER -->
    <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-8 py-12 text-white shadow-2xl">
      <div class="pointer-events-none absolute inset-0 opacity-10"
           style="background-image:linear-gradient(rgba(255,255,255,.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.15) 1px,transparent 1px);background-size:40px 40px"></div>
      <div class="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl"></div>
      <div class="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl"></div>

      <div class="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div class="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm backdrop-blur-sm">
            <RocketLaunchIcon class="h-4 w-4 text-yellow-300" />
            <span>MVE Admin Panel — সম্পূর্ণ গাইড</span>
          </div>
          <h1 class="mb-2 text-3xl font-bold leading-tight md:text-4xl">Admin Panel কীভাবে কাজ করে?</h1>
          <p class="max-w-xl text-gray-300">এই গাইডে প্রতিটি মডিউল দেখুন, ইন্টারেক্টিভ ট্যুরে লাইভ স্ক্রিনে বুঝুন।</p>
        </div>
        <div class="flex gap-4 md:shrink-0">
          <div v-for="s in [['9','ট্যুর স্টেপ'],['18+','মডিউল'],['100+','API']]" :key="s[0]"
               class="rounded-xl bg-white/10 px-4 py-3 text-center backdrop-blur-sm">
            <div class="text-2xl font-bold">{{ s[0] }}</div>
            <div class="text-xs text-gray-300">{{ s[1] }}</div>
          </div>
        </div>
      </div>

      <div class="relative mt-8 flex flex-wrap gap-3">
        <!-- PRIMARY TOUR BUTTON -->
        <button @click="tour.startTour(0)"
                class="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-lg transition hover:bg-gray-100 active:scale-95">
          <PlayIcon class="h-5 w-5 text-indigo-600" />
          <span v-if="tour.isCompleted.value">Tour আবার শুরু করুন</span>
          <span v-else>🚀 Interactive Tour শুরু করুন</span>
        </button>
        <button v-if="tour.isCompleted.value" @click="tour.resetTour()"
                class="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20">
          <ArrowPathIcon class="h-4 w-4" /> Tour রিসেট করুন
        </button>
        <button @click="router.push('/admin/dashboard')"
                class="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20">
          <MapIcon class="h-4 w-4" /> সরাসরি Dashboard যান
        </button>
      </div>
    </div>

    <!-- ONBOARDING CHECKLIST -->
    <BaseCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <SparklesIcon class="h-5 w-5 text-amber-500" />
            <h2 class="font-semibold text-gray-900 dark:text-white">Onboarding Checklist</h2>
          </div>
          <span class="text-sm text-gray-500">{{ checklist.filter(c=>c.done).length }}/{{ checklist.length }} সম্পন্ন</span>
        </div>
        <div class="mt-3 h-2 w-full rounded-full bg-gray-100 dark:bg-gray-700">
          <div class="h-2 rounded-full bg-green-500 transition-all duration-500" :style="`width:${checklistProgress}%`"></div>
        </div>
      </template>
      <div class="divide-y divide-gray-100 dark:divide-gray-700">
        <div v-for="item in checklist" :key="item.id" class="flex items-center gap-3 py-3">
          <button @click="item.done = !item.done"
                  :class="item.done ? 'text-green-500' : 'text-gray-300 hover:text-gray-400'" class="shrink-0 transition">
            <CheckCircleIcon class="h-6 w-6" />
          </button>
          <span class="flex-1 text-sm" :class="item.done ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-200'">{{ item.label }}</span>
          <button @click="router.push(item.url)" class="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800">
            যান <ArrowRightIcon class="h-3 w-3" />
          </button>
        </div>
      </div>
    </BaseCard>

    <!-- 9 SECTION CARDS -->
    <div>
      <h2 class="mb-1 text-xl font-bold text-gray-900 dark:text-white">সব মডিউল একনজরে</h2>
      <p class="mb-6 text-sm text-gray-500">প্রতিটি কার্ডে Tour শুরু করুন বা সরাসরি সেই পেজে যান</p>
      <div class="space-y-6">
        <div v-for="sec in sections" :key="sec.idx"
             class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">

          <!-- Gradient header -->
          <div :class="`bg-gradient-to-r ${cc[sec.color].hero}`"
               class="flex items-center justify-between px-6 py-4 text-white">
            <div class="flex items-center gap-3">
              <span class="text-2xl">{{ sec.emoji }}</span>
              <div>
                <div class="font-bold">{{ sec.titleBn }}</div>
                <div class="text-xs text-white/70">{{ sec.title }}</div>
              </div>
              <span class="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs font-mono">Step {{ sec.idx + 1 }}/9</span>
            </div>
            <div class="flex gap-2">
              <button @click="tour.startTour(sec.idx)"
                      class="flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-medium backdrop-blur-sm transition hover:bg-white/30">
                <PlayIcon class="h-3.5 w-3.5" /> Tour এখান থেকে
              </button>
              <button @click="router.push(sec.url)"
                      class="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 transition hover:bg-gray-100">
                এখন যান <ArrowRightIcon class="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div class="p-6">
            <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">

              <!-- Browser mockup -->
              <div class="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-900">
                <div class="flex items-center gap-2 border-b border-gray-200 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800">
                  <span class="h-2.5 w-2.5 rounded-full bg-red-400"></span>
                  <span class="h-2.5 w-2.5 rounded-full bg-yellow-400"></span>
                  <span class="h-2.5 w-2.5 rounded-full bg-green-400"></span>
                  <span class="ml-2 flex-1 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-400 dark:bg-gray-700">
                    mve.app{{ sec.url }}
                  </span>
                </div>
                <div class="p-3">
                  <!-- Dashboard -->
                  <template v-if="sec.mockup === 'dashboard'">
                    <div class="mb-2 grid grid-cols-4 gap-1.5">
                      <div v-for="(s,i) in [['৳৪.২','লাখ'],['১২৩','অর্ডার'],['৯৮','ভেন্ডর'],['৪৫৬','কাস্টমার']]" :key="i"
                           class="rounded-lg bg-white p-2 shadow-sm dark:bg-gray-800">
                        <div class="text-sm font-bold text-gray-800 dark:text-white">{{ s[0] }}</div>
                        <div class="text-xs text-gray-400">{{ s[1] }}</div>
                      </div>
                    </div>
                    <div class="rounded-lg bg-white p-2 shadow-sm dark:bg-gray-800">
                      <div class="mb-1 text-xs font-medium text-gray-500">রেভেনিউ চার্ট</div>
                      <div class="flex h-16 items-end gap-1">
                        <div v-for="h in [40,55,35,70,50,80,65]" :key="h" :style="`height:${h}%`" class="flex-1 rounded-t bg-blue-400 opacity-80"></div>
                      </div>
                    </div>
                  </template>
                  <!-- List -->
                  <template v-else-if="sec.mockup === 'list'">
                    <div class="mb-2 flex gap-1">
                      <span v-for="t in ['সব','Pending','Active','Done']" :key="t" class="rounded px-2 py-0.5 text-xs"
                            :class="t==='সব' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'">{{ t }}</span>
                    </div>
                    <div class="space-y-1">
                      <div v-for="i in 4" :key="i" class="flex items-center gap-2 rounded bg-white px-2 py-1.5 shadow-sm dark:bg-gray-800">
                        <div class="h-2 w-2 rounded-full" :class="['bg-green-400','bg-amber-400','bg-blue-400','bg-gray-300'][i-1]"></div>
                        <div class="h-2 flex-1 rounded bg-gray-100 dark:bg-gray-700"></div>
                        <div class="h-2 w-10 rounded bg-gray-100 dark:bg-gray-700"></div>
                      </div>
                    </div>
                  </template>
                  <!-- Form -->
                  <template v-else-if="sec.mockup === 'form'">
                    <div class="mb-2 grid grid-cols-2 gap-1.5">
                      <div v-for="l in ['নাম','ইমেইল','ফোন','পরিমাণ']" :key="l" class="rounded bg-white p-1.5 shadow-sm dark:bg-gray-800">
                        <div class="mb-0.5 text-xs text-gray-400">{{ l }}</div>
                        <div class="h-2 rounded bg-gray-100 dark:bg-gray-700"></div>
                      </div>
                    </div>
                    <div class="flex gap-2">
                      <div class="h-6 flex-1 rounded bg-indigo-500 shadow-sm"></div>
                      <div class="h-6 w-16 rounded bg-gray-200 shadow-sm dark:bg-gray-700"></div>
                    </div>
                  </template>
                  <!-- Stats -->
                  <template v-else-if="sec.mockup === 'stats'">
                    <div class="mb-2 grid grid-cols-3 gap-1.5">
                      <div v-for="(s,i) in [['532','মোট','blue'],['48','লো-স্টক','amber'],['12','শেষ','red']]" :key="i"
                           class="rounded-lg bg-white p-2 text-center shadow-sm dark:bg-gray-800">
                        <div class="text-lg font-bold" :class="`text-${s[2]}-500`">{{ s[0] }}</div>
                        <div class="text-xs text-gray-400">{{ s[1] }}</div>
                      </div>
                    </div>
                    <div class="space-y-1.5">
                      <div v-for="(p,i) in [75,42,90]" :key="i" class="flex items-center gap-2">
                        <div class="h-2 flex-1 rounded-full bg-gray-100 dark:bg-gray-700">
                          <div class="h-2 rounded-full bg-cyan-500" :style="`width:${p}%`"></div>
                        </div>
                        <span class="text-xs text-gray-400">{{ p }}%</span>
                      </div>
                    </div>
                  </template>
                  <!-- Chart -->
                  <template v-else-if="sec.mockup === 'chart'">
                    <div class="mb-2 flex gap-2">
                      <span v-for="l in ['রেভেনিউ','অর্ডার','ভিজিটর']" :key="l"
                            class="flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        <span class="h-2 w-2 rounded-full bg-violet-500"></span>{{ l }}
                      </span>
                    </div>
                    <svg viewBox="0 0 200 60" class="w-full rounded bg-white shadow-sm dark:bg-gray-800" fill="none">
                      <polyline points="0,50 30,35 60,40 90,20 120,28 150,15 200,10" stroke="#7c3aed" stroke-width="2" fill="none"/>
                      <polyline points="0,55 30,48 60,52 90,38 120,42 150,30 200,25" stroke="#06b6d4" stroke-width="1.5" stroke-dasharray="4 2" fill="none"/>
                    </svg>
                  </template>
                </div>
              </div>

              <!-- Info columns -->
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <h4 class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">কী দেখা যাবে</h4>
                  <ul class="space-y-1.5">
                    <li v-for="item in sec.whatYouSee" :key="item" class="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" :class="cc[sec.color].bullet"></span>
                      {{ item }}
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">কী করা যাবে</h4>
                  <ul class="space-y-1.5">
                    <li v-for="action in sec.whatYouCan" :key="action" class="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <CheckCircleIcon class="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                      {{ action }}
                    </li>
                  </ul>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- PRO TIPS -->
    <BaseCard>
      <template #header>
        <div class="flex items-center gap-2">
          <LightBulbIcon class="h-5 w-5 text-amber-500" />
          <h2 class="font-semibold text-gray-900 dark:text-white">Pro Tips</h2>
        </div>
      </template>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="tip in [
          {icon:'⌘',title:'Global Search',desc:'⌘K বা Ctrl+K চাপলে যেকোনো পেজে সার্চ বক্স খুলবে'},
          {icon:'📥',title:'CSV Import',desc:'Products পেজে Import দিয়ে ১০০০+ প্রোডাক্ট একসাথে যোগ করুন'},
          {icon:'📅',title:'Period Filter',desc:'Dashboard ও Analytics-এ তারিখ রেঞ্জ বেছে নিন'},
          {icon:'🔔',title:'Notifications',desc:'Bell আইকনে ক্লিক করলে সব নতুন নোটিফিকেশন দেখবেন'},
          {icon:'📤',title:'Export',desc:'যেকোনো লিস্ট টেবিলে Export বাটন দিয়ে Excel ডাউনলোড করুন'},
          {icon:'💚',title:'Health Status',desc:'Settings → Health চেক করুন — API, DB ও Storage কানেকশন দেখুন'},
        ]" :key="tip.title"
          class="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
          <div class="mb-1 text-xl">{{ tip.icon }}</div>
          <div class="mb-1 text-sm font-semibold text-gray-800 dark:text-white">{{ tip.title }}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">{{ tip.desc }}</div>
        </div>
      </div>
    </BaseCard>

    <!-- FOOTER RESTART -->
    <div class="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-8 text-center text-white shadow-lg">
      <BookOpenIcon class="mx-auto mb-3 h-10 w-10 text-white/80" />
      <h3 class="mb-2 text-xl font-bold">আবার ট্যুর শুরু করতে চান?</h3>
      <p class="mb-5 text-indigo-200">ইন্টারেক্টিভ ট্যুরে প্রতিটি পেজ সরাসরি দেখুন</p>
      <button @click="tour.resetTour(); tour.startTour(0)"
              class="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3 font-semibold text-indigo-700 shadow transition hover:bg-gray-100 active:scale-95">
        <PlayIcon class="h-5 w-5" /> Tour রিস্টার্ট করুন
      </button>
    </div>

  </div>
</template>
