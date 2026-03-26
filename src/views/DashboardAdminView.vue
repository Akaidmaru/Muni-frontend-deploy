<script setup>
import { useRouter } from 'vue-router'
import logoCompleto from '@/assets/images/Logo-completo.png'
import historialIcon from '@/assets/images/Historial.png'
import { useAuthStore } from '@/stores/auth'
import UserMenu from '@/components/UserMenu.vue'

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
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b border-gray-200">
      <div class="container mx-auto px-4 py-4 flex items-center justify-between">
        <router-link to="/" class="flex items-center">
          <img :src="logoCompleto" alt="Transportes Flores Vargas" class="h-16 w-auto object-contain hover:opacity-80 transition-opacity" />
        </router-link>
        <!-- User Menu -->
        <UserMenu />
      </div>
    </div>

    <!-- Main Content -->
    <div class="container mx-auto px-4 py-16">
      <div class="max-w-4xl mx-auto">
        <div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-100 mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h1 class="text-3xl font-titles font-bold text-text-title mb-4 text-center">Panel de Administración</h1>
        <p class="text-text-secondary font-body text-lg mb-10 text-center">
          Accede a las principales secciones de gestión del sistema.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            @click="goToAdminUsers"
            class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 h-52 flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-[0.99]"
          >
            <div class="text-5xl mb-4">👥</div>
            <span class="text-xl font-titles font-semibold text-text-title">Gestión de Usuarios</span>
          </button>

          <button
            @click="goToAdminHistory"
            class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 h-52 flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-[0.99]"
          >
            <img :src="historialIcon" alt="Historial de viajes" class="w-16 h-16 object-contain mb-4" />
            <span class="text-xl font-titles font-semibold text-text-title">Historial de Viajes</span>
          </button>

          <button
            @click="goToAdminReports"
            class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 h-52 flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-[0.99]"
          >
            <div class="text-5xl mb-4">📊</div>
            <span class="text-xl font-titles font-semibold text-text-title">Reportes</span>
          </button>

          <button
            @click="goToAdminMaintenance"
            class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 h-52 flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-[0.99]"
          >
            <div class="text-5xl mb-4">🚚</div>
            <span class="text-xl font-titles font-semibold text-text-title">Mantención Vehicular</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
