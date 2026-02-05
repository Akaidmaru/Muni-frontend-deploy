<script setup>
import { ref } from 'vue'
import LoginForm from '../components/LoginForm.vue'
import RegisterForm from '../components/RegisterForm.vue'

const activeTab = ref('login')
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <!-- H2 equivalent -->
      <h2 class="mt-6 text-center text-h3 font-titles font-semibold text-text-title">
        Portal de Clientes
      </h2>
      <p class="mt-2 text-center text-sm text-text-secondary font-body text-body">
         Accede a tus servicios o regístrate
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <!-- Tabs -->
        <div class="flex border-b border-gray-200 mb-6">
          <button 
            @click="activeTab = 'login'"
            class="w-1/2 py-2 px-1 text-center border-b-2 font-button text-lg font-medium transition-colors"
            :class="activeTab === 'login' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-main hover:border-gray-300'"
          >
            Iniciar Sesión
          </button>
          <button 
            @click="activeTab = 'register'"
            class="w-1/2 py-2 px-1 text-center border-b-2 font-button text-lg font-medium transition-colors"
             :class="activeTab === 'register' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-main hover:border-gray-300'"
          >
            Registrarse
          </button>
        </div>

        <!-- Forms -->
        <div>
          <LoginForm v-if="activeTab === 'login'" />
          <RegisterForm v-if="activeTab === 'register'" />
        </div>
      </div>
    </div>
  </div>
</template>
