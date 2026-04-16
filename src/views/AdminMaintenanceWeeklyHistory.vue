<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import logoCompleto from '@/assets/images/Logo-completo.png'
import DashboardSidebar from '@/components/DashboardSidebar.vue'
import UserMenu from '@/components/UserMenu.vue'
import api from '@/services/axios'

const router = useRouter()

const filterPatente = ref('')
const filterMes = ref('')
const filterEstado = ref('')
const searchQuery = ref('')

const itemsPerPage = ref(100)
const currentPage = ref(1)

const minorIncidents = ref(0)
const topCategories = ref('Sin incidencias registradas')
const isLoading = ref(false)
const loadError = ref('')
const allRecords = ref([])

const normalizeValue = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const isRegularState = (value) => normalizeValue(value) === 'regular'
const isBadState = (value) => normalizeValue(value) === 'malo'
const isGoodState = (value) => {
  const normalized = normalizeValue(value)
  return normalized === 'bueno' || normalized === 'vigente' || normalized === 'aprobado'
}

const getDocumentStatusByExpiry = (expiryDate) => {
  if (!expiryDate) return 'No tiene'

  const date = new Date(expiryDate)
  if (Number.isNaN(date.getTime())) return 'No tiene'

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const expiry = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  return expiry >= today ? 'Vigente' : 'Vencido'
}

const formatDate = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '00-00-0000'

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

const formatMonthKey = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

const formatMonthLabel = (monthKey) => {
  if (!monthKey) return ''
  const [year, month] = monthKey.split('-').map(Number)
  const date = new Date(year, (month || 1) - 1, 1)
  const formatted = date.toLocaleDateString('es-CL', {
    month: 'long',
    year: 'numeric',
  })
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

const pluralize = (count, singular, plural) =>
  `${count} ${count === 1 ? singular : plural}`

const buildFaultSummary = (maintenanceItems = []) => {
  let badCount = 0
  let regularCount = 0

  maintenanceItems.forEach((item) => {
    if (isBadState(item?.status)) badCount += 1
    else if (isRegularState(item?.status)) regularCount += 1
  })

  const lines = []
  if (badCount > 0) lines.push(pluralize(badCount, 'Item Malo', 'Items Malos'))
  if (regularCount > 0) lines.push(pluralize(regularCount, 'Regular', 'Regulares'))

  return lines.join('\n') || 'Sin fallos'
}

const deriveStatus = (record) => {
  const hasProblematicChecklist = (record?.maintenanceItems || []).some(
    (item) => isBadState(item?.status) || isRegularState(item?.status),
  )

  const hasProblematicDocs = [
    getDocumentStatusByExpiry(record?.truck?.technicalReviewExpiresAt),
    getDocumentStatusByExpiry(record?.truck?.circulationPermitExpiresAt),
    getDocumentStatusByExpiry(record?.truck?.insuranceExpiresAt),
    getDocumentStatusByExpiry(record?.truck?.emissionsExpiresAt),
  ].some((status) => !isGoodState(status))

  return hasProblematicChecklist || hasProblematicDocs ? 'Pendiente' : 'Revisado'
}

const categoryLabelMap = {
  systemLights: 'Luces',
  systemBrakes: 'Frenos',
  systemTires: 'Neumáticos',
  systemEngine: 'Motor',
  systemAccessories: 'Accesorios',
}

const mapCategoryLabel = (category) =>
  categoryLabelMap[category] || category || 'Sin categoría'

const mapRecordFromApi = (record) => ({
  id: record.id,
  date: formatDate(record.inspectionDate),
  monthKey: formatMonthKey(record.inspectionDate),
  plate: record.truck?.plate || 'Sin patente',
  driver:
    record.driver?.name || record.driver?.email || `Conductor ${record.driverId}`,
  faultSummary: buildFaultSummary(record.maintenanceItems || []),
  status: deriveStatus(record),
  maintenanceItems: record.maintenanceItems || [],
  hasActions: true,
})

const filteredRecords = computed(() => {
  const normalizedSearch = normalizeValue(searchQuery.value)

  return allRecords.value.filter((record) => {
    const matchesPlate = !filterPatente.value || record.plate === filterPatente.value
    const matchesMonth = !filterMes.value || record.monthKey === filterMes.value
    const matchesStatus = !filterEstado.value || record.status === filterEstado.value
    const matchesSearch =
      !normalizedSearch ||
      normalizeValue(record.driver).includes(normalizedSearch) ||
      normalizeValue(record.plate).includes(normalizedSearch) ||
      normalizeValue(record.faultSummary).includes(normalizedSearch)

    return matchesPlate && matchesMonth && matchesStatus && matchesSearch
  })
})

const totalItems = computed(() => filteredRecords.value.length)

const records = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredRecords.value.slice(start, end)
})

