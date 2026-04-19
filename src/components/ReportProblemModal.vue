<script setup>
import { ref } from 'vue'
import api from '@/services/axios'

defineProps({
  isOpen: Boolean
})

const emit = defineEmits(['close'])

const title = ref('')
const description = ref('')
const fileInput = ref(null)
const selectedFileName = ref('')
const selectedFile = ref(null)
const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const MIN_LOADING_DISPLAY_MS = 400

const handleClose = () => {
  isSubmitting.value = false
  emit('close')
  // Pequeño delay para que la animación termine antes de resetear
  setTimeout(() => {
    resetForm()
  }, 300)
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    selectedFileName.value = file.name
    selectedFile.value = file
  } else {
    selectedFileName.value = ''
    selectedFile.value = null
  }
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const resetForm = () => {
  title.value = ''
  description.value = ''
  selectedFileName.value = ''
  selectedFile.value = null
  errorMessage.value = ''
  successMessage.value = ''

  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const submitReport = async () => {
  if (!title.value || !description.value || isSubmitting.value) return

  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  await delay(MIN_LOADING_DISPLAY_MS)

  try {
    const formData = new FormData()
    formData.append('title', title.value)
    formData.append('description', description.value)
    if (selectedFile.value) {
      formData.append('file', selectedFile.value)
    }

    await api.post('/reports', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    successMessage.value = 'Reporte enviado con éxito. Gracias por tu ayuda.'
    setTimeout(() => {
      handleClose()
    }, 2000)

  } catch (error) {
    console.error('Error al enviar el reporte:', error)
    errorMessage.value = 'Lo sentimos, ha ocurrido un error al enviar el reporte. Por favor intenta más tarde.'
    isSubmitting.value = false
  }
}
</script>

<template>
  <transition
    enter-active-class="transition-opacity duration-300 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-200 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" style="background-color: rgba(33, 33, 33, 0.7);">
      <!-- Backdrop clickeable -->
      <div class="absolute inset-0" @click="handleClose"></div>

      <!-- Content -->
      <transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-4 scale-95"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 translate-y-4 scale-95"
      >
        <div v-if="isOpen" class="bg-white rounded-2xl shadow-2xl w-full max-w-[620px] relative z-10 border border-gray-200 py-6 sm:py-10 px-5 sm:px-8 md:px-14">
            
            <!-- Left floating Icon -->
            <div class="absolute top-8 left-8 sm:left-10 w-[60px] h-[60px] bg-[#B71C1C] rounded-2xl flex items-center justify-center shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <!-- Headers -->
            <div class="text-center mt-2 mb-6 sm:mb-8 px-4 sm:px-8 md:px-16">
              <h2 class="text-[22px] font-titles font-extrabold text-[#111827] mb-3 tracking-tight">Reportar un problema</h2>
              <p class="text-[13px] font-body text-gray-500 leading-snug">
                Ayúdanos a mejorar. Describe el error que has<br class="hidden sm:block">encontrado lo más detalladamente posible.
              </p>
            </div>

            <!-- Form -->
            <form @submit.prevent="submitReport" class="space-y-5" :class="isSubmitting ? 'pointer-events-none select-none opacity-70' : ''">
              
              <!-- Título -->
              <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <label class="font-titles font-extrabold text-[#374151] text-[13px] whitespace-nowrap pt-1">
                  Título del Error
                </label>
                <input 
                  v-model="title" 
                  type="text" 
                  required
                  placeholder="Ej. No recibí el código de verificación" 
                  class="flex-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-[13px] text-gray-700 outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 transition-colors placeholder:text-[#a8a8a8] font-body"
                />
              </div>

              <!-- Descripción -->
              <div class="flex flex-col gap-2">
                <label class="font-titles font-extrabold text-[#374151] text-[13px]">
                  Descripción detallada
                </label>
                <textarea 
                  v-model="description" 
                  required
                  rows="6" 
                  placeholder="Describe qué intentabas hacer y que pasó al momento del error..." 
                  class="w-full rounded-lg border border-gray-300 p-4 text-[13px] text-gray-700 outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 transition-colors resize-none placeholder:text-[#a8a8a8] font-body"
                ></textarea>
              </div>

              <!-- Adjuntar -->
              <div class="pt-1">
                <input 
                  type="file" 
                  ref="fileInput" 
                  class="hidden" 
                  accept="image/*"
                  @change="handleFileChange"
                />
                <button 
                  type="button"
                  @click="triggerFileInput"
                  class="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-[11px] font-titles font-bold text-[#374151] hover:bg-gray-50 hover:text-gray-900 transition-colors bg-white shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-gray-600">
                    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                  </svg>
                  Adjuntar captura de pantalla
                </button>
                <div v-if="selectedFileName" class="text-[12px] font-medium text-gray-500 mt-2 truncate w-full">{{ selectedFileName }}</div>
              </div>

              <!-- Mensajes de Error y Exito -->
              <div v-if="isSubmitting" class="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-center text-xs font-semibold text-blue-700">
                Enviando reporte, por favor espera...
              </div>
              <div v-if="errorMessage" class="text-xs text-red-600 font-medium text-center w-full">
                {{ errorMessage }}
              </div>
              <div v-if="successMessage" class="text-xs text-green-600 font-medium text-center w-full">
                {{ successMessage }}
              </div>

              <!-- Submit & Cancel -->
              <div class="pt-4 sm:pt-6 flex flex-col items-center gap-4">
                <button 
                  type="submit" 
                  :disabled="isSubmitting || !title || !description"
                  :aria-busy="isSubmitting"
                  class="bg-[#B71C1C] hover:bg-red-800 disabled:bg-slate-400 disabled:hover:bg-slate-400 disabled:opacity-100 disabled:cursor-not-allowed text-white text-xs font-bold px-8 py-3 rounded-xl transition-all w-full sm:w-[240px] tracking-wide flex items-center justify-center font-body min-h-[44px]"
                >
                  <span>{{ isSubmitting ? 'ENVIANDO...' : 'ENVIAR REPORTE' }}</span>
                  <svg v-if="isSubmitting" class="ml-2 animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </button>
                
                <button 
                  type="button" 
                  @click="handleClose" 
                  class="text-[11px] font-body text-[#9ca3af] hover:text-[#4b5563] underline underline-offset-4 transition-colors p-2 inline-flex items-center gap-1.5"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                  Volver al inicio
                </button>
              </div>

            </form>
        </div>
      </transition>
    </div>
  </transition>
</template>
