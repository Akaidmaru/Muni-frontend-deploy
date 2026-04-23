<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSidebarStore } from '@/stores/sidebar'
import logoCompleto from '@/assets/images/Logo-completo.png'
import DashboardSidebar from '@/components/DashboardSidebar.vue'
import UserMenu from '@/components/UserMenu.vue'
import api from '@/services/axios'

const router = useRouter()

const filterDesde = ref('')
const filterHasta = ref('')
const searchQuery = ref('')
const filterPatente = ref('')
const filterModelo = ref('')
const isFilterOpen = ref(false)
const sidebarStore = useSidebarStore()
watch(isFilterOpen, (v) => {
  sidebarStore.setMobileFiltersOverlayOpen(!!v)
}, { immediate: true })
onUnmounted(() => {
  sidebarStore.setMobileFiltersOverlayOpen(false)
})

const itemsPerPage = ref(100)
const currentPage = ref(1)

const vehicles = ref([])
const isLoading = ref(false)
const loadError = ref('')

const isEditModalOpen = ref(false)
const vehicleToEdit = ref(null)
const isDeleteConfirmOpen = ref(false)

const isViewModalOpen = ref(false)
const vehicleToView = ref(null)

const isAddModalOpen = ref(false)
const formAdd = ref({
  plate: '',
  model: '',
  mileage: 0,
  circulationPermitStatus: 'No tiene',
  circulationPermitExpiresAt: '',
  technicalReviewStatus: 'No tiene',
  technicalReviewExpiresAt: '',
  emissionsStatus: 'No tiene',
  emissionsExpiresAt: '',
  insuranceStatus: 'No tiene',
  insuranceExpiresAt: '',
})

const formEdit = ref({
  plate: '',
  model: '',
  mileage: 0,
  circulationPermitStatus: 'No tiene',
  circulationPermitExpiresAt: '',
  technicalReviewStatus: 'No tiene',
  technicalReviewExpiresAt: '',
  emissionsStatus: 'No tiene',
  emissionsExpiresAt: '',
  insuranceStatus: 'No tiene',
  insuranceExpiresAt: ''
})

const getDocumentStatus = (maybeStatusOrDate, maybeExpiryDate) => {
  const expiryDate = maybeExpiryDate ?? maybeStatusOrDate
  if (!expiryDate) {
    return { label: 'No tiene', isVigente: false, text: 'N/A' }
  }

  const date = new Date(expiryDate)
  if (Number.isNaN(date.getTime())) {
    return { label: 'No tiene', isVigente: false, text: 'N/A' }
  }

  // Ajustar para mostrar correctamente la fecha local en documentos @db.Date
  const adjustedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000)
  const day = String(adjustedDate.getDate()).padStart(2, '0')
  const month = String(adjustedDate.getMonth() + 1).padStart(2, '0')
  const year = adjustedDate.getFullYear()
  const formattedDate = `${day}/${month}/${year}`

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiryOnly = new Date(adjustedDate)
  expiryOnly.setHours(0, 0, 0, 0)

  const sevenDaysFromNow = new Date(today)
  sevenDaysFromNow.setDate(today.getDate() + 7)

  const isVigente = expiryOnly >= today
  const isExpiringSoon = isVigente && expiryOnly <= sevenDaysFromNow

  return {
    label: isExpiringSoon ? 'Por vencer' : isVigente ? 'Vigente' : 'Vencido',
    isVigente,
    isExpiringSoon,
    text: formattedDate,
  }
}

const getInitials = (name, email) => {
  if (name) {
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }
  if (email) {
    return email.substring(0, 2).toUpperCase()
  }
  return 'U'
}

const loadVehicles = async () => {
  isLoading.value = true
  loadError.value = ''
  try {
    const { data } = await api.get('/trucks')
    vehicles.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error cargando vehículos:', error)
    loadError.value = 'Error al cargar vehículos'
  } finally {
    isLoading.value = false
  }
}

const filteredVehicles = computed(() => {
  const normalizedSearch = searchQuery.value.toLowerCase()
  return vehicles.value.filter((v) => {
    const matchSearch = !normalizedSearch || 
      (v.plate && v.plate.toLowerCase().includes(normalizedSearch)) || 
      (v.model && v.model.toLowerCase().includes(normalizedSearch)) ||
      (v.users && v.users.some(u => 
        (u.user?.name && u.user.name.toLowerCase().includes(normalizedSearch)) ||
        (u.user?.email && u.user.email.toLowerCase().includes(normalizedSearch))
      ))
      
    const matchPatente = !filterPatente.value || v.plate === filterPatente.value
    const matchModelo = !filterModelo.value || v.model === filterModelo.value

    return matchSearch && matchPatente && matchModelo
  })
})

const uniquePlates = computed(() => [...new Set(vehicles.value.map(v => v.plate).filter(Boolean))].sort())
const uniqueModels = computed(() => [...new Set(vehicles.value.map(v => v.model).filter(Boolean))].sort())

const totalItems = computed(() => filteredVehicles.value.length)
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value) || 1)

const paginatedVehicles = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredVehicles.value.slice(start, end)
})

const firstVisibleRow = computed(() => totalItems.value === 0 ? 0 : ((currentPage.value - 1) * itemsPerPage.value) + 1)
const lastVisibleRow = computed(() => Math.min(currentPage.value * itemsPerPage.value, totalItems.value))

const goToPreviousPage = () => { if (currentPage.value > 1) currentPage.value-- }
const goToNextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++ }

const clearFilters = () => {
  filterDesde.value = ''
  filterHasta.value = ''
  searchQuery.value = ''
  filterPatente.value = ''
  filterModelo.value = ''
  currentPage.value = 1
}

const activeFilterChips = computed(() => {
  const chips = []
  if (filterDesde.value) chips.push({ label: 'Desde', value: filterDesde.value, field: 'filterDesde' })
  if (filterHasta.value) chips.push({ label: 'Hasta', value: filterHasta.value, field: 'filterHasta' })
  if (searchQuery.value) chips.push({ label: 'Búsqueda', value: searchQuery.value, field: 'searchQuery' })
  if (filterPatente.value) chips.push({ label: 'Patente', value: filterPatente.value, field: 'filterPatente' })
  if (filterModelo.value) chips.push({ label: 'Modelo', value: filterModelo.value, field: 'filterModelo' })
  return chips
})