const plateOptions = computed(() =>
  [...new Set(allRecords.value.map((record) => record.plate).filter(Boolean))].sort(),
)

const monthOptions = computed(() =>
  [...new Set(allRecords.value.map((record) => record.monthKey).filter(Boolean))]
    .sort((a, b) => b.localeCompare(a))
    .map((value) => ({ value, label: formatMonthLabel(value) })),
)

const statusOptions = ['Revisado', 'Pendiente']

const updateStats = () => {
  const problematicItems = []

  allRecords.value.forEach((record) => {
    ;(record.maintenanceItems || []).forEach((item) => {
      if (isBadState(item?.status) || isRegularState(item?.status)) {
        problematicItems.push(item)
      }
    })
  })

  minorIncidents.value = problematicItems.length

  if (problematicItems.length === 0) {
    topCategories.value = 'Sin incidencias registradas'
    return
  }

  const counts = new Map()
  problematicItems.forEach((item) => {
    const label = mapCategoryLabel(item?.category)
    counts.set(label, (counts.get(label) || 0) + 1)
  })

  topCategories.value = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([label, count]) => `${label} (${count})`)
    .join('\n')
}

const loadRecords = async () => {
  isLoading.value = true
  loadError.value = ''

  try {
    const { data } = await api.get('/vehicle-maintenance-records')
    allRecords.value = Array.isArray(data) ? data.map(mapRecordFromApi) : []
    updateStats()
  } catch (error) {
    const backendMessage = error.response?.data?.message
    if (error.response?.status === 401) {
      loadError.value = 'Tu sesión no está autorizada en este momento. Cierra sesión y vuelve a ingresar para cargar el historial semanal.'
    } else if (error.response?.status === 403) {
      loadError.value = 'No tienes permisos para ver este historial.'
    } else {
      loadError.value = Array.isArray(backendMessage)
        ? backendMessage.join(', ')
        : backendMessage || 'No se pudo cargar el historial semanal.'
    }
    allRecords.value = []
    updateStats()
  } finally {
    isLoading.value = false
  }
}

const editRecord = (record) => {
  router.push({
    name: 'daily-registration-maintenance',
    query: {
      recordId: String(record.id),
      plate: record.plate,
      source: 'admin-maintenance-weekly-history',
    },
  })
}

const viewRecord = (record) => {
  router.push({
    name: 'daily-registration-maintenance',
    query: {
      recordId: String(record.id),
      plate: record.plate,
      source: 'admin-maintenance-weekly-history',
      mode: 'view',
    },
  })
}

watch([filterPatente, filterMes, filterEstado, searchQuery], () => {
  currentPage.value = 1
})

