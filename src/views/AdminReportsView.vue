<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import logoCompleto from '@/assets/images/Logo-completo.png'
import DashboardSidebar from '@/components/DashboardSidebar.vue'
import UserMenu from '@/components/UserMenu.vue'
import api from '@/services/axios'

const router = useRouter()

// ─── State ───────────────────────────────────────────────────────────────────
const reports      = ref([])
const isLoading    = ref(false)
const loadError    = ref('')

const searchQuery  = ref('')
const statusFilter = ref('ALL')

const selectedReport = ref(null)
const isDetailOpen   = ref(false)

const updatingId  = ref(null)
const updateError = ref('')

// Pagination
const itemsPerPage = ref(10)
const currentPage  = ref(1)

// ─── Navigation ──────────────────────────────────────────────────────────────
const goBack = () => {
  if (window.history.length > 1) { router.back(); return }
  router.push('/dashboard-admin')
}

// ─── Fetch ───────────────────────────────────────────────────────────────────
const loadReports = async () => {
  isLoading.value  = true
  loadError.value  = ''
  try {
    const { data } = await api.get('/reports')
    reports.value = Array.isArray(data) ? data : []
  } catch (err) {
    const msg = err?.response?.data?.message
    loadError.value = Array.isArray(msg) ? msg.join(', ') : msg || 'No se pudieron cargar los reportes.'
  } finally {
    isLoading.value = false
  }
}
onMounted(loadReports)

// ─── Status meta ─────────────────────────────────────────────────────────────
const STATUS_META = {
  OPEN:      { label: 'Nuevo',       dot: 'dot-new',      badge: 'badge-new'      },
  IN_REVIEW: { label: 'En progreso', dot: 'dot-progress', badge: 'badge-progress' },
  RESOLVED:  { label: 'Resuelto',    dot: 'dot-resolved', badge: 'badge-resolved' },
}
const getStatusMeta = (s) => STATUS_META[s] || { label: s, dot: 'dot-new', badge: 'badge-new' }

const STATUS_TRANSITIONS = {
  OPEN:      { next: 'IN_REVIEW', label: 'Marcar en revisión' },
  IN_REVIEW: { next: 'RESOLVED',  label: 'Marcar como resuelto' },
  RESOLVED:  null,
}

// ─── Filtering ───────────────────────────────────────────────────────────────
const normalize = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const filteredReports = computed(() => {
  let r = reports.value
  if (statusFilter.value !== 'ALL') r = r.filter(x => x.status === statusFilter.value)
  if (searchQuery.value.trim()) {
    const n = normalize(searchQuery.value)
    r = r.filter(x =>
      normalize(x.title).includes(n) ||
      normalize(x.description).includes(n) ||
      normalize(x.reporter?.name).includes(n) ||
      normalize(x.reporter?.email).includes(n)
    )
  }
  return r
})

// ─── Pagination ───────────────────────────────────────────────────────────────
const totalItems  = computed(() => filteredReports.value.length)
const totalPages  = computed(() => Math.max(Math.ceil(totalItems.value / itemsPerPage.value), 1))

const pagedReports = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredReports.value.slice(start, start + itemsPerPage.value)
})

const firstRow = computed(() => totalItems.value === 0 ? 0 : (currentPage.value - 1) * itemsPerPage.value + 1)
const lastRow  = computed(() => Math.min(currentPage.value * itemsPerPage.value, totalItems.value))

const prevPage = () => { if (currentPage.value > 1) currentPage.value-- }
const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++ }

// Watch filters → reset page
const resetPage = () => { currentPage.value = 1 }

// ─── Navigation to Detail ─────────────────────────────────────────────────────
const openDetail = (report) => {
  router.push(`/admin/reportes/${report.id}`)
}

