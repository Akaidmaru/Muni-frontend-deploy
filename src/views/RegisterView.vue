<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import logoCompleto from '@/assets/images/Logo-completo.png'
import api from '@/services/axios'

const router = useRouter()

const name = ref('')
const surname = ref('')
const email = ref('')
const confirmEmail = ref('')
const phone = ref('')
const occupation = ref('')
const password = ref('')
const confirmPassword = ref('')

const occupations = ref([])
const loadingOccupations = ref(false)
const loadingSubmit = ref(false)
const error = ref('')
const successMessage = ref('')

async function fetchOccupations() {
   loadingOccupations.value = true
   try {
      const response = await api.get('/auth/occupations')
      occupations.value = Array.isArray(response.data) ? response.data : []
   } catch {
      error.value = 'No se pudieron cargar las ocupaciones. Intenta nuevamente.'
   } finally {
      loadingOccupations.value = false
   }
}

const handleSubmit = async () => {
   error.value = ''
   successMessage.value = ''

   if (email.value !== confirmEmail.value) {
      error.value = 'Los correos no coinciden.'
      return
   }

   if (password.value !== confirmPassword.value) {
      error.value = 'Las contraseñas no coinciden.'
      return
   }

   if (!occupation.value) {
      error.value = 'Debes seleccionar una ocupación.'
      return
   }

   loadingSubmit.value = true
   try {
      const fullName = `${name.value} ${surname.value}`.trim()
      await api.post('/auth/register', {
         name: fullName,
         email: email.value,
         password: password.value,
         phone: phone.value.trim() || undefined,
         occupationId: Number(occupation.value),
      })

      let verificationSent = false
      try {
         await api.post('/auth/send-verification-code', { email: email.value })
         verificationSent = true
      } catch {
         verificationSent = false
      }

      // Navigate to email verification after successful registration
      router.push({
         name: 'verify-email',
         query: {
            email: email.value,
            sent: verificationSent ? '1' : '0',
         },
      })
   } catch (err) {
      const backendMessage = err.response?.data?.message
      error.value = Array.isArray(backendMessage)
         ? backendMessage.join(', ')
         : backendMessage || 'No se pudo completar el registro.'
   } finally {
      loadingSubmit.value = false
   }
}

onMounted(() => {
   fetchOccupations()
})
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
     <div class="bg-white py-12 px-10 shadow-xl rounded-2xl w-full max-w-4xl border-t-4 border-primary">
         <router-link to="/" class="flex justify-center mb-8">
            <img :src="logoCompleto" alt="Transportes Flores Vargas" class="h-20 w-auto object-contain hover:opacity-80 transition-opacity" />
         </router-link>
         <h2 class="text-3xl font-bold text-center text-text-title font-titles mb-10">Crear cuenta</h2>

         <div v-if="error" class="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {{ error }}
         </div>

         <div v-if="successMessage" class="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {{ successMessage }}
         </div>
         
         <form @submit.prevent="handleSubmit" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Row 1 -->
                <div>
                  <input type="text" v-model="name" placeholder="Ingresa tu nombre" required class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary font-body text-body placeholder-gray-400" />
                </div>
                <div>
                  <input type="text" v-model="surname" placeholder="Ingresa tu apellido" required class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary font-body text-body placeholder-gray-400" />
                </div>

                <!-- Row 2 -->
                <div>
                  <input type="email" v-model="email" placeholder="Ingresa tu email" required class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary font-body text-body placeholder-gray-400" />
                </div>
                <div>
                   <input type="email" v-model="confirmEmail" placeholder="Confirma tu email" required class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary font-body text-body placeholder-gray-400" />
                </div>

                <!-- Row 3 -->
                <div class="relative">
                   <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                       <!-- Mock FLag -->
                       <span class="text-lg">🇨🇱 +56</span>
                   </div>
                   <input type="tel" v-model="phone" placeholder="Ingresa tu teléfono" class="w-full pl-24 px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary font-body text-body placeholder-gray-400" />
                </div>
                <div>
                   <select
                     v-model="occupation"
                     :disabled="loadingOccupations"
                     required
                     class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary font-body text-body text-gray-700 bg-white disabled:bg-gray-100"
                   >
                       <option value="" disabled>
                          {{ loadingOccupations ? 'Cargando ocupaciones...' : 'Selecciona una ocupación' }}
                       </option>
                       <option
                          v-for="item in occupations"
                          :key="item.id"
                          :value="String(item.id)"
                       >
                          {{ item.name }}
                       </option>
                   </select>
                </div>

                <!-- Row 4 -->
                <div>
                   <input type="password" v-model="password" placeholder="Ingresa tu contraseña" required class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary font-body text-body placeholder-gray-400" />
                </div>
                <div>
                   <input type="password" v-model="confirmPassword" placeholder="Confirma tu contraseña" required class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary font-body text-body placeholder-gray-400" />
                </div>
            </div>

             <div class="flex justify-center pt-6">
                <button 
                  type="submit" 
                           :disabled="loadingSubmit"
                  class="w-auto px-12 py-3 border border-transparent rounded-lg shadow-sm text-btn font-bold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary font-button hover:shadow-[0_4px_14px_0_rgba(0,0,0,0.39)] hover:-translate-y-1 active:scale-95 transform transition-all duration-200"
                >
                           {{ loadingSubmit ? 'Registrando...' : 'Registrarse' }}
                </button>
             </div>
         </form>
     </div>
     
     <div class="mt-8 text-center text-text-secondary font-body">
        ¿Ya tienes una cuenta? <router-link to="/clientes" class="font-bold underline text-text-title hover:text-primary transition-colors">Inicia sesión</router-link>
     </div>
  </div>
</template>
