<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const email    = ref('')
const password = ref('')
const remember = ref(false)
const error    = ref('')
const loading  = ref(false)

const router = useRouter()
const auth   = useAuthStore()

const handleSubmit = async () => {
  error.value   = ''
  loading.value = true

  const result = await auth.login(email.value, password.value)

  loading.value = false

  if (result.success) {
    // Redirigir según el rol
    const roleRoutes = {
      DRIVER: '/dashboard',
      EMPLOYEE: '/dashboard',
      ADMIN: '/dashboard-admin',
      PATIENT: '/dashboard-paciente',
    }
    const target = roleRoutes[auth.userRole] || '/dashboard'
    router.push(target)
  } else {
    error.value = result.message || 'Error al iniciar sesión'
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Error message -->
    <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-body">
      {{ error }}
    </div>

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
        :disabled="loading"
        class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-btn font-medium text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary font-button hover:shadow-[0_4px_14px_0_rgba(0,0,0,0.39)] hover:-translate-y-1 active:scale-95 transform transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span v-if="loading" class="flex items-center gap-2">
          <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          Iniciando...
        </span>
        <span v-else>Iniciar Sesión</span>
      </button>
    </div>
  </form>
</template>
