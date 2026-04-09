<script setup>
import logoCompleto from '@/assets/images/Logo-completo.png'
import DashboardSidebar from '@/components/DashboardSidebar.vue'
import UserMenu from '@/components/UserMenu.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex flex-col">
    <div class="bg-white shadow-sm border-b border-gray-200">
      <div class="px-4 py-4 flex items-center justify-between">
        <router-link to="/" class="flex items-center">
          <img :src="logoCompleto" alt="Transportes Flores Vargas" class="h-16 w-auto object-contain hover:opacity-80 transition-opacity" />
        </router-link>
        <UserMenu />
      </div>
    </div>

    <div class="flex flex-1 overflow-hidden">
      <DashboardSidebar />
      <main class="flex-1 py-10 px-6 overflow-hidden flex items-start justify-center">
        <div class="w-full max-w-5xl">
          <div class="bg-white rounded-3xl border-2 border-slate-300 shadow-sm p-10">
            <button
              @click="router.push('/admin/mantencion-vehicular')"
              class="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-blue-900 transition-colors mb-6"
            >
              <span aria-hidden="true">←</span> Volver
            </button>
            <h1 class="text-3xl font-titles font-bold text-text-title text-center mb-4">
              Mantenimiento vehicular semanal
            </h1>
            <p class="text-text-secondary text-center">Sección en desarrollo.</p>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>
