<script setup>
import { ref, computed } from 'vue'
import logoCompleto from '@/assets/images/Logo-completo.png'
import DashboardSidebar from '@/components/DashboardSidebar.vue'
import UserMenu from '@/components/UserMenu.vue'
import { useAuthStore } from '@/stores/auth'
import { useTripsStore } from '@/stores/trips'

const auth = useAuthStore()
const tripsStore = useTripsStore()

// Filter state
const isFilterOpen = ref(false)

// Pagination state
const itemsPerPage = ref(100)
const currentPage = ref(1)

// Form state for filters
const filters = ref({
  from: '',
  to: '',
  patient: '',
  license: ''
})

// Applied state (when user clicks Apply)
const appliedFilters = ref({ ...filters.value })

// All trips from global store (newest first)
const allTrips = computed(() => {
  return [...tripsStore.completedTrips].reverse()
})

// Helper: converts "DD/MM/YYYY" → Date
const parseDate = (str) => {
  const [d, m, y] = str.split('/')
  return new Date(`${y}-${m}-${d}`)
}

// Computed filtered travels
const filteredTravels = computed(() => {
  return allTrips.value.filter(travel => {
    let match = true

    // Filter by license
    if (appliedFilters.value.license && travel.licensePlate !== appliedFilters.value.license) {
      match = false
    }

    // Filter by patient name (case insensitive)
    if (appliedFilters.value.patient && (!travel.patient || !travel.patient.toLowerCase().includes(appliedFilters.value.patient.toLowerCase()))) {
      match = false
    }

    // Filter by date range (input gives YYYY-MM-DD, data is DD/MM/YYYY)
    const travelDate = parseDate(travel.date)
    if (appliedFilters.value.from) {
      const fromDate = new Date(appliedFilters.value.from)
      if (travelDate < fromDate) match = false
    }
    if (appliedFilters.value.to) {
      const toDate = new Date(appliedFilters.value.to)
      if (travelDate > toDate) match = false
    }

    return match
  })
})

const applyFilters = () => {
  appliedFilters.value = { ...filters.value }
  currentPage.value = 1
}

