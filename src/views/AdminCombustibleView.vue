<script setup>
import { useRouter } from 'vue-router'
import logoCompleto from '@/assets/images/Logo-completo.png'
import DashboardSidebar from '@/components/DashboardSidebar.vue'
import UserMenu from '@/components/UserMenu.vue'

const router = useRouter()
</script>

<template>
  <div class="h-screen min-h-0 overflow-hidden bg-background flex flex-col font-sans">
    <div class="shrink-0 bg-white shadow-sm border-b border-gray-200">
      <div class="px-4 py-4 flex items-center justify-between">
        <router-link to="/" class="flex items-center">
          <img :src="logoCompleto" alt="Transportes Flores Vargas" class="h-16 w-auto object-contain hover:opacity-80 transition-opacity" />
        </router-link>
        <UserMenu />
      </div>
    </div>
    <div class="flex flex-1 min-h-0 overflow-hidden min-w-0">
      <DashboardSidebar />
      <main class="flex-1 min-h-0 overflow-y-auto pt-4 pb-10 pl-4 pr-3 sm:pr-6">
        <div class="mb-3">
          <button
            type="button"
            @click="router.back()"
            class="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary transition-colors"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Volver
          </button>
        </div>
        <div class="max-w-3xl">
          <h1 class="text-2xl sm:text-3xl font-titles font-extrabold text-slate-900 tracking-tight mb-2">Combustible</h1>
          <p class="text-sm text-slate-600 font-body">Sección en preparación. Próximamente podrás gestionar combustible desde aquí.</p>
        </div>
      </main>
    </div>
  </div>
</template>
