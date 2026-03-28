<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <nav class="bg-header py-4 px-6 md:px-12 shadow-sm">
    <div class="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
      <!-- Logo -->
      <!-- Logo -->
      <router-link to="/" class="flex items-center gap-4 group">
         <img src="@/assets/images/Logo-completo.png" alt="Transportes Flores Vargas" class="h-16 md:h-20 w-auto object-contain" />
      </router-link>

      <!-- Menu -->
      <div class="flex flex-wrap justify-center gap-4">
        <router-link 
          to="/servicios" 
          class="bg-primary hover:bg-primary-hover text-button text-white font-button text-btn font-bold px-6 py-2 rounded-lg transition-all duration-200 text-center min-w-[120px] hover:shadow-[0_4px_14px_0_rgba(0,0,0,0.39)] hover:-translate-y-1 active:scale-95 transform"
        >
          Servicios
        </router-link>
         <router-link 
          v-if="!['/clientes', '/registro', '/VerifyEmail'].includes($route.path)"
          to="/clientes" 
          class="bg-primary hover:bg-primary-hover text-button text-white font-button text-btn font-bold px-6 py-2 rounded-lg transition-all duration-200 text-center min-w-[120px] hover:shadow-[0_4px_14px_0_rgba(0,0,0,0.39)] hover:-translate-y-1 active:scale-95 transform"
        >
          Clientes
        </router-link>
         <router-link 
          to="/contacto" 
          class="bg-primary hover:bg-primary-hover text-button text-white font-button text-btn font-bold px-6 py-2 rounded-lg transition-all duration-200 text-center min-w-[120px] hover:shadow-[0_4px_14px_0_rgba(0,0,0,0.39)] hover:-translate-y-1 active:scale-95 transform"
        >
          Contacto
        </router-link>
      </div>
    </div>
  </nav>
</template>
