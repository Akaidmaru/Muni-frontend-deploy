<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import logoCompleto from '@/assets/images/Logo-completo.png'
import registroIcon from '@/assets/images/Registro.png'
import historialIcon from '@/assets/images/Historial.png'
import { useAuthStore } from '@/stores/auth'
import UserMenu from '@/components/UserMenu.vue'
import DashboardSidebar from '@/components/DashboardSidebar.vue'

const router = useRouter()
const auth = useAuthStore()

const navigateTo = (route) => {
  router.push(route)
}

</script>

<template>
  <div class="h-screen min-h-0 overflow-hidden bg-background flex flex-col">
    <!-- Header -->
    <div class="shrink-0 bg-white shadow-sm border-b border-gray-200">
      <div class="px-4 py-4 flex items-center justify-between">
        <!-- Logo -->
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
        <div class="container mx-auto pl-2 pr-4 sm:pl-3 sm:pr-4 flex-grow flex items-center justify-center">
          <div class="w-full max-w-2xl">
            
            <!-- Action Buttons -->
        <div class="space-y-6">
          <!-- Registro diario Button -->
          <button 
            @click="navigateTo(auth.isFuncionario ? '/registro-diario-funcionario' : '/registro-diario')"
            class="w-full bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-5 sm:p-8 md:py-16 lg:py-20 flex items-center justify-center gap-4 sm:gap-6 border border-gray-100 hover:border-primary hover:-translate-y-1 active:scale-98"
          >
            <div class="flex-shrink-0">
              <img :src="registroIcon" alt="Registro diario" class="w-16 h-16 object-contain" />
            </div>
            <span class="text-lg sm:text-2xl font-titles font-semibold text-text-title">Registro diario</span>
          </button>

          <!-- Historial de Viajes Button -->
          <button 
            @click="navigateTo(auth.isFuncionario ? '/historial-viajes-funcionario' : '/historial-viajes')"
            class="w-full bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-5 sm:p-8 md:py-16 lg:py-20 flex items-center justify-center gap-4 sm:gap-6 border border-gray-100 hover:border-primary hover:-translate-y-1 active:scale-98"
          >
            <div class="flex-shrink-0">
              <img :src="historialIcon" alt="Historial de Viajes" class="w-16 h-16 object-contain" />
            </div>
            <span class="text-lg sm:text-2xl font-titles font-semibold text-text-title">Historial de Viajes</span>
          </button>
        </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>
