<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/axios'
import logoCompleto from '@/assets/images/Logo-completo.png'
import DashboardSidebar from '@/components/DashboardSidebar.vue'
import UserMenu from '@/components/UserMenu.vue'

const router = useRouter()

const message = ref('')
const limit = ref(10)
const loading = ref(false)
const conversation = ref([])

const quickPrompts = [
  'Dame los 5 primeros camiones',
  'Cuenta cuántos usuarios hay por rol',
  'Muestra los últimos 10 reportes de problemas abiertos',
  'Trae los últimos 10 viajes completados',
]

const applyPrompt = (value) => {
  message.value = value
}

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
    return
  }

  router.push('/dashboard-admin')
}

const ask = async () => {
  if (!message.value.trim()) {
    return
  }

  loading.value = true

  const question = message.value.trim()
  conversation.value.push({ role: 'user', content: question })

  try {
    const { data } = await api.post('/ai-chat/query', {
      message: question,
      limit: Number(limit.value) || 10,
    })

    conversation.value.push({
      role: 'assistant',
      content: data?.answer || 'No se recibió una respuesta textual.',
      payload: data,
    })

    message.value = ''
  } catch (requestError) {
    const backendMessage = requestError.response?.data?.message
    const errorText = Array.isArray(backendMessage)
      ? backendMessage.join(', ')
      : backendMessage || 'No se pudo procesar la consulta.'

    conversation.value.push({
      role: 'assistant',
      content: errorText,
      isError: true,
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col">
    <div class="bg-white shadow-sm border-b border-gray-200">
      <div class="px-4 py-4 flex items-center justify-between">
        <router-link to="/" class="flex items-center">
          <img
            :src="logoCompleto"
            alt="Transportes Flores Vargas"
            class="h-16 w-auto object-contain hover:opacity-80 transition-opacity"
          />
        </router-link>
        <UserMenu />
      </div>
    </div>

    <div class="flex flex-1 overflow-hidden">
      <DashboardSidebar />

      <main class="flex-1 py-8 px-6 overflow-y-auto">
        <div class="max-w-6xl mx-auto space-y-5">
          <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <button
              @click="goBack"
              class="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-blue-900 transition-colors mb-5"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
              Volver
            </button>

            <h1 class="text-3xl font-titles font-bold text-text-title">Asistente IA de Base de Datos</h1>
            <p class="text-text-secondary mt-2">
              Consulta datos de todo el sistema con lenguaje natural. El backend traduce tu petición a consultas seguras.
            </p>

            <div class="mt-5 grid grid-cols-1 md:grid-cols-4 gap-3">
              <button
                v-for="prompt in quickPrompts"
                :key="prompt"
                type="button"
                @click="applyPrompt(prompt)"
                class="text-left text-sm px-3 py-3 rounded-xl border border-blue-200 bg-blue-50/60 text-blue-900 hover:bg-blue-100 transition-colors"
              >
                {{ prompt }}
              </button>
            </div>

            <div class="mt-6 space-y-3">
              <label class="block text-sm font-semibold text-slate-700">Tu consulta</label>
              <textarea
                v-model="message"
                rows="4"
                class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Ejemplo: Muéstrame los 10 viajes más recientes completados"
              />

              <div class="flex flex-wrap items-center gap-3">
                <label class="text-sm font-medium text-slate-700" for="limit">Límite sugerido</label>
                <input
                  id="limit"
                  v-model.number="limit"
                  type="number"
                  min="1"
                  max="50"
                  class="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />

                <button
                  :disabled="loading"
                  type="button"
                  @click="ask"
                  class="px-5 py-2.5 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {{ loading ? 'Consultando...' : 'Consultar IA' }}
                </button>
              </div>

            </div>
          </div>

          <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <h2 class="text-xl font-titles font-bold text-text-title mb-4">Conversación</h2>

            <div v-if="conversation.length === 0" class="text-sm text-slate-500">
              Aún no hay consultas. Escribe una pregunta para comenzar.
            </div>

            <div v-else class="space-y-4">
              <article
                v-for="(item, index) in conversation"
                :key="index"
                class="rounded-2xl border p-4"
                :class="{
                  'border-blue-200 bg-blue-50/60': item.role === 'user',
                  'border-red-200 bg-red-50/60': item.role !== 'user' && item.isError,
                  'border-slate-200 bg-slate-50/70': item.role !== 'user' && !item.isError,
                }"
              >
                <p class="text-xs uppercase tracking-wide font-semibold mb-2"
                  :class="{
                    'text-blue-800': item.role === 'user',
                    'text-red-700': item.role !== 'user' && item.isError,
                    'text-slate-600': item.role !== 'user' && !item.isError,
                  }"
                >
                  {{ item.role === 'user' ? 'Tú' : 'Asistente IA' }}
                </p>

                <p class="text-sm whitespace-pre-wrap"
                  :class="item.isError ? 'text-red-800' : 'text-slate-800'"
                >{{ item.content }}</p>

              </article>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>