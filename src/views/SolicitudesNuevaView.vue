<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import logoCompleto from '@/assets/images/Logo-completo.png'
import UserMenu from '@/components/UserMenu.vue'
import DashboardSidebar from '@/components/DashboardSidebar.vue'
import api from '@/services/axios'

const router = useRouter()

const tipoSolicitud  = ref('')
const conductorOpcion = ref('')
const nombreUsuario  = ref('')
const patente        = ref('')
const razon          = ref('')
const archivoNombre  = ref('')
const archivoFile    = ref(null)
const archivoRef     = ref(null)

const esConductor = computed(() => tipoSolicitud.value === 'conductor')
const esPatente   = computed(() => tipoSolicitud.value === 'patente')

const onChangeTipo = () => {
  conductorOpcion.value = ''
  nombreUsuario.value   = ''
  patente.value         = ''
  razon.value           = ''
  archivoNombre.value   = ''
  archivoFile.value     = null
  if (archivoRef.value) archivoRef.value.value = ''
}

const triggerArchivo = () => archivoRef.value?.click()

const onArchivoChange = (e) => {
  const file = e.target.files[0]
  archivoFile.value = file || null
  archivoNombre.value = file?.name || ''
}

const isSending  = ref(false)
const sendError  = ref('')
const sendSuccess = ref(false)

const enviar = async () => {
  isSending.value  = true
  sendError.value  = ''
  sendSuccess.value = false
  try {
    const payload = new FormData()
    payload.append('tipo', tipoSolicitud.value)
    if (esConductor.value) {
      payload.append('conductorOpcion', conductorOpcion.value)
      payload.append('nombre', nombreUsuario.value)
    }
    if (esPatente.value) payload.append('patente', patente.value)
    if (razon.value) payload.append('razon', razon.value)
    if (archivoFile.value) payload.append('archivo', archivoFile.value)

    await api.post('/solicitudes', payload)
    sendSuccess.value = true
    setTimeout(() => router.push('/admin/solicitudes/historial'), 1200)
  } catch (error) {
    const backendMessage = error.response?.data?.message
    sendError.value = Array.isArray(backendMessage)
      ? backendMessage.join(', ')
      : backendMessage || 'No se pudo enviar la solicitud. Intenta nuevamente.'
  } finally {
    isSending.value = false
  }
}
</script>

