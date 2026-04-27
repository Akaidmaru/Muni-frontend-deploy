<script setup>
import { useRouter } from 'vue-router'
import logoCompleto from '@/assets/images/Logo-completo.png'
import tableIcon from '@/assets/images/Images admin nabvar left/table.png'
import repairIcon from '@/assets/images/admin/repair.png'
import historialIcon from '@/assets/images/Historial.png'
import estadisticasIcon from '@/assets/images/Images admin nabvar left/stadistics.png'
import solicitudesIcon from '@/assets/images/Direction/solicitudes.png'
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
      <main class="flex-1 flex flex-col overflow-y-auto relative">
        <div class="container mx-auto px-4 py-8 flex-grow flex items-center justify-center">
          <div class="w-full max-w-4xl">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

              <button
                @click="router.push('/admin/registro')"
                class="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 sm:p-6 h-auto min-h-[140px] sm:h-52 flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-[0.99]"
              >
                <img :src="tableIcon" alt="Registro" class="w-12 sm:w-16 h-12 sm:h-16 object-contain mb-3 sm:mb-4" />
                <span class="text-base sm:text-xl font-titles font-semibold text-text-title">Registro</span>
              </button>

              <button
                @click="router.push('/admin/mantencion-vehicular')"
                class="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 sm:p-6 h-auto min-h-[140px] sm:h-52 flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-[0.99]"
              >
                <img :src="repairIcon" alt="Mantenimiento Vehicular" class="w-12 sm:w-16 h-12 sm:h-16 object-contain mb-3 sm:mb-4" />
                <span class="text-base sm:text-xl font-titles font-semibold text-text-title">Mantenimiento Vehicular</span>
              </button>

              <button
                @click="router.push('/historial-viajes-admin')"
                class="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 sm:p-6 h-auto min-h-[140px] sm:h-52 flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-[0.99]"
              >
                <img :src="historialIcon" alt="Historial de Viajes" class="w-12 sm:w-16 h-12 sm:h-16 object-contain mb-3 sm:mb-4" />
                <span class="text-base sm:text-xl font-titles font-semibold text-text-title">Historial de Viajes</span>
              </button>

              <button
                @click="router.push('/admin/mantencion-vehicular/estadisticas')"
                class="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 sm:p-6 h-auto min-h-[140px] sm:h-52 flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-[0.99]"
              >
                <img :src="estadisticasIcon" alt="Estadísticas" class="w-12 sm:w-16 h-12 sm:h-16 object-contain mb-3 sm:mb-4" />
                <span class="text-base sm:text-xl font-titles font-semibold text-text-title">Estadísticas</span>
              </button>

              <button
                @click="router.push('/admin/solicitudes')"
                class="col-span-1 md:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-100 p-5 sm:p-6 h-auto min-h-[140px] sm:h-52 flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-[0.99]"
              >
                <img :src="solicitudesIcon" alt="Solicitudes" class="w-12 sm:w-16 h-12 sm:h-16 object-contain mb-3 sm:mb-4" />
                <span class="text-base sm:text-xl font-titles font-semibold text-text-title">Solicitudes</span>
              </button>

            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>
