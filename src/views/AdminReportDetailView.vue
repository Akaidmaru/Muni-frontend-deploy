<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import logoCompleto from '@/assets/images/Logo-completo.png'
import UserMenu from '@/components/UserMenu.vue'
import api from '@/services/axios'

const route = useRoute()
const router = useRouter()

const reportId = route.params.id
const report = ref(null)
const isLoading = ref(true)
const error = ref('')

// For "Notas" and State change
const note = ref('')
const selectedStatus = ref('')
const isUpdating = ref(false)
const updateError = ref('')
const isImageModalOpen = ref(false)

const hasPendingChanges = computed(() => {
  if (!report.value) return false
  return selectedStatus.value && selectedStatus.value !== report.value.status
})

const loadReport = async () => {
  isLoading.value = true
  error.value = ''
  try {
    const { data } = await api.get(`/reports/${reportId}`)
    report.value = data
    selectedStatus.value = data.status
  } catch (err) {
    error.value = 'Error al cargar el reporte'
  } finally {
    isLoading.value = false
  }
}

const updateStatus = async () => {
  if (!report.value || isUpdating.value || !hasPendingChanges.value) return

  isUpdating.value = true
  updateError.value = ''

  try {
    const { data } = await api.patch(`/reports/${report.value.id}/status`, {
      status: selectedStatus.value,
    })

    report.value.status = data.status
    report.value.updatedAt = data.updatedAt
    note.value = ''
  } catch (err) {
    const msg = err?.response?.data?.message
    updateError.value = Array.isArray(msg) ? msg.join(', ') : msg || 'Error al actualizar el reporte'
  } finally {
    isUpdating.value = false
  }
}

const goBack = () => {
  router.push('/admin/reportes')
}

