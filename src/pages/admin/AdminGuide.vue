<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Guide — Visual usage guide for the MVE Admin Panel         -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import BaseCard from '@/components/ui/BaseCard.vue'
import {
  RocketLaunchIcon,
  ShoppingBagIcon,
  TagIcon,
  BuildingStorefrontIcon,
  ShoppingCartIcon,
  UsersIcon,
  CubeIcon,
  StarIcon,
  TicketIcon,
  BoltIcon,
  PhotoIcon,
  CreditCardIcon,
  BanknotesIcon,
  TruckIcon,
  ChartBarIcon,
  ChartPieIcon,
  ArrowUpTrayIcon,
  DocumentTextIcon,
  WrenchScrewdriverIcon,
  BellIcon,
  UserCircleIcon,
  MagnifyingGlassIcon,
  KeyIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CogIcon,
  GlobeAltIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const activeWorkflow = ref(0)

onMounted(() => {
  breadcrumbStore.setPageInfo('Admin Guide', [{ label: 'Guide' }], 'সম্পূর্ণ ব্যবহার গাইড ও ওয়ার্কফ্লো')
})

// ── Module cards ──
const modules = [
  {
    icon: ShoppingBagIcon, color: 'blue',
    title: 'প্রোডাক্ট', subtitle: 'Products',
    desc: 'প্রোডাক্ট তৈরি, এডিট, ভ্যারিয়েন্ট বিলডার, ছবি, স্টক ও SEO ম্যানেজ করুন',
    links: [
      { label: 'সব প্রোডাক্ট', to: '/admin/products' },
      { label: 'নতুন তৈরি করুন', to: '/admin/products/create' },
    ],
    badge: 'CRUD',
  },
  {
    icon: TagIcon, color: 'purple',
    title: 'ক্যাটাগরি', subtitle: 'Categories',
    desc: 'ট্রি স্ট্রাকচারে ক্যাটাগরি সাজান। ভেন্ডরদের নতুন ক্যাটাগরি রিকোয়েস্ট অনুমোদন করুন',
    links: [
      { label: 'ক্যাটাগরি লিস্ট', to: '/admin/categories' },
      { label: 'পেন্ডিং অনুরোধ', to: '/admin/categories/pending' },
    ],
    badge: 'Approval',
  },
  {
    icon: BuildingStorefrontIcon, color: 'emerald',
    title: 'ভেন্ডর', subtitle: 'Vendors',
    desc: 'ভেন্ডর অনুমোদন, সাসপেন্ড, কমিশন রেট ও পারফরম্যান্স ট্র্যাক করুন',
    links: [
      { label: 'সব ভেন্ডর', to: '/admin/vendors' },
    ],
    badge: 'Key',
  },
  {
    icon: ShoppingCartIcon, color: 'amber',
    title: 'অর্ডার', subtitle: 'Orders',
    desc: 'সব ভেন্ডারের অর্ডার দেখুন, স্ট্যাটাস আপডেট করুন, ইনভয়েস প্রিন্ট করুন',
    links: [
      { label: 'সব অর্ডার', to: '/admin/orders' },
    ],
    badge: 'Core',
  },
  {
    icon: UsersIcon, color: 'rose',
    title: 'কাস্টমার', subtitle: 'Customers',
    desc: 'কাস্টমার প্রোফাইল, অর্ডার হিস্টোরি, রিভিউ ও অ্যাকাউন্ট স্ট্যাটাস পরিচালনা করুন',
    links: [
      { label: 'কাস্টমার লিস্ট', to: '/admin/customers' },
    ],
    badge: 'CRM',
  },
  {
    icon: CubeIcon, color: 'cyan',
    title: 'ইনভেন্টরি', subtitle: 'Inventory',
    desc: 'স্টক লেভেল, লো-স্টক অ্যালার্ট, স্টক মুভমেন্ট ও রিজার্ভেশন পর্যবেক্ষণ করুন',
    links: [
      { label: 'ইনভেন্টরি', to: '/admin/inventory' },
      { label: 'স্টক অ্যালার্ট', to: '/admin/inventory/alerts' },
    ],
    badge: 'Stock',
  },
  {
    icon: StarIcon, color: 'yellow',
    title: 'রিভিউ', subtitle: 'Reviews',
    desc: 'কাস্টমার রিভিউ মডারেট করুন — অনুমোদন, প্রত্যাখ্যান বা ফ্ল্যাগ করুন',
    links: [
      { label: 'রিভিউ মডারেশন', to: '/admin/reviews' },
    ],
    badge: 'Moderation',
  },
  {
    icon: TicketIcon, color: 'orange',
    title: 'কুপন', subtitle: 'Coupons',
    desc: 'ছাড়ের কুপন তৈরি করুন — percentage বা fixed, সীমিত ব্যবহার, মেয়াদ নির্ধারণ',
    links: [
      { label: 'কুপন লিস্ট', to: '/admin/coupons' },
      { label: 'নতুন কুপন', to: '/admin/coupons/create' },
    ],
    badge: 'Marketing',
  },
  {
    icon: BoltIcon, color: 'red',
    title: 'ফ্ল্যাশ সেল', subtitle: 'Flash Sales',
    desc: 'সময়সীমিত অফার তৈরি করুন। প্রতিটি প্রোডাক্টে আলাদা ছাড় সেট করুন',
    links: [
      { label: 'ফ্ল্যাশ সেল লিস্ট', to: '/admin/flash-sales' },
      { label: 'নতুন সেল', to: '/admin/flash-sales/create' },
    ],
    badge: 'Marketing',
  },
  {
    icon: PhotoIcon, color: 'indigo',
    title: 'ব্যানার', subtitle: 'Banners',
    desc: 'হোমপেজ, সাইডবার ও ক্যাটাগরি পেজে প্রমোশনাল ব্যানার পরিচালনা করুন',
    links: [
      { label: 'ব্যানার লিস্ট', to: '/admin/banners' },
      { label: 'নতুন ব্যানার', to: '/admin/banners/create' },
    ],
    badge: 'UI',
  },
  {
    icon: CreditCardIcon, color: 'teal',
    title: 'পেমেন্ট', subtitle: 'Payments',
    desc: 'সব ট্রানজেকশন দেখুন, রিফান্ড অনুমোদন করুন, ওয়েবহুক লগ পর্যবেক্ষণ করুন',
    links: [
      { label: 'পেমেন্ট লিস্ট', to: '/admin/payments' },
      { label: 'রিফান্ড', to: '/admin/payments/refunds' },
    ],
    badge: 'Finance',
  },
  {
    icon: BanknotesIcon, color: 'green',
    title: 'কমিশন ও পেআউট', subtitle: 'Payouts',
    desc: 'ভেন্ডর কমিশন ট্র্যাক করুন এবং পেআউট রিকোয়েস্ট অনুমোদন করুন',
    links: [
      { label: 'কমিশন', to: '/admin/commissions' },
      { label: 'পেআউট', to: '/admin/payouts' },
    ],
    badge: 'Finance',
  },
  {
    icon: TruckIcon, color: 'sky',
    title: 'শিপিং', subtitle: 'Shipping',
    desc: 'শিপিং জোন ও মেথড কনফিগার করুন। এলাকাভিত্তিক ডেলিভারি চার্জ নির্ধারণ করুন',
    links: [
      { label: 'শিপিং জোন', to: '/admin/shipping/zones' },
      { label: 'শিপিং মেথড', to: '/admin/shipping/methods' },
    ],
    badge: 'Logistics',
  },
  {
    icon: ChartBarIcon, color: 'violet',
    title: 'রিপোর্ট', subtitle: 'Reports',
    desc: 'বিক্রয়, ভেন্ডর, প্রোডাক্ট ও অর্ডার রিপোর্ট — CSV/Excel এ এক্সপোর্ট করুন',
    links: [
      { label: 'সেলস রিপোর্ট', to: '/admin/reports/sales' },
      { label: 'ভেন্ডর রিপোর্ট', to: '/admin/reports/vendors' },
    ],
    badge: 'Analytics',
  },
  {
    icon: ChartPieIcon, color: 'fuchsia',
    title: 'এনালিটিক্স', subtitle: 'Analytics',
    desc: 'রেভেনিউ ট্রেন্ড, টপ প্রোডাক্ট, কাস্টমার ইনসাইট ও প্ল্যাটফর্ম সামারি',
    links: [
      { label: 'প্ল্যাটফর্ম সামারি', to: '/admin/analytics/platform' },
      { label: 'কাস্টমার ইনসাইট', to: '/admin/analytics/customers' },
    ],
    badge: 'Analytics',
  },
  {
    icon: ArrowUpTrayIcon, color: 'slate',
    title: 'Export / Import', subtitle: 'Data Tools',
    desc: 'বাল্ক প্রোডাক্ট ইম্পোর্ট করুন (CSV), এবং যেকোনো ডেটা Excel-এ এক্সপোর্ট করুন',
    links: [
      { label: 'Export Center', to: '/admin/export' },
      { label: 'Product Import', to: '/admin/import/products' },
    ],
    badge: 'Tools',
  },
  {
    icon: DocumentTextIcon, color: 'lime',
    title: 'CMS', subtitle: 'Content',
    desc: 'স্ট্যাটিক পেজ, FAQ, ব্লগ পোস্ট এবং যোগাযোগ বার্তা পরিচালনা করুন',
    links: [
      { label: 'স্ট্যাটিক পেজ', to: '/admin/cms/pages' },
      { label: 'ব্লগ', to: '/admin/cms/blog' },
    ],
    badge: 'Content',
  },
  {
    icon: WrenchScrewdriverIcon, color: 'zinc',
    title: 'সিস্টেম', subtitle: 'System',
    desc: 'Activity log, সিস্টেম স্বাস্থ্য পর্যবেক্ষণ এবং ডেটাবেজ ব্যাকআপ পরিচালনা',
    links: [
      { label: 'Activity Log', to: '/admin/system/activity' },
      { label: 'System Health', to: '/admin/system/health' },
    ],
    badge: 'System',
  },
]

// ── Workflows ──
const workflows = [
  {
    title: '🏪 নতুন ভেন্ডর অনবোর্ড করা',
    color: 'emerald',
    steps: [
      { icon: BuildingStorefrontIcon, label: 'ভেন্ডর রেজিস্ট্রেশন', desc: 'ভেন্ডর নিজে রেজিস্ট্রেশন করে', url: null },
      { icon: ExclamationTriangleIcon, label: 'পেন্ডিং নোটিফিকেশন', desc: 'আপনি notification পাবেন', url: null },
      { icon: BuildingStorefrontIcon, label: 'তথ্য যাচাই করুন', desc: 'Vendors → ভেন্ডর ডিটেইল দেখুন', url: '/admin/vendors' },
      { icon: CogIcon, label: 'কমিশন রেট সেট', desc: 'ভেন্ডর এডিট → Commission %', url: null },
      { icon: CheckCircleIcon, label: 'Approve করুন', desc: 'Approve বাটনে ক্লিক করুন', url: null },
    ],
  },
  {
    title: '📦 অর্ডার প্রসেস করা',
    color: 'amber',
    steps: [
      { icon: ShoppingCartIcon, label: 'নতুন অর্ডার', desc: 'Orders লিস্টে "pending" ট্যাব দেখুন', url: '/admin/orders' },
      { icon: CreditCardIcon, label: 'পেমেন্ট যাচাই', desc: 'Payment status confirmed কিনা দেখুন', url: null },
      { icon: CubeIcon, label: 'স্টক চেক', desc: 'Inventory তে স্টক আছে কিনা নিশ্চিত করুন', url: null },
      { icon: TruckIcon, label: 'শিপিং আপডেট', desc: 'Status → Shipped + Tracking নম্বর যোগ', url: null },
      { icon: CheckCircleIcon, label: 'ডেলিভারি নিশ্চিত', desc: 'Status → Delivered = অর্ডার সম্পন্ন', url: null },
    ],
  },
  {
    title: '💰 ভেন্ডর পেআউট করা',
    color: 'green',
    steps: [
      { icon: BanknotesIcon, label: 'পেআউট রিকোয়েস্ট', desc: 'ভেন্ডর পেআউট রিকোয়েস্ট করে', url: '/admin/payouts' },
      { icon: ChartBarIcon, label: 'কমিশন যাচাই', desc: 'Commission লিস্টে হিসাব দেখুন', url: '/admin/commissions' },
      { icon: CheckCircleIcon, label: 'Approve করুন', desc: 'Payout → Approve বাটনে ক্লিক', url: null },
      { icon: BanknotesIcon, label: 'পেমেন্ট পাঠান', desc: 'ব্যাংক/মোবাইল ব্যাংকিংয়ে ট্রান্সফার', url: null },
    ],
  },
  {
    title: '🎯 মার্কেটিং ক্যাম্পেইন চালু করা',
    color: 'rose',
    steps: [
      { icon: PhotoIcon, label: 'ব্যানার তৈরি', desc: 'Banners → Create → ছবি ও লিংক যোগ', url: '/admin/banners/create' },
      { icon: TicketIcon, label: 'কুপন তৈরি', desc: 'Coupons → Create → কোড ও ছাড় সেট', url: '/admin/coupons/create' },
      { icon: BoltIcon, label: 'ফ্ল্যাশ সেল', desc: 'Flash Sales → Time limit ও প্রোডাক্ট যোগ', url: '/admin/flash-sales/create' },
      { icon: ChartPieIcon, label: 'পারফরম্যান্স দেখুন', desc: 'Analytics → Sales দেখে ফলাফল মূল্যায়ন', url: '/admin/analytics/sales' },
    ],
  },
]

// ── Color maps ──
const colorMap: Record<string, { bg: string; icon: string; badge: string; ring: string }> = {
  blue:    { bg: 'bg-blue-50 dark:bg-blue-900/20',    icon: 'text-blue-600 dark:text-blue-400',    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',    ring: 'hover:ring-blue-300 dark:hover:ring-blue-700' },
  purple:  { bg: 'bg-purple-50 dark:bg-purple-900/20', icon: 'text-purple-600 dark:text-purple-400', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300', ring: 'hover:ring-purple-300 dark:hover:ring-purple-700' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', ring: 'hover:ring-emerald-300 dark:hover:ring-emerald-700' },
  amber:   { bg: 'bg-amber-50 dark:bg-amber-900/20',  icon: 'text-amber-600 dark:text-amber-400',   badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',   ring: 'hover:ring-amber-300 dark:hover:ring-amber-700' },
  rose:    { bg: 'bg-rose-50 dark:bg-rose-900/20',    icon: 'text-rose-600 dark:text-rose-400',    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',    ring: 'hover:ring-rose-300 dark:hover:ring-rose-700' },
  cyan:    { bg: 'bg-cyan-50 dark:bg-cyan-900/20',    icon: 'text-cyan-600 dark:text-cyan-400',    badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',    ring: 'hover:ring-cyan-300 dark:hover:ring-cyan-700' },
  yellow:  { bg: 'bg-yellow-50 dark:bg-yellow-900/20', icon: 'text-yellow-600 dark:text-yellow-400', badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300', ring: 'hover:ring-yellow-300 dark:hover:ring-yellow-700' },
  orange:  { bg: 'bg-orange-50 dark:bg-orange-900/20', icon: 'text-orange-600 dark:text-orange-400', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300', ring: 'hover:ring-orange-300 dark:hover:ring-orange-700' },
  red:     { bg: 'bg-red-50 dark:bg-red-900/20',      icon: 'text-red-600 dark:text-red-400',      badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',      ring: 'hover:ring-red-300 dark:hover:ring-red-700' },
  indigo:  { bg: 'bg-indigo-50 dark:bg-indigo-900/20', icon: 'text-indigo-600 dark:text-indigo-400', badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300', ring: 'hover:ring-indigo-300 dark:hover:ring-indigo-700' },
  teal:    { bg: 'bg-teal-50 dark:bg-teal-900/20',    icon: 'text-teal-600 dark:text-teal-400',    badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',    ring: 'hover:ring-teal-300 dark:hover:ring-teal-700' },
  green:   { bg: 'bg-green-50 dark:bg-green-900/20',  icon: 'text-green-600 dark:text-green-400',  badge: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',  ring: 'hover:ring-green-300 dark:hover:ring-green-700' },
  sky:     { bg: 'bg-sky-50 dark:bg-sky-900/20',      icon: 'text-sky-600 dark:text-sky-400',      badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',      ring: 'hover:ring-sky-300 dark:hover:ring-sky-700' },
  violet:  { bg: 'bg-violet-50 dark:bg-violet-900/20', icon: 'text-violet-600 dark:text-violet-400', badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300', ring: 'hover:ring-violet-300 dark:hover:ring-violet-700' },
  fuchsia: { bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/20', icon: 'text-fuchsia-600 dark:text-fuchsia-400', badge: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300', ring: 'hover:ring-fuchsia-300 dark:hover:ring-fuchsia-700' },
  slate:   { bg: 'bg-slate-50 dark:bg-slate-800/40',  icon: 'text-slate-600 dark:text-slate-400',  badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',  ring: 'hover:ring-slate-300 dark:hover:ring-slate-600' },
  lime:    { bg: 'bg-lime-50 dark:bg-lime-900/20',    icon: 'text-lime-600 dark:text-lime-400',    badge: 'bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300',    ring: 'hover:ring-lime-300 dark:hover:ring-lime-700' },
  zinc:    { bg: 'bg-zinc-50 dark:bg-zinc-800/40',    icon: 'text-zinc-600 dark:text-zinc-400',    badge: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',    ring: 'hover:ring-zinc-300 dark:hover:ring-zinc-600' },
}

const workflowColor: Record<string, { dot: string; line: string; active: string; step: string }> = {
  emerald: { dot: 'bg-emerald-500', line: 'bg-emerald-200 dark:bg-emerald-800', active: 'bg-emerald-600', step: 'text-emerald-700 dark:text-emerald-400' },
  amber:   { dot: 'bg-amber-500',   line: 'bg-amber-200 dark:bg-amber-800',   active: 'bg-amber-600',   step: 'text-amber-700 dark:text-amber-400' },
  green:   { dot: 'bg-green-500',   line: 'bg-green-200 dark:bg-green-800',   active: 'bg-green-600',   step: 'text-green-700 dark:text-green-400' },
  rose:    { dot: 'bg-rose-500',    line: 'bg-rose-200 dark:bg-rose-800',    active: 'bg-rose-600',    step: 'text-rose-700 dark:text-rose-400' },
}

// ── Quick start steps ──
const quickStart = [
  { num: '01', title: 'সেটিংস কনফিগার করুন', desc: 'সাইটের নাম, লোগো, পেমেন্ট গেটওয়ে ও কমিশন রেট সেট করুন', icon: CogIcon, url: '/admin/settings/general', color: 'blue' },
  { num: '02', title: 'ভেন্ডর অনুমোদন করুন', desc: 'নতুন ভেন্ডর রেজিস্ট্রেশন রিভিউ করুন ও Approve দিন', icon: BuildingStorefrontIcon, url: '/admin/vendors', color: 'emerald' },
  { num: '03', title: 'ক্যাটাগরি তৈরি করুন', desc: 'প্রোডাক্টের জন্য ক্যাটাগরি ও সাবক্যাটাগরি স্ট্রাকচার বানান', icon: TagIcon, url: '/admin/categories', color: 'purple' },
  { num: '04', title: 'শিপিং সেটআপ করুন', desc: 'এলাকাভিত্তিক শিপিং জোন ও ডেলিভারি চার্জ নির্ধারণ করুন', icon: TruckIcon, url: '/admin/shipping/zones', color: 'sky' },
  { num: '05', title: 'প্রথম অর্ডার প্রসেস করুন', desc: 'অর্ডার লিস্ট থেকে পেমেন্ট ভেরিফাই করে শিপড মার্ক করুন', icon: ShoppingCartIcon, url: '/admin/orders', color: 'amber' },
]

// ── Keyboard shortcuts ──
const shortcuts = [
  { keys: ['⌘', 'K'], desc: 'Global Search — যেকোনো অর্ডার/প্রোডাক্ট/কাস্টমার খুঁজুন' },
  { keys: ['Esc'], desc: 'যেকোনো মডাল বা ডায়ালগ বন্ধ করুন' },
]

// ── API quick reference ──
const apiGroups = [
  { module: 'Products', color: 'blue', endpoints: ['GET /admin/products', 'POST /admin/products', 'PUT /admin/products/:id', 'DELETE /admin/products/:id'] },
  { module: 'Orders',   color: 'amber', endpoints: ['GET /admin/orders', 'GET /admin/orders/:id', 'PATCH /admin/orders/:id/status'] },
  { module: 'Vendors',  color: 'emerald', endpoints: ['GET /admin/vendors', 'PATCH /admin/vendors/:id/approve', 'PATCH /admin/vendors/:id/suspend'] },
  { module: 'Payouts',  color: 'green', endpoints: ['GET /admin/payouts', 'PATCH /admin/payouts/:id/approve', 'PATCH /admin/payouts/:id/reject'] },
  { module: 'Settings', color: 'violet', endpoints: ['GET /admin/settings/:section', 'PUT /admin/settings/:section'] },
  { module: 'Analytics', color: 'fuchsia', endpoints: ['GET /admin/analytics/summary', 'GET /admin/analytics/sales', 'GET /admin/analytics/platform'] },
]
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-10 pb-16">

    <!-- ══════════ HERO ══════════ -->
    <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-700 via-primary-600 to-indigo-600 px-8 py-10 shadow-xl">
      <!-- background pattern -->
      <div class="pointer-events-none absolute inset-0 opacity-10" style="background-image:radial-gradient(circle at 20% 50%,white 1px,transparent 1px),radial-gradient(circle at 80% 20%,white 1px,transparent 1px);background-size:40px 40px" />
      <div class="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div class="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm">
            <RocketLaunchIcon class="h-4 w-4" />
            MVE Admin Panel — সম্পূর্ণ গাইড
          </div>
          <h1 class="text-3xl font-extrabold text-white lg:text-4xl">
            Admin Panel কীভাবে কাজ করে?
          </h1>
          <p class="mt-2 max-w-xl text-base text-primary-100">
            এই গাইডে প্রতিটি মডিউল, কীভাবে ব্যবহার করবেন, কোন বাটন কী করে এবং সম্পূর্ণ ওয়ার্কফ্লো বিস্তারিতভাবে দেওয়া হয়েছে।
          </p>
        </div>
        <!-- stat pills -->
        <div class="flex flex-wrap gap-3">
          <div class="rounded-xl bg-white/15 px-4 py-3 text-center backdrop-blur-sm">
            <p class="text-2xl font-bold text-white">18+</p>
            <p class="text-xs text-primary-200">মডিউল</p>
          </div>
          <div class="rounded-xl bg-white/15 px-4 py-3 text-center backdrop-blur-sm">
            <p class="text-2xl font-bold text-white">60+</p>
            <p class="text-xs text-primary-200">পেজ</p>
          </div>
          <div class="rounded-xl bg-white/15 px-4 py-3 text-center backdrop-blur-sm">
            <p class="text-2xl font-bold text-white">100+</p>
            <p class="text-xs text-primary-200">API Endpoints</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════ QUICK START ══════════ -->
    <section>
      <div class="mb-6 flex items-center gap-3">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
          <RocketLaunchIcon class="h-5 w-5 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h2 class="text-lg font-bold text-gray-900 dark:text-white">Quick Start — প্রথমেই যা করবেন</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">নতুন ইনস্টলেশনের পর এই ৫টি পদক্ষেপ অনুসরণ করুন</p>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <button
          v-for="step in quickStart"
          :key="step.num"
          type="button"
          class="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
          @click="router.push(step.url)"
        >
          <div class="mb-3 flex items-start justify-between">
            <div :class="['flex h-10 w-10 items-center justify-center rounded-xl', colorMap[step.color].bg]">
              <component :is="step.icon" :class="['h-5 w-5', colorMap[step.color].icon]" />
            </div>
            <span class="text-3xl font-black text-gray-100 dark:text-gray-700 group-hover:text-gray-200 dark:group-hover:text-gray-600 transition-colors">{{ step.num }}</span>
          </div>
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">{{ step.title }}</h3>
          <p class="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{{ step.desc }}</p>
          <div :class="['mt-3 flex items-center gap-1 text-xs font-medium', colorMap[step.color].icon]">
            যান <ArrowRightIcon class="h-3 w-3 transition-transform group-hover:translate-x-1" />
          </div>
        </button>
      </div>
    </section>

    <!-- ══════════ ALL MODULES GRID ══════════ -->
    <section>
      <div class="mb-6 flex items-center gap-3">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
          <CubeIcon class="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </div>
        <div>
          <h2 class="text-lg font-bold text-gray-900 dark:text-white">সব মডিউল একনজরে</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">প্রতিটি কার্ডে ক্লিক করে সরাসরি সেই সেকশনে যান</p>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="mod in modules"
          :key="mod.title"
          class="group relative flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm ring-2 ring-transparent transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
          :class="colorMap[mod.color].ring"
        >
          <!-- header -->
          <div class="mb-4 flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div :class="['flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', colorMap[mod.color].bg]">
                <component :is="mod.icon" :class="['h-6 w-6', colorMap[mod.color].icon]" />
              </div>
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white">{{ mod.title }}</h3>
                <p class="text-xs text-gray-400">{{ mod.subtitle }}</p>
              </div>
            </div>
            <span :class="['shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide', colorMap[mod.color].badge]">
              {{ mod.badge }}
            </span>
          </div>

          <!-- description -->
          <p class="flex-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{{ mod.desc }}</p>

          <!-- quick links -->
          <div class="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4 dark:border-gray-700">
            <button
              v-for="link in mod.links"
              :key="link.label"
              type="button"
              :class="['inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors', colorMap[mod.color].bg, colorMap[mod.color].icon, 'hover:opacity-80']"
              @click="router.push(link.to)"
            >
              {{ link.label }}
              <ArrowRightIcon class="h-3 w-3 opacity-70 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- ══════════ WORKFLOWS ══════════ -->
    <section>
      <div class="mb-6 flex items-center gap-3">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
          <ChartBarIcon class="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h2 class="text-lg font-bold text-gray-900 dark:text-white">সাধারণ ওয়ার্কফ্লো</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">কোন কাজ কীভাবে করবেন — ধাপে ধাপে</p>
        </div>
      </div>

      <!-- Workflow tabs -->
      <div class="mb-5 flex flex-wrap gap-2">
        <button
          v-for="(wf, i) in workflows"
          :key="i"
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          :class="activeWorkflow === i
            ? 'bg-primary-600 text-white shadow-sm'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'"
          @click="activeWorkflow = i"
        >
          {{ wf.title }}
        </button>
      </div>

      <BaseCard class="!p-6">
        <div v-for="(wf, wi) in workflows" :key="wi" v-show="activeWorkflow === wi">
          <div class="relative">
            <!-- connector line -->
            <div class="absolute left-5 top-10 hidden h-[calc(100%-80px)] w-0.5 sm:block"
              :class="workflowColor[wf.color].line" />

            <div class="space-y-0">
              <div v-for="(step, si) in wf.steps" :key="si" class="relative flex gap-4 pb-6 last:pb-0">
                <!-- step dot -->
                <div class="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-white shadow dark:border-gray-900"
                  :class="workflowColor[wf.color].dot">
                  <component :is="step.icon" class="h-5 w-5 text-white" />
                </div>

                <!-- content -->
                <div class="flex flex-1 items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/60">
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <span :class="['text-xs font-bold uppercase tracking-wide', workflowColor[wf.color].step]">
                        ধাপ {{ si + 1 }}
                      </span>
                    </div>
                    <h4 class="mt-0.5 font-semibold text-gray-900 dark:text-white">{{ step.label }}</h4>
                    <p class="text-sm text-gray-500 dark:text-gray-400">{{ step.desc }}</p>
                  </div>
                  <button
                    v-if="step.url"
                    type="button"
                    class="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:ring-gray-600 dark:hover:bg-gray-600"
                    @click="router.push(step.url)"
                  >
                    যান →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </BaseCard>
    </section>

    <!-- ══════════ KEYBOARD + API (2-col) ══════════ -->
    <div class="grid gap-6 lg:grid-cols-2">

      <!-- Keyboard shortcuts -->
      <BaseCard>
        <div class="mb-5 flex items-center gap-3 border-b border-gray-100 pb-4 dark:border-gray-700">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
            <KeyIcon class="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <h2 class="font-semibold text-gray-900 dark:text-white">কীবোর্ড শর্টকাট</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400">দ্রুত কাজ করার জন্য</p>
          </div>
        </div>

        <div class="space-y-3">
          <div v-for="sh in shortcuts" :key="sh.desc" class="flex items-center justify-between gap-4 rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800/60">
            <p class="text-sm text-gray-700 dark:text-gray-300">{{ sh.desc }}</p>
            <div class="flex shrink-0 items-center gap-1">
              <kbd
                v-for="k in sh.keys"
                :key="k"
                class="inline-flex items-center rounded border border-gray-300 bg-white px-2 py-0.5 text-xs font-semibold text-gray-700 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
              >{{ k }}</kbd>
            </div>
          </div>
        </div>

        <!-- Search tip -->
        <div class="mt-5 rounded-xl border border-primary-100 bg-primary-50 p-4 dark:border-primary-900/30 dark:bg-primary-900/10">
          <div class="flex items-start gap-3">
            <MagnifyingGlassIcon class="mt-0.5 h-5 w-5 shrink-0 text-primary-600 dark:text-primary-400" />
            <div>
              <p class="text-sm font-semibold text-primary-700 dark:text-primary-300">Global Search টিপস</p>
              <ul class="mt-1 space-y-1 text-xs text-primary-600 dark:text-primary-400">
                <li>• অর্ডার নম্বর টাইপ করুন → সরাসরি অর্ডারে যান</li>
                <li>• কাস্টমার নাম বা ইমেইল → প্রোফাইল দেখুন</li>
                <li>• প্রোডাক্ট নাম বা SKU → ইনভেন্টরি চেক করুন</li>
                <li>• ভেন্ডরের দোকানের নাম → ভেন্ডর ডিটেইল দেখুন</li>
              </ul>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- API Quick Reference -->
      <BaseCard>
        <div class="mb-5 flex items-center gap-3 border-b border-gray-100 pb-4 dark:border-gray-700">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
            <GlobeAltIcon class="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <h2 class="font-semibold text-gray-900 dark:text-white">Backend API — মূল Endpoints</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400">Base: <code class="rounded bg-gray-100 px-1 dark:bg-gray-700">/api/v1</code></p>
          </div>
        </div>

        <div class="space-y-3 overflow-y-auto" style="max-height:380px">
          <div v-for="grp in apiGroups" :key="grp.module">
            <p :class="['mb-1.5 text-xs font-bold uppercase tracking-wider', colorMap[grp.color].icon]">{{ grp.module }}</p>
            <div class="space-y-1">
              <div
                v-for="ep in grp.endpoints"
                :key="ep"
                class="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 font-mono text-xs dark:bg-gray-800/60"
              >
                <span
                  class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase"
                  :class="{
                    'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400': ep.startsWith('GET'),
                    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400': ep.startsWith('POST'),
                    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400': ep.startsWith('PUT'),
                    'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400': ep.startsWith('PATCH'),
                    'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400': ep.startsWith('DELETE'),
                  }"
                >{{ ep.split(' ')[0] }}</span>
                <span class="text-gray-600 dark:text-gray-400">{{ ep.split(' ').slice(1).join(' ') }}</span>
              </div>
            </div>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- ══════════ ROLE PERMISSIONS ══════════ -->
    <section>
      <div class="mb-6 flex items-center gap-3">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/30">
          <UserCircleIcon class="h-5 w-5 text-rose-600 dark:text-rose-400" />
        </div>
        <div>
          <h2 class="text-lg font-bold text-gray-900 dark:text-white">রোল ও অ্যাক্সেস</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">কে কী কাজ করতে পারবে</p>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-3">
        <!-- Admin -->
        <BaseCard class="!p-5">
          <div class="mb-4 flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/20">
              <UserCircleIcon class="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-white">Super Admin</h3>
              <span class="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700 dark:bg-red-900/40 dark:text-red-400">সর্বোচ্চ ক্ষমতা</span>
            </div>
          </div>
          <ul class="space-y-1.5">
            <li v-for="p in ['সব মডিউল অ্যাক্সেস','ভেন্ডর অনুমোদন/বাতিল','পেআউট অনুমোদন','সিস্টেম সেটিংস','ব্যাকআপ ম্যানেজমেন্ট']" :key="p"
              class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <CheckCircleIcon class="h-4 w-4 shrink-0 text-green-500" />{{ p }}
            </li>
          </ul>
        </BaseCard>

        <!-- Vendor -->
        <BaseCard class="!p-5">
          <div class="mb-4 flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/20">
              <BuildingStorefrontIcon class="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-white">Vendor</h3>
              <span class="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">দোকান মালিক</span>
            </div>
          </div>
          <ul class="space-y-1.5">
            <li v-for="p in ['নিজের প্রোডাক্ট ম্যানেজ','নিজের অর্ডার দেখা','ইনভেন্টরি আপডেট','পেআউট রিকোয়েস্ট','নিজের দোকান সেটিংস']" :key="p"
              class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <CheckCircleIcon class="h-4 w-4 shrink-0 text-green-500" />{{ p }}
            </li>
          </ul>
          <div class="mt-3 border-t border-gray-100 pt-3 dark:border-gray-700">
            <p class="text-xs text-gray-400">❌ অন্য ভেন্ডরের ডেটা দেখতে পারবে না</p>
          </div>
        </BaseCard>

        <!-- Customer -->
        <BaseCard class="!p-5">
          <div class="mb-4 flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/20">
              <UsersIcon class="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-white">Customer</h3>
              <span class="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">ক্রেতা</span>
            </div>
          </div>
          <ul class="space-y-1.5">
            <li v-for="p in ['প্রোডাক্ট ব্রাউজ ও কিনা','নিজের অর্ডার ট্র্যাক','রিভিউ দেওয়া','উইশলিস্ট','প্রোফাইল আপডেট']" :key="p"
              class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <CheckCircleIcon class="h-4 w-4 shrink-0 text-green-500" />{{ p }}
            </li>
          </ul>
          <div class="mt-3 border-t border-gray-100 pt-3 dark:border-gray-700">
            <p class="text-xs text-gray-400">❌ Admin/Vendor প্যানেল অ্যাক্সেস নেই</p>
          </div>
        </BaseCard>
      </div>
    </section>

    <!-- ══════════ QUICK ACTIONS ══════════ -->
    <section>
      <div class="mb-5 flex items-center gap-3">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
          <BoltIcon class="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <h2 class="text-lg font-bold text-gray-900 dark:text-white">দ্রুত অ্যাকশন</h2>
      </div>

      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <button
          v-for="qa in [
            { label: 'নতুন প্রোডাক্ট', icon: ShoppingBagIcon, url: '/admin/products/create', color: 'blue' },
            { label: 'নতুন কুপন', icon: TicketIcon, url: '/admin/coupons/create', color: 'orange' },
            { label: 'ফ্ল্যাশ সেল', icon: BoltIcon, url: '/admin/flash-sales/create', color: 'red' },
            { label: 'নতুন ব্যানার', icon: PhotoIcon, url: '/admin/banners/create', color: 'indigo' },
            { label: 'Export ডেটা', icon: ArrowUpTrayIcon, url: '/admin/export', color: 'slate' },
            { label: 'সিস্টেম হেলথ', icon: WrenchScrewdriverIcon, url: '/admin/system/health', color: 'zinc' },
          ]"
          :key="qa.label"
          type="button"
          class="group flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
          @click="router.push(qa.url)"
        >
          <div :class="['flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110', colorMap[qa.color].bg]">
            <component :is="qa.icon" :class="['h-5 w-5', colorMap[qa.color].icon]" />
          </div>
          <span class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ qa.label }}</span>
        </button>
      </div>
    </section>

    <!-- ══════════ FOOTER TIP ══════════ -->
    <div class="flex items-start gap-4 rounded-2xl border border-primary-100 bg-primary-50 p-5 dark:border-primary-900/30 dark:bg-primary-900/10">
      <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30">
        <BellIcon class="h-5 w-5 text-primary-600 dark:text-primary-400" />
      </div>
      <div>
        <h3 class="font-semibold text-primary-700 dark:text-primary-300">প্রো টিপ: নোটিফিকেশন সেটআপ করুন</h3>
        <p class="mt-1 text-sm text-primary-600 dark:text-primary-400">
          নতুন অর্ডার, নতুন ভেন্ডর রেজিস্ট্রেশন, লো-স্টক অ্যালার্ট পেতে
          <button class="underline" type="button" @click="router.push('/admin/notifications/preferences')">নোটিফিকেশন প্রেফারেন্স</button>
          এ গিয়ে আপনার পছন্দ সেট করুন। কখনো গুরুত্বপূর্ণ আপডেট মিস হবে না।
        </p>
      </div>
    </div>

  </div>
</template>