// ─── Update status ────────────────────────────────────────────────────────────
const updateStatus = async (report, newStatus) => {
  updatingId.value  = report.id
  updateError.value = ''
  try {
    const { data } = await api.patch(`/reports/${report.id}/status`, { status: newStatus })
    const idx = reports.value.findIndex(r => r.id === report.id)
    if (idx !== -1) reports.value[idx] = { ...reports.value[idx], status: data.status }
    if (selectedReport.value?.id === report.id)
      selectedReport.value = { ...selectedReport.value, status: data.status }
  } catch (err) {
    const msg = err?.response?.data?.message
    updateError.value = Array.isArray(msg) ? msg.join(', ') : msg || 'No se pudo actualizar el estado.'
  } finally {
    updatingId.value = null
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatId   = (id) => `#${String(id).padStart(4, '0')}`
const formatDate = (iso) => {
  if (!iso) return '-'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
const truncate = (str, n = 38) => str?.length > n ? str.slice(0, n) + '…' : (str || '-')
</script>

<template>
  <div class="h-screen bg-background flex flex-col overflow-hidden">

    <!-- ── Header ─────────────────────────────────────────────────────────── -->
    <div class="bg-white shadow-sm border-b border-gray-200">
      <div class="px-4 py-4 flex items-center justify-between">
        <router-link to="/" class="flex items-center">
          <img :src="logoCompleto" alt="Transportes Flores Vargas" class="h-16 w-auto object-contain hover:opacity-80 transition-opacity" />
        </router-link>
        <UserMenu />
      </div>
    </div>

    <div class="flex flex-1 min-h-0 overflow-hidden">
      <DashboardSidebar />

      <!-- ── Main content ────────────────────────────────────────────────── -->
      <main class="flex-1 py-6 px-4 md:px-8 overflow-y-auto flex items-start justify-center">
        <div class="w-full max-w-5xl">
          <div class="mb-4 pl-10 sm:pl-12">
            <button @click="goBack" class="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary transition-colors">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Volver
            </button>
          </div>

          <!-- Card container -->
          <div class="bg-white rounded-3xl border-2 border-slate-200 shadow-sm flex flex-col overflow-hidden">

            <!-- Card header -->
            <div class="px-4 sm:px-6 lg:px-8 pt-5 lg:pt-7 pb-5">
              <h1 class="text-2xl font-titles font-bold text-text-title mb-5">Lista de reportes</h1>

              <!-- Search + filter row -->
              <div class="flex flex-col sm:flex-row gap-3">
                <!-- Search -->
                <div class="relative flex-1">
                  <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input
                    v-model="searchQuery"
                    @input="resetPage"
                    type="text"
                    placeholder="Buscar"
                    class="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white transition-colors font-body text-gray-700 placeholder:text-gray-400"
                  />
                </div>

                <!-- Status dropdown -->
                <div class="relative">
                  <select
                    v-model="statusFilter"
                    @change="resetPage"
                    class="appearance-none w-full border border-gray-300 rounded-lg pl-3 pr-9 py-2 text-sm bg-white outline-none focus:border-primary focus:ring-1 focus:ring-primary text-gray-700 cursor-pointer min-w-[140px] font-body"
                  >
                    <option value="ALL">Estado</option>
                    <option value="OPEN">Nuevo</option>
                    <option value="IN_REVIEW">En progreso</option>
                    <option value="RESOLVED">Resuelto</option>
                  </select>
                  <svg class="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>
            </div>

            <!-- ── Table ─────────────────────────────────────────────────── -->
            <div class="flex-1 px-4 sm:px-6 lg:px-8 pb-4 overflow-x-auto">

              <!-- Loading -->
              <div v-if="isLoading" class="flex items-center justify-center py-20 gap-3">
                <svg class="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <span class="text-sm text-gray-500">Cargando reportes…</span>
              </div>

              <!-- Error -->
              <div v-else-if="loadError" class="flex flex-col items-center justify-center py-14 gap-3">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#B71C1C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p class="text-sm text-red-700 font-medium">{{ loadError }}</p>
                <button @click="loadReports" class="text-xs text-primary underline">Reintentar</button>
              </div>

              <!-- Table -->
              <table v-else class="w-full text-sm border-collapse">
                <thead>
                  <tr class="border border-gray-200 bg-gray-50 rounded-lg">
                    <th class="text-left px-4 py-3 font-titles font-bold text-gray-700 text-sm w-20 rounded-tl-lg rounded-bl-lg">ID</th>
                    <th class="text-left px-4 py-3 font-titles font-bold text-gray-700 text-sm">Usuario</th>
                    <th class="text-left px-4 py-3 font-titles font-bold text-gray-700 text-sm">Título</th>
                    <th class="text-left px-4 py-3 font-titles font-bold text-gray-700 text-sm w-32">Estado</th>
                    <th class="text-left px-4 py-3 font-titles font-bold text-gray-700 text-sm w-28">Fecha</th>
                    <th class="text-left px-4 py-3 font-titles font-bold text-gray-700 text-sm w-28 rounded-tr-lg rounded-br-lg">Detalles</th>
                  </tr>
                </thead>
                <tbody>
                  <!-- Empty state -->
                  <tr v-if="pagedReports.length === 0">
                    <td colspan="6" class="text-center py-16 text-gray-400 text-sm">
                      No hay reportes que coincidan.
                    </td>
                  </tr>

                  <!-- Rows -->
                  <tr
                    v-for="report in pagedReports"
                    :key="report.id"
                    class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td class="px-4 py-3.5 text-gray-600 font-medium font-body text-sm">
                      {{ formatId(report.id) }}
                    </td>
                    <td class="px-4 py-3.5 text-gray-700 font-body text-sm">
                      {{ report.reporter?.email || report.reporter?.name || 'Desconocido' }}
                    </td>
                    <td class="px-4 py-3.5 text-gray-700 font-body text-sm">
                      {{ truncate(report.title) }}
                    </td>
                    <td class="px-4 py-3.5">
                      <span class="inline-flex items-center gap-1.5 text-sm font-body font-medium">
                        <span :class="['status-dot', getStatusMeta(report.status).dot]"></span>
                        {{ getStatusMeta(report.status).label }}
                      </span>
                    </td>
                    <td class="px-4 py-3.5 text-gray-600 font-body text-sm">
                      {{ formatDate(report.createdAt) }}
                    </td>
                    <td class="px-4 py-3.5">
                      <button
                        @click="openDetail(report)"
                        class="details-btn"
                      >
                        Ver detalles
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- ── Pagination footer ─────────────────────────────────────── -->
            <div class="px-4 sm:px-6 lg:px-8 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium">
              <!-- Rows per page -->
              <div class="flex items-center gap-2">
                <span>Filas por páginas</span>
                <div class="relative">
                  <select
                    v-model.number="itemsPerPage"
                    @change="resetPage"
                    class="appearance-none border border-gray-300 rounded-md px-2.5 py-1 pr-7 bg-white outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer text-xs"
                  >
                    <option :value="10">10</option>
                    <option :value="25">25</option>
                    <option :value="50">50</option>
                    <option :value="100">100</option>
                  </select>
                  <svg class="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>

              <!-- Page info + arrows -->
              <div class="flex items-center gap-4">
                <span>{{ firstRow }}-{{ lastRow }} de {{ totalItems }}</span>
                <div class="flex items-center gap-1">
                  <button
                    @click="prevPage"
                    :disabled="currentPage <= 1"
                    class="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <button
                    @click="nextPage"
                    :disabled="currentPage >= totalPages"
                    class="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                </div>
              </div>
            </div>

          </div><!-- /card -->
        </div>
      </main>
    </div>



  </div>
</template>

<style scoped>
/* ── Status dot inline (table) ───────────────────────────────────────────── */
.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  flex-shrink: 0;
}
.dot-new      { background-color: #3B82F6; }
.dot-progress { background-color: #F59E0B; }
.dot-resolved { background-color: #10B981; }

/* ── Details button ──────────────────────────────────────────────────────── */
.details-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: #1B2A4A;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  padding: 6px 14px;
  border-radius: 8px;
  transition: background-color 0.15s;
  white-space: nowrap;
  font-family: var(--font-body, sans-serif);
}
.details-btn:hover { background-color: #253860; }

/* ── Status badge (detail panel) ─────────────────────────────────────────── */
.status-badge-full {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 9999px;
}
.dot-new.status-badge-full      { background: #EFF6FF; color: #1D4ED8; }
.dot-progress.status-badge-full { background: #FFFBEB; color: #B45309; }
.dot-resolved.status-badge-full { background: #ECFDF5; color: #065F46; }

/* fill dot inside badge */
.dot-new-fill      { background-color: #3B82F6; }
.dot-progress-fill { background-color: #F59E0B; }
.dot-resolved-fill { background-color: #10B981; }

/* ── Report icon (panel) ─────────────────────────────────────────────────── */
.report-icon {
  width: 36px; height: 36px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.report-icon--OPEN      { background: #EFF6FF; color: #3B82F6; }
.report-icon--IN_REVIEW { background: #FFFBEB; color: #F59E0B; }
.report-icon--RESOLVED  { background: #ECFDF5; color: #10B981; }

/* ── Section label ───────────────────────────────────────────────────────── */
.section-label {
  font-size: 11px;
  font-weight: 700;
  color: #9CA3AF;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
</style>
