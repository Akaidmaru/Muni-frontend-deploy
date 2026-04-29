<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import logoCompleto from '@/assets/images/Logo-completo.png'
import DashboardSidebar from '@/components/DashboardSidebar.vue'
import UserMenu from '@/components/UserMenu.vue'
import api from '@/services/axios'

const router = useRouter()

// ── Estado ────────────────────────────────────────────────────────────────────
const solicitudes = ref([])
const isLoading   = ref(false)
const loadError   = ref('')

const filtroTipo    = ref('ALL')
const filtroFecha   = ref('ALL')
const busqueda      = ref('')
const itemsPerPage  = ref(10)
const currentPage   = ref(1)

const selectedItem  = ref(null)
const isDetailOpen  = ref(false)
const openingAttachmentId = ref(null)

// ── Config de tipos ───────────────────────────────────────────────────────────
const TIPO_OPTIONS = [
  { value: 'conductor_anadir', label: 'Añadir conductor'       },
  { value: 'conductor_baja',   label: 'Dar de baja a conductor' },
  { value: 'patente',          label: 'Acceso a patente'        },
]

const tipoLabel = (tipo) =>
  TIPO_OPTIONS.find(t => t.value === tipo)?.label ?? tipo ?? '—'

// ── Config de estados ─────────────────────────────────────────────────────────
const ESTADO_CFG = {
  PENDING:     { label: 'Pendiente',   bg: '#fff7ed', border: '#fed7aa', text: '#b45309', dot: '#f59e0b' },
  IN_PROGRESS: { label: 'En curso',    bg: '#fff7ed', border: '#fed7aa', text: '#b45309', dot: '#f59e0b' },
  COMPLETED:   { label: 'Finalizado',  bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', dot: '#22c55e' },
  REJECTED:    { label: 'Rechazado',   bg: '#fef2f2', border: '#fecaca', text: '#dc2626', dot: '#ef4444' },
}
const estadoCfg = (e) => ESTADO_CFG[e] ?? ESTADO_CFG.PENDING

// ── Helpers ───────────────────────────────────────────────────────────────────
const normalize = (v) =>
  String(v ?? '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

const formatDate = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const yearMonth = (iso) => {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const monthLabel = (ym) => {
  if (!ym) return ym
  const [y, m] = ym.split('-')
  const names = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  return `${names[parseInt(m, 10) - 1]} ${y}`
}

// ── Carga de datos ────────────────────────────────────────────────────────────
// requiere endpoint en el backend: GET /solicitudes (filtrado por usuario DIRECTION)
const loadSolicitudes = async () => {
  isLoading.value = true
  loadError.value = ''
  try {
    const { data } = await api.get('/solicitudes')
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
onMounted(loadSolicitudes)

// ── Fechas únicas para filtro ─────────────────────────────────────────────────
const fechasUnicas = computed(() => {
  const set = new Set(solicitudes.value.map(s => yearMonth(s.createdAt)).filter(Boolean))
  return [...set].sort().reverse()
})

// ── Filtrado y paginación ─────────────────────────────────────────────────────
const filtered = computed(() => {
  const q = normalize(busqueda.value)
  return solicitudes.value.filter(s => {
    const matchTipo  = filtroTipo.value === 'ALL' || s.tipo === filtroTipo.value
    const matchFecha = filtroFecha.value === 'ALL' || yearMonth(s.createdAt) === filtroFecha.value
    const matchQ     = !q
      || normalize(s.id).includes(q)
      || normalize(tipoLabel(s.tipo)).includes(q)
      || normalize(formatDate(s.createdAt)).includes(q)
      || normalize(estadoCfg(s.estado || s.status).label).includes(q)
    return matchTipo && matchFecha && matchQ
  })
})

const totalItems = computed(() => filtered.value.length)
const totalPages = computed(() => Math.max(Math.ceil(totalItems.value / itemsPerPage.value), 1))
const paged      = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filtered.value.slice(start, start + itemsPerPage.value)
})
const firstRow = computed(() =>
  totalItems.value === 0 ? 0 : (currentPage.value - 1) * itemsPerPage.value + 1
)
const lastRow = computed(() =>
  Math.min(currentPage.value * itemsPerPage.value, totalItems.value)
)

watch([filtroTipo, filtroFecha, busqueda, itemsPerPage], () => { currentPage.value = 1 })
const prevPage = () => { if (currentPage.value > 1) currentPage.value-- }
const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++ }

// ── Modal detalle ─────────────────────────────────────────────────────────────
const openDetail = (item) => { selectedItem.value = item; isDetailOpen.value = true }
const closeDetail = () => { isDetailOpen.value = false; selectedItem.value = null }

const hasAttachment = (item) => Boolean(item?.archivoKey || item?.attachmentKey)

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
</script>

<template>
  <div class="h-screen min-h-0 overflow-hidden bg-background flex flex-col">
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

      <main class="flex-1 pt-6 pb-10 pl-4 pr-4 sm:pr-6 lg:pr-8 overflow-y-auto flex flex-col">
        <div class="w-full flex flex-col flex-1">

          <!-- Card principal -->
          <div class="bg-white rounded-[2rem] border-2 border-slate-300 shadow-sm flex flex-col overflow-hidden flex-1">

            <!-- Encabezado -->
            <div class="shrink-0 px-4 sm:px-6 lg:px-10 pt-6 pb-1">
              <div class="relative mb-4 flex flex-col items-start gap-3 sm:block">
                <button
                  @click="router.back()"
                  class="flex items-center gap-1 text-sm font-titles font-semibold text-slate-600 hover:text-primary transition-colors z-10"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Volver
                </button>
                <h1 class="w-full text-center text-2xl md:text-3xl font-bold font-titles text-text-title sm:absolute sm:inset-x-0 sm:pointer-events-none">
                  Historial de solicitudes
                </h1>
              </div>
              <div class="border-b border-slate-200">
                <span class="inline-block text-sm font-titles font-semibold text-slate-800 pb-2 border-b-2 border-slate-800">
                  Detalles
                </span>
              </div>
            </div>

            <!-- Filtros -->
            <div class="px-6 lg:px-10 pt-6 pb-4 flex flex-wrap items-center gap-3">
              <span class="text-sm font-titles font-semibold text-slate-600 shrink-0">Filtrar por:</span>

              <!-- Tipo -->
              <div class="relative">
                <select
                  v-model="filtroTipo"
                  class="appearance-none bg-white border border-slate-300 rounded-[0.65rem] px-4 py-2 pr-9 text-sm focus:outline-none focus:border-primary shadow-sm min-w-[180px] text-slate-600 font-medium"
                >
                  <option value="ALL">Tipo</option>
                  <option v-for="t in TIPO_OPTIONS" :key="t.value" :value="t.value">{{ t.label }}</option>
                </select>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
              </div>

              <!-- Fecha -->
              <div class="relative">
                <select
                  v-model="filtroFecha"
                  class="appearance-none bg-white border border-slate-300 rounded-[0.65rem] px-4 py-2 pr-9 text-sm focus:outline-none focus:border-primary shadow-sm min-w-[160px] text-slate-600 font-medium"
                >
                  <option value="ALL">Fecha</option>
                  <option v-for="ym in fechasUnicas" :key="ym" :value="ym">{{ monthLabel(ym) }}</option>
                </select>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
              </div>

              <!-- Buscar -->
              <div class="relative w-[200px]">
                <input
                  v-model="busqueda"
                  type="text"
                  placeholder="Buscar"
                  class="w-full bg-white border border-slate-300 rounded-[0.65rem] px-4 py-2 pr-9 text-sm focus:outline-none focus:border-primary shadow-sm text-slate-600 placeholder:text-slate-400 font-medium"
                />
                <svg class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
            </div>

            <!-- Tabla -->
            <div class="flex-1 px-6 lg:px-10 min-h-0 overflow-auto">
              <div v-if="isLoading" class="flex items-center justify-center py-24 gap-3">
                <svg class="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <span class="text-sm text-slate-500 font-titles">Cargando solicitudes...</span>
              </div>

              <div v-else-if="loadError" class="py-24 text-center text-sm font-semibold text-red-600">
                {{ loadError }}
              </div>

              <table v-else class="w-full border-collapse min-w-[600px]">
                <thead>
                  <tr>
                    <th class="border border-[#7EA0C4] py-3 px-4 text-center font-body text-sm font-medium text-slate-700 bg-white">ID</th>
                    <th class="border border-[#7EA0C4] py-3 px-4 text-center font-body text-sm font-medium text-slate-700 bg-white">Tipo</th>
                    <th class="border border-[#7EA0C4] py-3 px-4 text-center font-body text-sm font-medium text-slate-700 bg-white">Fecha</th>
                    <th class="border border-[#7EA0C4] py-3 px-4 text-center font-body text-sm font-medium text-slate-700 bg-white">Estado</th>
                    <th class="border border-[#7EA0C4] py-3 px-4 text-center font-body text-sm font-medium text-slate-700 bg-white">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="paged.length === 0">
                    <td colspan="5" class="border border-[#D3DCE6] py-16 text-center text-slate-400 text-sm font-titles">
                      No hay solicitudes para mostrar.
                    </td>
                  </tr>
                  <tr
                    v-for="item in paged"
                    :key="item.id"
                    class="bg-white hover:bg-slate-50/60 transition-colors"
                  >
                    <td class="border border-[#D3DCE6] py-3 px-4 text-center text-slate-500 text-sm font-medium">
                      #{{ String(item.id).padStart(4, '0') }}
                    </td>
                    <td class="border border-[#D3DCE6] py-3 px-4 text-center text-slate-600 text-sm">
                      {{ tipoLabel(item.tipo) }}
                    </td>
                    <td class="border border-[#D3DCE6] py-3 px-4 text-center text-slate-500 text-sm">
                      {{ formatDate(item.createdAt) }}
                    </td>
                    <td class="border border-[#D3DCE6] py-3 px-4 text-center">
                      <span
                        class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
                        :style="{
                          backgroundColor: estadoCfg(item.estado).bg,
                          borderColor:     estadoCfg(item.estado).border,
                          color:           estadoCfg(item.estado).text,
                        }"
                      >
                        <span class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: estadoCfg(item.estado).dot }"/>
                        {{ estadoCfg(item.estado).label }}
                      </span>
                    </td>
                    <td class="border border-[#D3DCE6] py-3 px-4 text-center">
                      <button
                        @click="openDetail(item)"
                        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                        Ver
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pie paginación -->
            <div class="px-6 lg:px-10 py-5 mt-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
              <div class="flex items-center gap-2">
                <span class="font-titles">Filas por páginas</span>
                <div class="relative">
                  <select v-model.number="itemsPerPage" class="appearance-none border border-gray-300 rounded-md px-3 py-1 pr-7 bg-white outline-none focus:border-primary cursor-pointer text-xs">
                    <option :value="10">10</option>
                    <option :value="25">25</option>
                    <option :value="50">50</option>
                  </select>
                  <svg class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>
              <div class="flex items-center gap-5">
                <span class="font-titles">{{ firstRow }}-{{ lastRow }} de {{ totalItems }}</span>
                <div class="flex items-center gap-2">
                  <button @click="prevPage" :disabled="currentPage <= 1" class="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <button @click="nextPage" :disabled="currentPage >= totalPages" class="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>

    <!-- Modal detalle -->
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
              <p class="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">ID</p>
              <p class="text-slate-700 font-medium">#{{ String(selectedItem.id).padStart(4, '0') }}</p>
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
            <div class="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <p class="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Fecha</p>
              <p class="text-slate-700 font-medium">{{ formatDate(selectedItem.createdAt) }}</p>
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
                :style="{
                  backgroundColor: estadoCfg(selectedItem.estado).bg,
                  borderColor:     estadoCfg(selectedItem.estado).border,
                  color:           estadoCfg(selectedItem.estado).text,
                }"
              >
                <span class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: estadoCfg(selectedItem.estado).dot }"/>
                {{ estadoCfg(selectedItem.estado).label }}
              </span>
            </div>
            <div class="flex justify-end pt-2">
              <button @click="closeDetail" class="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-semibold hover:bg-slate-50 transition-colors text-sm">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
