<script setup>
/**
 * AdminMaintenanceDailyView.vue
 * ─────────────────────────────────────────────────────────────────────────
 * Vista de historial de mantenimiento vehicular diario (Admin).
 *
 * INTEGRACIÓN BACKEND — pendiente de implementación
 * El frontend está completamente preparado. Solo descomentar los bloques
 * marcados con "CONECTAR BACKEND" y eliminar el bloque "MOCK" debajo.
 *
 * Endpoints requeridos (ver /docs/backend-maintenance-contract.md):
 *   GET /maintenance/daily/stats   → KPIs del panel superior
 *   GET /maintenance/daily         → registros paginados de la tabla
 *   PATCH /maintenance/daily/:id   → editar un registro
 * ─────────────────────────────────────────────────────────────────────────
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import logoCompleto from '@/assets/images/Logo-completo.png'
import DashboardSidebar from '@/components/DashboardSidebar.vue'
import UserMenu from '@/components/UserMenu.vue'
import api from '@/services/axios'
import { useVehicleAlertsStore } from '@/stores/vehicleAlerts'

const router = useRouter()
const vehicleAlertsStore = useVehicleAlertsStore()
const alertsModal = ref(false)

// ═══════════════════════════════════════════════════════════
// KPI STATS
// ═══════════════════════════════════════════════════════════
const kpis = ref({
  minorIncidents: 0,
  topCategories: '',
  outOfService: 0,
  dailyRegistrations: 0,
  pendingRegistrations: 0,
})
const isLoadingKpis = ref(false)

const loadStats = async () => {
  isLoadingKpis.value = true
  try {
    // ── CONECTAR BACKEND ────────────────────────────────────
    // Descomentar cuando el endpoint esté disponible:
    //
    // const { data } = await api.get('/maintenance/daily/stats')
    // kpis.value = {
    //   minorIncidents:       data.minorIncidents       ?? 0,
    //   topCategories:        data.topCategories        ?? '',
    //   outOfService:         data.outOfService         ?? 0,
    //   dailyRegistrations:   data.dailyRegistrations   ?? 0,
    //   pendingRegistrations: data.pendingRegistrations ?? 0,
    // }
    //
    // Respuesta esperada del backend:
    // {
    //   minorIncidents: number,       // total de incidencias menores del día
    //   topCategories: string,        // ej: "Luces Altas (4)\nNeumáticos (1)"
    //   outOfService: number,         // vehículos fuera de servicio
    //   dailyRegistrations: number,   // total de registros del día
    //   pendingRegistrations: number  // registros con status PENDING
    // }
    // ── MOCK (eliminar cuando el backend esté listo) ────────
    kpis.value = {
      minorIncidents: 14,
      topCategories: 'Luces Altas (4)\nNeumáticos (1)',
      outOfService: vehicleAlertsStore.outOfServiceCount,
      dailyRegistrations: 20,
      pendingRegistrations: 2,
    }
    // ───────────────────────────────────────────────────────
  } catch (err) {
    console.error('[Mantenimiento Diario] Error al cargar estadísticas:', err)
  } finally {
    isLoadingKpis.value = false
  }
}

const criticalAlerts = computed(() => vehicleAlertsStore.criticalAlerts)
const outOfServiceCount = computed(() => vehicleAlertsStore.outOfServiceCount)

const formatAlertDateTime = (value) => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Fecha no disponible'
  }

  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const openAlertsModal = () => {
  vehicleAlertsStore.syncFromStorage()
  alertsModal.value = true
}

const closeAlertsModal = () => {
  alertsModal.value = false
}

// ═══════════════════════════════════════════════════════════
// REGISTROS DE MANTENIMIENTO (tabla paginada)
// ═══════════════════════════════════════════════════════════

/**
 * Forma esperada de cada registro (una vez que el backend esté listo):
 * {
 *   id:           number,
 *   date:         string,  // "DD-MM-YYYY"
 *   plate:        string,  // patente del vehículo
 *   driver:       string,  // nombre del conductor
 *   faultSummary: string,  // resumen de fallos, ej: "1 Ítem Malo\n2 Regulares"
 *   status:       'REVISADO' | 'PENDIENTE'
 * }
 */
