<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth   = useAuthStore()
const open   = ref(false)

const toggle = () => { open.value = !open.value }
const close  = () => { open.value = false }

const handleLogout = () => {
  auth.logout()
  router.push('/')
}
</script>

<template>
  <div class="relative">
    <!-- Trigger: nombre + avatar -->
    <button
      @click="toggle"
      class="flex items-center gap-3 cursor-pointer group"
    >
      <span class="font-body text-text-title font-semibold group-hover:text-primary transition-colors">{{ auth.fullName }}</span>
      <div class="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg group-hover:ring-2 group-hover:ring-primary/30 transition-all">
        {{ auth.initials }}
      </div>
      <!-- Chevron -->
      <svg
        class="w-4 h-4 text-gray-400 transition-transform duration-200"
        :class="{ 'rotate-180': open }"
        fill="none" viewBox="0 0 24 24" stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- Dropdown -->
    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 scale-95 -translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 -translate-y-1"
    >
      <div
        v-if="open"
        class="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50"
      >
        <!-- User info -->
        <div class="px-4 py-3 border-b border-gray-100">
          <p class="text-sm font-semibold text-text-title font-titles">{{ auth.fullName }}</p>
          <p class="text-xs text-text-secondary font-body mt-0.5">{{ auth.user?.email }}</p>
        </div>

        <!-- Cerrar sesión -->
        <button
          @click="handleLogout"
          class="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors font-body"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Cerrar sesión
        </button>
      </div>
    </transition>

    <!-- Backdrop -->
    <div v-if="open" class="fixed inset-0 z-40" @click="close" />
  </div>
</template>
