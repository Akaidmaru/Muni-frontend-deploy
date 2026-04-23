<script setup>
import { useRouter } from 'vue-router'
import logoCompleto from '@/assets/images/Logo-completo.png'
import historialIcon from '@/assets/images/Historial.png'
import tableIcon from '@/assets/images/Images admin nabvar left/table.png'
import { useAuthStore } from '@/stores/auth'
import UserMenu from '@/components/UserMenu.vue'
import DashboardSidebar from '@/components/DashboardSidebar.vue'
import warningIcon from '@/assets/images/admin/warning.png'
import repairIcon from '@/assets/images/admin/repair.png'
import estadisticasIcon from '@/assets/images/Images admin nabvar left/stadistics.png'
const auth = useAuthStore()
const router = useRouter()

const goToAdminHistory = () => {
  router.push('/historial-viajes-admin')
}
const goToAdminUsers = () => {
  router.push('/admin/gestion-usuarios')
}
const goToAdminReports = () => {
  router.push('/admin/reportes')
}
const goToAdminMaintenance = () => {
  router.push('/admin/mantencion-vehicular')
}
const goToAdminEstadisticas = () => {
  router.push('/admin/mantencion-vehicular/estadisticas')
}
</script>

<template>
  <div class="h-screen min-h-0 overflow-hidden bg-background flex flex-col">
    <!-- Header -->
    <div class="shrink-0 bg-white shadow-sm border-b border-gray-200">
      <div class="container mx-auto px-4 py-4 flex items-center justify-between">
        <router-link to="/" class="flex items-center">
          <img :src="logoCompleto" alt="Transportes Flores Vargas" class="h-16 w-auto object-contain hover:opacity-80 transition-opacity" />
        </router-link>
        <!-- User Menu -->
        <UserMenu />
      </div>
    </div>

    <!-- Main Wrapper -->
    <div class="flex flex-1 min-h-0 overflow-hidden">
      <DashboardSidebar />

      <!-- Main Content -->
      <main class="flex-1 flex flex-col overflow-y-auto relative">
        <div class="container mx-auto pl-2 pr-4 sm:pl-3 sm:pr-4 py-8 flex-grow flex items-center justify-center">
          <div class="w-full max-w-4xl">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            @click="goToAdminUsers"
            class="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 sm:p-6 h-auto min-h-[140px] sm:h-52 flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-[0.99]"
          >
            <img :src="tableIcon" alt="Registro" class="w-9 sm:w-12 h-9 sm:h-12 object-contain mb-2 sm:mb-3" />
            <span class="text-base sm:text-xl font-titles font-semibold text-text-title">Registro</span>
          </button>

          <button
            @click="goToAdminHistory"
            class="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 sm:p-6 h-auto min-h-[140px] sm:h-52 flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-[0.99]"
          >
            <img :src="historialIcon" alt="Historial de viajes" class="w-9 sm:w-12 h-9 sm:h-12 object-contain mb-2 sm:mb-3" />
            <span class="text-base sm:text-xl font-titles font-semibold text-text-title">Historial de Viajes</span>
          </button>

          <button
            @click="goToAdminReports"
            class="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 sm:p-6 h-auto min-h-[140px] sm:h-52 flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-[0.99]"
          >
            <img :src="warningIcon" alt="Reportes" class="w-9 sm:w-12 h-9 sm:h-12 object-contain mb-2 sm:mb-3" />
            <span class="text-base sm:text-xl font-titles font-semibold text-text-title">Reportes</span>
          </button>

          <button
            @click="goToAdminMaintenance"
            class="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 sm:p-6 h-auto min-h-[140px] sm:h-52 flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-[0.99]"
          >
            <img :src="repairIcon" alt="Mantenciones" class="w-9 sm:w-12 h-9 sm:h-12 object-contain mb-2 sm:mb-3" />
            <span class="text-base sm:text-xl font-titles font-semibold text-text-title">Mantenciones</span>
          </button>

          <button
            @click="goToAdminEstadisticas"
            class="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 sm:p-6 h-auto min-h-[140px] sm:h-52 flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-[0.99]"
          >
            <img :src="estadisticasIcon" alt="Estadísticas" class="w-9 sm:w-12 h-9 sm:h-12 object-contain mb-2 sm:mb-3" />
            <span class="text-base sm:text-xl font-titles font-semibold text-text-title">Estadísticas</span>
          </button>
        </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>