onMounted(() => {
  loadRecords()
})
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col">
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

      <main class="flex-1 pt-12 pb-10 px-6 overflow-hidden flex items-start justify-center min-w-0">
        <div class="bg-white rounded-3xl border-2 border-slate-300 shadow-sm flex-1 flex flex-col overflow-hidden w-full max-w-7xl">
          <div class="px-10 pt-10 pb-6 flex flex-col md:flex-row items-start justify-between gap-6">
            <h1 class="text-3xl font-titles font-extrabold text-slate-900 leading-tight">
              Historial de mantenimiento<br />vehicular semanal
            </h1>

            <div class="rounded-[1.25rem] border border-[#FDBA74] px-6 py-4 flex flex-col gap-2 min-w-[280px]"
                 style="background-color:#FFF7ED; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
              <div class="flex items-start justify-between gap-2">
                <span class="text-sm font-titles font-bold text-slate-800 leading-tight">Incidencias<br />menores:</span>
                <span class="text-4xl font-titles font-extrabold text-slate-900 leading-none shrink-0">
                  {{ minorIncidents }}
                </span>
              </div>
              <div class="flex items-start gap-2 mt-2">
                <div class="shrink-0 pt-0.5">
                  <svg class="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                  </svg>
                </div>
                <p class="text-[11px] text-slate-700 leading-snug whitespace-pre-line">
                  Top categorías afectadas:<br />
                  <span class="font-medium text-slate-800">{{ topCategories }}</span>
                </p>
              </div>
            </div>
          </div>

          <div class="px-10 pb-6 flex flex-col lg:flex-row items-end gap-6 justify-between">
            <div class="flex items-end gap-3 flex-wrap">
              <div class="mb-2 text-sm text-slate-500 font-semibold mr-1">Filtrar por:</div>
              <div>
                <label class="text-[11px] text-slate-400 font-semibold mb-1 block uppercase tracking-wider pl-1">Patente</label>
                <div class="relative">
                  <select v-model="filterPatente" class="appearance-none bg-white border border-slate-300 rounded-[0.5rem] px-4 py-2 pr-8 text-sm focus:outline-none focus:border-primary shadow-sm w-[150px] text-slate-600 font-medium">
                    <option value="">Todas</option>
                    <option v-for="plate in plateOptions" :key="plate" :value="plate">{{ plate }}</option>
                  </select>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>
              <div>
                <label class="text-[11px] text-slate-400 font-semibold mb-1 block uppercase tracking-wider pl-1">Mes</label>
                <div class="relative">
                  <select v-model="filterMes" class="appearance-none bg-white border border-slate-300 rounded-[0.5rem] px-4 py-2 pr-8 text-sm focus:outline-none focus:border-primary shadow-sm w-[150px] text-slate-600 font-medium">
                    <option value="">Todos</option>
                    <option v-for="month in monthOptions" :key="month.value" :value="month.value">{{ month.label }}</option>
                  </select>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>
              <div>
                <label class="text-[11px] text-slate-400 font-semibold mb-1 block uppercase tracking-wider pl-1">Estado</label>
                <div class="relative">
                  <select v-model="filterEstado" class="appearance-none bg-white border border-slate-300 rounded-[0.5rem] px-4 py-2 pr-8 text-sm focus:outline-none focus:border-primary shadow-sm w-[150px] text-slate-600 font-medium">
                    <option value="">Todos</option>
                    <option v-for="status in statusOptions" :key="status" :value="status">{{ status }}</option>
                  </select>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>
              <div class="relative w-[220px]">
                <input v-model="searchQuery" type="text" placeholder="Buscar" class="w-full bg-white border border-slate-300 rounded-[0.5rem] px-4 py-2 pl-4 pr-10 text-sm focus:outline-none focus:border-primary shadow-sm text-slate-600 placeholder:text-slate-400 font-medium" />
                <svg class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <button @click="router.push('/admin/mantencion-vehicular/semanal')" class="bg-[#1b2e4b] text-white px-5 py-2.5 rounded-lg font-bold text-xs tracking-wider shadow-md hover:bg-opacity-90 transition-all flex items-center gap-2 uppercase">
              <span>+</span> NUEVO CHECK LIST
            </button>
          </div>

          <div class="flex-1 min-h-0 overflow-x-auto overflow-y-auto px-10 pt-4">
            <p v-if="loadError" class="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {{ loadError }}
            </p>
            <table class="w-full text-sm border-collapse">
              <thead class="bg-white">
                <tr>
                  <th class="py-3 px-5 text-center font-bold text-slate-700 border border-gray-300 w-[12%]">Fecha</th>
                  <th class="py-3 px-5 text-center font-bold text-slate-700 border border-gray-300 w-[15%]">Patente</th>
                  <th class="py-3 px-5 text-center font-bold text-slate-700 border border-gray-300 w-[20%]">Conductor</th>
                  <th class="py-3 px-5 text-center font-bold text-slate-700 border border-gray-300 w-[20%]">Resumen de fallos</th>
                  <th class="py-3 px-5 text-center font-bold text-slate-700 border border-gray-300 w-[15%]">Estado</th>
                  <th class="py-3 px-5 text-center font-bold text-slate-700 border border-gray-300 w-[18%]">Registro</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="isLoading">
                  <td colspan="6" class="py-8 text-center text-slate-400 text-sm border border-gray-300">
                    Cargando registros...
                  </td>
                </tr>
                <tr v-else-if="records.length === 0">
                  <td colspan="6" class="py-8 text-center text-slate-400 text-sm border border-gray-300">
                    No hay registros disponibles.
                  </td>
                </tr>
                <tr v-else v-for="record in records" :key="record.id" class="hover:bg-slate-50 transition-colors">
                  <td class="py-5 px-5 text-center text-slate-600 font-medium text-xs border border-gray-300">{{ record.date }}</td>
                  <td class="py-5 px-5 text-center text-slate-600 font-medium text-xs border border-gray-300">{{ record.plate }}</td>
                  <td class="py-5 px-5 text-center text-slate-600 font-medium text-xs border border-gray-300">{{ record.driver }}</td>
                  <td class="py-5 px-5 text-center text-slate-600 font-medium text-xs border border-gray-300 whitespace-pre-line">{{ record.faultSummary }}</td>
                  <td class="py-5 px-5 text-center border border-gray-300">
                    <span v-if="record.status === 'Revisado'" class="inline-block px-5 py-1 rounded-full text-[11px] font-bold bg-[#1b2e4b] text-white tracking-wide">Revisado</span>
                    <span v-else-if="record.status === 'Pendiente'" class="inline-block px-5 py-1 rounded-full text-[11px] font-bold bg-[#D95F31] text-white tracking-wide">Pendiente</span>
                  </td>
                  <td class="py-5 px-5 text-center border border-gray-300">
                    <div v-if="record.hasActions" class="flex items-center justify-center gap-2">
                      <button @click="viewRecord(record)" class="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600 hover:text-primary transition-colors bg-slate-100 rounded-full px-4 py-1.5 border border-slate-200 shadow-sm">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                          <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                        Ver
                      </button>
                      <button @click="editRecord(record)" class="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600 hover:text-primary transition-colors bg-slate-100 rounded-full px-4 py-1.5 border border-slate-200 shadow-sm">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
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

          <div class="px-10 py-5 bg-white flex justify-between items-center text-xs font-semibold text-slate-500 mt-auto rounded-b-3xl">
            <div class="flex items-center gap-3">
              <span>Filas por páginas</span>
              <div class="relative">
                <select v-model.number="itemsPerPage"
                        class="appearance-none border border-slate-300 rounded px-2 py-1 pr-6 bg-white outline-none focus:border-primary cursor-pointer text-slate-700">
                  <option :value="100">100</option>
                </select>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
            <div class="flex items-center gap-6">
              <span>1-{{ itemsPerPage > totalItems ? totalItems : itemsPerPage }} de {{ totalItems }}</span>
              <div class="flex items-center gap-2">
                <button disabled class="hover:bg-slate-100 rounded p-0.5 text-slate-600 disabled:opacity-40 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <button disabled class="hover:bg-slate-100 rounded p-0.5 text-slate-600 disabled:opacity-40 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
main::-webkit-scrollbar { width: 6px; }
main::-webkit-scrollbar-track { background: transparent; }
main::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
</style>
