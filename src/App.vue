<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import Navbar from './components/Navbar.vue'
import Footer from './components/Footer.vue'
import WhatsAppFAB from './components/WhatsAppFAB.vue'
import ToastNotification from '@/components/ToastNotification.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const notifications = useNotificationStore()

// Páginas donde NO se muestra Navbar/Footer/FAB
const hiddenPaths = ['/clientes', '/registro', '/verificar-correo', '/restablecer-contrasena']
const isPublicPage = computed(() =>
  !route.meta.requiresAuth && !hiddenPaths.includes(route.path)
)
const showFAB = computed(() =>
  !route.meta.requiresAuth && !hiddenPaths.includes(route.path)
)

const showGlobalBackButton = computed(() => route.path !== '/')

const fallbackRouteByRole = {
  ADMIN: '/dashboard-admin',
  DRIVER: '/dashboard',
  EMPLOYEE: '/dashboard',
}

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
    return
  }

  if (route.meta?.requiresAuth) {
    const fallback = fallbackRouteByRole[auth.userRole] || '/dashboard'
    router.push(fallback)
    return
  }

  router.push('/')
}

onMounted(() => {
  if (auth.token) {
    notifications.connect(auth.token)
  }
})

watch(
  () => auth.token,
  (token) => {
    if (token) {
      notifications.connect(token)
      return
    }

    notifications.disconnect()
  },
)
</script>

<template>
  <div class="min-h-screen bg-background font-sans flex flex-col">
    <Navbar v-if="isPublicPage" />
    <main class="flex-grow relative">
      <RouterView />
    </main>
    <Footer v-if="isPublicPage" />
    
    <WhatsAppFAB v-if="showFAB" />
    <ToastNotification />
  </div>
</template>
