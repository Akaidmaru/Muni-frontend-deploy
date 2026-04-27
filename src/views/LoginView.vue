<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import logoCompleto from '@/assets/images/Logo-completo.png'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/axios'

const router = useRouter()
const auth   = useAuthStore()

const email    = ref('')
const password = ref('')
const error    = ref('')
const loading  = ref(false)

const handleSubmit = async () => {
    error.value   = ''
    loading.value = true

    const result = await auth.login(email.value, password.value)

    loading.value = false

    if (result.success) {
        const roleRoutes = {
         DRIVER: '/dashboard',
         EMPLOYEE: '/dashboard',
         ADMIN: '/dashboard-admin',
         PATIENT: '/dashboard-paciente',
         DIRECTION: '/dashboard-direccion',
        }
        router.push(roleRoutes[auth.userRole] || '/dashboard')
    } else {
        error.value = result.message || 'Error al iniciar sesión'
    }
}

// ── Forgot password modal ──────────────────────────────────
const forgotModal     = ref(false)
const forgotEmail     = ref('')
const forgotLoading   = ref(false)
const forgotError     = ref('')
const forgotSuccess   = ref(false)

const openForgotModal = () => {
    forgotEmail.value   = email.value
    forgotError.value   = ''
    forgotSuccess.value = false
    forgotModal.value   = true
}

const submitForgot = async () => {
    if (!forgotEmail.value.trim()) {
        forgotError.value = 'Ingresa tu correo electrónico.'
        return
    }
    forgotLoading.value = true
    forgotError.value   = ''
    try {
        await api.post('/auth/forgot-password', { email: forgotEmail.value.trim() })
        forgotSuccess.value = true
    } catch {
        forgotError.value = 'Ocurrió un error. Intenta nuevamente.'
    } finally {
        forgotLoading.value = false
    }
}
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col items-center justify-center py-8 px-4">
     <div class="bg-white py-10 px-6 sm:px-10 shadow-xl rounded-2xl w-full max-w-lg border-t-4 border-primary relative">
         <router-link to="/" class="absolute top-5 left-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-primary transition-colors">
           <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
           Volver
         </router-link>
         <router-link to="/" class="flex justify-center mb-6 mt-4">
            <img :src="logoCompleto" alt="Transportes Flores Vargas" class="h-16 sm:h-20 w-auto object-contain hover:opacity-80 transition-opacity" />
         </router-link>
         <h2 class="text-2xl sm:text-3xl font-bold text-center text-text-title font-titles mb-8">Iniciar sesión</h2>
         
         <!-- Error message -->
         <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-body mb-6">
           {{ error }}
         </div>

         <form @submit.prevent="handleSubmit" class="space-y-6">
            <div>
               <input 
                  type="email" 
                  v-model="email" 
                  placeholder="Ingresa tu email" 
                  required
                  class="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary font-body text-body"
               />
            </div>

            <div>
               <input 
                  type="password" 
                  v-model="password" 
                  placeholder="Ingresa una contraseña" 
                  required
                  class="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary font-body text-body"
               />
            </div>

             <div class="flex justify-end">
                <button type="button" @click="openForgotModal" class="text-sm-body font-bold text-text-title hover:text-primary transition-colors font-body">¿Has olvidado tu contraseña?</button>
             </div>

             <div class="flex justify-end pt-2">
                <button
                  type="submit"
                  :disabled="loading"
                  class="w-full sm:w-auto px-8 py-3 border border-transparent rounded-lg shadow-sm text-btn font-bold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary font-button hover:shadow-[0_4px_14px_0_rgba(0,0,0,0.39)] hover:-translate-y-1 active:scale-95 transform transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span v-if="loading" class="flex items-center gap-2">
                    <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Iniciando...
                  </span>
                  <span v-else>Iniciar sesión</span>
                </button>
             </div>
         </form>
     </div>
     
     <div class="mt-8 text-center text-text-secondary font-body">
        ¿Aún no tienes una cuenta? <router-link to="/registro" class="font-bold underline text-text-title hover:text-primary transition-colors">Regístrate</router-link>
     </div>
  </div>

  <!-- Modal: olvidé mi contraseña -->
  <Teleport to="body">
    <div v-if="forgotModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 relative">

        <button @click="forgotModal = false"
                class="absolute top-4 right-4 w-8 h-8 border border-gray-300 rounded flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        <div class="bg-[#1B2A4A] px-6 py-5 rounded-t-2xl text-center">
          <h3 class="text-xl font-bold text-white">Restablecer contraseña</h3>
        </div>

        <div class="px-8 pt-6 pb-8 space-y-5">
          <div v-if="!forgotSuccess">
            <p class="text-sm text-slate-500 text-center mb-5">Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.</p>

            <label class="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Correo electrónico</label>
            <input
              v-model="forgotEmail"
              type="email"
              placeholder="tu@correo.com"
              class="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              @keyup.enter="submitForgot"
            />

            <p v-if="forgotError" class="text-sm text-red-600 mt-3 text-center">{{ forgotError }}</p>

            <div class="flex justify-between mt-6">
              <button @click="submitForgot" :disabled="forgotLoading"
                      class="px-8 py-2.5 bg-[#1B2A4A] hover:bg-[#253860] text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2">
                <svg v-if="forgotLoading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                {{ forgotLoading ? 'Enviando…' : 'Enviar enlace' }}
              </button>
              <button @click="forgotModal = false" :disabled="forgotLoading"
                      class="px-8 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-all disabled:opacity-50">
                Cancelar
              </button>
            </div>
          </div>

          <div v-else class="text-center py-4">
            <svg class="w-14 h-14 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p class="text-slate-700 font-semibold mb-1">¡Correo enviado!</p>
            <p class="text-sm text-slate-500">Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.</p>
            <button @click="forgotModal = false" class="mt-6 px-8 py-2.5 bg-[#1B2A4A] text-white text-sm font-bold rounded-xl hover:bg-[#253860] transition-all">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
