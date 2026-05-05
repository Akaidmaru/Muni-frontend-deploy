<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import NotificationBell from '@/components/NotificationBell.vue'
import { useNotificationStore } from '@/stores/notifications'

const router = useRouter()
const auth   = useAuthStore()
const open   = ref(false)

const toggle = () => { open.value = !open.value }
const close  = () => { open.value = false }



const handleLogout = () => {
  useNotificationStore().disconnect()
  auth.logout()
  router.push('/')
}

const roleConfig = {
  ADMIN:     { label: 'Administrador', class: 'bg-primary/10 text-primary' },
  DRIVER:    { label: 'Conductor',     class: 'bg-green-100 text-green-700' },
  EMPLOYEE:  { label: 'Funcionario',   class: 'bg-amber-100 text-amber-700' },
  DIRECTION: { label: 'Dirección',     class: 'bg-indigo-100 text-indigo-700' },
  PATIENT:   { label: 'Paciente',      class: 'bg-teal-100 text-teal-700' },
}
const roleInfo = computed(() => roleConfig[auth.userRole] ?? null)
</script>

<template>
  <div class="relative flex items-center gap-0.5 sm:gap-1.5">
    <NotificationBell />
    <button
      @click="toggle"
      class="flex items-center gap-1 sm:gap-2 rounded-full border border-transparent py-1 pl-1 sm:pl-3 pr-1.5 cursor-pointer group hover:border-slate-200 hover:bg-slate-50 transition-all"
    >
      <span class="hidden sm:block max-w-[9rem] truncate whitespace-nowrap text-right font-body text-sm font-semibold text-text-title group-hover:text-primary transition-colors">{{ auth.fullName }}</span>
      <div class="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center font-bold text-base shadow-sm ring-2 ring-white group-hover:ring-primary/20 transition-all">
        {{ auth.initials }}
      </div>
      <!-- Chevron -->
      <svg
        class="w-4 h-4 text-slate-400 transition-transform duration-200 group-hover:text-primary"
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
          <p class="text-xs text-text-secondary font-body mt-0.5 truncate whitespace-nowrap" :title="auth.user?.email">
            {{ auth.user?.email }}
          </p>
          <span
            v-if="roleInfo"
            class="inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-semibold font-titles"
            :class="roleInfo.class"
          >{{ roleInfo.label }}</span>
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
