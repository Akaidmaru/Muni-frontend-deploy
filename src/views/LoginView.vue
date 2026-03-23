<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import logoCompleto from '@/assets/images/Logo-completo.png'
import { useAuthStore } from '@/stores/auth'

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
            conductor:   '/dashboard',
            funcionario: '/dashboard',
            admin:       '/dashboard-admin',
            paciente:    '/dashboard-paciente',
        }
        router.push(roleRoutes[auth.userRole] || '/dashboard')
    } else {
        error.value = result.message || 'Error al iniciar sesión'
    }
}
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
     <div class="bg-white py-12 px-10 shadow-xl rounded-2xl w-full max-w-lg border-t-4 border-primary">
         <router-link to="/" class="flex justify-center mb-8">
            <img :src="logoCompleto" alt="Transportes Flores Vargas" class="h-20 w-auto object-contain hover:opacity-80 transition-opacity" />
         </router-link>
         <h2 class="text-3xl font-bold text-center text-text-title font-titles mb-10">Iniciar sesión</h2>
         
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
                <a href="#" class="text-sm-body font-bold text-text-title hover:text-primary transition-colors font-body">¿Has olvidado tu contraseña?</a>
             </div>

             <div class="flex justify-end pt-2">
                <button 
                  type="submit"
                  :disabled="loading"
                  class="w-auto px-8 py-3 border border-transparent rounded-lg shadow-sm text-btn font-bold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary font-button hover:shadow-[0_4px_14px_0_rgba(0,0,0,0.39)] hover:-translate-y-1 active:scale-95 transform transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
</template>
