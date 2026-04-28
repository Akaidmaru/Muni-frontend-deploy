<script setup>
import { useRouter } from 'vue-router'
import logoCompleto from '@/assets/images/Logo-completo.png'
import nuevaIcon from '@/assets/images/Direction/nueva.png'
import historialIcon from '@/assets/images/Direction/Historial.png'
import UserMenu from '@/components/UserMenu.vue'
import DashboardSidebar from '@/components/DashboardSidebar.vue'

const router = useRouter()
</script>

<template>
  <div class="h-screen min-h-0 overflow-hidden bg-background flex flex-col">
    <!-- Header -->
    <div class="shrink-0 bg-white shadow-sm border-b border-gray-200">
      <div class="px-4 py-4 flex items-center justify-between">
        <router-link to="/" class="flex items-center">
          <img :src="logoCompleto" alt="Transportes Flores Vargas" class="h-16 w-auto object-contain hover:opacity-80 transition-opacity" />
        </router-link>
        <UserMenu />
      </div>
    </div>

    <!-- Main Wrapper -->
    <div class="flex flex-1 min-h-0 overflow-hidden">
      <DashboardSidebar />

      <!-- Main Content -->
      <main class="flex-1 min-h-0 overflow-y-auto pt-4 pb-10 pl-4 pr-4 sm:pr-6 lg:pr-8 flex flex-col min-w-0">
        <div class="bg-white rounded-[2rem] border-2 border-slate-300 shadow-sm flex flex-1 flex-col overflow-hidden w-full min-w-0">
          <div class="px-4 sm:px-6 lg:px-10 pt-6 pb-1 shrink-0">
            <button @click="router.back()" class="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary transition-colors py-1">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Volver
            </button>
          </div>
          <div class="px-4 sm:px-6 lg:px-10 pt-4 lg:pt-6 pb-4 shrink-0">
            <h1 class="text-xl sm:text-2xl md:text-3xl font-titles font-extrabold text-slate-900 tracking-tight text-center">Solicitudes</h1>
          </div>
          <div class="flex-1 flex items-center justify-center px-6 py-8 sm:px-8 sm:py-10">
            <div class="w-full max-w-2xl">
              <div class="space-y-6">

                <button
                  @click="router.push('/admin/solicitudes/nueva')"
                  class="w-full bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-5 sm:p-8 md:py-16 lg:py-20 flex items-center justify-center gap-4 sm:gap-6 border border-gray-100 hover:border-primary hover:-translate-y-1 active:scale-98"
                >
                  <div class="flex-shrink-0">
                    <img :src="nuevaIcon" alt="Nueva solicitud" class="w-16 h-16 object-contain" />
                  </div>
                  <span class="text-lg sm:text-2xl font-titles font-semibold text-text-title">Nueva solicitud</span>
                </button>

                <button
                  @click="router.push('/admin/solicitudes/historial')"
                  class="w-full bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-5 sm:p-8 md:py-16 lg:py-20 flex items-center justify-center gap-4 sm:gap-6 border border-gray-100 hover:border-primary hover:-translate-y-1 active:scale-98"
                >
                  <div class="flex-shrink-0">
                    <img :src="historialIcon" alt="Historial de solicitudes" class="w-16 h-16 object-contain" />
                  </div>
                  <span class="text-lg sm:text-2xl font-titles font-semibold text-text-title">Historial de solicitudes</span>
                </button>

              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>
