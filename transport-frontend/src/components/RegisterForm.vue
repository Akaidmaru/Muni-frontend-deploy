<script setup>
import { ref } from 'vue'

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

const handleSubmit = () => {
    console.log('Register attempt', { name: name.value, email: email.value })
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
     <div>
      <label for="name" class="block text-sm font-medium text-text-secondary font-body text-sm-body">Nombre Completo</label>
      <div class="mt-1">
        <input 
          id="name" 
          name="name" 
          type="text" 
          v-model="name"
          required 
          class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm font-body"
        />
      </div>
    </div>

    <div>
      <label for="reg-email" class="block text-sm font-medium text-text-secondary font-body text-sm-body">Correo Electrónico</label>
      <div class="mt-1">
        <input 
          id="reg-email" 
          name="email" 
          type="email" 
          v-model="email"
          required 
          class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm font-body"
        />
      </div>
    </div>

    <div>
      <label for="reg-password" class="block text-sm font-medium text-text-secondary font-body text-sm-body">Contraseña</label>
      <div class="mt-1">
        <input 
          id="reg-password" 
          name="password" 
          type="password" 
          v-model="password"
          required 
          class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm font-body"
        />
      </div>
    </div>
    
    <div>
      <label for="confirm-password" class="block text-sm font-medium text-text-secondary font-body text-sm-body">Confirmar Contraseña</label>
      <div class="mt-1">
        <input 
          id="confirm-password" 
          name="confirm-password" 
          type="password" 
          v-model="confirmPassword"
          required 
          class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm font-body"
        />
      </div>
    </div>

    <div>
      <button 
        type="submit" 
        class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-btn font-medium text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary font-button hover:shadow-[0_4px_14px_0_rgba(0,0,0,0.39)] hover:-translate-y-1 active:scale-95 transform transition-all duration-200"
      >
        Registrarse
      </button>
    </div>
  </form>
</template>
