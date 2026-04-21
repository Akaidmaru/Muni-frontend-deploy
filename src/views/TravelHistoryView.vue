<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import logoCompleto from '@/assets/images/Logo-completo.png'
import DashboardSidebar from '@/components/DashboardSidebar.vue'
import UserMenu from '@/components/UserMenu.vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/axios'

const auth = useAuthStore()

const travels = ref([])
const isLoadingTravels = ref(false)
const travelsError = ref('')
const totalItems = ref(0)
const totalPages = ref(1)

// Filter state
const isFilterOpen = ref(false)

// Pagination state
const itemsPerPage = ref(100)
const currentPage = ref(1)

// Form state for filters
const filters = ref({
  from: '',
  to: '',
  searchBy: 'destination',
  searchValue: '',
  license: ''
})

// Applied state (when user clicks Apply)
const appliedFilters = ref({ ...filters.value })

const formatDate = (value) => {
  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) return ''

  const day = String(parsedDate.getDate()).padStart(2, '0')
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
  const year = parsedDate.getFullYear()

  return `${day}/${month}/${year}`
}

const formatDateIso = (value) => {
  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) return ''

  const year = parsedDate.getFullYear()
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
  const day = String(parsedDate.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const loadTravels = async () => {
  isLoadingTravels.value = true
  travelsError.value = ''

  try {
    const { data } = await api.get('/trip-history', {
      params: {
        page: currentPage.value,
        pageSize: Number(itemsPerPage.value),
        from: appliedFilters.value.from || undefined,
        to: appliedFilters.value.to || undefined,
        license: appliedFilters.value.license || undefined,
      },
    })

    const payloadItems = Array.isArray(data?.items) ? data.items : []

    travels.value = payloadItems.map((travel) => ({
          id: travel.id,
          rawDate: travel.date,
          date: formatDate(travel.date),
          dateIso: formatDateIso(travel.date),
          licensePlate: travel.truck?.plate || '-',
          startTime: travel.startTime || '--:--',
          endTime: travel.endTime || '--:--',
          destination: travel.destination?.name || 'Sin destino',
          startKm: travel.startKm != null ? Math.floor(Number(travel.startKm)) : null,
          endKm: travel.endKm != null ? Math.floor(Number(travel.endKm)) : null,
          official: travel.employee?.name || travel.employee?.email || 'Sin funcionario',
          signature: Boolean(travel.signatureKey),
          signatureUrl: travel.signatureUrl || null,
        }))

    totalItems.value = Number(data?.total) || 0
    totalPages.value = Math.max(Number(data?.totalPages) || 1, 1)
    currentPage.value = Number(data?.page) || 1
  } catch (error) {
    const backendMessage = error.response?.data?.message
    travelsError.value = Array.isArray(backendMessage)
      ? backendMessage.join(', ')
      : backendMessage || 'No se pudo cargar el historial de viajes.'
    travels.value = []
    totalItems.value = 0
    totalPages.value = 1
  } finally {
    isLoadingTravels.value = false
  }
}

// Patentes únicas (derivadas dinámicamente del historial)
const uniquePlates = computed(() => {
  const plates = new Set(travels.value.map((travel) => travel.licensePlate))
  return [...plates]
})

const normalize = (str) =>
  (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const filteredTravels = computed(() => {
  const { from, to, searchBy, searchValue, license } = appliedFilters.value
  const needle = normalize(searchValue)

  return travels.value.filter((travel) => {
    const haystack = searchBy === 'official' ? travel.official : travel.destination
    const matchesSearch = !needle || normalize(haystack).includes(needle)
    const matchesLicense = !license || travel.licensePlate === license
    const matchesFrom = !from || travel.dateIso >= from
    const matchesTo = !to || travel.dateIso <= to

    return matchesSearch && matchesLicense && matchesFrom && matchesTo
  })
})

const firstVisibleRow = computed(() => {
  if (totalItems.value === 0) return 0
  return (currentPage.value - 1) * Number(itemsPerPage.value) + 1
})

const lastVisibleRow = computed(() => {
  if (totalItems.value === 0) return 0
  return Math.min(currentPage.value * Number(itemsPerPage.value), totalItems.value)
})

const goToPreviousPage = () => {
  if (currentPage.value <= 1 || isLoadingTravels.value) return
  currentPage.value -= 1
}

const goToNextPage = () => {
  if (currentPage.value >= totalPages.value || isLoadingTravels.value) return
  currentPage.value += 1
}

const applyFilters = () => {
  appliedFilters.value = { ...filters.value }
  currentPage.value = 1
  loadTravels()
}

const clearFilters = () => {
  filters.value = { from: '', to: '', searchBy: filters.value.searchBy, searchValue: '', license: '' }
  appliedFilters.value = { ...filters.value }
  currentPage.value = 1
  loadTravels()
}

const activeFilterChips = computed(() => {
  const chips = []
  if (filters.value.from) chips.push({ label: 'Desde', value: filters.value.from, field: 'from' })
  if (filters.value.to) chips.push({ label: 'Hasta', value: filters.value.to, field: 'to' })
  if (filters.value.searchValue) {
    const label = filters.value.searchBy === 'destination' ? 'Destino' : 'Funcionario'
    chips.push({ label, value: filters.value.searchValue, field: 'searchValue' })
  }
  if (filters.value.license) chips.push({ label: 'Patente', value: filters.value.license, field: 'license' })
  return chips
})

const removeFilter = (field) => {
  if (field === 'from') filters.value.from = ''
  else if (field === 'to') filters.value.to = ''
  else if (field === 'searchValue') filters.value.searchValue = ''
  else if (field === 'license') filters.value.license = ''
  applyFilters()
}

onMounted(() => {
  loadTravels()
})

watch(itemsPerPage, () => {
  currentPage.value = 1
  loadTravels()
})

watch(currentPage, () => {
  loadTravels()
})
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b border-gray-200">
      <div class="px-4 py-4 flex items-center justify-between">
        <router-link to="/" class="flex items-center">
          <img :src="logoCompleto" alt="Transportes Flores Vargas" class="h-16 w-auto object-contain hover:opacity-80 transition-opacity" />
        </router-link>

        <!-- User Menu -->
        <UserMenu />
      </div>
    </div>

    <!-- Body: sidebar + content -->
    <div class="flex flex-1 overflow-hidden">
      <DashboardSidebar />

      <!-- Main content -->
      <main class="flex-1 pt-8 sm:pt-16 pb-10 px-3 overflow-hidden flex items-start justify-center min-w-0">
        <div class="flex gap-6 w-full h-full min-h-0 min-w-0">

          <!-- Main Card (Table) -->
          <div :class="[
            'bg-white rounded-3xl border-2 border-slate-300 shadow-sm flex-1 flex flex-col overflow-hidden transition-all duration-300 relative min-w-0',
            isFilterOpen ? 'sm:max-w-[calc(100%-24rem)]' : 'w-full'
          ]">
            <!-- Top section: Title and Filter Button -->
            <div class="flex items-center justify-between p-4 sm:p-8 pb-4 sm:pb-6 relative min-h-[4rem] sm:min-h-[5rem]">
               <!-- Botón Volver -->


               <h1 class="text-xl sm:text-2xl md:text-3xl font-titles font-bold text-text-title text-center m-0 absolute left-1/2 -translate-x-1/2">Historial de viajes</h1>
               
               <button
                       @click="isFilterOpen = !isFilterOpen"
                       class="absolute right-6 top-6 p-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors outline-none focus:ring-2 focus:ring-primary z-10 border border-gray-300"
                       :title="isFilterOpen ? 'Cerrar filtros' : 'Abrir filtros'">
                 <!-- Icon as requested in design -->
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                   <line x1="8" y1="5" x2="8" y2="19"></line>
                   <line x1="16" y1="5" x2="16" y2="19"></line>
                   <line x1="5" y1="10" x2="11" y2="10"></line>
                   <line x1="13" y1="14" x2="19" y2="14"></line>
                 </svg>
               </button>
            </div>

            <!-- Table Container -->
            <div class="flex-1 overflow-auto px-3 sm:px-8 md:px-12 lg:px-16 relative mt-4 sm:mt-6 pb-6 min-w-0">
              <div class="min-w-[900px]">
                <table class="history-table w-full text-sm text-center" style="border-collapse: separate; border-spacing: 0;">
                  <thead class="text-[13px] text-text-title font-bold sticky top-0 bg-white z-10">
                    <tr>
                      <th rowspan="2" class="align-middle" style="border: 1px solid #555; padding: 10px 12px;">Fecha</th>
                      <th rowspan="2" class="align-middle" style="border: 1px solid #555; padding: 10px 12px;">Patente</th>
                      <th colspan="2" style="border: 1px solid #555; border-bottom: none; padding: 10px 12px;">Hora</th>
                      <th rowspan="2" class="align-middle" style="border: 1px solid #555; padding: 10px 12px;">Destino</th>
                      <th colspan="2" style="border: 1px solid #555; border-bottom: none; padding: 10px 12px;">Kilometraje</th>
                      <th rowspan="2" class="align-middle" style="border: 1px solid #555; padding: 10px 12px;">Funcionario</th>
                      <th rowspan="2" class="align-middle" style="border: 1px solid #555; padding: 10px 12px;">Firma Funcionario</th>
                    </tr>
                    <tr>
                      <th class="text-xs font-semibold" style="border: 1px solid #555; border-top: 1px solid #999; padding: 8px 12px;">Inicio</th>
                      <th class="text-xs font-semibold" style="border: 1px solid #555; border-top: 1px solid #999; padding: 8px 12px;">Final</th>
                      <th class="text-xs font-semibold" style="border: 1px solid #555; border-top: 1px solid #999; padding: 8px 12px;">Inicio</th>
                      <th class="text-xs font-semibold" style="border: 1px solid #555; border-top: 1px solid #999; padding: 8px 12px;">Final</th>
                    </tr>
                  </thead>
                  <tbody class="text-center font-body">
                    <tr v-if="isLoadingTravels">
                      <td colspan="9" class="px-3 py-20 text-center text-text-secondary font-medium">
                        Cargando viajes...
                      </td>
                    </tr>

                    <tr v-else-if="travelsError">
                      <td colspan="9" class="px-3 py-20 text-center text-red-600 font-medium">
                        {{ travelsError }}
                      </td>
                    </tr>

                    <!-- Actual Data Rows -->
                    <tr v-else v-for="travel in filteredTravels" :key="travel.id" class="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td class="px-2 py-5 text-gray-500 text-sm">{{ travel.date }}</td>
                      <td class="px-2 py-5 font-semibold text-text-title">{{ travel.licensePlate }}</td>
                      <td class="px-2 py-5 text-gray-500">{{ travel.startTime }}</td>
                      <td class="px-2 py-5 text-gray-500">{{ travel.endTime }}</td>
                      <td class="px-2 py-5 text-gray-700">{{ travel.destination }}</td>
                      <td class="px-2 py-5 font-medium">{{ travel.startKm != null ? Math.floor(travel.startKm) : '-' }}</td>
                      <td class="px-2 py-5 font-medium">{{ travel.endKm != null ? Math.floor(travel.endKm) : '-' }}</td>
                      <td class="px-4 py-5 text-gray-700">{{ travel.official }}</td>
                      <td class="px-4 py-5">
                         <div v-if="travel.signatureUrl" class="w-full flex justify-center">
                           <img
                             :src="travel.signatureUrl"
                             alt="Firma funcionario"
                             class="h-10 w-auto object-contain bg-white rounded border border-gray-200"
                           />
                         </div>
                         <div v-else-if="travel.signature" class="w-full flex justify-center">
                           <div class="h-1 w-12 bg-primary rounded-full opacity-60 rotate-[-10deg]"></div>
                         </div>
                         <span v-else class="text-gray-400">-</span>
                      </td>
                    </tr>
                    
                    <!-- Empty State -->
                    <tr v-if="!isLoadingTravels && !travelsError && filteredTravels.length === 0">
                      <td colspan="9" class="px-3 py-20 text-center text-text-secondary font-medium">
                        No hay viajes que coincidan con la búsqueda.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Footer Pagination -->
            <div class="px-3 sm:px-8 md:px-12 lg:px-16 py-4 bg-white flex flex-wrap justify-between items-center gap-2 text-xs font-medium text-gray-500 border-t border-gray-200 mt-auto rounded-b-3xl">
              <div class="flex items-center gap-2">
                <span>Filas por páginas</span>
                <div class="relative">
                  <select v-model.number="itemsPerPage" class="appearance-none border border-gray-300 rounded-md px-3 py-1.5 pr-8 bg-white outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer">
                    <option :value="10">10</option>
                    <option :value="50">50</option>
                    <option :value="100">100</option>
                  </select>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>

              <div class="font-semibold content-center pl-10">
                {{ firstVisibleRow }}-{{ lastVisibleRow }} de {{ totalItems }}
              </div>

              <div class="flex items-center gap-1">
                <button
                  @click="goToPreviousPage"
                  :disabled="currentPage <= 1 || isLoadingTravels"
                  class="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 disabled:opacity-40 transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <button
                  @click="goToNextPage"
                  :disabled="currentPage >= totalPages || isLoadingTravels"
                  class="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 disabled:opacity-40 transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              </div>
            </div>
            

          </div>

          <!-- Backdrop móvil -->
          <div v-if="isFilterOpen" class="fixed inset-0 bg-black/30 z-40 sm:hidden" @click="isFilterOpen = false" />

          <!-- Filter Panel -->
          <Transition name="slide">
            <div v-show="isFilterOpen" class="fixed inset-x-0 bottom-0 top-[88px] z-50 sm:relative sm:z-20 sm:w-[22rem] sm:h-full bg-[#EBEBEB] sm:rounded-[2rem] rounded-t-[2rem] border border-gray-300 shadow-sm flex flex-col p-6 sm:shrink-0 overflow-y-auto">
              
              <!-- Filter icon top right inside panel (serves as close button also) -->
              <button @click="isFilterOpen = false" class="absolute right-6 top-6 text-gray-700 hover:text-gray-900 focus:outline-none bg-transparent sm:hidden">
                <!-- Icon as requested in design -->
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                   <line x1="8" y1="5" x2="8" y2="19"></line>
                   <line x1="16" y1="5" x2="16" y2="19"></line>
                   <line x1="5" y1="10" x2="11" y2="10"></line>
                   <line x1="13" y1="14" x2="19" y2="14"></line>
                 </svg>
              </button>

               <div class="flex flex-col gap-4 mb-6 mt-2 relative">
                 <div class="flex justify-center items-center">
                   <h2 class="text-2xl font-titles font-extrabold text-[#1b2533]">Filtros</h2>
                 </div>

                 <!-- Chips de Filtros Activos -->
                 <div v-if="activeFilterChips.length > 0" class="flex flex-wrap items-center gap-2 bg-gray-100/50 p-3 rounded-[1.5rem] border border-gray-200">
                   <div v-for="chip in activeFilterChips" :key="chip.field" class="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full text-[10px] font-bold text-gray-600 shadow-sm border border-gray-100">
                      <span class="text-gray-400 font-medium">{{ chip.label }}:</span> {{ chip.value }}
                      <button @click="removeFilter(chip.field)" class="ml-1 hover:text-red-500 transition-colors">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                    <button @click="clearFilters" class="ml-auto text-[#A61919] hover:text-red-800 font-bold text-[11px] px-3 py-1.5 bg-white border border-gray-200 rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1.5">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      Limpiar Todo
                    </button>
                 </div>
               </div>

              <!-- Filter Form -->
              <div class="flex flex-col gap-5 flex-1 mt-2">
                <div class="grid grid-cols-2 gap-4">
                  <div class="flex flex-col relative">
                    <label class="text-[10px] text-gray-500 font-bold ml-3 mb-0.5 z-10 bg-[#EBEBEB] w-fit px-1 absolute -top-2 left-2">Desde</label>
                    <div class="relative">
                      <input type="date" v-model="filters.from" class="text-[11px] px-3 py-[9px] w-full rounded-xl border border-[#b2b2b2] bg-transparent text-gray-600 outline-none focus:border-primary hover:border-gray-500 transition-colors appearance-none" />
                    </div>
                  </div>
                  <div class="flex flex-col relative">
                    <label class="text-[10px] text-gray-500 font-bold ml-3 mb-0.5 z-10 bg-[#EBEBEB] w-fit px-1 absolute -top-2 left-2">Hasta</label>
                    <div class="relative">
                      <input type="date" v-model="filters.to" class="text-[11px] px-3 py-[9px] w-full rounded-xl border border-[#b2b2b2] bg-transparent text-gray-600 outline-none focus:border-primary hover:border-gray-500 transition-colors appearance-none" />
                    </div>
                  </div>
                </div>

                <div class="flex flex-col mt-2 gap-2">
                  <div class="relative">
                    <label class="text-[10px] text-gray-500 font-bold bg-[#EBEBEB] w-fit px-1 mb-1 block">Buscar por</label>
                    <select v-model="filters.searchBy" class="px-3 py-2.5 pr-8 text-[11px] w-full rounded-xl border border-[#b2b2b2] bg-transparent text-gray-600 outline-none hover:border-gray-500 focus:border-primary transition-colors focus:ring-1 focus:ring-primary appearance-none cursor-pointer">
                      <option value="destination">Destino</option>
                      <option value="official">Funcionario</option>
                    </select>
                    <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500" style="top: 22px;">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                  </div>

                  <div class="relative mt-1">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </div>
                    <input
                      type="text"
                      v-model="filters.searchValue"
                      :placeholder="filters.searchBy === 'official' ? 'Nombre del funcionario...' : 'Nombre del destino...'"
                      class="pl-8 pr-3 py-2.5 text-[11px] w-full rounded-xl border border-[#b2b2b2] bg-transparent text-gray-700 outline-none hover:border-gray-500 focus:border-primary transition-colors focus:ring-1 focus:ring-primary placeholder-gray-400"
                    />
                  </div>
                </div>

                <!-- Patente -->
                <div class="flex flex-col mt-2 relative">
                  <label class="text-[10px] text-gray-500 font-bold ml-3 mb-0.5 z-10 bg-[#EBEBEB] w-fit px-1 absolute -top-2 left-2">Patentes</label>
                  <div class="relative">
                    <select v-model="filters.license" class="px-3 py-2.5 pr-8 text-[11px] w-full rounded-xl border border-[#b2b2b2] bg-transparent text-gray-500 outline-none hover:border-gray-500 focus:border-primary transition-colors focus:ring-1 focus:ring-primary appearance-none cursor-pointer">
                      <option value="">Selecciona la patente...</option>
                      <option v-for="plate in uniquePlates" :key="plate" :value="plate">{{ plate }}</option>
                    </select>
                    <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                  </div>
                </div>

                <!-- Enviar button -->
                <div class="mt-4 flex justify-end">
                  <button @click="applyFilters" class="px-6 py-2 bg-[#A61919] text-white text-xs rounded-xl font-bold shadow-sm hover:bg-red-800 transition-all w-28">
                    Aplicar
                  </button>
                </div>
              </div>
            </div>
          </Transition>

        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* Animations for the slide panel */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
  width: 0;
  margin-left: 0;
  padding-left: 0;
  padding-right: 0;
}

/* Excel-style table with uniform borders on headers */
.history-table {
  border-collapse: separate !important;
  border-spacing: 0 !important;
}
.history-table thead th {
  border: 1px solid #555 !important;
  padding: 10px 12px !important;
  letter-spacing: 0.02em;
}
.history-table tbody td {
  border: 1px solid #d1d1d1 !important;
  padding: 12px 8px;
}

/* Native date picker pseudo-element styling to look good */
input[type="date"]::-webkit-calendar-picker-indicator {
  opacity: 0; /* completely hide native icon over our custom one */
  cursor: pointer;
  z-index: 10;
  position: absolute;
  right: 8px;
  width: 24px;
  height: 24px;
}

/* Subtle scrollbar */
.overflow-auto::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.overflow-auto::-webkit-scrollbar-track {
  background: transparent; 
}
.overflow-auto::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.1); 
  border-radius: 4px;
}
.overflow-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(0,0,0,0.2); 
}
</style>