const removeFilter = (field) => {
  if (field === 'filterDesde') filterDesde.value = ''
  if (field === 'filterHasta') filterHasta.value = ''
  if (field === 'searchQuery') searchQuery.value = ''
  if (field === 'filterPatente') filterPatente.value = ''
  if (field === 'filterModelo') filterModelo.value = ''
}

const viewVehicle = (vehicle) => {
  vehicleToView.value = vehicle
  isViewModalOpen.value = true
}

const closeViewModal = () => {
  isViewModalOpen.value = false
  vehicleToView.value = null
}

const formatForInput = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  const offset = d.getTimezoneOffset()
  const adjusted = new Date(d.getTime() - (offset * 60000))
  return adjusted.toISOString().split('T')[0]
}

const editVehicle = (vehicle) => {
  const inferStatusFromDate = (dateStr) => {
    const doc = getDocumentStatus(dateStr)
    return doc.label
  }

  vehicleToEdit.value = vehicle
  formEdit.value = {
    plate: vehicle.plate || '',
    model: vehicle.model || '',
    mileage: vehicle.mileage || 0,
    circulationPermitStatus: inferStatusFromDate(vehicle.circulationPermitExpiresAt),
    circulationPermitExpiresAt: formatForInput(vehicle.circulationPermitExpiresAt),
    technicalReviewStatus: inferStatusFromDate(vehicle.technicalReviewExpiresAt),
    technicalReviewExpiresAt: formatForInput(vehicle.technicalReviewExpiresAt),
    emissionsStatus: inferStatusFromDate(vehicle.emissionsExpiresAt),
    emissionsExpiresAt: formatForInput(vehicle.emissionsExpiresAt),
    insuranceStatus: inferStatusFromDate(vehicle.insuranceExpiresAt),
    insuranceExpiresAt: formatForInput(vehicle.insuranceExpiresAt)
  }
  isEditModalOpen.value = true
}

const closeEditModal = () => {
  isEditModalOpen.value = false
  vehicleToEdit.value = null
}

const saveEdit = async () => {
  if (!vehicleToEdit.value) return
  isLoading.value = true
  try {
    const mapDocDate = (statusStr, dateStr) => {
      if (statusStr === 'No tiene' || !dateStr) return null
      return new Date(`${dateStr}T00:00:00`).toISOString()
    }

    const payload = {
      plate: formEdit.value.plate,
      model: formEdit.value.model,
      mileage: Number(formEdit.value.mileage) || 0,
      circulationPermitExpiresAt: mapDocDate(formEdit.value.circulationPermitStatus, formEdit.value.circulationPermitExpiresAt),
      technicalReviewExpiresAt: mapDocDate(formEdit.value.technicalReviewStatus, formEdit.value.technicalReviewExpiresAt),
      emissionsExpiresAt: mapDocDate(formEdit.value.emissionsStatus, formEdit.value.emissionsExpiresAt),
      insuranceExpiresAt: mapDocDate(formEdit.value.insuranceStatus, formEdit.value.insuranceExpiresAt),
    }

    await api.patch(`/trucks/${vehicleToEdit.value.id}`, payload)
    await loadVehicles()
    closeEditModal()
  } catch (error) {
    console.error('Error updating vehicle:', error)
    alert('Error al actualizar el vehículo')
  } finally {
    isLoading.value = false
  }
}

const deleteVehicle = async () => {
  if (!vehicleToEdit.value) return
  isLoading.value = true
  try {
    await api.delete(`/trucks/${vehicleToEdit.value.id}`)
    await loadVehicles()
    isDeleteConfirmOpen.value = false
    closeEditModal()
  } catch (error) {
    console.error('Error deleting vehicle:', error)
    alert('Error al eliminar el vehículo')
  } finally {
    isLoading.value = false
  }
}

const openAddModal = () => {
  formAdd.value = {
    plate: '',
    model: '',
    mileage: 0,
    circulationPermitStatus: 'No tiene',
    circulationPermitExpiresAt: '',
    technicalReviewStatus: 'No tiene',
    technicalReviewExpiresAt: '',
    emissionsStatus: 'No tiene',
    emissionsExpiresAt: '',
    insuranceStatus: 'No tiene',
    insuranceExpiresAt: '',
  }
  isAddModalOpen.value = true
}
const closeAddModal = () => { isAddModalOpen.value = false }

const saveAdd = async () => {
  if (!formAdd.value.plate || !formAdd.value.model) return
  isLoading.value = true
  try {
    const mapDocDate = (statusStr, dateStr) => {
      if (statusStr === 'No tiene' || !dateStr) return null
      return new Date(`${dateStr}T00:00:00`).toISOString()
    }
    await api.post('/trucks', {
      plate: formAdd.value.plate.toUpperCase(),
      model: formAdd.value.model,
      mileage: Number(formAdd.value.mileage) || 0,
      circulationPermitExpiresAt: mapDocDate(formAdd.value.circulationPermitStatus, formAdd.value.circulationPermitExpiresAt),
      technicalReviewExpiresAt: mapDocDate(formAdd.value.technicalReviewStatus, formAdd.value.technicalReviewExpiresAt),
      emissionsExpiresAt: mapDocDate(formAdd.value.emissionsStatus, formAdd.value.emissionsExpiresAt),
      insuranceExpiresAt: mapDocDate(formAdd.value.insuranceStatus, formAdd.value.insuranceExpiresAt),
    })
    await loadVehicles()
    closeAddModal()
  } catch (error) {
    console.error('Error creating vehicle:', error)
    alert('Error al crear el vehículo')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadVehicles()
})
</script>

