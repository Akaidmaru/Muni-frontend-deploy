<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import registroIcon from '@/assets/images/Registro.png'
import historialIcon from '@/assets/images/Historial.png'

const router = useRouter()
const route  = useRoute()
const auth   = useAuthStore()

const open = ref(false)

// Definir items de navegación según rol
const allNavItems = {
  DRIVER: [
    { label: 'Registro\ndiario',    path: '/registro-diario',  icon: registroIcon,  alt: 'Registro diario' },
    { label: 'Historial de\nviajes', path: '/historial-viajes', icon: historialIcon, alt: 'Historial de viajes' }
  ],
  EMPLOYEE: [
    { label: 'Registro\ndiario',    path: '/registro-diario-funcionario',  icon: registroIcon,  alt: 'Registro diario' },
    { label: 'Historial de\nviajes', path: '/historial-viajes-funcionario', icon: historialIcon, alt: 'Historial de viajes' }
  ],
}

// Usar items del rol actual, o un set por defecto
const navItems = allNavItems[auth.userRole] || allNavItems.DRIVER

const isActive = (path) => route.path === path

const navigate = (path) => {
  router.push(path)
  open.value = false
}

const handleLogout = () => {
  auth.logout()
  router.push('/')
}
</script>

<template>
  <div class="relative z-40 self-start">

    <!-- ── CERRADO: solo el botón ≡ ── -->
    <button
      v-if="!open"
      @click="open = true"
      aria-label="Abrir menú"
      class="m-3 flex flex-col justify-center items-center gap-[5px] w-9 h-9 rounded-md border border-gray-300 bg-white shadow-sm hover:border-primary hover:bg-gray-50 transition-all duration-150"
    >
      <span v-for="i in 3" :key="i" class="block w-4 h-[2px] bg-gray-600 rounded-full" />
    </button>

    <!-- ── ABIERTO: panel sidebar ── -->
    <transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 -translate-x-3"
      enter-to-class="opacity-100 translate-x-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-x-0"
      leave-to-class="opacity-0 -translate-x-3"
    >
      <div
        v-if="open"
        class="relative w-48 bg-white border-r border-gray-200 shadow-sm flex flex-col"
        style="min-height: calc(100vh - 88px);"
      >
        <!-- Botón colapsar (◁) en el borde derecho -->
        <button
          @click="open = false"
          aria-label="Cerrar menú"
          class="absolute -right-3 top-4 w-6 h-6 rounded-full bg-white border border-gray-300 shadow flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <!-- Items de navegación -->
        <nav class="flex flex-col gap-1 pt-6 px-2 flex-1">
          <button
            v-for="item in navItems"
            :key="item.path"
            @click="navigate(item.path)"
            class="flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 w-full text-left group"
            :class="isActive(item.path)
              ? 'bg-blue-50 text-primary'
              : 'text-text-title hover:bg-gray-50 hover:text-primary'"
          >
            <img
              :src="item.icon"
              :alt="item.alt"
              class="w-8 h-8 shrink-0 object-contain transition-transform duration-150 group-hover:scale-110"
            />
            <span
              class="text-sm font-titles font-semibold leading-tight whitespace-pre-line"
              :class="isActive(item.path) ? 'text-primary' : 'text-text-title'"
            >{{ item.label }}</span>
          </button>
        </nav>

        <!-- Botón Cerrar sesión -->
        <div class="px-2 pb-4">
          <button
            @click="handleLogout"
            class="flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 w-full text-left text-red-500 hover:bg-red-50 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span class="text-sm font-titles font-semibold">Cerrar sesión</span>
          </button>
        </div>
      </div>
    </transition>

    <!-- Backdrop para cerrar al hacer click fuera -->
    <div v-if="open" class="fixed inset-0 z-[-1]" @click="open = false" />
  </div>
</template>
