<script setup>
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import UserMenu from '@/components/UserMenu.vue'

const auth = useAuthStore()
</script>

<template>
  <nav class="bg-header py-4 px-6 md:px-12 shadow-sm">
    <div class="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
      <!-- Logo -->
      <router-link to="/" class="flex items-center gap-4 group">
         <img src="@/assets/images/Logo-completo.png" alt="Transportes Flores Vargas" class="h-16 md:h-20 w-auto object-contain" />
      </router-link>

      <!-- Menu -->
      <div class="flex flex-wrap justify-center items-center gap-2 md:gap-4 w-full md:w-auto">
        <router-link 
          to="/servicios" 
          class="bg-primary hover:bg-primary-hover text-white font-button text-xs md:text-btn font-bold px-2 md:px-6 py-2 rounded-lg transition-all duration-200 text-center flex-1 md:flex-none md:min-w-[120px] hover:shadow-[0_4px_14px_0_rgba(0,0,0,0.39)] hover:-translate-y-1 active:scale-95 transform whitespace-nowrap"
        >
          Servicios
        </router-link>
        
        <!-- Logged out -->
        <router-link 
          v-if="!auth.isAuthenticated && !['/clientes', '/registro', '/VerifyEmail'].includes($route.path)"
          to="/clientes" 
          class="bg-primary hover:bg-primary-hover text-white font-button text-xs md:text-btn font-bold px-2 md:px-6 py-2 rounded-lg transition-all duration-200 text-center flex-1 md:flex-none md:min-w-[120px] hover:shadow-[0_4px_14px_0_rgba(0,0,0,0.39)] hover:-translate-y-1 active:scale-95 transform whitespace-nowrap"
        >
          Clientes
        </router-link>

        <!-- Logged in (goes to dashboard via router guard) -->
        <router-link 
          v-if="auth.isAuthenticated"
          to="/clientes" 
          class="bg-primary hover:bg-primary-hover text-white font-button text-xs md:text-btn font-bold px-2 md:px-6 py-2 rounded-lg transition-all duration-200 text-center flex-1 md:flex-none md:min-w-[120px] hover:shadow-[0_4px_14px_0_rgba(0,0,0,0.39)] hover:-translate-y-1 active:scale-95 transform whitespace-nowrap"
        >
          Mi Panel
        </router-link>

         <router-link 
          to="/contacto" 
          class="bg-primary hover:bg-primary-hover text-white font-button text-xs md:text-btn font-bold px-2 md:px-6 py-2 rounded-lg transition-all duration-200 text-center flex-1 md:flex-none md:min-w-[120px] hover:shadow-[0_4px_14px_0_rgba(0,0,0,0.39)] hover:-translate-y-1 active:scale-95 transform whitespace-nowrap"
        >
          Contacto
        </router-link>

        <!-- User Menu -->
        <div v-if="auth.isAuthenticated" class="ml-2 md:ml-4 flex-shrink-0">
          <UserMenu />
        </div>
      </div>
    </div>
  </nav>
</template>

