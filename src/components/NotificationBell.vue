<script setup>
import { computed, ref } from 'vue'
import { useNotificationStore } from '@/stores/notifications'

const notifStore = useNotificationStore()
const open = ref(false)

const unread = computed(() => notifStore.notifications.filter(n => !n.read).length)

const toggle = () => {
  open.value = !open.value
  if (open.value) notifStore.markAllRead()
}

const close = () => { open.value = false }
</script>

<template>
  <div class="relative">
    <!-- Botón campanita -->
    <button @click="toggle" class="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>

      <!-- Badge -->
      <span
        v-if="unread > 0"
        class="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center"
      >
        {{ unread > 9 ? '9+' : unread }}
      </span>
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
        class="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden"
      >
        <!-- Header -->
        <div class="px-4 py-3 border-b border-gray-100">
          <p class="text-sm font-semibold text-gray-700">Notificaciones</p>
        </div>

        <!-- Lista -->
        <ul class="max-h-72 overflow-y-auto divide-y divide-gray-50">
          <li v-if="notifStore.notifications.length === 0" class="px-4 py-6 text-center text-sm text-gray-400">
            Sin notificaciones
          </li>
          <li
            v-for="notif in notifStore.notifications"
            :key="notif.id"
            class="px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <p class="text-sm text-gray-700">{{ notif.message }}</p>
            <p class="text-xs text-gray-400 mt-1">{{ new Date(notif.at).toLocaleTimeString() }}</p>
          </li>
        </ul>
      </div>
    </transition>

    <!-- Backdrop -->
    <div v-if="open" class="fixed inset-0 z-40" @click="close" />
  </div>
</template>