<template>
  <div class="h-screen min-h-0 overflow-hidden bg-background flex flex-col font-sans">
    <div class="shrink-0 bg-white shadow-sm border-b border-gray-200">
      <div class="px-4 py-4 flex items-center justify-between">
        <router-link to="/" class="flex items-center">
          <img :src="logoCompleto" alt="Transportes Flores Vargas" class="h-16 w-auto object-contain hover:opacity-80 transition-opacity" />
        </router-link>
        <UserMenu />
      </div>
    </div>

    <div class="flex flex-1 min-h-0 overflow-hidden min-w-0">
      <DashboardSidebar />

      <main class="flex-1 min-h-0 pt-4 pb-10 pl-4 pr-3 sm:pr-6 lg:pr-8 overflow-y-auto flex flex-col min-w-0">
        <div class="mb-3 pl-0 shrink-0">
          <button @click="router.back()" class="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary transition-colors">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Volver
          </button>
        </div>
        <div class="flex gap-6 w-full h-full min-h-0 min-w-0">

          <div :class="[
            'bg-white rounded-[2rem] border-2 border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden transition-all duration-300 relative min-w-0',
            isFilterOpen ? 'sm:max-w-[calc(100%-23rem)]' : 'w-full'
          ]">

            <div class="flex flex-col md:flex-row items-center justify-center p-4 sm:p-8 pb-4 sm:pb-6 relative min-h-[4rem] sm:min-h-[5rem] gap-3 md:gap-0">
               <h1 class="text-xl sm:text-2xl md:text-3xl font-titles font-extrabold text-slate-900 tracking-tight text-center order-1 md:absolute md:left-1/2 md:-translate-x-1/2">Administración de Vehículos</h1>

               <div class="order-2 flex items-center gap-2 md:absolute md:right-4 md:top-6 lg:right-8">
                 <button
                   @click="openAddModal"
                   class="flex items-center gap-2 bg-[#0B2545] hover:bg-[#133A6D] text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-all hover:-translate-y-0.5 active:scale-95 shadow-sm"
                 >
                   <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                     <line x1="12" y1="5" x2="12" y2="19"></line>
                     <line x1="5" y1="12" x2="19" y2="12"></line>
                   </svg>
                   Añadir patente
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

            <div class="flex-1 w-full overflow-x-auto overflow-y-auto px-3 sm:px-6 md:px-10 md:pr-10 relative pb-6 min-w-0 custom-scrollbar">
              <table class="w-full text-sm border-collapse min-w-[1000px]">
                <thead class="bg-white sticky top-0 z-10 shadow-sm border-b border-gray-100">
                  <tr>
                    <th class="py-3 px-3 text-center font-bold text-slate-700 border border-gray-300">Patente</th>
                    <th class="py-3 px-3 text-center font-bold text-slate-700 border border-gray-300">Modelo</th>
                    <th class="py-3 px-3 text-center font-bold text-slate-700 border border-gray-300">Kilometraje</th>
                    <th class="py-3 px-3 text-center font-bold text-slate-700 border border-gray-300">Usuarios</th>
                    <th class="py-3 px-3 text-center font-bold text-slate-700 border border-gray-300 leading-tight">Permiso de<br>circulación</th>
                    <th class="py-3 px-3 text-center font-bold text-slate-700 border border-gray-300 leading-tight">Revisión<br>técnica</th>
                    <th class="py-3 px-3 text-center font-bold text-slate-700 border border-gray-300 leading-tight">Emisión<br>contaminante</th>
                    <th class="py-3 px-3 text-center font-bold text-slate-700 border border-gray-300 leading-tight">Seguro<br>obligatorio</th>
                    <th class="py-3 px-3 text-center font-bold text-slate-700 border border-gray-300">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="isLoading">
                    <td colspan="9" class="py-8 text-center text-slate-400 text-sm border border-gray-300">
                      Cargando vehículos...
                    </td>
                  </tr>
                  <tr v-else-if="paginatedVehicles.length === 0">
                    <td colspan="9" class="py-8 text-center text-slate-400 text-sm border border-gray-300">
                      No hay vehículos que coincidan con los filtros.
                    </td>
                  </tr>
                  <tr v-else v-for="vehicle in paginatedVehicles" :key="vehicle.id" class="hover:bg-slate-50 transition-colors">
                    <td class="py-4 px-3 text-center text-slate-500 font-medium text-xs border border-gray-300">{{ vehicle.plate }}</td>
                    <td class="py-4 px-3 text-center text-slate-500 font-medium text-xs border border-gray-300">{{ vehicle.model }}</td>
                    <td class="py-4 px-3 text-center text-slate-500 font-medium text-xs border border-gray-300">{{ vehicle.mileage != null ? Math.floor(vehicle.mileage) : 0 }}</td>
                    <td class="py-4 px-3 text-center border border-gray-300">
                      <div class="flex flex-col items-center justify-center gap-1">
                        <div class="flex -space-x-2">
                          <template v-if="vehicle.users && vehicle.users.length > 0">
                            <div v-for="(assignment, i) in vehicle.users.slice(0, 3)" :key="assignment.userId" 
                                 class="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white z-10 hover:z-20 transition-all"
                                 :class="i === 0 ? 'bg-[#0B2545]' : i === 1 ? 'bg-[#133A6D]' : 'bg-[#1a4d80]'"
                                 :title="assignment.user?.name || assignment.user?.email">
                              {{ getInitials(assignment.user?.name, assignment.user?.email) }}
                            </div>
                            <div v-if="vehicle.users.length > 3" class="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold bg-gray-200 text-gray-700 z-0">
                              +{{ vehicle.users.length - 3 }}
                            </div>
                          </template>
                          <span v-else class="text-xs text-gray-400">N/A</span>
                        </div>
                        <span v-if="vehicle.users && vehicle.users.length > 0" class="text-[10px] font-semibold text-gray-400 mt-0.5">
                          {{ vehicle.users.length }} Conductor{{ vehicle.users.length === 1 ? '' : 'es' }}
                        </span>
                      </div>
                    </td>
                            <td class="py-4 px-3 text-center border border-gray-300">
                      <div class="w-full h-full flex items-center justify-center">
                        <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-transparent shadow-sm whitespace-nowrap min-w-[125px] justify-center"
                             :class="getDocumentStatus(vehicle.circulationPermitStatus, vehicle.circulationPermitExpiresAt).label === 'No tiene' ? 'bg-gray-400 text-white' : getDocumentStatus(vehicle.circulationPermitStatus, vehicle.circulationPermitExpiresAt).isExpiringSoon ? 'bg-orange-400 text-white' : getDocumentStatus(vehicle.circulationPermitStatus, vehicle.circulationPermitExpiresAt).isVigente ? 'bg-[#3b8e53] text-white' : 'bg-[#A61919] text-white'">
                          <svg v-if="!getDocumentStatus(vehicle.circulationPermitStatus, vehicle.circulationPermitExpiresAt).isExpiringSoon && getDocumentStatus(vehicle.circulationPermitStatus, vehicle.circulationPermitExpiresAt).isVigente" class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          <svg v-else-if="getDocumentStatus(vehicle.circulationPermitStatus, vehicle.circulationPermitExpiresAt).isExpiringSoon" class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                          <svg v-else class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          <div class="flex flex-col items-start leading-[1.1] text-left">
                            <span class="text-[11px] font-bold">{{ getDocumentStatus(vehicle.circulationPermitStatus, vehicle.circulationPermitExpiresAt).label }}</span>
                            <span class="text-[9px] opacity-90">({{ getDocumentStatus(vehicle.circulationPermitStatus, vehicle.circulationPermitExpiresAt).text }})</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="py-4 px-3 text-center border border-gray-300">
                      <div class="w-full h-full flex items-center justify-center">
                        <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-transparent shadow-sm whitespace-nowrap min-w-[125px] justify-center"
                             :class="getDocumentStatus(vehicle.technicalReviewStatus, vehicle.technicalReviewExpiresAt).label === 'No tiene' ? 'bg-gray-400 text-white' : getDocumentStatus(vehicle.technicalReviewStatus, vehicle.technicalReviewExpiresAt).isExpiringSoon ? 'bg-orange-400 text-white' : getDocumentStatus(vehicle.technicalReviewStatus, vehicle.technicalReviewExpiresAt).isVigente ? 'bg-[#3b8e53] text-white' : 'bg-[#A61919] text-white'">
                          <svg v-if="!getDocumentStatus(vehicle.technicalReviewStatus, vehicle.technicalReviewExpiresAt).isExpiringSoon && getDocumentStatus(vehicle.technicalReviewStatus, vehicle.technicalReviewExpiresAt).isVigente" class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          <svg v-else-if="getDocumentStatus(vehicle.technicalReviewStatus, vehicle.technicalReviewExpiresAt).isExpiringSoon" class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                          <svg v-else class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          <div class="flex flex-col items-start leading-[1.1] text-left">
                            <span class="text-[11px] font-bold">{{ getDocumentStatus(vehicle.technicalReviewStatus, vehicle.technicalReviewExpiresAt).label }}</span>
                            <span class="text-[9px] opacity-90">({{ getDocumentStatus(vehicle.technicalReviewStatus, vehicle.technicalReviewExpiresAt).text }})</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="py-4 px-3 text-center border border-gray-300">
                      <div class="w-full h-full flex items-center justify-center">
                        <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-transparent shadow-sm whitespace-nowrap min-w-[125px] justify-center"
                             :class="getDocumentStatus(vehicle.emissionsStatus, vehicle.emissionsExpiresAt).label === 'No tiene' ? 'bg-gray-400 text-white' : getDocumentStatus(vehicle.emissionsStatus, vehicle.emissionsExpiresAt).isExpiringSoon ? 'bg-orange-400 text-white' : getDocumentStatus(vehicle.emissionsStatus, vehicle.emissionsExpiresAt).isVigente ? 'bg-[#3b8e53] text-white' : 'bg-[#A61919] text-white'">
                          <svg v-if="!getDocumentStatus(vehicle.emissionsStatus, vehicle.emissionsExpiresAt).isExpiringSoon && getDocumentStatus(vehicle.emissionsStatus, vehicle.emissionsExpiresAt).isVigente" class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          <svg v-else-if="getDocumentStatus(vehicle.emissionsStatus, vehicle.emissionsExpiresAt).isExpiringSoon" class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                          <svg v-else class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          <div class="flex flex-col items-start leading-[1.1] text-left">
                            <span class="text-[11px] font-bold">{{ getDocumentStatus(vehicle.emissionsStatus, vehicle.emissionsExpiresAt).label }}</span>
                            <span class="text-[9px] opacity-90">({{ getDocumentStatus(vehicle.emissionsStatus, vehicle.emissionsExpiresAt).text }})</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="py-4 px-3 text-center border border-gray-300">
                      <div class="w-full h-full flex items-center justify-center">
                        <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-transparent shadow-sm whitespace-nowrap min-w-[125px] justify-center"
                             :class="getDocumentStatus(vehicle.insuranceStatus, vehicle.insuranceExpiresAt).label === 'No tiene' ? 'bg-gray-400 text-white' : getDocumentStatus(vehicle.insuranceStatus, vehicle.insuranceExpiresAt).isExpiringSoon ? 'bg-orange-400 text-white' : getDocumentStatus(vehicle.insuranceStatus, vehicle.insuranceExpiresAt).isVigente ? 'bg-[#3b8e53] text-white' : 'bg-[#A61919] text-white'">
                          <svg v-if="!getDocumentStatus(vehicle.insuranceStatus, vehicle.insuranceExpiresAt).isExpiringSoon && getDocumentStatus(vehicle.insuranceStatus, vehicle.insuranceExpiresAt).isVigente" class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          <svg v-else-if="getDocumentStatus(vehicle.insuranceStatus, vehicle.insuranceExpiresAt).isExpiringSoon" class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                          <svg v-else class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          <div class="flex flex-col items-start leading-[1.1] text-left">
                            <span class="text-[11px] font-bold">{{ getDocumentStatus(vehicle.insuranceStatus, vehicle.insuranceExpiresAt).label }}</span>
                            <span class="text-[9px] opacity-90">({{ getDocumentStatus(vehicle.insuranceStatus, vehicle.insuranceExpiresAt).text }})</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td class="py-4 px-3 text-center border border-gray-300 whitespace-nowrap">
                      <div class="flex items-center justify-center gap-1">
                        <button @click="viewVehicle(vehicle)" class="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-slate-800 transition-colors bg-white rounded-full px-3 py-1.5 shadow-sm border border-gray-200">
                          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                          </svg>
                          Ver
                        </button>
                        <button @click="editVehicle(vehicle)" class="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-slate-800 transition-colors bg-white rounded-full px-3 py-1.5 shadow-sm border border-gray-200">
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

            <div class="px-3 sm:px-6 md:px-10 md:pr-10 py-4 sm:py-5 bg-white flex flex-wrap justify-between items-center gap-2 text-xs font-semibold text-slate-500 border-t border-gray-100 mt-auto rounded-b-3xl">
              <div class="flex items-center gap-3">
                <span>Filas por páginas</span>
                <div class="relative">
                  <select v-model.number="itemsPerPage" class="appearance-none border border-slate-300 rounded px-2 py-1 pr-6 bg-white outline-none focus:border-primary cursor-pointer text-slate-700">
                    <option :value="100">100</option>
                  </select>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>
              <div class="flex items-center gap-6">
                <span>{{ firstVisibleRow }}-{{ lastVisibleRow }} de {{ totalItems }}</span>
                <div class="flex items-center gap-2">
                  <button @click="goToPreviousPage" :disabled="currentPage <= 1 || isLoading" class="p-1 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-40 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <button @click="goToNextPage" :disabled="currentPage >= totalPages || isLoading" class="p-1 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-40 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Backdrop móvil -->
          <div v-if="isFilterOpen" class="fixed inset-0 bg-black/30 z-40 sm:hidden" @click="isFilterOpen = false" />

          <Transition name="slide">
            <div v-show="isFilterOpen" class="fixed inset-x-0 bottom-0 top-[88px] z-50 sm:fixed md:relative md:inset-x-auto md:bottom-auto md:top-0 md:max-h-[calc(100vh-220px)] md:w-[22rem] md:self-start md:mt-0 md:z-20 bg-[#EBEBEB] md:rounded-[2rem] rounded-t-[2rem] border border-gray-300 shadow-sm flex flex-col p-6 md:shrink-0 overflow-y-auto">
              <div class="relative flex w-full min-h-[2.5rem] items-center mb-2">
                <div class="w-10 shrink-0 sm:w-0 sm:min-w-0" aria-hidden="true" />
                <h2 class="text-2xl font-titles font-extrabold text-[#1b2533] flex-1 text-center">Filtros</h2>
                <button
                  type="button"
                  @click.stop="isFilterOpen = false"
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-700 sm:hidden touch-manipulation hover:bg-black/[0.06] active:bg-black/10"
                  title="Cerrar filtros"
                  aria-label="Cerrar filtros"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <line x1="8" y1="5" x2="8" y2="19"></line>
                    <line x1="16" y1="5" x2="16" y2="19"></line>
                    <line x1="5" y1="10" x2="11" y2="10"></line>
                    <line x1="13" y1="14" x2="19" y2="14"></line>
                  </svg>
                </button>
              </div>

              <div class="flex flex-col gap-4 mb-6 relative">

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

            <div class="flex flex-col gap-6 mt-4">
              
              <div class="grid grid-cols-2 gap-4">
                <div class="flex flex-col relative w-full">
                  <div class="z-10 bg-[#DADBDB] w-fit px-1 absolute -top-2 left-2 text-[10px] text-gray-500 font-bold ml-1 mb-0.5">Desde</div>
                  <div class="relative w-full">
                    <input type="date" v-model="filterDesde" class="text-[11px] px-3 py-2.5 pr-10 w-full rounded-xl border border-[#b2b2b2] bg-transparent text-gray-600 outline-none focus:border-primary hover:border-gray-500 transition-colors appearance-none" />
                    <svg width="14" height="14" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  </div>
                </div>
                <div class="flex flex-col relative w-full">
                  <div class="text-[10px] text-gray-500 font-bold ml-1 mb-0.5 z-10 bg-[#DADBDB] w-fit px-1 absolute -top-2 left-2">Hasta</div>
                  <div class="relative w-full">
                    <input type="date" v-model="filterHasta" class="text-[11px] px-3 py-2.5 pr-10 w-full rounded-xl border border-[#b2b2b2] bg-transparent text-gray-600 outline-none focus:border-primary hover:border-gray-500 transition-colors appearance-none" />
                    <svg width="14" height="14" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  </div>
                </div>
              </div>

              <div class="flex flex-col relative mt-2">
                <div class="text-[10px] text-gray-500 font-bold ml-1 mb-0.5 z-10 bg-[#DADBDB] w-fit px-1 absolute -top-2 left-2">Usuarios</div>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  </div>
                  <input type="text" v-model="searchQuery" placeholder="Escribe el nombre..."
                    class="pl-8 pr-3 py-2.5 text-[11px] w-full rounded-xl border border-[#b2b2b2] bg-transparent text-gray-700 outline-none hover:border-gray-500 focus:border-primary transition-colors placeholder-gray-400" />
                </div>
              </div>

              <div class="flex flex-col relative">
                <div class="text-[10px] text-gray-500 font-bold ml-1 mb-0.5 z-10 bg-[#DADBDB] w-fit px-1 absolute -top-2 left-2">Patentes</div>
                <div class="relative">
                  <select v-model="filterPatente" class="px-3 py-2.5 pr-8 text-[11px] w-full rounded-xl border border-[#b2b2b2] bg-transparent text-gray-600 outline-none hover:border-gray-500 focus:border-primary transition-colors appearance-none cursor-pointer">
                    <option value="">Selecciona la patente...</option>
                    <option v-for="plate in uniquePlates" :key="plate" :value="plate">{{ plate }}</option>
                  </select>
                  <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>
                </div>
              </div>
              
              <div class="flex flex-col relative">
                <div class="text-[10px] text-gray-500 font-bold ml-1 mb-0.5 z-10 bg-[#DADBDB] w-fit px-1 absolute -top-2 left-2">Modelo</div>
                <div class="relative">
                  <select v-model="filterModelo" class="px-3 py-2.5 pr-8 text-[11px] w-full rounded-xl border border-[#b2b2b2] bg-transparent text-gray-600 outline-none hover:border-gray-500 focus:border-primary transition-colors appearance-none cursor-pointer">
                    <option value="">Selecciona el modelo...</option>
                    <option v-for="model in uniqueModels" :key="model" :value="model">{{ model }}</option>
                  </select>
                  <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>
                </div>
              </div>

              <div class="mt-6 flex justify-end">
                <button class="px-6 py-2.5 bg-[#A61919] text-white text-xs rounded-xl font-bold shadow-sm hover:bg-red-800 transition-all w-28">
                  Aplicar
                </button>
              </div>
            </div>
          </div>
          </Transition>
          
        </div>
      </main>
    </div>

    <Teleport to="body">
      <div v-if="isEditModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
        <div class="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-y-auto max-h-[90vh] border border-gray-200 relative" @click.stop>
          <div class="px-8 pt-8 pb-4 flex justify-between items-start border-b border-gray-100">
            <div>
              <h3 class="text-2xl font-titles font-extrabold text-slate-800">Actualizar Documentos</h3>
              <p class="text-sm font-medium text-slate-500 mt-1">
                Vehículo: 
                <span class="font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded ml-1">{{ vehicleToEdit?.plate }}</span>
              </p>
            </div>
            <button @click="closeEditModal" class="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-xl transition-colors outline-none cursor-pointer">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <div class="px-8 py-6 max-h-[60vh] overflow-y-auto">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Patente</label>
                <input v-model="formEdit.plate" type="text" class="w-full text-sm font-semibold rounded-xl border border-gray-300 px-4 py-2 bg-white text-slate-700 outline-none focus:border-primary hover:border-gray-400 uppercase" />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Modelo</label>
                <input v-model="formEdit.model" type="text" class="w-full text-sm font-semibold rounded-xl border border-gray-300 px-4 py-2 bg-white text-slate-700 outline-none focus:border-primary hover:border-gray-400" />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Kilometraje</label>
                <input v-model.number="formEdit.mileage" type="number" min="0" class="w-full text-sm font-semibold rounded-xl border border-gray-300 px-4 py-2 bg-white text-slate-700 outline-none focus:border-primary hover:border-gray-400" />
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div class="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col gap-3">
                <label class="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Permiso de circulación</label>
                <select v-model="formEdit.circulationPermitStatus" class="w-full text-sm font-semibold rounded-xl border border-gray-300 px-4 py-2 bg-white text-slate-700 outline-none focus:border-primary cursor-pointer hover:border-gray-400">
                  <option value="No tiene">No tiene</option>
                  <option value="Vigente">Vigente</option>
                  <option value="Por vencer">Por vencer</option>
                  <option value="Vencido">Vencido</option>
                </select>
                <div class="relative w-full overflow-hidden transition-all duration-300" :class="formEdit.circulationPermitStatus === 'No tiene' ? 'h-0 opacity-0' : 'h-10 opacity-100'">
                  <input type="date" v-model="formEdit.circulationPermitExpiresAt" class="w-full absolute inset-0 text-sm font-semibold rounded-xl border border-gray-300 px-4 py-2 bg-white text-slate-700 outline-none focus:border-primary hover:border-gray-400 uppercase" />
                </div>
              </div>

              <div class="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col gap-3">
                <label class="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Revisión técnica</label>
                <select v-model="formEdit.technicalReviewStatus" class="w-full text-sm font-semibold rounded-xl border border-gray-300 px-4 py-2 bg-white text-slate-700 outline-none focus:border-primary cursor-pointer hover:border-gray-400">
                  <option value="No tiene">No tiene</option>
                  <option value="Vigente">Vigente</option>
                  <option value="Por vencer">Por vencer</option>
                  <option value="Vencido">Vencido</option>
                </select>
                <div class="relative w-full overflow-hidden transition-all duration-300" :class="formEdit.technicalReviewStatus === 'No tiene' ? 'h-0 opacity-0' : 'h-10 opacity-100'">
                  <input type="date" v-model="formEdit.technicalReviewExpiresAt" class="w-full absolute inset-0 text-sm font-semibold rounded-xl border border-gray-300 px-4 py-2 bg-white text-slate-700 outline-none focus:border-primary hover:border-gray-400 uppercase" />
                </div>
              </div>

              <div class="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col gap-3">
                <label class="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Emisión contaminante</label>
                <select v-model="formEdit.emissionsStatus" class="w-full text-sm font-semibold rounded-xl border border-gray-300 px-4 py-2 bg-white text-slate-700 outline-none focus:border-primary cursor-pointer hover:border-gray-400">
                  <option value="No tiene">No tiene</option>
                  <option value="Vigente">Vigente</option>
                  <option value="Por vencer">Por vencer</option>
                  <option value="Vencido">Vencido</option>
                </select>
                <div class="relative w-full overflow-hidden transition-all duration-300" :class="formEdit.emissionsStatus === 'No tiene' ? 'h-0 opacity-0' : 'h-10 opacity-100'">
                  <input type="date" v-model="formEdit.emissionsExpiresAt" class="w-full absolute inset-0 text-sm font-semibold rounded-xl border border-gray-300 px-4 py-2 bg-white text-slate-700 outline-none focus:border-primary hover:border-gray-400 uppercase" />
                </div>
              </div>

              <div class="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col gap-3">
                <label class="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Seguro obligatorio</label>
                <select v-model="formEdit.insuranceStatus" class="w-full text-sm font-semibold rounded-xl border border-gray-300 px-4 py-2 bg-white text-slate-700 outline-none focus:border-primary cursor-pointer hover:border-gray-400">
                  <option value="No tiene">No tiene</option>
                  <option value="Vigente">Vigente</option>
                  <option value="Por vencer">Por vencer</option>
                  <option value="Vencido">Vencido</option>
                </select>
                <div class="relative w-full overflow-hidden transition-all duration-300" :class="formEdit.insuranceStatus === 'No tiene' ? 'h-0 opacity-0' : 'h-10 opacity-100'">
                  <input type="date" v-model="formEdit.insuranceExpiresAt" class="w-full absolute inset-0 text-sm font-semibold rounded-xl border border-gray-300 px-4 py-2 bg-white text-slate-700 outline-none focus:border-primary hover:border-gray-400 uppercase" />
                </div>
              </div>

            </div>
          </div>

          <div class="px-6 md:px-8 py-5 border-t border-gray-100 bg-gray-50 flex flex-col md:flex-row md:justify-between md:items-center gap-3">
            <button @click="isDeleteConfirmOpen = true" class="order-2 md:order-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white shadow transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              Borrar patente
            </button>
            <div class="order-1 md:order-2 flex gap-3">
              <button @click="closeEditModal" class="flex-1 md:flex-none justify-center px-6 py-2.5 rounded-xl font-bold bg-white text-slate-600 shadow-sm border border-slate-300 hover:bg-slate-100 transition-colors flex items-center">Cancelar</button>
              <button @click="saveEdit" :disabled="isLoading" class="flex-1 md:flex-none justify-center px-6 py-2.5 rounded-xl font-bold bg-blue-600 text-white shadow hover:bg-blue-800 transition-colors flex items-center gap-2">
                <svg v-if="isLoading" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span>Actualizar</span>
              </button>
            </div>
          </div>

          <!-- Confirmación borrar -->
          <div v-if="isDeleteConfirmOpen" class="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center gap-5 p-8 z-10">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div class="text-center">
              <p class="text-xl font-extrabold text-slate-800">¿Eliminar vehículo?</p>
              <p class="text-base text-slate-500 mt-1">Esta acción no se puede deshacer. Se eliminará <span class="font-bold text-slate-700">{{ vehicleToEdit?.plate }}</span> permanentemente.</p>
            </div>
            <div class="flex gap-3 w-full sm:w-auto justify-center">
              <button @click="isDeleteConfirmOpen = false" class="flex-1 sm:flex-none justify-center px-6 py-2.5 rounded-xl font-bold text-sm bg-white text-slate-600 border border-slate-300 hover:bg-slate-100 transition-colors flex items-center">Cancelar</button>
              <button @click="deleteVehicle" :disabled="isLoading" class="flex-1 sm:flex-none justify-center px-6 py-2.5 rounded-xl font-bold text-sm bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center gap-2">
                <svg v-if="isLoading" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="isAddModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div class="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-y-auto max-h-[90vh] border border-gray-200" @click.stop>
          <div class="px-8 pt-8 pb-4 flex justify-between items-start border-b border-gray-100">
            <div>
              <h3 class="text-2xl font-titles font-extrabold text-slate-800">Añadir patente</h3>
              <p class="text-sm font-medium text-slate-500 mt-1">Registrar nuevo vehículo</p>
            </div>
            <button @click="closeAddModal" class="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-xl transition-colors outline-none cursor-pointer">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div class="px-8 py-6 max-h-[65vh] overflow-y-auto custom-scrollbar">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Patente <span class="text-red-500">*</span></label>
                <input v-model="formAdd.plate" type="text" placeholder="Ej: KZTR-41" class="w-full text-sm font-semibold rounded-xl border border-gray-300 px-4 py-2 bg-white text-slate-700 outline-none focus:border-blue-500 hover:border-gray-400 uppercase" />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Modelo <span class="text-red-500">*</span></label>
                <input v-model="formAdd.model" type="text" placeholder="Ej: Mercedes Sprinter" class="w-full text-sm font-semibold rounded-xl border border-gray-300 px-4 py-2 bg-white text-slate-700 outline-none focus:border-blue-500 hover:border-gray-400" />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Kilometraje</label>
                <input v-model.number="formAdd.mileage" type="number" min="0" placeholder="0" class="w-full text-sm font-semibold rounded-xl border border-gray-300 px-4 py-2 bg-white text-slate-700 outline-none focus:border-blue-500 hover:border-gray-400" />
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col gap-3">
                <label class="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Permiso de circulación</label>
                <select v-model="formAdd.circulationPermitStatus" class="w-full text-sm font-semibold rounded-xl border border-gray-300 px-4 py-2 bg-white text-slate-700 outline-none focus:border-blue-500 cursor-pointer hover:border-gray-400">
                  <option value="No tiene">No tiene</option>
                  <option value="Vigente">Vigente</option>
                  <option value="Por vencer">Por vencer</option>
                  <option value="Vencido">Vencido</option>
                </select>
                <div class="relative w-full overflow-hidden transition-all duration-300" :class="formAdd.circulationPermitStatus === 'No tiene' ? 'h-0 opacity-0' : 'h-10 opacity-100'">
                  <input type="date" v-model="formAdd.circulationPermitExpiresAt" class="w-full absolute inset-0 text-sm font-semibold rounded-xl border border-gray-300 px-4 py-2 bg-white text-slate-700 outline-none focus:border-blue-500 hover:border-gray-400 uppercase" />
                </div>
              </div>
              <div class="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col gap-3">
                <label class="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Revisión técnica</label>
                <select v-model="formAdd.technicalReviewStatus" class="w-full text-sm font-semibold rounded-xl border border-gray-300 px-4 py-2 bg-white text-slate-700 outline-none focus:border-blue-500 cursor-pointer hover:border-gray-400">
                  <option value="No tiene">No tiene</option>
                  <option value="Vigente">Vigente</option>
                  <option value="Por vencer">Por vencer</option>
                  <option value="Vencido">Vencido</option>
                </select>
                <div class="relative w-full overflow-hidden transition-all duration-300" :class="formAdd.technicalReviewStatus === 'No tiene' ? 'h-0 opacity-0' : 'h-10 opacity-100'">
                  <input type="date" v-model="formAdd.technicalReviewExpiresAt" class="w-full absolute inset-0 text-sm font-semibold rounded-xl border border-gray-300 px-4 py-2 bg-white text-slate-700 outline-none focus:border-blue-500 hover:border-gray-400 uppercase" />
                </div>
              </div>
              <div class="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col gap-3">
                <label class="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Emisión contaminante</label>
                <select v-model="formAdd.emissionsStatus" class="w-full text-sm font-semibold rounded-xl border border-gray-300 px-4 py-2 bg-white text-slate-700 outline-none focus:border-blue-500 cursor-pointer hover:border-gray-400">
                  <option value="No tiene">No tiene</option>
                  <option value="Vigente">Vigente</option>
                  <option value="Por vencer">Por vencer</option>
                  <option value="Vencido">Vencido</option>
                </select>
                <div class="relative w-full overflow-hidden transition-all duration-300" :class="formAdd.emissionsStatus === 'No tiene' ? 'h-0 opacity-0' : 'h-10 opacity-100'">
                  <input type="date" v-model="formAdd.emissionsExpiresAt" class="w-full absolute inset-0 text-sm font-semibold rounded-xl border border-gray-300 px-4 py-2 bg-white text-slate-700 outline-none focus:border-blue-500 hover:border-gray-400 uppercase" />
                </div>
              </div>
              <div class="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col gap-3">
                <label class="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Seguro obligatorio</label>
                <select v-model="formAdd.insuranceStatus" class="w-full text-sm font-semibold rounded-xl border border-gray-300 px-4 py-2 bg-white text-slate-700 outline-none focus:border-blue-500 cursor-pointer hover:border-gray-400">
                  <option value="No tiene">No tiene</option>
                  <option value="Vigente">Vigente</option>
                  <option value="Por vencer">Por vencer</option>
                  <option value="Vencido">Vencido</option>
                </select>
                <div class="relative w-full overflow-hidden transition-all duration-300" :class="formAdd.insuranceStatus === 'No tiene' ? 'h-0 opacity-0' : 'h-10 opacity-100'">
                  <input type="date" v-model="formAdd.insuranceExpiresAt" class="w-full absolute inset-0 text-sm font-semibold rounded-xl border border-gray-300 px-4 py-2 bg-white text-slate-700 outline-none focus:border-blue-500 hover:border-gray-400 uppercase" />
                </div>
              </div>
            </div>
          </div>
          <div class="px-6 md:px-8 py-5 border-t border-gray-100 bg-gray-50 flex gap-3 justify-end">
            <button @click="closeAddModal" class="flex-1 md:flex-none justify-center px-6 py-2.5 rounded-xl font-bold bg-white text-slate-600 shadow-sm border border-slate-300 hover:bg-slate-100 transition-colors flex items-center">Cancelar</button>
            <button @click="saveAdd" :disabled="isLoading || !formAdd.plate || !formAdd.model" class="flex-1 md:flex-none justify-center px-6 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shadow transition-colors flex items-center gap-2">
              <svg v-if="isLoading" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Guardar
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="isViewModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
        <div class="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-y-auto max-h-[90vh] border border-gray-200" @click.stop>
          <div class="px-8 pt-8 pb-4 flex justify-between items-start border-b border-gray-100">
            <div>
              <h3 class="text-2xl font-titles font-extrabold text-slate-800">Detalles de Documentos</h3>
              <p class="text-sm font-medium text-slate-500 mt-1">
                Vehículo: 
                <span class="font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded ml-1">{{ vehicleToView?.plate }}</span>
              </p>
            </div>
            <button @click="closeViewModal" class="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-xl transition-colors outline-none cursor-pointer">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <div class="px-8 py-6 max-h-[60vh] overflow-y-auto">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div class="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col gap-3 relative overflow-hidden">
                <div class="absolute right-0 top-0 h-full w-1" :class="getDocumentStatus(vehicleToView?.circulationPermitStatus, vehicleToView?.circulationPermitExpiresAt).label === 'No tiene' ? 'bg-gray-400' : getDocumentStatus(vehicleToView?.circulationPermitStatus, vehicleToView?.circulationPermitExpiresAt).isExpiringSoon ? 'bg-orange-400' : getDocumentStatus(vehicleToView?.circulationPermitStatus, vehicleToView?.circulationPermitExpiresAt).isVigente ? 'bg-[#3b8e53]' : 'bg-[#A61919]'"></div>
                <label class="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Permiso de circulación</label>
                <div class="text-sm font-semibold rounded-xl border border-gray-200 px-4 py-2 bg-white text-slate-700">
                  {{ getDocumentStatus(vehicleToView?.circulationPermitStatus, vehicleToView?.circulationPermitExpiresAt).label }}
                </div>
                <div v-if="vehicleToView?.circulationPermitExpiresAt" class="text-sm font-semibold rounded-xl border border-gray-200 px-4 py-2 bg-white text-slate-700">
                  Vence: {{ getDocumentStatus(vehicleToView?.circulationPermitStatus, vehicleToView?.circulationPermitExpiresAt).text }}
                </div>
              </div>

              <div class="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col gap-3 relative overflow-hidden">
                <div class="absolute right-0 top-0 h-full w-1" :class="getDocumentStatus(vehicleToView?.technicalReviewStatus, vehicleToView?.technicalReviewExpiresAt).label === 'No tiene' ? 'bg-gray-400' : getDocumentStatus(vehicleToView?.technicalReviewStatus, vehicleToView?.technicalReviewExpiresAt).isExpiringSoon ? 'bg-orange-400' : getDocumentStatus(vehicleToView?.technicalReviewStatus, vehicleToView?.technicalReviewExpiresAt).isVigente ? 'bg-[#3b8e53]' : 'bg-[#A61919]'"></div>
                <label class="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Revisión técnica</label>
                <div class="text-sm font-semibold rounded-xl border border-gray-200 px-4 py-2 bg-white text-slate-700">
                  {{ getDocumentStatus(vehicleToView?.technicalReviewStatus, vehicleToView?.technicalReviewExpiresAt).label }}
                </div>
                <div v-if="vehicleToView?.technicalReviewExpiresAt" class="text-sm font-semibold rounded-xl border border-gray-200 px-4 py-2 bg-white text-slate-700">
                  Vence: {{ getDocumentStatus(vehicleToView?.technicalReviewStatus, vehicleToView?.technicalReviewExpiresAt).text }}
                </div>
              </div>

              <div class="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col gap-3 relative overflow-hidden">
                <div class="absolute right-0 top-0 h-full w-1" :class="getDocumentStatus(vehicleToView?.emissionsStatus, vehicleToView?.emissionsExpiresAt).label === 'No tiene' ? 'bg-gray-400' : getDocumentStatus(vehicleToView?.emissionsStatus, vehicleToView?.emissionsExpiresAt).isExpiringSoon ? 'bg-orange-400' : getDocumentStatus(vehicleToView?.emissionsStatus, vehicleToView?.emissionsExpiresAt).isVigente ? 'bg-[#3b8e53]' : 'bg-[#A61919]'"></div>
                <label class="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Emisión contaminante</label>
                <div class="text-sm font-semibold rounded-xl border border-gray-200 px-4 py-2 bg-white text-slate-700">
                  {{ getDocumentStatus(vehicleToView?.emissionsStatus, vehicleToView?.emissionsExpiresAt).label }}
                </div>
                <div v-if="vehicleToView?.emissionsExpiresAt" class="text-sm font-semibold rounded-xl border border-gray-200 px-4 py-2 bg-white text-slate-700">
                  Vence: {{ getDocumentStatus(vehicleToView?.emissionsStatus, vehicleToView?.emissionsExpiresAt).text }}
                </div>
              </div>

              <div class="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col gap-3 relative overflow-hidden">
                <div class="absolute right-0 top-0 h-full w-1" :class="getDocumentStatus(vehicleToView?.insuranceStatus, vehicleToView?.insuranceExpiresAt).label === 'No tiene' ? 'bg-gray-400' : getDocumentStatus(vehicleToView?.insuranceStatus, vehicleToView?.insuranceExpiresAt).isExpiringSoon ? 'bg-orange-400' : getDocumentStatus(vehicleToView?.insuranceStatus, vehicleToView?.insuranceExpiresAt).isVigente ? 'bg-[#3b8e53]' : 'bg-[#A61919]'"></div>
                <label class="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Seguro obligatorio</label>
                <div class="text-sm font-semibold rounded-xl border border-gray-200 px-4 py-2 bg-white text-slate-700">
                  {{ getDocumentStatus(vehicleToView?.insuranceExpiresAt).label }}
                </div>
                <div v-if="vehicleToView?.insuranceExpiresAt" class="text-sm font-semibold rounded-xl border border-gray-200 px-4 py-2 bg-white text-slate-700">
                  Vence: {{ getDocumentStatus(vehicleToView?.insuranceExpiresAt).text }}
                </div>
              </div>

            </div>
          </div>

          <div class="px-6 md:px-8 py-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
            <button @click="closeViewModal" class="w-full md:w-auto justify-center px-6 py-2.5 rounded-xl font-bold bg-white text-slate-600 shadow-sm border border-slate-300 hover:bg-slate-100 transition-colors flex items-center">Cerrar</button>
          </div>
        </div>
      </div>
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

.custom-scrollbar::-webkit-scrollbar { height: 8px; width: 8px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.15); border-radius: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 0, 0, 0.3); }

input[type="date"]::-webkit-calendar-picker-indicator {
  opacity: 0;
  cursor: pointer;
  z-index: 10;
  position: absolute;
  right: 8px;
  width: 24px;
  height: 24px;
}
</style>
