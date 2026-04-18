<script setup>
import { ref, watch } from 'vue'
import { useNotificationStore } from '@/stores/notifications'

const notifStore = useNotificationStore()
const visible = ref(false)
const current = ref(null)
let timer = null

watch(
  () => notifStore.notifications[0],
  (newNotif) => {
    if (!newNotif || newNotif.read) return
    current.value = newNotif
    visible.value = true
    clearTimeout(timer)
    timer = setTimeout(() => { visible.value = false }, 4000)
  }
)
</script>

<template>
  <transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0 translate-y-4"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-4"
  >
    <div
      v-if="visible && current"
      class="fixed bottom-6 right-6 z-50 flex items-start gap-3 bg-white border border-gray-100 shadow-lg rounded-xl px-4 py-3 max-w-sm"
    >
      <!-- Icono -->
      <div class="mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        :class="current.type === 'resolved' ? 'bg-green-100' : 'bg-blue-100'"
      >
        <svg v-if="current.type === 'resolved'" class="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <svg v-else class="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
        </svg>
      </div>

      <!-- Texto -->
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-gray-700">
          {{ current.type === 'resolved' ? 'Caso resuelto' : 'Nuevo reporte' }}
        </p>
        <p class="text-xs text-gray-500 mt-0.5 truncate">{{ current.message }}</p>
      </div>

      <!-- Cerrar -->
      <button @click="visible = false" class="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  </transition>
</template>