const records    = ref([])
const totalItems = ref(0)
const totalPages = ref(1)
const isLoadingRecords = ref(false)
const recordsError     = ref('')

const itemsPerPage = ref(100)
const currentPage  = ref(1)

const loadRecords = async () => {
  isLoadingRecords.value = true
  recordsError.value = ''
  try {
    // ── CONECTAR BACKEND ────────────────────────────────────
    // Descomentar cuando el endpoint esté disponible:
    //
    // const { data } = await api.get('/maintenance/daily', {
    //   params: {
    //     page:     currentPage.value,
    //     pageSize: itemsPerPage.value,
    //   },
    // })
    // records.value    = data.items      ?? []
    // totalItems.value = data.total      ?? 0
    // totalPages.value = data.totalPages ?? 1
    //
    // Respuesta esperada del backend (paginada igual que trip-history):
    // {
    //   items: MaintenanceRecord[],
    //   total: number,
    //   page: number,
    //   pageSize: number,
    //   totalPages: number
    // }
    // ── MOCK (eliminar cuando el backend esté listo) ────────
    records.value = [
      { id: 1, date: '07-04-2025', plate: 'BJGP-75', driver: 'Brandon Velez',   faultSummary: '1 Ítem Malo\n2 Regulares',  status: 'REVISADO'  },
      { id: 2, date: '07-04-2025', plate: 'FKRZ-12', driver: 'Carlos Muñoz',    faultSummary: '3 Regulares',               status: 'REVISADO'  },
      { id: 3, date: '07-04-2025', plate: 'BJGP-75', driver: 'Brandon Velez',   faultSummary: '1 Ítem Malo',               status: 'PENDIENTE' },
      { id: 4, date: '06-04-2025', plate: 'LMTX-44', driver: 'Pedro Soto',      faultSummary: '2 Ítems Malos\n1 Regular',  status: 'REVISADO'  },
      { id: 5, date: '06-04-2025', plate: 'FKRZ-12', driver: 'Carlos Muñoz',    faultSummary: '',                          status: 'PENDIENTE' },
      { id: 6, date: '05-04-2025', plate: 'BJGP-75', driver: 'Brandon Velez',   faultSummary: '4 Regulares',               status: 'REVISADO'  },
    ]
    totalItems.value = records.value.length
    totalPages.value = 1
    // ───────────────────────────────────────────────────────
  } catch (err) {
    const msg = err?.response?.data?.message
    recordsError.value = Array.isArray(msg) ? msg.join(', ') : msg || 'Error al cargar registros.'
    console.error('[Mantenimiento Diario] Error al cargar registros:', err)
  } finally {
    isLoadingRecords.value = false
  }
}

// ═══════════════════════════════════════════════════════════
// PAGINACIÓN
// ═══════════════════════════════════════════════════════════
const firstVisibleRow = computed(() =>
  totalItems.value === 0 ? 0 : (currentPage.value - 1) * Number(itemsPerPage.value) + 1
)
const lastVisibleRow = computed(() =>
  Math.min(currentPage.value * Number(itemsPerPage.value), totalItems.value)
)
const goToPreviousPage = () => {
  if (currentPage.value > 1) { currentPage.value--; loadRecords() }
}
const goToNextPage = () => {
  if (currentPage.value < totalPages.value) { currentPage.value++; loadRecords() }
}

// ═══════════════════════════════════════════════════════════
// DRAG-SCROLL
// ═══════════════════════════════════════════════════════════
const tableScrollRef  = ref(null)
const isTableDragging = ref(false)
let dragStartX = 0; let dragStartScrollLeft = 0

const onTableMouseDown = (e) => {
  if (e.target?.closest?.('a,button,input,select,textarea,label')) return
  isTableDragging.value  = true
  dragStartX             = e.clientX
  dragStartScrollLeft    = tableScrollRef.value?.scrollLeft ?? 0
}
const onTableMouseMove = (e) => {
  if (!isTableDragging.value || !tableScrollRef.value) return
  tableScrollRef.value.scrollLeft = dragStartScrollLeft - (e.clientX - dragStartX)
}
const onTableMouseUp = () => { isTableDragging.value = false }

