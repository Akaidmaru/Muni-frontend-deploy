<script setup>
import { ref } from 'vue'

const name = ref('')
const surname = ref('')
const email = ref('')
const confirmEmail = ref('')
const phone = ref('')
const occupation = ref('')
const password = ref('')
const confirmPassword = ref('')

const handleSubmit = () => {
    console.log('Register attempt', { name: name.value })
}
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
     <div class="bg-white py-12 px-10 shadow-xl rounded-2xl w-full max-w-4xl border-t-4 border-primary">
         <h2 class="text-3xl font-bold text-center text-text-title font-titles mb-10">Crear cuenta</h2>
         
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
                   <select v-model="occupation" class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary font-body text-body text-gray-500 bg-white">
                       <option value="" disabled selected>Selecciona una ocupación</option>
                       <option>Estudiante</option>
                       <option>Trabajador</option>
                       <option>Empresa</option>
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
                  class="w-auto px-12 py-3 border border-transparent rounded-lg shadow-sm text-btn font-bold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary font-button hover:shadow-[0_4px_14px_0_rgba(0,0,0,0.39)] hover:-translate-y-1 active:scale-95 transform transition-all duration-200"
                >
                  Registrarse
                </button>
             </div>
         </form>
     </div>
     
     <div class="mt-8 text-center text-text-secondary font-body">
        ¿Ya tienes una cuenta? <router-link to="/clientes" class="font-bold underline text-text-title hover:text-primary transition-colors">Inicia sesión</router-link>
     </div>
  </div>
</template>
