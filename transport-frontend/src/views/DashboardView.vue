<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import logoCompleto from '@/assets/images/Logo-completo.png'
import registroIcon from '@/assets/images/Registro.png'
import historialIcon from '@/assets/images/Historial.png'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const navigateTo = (route) => {
  router.push(route)
}

// Título dinámico según rol
const roleTitle = {
  conductor:   'Conductor',
  funcionario: 'Funcionario',
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b border-gray-200">
      <div class="container mx-auto px-4 py-4 flex items-center justify-between">
        <!-- Logo -->
        <router-link to="/" class="flex items-center">
          <img :src="logoCompleto" alt="Transportes Flores Vargas" class="h-16 w-auto object-contain hover:opacity-80 transition-opacity" />
        </router-link>
        
        <!-- User Info -->
        <div class="flex items-center gap-3">
          <span class="font-body text-text-title font-semibold">{{ auth.fullName }}</span>
          <div class="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">
            {{ auth.initials }}
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="container mx-auto px-4 py-16">
      <div class="max-w-2xl mx-auto">
        <h1 class="text-h1 font-titles font-semibold text-text-title text-center mb-12">Perfil de sesión - {{ roleTitle[auth.userRole] || auth.userRole }}</h1>
        
        <!-- Action Buttons -->
        <div class="space-y-6">
          <!-- Registro diario Button -->
          <button 
            @click="navigateTo(auth.isFuncionario ? '/registro-diario-funcionario' : '/registro-diario')"
            class="w-full bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 flex items-center gap-6 border border-gray-100 hover:border-primary hover:-translate-y-1 active:scale-98"
          >
            <div class="flex-shrink-0">
              <img :src="registroIcon" alt="Registro diario" class="w-16 h-16 object-contain" />
            </div>
            <span class="text-2xl font-titles font-semibold text-text-title">Registro diario</span>
          </button>

          <!-- Historial de viajes Button -->
          <button 
            @click="navigateTo('/historial-viajes')"
            class="w-full bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 flex items-center gap-6 border border-gray-100 hover:border-primary hover:-translate-y-1 active:scale-98"
          >
            <div class="flex-shrink-0">
              <img :src="historialIcon" alt="Historial de viajes" class="w-16 h-16 object-contain" />
            </div>
            <span class="text-2xl font-titles font-semibold text-text-title">Historial de viajes</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