<template>
  <div class="h-screen min-h-0 overflow-hidden bg-gray-100 flex flex-col">
    <!-- Header -->
    <div class="shrink-0 bg-white shadow-sm border-b border-gray-200">
      <div class="px-4 py-4 flex items-center justify-between">
        <router-link to="/" class="flex items-center">
          <img :src="logoCompleto" alt="Transportes Flores Vargas" class="h-16 w-auto object-contain hover:opacity-80 transition-opacity" />
        </router-link>
        <UserMenu />
      </div>
    </div>

    <div class="flex flex-1 min-h-0 overflow-hidden">
      <DashboardSidebar />

      <main class="flex-1 pt-4 pb-10 pl-4 pr-4 overflow-y-auto flex flex-col">
        <div class="bg-white rounded-3xl border-2 border-slate-300 shadow-sm flex-1 flex flex-col overflow-hidden w-full">

          <!-- Card header -->
            <div class="px-6 pt-7 shrink-0">
            <div class="flex items-center mb-4 relative">
              <button
                @click="router.back()"
                class="flex items-center gap-1 text-sm font-titles font-semibold text-slate-600 hover:text-primary transition-colors z-10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
                Volver
              </button>
                <h1 class="absolute inset-x-0 text-center text-2xl md:text-3xl font-bold font-titles text-text-title pointer-events-none">
                  Enviar una solicitud
                </h1>
            </div>
            <div class="border-b border-slate-200">
              <span class="inline-block text-sm font-titles font-semibold text-slate-800 pb-2 border-b-2 border-slate-800">
                Detalles
              </span>
            </div>
          </div>

          <!-- Formulario -->
          <div class="flex-1 overflow-y-auto px-6 py-6 sm:px-10">
            <div class="mx-auto w-full max-w-2xl">
              <div class="mx-auto w-full max-w-lg">

              <!-- Paso 1: tipo de solicitud -->
              <div class="mb-6">
                <p class="text-sm font-titles font-semibold text-slate-700 mb-2">
                  1. Selecciona un tipo de solicitud
                </p>
                <div class="relative">
                  <select
                    v-model="tipoSolicitud"
                    @change="onChangeTipo"
                    class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm font-titles text-slate-700 appearance-none bg-white focus:outline-none focus:border-primary transition-colors cursor-pointer"
                  >
                    <option value="" disabled>Seleccionar...</option>
                    <option value="conductor">Añadir o dar de baja a un conductor</option>
                    <option value="patente">Acceso a patente</option>
                  </select>
                  <svg class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <!-- ── Flujo: Añadir o dar de baja a un conductor ── -->
              <template v-if="esConductor">

                <!-- Paso 2: opción -->
                <div class="mb-6">
                  <p class="text-sm font-titles font-semibold text-slate-700 mb-2">
                    2. Selecciona una de las opciones.
                  </p>
                  <div class="relative">
                    <select
                      v-model="conductorOpcion"
                      class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm font-titles text-slate-700 appearance-none bg-white focus:outline-none focus:border-primary transition-colors cursor-pointer"
                    >
                      <option value="" disabled>Seleccionar...</option>
                      <option value="anadir">Añadir conductor</option>
                      <option value="baja">Dar de baja a conductor</option>
                    </select>
                    <svg class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                <!-- Paso 3: nombre usuario -->
                <div v-if="conductorOpcion" class="mb-6">
                  <p class="text-sm font-titles font-semibold text-slate-700 mb-2">
                    3. Ingrese el nombre del usuario.
                  </p>
                  <input
                    v-model="nombreUsuario"
                    type="text"
                    placeholder="Nombre Apellido Apellido"
                    class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm font-titles text-slate-700 focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <!-- Paso 4: razón -->
                <div v-if="conductorOpcion" class="mb-6">
                  <p class="text-sm font-titles font-semibold text-slate-700 mb-2">
                    4. Escriba la razón. (Opcional)
                  </p>
                  <textarea
                    v-model="razon"
                    placeholder="Ingrese la justificación de esta solicitud."
                    rows="4"
                    class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm font-titles text-slate-700 focus:outline-none focus:border-primary transition-colors resize-none"
                  />
                </div>

              </template>

              <!-- ── Flujo: Acceso a patente ── -->
              <template v-else-if="esPatente">

                <!-- Paso 2: patente -->
                <div class="mb-6">
                  <p class="text-sm font-titles font-semibold text-slate-700 mb-2">
                    2. Ingrese la patente
                  </p>
                  <input
                    v-model="patente"
                    type="text"
                    placeholder="XXXXXX"
                    class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm font-titles text-slate-700 uppercase tracking-widest focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <!-- Paso 3: razón -->
                <div class="mb-6">
                  <p class="text-sm font-titles font-semibold text-slate-700 mb-2">
                    3. Escriba la razón. (Opcional)
                  </p>
                  <textarea
                    v-model="razon"
                    placeholder="Ingrese la justificación de esta solicitud."
                    rows="4"
                    class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm font-titles text-slate-700 focus:outline-none focus:border-primary transition-colors resize-none"
                  />
                </div>

              </template>

              <!-- Adjuntar y enviar (visible cuando hay tipo seleccionado y, para conductor, también opción) -->
              <template v-if="esPatente || (esConductor && conductorOpcion)">
                <div class="flex items-center gap-3 mb-8">
                  <button
                    @click="triggerArchivo"
                    class="flex items-center gap-2 border border-slate-300 rounded-lg px-4 py-2 text-sm font-titles font-semibold text-slate-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    Adjuntar imagen/PDF
                  </button>
                  <span class="text-sm text-slate-400 font-titles truncate">
                    {{ archivoNombre || 'Archivo1.jpg' }}
                  </span>
                  <input
                    ref="archivoRef"
                    type="file"
                    accept="application/pdf,image/png,image/jpeg,image/webp"
                    class="hidden"
                    @change="onArchivoChange"
                  />
                </div>

                <p v-if="sendError" class="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-titles">
                  {{ sendError }}
                </p>
                <p v-if="sendSuccess" class="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 font-titles flex items-center gap-2">
                  <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                  Solicitud enviada correctamente. Redirigiendo...
                </p>

                <div class="flex justify-center">
                  <button
                    @click="enviar"
                    :disabled="isSending || sendSuccess"
                    class="bg-red-700 hover:bg-red-800 active:bg-red-900 disabled:opacity-60 disabled:cursor-not-allowed text-white font-titles font-bold px-10 py-3 rounded-lg transition-colors tracking-widest text-sm flex items-center gap-2"
                  >
                    <svg v-if="isSending" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    {{ isSending ? 'ENVIANDO...' : 'ENVIAR SOLICITUD' }}
                  </button>
                </div>
              </template>

              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  </div>
</template>
