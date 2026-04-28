<script setup>
import logoCompleto from '@/assets/images/Logo-completo.png'
import DashboardSidebar from '@/components/DashboardSidebar.vue'
import UserMenu from '@/components/UserMenu.vue'
import dailyMaintenanceIcon from '@/assets/images/admin/tareas-diarias.png'
import monthlyMaintenanceIcon from '@/assets/images/admin/calendario.png'
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="h-screen min-h-0 overflow-hidden bg-gray-100 flex flex-col">
    <!-- Navbar -->
    <div class="shrink-0 bg-white shadow-sm border-b border-gray-200">
      <div class="px-4 py-4 flex items-center justify-between">
        <router-link to="/" class="flex items-center">
          <img :src="logoCompleto" alt="Transportes Flores Vargas" class="h-16 w-auto object-contain hover:opacity-80 transition-opacity" />
        </router-link>
        <UserMenu />
      </div>
    </div>

    <div class="flex flex-1 min-h-0 overflow-hidden">
      <DashboardSidebar />

      <main class="flex-1 min-h-0 flex items-center justify-center py-8 pl-4 pr-6 sm:pl-4 sm:pr-8">
        <div class="w-full max-w-2xl flex flex-col gap-5">

          <!-- Card: Diario -->
          <button
            @click="router.push('/admin/mantencion-vehicular/diario')"
            class="group flex items-center gap-8 bg-white rounded-2xl border-2 border-gray-200 shadow-sm px-10 py-8 hover:border-primary hover:shadow-md transition-all duration-200 text-left w-full"
          >
            <img
              :src="dailyMaintenanceIcon"
              alt="Mantenciones diarias"
              class="w-20 h-20 object-contain shrink-0 transition-transform duration-200 group-hover:scale-105"
            />
            <span class="text-2xl font-titles font-bold text-slate-800 leading-tight group-hover:text-primary transition-colors">
              Mantenciones<br />diarias
            </span>
          </button>

          <!-- Card: Mensual -->
          <button
            @click="router.push('/admin/mantencion-vehicular/historial-mensual')"
            class="group flex items-center gap-8 bg-white rounded-2xl border-2 border-gray-200 shadow-sm px-10 py-8 hover:border-primary hover:shadow-md transition-all duration-200 text-left w-full"
          >
            <img
              :src="monthlyMaintenanceIcon"
              alt="Mantenciones mensuales"
              class="w-20 h-20 object-contain shrink-0 transition-transform duration-200 group-hover:scale-105"
            />
            <span class="text-2xl font-titles font-bold text-slate-800 leading-tight group-hover:text-primary transition-colors">
              Mantenciones<br />mensuales
            </span>
          </button>

        </div>
      </main>
    </div>
  </div>
</template>
