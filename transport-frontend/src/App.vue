<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from './components/Navbar.vue'
import Footer from './components/Footer.vue'
import WhatsAppFAB from './components/WhatsAppFAB.vue'

const route = useRoute()

// Páginas donde NO se muestra Navbar/Footer/FAB
const hiddenPaths = ['/clientes', '/registro']
const isPublicPage = computed(() =>
  !route.meta.requiresAuth && !hiddenPaths.includes(route.path)
)
const showFAB = computed(() =>
  !route.meta.requiresAuth && !hiddenPaths.includes(route.path)
)
</script>

<template>
  <div class="min-h-screen bg-background font-sans flex flex-col">
    <Navbar v-if="isPublicPage" />
    <main class="flex-grow">
      <RouterView />
    </main>
    <Footer v-if="isPublicPage" />
    
    <WhatsAppFAB v-if="showFAB" />
  </div>
</template>