onMounted(() => {
  vehicleAlertsStore.syncFromStorage()
  loadStats()
  loadRecords()
  window.addEventListener('mousemove', onTableMouseMove)
  window.addEventListener('storage', vehicleAlertsStore.syncFromStorage)
  window.addEventListener('mouseup', onTableMouseUp)
})
onBeforeUnmount(() => {
  window.removeEventListener('storage', vehicleAlertsStore.syncFromStorage)
  window.removeEventListener('mousemove', onTableMouseMove)
  window.removeEventListener('mouseup', onTableMouseUp)
})

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════
const statusClass = (status) =>
  status === 'REVISADO' ? 'bg-[#1b2e4b] text-white' : 'bg-[#E85D26] text-white'

// ═══════════════════════════════════════════════════════════
// MODAL VER — reporte de un registro
// ═══════════════════════════════════════════════════════════
const viewModal = ref({ open: false, record: null })

const viewRecord = async (record) => {
  // ── CONECTAR BACKEND ──────────────────────────────────────
  // Descomentar para obtener el detalle completo del registro:
  //
  // try {
  //   const { data } = await api.get(`/maintenance/daily/${record.id}`)
  //   viewModal.value = { open: true, record: data }
  // } catch (err) {
  //   console.error('[Mantenimiento Diario] Error al cargar detalle:', err)
  // }
  //
  // Respuesta esperada del backend:
  // {
  //   id, date, plate, driver,
  //   items: [ { label, exists, state, note } ],  // cheklist completo
  //   annex: { revisionTecnica, permisoCirculacion, seguroObligatorio },
  //   faultSummary, status, licMunicipal, kilometraje
  // }
  // ── MOCK (eliminar cuando el backend esté listo) ───────────
  viewModal.value = {
    open: true,
    record: {
      ...record,
      licMunicipal: 'LM-2024-0042',
      kilometraje: '98.450 km',
      items: [
        { section: '1. Sistema de luces', rows: [
          { label: 'Estacionamiento',   exists: 'Si', state: 'Bueno',   note: '' },
          { label: 'Bajas',             exists: 'Si', state: 'Bueno',   note: '' },
          { label: 'Altas',             exists: 'Si', state: 'Malo',    note: 'Foco fundido lado derecho' },
          { label: 'Frenos',            exists: 'Si', state: 'Bueno',   note: '' },
          { label: 'Marcha atrás',      exists: 'Si', state: 'Regular', note: '' },
        ]},
        { section: '2. Sistema de frenos', rows: [
          { label: 'De mano',           exists: 'Si', state: 'Bueno',   note: '' },
          { label: 'Pedal',             exists: 'Si', state: 'Regular', note: 'Desgaste leve' },
        ]},
        { section: '3. Neumáticos', rows: [
          { label: 'Delantero derecho', exists: 'Si', state: 'Regular', note: '' },
          { label: 'Delantero izquierdo', exists: 'Si', state: 'Bueno', note: '' },
          { label: 'Trasero derecho',   exists: 'Si', state: 'Bueno',   note: '' },
          { label: 'Trasero izquierdo', exists: 'Si', state: 'Bueno',   note: '' },
          { label: 'Repuesto',          exists: 'Si', state: 'Bueno',   note: '' },
        ]},
        { section: '4. Niveles / Motor', rows: [
          { label: 'Nivel aceite motor',    exists: 'Si', state: 'Bueno', note: '' },
          { label: 'Nivel aceite radiador', exists: 'Si', state: 'Bueno', note: '' },
          { label: 'Nivel líquido frenos',  exists: 'Si', state: 'Bueno', note: '' },
          { label: 'Correas',               exists: 'Si', state: 'Bueno', note: '' },
          { label: 'Batería',               exists: 'Si', state: 'Bueno', note: '' },
        ]},
        { section: '5. Accesorios y documentos', rows: [
          { label: 'Extintor',          exists: 'Si', state: 'Bueno', note: '' },
          { label: 'Botiquín',          exists: 'Si', state: 'Bueno', note: '' },
          { label: 'Gata y manivela',   exists: 'Si', state: 'Bueno', note: '' },
          { label: 'Triángulo',         exists: 'No', state: 'Malo',  note: 'No encontrado' },
          { label: 'Llave de rueda',    exists: 'Si', state: 'Bueno', note: '' },
        ]},
      ],
      annex: {
        revisionTecnica:     'Vigente',
        permisoCirculacion:  'Vigente',
        seguroObligatorio:   'Vigente',
      },
    }
  }
  // ─────────────────────────────────────────────────────────
}

