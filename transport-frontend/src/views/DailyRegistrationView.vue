<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import logoCompleto from '@/assets/images/Logo-completo.png'


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
    <div class="bg-white shadow-sm border-b border-gray-200">
      <div class="container mx-auto px-4 py-4 flex items-center justify-between">
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
        
        <div class="flex items-center gap-3">
          <span class="font-body text-text-title font-semibold">{{ user.name }} {{ user.surname }}</span>
          <div class="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">
            {{ getInitials() }}
          </div>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-12">
      <div class="max-w-3xl mx-auto">
        
        <div class="bg-white rounded-3xl border-2 border-slate-300 p-8 md:p-12 max-w-3xl mx-auto shadow-sm">
  
  <h1 class="text-3xl font-titles font-bold text-text-title text-center mb-16">
    Registro diario
  </h1>
  
  <div class="max-w-2xl mx-auto flex justify-between items-center mb-12 px-6">
    <span class="font-body text-text-title font-medium text-lg">
      {{ user.name }} {{ user.surname }}
    </span>
    <span class="font-body text-text-title font-medium text-lg text-gray-600">
      {{ currentDate }}
    </span>
  </div>

  <div class="max-w-xs mx-auto mb-12">
    <div class="relative">
      <select 
        v-model="selectedPlate"
        class="w-full px-6 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-primary focus:border-primary font-body text-sm bg-white appearance-none cursor-pointer text-gray-400 text-center"
      >
        <option value="" disabled selected>Seleccione la patente asignada</option>
        <option 
          v-for="item in licensePlates" 
          :key="item.id" 
          :value="item.plate"
          class="text-text-title"
        >
          {{ item.plate }}
        </option>
      </select>
      
      <div class="absolute inset-y-0 right-4 flex items-center pointer-events-none">
        <svg class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  </div>

  <div class="flex justify-center">
    <button 
      @click="handleConfirm"
      :disabled="!selectedPlate"
      class="px-12 py-3 bg-[#215179] hover:bg-blue-900 text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-40"
    >
      Confirmar
    </button>
  </div>
</div>
      </div>
    </div>
  </div>
</template>