const formatDate = (iso) => {
  if (!iso) return '00-00-0000'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '00-00-0000'
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const formatId = (id) => `#${String(id).padStart(4, '0')}`

const getStatusLabel = (status) => {
  const labels = {
    OPEN: 'Nuevo',
    IN_REVIEW: 'En progreso',
    RESOLVED: 'Resuelto'
  }
  return labels[status] || status
}

onMounted(loadReport)
</script>

<template>
  <div class="h-screen bg-white flex flex-col font-body overflow-hidden">
    <!-- Header -->
    <header class="h-20 border-b border-gray-200 px-8 flex items-center justify-between bg-white shrink-0">
      <div class="flex items-center gap-4">
        <img :src="logoCompleto" alt="Transportes Flores Vargas" class="h-14 object-contain" />
      </div>
      <UserMenu />
    </header>

    <div class="flex flex-1 min-h-0 overflow-hidden relative justify-center">
      <!-- Main Content Area -->
      <main class="flex-1 p-6 md:ml-4 overflow-y-auto">
        <div class="mb-4 pl-10 sm:pl-12">
          <button @click="goBack" class="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary transition-colors">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Volver
          </button>
        </div>
        <div v-if="isLoading" class="flex flex-col items-center justify-center h-64">
           <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
           <p class="mt-4 text-gray-500">Cargando detalles...</p>
        </div>

        <div v-else-if="error" class="bg-red-50 text-red-600 p-8 rounded-2xl text-center">
          <p class="text-lg font-bold">{{ error }}</p>
          <button @click="goBack" class="mt-4 text-primary underline">Volver a la lista</button>
        </div>

        <div v-else class="max-w-[1100px] mx-auto">


          <!-- Main Card Container -->
          <div class="detail-card border border-[#D9E3ED] rounded-[30px] p-8 relative">

            <div class="flex items-center justify-between mb-8">
              <h1 class="text-[32px] font-bold text-[#111827]">
                Detalles del reporte {{ formatId(report.id) }}
              </h1>
            </div>

            <!-- Report Info Row Box -->
            <div class="bg-white border border-[#E5E7EB] rounded-2xl p-6 mb-8 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12">
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-[#111827]">Título:</span>
                <span class="text-sm text-gray-600">{{ report.title }}</span>
              </div>
              <div class="flex items-center gap-2 justify-start md:justify-end">
                <span class="text-sm font-bold text-[#111827]">Fecha:</span>
                <span class="text-sm text-gray-600">{{ formatDate(report.createdAt) }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-[#111827]">Usuario:</span>
                <span class="text-sm text-gray-600">{{ report.reporter?.email || 'N/A' }}</span>
              </div>
              <div class="flex items-center gap-2 justify-start md:justify-end">
                <span class="text-sm font-bold text-[#111827]">Estado:</span>
                <span class="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  {{ getStatusLabel(report.status) }}
                </span>
              </div>
            </div>

            <!-- Two Columns Section -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <!-- Description Column -->
              <div class="flex flex-col">
                <div class="bg-[#F3F4F6] border border-[#E5E7EB] border-b-0 rounded-t-xl px-4 py-2 text-sm font-bold text-[#4B5563]">
                  Descripción del problema
                </div>
                <div class="flex-1 bg-white border border-[#E5E7EB] rounded-b-xl p-4 min-h-[180px]">
                  <p class="text-sm text-[#6B7280] leading-relaxed whitespace-pre-wrap">
                    {{ report.description || 'Sin descripción detallada.' }}
                  </p>
                </div>
              </div>

              <!-- Attachments Column -->
              <div class="flex flex-col">
                <div class="bg-[#F3F4F6] border border-[#E5E7EB] border-b-0 rounded-t-xl px-4 py-2 text-sm font-bold text-[#4B5563]">
                  Adjuntos
                </div>
                <div class="flex-1 bg-white border border-[#E5E7EB] rounded-b-xl p-4 min-h-[180px] flex gap-4 overflow-x-auto">
                  <div v-if="report.screenshotUrl" class="flex flex-col items-center">
                    <div class="w-28 h-28 bg-[#D1D5DB] rounded-lg mb-2 overflow-hidden flex items-center justify-center">
                      <img :src="report.screenshotUrl" alt="Adjunto" class="w-full h-full object-cover">
                    </div>
                    <span class="text-[10px] text-gray-500 mb-1">Evidencia.png</span>
                    <button @click="isImageModalOpen = true" class="text-[10px] font-bold bg-[#E5E7EB] px-3 py-1 rounded-full hover:bg-gray-300 transition-colors">Ampliar</button>
                  </div>
                  <div v-else class="flex items-center justify-center w-full text-gray-400 text-sm">
                    No hay archivos adjuntos
                  </div>
                </div>
              </div>
            </div>

            <!-- Notes Section -->
            <div class="bg-[#F3F4F6] border border-[#E5E7EB] border-b-0 rounded-t-xl px-4 py-2 text-sm font-bold text-[#4B5563]">
              Notas
            </div>
            <div class="bg-white border border-[#E5E7EB] rounded-b-xl p-6 mb-8">
              <textarea 
                v-model="note"
                placeholder="Escriba una nota sobre el progreso o respuesta al usuario."
                class="w-full h-32 p-4 border border-[#E5E7EB] rounded-xl outline-none focus:ring-1 focus:ring-primary resize-none text-sm text-gray-600 mb-6"
              ></textarea>

              <p v-if="updateError" class="text-sm text-red-600 mb-4">
                {{ updateError }}
              </p>

              <div class="flex items-center justify-between gap-4 flex-wrap">
                <div class="flex items-center gap-3">
                  <span class="text-sm font-bold text-[#111827]">Cambiar estado:</span>
                  <div class="relative">
                    <select 
                      v-model="selectedStatus"
                      class="appearance-none bg-white border border-[#E5E7EB] rounded-lg pl-3 pr-8 py-1.5 text-sm outline-none cursor-pointer"
                    >
                      <option value="OPEN">Nuevo</option>
                      <option value="IN_REVIEW">En progreso</option>
                      <option value="RESOLVED">Resuelto</option>
                    </select>
                    <svg class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>

                <button 
                  @click="updateStatus"
                  :disabled="isUpdating || !hasPendingChanges"
                  class="bg-[#1B2A4A] hover:bg-[#253860] text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span v-if="isUpdating">Procesando...</span>
                  <span v-else>Notificar al usuario</span>
                </button>
              </div>

            </div>

            <!-- Footer Buttons -->
            <div class="flex items-center justify-between mb-4">
              <button
                @click="updateStatus"
                :disabled="isUpdating"
                class="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="isUpdating">Guardando...</span>
                <span v-else>Guardar</span>
              </button>
              <button @click="goBack" class="px-6 py-2 border border-[#E5E7EB] rounded-xl text-sm font-bold text-[#4B5563] hover:bg-gray-50 transition-colors">
                Cerrar Reporte
              </button>
            </div>

          </div><!-- /detail-card -->


        </div>
      </main>
    </div>

    <!-- Image modal -->
    <Teleport to="body">
      <div
        v-if="isImageModalOpen"
        @click="isImageModalOpen = false"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      >
        <button
          @click="isImageModalOpen = false"
          class="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/70 rounded-full w-9 h-9 flex items-center justify-center transition-colors"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <img
          :src="report.screenshotUrl"
          alt="Evidencia ampliada"
          @click.stop
          class="max-w-full max-h-full rounded-xl shadow-2xl object-contain"
        >
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.detail-card {
  background-color: #ffffff;
}

/* Custom scrollbar for better look if content overflows */
main::-webkit-scrollbar {
  width: 8px;
}
main::-webkit-scrollbar-track {
  background: #f1f1f1;
}
main::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
main::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

textarea::placeholder {
  color: #9CA3AF;
  font-weight: 400;
}
</style>