const closeViewModal = () => { viewModal.value = { open: false, record: null } }

// ═══════════════════════════════════════════════════════════
// MODAL EDITAR — modificar un registro
// ═══════════════════════════════════════════════════════════
const editModal = ref({ open: false, record: null })
const editForm = ref({ status: '', faultSummary: '' })
const isSavingEdit = ref(false)
const editError = ref('')

const editRecord = (record) => {
  editForm.value = {
    status:       record.status,
    faultSummary: record.faultSummary,
  }
  editModal.value = { open: true, record }
  editError.value = ''
}

const closeEditModal = () => { editModal.value = { open: false, record: null }; editError.value = '' }

const saveEdit = async () => {
  if (!editModal.value.record) return
  isSavingEdit.value = true
  editError.value = ''

  try {
    // ── CONECTAR BACKEND ────────────────────────────────────
    // Descomentar cuando el endpoint PATCH esté disponible:
    //
    // const { data } = await api.patch(
    //   `/maintenance/daily/${editModal.value.record.id}`,
    //   {
    //     status:       editForm.value.status,
    //     faultSummary: editForm.value.faultSummary,
    //   }
    // )
    // // Actualizar la fila en la tabla local:
    // const idx = records.value.findIndex(r => r.id === editModal.value.record.id)
    // if (idx !== -1) records.value[idx] = { ...records.value[idx], ...data }
    //
    // ── MOCK (eliminar cuando el backend esté listo) ─────────
    const idx = records.value.findIndex(r => r.id === editModal.value.record.id)
    if (idx !== -1) {
      records.value[idx] = {
        ...records.value[idx],
        status:       editForm.value.status,
        faultSummary: editForm.value.faultSummary,
      }
    }
    // ─────────────────────────────────────────────────────────
    closeEditModal()
  } catch (err) {
    const msg = err?.response?.data?.message
    editError.value = Array.isArray(msg) ? msg.join(', ') : msg || 'No se pudo guardar el cambio.'
    console.error('[Mantenimiento Diario] Error al editar registro:', err)
  } finally {
    isSavingEdit.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col">
    <!-- Navbar -->
    <div class="bg-white shadow-sm border-b border-gray-200">
      <div class="px-4 py-4 flex items-center justify-between">
        <router-link to="/" class="flex items-center">
          <img :src="logoCompleto" alt="Transportes Flores Vargas" class="h-16 w-auto object-contain hover:opacity-80 transition-opacity" />
        </router-link>
        <UserMenu />
      </div>
    </div>

    <div class="flex flex-1 overflow-hidden min-w-0">
      <DashboardSidebar />

      <main class="flex-1 pt-16 pb-10 px-3 overflow-hidden flex items-start justify-center min-w-0">
        <div class="bg-white rounded-3xl border-2 border-slate-300 shadow-sm flex-1 flex flex-col overflow-hidden w-full">

          <!-- Título -->
          <div class="px-10 pt-8 pb-6">
            <h1 class="text-3xl font-titles font-extrabold text-slate-900 leading-tight">
              Historial de mantenimiento<br />vehicular diario
            </h1>
          </div>

          <!-- KPI Cards -->
          <div class="px-10 pb-8 grid grid-cols-2 lg:grid-cols-4 gap-5">

            <!-- Incidencias menores -->
            <div class="rounded-2xl border-2 px-5 py-4 flex flex-col gap-2"
                 style="background-color:#FFF7ED; border-color:#FDBA74;">
              <div class="flex items-start justify-between gap-2">
                <span class="text-sm font-titles font-bold text-slate-800 leading-tight">Incidencias<br />menores:</span>
                <span class="text-4xl font-titles font-extrabold text-slate-900 leading-none shrink-0">
                  {{ isLoadingKpis ? '…' : kpis.minorIncidents }}
                </span>
              </div>
              <div class="flex items-start gap-2 mt-1">
                <svg class="w-5 h-5 mt-0.5 shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                </svg>
                <p class="text-[11px] text-slate-600 leading-snug whitespace-pre-line">
                  Top categorías afectadas:<br/>{{ kpis.topCategories }}
                </p>
              </div>
            </div>

            <!-- Vehículos fuera de servicio -->
            <div class="rounded-2xl border-2 px-5 py-4 flex flex-col gap-3"
                 style="background-color:#FEF2F2; border-color:#FECACA;">
              <div class="flex items-start justify-between gap-2">
                <span class="text-sm font-titles font-bold text-slate-800 leading-tight">Vehículos fuera<br />de servicio</span>
                <span class="text-4xl font-titles font-extrabold text-slate-900 leading-none shrink-0">
                  {{ isLoadingKpis ? '…' : outOfServiceCount }}
                </span>
              </div>
              <div class="flex items-center gap-3">
                <svg class="w-9 h-9 shrink-0 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 18H5.5A1.5 1.5 0 014 16.5v-10A1.5 1.5 0 015.5 5H16a2 2 0 012 2v1m0 0h1.5a2 2 0 011.9 1.368L22 12.5V17a1 1 0 01-1 1h-1M18 8h-2M6 16.5a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0zm9 0a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0z"/>
                </svg>
                <button
                  type="button"
                  @click="openAlertsModal"
                  class="text-sm text-blue-500 font-semibold hover:underline"
                >
                  Ver alertas
                </button>
              </div>
            </div>

            <!-- Registros del día -->
            <div class="rounded-2xl border-2 px-5 py-4 flex flex-col gap-3"
                 style="background-color:#F0FDF4; border-color:#BBF7D0;">
              <span class="text-sm font-titles font-bold text-slate-800">Registros del día</span>
              <div class="flex items-center gap-4">
                <svg class="w-9 h-9 shrink-0 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                  <line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/>
                </svg>
                <span class="text-4xl font-titles font-extrabold text-slate-900">
                  {{ isLoadingKpis ? '…' : kpis.dailyRegistrations }}
                </span>
              </div>
            </div>

            <!-- Registros pendientes -->
            <div class="rounded-2xl border-2 px-5 py-4 flex flex-col gap-3"
                 style="background-color:#FEFCE8; border-color:#FEF08A;">
              <span class="text-sm font-titles font-bold text-slate-800">Registros pendientes</span>
              <div class="flex items-center gap-4">
                <svg class="w-9 h-9 shrink-0 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <span class="text-4xl font-titles font-extrabold text-slate-900">
                  {{ isLoadingKpis ? '…' : kpis.pendingRegistrations }}
                </span>
              </div>
            </div>

          </div>

          <!-- Error de carga -->
          <div v-if="recordsError" class="mx-10 mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            {{ recordsError }}
          </div>

          <!-- Tabla -->
          <div
            ref="tableScrollRef"
            class="flex-1 min-h-0 overflow-x-auto overflow-y-auto px-10 cursor-grab active:cursor-grabbing"
            @mousedown="onTableMouseDown"
          >
            <table class="w-full text-sm" style="border-collapse: collapse;">
              <thead>
                <tr>
                  <th class="py-3 px-5 text-center font-semibold text-slate-700 whitespace-nowrap border border-gray-300">Fecha</th>
                  <th class="py-3 px-5 text-center font-semibold text-slate-700 whitespace-nowrap border border-gray-300">Patente</th>
                  <th class="py-3 px-5 text-center font-semibold text-slate-700 whitespace-nowrap border border-gray-300">Conductor</th>
                  <th class="py-3 px-5 text-center font-semibold text-slate-700 whitespace-nowrap border border-gray-300">Resumen de fallos</th>
                  <th class="py-3 px-5 text-center font-semibold text-slate-700 whitespace-nowrap border border-gray-300">Estado</th>
                  <th class="py-3 px-5 text-center font-semibold text-slate-700 whitespace-nowrap border border-gray-300">Registro</th>
                </tr>
              </thead>
              <tbody>
                <!-- Loading skeleton -->
                <tr v-if="isLoadingRecords">
                  <td colspan="6" class="py-8 text-center text-slate-400 border border-gray-300">
                    <div class="flex items-center justify-center gap-2">
                      <svg class="animate-spin w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                      Cargando registros...
                    </div>
                  </td>
                </tr>

                <!-- Sin datos -->
                <tr v-else-if="records.length === 0">
                  <td colspan="6" class="py-8 text-center text-slate-400 text-sm border border-gray-300">
                    No hay registros de mantenimiento disponibles.
                  </td>
                </tr>

                <!-- Filas de datos -->
                <tr v-else v-for="record in records" :key="record.id"
                    class="hover:bg-gray-50 transition-colors">
                  <td class="py-4 px-5 text-center text-slate-600 text-xs border border-gray-300">{{ record.date }}</td>
                  <td class="py-4 px-5 text-center text-slate-600 text-xs border border-gray-300">{{ record.plate }}</td>
                  <td class="py-4 px-5 text-center text-slate-600 text-xs border border-gray-300">{{ record.driver }}</td>
                  <td class="py-4 px-5 text-center text-slate-600 text-xs border border-gray-300 whitespace-pre-line">{{ record.faultSummary }}</td>
                  <td class="py-4 px-5 text-center border border-gray-300">
                    <span v-if="record.status"
                          class="inline-block px-4 py-1.5 rounded-full text-xs font-bold"
                          :class="statusClass(record.status)">
                      {{ record.status === 'REVISADO' ? 'Revisado' : 'Pendiente' }}
                    </span>
                  </td>
                  <td class="py-4 px-5 text-center border border-gray-300">
                    <div class="flex items-center justify-center gap-3">
                      <!-- Ver: disponible para todos los registros con estado -->
                      <button
                        v-if="record.status"
                        @click="viewRecord(record)"
                        class="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-primary transition-colors">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                          <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                        Ver
                      </button>
                      <!-- Editar: disponible para todos los registros con estado -->
                      <button
                        v-if="record.status"
                        @click="editRecord(record)"
                        class="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-primary transition-colors">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                        Editar
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Footer paginación -->
          <div class="px-10 py-4 bg-white flex justify-between items-center text-xs font-medium text-gray-500 border-t border-gray-200 mt-auto rounded-b-3xl">
            <div class="flex items-center gap-2">
              <span>Filas por páginas</span>
              <div class="relative">
                <select v-model.number="itemsPerPage"
                        class="appearance-none border border-gray-300 rounded-md px-3 py-1.5 pr-8 bg-white outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer">
                  <option :value="10">10</option>
                  <option :value="50">50</option>
                  <option :value="100">100</option>
                </select>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
            <div class="font-semibold">{{ firstVisibleRow }}-{{ lastVisibleRow }} de {{ totalItems }}</div>
            <div class="flex items-center gap-1">
              <button @click="goToPreviousPage" :disabled="currentPage <= 1"
                      class="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 disabled:opacity-40 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button @click="goToNextPage" :disabled="currentPage >= totalPages"
                      class="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 disabled:opacity-40 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  </div>

  <!-- ═══════════ MODAL ALERTAS ═══════════ -->
  <Teleport to="body">
    <div v-if="alertsModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div class="bg-white rounded-3xl shadow-xl w-full max-w-2xl border border-gray-200 overflow-hidden">
        <div class="bg-[#9B2335] px-6 py-5 flex items-center justify-between">
          <div>
            <h3 class="text-white font-titles font-bold text-lg">Vehículos fuera de servicio</h3>
            <p class="text-white/80 text-sm mt-1">Reportes críticos enviados desde cambio de patente por avería.</p>
          </div>
          <button @click="closeAlertsModal" class="text-white/70 hover:text-white transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="p-6 max-h-[70vh] overflow-y-auto">
          <div v-if="criticalAlerts.length === 0" class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
            No hay reportes críticos por avería.
          </div>

          <div v-else class="space-y-4">
            <article
              v-for="alert in criticalAlerts"
              :key="alert.id"
              class="rounded-2xl border border-red-200 bg-red-50 px-5 py-4"
            >
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-sm font-bold text-slate-900">{{ alert.plate || 'Sin patente' }}</p>
                  <p class="text-xs text-slate-500 mt-1">{{ formatAlertDateTime(alert.reportedAt) }}</p>
                </div>
                <span class="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                  {{ alert.category }}
                </span>
              </div>
              <p class="mt-3 text-sm text-slate-700">
                <span class="font-bold">Conductor:</span> {{ alert.driver }}
              </p>
              <p class="mt-2 text-sm text-slate-700 whitespace-pre-line">
                <span class="font-bold">Observación:</span> {{ alert.reason }}
              </p>
            </article>
          </div>
        </div>

        <div class="px-6 pb-6 flex justify-end">
          <button
            @click="closeAlertsModal"
            class="px-6 py-2 bg-[#215179] text-white text-sm rounded-xl font-bold hover:bg-blue-900 transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ═══════════ MODAL VER ═══════════ -->
  <Teleport to="body">
    <div v-if="viewModal.open" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div class="bg-white rounded-3xl shadow-xl w-full max-w-2xl border border-gray-200 overflow-hidden">
        <!-- Header -->
        <div class="bg-[#1b2e4b] px-6 py-5 flex items-center justify-between">
          <h3 class="text-white font-titles font-bold text-lg">Detalle del reporte</h3>
          <button @click="closeViewModal" class="text-white/70 hover:text-white transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <!-- Body -->
        <div class="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          <!-- Info general -->
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p class="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Fecha</p>
              <p class="font-medium text-slate-800">{{ viewModal.record?.date || '—' }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Patente</p>
              <p class="font-medium text-slate-800">{{ viewModal.record?.plate || '—' }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Conductor</p>
              <p class="font-medium text-slate-800">{{ viewModal.record?.driver || '—' }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Estado</p>
              <span class="inline-block px-3 py-1 rounded-full text-xs font-bold" :class="statusClass(viewModal.record?.status)">
                {{ viewModal.record?.status === 'REVISADO' ? 'Revisado' : 'Pendiente' }}
              </span>
            </div>
            <div v-if="viewModal.record?.licMunicipal">
              <p class="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Lic. Municipal</p>
              <p class="font-medium text-slate-800">{{ viewModal.record.licMunicipal }}</p>
            </div>
            <div v-if="viewModal.record?.kilometraje">
              <p class="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Kilometraje</p>
              <p class="font-medium text-slate-800">{{ viewModal.record.kilometraje }}</p>
            </div>
          </div>

          <!-- Resumen rápido de fallos -->
          <div>
            <p class="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Resumen de fallos</p>
            <p class="text-sm text-slate-700 whitespace-pre-line bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
              {{ viewModal.record?.faultSummary || 'Sin fallos registrados' }}
            </p>
          </div>

          <!-- Checklist por secciones -->
          <div v-if="viewModal.record?.items?.length" class="space-y-4">
            <p class="text-xs text-slate-400 font-semibold uppercase tracking-wide">Checklist de inspección</p>
            <div v-for="section in viewModal.record.items" :key="section.section">
              <p class="text-xs font-bold text-slate-600 bg-slate-100 rounded-lg px-3 py-1.5 mb-2">{{ section.section }}</p>
              <table class="w-full text-xs" style="border-collapse:collapse;">
                <thead class="text-slate-400 bg-slate-50">
                  <tr>
                    <th class="text-left px-2 py-1.5 border border-slate-200 w-[40%]">Ítem</th>
                    <th class="text-center px-2 py-1.5 border border-slate-200 w-[15%]">¿Existe?</th>
                    <th class="text-center px-2 py-1.5 border border-slate-200 w-[15%]">Estado</th>
                    <th class="text-left px-2 py-1.5 border border-slate-200">Nota</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in section.rows" :key="row.label" class="hover:bg-slate-50">
                    <td class="px-2 py-1.5 border border-slate-200 text-slate-700">{{ row.label }}</td>
                    <td class="px-2 py-1.5 border border-slate-200 text-center text-slate-600">{{ row.exists }}</td>
                    <td class="px-2 py-1.5 border border-slate-200 text-center">
                      <span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold"
                            :class="row.state === 'Bueno' ? 'bg-green-100 text-green-700' : row.state === 'Regular' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'">
                        {{ row.state }}
                      </span>
                    </td>
                    <td class="px-2 py-1.5 border border-slate-200 text-slate-500 italic">{{ row.note || '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Anexo documentos -->
          <div v-if="viewModal.record?.annex">
            <p class="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">Documentación</p>
            <div class="grid grid-cols-3 gap-2 text-xs text-center">
              <div class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                <p class="text-slate-400 mb-1">Rev. Técnica</p>
                <span class="font-bold" :class="viewModal.record.annex.revisionTecnica === 'Vigente' ? 'text-green-600' : 'text-red-600'">
                  {{ viewModal.record.annex.revisionTecnica }}
                </span>
              </div>
              <div class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                <p class="text-slate-400 mb-1">Permiso Circ.</p>
                <span class="font-bold" :class="viewModal.record.annex.permisoCirculacion === 'Vigente' ? 'text-green-600' : 'text-red-600'">
                  {{ viewModal.record.annex.permisoCirculacion }}
                </span>
              </div>
              <div class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                <p class="text-slate-400 mb-1">Seguro Oblig.</p>
                <span class="font-bold" :class="viewModal.record.annex.seguroObligatorio === 'Vigente' ? 'text-green-600' : 'text-red-600'">
                  {{ viewModal.record.annex.seguroObligatorio }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="px-6 pb-6 flex justify-end">
          <button @click="closeViewModal"
                  class="px-6 py-2 bg-[#215179] text-white text-sm rounded-xl font-bold hover:bg-blue-900 transition-all">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ═══════════ MODAL EDITAR ═══════════ -->
  <Teleport to="body">
    <div v-if="editModal.open" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div class="bg-white rounded-3xl shadow-xl w-full max-w-md border border-gray-200 overflow-hidden">
        <!-- Header -->
        <div class="bg-[#215179] px-6 py-5 flex items-center justify-between">
          <h3 class="text-white font-titles font-bold text-lg">Editar registro</h3>
          <button @click="closeEditModal" class="text-white/70 hover:text-white transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <!-- Body -->
        <div class="p-6 space-y-4">
          <!-- Info readonly -->
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p class="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Fecha</p>
              <p class="font-medium text-slate-700">{{ editModal.record?.date || '—' }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Conductor</p>
              <p class="font-medium text-slate-700">{{ editModal.record?.driver || '—' }}</p>
            </div>
          </div>

          <!-- Estado editable -->
          <div>
            <label class="block text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">Estado</label>
            <div class="flex gap-3">
              <button
                @click="editForm.status = 'REVISADO'"
                :class="editForm.status === 'REVISADO' ? 'bg-[#1b2e4b] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                class="flex-1 py-2 rounded-xl text-sm font-bold transition-all">
                Revisado
              </button>
              <button
                @click="editForm.status = 'PENDIENTE'"
                :class="editForm.status === 'PENDIENTE' ? 'bg-[#E85D26] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                class="flex-1 py-2 rounded-xl text-sm font-bold transition-all">
                Pendiente
              </button>
            </div>
          </div>

          <!-- Resumen de fallos editable -->
          <div>
            <label class="block text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">Resumen de fallos</label>
            <textarea
              v-model="editForm.faultSummary"
              rows="3"
              placeholder="Ej: 1 Ítem Malo&#10;2 Regulares"
              class="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 resize-none outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>

          <!-- Error -->
          <p v-if="editError" class="text-sm text-red-600">{{ editError }}</p>
        </div>

        <!-- Footer -->
        <div class="px-6 pb-6 flex justify-end gap-3">
          <button @click="closeEditModal"
                  class="px-5 py-2 border border-slate-300 text-slate-600 text-sm rounded-xl font-semibold hover:bg-slate-50 transition-all">
            Cancelar
          </button>
          <button @click="saveEdit" :disabled="isSavingEdit"
                  class="px-6 py-2 bg-[#A61919] text-white text-sm rounded-xl font-bold hover:bg-red-800 transition-all disabled:opacity-50">
            {{ isSavingEdit ? 'Guardando…' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

</template>
