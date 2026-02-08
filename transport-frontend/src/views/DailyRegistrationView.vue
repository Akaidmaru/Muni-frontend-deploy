<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import logoCompleto from '@/assets/images/Logo-completo.png'
import { User, Calendar } from 'lucide-vue-next'

const router = useRouter()

// Mock user data (will be replaced with actual auth data after backend pull)
const user = ref({
  name: 'Juan',
  surname: 'Pérez'
})

// License plates list
const licensePlates = [
  { id: 1, plate: 'LSXL80' },
  { id: 2, plate: 'VFDG52' },
  { id: 3, plate: 'SZKH24' },
  { id: 4, plate: 'RCTP11' },
  { id: 5, plate: 'DVDX13' },
  { id: 6, plate: 'HFHG40' },
  { id: 7, plate: 'SZKX78' },
  { id: 8, plate: 'TLLS35' },
  { id: 9, plate: 'RJBS30' }
]

const selectedPlate = ref('')

// Get current date in DD/MM/YYYY format
const currentDate = computed(() => {
  const today = new Date()
  const day = String(today.getDate()).padStart(2, '0')
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const year = today.getFullYear()
  return `${day}/${month}/${year}`
})

const getInitials = () => {
  return `${user.value.name[0]}${user.value.surname[0]}`
}

const handleConfirm = () => {
  console.log('Registro confirmado:', {
    user: `${user.value.name} ${user.value.surname}`,
    date: currentDate.value,
    plate: selectedPlate.value
  })
  // TODO: Send to backend after pull
}

const goBack = () => {
  router.push('/dashboard')
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b border-gray-200">
      <div class="container mx-auto px-4 py-4 flex items-center justify-between">
        <!-- Logo with back arrow -->
        <div class="flex items-center gap-4">
          <button @click="goBack" class="text-text-title hover:text-primary transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <router-link to="/" class="flex items-center">
            <img :src="logoCompleto" alt="Transportes Flores Vargas" class="h-16 w-auto object-contain hover:opacity-80 transition-opacity" />
          </router-link>
        </div>
        
        <!-- User Info -->
        <div class="flex items-center gap-3">
          <span class="font-body text-text-title font-semibold">{{ user.name }} {{ user.surname }}</span>
          <div class="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">
            {{ getInitials() }}
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="container mx-auto px-4 py-12">
      <div class="max-w-3xl mx-auto">
        <!-- Main Card -->
        <div class="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100">
          <h1 class="text-3xl font-titles font-bold text-text-title text-center mb-10">Registro diario</h1>
          
          <!-- User Info and Date Box -->
          <div class="bg-gray-50 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-gray-200">
            <!-- User Name with Icon -->
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                <User :size="24" class="text-gray-600" />
              </div>
              <span class="font-body text-text-title font-semibold text-lg">{{ user.name }} {{ user.surname }}</span>
            </div>
            
            <!-- Date with Icon -->
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                <Calendar :size="24" class="text-gray-600" />
              </div>
              <span class="font-body text-text-title font-semibold text-lg">{{ currentDate }}</span>
            </div>
          </div>

          <!-- License Plate Selector -->
          <div class="mb-8">
            <div class="relative">
              <select 
                v-model="selectedPlate"
                class="w-full px-6 py-4 border border-gray-300 rounded-xl shadow-sm focus:ring-primary focus:border-primary font-body text-body bg-white appearance-none cursor-pointer text-gray-500"
              >
                <option value="" disabled selected>Selecciona la patente asignada</option>
                <option 
                  v-for="item in licensePlates" 
                  :key="item.id" 
                  :value="item.plate"
                  class="text-text-title"
                >
                  {{ item.id }}. {{ item.plate }}
                </option>
              </select>
              <!-- Custom dropdown arrow -->
              <div class="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <!-- Confirm Button -->
          <div class="flex justify-center">
            <button 
              @click="handleConfirm"
              :disabled="!selectedPlate"
              class="px-12 py-4 bg-primary hover:bg-primary-hover text-white font-button text-btn font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
