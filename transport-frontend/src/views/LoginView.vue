<script setup>
import { ref } from 'vue'

const email = ref('')
const password = ref('')

const handleSubmit = () => {
    console.log('Login attempt', { email: email.value, password: password.value })
}
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
     <div class="bg-white py-12 px-10 shadow-xl rounded-2xl w-full max-w-lg border-t-4 border-primary">
         <h2 class="text-3xl font-bold text-center text-text-title font-titles mb-10">Iniciar sesión</h2>
         
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
                  class="w-auto px-8 py-3 border border-transparent rounded-lg shadow-sm text-btn font-bold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary font-button hover:shadow-[0_4px_14px_0_rgba(0,0,0,0.39)] hover:-translate-y-1 active:scale-95 transform transition-all duration-200"
                >
                  Iniciar sesión
                </button>
             </div>
         </form>
     </div>
     
     <div class="mt-8 text-center text-text-secondary font-body">
        ¿Aún no tienes una cuenta? <router-link to="/registro" class="font-bold underline text-text-title hover:text-primary transition-colors">Regístrate</router-link>
     </div>
  </div>
</template>
