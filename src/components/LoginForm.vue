<script setup>
import { ref } from 'vue'

const email = ref('')
const password = ref('')
const remember = ref(false)

const handleSubmit = () => {
    console.log('Login attempt', { email: email.value, password: password.value })
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <div>
      <label for="email" class="block text-sm font-medium text-text-secondary font-body text-sm-body">Correo Electrónico</label>
      <div class="mt-1">
        <input 
          id="email" 
          name="email" 
          type="email" 
          v-model="email"
          required 
          class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm font-body"
        />
      </div>
    </div>

    <div>
      <label for="password" class="block text-sm font-medium text-text-secondary font-body text-sm-body">Contraseña</label>
      <div class="mt-1">
        <input 
          id="password" 
          name="password" 
          type="password" 
          v-model="password"
          required 
          class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm font-body"
        />
      </div>
    </div>

    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <input 
          id="remember-me" 
          name="remember-me" 
          type="checkbox" 
          v-model="remember"
          class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" 
        />
        <label for="remember-me" class="ml-2 block text-sm text-text-secondary font-body text-sm-body">Recuérdame</label>
      </div>

      <div class="text-sm">
        <a href="#" class="font-medium text-primary hover:text-primary-hover font-body text-sm-body">¿Olvidaste tu contraseña?</a>
      </div>
    </div>

    <div>
      <button 
        type="submit" 
        class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-btn font-medium text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary font-button hover:shadow-[0_4px_14px_0_rgba(0,0,0,0.39)] hover:-translate-y-1 active:scale-95 transform transition-all duration-200"
      >
        Iniciar Sesión
      </button>
    </div>
  </form>
</template>
