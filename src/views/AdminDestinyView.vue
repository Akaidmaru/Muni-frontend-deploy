<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import logoCompleto from '@/assets/images/Logo-completo.png'
import DashboardSidebar from '@/components/DashboardSidebar.vue'
import UserMenu from '@/components/UserMenu.vue'
import TripRouteMap from '@/components/TripRouteMap.vue'
import api from '@/services/axios'

const router = useRouter()

// ── Estado principal ────────────────────────────────────────────────────────
const destinations = ref([])
const isLoading = ref(false)
const loadError = ref('')

const searchQuery = ref('')
const statusFilter = ref('ALL')
const itemsPerPage = ref(10)
const currentPage = ref(1)

const isFilterOpen = ref(false)

const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = 'ALL'
  currentPage.value = 1
}

// ── Modales ─────────────────────────────────────────────────────────────────
const isEditModalOpen = ref(false)
const isCreateModalOpen = ref(false)
const isSaving = ref(false)
const saveError = ref('')
const saveSuccess = ref('')

const editForm = ref({ id: null, name: '', active: true })
const createForm = ref({ name: '' })
const createError = ref('')

// ── Carga de datos ──────────────────────────────────────────────────────────
const loadDestinations = async () => {
  isLoading.value = true
  loadError.value = ''
  try {
    const { data } = await api.get('/destinations')
    destinations.value = Array.isArray(data) ? data : []
  } catch (error) {
    const msg = error.response?.data?.message
    if (error.response?.status === 401) loadError.value = 'Tu sesión ya no es válida.'
    else if (error.response?.status === 403) loadError.value = 'No tienes permisos para gestionar destinos.'
    else loadError.value = Array.isArray(msg) ? msg.join(', ') : msg || 'No se pudieron cargar los destinos.'
    destinations.value = []
  } finally {
    isLoading.value = false
  }
}

// ── Filtrado y paginación ───────────────────────────────────────────────────
const normalize = (v) =>
  String(v || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const filteredDestinations = computed(() => {
  const q = normalize(searchQuery.value)
  return destinations.value
    .filter((d) => {
      // Filtrar por búsqueda
      const matchSearch = !q || normalize(d.name).includes(q)
      // Filtrar por estado
      const matchStatus =
        statusFilter.value === 'ALL' ||
        (statusFilter.value === 'ACTIVE' && d.status === 'En transcurso') ||
        (statusFilter.value === 'INACTIVE' && d.status === 'Completado')
      // Mostrar todos los destinos sin importar si tienen viajes
      return matchSearch && matchStatus
    })
    .sort((a, b) => a.name.localeCompare(b.name))
})

const totalItems = computed(() => filteredDestinations.value.length)
const totalPages = computed(() => Math.max(Math.ceil(totalItems.value / itemsPerPage.value), 1))
const pagedDestinations = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredDestinations.value.slice(start, start + itemsPerPage.value)
})
const firstRow = computed(() => (totalItems.value === 0 ? 0 : (currentPage.value - 1) * itemsPerPage.value + 1))
const lastRow = computed(() => Math.min(currentPage.value * itemsPerPage.value, totalItems.value))

watch([searchQuery, statusFilter, itemsPerPage], () => { currentPage.value = 1 })
const prevPage = () => { if (currentPage.value > 1) currentPage.value-- }
const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++ }

// ── Navegación ──────────────────────────────────────────────────────────────
const goBack = () => {
  if (window.history.length > 1) { router.back(); return }
  router.push('/dashboard-admin')
}

// ── Modal EDITAR ─────────────────────────────────────────────────────────────
const openEditModal = (dest) => {
  editForm.value = { id: dest.id, name: dest.name, active: dest.active }
  saveError.value = ''
  saveSuccess.value = ''
  isEditModalOpen.value = true
}

const closeEditModal = () => {
  isEditModalOpen.value = false
  saveError.value = ''
  saveSuccess.value = ''
}

const saveEdit = async () => {
  if (!editForm.value.name.trim()) {
    saveError.value = 'El nombre no puede estar vacío.'
    return
  }
  isSaving.value = true
  saveError.value = ''
  saveSuccess.value = ''
  try {
    const { data } = await api.patch(`/destinations/${editForm.value.id}`, {
      name: editForm.value.name.trim(),
      active: editForm.value.active,
    })
    const idx = destinations.value.findIndex((d) => d.id === data.id)
    if (idx !== -1) destinations.value[idx] = data
    saveSuccess.value = 'Destino actualizado correctamente.'
    setTimeout(closeEditModal, 1200)
  } catch (error) {
    const msg = error.response?.data?.message
    saveError.value = Array.isArray(msg) ? msg.join(', ') : msg || 'No se pudo guardar el destino.'
  } finally {
    isSaving.value = false
  }
}