const clearFilters = () => {
  filters.value = { from: '', to: '', patient: '', license: '' }
  appliedFilters.value = { ...filters.value }
  currentPage.value = 1
}
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
      <main class="flex-1 p-6 md:p-8 overflow-hidden flex flex-col">
        <div class="flex flex-1 gap-6 w-full mx-auto h-full min-h-0">
          
          <!-- Main Card (Table) -->
          <div :class="[
            'bg-white rounded-[2rem] shadow-xl border border-gray-100 flex-1 flex flex-col overflow-hidden transition-all duration-300 relative',
            isFilterOpen ? 'max-w-[calc(100%-24rem)]' : 'w-full'
          ]">
            <!-- Top section: Title and Filter Button -->
            <div class="flex items-center justify-between p-8 pb-6 relative min-h-[5rem]">
               <h1 class="text-3xl font-titles font-bold text-text-title text-center m-0 absolute left-1/2 -translate-x-1/2">Historial de viajes</h1>
               
               <button v-if="!isFilterOpen" 
                       @click="isFilterOpen = true" 
                       class="absolute right-6 top-6 p-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors outline-none focus:ring-2 focus:ring-primary z-10 border border-gray-300"
                       title="Abrir filtros">
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                   <line x1="8" y1="5" x2="8" y2="19"></line>
                   <line x1="16" y1="5" x2="16" y2="19"></line>
                   <line x1="5" y1="10" x2="11" y2="10"></line>
                   <line x1="13" y1="14" x2="19" y2="14"></line>
                 </svg>
               </button>
            </div>

            <!-- Table Container -->
            <div class="flex-1 overflow-auto px-12 md:px-16 relative mt-6">
              <div class="min-w-[800px]">
                <table class="history-table w-full text-sm text-center" style="border-collapse: separate; border-spacing: 0;">
                  <thead class="text-[13px] text-text-title font-bold sticky top-0 bg-white z-10">
                    <tr>
                      <th rowspan="2" class="align-middle" style="border: 1px solid #555; padding: 10px 12px;">Fecha</th>
                      <th rowspan="2" class="align-middle" style="border: 1px solid #555; padding: 10px 12px;">Patente</th>
                      <th colspan="2" style="border: 1px solid #555; border-bottom: none; padding: 10px 12px;">Hora</th>
                      <th rowspan="2" class="align-middle" style="border: 1px solid #555; padding: 10px 12px;">Destino</th>
                      <th rowspan="2" class="align-middle" style="border: 1px solid #555; padding: 10px 12px;">Firma</th>
                      <th rowspan="2" class="align-middle" style="border: 1px solid #555; padding: 10px 12px;">Paciente</th>
                      <th rowspan="2" class="align-middle" style="border: 1px solid #555; padding: 10px 12px;">Firma</th>
                    </tr>
                    <tr>
                      <th class="text-xs font-semibold" style="border: 1px solid #555; border-top: 1px solid #999; padding: 8px 12px;">Inicio</th>
                      <th class="text-xs font-semibold" style="border: 1px solid #555; border-top: 1px solid #999; padding: 8px 12px;">Final</th>
                    </tr>
                  </thead>
                  <tbody class="text-center font-body">
                    <!-- Placeholder Row -->
                    <tr class="border-b border-gray-200 hover:bg-gray-50/50 transition-colors text-text-secondary">
                      <td class="px-2 py-6 text-[13px] opacity-60">00/00/0000</td>
                      <td class="px-2 py-6"></td>
                      <td class="px-2 py-6 text-xs opacity-60">00:00</td>
                      <td class="px-2 py-6 border-r border-transparent text-xs opacity-60">00:00</td>
                      <td class="px-2 py-6 opacity-60 text-sm">Nombre del destino</td>
                      <td class="px-2 py-6"></td>
                      <td class="px-4 py-6 text-sm opacity-60 font-medium">Nombre Apellido</td>
                      <td class="px-4 py-6"></td>
                    </tr>

                    <!-- Actual Data Rows -->
                    <tr v-for="(travel, index) in filteredTravels" :key="index" class="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td class="px-2 py-5 text-gray-500 text-sm">{{ travel.date }}</td>
                      <td class="px-2 py-5 font-semibold text-text-title">{{ travel.licensePlate }}</td>
                      <td class="px-2 py-5 text-gray-500">{{ travel.startTime }}</td>
                      <td class="px-2 py-5 text-gray-500">{{ travel.endTime }}</td>
                      <td class="px-2 py-5 text-gray-700">{{ travel.destination }}</td>
                      <td class="px-4 py-5">
                        <div v-if="travel.signature" class="w-full flex justify-center">
                          <div class="h-1 w-12 bg-primary rounded-full opacity-60 rotate-[-10deg]"></div>
                        </div>
                      </td>
                      <td class="px-4 py-5 text-gray-700">{{ travel.patient }}</td>
                      <td class="px-4 py-5">
                        <div v-if="travel.patientSignature" class="w-full flex justify-center">
                          <div class="h-1 w-12 bg-primary rounded-full opacity-60 rotate-[-10deg]"></div>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Empty State -->
                    <tr v-if="filteredTravels.length === 0">
                      <td colspan="8" class="px-3 py-20 text-center text-text-secondary font-medium">
                        No hay viajes que coincidan con la búsqueda.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Footer Pagination -->
            <div class="px-12 md:px-16 py-4 bg-white flex justify-between items-center text-xs font-medium text-gray-500 border-t border-gray-200 mt-auto rounded-b-[2rem]">
              <div class="flex items-center gap-2">
                <span>Filas por páginas</span>
                <div class="relative">
                  <select v-model="itemsPerPage" class="appearance-none border border-gray-300 rounded-md px-3 py-1.5 pr-8 bg-white outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer">
                    <option value="10">10</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>

              <div class="font-semibold content-center pl-10">
                1-{{ Math.min(itemsPerPage, filteredTravels.length) }} de {{ filteredTravels.length > 0 ? filteredTravels.length : 200 }}
              </div>

              <div class="flex items-center gap-1">
                <button class="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 disabled:opacity-40 transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <button class="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 disabled:opacity-40 transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              </div>
            </div>
            

          </div>

          <!-- Filter Panel -->
          <Transition name="slide">
            <div v-show="isFilterOpen" class="w-[22rem] bg-[#EBEBEB] rounded-[2rem] border border-gray-300 shadow-sm flex flex-col p-6 shrink-0 z-20 h-full overflow-y-auto relative">
              
              <!-- Close button -->
              <button @click="isFilterOpen = false" class="absolute right-6 top-6 text-gray-700 hover:text-gray-900 focus:outline-none bg-transparent">
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                   <line x1="8" y1="5" x2="8" y2="19"></line>
                   <line x1="16" y1="5" x2="16" y2="19"></line>
                   <line x1="5" y1="10" x2="11" y2="10"></line>
                   <line x1="13" y1="14" x2="19" y2="14"></line>
                 </svg>
              </button>

              <div class="flex justify-center items-center mb-6 mt-2">
                <h2 class="text-xl font-titles font-bold text-[#1b2533]">Filtros</h2>
              </div>

              <!-- Filter Form -->
              <div class="flex flex-col gap-5 flex-1 mt-2">
                <div class="flex justify-end relative z-10 w-full mb-2">
                  <button @click="clearFilters" class="px-5 py-1.5 bg-transparent border border-[#b2b2b2] rounded-3xl text-[11px] font-bold text-[#5c5c5c] hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5 w-28">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" class="stroke-current" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    Limpiar
                  </button>
                </div>

                <!-- Date Range -->
                <div class="grid grid-cols-2 gap-4">
                  <div class="flex flex-col relative">
                    <label class="text-[10px] text-gray-500 font-bold ml-3 mb-0.5 z-10 bg-[#EBEBEB] w-fit px-1 absolute -top-2 left-2">Desde</label>
                    <div class="relative">
                      <input type="date" v-model="filters.from" class="text-xs px-3 py-2.5 w-full rounded-xl border border-[#b2b2b2] bg-transparent text-gray-600 outline-none focus:border-primary hover:border-gray-500 transition-colors appearance-none" />
                    </div>
                  </div>
                  <div class="flex flex-col relative">
                    <label class="text-[10px] text-gray-500 font-bold ml-3 mb-0.5 z-10 bg-[#EBEBEB] w-fit px-1 absolute -top-2 left-2">Hasta</label>
                    <div class="relative">
                      <input type="date" v-model="filters.to" class="text-xs px-3 py-2.5 w-full rounded-xl border border-[#b2b2b2] bg-transparent text-gray-600 outline-none focus:border-primary hover:border-gray-500 transition-colors appearance-none" />
                    </div>
                  </div>
                </div>

                <!-- Paciente -->
                <div class="flex flex-col mt-2 relative">
                  <label class="text-[10px] text-gray-500 font-bold ml-3 mb-0.5 z-10 bg-[#EBEBEB] w-fit px-1 absolute -top-2 left-2">Paciente</label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </div>
                    <input type="text" v-model="filters.patient" placeholder="Escribe el nombre..." class="pl-8 pr-3 py-2.5 text-[11px] w-full rounded-xl border border-[#b2b2b2] bg-transparent text-gray-700 outline-none hover:border-gray-500 focus:border-primary transition-colors focus:ring-1 focus:ring-primary placeholder-gray-400" />
                  </div>
                </div>

                <!-- Patente -->
                <div class="flex flex-col mt-2 relative">
                  <label class="text-[10px] text-gray-500 font-bold ml-3 mb-0.5 z-10 bg-[#EBEBEB] w-fit px-1 absolute -top-2 left-2">Patentes</label>
                  <div class="relative">
                    <select v-model="filters.license" class="px-3 py-2.5 pr-8 text-[11px] w-full rounded-xl border border-[#b2b2b2] bg-transparent text-gray-500 outline-none hover:border-gray-500 focus:border-primary transition-colors focus:ring-1 focus:ring-primary appearance-none cursor-pointer">
                      <option value="">Selecciona la patente...</option>
                      <option value="AB-CD-12">AB-CD-12</option>
                      <option value="XX-YY-99">XX-YY-99</option>
                      <option value="AB-CD-11">AB-CD-11</option>
                    </select>
                    <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                  </div>
                </div>

                <!-- Aplicar button -->
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

/* Native date picker pseudo-element styling */
input[type="date"]::-webkit-calendar-picker-indicator {
  opacity: 0;
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
