<script setup>
import logoCompleto from '@/assets/images/Logo-completo.png'
import { useAuthStore } from '@/stores/auth'

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
      <div class="max-w-2xl mx-auto text-center">
        <div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-100 mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h1 class="text-3xl font-titles font-bold text-text-title mb-4">Panel de Administración</h1>
        <p class="text-text-secondary font-body text-lg mb-6">
          Esta sección está en desarrollo. Pronto podrás gestionar usuarios, asignar roles y ver reportes.
        </p>
        <div class="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="p-6 rounded-xl bg-gray-50 border border-gray-200">
              <div class="text-3xl mb-3">👥</div>
              <h3 class="font-titles font-semibold text-text-title mb-1">Gestión de usuarios</h3>
              <p class="text-sm text-text-secondary">Próximamente</p>
            </div>
            <div class="p-6 rounded-xl bg-gray-50 border border-gray-200">
              <div class="text-3xl mb-3">🏷️</div>
              <h3 class="font-titles font-semibold text-text-title mb-1">Asignación de roles</h3>
              <p class="text-sm text-text-secondary">Próximamente</p>
            </div>
            <div class="p-6 rounded-xl bg-gray-50 border border-gray-200">
              <div class="text-3xl mb-3">📊</div>
              <h3 class="font-titles font-semibold text-text-title mb-1">Reportes</h3>
              <p class="text-sm text-text-secondary">Próximamente</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
