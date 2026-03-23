<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col items-center justify-center px-4">
    <div class="text-center max-w-md">
      <!-- Icon -->
      <div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-100 mb-8">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>

      <!-- Text -->
      <h1 class="text-3xl font-titles font-bold text-text-title mb-4">Acceso denegado</h1>
      <p class="text-text-secondary font-body text-lg mb-10">
        No tienes permiso para acceder a esta página. Contacta al administrador si crees que es un error.
      </p>

      <!-- Actions -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          @click="router.push('/dashboard')"
          class="px-8 py-3 bg-[#215179] hover:bg-blue-900 text-white font-bold rounded-xl shadow-md transition-all duration-200 hover:-translate-y-1"
        >
          Ir al Dashboard
        </button>
        <button
          @click="router.push('/')"
          class="px-8 py-3 bg-white border-2 border-gray-300 hover:border-primary text-text-title font-bold rounded-xl shadow-sm transition-all duration-200 hover:-translate-y-1"
        >
          Ir al Inicio
        </button>
      </div>
    </div>
  </div>
</template>