// ── Eliminar destino ─────────────────────────────────────────────────────────
const isDeleteConfirmOpen = ref(false)
const isDeleting = ref(false)
const deleteError = ref('')

const openDeleteConfirm = () => {
  deleteError.value = ''
  isDeleteConfirmOpen.value = true
}

const closeDeleteConfirm = () => {
  isDeleteConfirmOpen.value = false
  deleteError.value = ''
}

const confirmDelete = async () => {
  isDeleting.value = true
  deleteError.value = ''
  try {
    await api.delete(`/destinations/${editForm.value.id}`)
    destinations.value = destinations.value.filter((d) => d.id !== editForm.value.id)
    closeDeleteConfirm()
    closeEditModal()
  } catch (error) {
    const msg = error.response?.data?.message
    deleteError.value = Array.isArray(msg) ? msg.join(', ') : msg || 'No se pudo eliminar el destino.'
  } finally {
    isDeleting.value = false
  }
}

// ── Modal CREAR ──────────────────────────────────────────────────────────────
const openCreateModal = () => {
  createForm.value = { name: '' }
  createError.value = ''
  isCreateModalOpen.value = true
}

const closeCreateModal = () => {
  isCreateModalOpen.value = false
  createError.value = ''
}

const saveCreate = async () => {
  if (!createForm.value.name.trim()) {
    createError.value = 'El nombre no puede estar vacío.'
    return
  }
  isSaving.value = true
  createError.value = ''
  try {
    const { data } = await api.post('/destinations', {
      name: createForm.value.name.trim(),
      active: true,
    })
    destinations.value.push(data)
    closeCreateModal()
  } catch (error) {
    const msg = error.response?.data?.message
    createError.value = Array.isArray(msg) ? msg.join(', ') : msg || 'No se pudo crear el destino.'
  } finally {
    isSaving.value = false
  }
}

const selectedLocationForMap = ref(null)

const showLocation = (dest) => {
  console.log('Botón presionado, abriendo mapa para:', dest.name)
  selectedLocationForMap.value = {
    ...dest,
    // Dummy coordinates for the destination until backend provides real GPS data.
    snappedPoints: [
      { latitude: -22.4544, longitude: -68.9294 } // Default reference coords
    ]
  }
}

onMounted(loadDestinations)
</script>

