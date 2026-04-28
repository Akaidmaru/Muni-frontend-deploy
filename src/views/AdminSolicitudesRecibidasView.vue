<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import logoCompleto from '@/assets/images/Logo-completo.png'
import DashboardSidebar from '@/components/DashboardSidebar.vue'
import UserMenu from '@/components/UserMenu.vue'
import api from '@/services/axios'

const router = useRouter()

const solicitudes = ref([])
const isLoading = ref(false)
const loadError = ref('')
const selectedItem = ref(null)
const isDetailOpen = ref(false)
const updatingId = ref(null)
const openingAttachmentId = ref(null)

const TIPO_LABELS = {
  conductor_anadir: 'Añadir conductor',
  conductor_baja: 'Dar de baja a conductor',
  patente: 'Acceso a patente',
}

const ESTADO_OPTIONS = [
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'IN_PROGRESS', label: 'En curso' },
  { value: 'COMPLETED', label: 'Finalizado' },
  { value: 'REJECTED', label: 'Rechazado' },
]

const ESTADO_CFG = {
  PENDING: { label: 'Pendiente', bg: '#fff7ed', border: '#fed7aa', text: '#b45309', dot: '#f59e0b' },
  IN_PROGRESS: { label: 'En curso', bg: '#fff7ed', border: '#fed7aa', text: '#b45309', dot: '#f59e0b' },
  COMPLETED: { label: 'Finalizado', bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', dot: '#22c55e' },
  REJECTED: { label: 'Rechazado', bg: '#fef2f2', border: '#fecaca', text: '#dc2626', dot: '#ef4444' },
}

const sortedSolicitudes = computed(() => solicitudes.value)

const tipoLabel = (tipo) => TIPO_LABELS[tipo] || tipo || '-'
const estadoCfg = (estado) => ESTADO_CFG[estado] || ESTADO_CFG.PENDING

const requesterLabel = (item) =>
  item?.requester?.name || item?.requester?.email || 'Sin solicitante'

const hasAttachment = (item) => Boolean(item?.archivoKey || item?.attachmentKey)

const formatDate = (iso) => {
  if (!iso) return '-'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const loadSolicitudes = async () => {
  isLoading.value = true
  loadError.value = ''
  try {
    const { data } = await api.get('/solicitudes/all')
    solicitudes.value = Array.isArray(data) ? data : []
  } catch (error) {
    const backendMessage = error.response?.data?.message
    loadError.value = Array.isArray(backendMessage)
      ? backendMessage.join(', ')
      : backendMessage || 'No se pudieron cargar las solicitudes.'
    solicitudes.value = []
  } finally {
    isLoading.value = false
  }
}

const updateEstado = async (item, estado) => {
  updatingId.value = item.id
  loadError.value = ''
  try {
    const { data } = await api.patch(`/solicitudes/${item.id}/estado`, { estado })
    const index = solicitudes.value.findIndex((solicitud) => solicitud.id === item.id)
    if (index !== -1) solicitudes.value[index] = data
    if (selectedItem.value?.id === item.id) selectedItem.value = data
  } catch (error) {
    const backendMessage = error.response?.data?.message
    loadError.value = Array.isArray(backendMessage)
      ? backendMessage.join(', ')
      : backendMessage || 'No se pudo actualizar la solicitud.'
  } finally {
    updatingId.value = null
  }
}

const openDetail = (item) => {
  selectedItem.value = item
  isDetailOpen.value = true
}

const closeDetail = () => {
  selectedItem.value = null
  isDetailOpen.value = false
}

const openAttachment = async (item) => {
  if (!item || openingAttachmentId.value) return
  openingAttachmentId.value = item.id
  loadError.value = ''
  try {
    const { data } = await api.get(`/solicitudes/${item.id}/archivo`)
    if (data?.url) window.open(data.url, '_blank', 'noopener,noreferrer')
  } catch (error) {
    const backendMessage = error.response?.data?.message
    loadError.value = Array.isArray(backendMessage)
      ? backendMessage.join(', ')
      : backendMessage || 'No se pudo abrir el archivo adjunto.'
  } finally {
    openingAttachmentId.value = null
  }
}

onMounted(loadSolicitudes)
</script>

<template>
  <div class="h-screen min-h-0 overflow-hidden bg-gray-100 flex flex-col">
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

      <main class="flex-1 pt-4 pb-10 pr-4 overflow-y-auto flex flex-col">
        <div class="w-full mb-3 shrink-0">
          <button
            @click="router.back()"
            class="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary transition-colors"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Volver
          </button>
        </div>

        <div class="bg-white rounded-3xl border-2 border-slate-300 shadow-sm flex-1 flex flex-col overflow-hidden w-full">
          <div class="px-6 py-5 border-b border-slate-200 shrink-0">
            <h1 class="text-xl font-titles font-bold text-text-title text-center">Solicitudes recibidas</h1>
          </div>

          <div v-if="loadError" class="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">
            {{ loadError }}
          </div>

          <div class="flex-1 overflow-auto px-6 py-5">
            <div v-if="isLoading" class="flex h-full min-h-[18rem] items-center justify-center text-sm font-semibold text-slate-500">
              Cargando solicitudes...
            </div>

            <table v-else class="w-full min-w-[860px] border-collapse text-sm">
              <thead>
                <tr>
                  <th class="border border-[#7EA0C4] px-4 py-3 text-center font-medium text-slate-700">ID</th>
                  <th class="border border-[#7EA0C4] px-4 py-3 text-center font-medium text-slate-700">Solicitante</th>
                  <th class="border border-[#7EA0C4] px-4 py-3 text-center font-medium text-slate-700">Tipo</th>
                  <th class="border border-[#7EA0C4] px-4 py-3 text-center font-medium text-slate-700">Fecha</th>
                  <th class="border border-[#7EA0C4] px-4 py-3 text-center font-medium text-slate-700">Estado</th>
                  <th class="border border-[#7EA0C4] px-4 py-3 text-center font-medium text-slate-700">Acción</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="sortedSolicitudes.length === 0">
                  <td colspan="6" class="border border-[#D3DCE6] py-16 text-center text-slate-400 font-medium">
                    No hay solicitudes recibidas.
                  </td>
                </tr>
                <tr v-for="item in sortedSolicitudes" :key="item.id" class="hover:bg-slate-50 transition-colors">
                  <td class="border border-[#D3DCE6] px-4 py-3 text-center text-slate-500">#{{ String(item.id).padStart(4, '0') }}</td>
                  <td class="border border-[#D3DCE6] px-4 py-3 text-center text-slate-600">{{ requesterLabel(item) }}</td>
                  <td class="border border-[#D3DCE6] px-4 py-3 text-center text-slate-600">{{ tipoLabel(item.tipo) }}</td>
                  <td class="border border-[#D3DCE6] px-4 py-3 text-center text-slate-500">{{ formatDate(item.createdAt) }}</td>
                  <td class="border border-[#D3DCE6] px-4 py-3 text-center">
                    <select
                      :value="item.estado"
                      :disabled="updatingId === item.id"
                      class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold outline-none focus:border-primary disabled:opacity-60"
                      @change="updateEstado(item, $event.target.value)"
                    >
                      <option v-for="option in ESTADO_OPTIONS" :key="option.value" :value="option.value">{{ option.label }}</option>
                    </select>
                  </td>
                  <td class="border border-[#D3DCE6] px-4 py-3 text-center">
                    <button
                      @click="openDetail(item)"
                      class="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>

    <Teleport to="body">
      <div
        v-if="isDetailOpen && selectedItem"
        class="fixed inset-0 z-[60] bg-black/35 flex items-center justify-center px-4 py-4"
        @click.self="closeDetail"
      >
        <div class="w-full max-w-md rounded-[1.75rem] bg-white shadow-2xl border border-slate-200 overflow-y-auto max-h-[90vh]">
          <div class="px-8 pt-7 pb-5 flex items-start justify-between gap-4">
            <h2 class="text-xl font-titles font-bold text-slate-900">Detalle de solicitud</h2>
            <button @click="closeDetail" class="text-slate-400 hover:text-slate-700 transition-colors">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="px-8 pb-8 space-y-3 text-sm">
            <div class="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <p class="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Solicitante</p>
              <p class="text-slate-700 font-medium">{{ requesterLabel(selectedItem) }}</p>
            </div>
            <div class="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <p class="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Tipo</p>
              <p class="text-slate-700 font-medium">{{ tipoLabel(selectedItem.tipo) }}</p>
            </div>
            <div v-if="selectedItem.nombre" class="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <p class="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Nombre del conductor</p>
              <p class="text-slate-700 font-medium">{{ selectedItem.nombre }}</p>
            </div>
            <div v-if="selectedItem.patente" class="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <p class="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Patente</p>
              <p class="text-slate-700 font-medium uppercase">{{ selectedItem.patente }}</p>
            </div>
            <div v-if="selectedItem.razon" class="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <p class="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Razón</p>
              <p class="text-slate-700">{{ selectedItem.razon }}</p>
            </div>
            <div v-if="hasAttachment(selectedItem)" class="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <p class="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">Archivo adjunto</p>
              <button
                @click="openAttachment(selectedItem)"
                :disabled="openingAttachmentId === selectedItem.id"
                class="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-60 transition-colors"
              >
                {{ openingAttachmentId === selectedItem.id ? 'Abriendo...' : 'Ver archivo' }}
              </button>
            </div>
            <div class="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <p class="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Estado</p>
              <span
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
                :style="{ backgroundColor: estadoCfg(selectedItem.estado).bg, borderColor: estadoCfg(selectedItem.estado).border, color: estadoCfg(selectedItem.estado).text }"
              >
                <span class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: estadoCfg(selectedItem.estado).dot }" />
                {{ estadoCfg(selectedItem.estado).label }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
