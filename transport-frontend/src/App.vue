<script setup>
import Navbar from './components/Navbar.vue'
import Footer from './components/Footer.vue'
import WhatsAppFAB from './components/WhatsAppFAB.vue'
</script>

<template>
  <div class="min-h-screen bg-background font-sans flex flex-col">
    <Navbar v-if="!['/clientes', '/registro'].includes($route.path)" />
    <main class="flex-grow">
      <RouterView />
    </main>
    <Footer v-if="!['/clientes', '/registro'].includes($route.path)" />
    
    <!-- WhatsApp FAB - visible en todas las páginas -->
    <WhatsAppFAB />
  </div>
</template>

