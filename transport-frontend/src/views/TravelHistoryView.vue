<script setup>
import logoCompleto from '@/assets/images/Logo-completo.png'
import DashboardSidebar from '@/components/DashboardSidebar.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b border-gray-200">
      <div class="px-4 py-4 flex items-center justify-between">
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

    <!-- Body: sidebar + content -->
    <div class="flex flex-1">
      <DashboardSidebar />

      <!-- Main content -->
      <main class="flex-1 py-12 px-6">
        <div class="max-w-4xl mx-auto">
          <!-- Main Card -->
          <div class="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100">
            <h1 class="text-3xl font-titles font-bold text-text-title text-center mb-10">Historial de viajes</h1>

            <!-- Placeholder Content -->
            <div class="text-center py-16">
              <div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-100 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p class="text-text-secondary font-body text-lg">No hay viajes registrados aún</p>
              <p class="text-text-secondary font-body text-sm mt-2">Los viajes que registres aparecerán aquí</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>