<template>
  <div class="min-h-screen bg-background font-sans flex flex-col">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200 px-4 py-4 flex items-center justify-between sticky top-0 z-40">
      <router-link to="/"><img :src="logoCompleto" alt="Logo" class="h-16 w-auto object-contain" /></router-link>
      <UserMenu />
    </header>

    <div class="flex flex-1 overflow-hidden">
      <DashboardSidebar />

      <main class="flex-1 px-4 pt-4 pb-8 overflow-hidden flex flex-col items-center min-w-0">
        <div v-if="!selectedLocationForMap" class="w-full max-w-full mb-3 pl-10 sm:pl-12 shrink-0">
          <button @click="goBack" class="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary transition-colors">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Volver
          </button>
        </div>
        <div class="flex gap-6 w-full h-full min-h-0 min-w-0 max-w-full">
          
          <!-- MAIN TABLE VIEW -->
          <div v-if="!selectedLocationForMap" :class="[
            'bg-white rounded-3xl border-2 border-slate-300 shadow-sm flex-1 flex flex-col transition-all duration-300 relative min-w-0 overflow-hidden',
            isFilterOpen ? 'max-w-[calc(100%-22rem)]' : 'w-full'
          ]">
            <!-- Header -->
            <div class="shrink-0 px-4 sm:px-8 pt-5 pb-4 sm:pb-6">
              <!-- Mobile: título + botones centrados apilados -->
              <!-- Desktop: título centrado con botones absolutos a la derecha -->
              <div class="relative flex flex-col items-center gap-3 sm:block">
                <h1 class="text-2xl sm:text-3xl font-titles font-bold text-text-title text-center sm:py-2">Administración de Destinos</h1>
                <div class="flex items-center gap-3 sm:absolute sm:right-0 sm:top-1/2 sm:-translate-y-1/2">
                  <button
                    @click="openCreateModal"
                    class="flex items-center gap-2 bg-[#0B2545] hover:bg-[#133A6D] text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-all hover:-translate-y-0.5 active:scale-95 shadow-sm"
                  >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Nuevo destino
                  </button>
                  <button
                          @click="isFilterOpen = !isFilterOpen"
                          class="p-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors outline-none focus:ring-2 focus:ring-primary border border-gray-300"
                          :title="isFilterOpen ? 'Cerrar filtros' : 'Abrir filtros'">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="8" y1="5" x2="8" y2="19"></line>
                      <line x1="16" y1="5" x2="16" y2="19"></line>
                      <line x1="5" y1="10" x2="11" y2="10"></line>
                      <line x1="13" y1="14" x2="19" y2="14"></line>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Error de carga -->
            <div v-if="loadError" class="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4 font-body shrink-0">
        {{ loadError }}
      </div>

      <!-- Tabla -->
      <div class="flex-1 px-8 md:px-12 min-h-0 overflow-auto mb-4">
        <table class="w-full border-collapse min-w-[800px]">
          <thead>
            <tr>
              <th class="border border-[#7EA0C4] py-4 px-6 text-left font-body text-[1.05rem] font-medium text-slate-700 bg-white">Destino</th>
              <th class="border border-[#7EA0C4] py-4 px-4 text-center font-body text-[1.05rem] font-medium text-slate-700 bg-white w-48">Estado</th>
              <th class="border border-[#7EA0C4] py-4 px-4 text-center font-body text-[1.05rem] font-medium text-slate-700 bg-white w-48">Viajes asociados</th>
              <th class="border border-[#7EA0C4] py-4 px-4 text-center font-body text-[1.05rem] font-medium text-slate-700 bg-white w-48">Último viaje</th>
              <th class="border border-[#7EA0C4] py-4 px-4 text-center font-body text-[1.05rem] font-medium text-slate-700 bg-white w-40">Acción</th>
            </tr>
          </thead>
          <tbody>
            <!-- Loading -->
            <tr v-if="isLoading">
              <td colspan="5" class="border border-[#D3DCE6] text-center py-16 text-slate-400 font-body">
                <div class="flex items-center justify-center gap-2">
                  <svg class="animate-spin w-5 h-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Cargando destinos...
                </div>
              </td>
            </tr>

            <!-- Sin resultados -->
            <tr v-else-if="pagedDestinations.length === 0">
              <td colspan="5" class="border border-[#D3DCE6] text-center py-16 text-slate-400 font-body">
                No se encontraron destinos.
              </td>
            </tr>

            <!-- Filas -->
            <tr
              v-else
              v-for="dest in pagedDestinations"
              :key="dest.id"
              class="bg-white hover:bg-slate-50/60 transition-colors"
            >
              <td class="border border-[#D3DCE6] py-3 px-6 text-slate-700 text-sm font-medium">
                <div class="flex items-center justify-start gap-4">
                  <button
                    type="button"
                    @click.stop.prevent="showLocation(dest)"
                    title="Ver ubicación en mapa"
                    class="p-1.5 rounded-lg text-[#7EA0C4] hover:text-[#0B2545] hover:bg-slate-100 transition-colors focus:outline-none focus:ring-1 focus:ring-primary/50"
                  >
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z"/>
                      <line x1="8" y1="2" x2="8" y2="18"/>
                      <line x1="16" y1="6" x2="16" y2="22"/>
                    </svg>
                  </button>
                  {{ dest.name }}
                </div>
              </td>
              <td class="border border-[#D3DCE6] py-4 px-4 text-center">
                <span
                  class="inline-flex items-center justify-center gap-1.5 px-3 py-1 text-xs font-bold w-[120px]"
                  :style="dest.status === 'En transcurso' ? 'color:#22c55e' : 'color:#94a3b8'"
                >
                  <span class="w-2.5 h-2.5 rounded-full" :style="dest.status === 'En transcurso' ? 'background:#22c55e' : 'background:#94a3b8'" />
                  {{ dest.status }}
                </span>
              </td>
              <td class="border border-[#D3DCE6] py-4 px-4 text-center text-slate-400 text-sm font-medium">
                {{ dest.tripsCount ? `${dest.tripsCount} viajes` : '—' }}
              </td>
              <td class="border border-[#D3DCE6] py-4 px-4 text-center text-slate-400 text-sm font-medium">
                {{ dest.lastTripDate || '—' }}
              </td>
              <td class="border border-[#D3DCE6] py-4 px-4 text-center">
                <div class="flex items-center justify-center gap-2">
                  <button
                    @click="openEditModal(dest)"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[1.25rem] text-[11px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors tracking-wide"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />
                    </svg>
                    Editar
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginación -->
      <div class="px-8 md:px-12 py-5 mt-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-500">
        <div class="flex items-center gap-2">
          <span>Filas por páginas</span>
          <div class="relative">
            <select v-model.number="itemsPerPage" class="appearance-none border border-gray-300 rounded-md px-3 py-1 pr-7 bg-white outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer text-xs">
              <option :value="10">10</option>
              <option :value="25">25</option>
              <option :value="50">50</option>
            </select>
            <svg class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
          </div>
        </div>
        <div class="flex items-center gap-5">
          <span>{{ firstRow }}-{{ lastRow }} de {{ totalItems }}</span>
          <div class="flex items-center gap-2">
            <button @click="prevPage" :disabled="currentPage <= 1" class="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <button @click="nextPage" :disabled="currentPage >= totalPages" class="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
        </div>
          </div>
        </div>

        <!-- MAP VIEW CARD -->
        <div v-else class="bg-white rounded-3xl border-2 border-slate-300 shadow-sm flex-1 flex flex-col overflow-visible transition-all duration-300 relative w-full p-8 hidden-scroll">
          <!-- Botón Volver (Posicionado en esquina) -->
          <button @click="selectedLocationForMap = null" style="top: 92px;" class="absolute left-6 inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-primary hover:text-blue-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 z-20 bg-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            Volver
          </button>

          <div class="flex flex-col h-full min-h-0 pt-12">
            <!-- Map Header -->
            <div class="flex flex-col relative w-full mb-6 shrink-0">
              <h2 class="text-2xl font-bold font-titles text-center text-text-title">Ubicación de Destino: <span class="text-[#215179]">{{ selectedLocationForMap.name }}</span></h2>
            </div>

            <!-- Map Container -->
            <div class="flex-1 rounded-xl w-full h-full min-h-0 overflow-hidden shadow-inner bg-slate-100 relative">
              <TripRouteMap
                v-if="selectedLocationForMap.snappedPoints"
                :snapped-points="selectedLocationForMap.snappedPoints"
              />
            </div>
          </div>
        </div>

          <!-- Backdrop móvil -->
          <div v-if="isFilterOpen" class="fixed inset-0 bg-black/30 z-40 sm:hidden" @click="isFilterOpen = false" />

          <!-- Filter Panel -->
          <Transition name="slide">
            <div v-show="isFilterOpen" class="fixed inset-x-0 bottom-0 top-[140px] z-50 sm:static sm:z-20 sm:w-[20rem] sm:h-full bg-[#EBEBEB] sm:rounded-[2rem] rounded-t-[2rem] border border-gray-300 shadow-sm flex flex-col p-6 sm:shrink-0 overflow-y-auto relative">
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

              <div class="flex flex-col gap-5 flex-1 mt-2">
                <div class="flex justify-end relative z-10 w-full mb-2">
                  <button @click="clearFilters" class="px-5 py-1.5 bg-transparent border border-[#b2b2b2] rounded-3xl text-[11px] font-bold text-[#5c5c5c] hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5 w-28">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" class="stroke-current" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    Limpiar
                  </button>
                </div>

                <div class="flex flex-col mt-2 gap-2">
                  <div class="relative mt-1">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </div>
                    <input
                      v-model="searchQuery"
                      type="text"
                      placeholder="Buscar destino..."
                      class="pl-8 pr-3 py-2.5 text-[11px] w-full rounded-xl border border-[#b2b2b2] bg-transparent text-gray-700 outline-none hover:border-gray-500 focus:border-primary transition-colors focus:ring-1 focus:ring-primary placeholder-gray-400"
                    />
                  </div>
                </div>

                <!-- Estado -->
                <div class="flex flex-col mt-2 relative">
                  <label class="text-[10px] text-gray-500 font-bold ml-3 mb-0.5 z-10 bg-[#EBEBEB] w-fit px-1 absolute -top-2 left-2">Estado</label>
                  <div class="relative">
                    <select v-model="statusFilter" class="px-3 py-2.5 pr-8 text-[11px] w-full rounded-xl border border-[#b2b2b2] bg-transparent text-gray-500 outline-none hover:border-gray-500 focus:border-primary transition-colors focus:ring-1 focus:ring-primary appearance-none cursor-pointer">
                      <option value="ALL">Todos los estados</option>
                      <option value="ACTIVE">En transcurso</option>
                      <option value="INACTIVE">Completado</option>
                      <option value="NEW" >Nuevo</option>
                    </select>
                    <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                  </div>
                </div>

                <div class="mt-4 flex justify-end">
                  <button @click="isFilterOpen = false" class="px-6 py-2 bg-[#A61919] text-white text-xs rounded-xl font-bold shadow-sm hover:bg-red-800 transition-all w-full">
                    Aplicar
                  </button>
                </div>
              </div>
            </div>
          </Transition>

        </div>
      </main>
    </div>

    <!-- Modal EDITAR -->
    <Teleport to="body">
      <transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="isEditModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 class="text-lg font-titles font-bold text-text-title mb-5">Editar destino</h2>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-titles font-semibold text-slate-600 mb-1">Nombre</label>
                <input
                  v-model="editForm.name"
                  type="text"
                  class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Nombre del destino"
                />
              </div>

              <div>
                <label class="block text-sm font-titles font-semibold text-slate-600 mb-1">Estado</label>
                <select
                  v-model="editForm.active"
                  class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option :value="true">Activo</option>
                  <option :value="false">Inactivo</option>
                  <option :value="null">Nuevo</option>
                </select>
              </div>
            </div>

            <div v-if="saveError" class="mt-3 text-sm text-red-600 font-body bg-red-50 border border-red-200 rounded-lg px-3 py-2">{{ saveError }}</div>
            <div v-if="saveSuccess" class="mt-3 text-sm text-green-600 font-body bg-green-50 border border-green-200 rounded-lg px-3 py-2">{{ saveSuccess }}</div>

            <div class="flex items-center justify-between mt-6">
              <button
                @click="openDeleteConfirm"
                class="inline-flex items-center gap-2 px-4 py-2 text-sm font-titles font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all active:scale-95"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Eliminar
              </button>
              <div class="flex gap-3">
                <button @click="closeEditModal" class="px-4 py-2 text-sm font-titles font-semibold text-slate-600 hover:bg-gray-100 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button
                  @click="saveEdit"
                  :disabled="isSaving"
                  class="px-4 py-2 text-sm font-titles font-bold text-white bg-primary hover:bg-primary-hover rounded-lg transition-all active:scale-95 disabled:opacity-50"
                >
                  {{ isSaving ? 'Guardando...' : 'Guardar' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- Modal CONFIRMAR ELIMINACIÓN -->
    <Teleport to="body">
      <transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="isDeleteConfirmOpen" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div class="flex flex-col items-center text-center gap-3 mb-5">
              <div class="flex items-center justify-center w-14 h-14 rounded-full bg-red-100">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <h2 class="text-lg font-titles font-bold text-slate-800">¿Eliminar destino?</h2>
              <p class="text-sm font-body text-slate-500">
                Estás a punto de eliminar <span class="font-semibold text-slate-700">{{ editForm.name }}</span>.
                Esta acción es <span class="font-bold text-red-600">irreversible</span> y no se puede deshacer.
              </p>
            </div>

            <div v-if="deleteError" class="mb-4 text-sm text-red-600 font-body bg-red-50 border border-red-200 rounded-lg px-3 py-2">{{ deleteError }}</div>

            <div class="flex gap-3">
              <button
                @click="closeDeleteConfirm"
                :disabled="isDeleting"
                class="flex-1 px-4 py-2 text-sm font-titles font-semibold text-slate-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                @click="confirmDelete"
                :disabled="isDeleting"
                class="flex-1 px-4 py-2 text-sm font-titles font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all active:scale-95 disabled:opacity-50"
              >
                {{ isDeleting ? 'Eliminando...' : 'Sí, eliminar' }}
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- Modal CREAR -->
    <Teleport to="body">
      <transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="isCreateModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 class="text-lg font-titles font-bold text-text-title mb-5">Nuevo destino</h2>

            <div>
              <label class="block text-sm font-titles font-semibold text-slate-600 mb-1">Nombre</label>
              <input
                v-model="createForm.name"
                type="text"
                class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Nombre del destino"
                @keyup.enter="saveCreate"
              />
            </div>

            <div v-if="createError" class="mt-3 text-sm text-red-600 font-body bg-red-50 border border-red-200 rounded-lg px-3 py-2">{{ createError }}</div>

            <div class="flex justify-end gap-3 mt-6">
              <button @click="closeCreateModal" class="px-4 py-2 text-sm font-titles font-semibold text-slate-600 hover:bg-gray-100 rounded-lg transition-colors">
                Cancelar
              </button>
              <button
                @click="saveCreate"
                :disabled="isSaving"
                class="px-4 py-2 text-sm font-titles font-bold text-white bg-primary hover:bg-primary-hover rounded-lg transition-all active:scale-95 disabled:opacity-50"
              >
                {{ isSaving ? 'Creando...' : 'Crear destino' }}
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<style scoped>
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
</style>