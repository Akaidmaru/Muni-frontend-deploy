<script setup>
import logoCompleto from '@/assets/images/Logo-completo.png'
import { useAuthStore } from '@/stores/auth'
import UserMenu from '@/components/UserMenu.vue'

const auth = useAuthStore()
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
      <div class="max-w-2xl mx-auto text-center">
        <div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h1 class="text-3xl font-titles font-bold text-text-title mb-4">Portal del Paciente</h1>
        <p class="text-text-secondary font-body text-lg mb-6">
          Esta sección está en desarrollo. Pronto podrás ver tus viajes y gestionar tus solicitudes.
        </p>
        <div class="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="p-6 rounded-xl bg-gray-50 border border-gray-200">
              <div class="text-3xl mb-3">🚐</div>
              <h3 class="font-titles font-semibold text-text-title mb-1">Mis viajes</h3>
              <p class="text-sm text-text-secondary">Próximamente</p>
            </div>
            <div class="p-6 rounded-xl bg-gray-50 border border-gray-200">
              <div class="text-3xl mb-3">📋</div>
              <h3 class="font-titles font-semibold text-text-title mb-1">Historial</h3>
              <p class="text-sm text-text-secondary">Próximamente</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
