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
  <div class="h-screen bg-background flex flex-col overflow-hidden">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b border-gray-200">
      <div class="container mx-auto px-4 py-4 flex items-center justify-between">
        <router-link to="/" class="flex items-center">
          <img :src="logoCompleto" alt="Transportes Flores Vargas" class="h-16 w-auto object-contain hover:opacity-80 transition-opacity" />
        </router-link>
        <UserMenu />
      </div>
    </div>

    <!-- Main Wrapper -->
    <div class="flex h-screen overflow-hidden">
      <DashboardSidebar />

      <!-- Main Content -->
      <main class="flex-1 flex flex-col overflow-y-auto relative">
        <div class="container mx-auto px-4 flex-grow flex items-center justify-center">
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
      </main>
    </div>
  </div>
</template>
