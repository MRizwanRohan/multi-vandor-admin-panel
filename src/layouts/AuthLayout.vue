<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Auth Layout — Layout for authentication pages -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed } from 'vue'

const currentYear = computed(() => new Date().getFullYear())
</script>

<template>
  <div class="flex min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Left side - Branding -->
    <div class="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between bg-primary-600 p-12">
      <!-- Logo and tagline -->
      <div>
        <div class="flex items-center space-x-3">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
            <svg class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <span class="text-2xl font-bold text-white">MVE Dashboard</span>
        </div>
        <p class="mt-4 text-lg text-primary-100">
          Multi-Vendor E-commerce Platform
        </p>
      </div>

      <!-- Features list -->
      <div class="space-y-6">
        <div class="flex items-start space-x-4">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
            <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 class="font-semibold text-white">Fast & Reliable</h3>
            <p class="text-sm text-primary-100">Built with modern technologies for optimal performance</p>
          </div>
        </div>

        <div class="flex items-start space-x-4">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
            <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h3 class="font-semibold text-white">Secure</h3>
            <p class="text-sm text-primary-100">Enterprise-grade security for your business</p>
          </div>
        </div>

        <div class="flex items-start space-x-4">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
            <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          </div>
          <div>
            <h3 class="font-semibold text-white">Multi-Vendor Ready</h3>
            <p class="text-sm text-primary-100">Manage multiple vendors and products effortlessly</p>
          </div>
        </div>
      </div>

      <!-- Copyright -->
      <div class="text-sm text-primary-200">
        &copy; {{ currentYear }} MVE Dashboard. All rights reserved.
      </div>
    </div>

    <!-- Right side - Form -->
    <div class="flex w-full flex-col justify-center px-4 py-12 sm:px-6 lg:w-1/2 lg:px-20 xl:px-24">
      <div class="mx-auto w-full max-w-sm lg:max-w-md">
        <!-- Mobile logo -->
        <div class="mb-8 flex items-center justify-center space-x-3 lg:hidden">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600">
            <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <span class="text-xl font-bold text-gray-900 dark:text-white">MVE Dashboard</span>
        </div>

        <!-- Page content -->
        <slot />
      </div>
    </div>
  </div>
</template>
