<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from './components/Navbar.vue'
import Footer from './components/Footer.vue'
import WhatsAppFAB from './components/WhatsAppFAB.vue'
import { getApiBaseUrl, setRuntimeApiBaseUrl } from './services/axios'

const route = useRoute()

// Páginas donde NO se muestra Navbar/Footer/FAB
const hiddenPaths = ['/clientes', '/registro', '/verificar-correo']
const isPublicPage = computed(() =>
  !route.meta.requiresAuth && !hiddenPaths.includes(route.path)
)
const showFAB = computed(() =>
  !route.meta.requiresAuth && !hiddenPaths.includes(route.path)
)

const showBackendPrompt = ref(false)
const backendUrlInput = ref('')
const backendUrlError = ref('')

const openBackendPrompt = () => {
  backendUrlInput.value = getApiBaseUrl()
  backendUrlError.value = ''
  showBackendPrompt.value = true
}

const normalizeUrl = (url) => String(url || '').trim().replace(/\/+$/, '')

const saveBackendUrl = () => {
  const normalized = normalizeUrl(backendUrlInput.value)

  if (!/^https?:\/\//i.test(normalized)) {
    backendUrlError.value =
      'La URL debe comenzar con http:// o https://'
    return
  }

  setRuntimeApiBaseUrl(normalized)
  showBackendPrompt.value = false
  window.location.reload()
}

const closeBackendPrompt = () => {
  showBackendPrompt.value = false
}

onMounted(() => {
  const runtimeUrl = localStorage.getItem('runtime_api_base_url')
  if (!runtimeUrl) {
    openBackendPrompt()
  }
})
</script>

<template>
  <div class="min-h-screen bg-background font-sans flex flex-col">
    <div
      v-if="showBackendPrompt"
      class="fixed inset-0 z-[1000] bg-black/50 flex items-center justify-center px-4"
    >
      <div class="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 border border-gray-200">
        <h2 class="text-xl font-bold text-text-title mb-2">Configurar Backend</h2>
        <p class="text-sm text-gray-600 mb-4">
          Ingresa la URL del backend para conectar la app.
          Ejemplo: http://192.168.1.2:3000
        </p>

        <input
          v-model="backendUrlInput"
          type="text"
          placeholder="http://192.168.1.2:3000"
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
        />

        <p v-if="backendUrlError" class="text-sm text-red-600 mt-2">
          {{ backendUrlError }}
        </p>

        <div class="mt-5 flex items-center justify-end gap-3">
          <button
            @click="closeBackendPrompt"
            class="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Usar actual
          </button>
          <button
            @click="saveBackendUrl"
            class="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover"
          >
            Guardar y recargar
          </button>
        </div>
      </div>
    </div>

    <button
      @click="openBackendPrompt"
      class="fixed bottom-4 left-4 z-[999] px-4 py-2 rounded-full bg-primary text-white text-sm font-semibold shadow-lg hover:bg-primary-hover"
      type="button"
    >
      Configurar backend
    </button>

    <Navbar v-if="isPublicPage" />
    <main class="flex-grow">
      <RouterView />
    </main>
    <Footer v-if="isPublicPage" />
    
    <WhatsAppFAB v-if="showFAB" />
  </div>
</template>

