<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import logoCompleto from '@/assets/images/Logo-completo.png'
import api from '@/services/axios'

const route  = useRoute()
const router = useRouter()

const token       = ref('')
const newPassword = ref('')
const confirm     = ref('')
const loading     = ref(false)
const error       = ref('')
const success     = ref(false)

onMounted(() => {
    token.value = String(route.query.token || '')
    if (!token.value) error.value = 'El enlace de restablecimiento no es válido.'
})

const handleSubmit = async () => {
    error.value = ''

    if (newPassword.value.length < 6) {
        error.value = 'La contraseña debe tener al menos 6 caracteres.'
        return
    }
    if (newPassword.value !== confirm.value) {
        error.value = 'Las contraseñas no coinciden.'
        return
    }

    loading.value = true
    try {
        await api.post('/auth/reset-password', {
            token: token.value,
            newPassword: newPassword.value,
        })
        success.value = true
    } catch (err) {
        const msg = err?.response?.data?.message
        error.value = Array.isArray(msg) ? msg.join(', ') : msg || 'El enlace es inválido o ha expirado.'
    } finally {
        loading.value = false
    }
}
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col items-center justify-center py-8 px-4">
    <div class="bg-white py-10 px-6 sm:px-10 shadow-xl rounded-2xl w-full max-w-lg border-t-4 border-primary relative">
      <button @click="router.push('/clientes')" class="absolute top-5 left-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-primary transition-colors">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Volver
      </button>

      <router-link to="/" class="flex justify-center mb-6 mt-4">
        <img :src="logoCompleto" alt="Transportes Flores Vargas" class="h-16 sm:h-20 w-auto object-contain hover:opacity-80 transition-opacity" />
      </router-link>

      <h2 class="text-2xl sm:text-3xl font-bold text-center text-text-title font-titles mb-8">Nueva contraseña</h2>

      <div v-if="success" class="text-center">
        <svg class="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <p class="text-slate-700 font-semibold text-lg mb-2">¡Contraseña actualizada!</p>
        <p class="text-sm text-slate-500 mb-6">Ya puedes iniciar sesión con tu nueva contraseña.</p>
        <button @click="router.push('/clientes')" class="px-8 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover transition-all">
          Ir al inicio de sesión
        </button>
      </div>

      <form v-else @submit.prevent="handleSubmit" class="space-y-5">
        <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-body">
          {{ error }}
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Nueva contraseña</label>
          <input
            v-model="newPassword"
            type="password"
            placeholder="Mínimo 6 caracteres"
            :disabled="!token"
            class="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary font-body disabled:opacity-50"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Confirmar contraseña</label>
          <input
            v-model="confirm"
            type="password"
            placeholder="Repite la contraseña"
            :disabled="!token"
            class="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary font-body disabled:opacity-50"
          />
        </div>

        <div class="flex justify-end pt-2">
          <button
            type="submit"
            :disabled="loading || !token"
            class="w-full sm:w-auto px-8 py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg v-if="loading" class="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            {{ loading ? 'Guardando…' : 'Guardar contraseña' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
