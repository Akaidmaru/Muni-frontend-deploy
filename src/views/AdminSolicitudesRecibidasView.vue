<script setup>
import { useRouter } from 'vue-router'
import logoCompleto from '@/assets/images/Logo-completo.png'
import DashboardSidebar from '@/components/DashboardSidebar.vue'
import UserMenu from '@/components/UserMenu.vue'

const router = useRouter()
</script>

<template>
  <div class="flex flex-col min-h-screen bg-gray-100">
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

      <main class="flex-1 pt-4 pb-10 pl-14 pr-4 overflow-hidden flex flex-col min-w-0">
        <div class="w-full mb-3 shrink-0">
          <button
            @click="router.back()"
            class="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary transition-colors"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Volver
          </button>
        </div>

        <div class="bg-white rounded-3xl border-2 border-slate-300 shadow-sm flex-1 flex flex-col overflow-hidden w-full">
          <div class="px-6 py-5 border-b border-slate-200 shrink-0">
            <h1 class="text-xl font-titles font-bold text-text-title text-center">Solicitudes recibidas</h1>
          </div>
          <div class="flex-1 flex flex-col items-center justify-center gap-2 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="text-sm font-titles font-semibold">Por diseñar</p>
            <p class="text-xs font-titles">Vista de gestión de solicitudes para administrador</p>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>
