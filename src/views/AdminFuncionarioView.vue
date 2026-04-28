<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import logoCompleto from '@/assets/images/Logo-completo.png'
import DashboardSidebar from '@/components/DashboardSidebar.vue'
import UserMenu from '@/components/UserMenu.vue'
import api from '@/services/axios'

const router = useRouter()

// ── Estado principal ────────────────────────────────────────────────────────
const funcionarios = ref([])
const isLoading = ref(false)
const loadError = ref('')

const searchQuery = ref('')
const itemsPerPage = ref(10)
const currentPage = ref(1)

// ── Modales ─────────────────────────────────────────────────────────────────
const isAddModalOpen = ref(false)
const isEditModalOpen = ref(false)
const isDeleteConfirmOpen = ref(false)
const isSaving = ref(false)
const isDeleting = ref(false)

const addForm = ref({ name: '' })
const addError = ref('')
const addSuccess = ref('')

const editForm = ref({ id: null, name: '', active: true })
const editError = ref('')
const editSuccess = ref('')

const selectedFuncionario = ref(null)
const deleteError = ref('')
const isConflict = ref(false)

// ── Helpers ─────────────────────────────────────────────────────────────────
const normalize = (v) =>
  String(v || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const mapUserFromApi = (u) => ({
  id: u?.id ?? null,
  name: u?.name || 'Sin nombre',
  email: u?.email || '',
  phone: u?.phone || '',
  role: u?.role || 'EMPLOYEE',
})

// ── Carga de datos ──────────────────────────────────────────────────────────
const loadFuncionarios = async () => {
  isLoading.value = true
  loadError.value = ''
  try {
    const { data } = await api.get('/employees/all')
    const payload = Array.isArray(data) ? data : []
    funcionarios.value = payload.map((u) => ({
      id: u.id,
      name: u.name,
      email: '',
      phone: '',
      role: 'EMPLOYEE',
      verified: true,
      active: u.active,
    }))
  } catch (error) {
    const msg = error.response?.data?.message
    if (error.response?.status === 401) loadError.value = 'Tu sesión ya no es válida.'
    else if (error.response?.status === 403) loadError.value = 'No tienes permisos para gestionar funcionarios.'
    else loadError.value = Array.isArray(msg) ? msg.join(', ') : msg || 'No se pudieron cargar los funcionarios.'
    funcionarios.value = []
  } finally {
    isLoading.value = false
  }
}

// ── Filtrado y paginación ───────────────────────────────────────────────────
const filteredFuncionarios = computed(() => {
  const q = normalize(searchQuery.value)
  return funcionarios.value.filter((f) =>
    !q || normalize(f.name).includes(q) || normalize(f.email).includes(q)
  )
})

const totalItems = computed(() => filteredFuncionarios.value.length)
const totalPages = computed(() => Math.max(Math.ceil(totalItems.value / itemsPerPage.value), 1))
const pagedFuncionarios = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredFuncionarios.value.slice(start, start + itemsPerPage.value)
})
const firstRow = computed(() => (totalItems.value === 0 ? 0 : (currentPage.value - 1) * itemsPerPage.value + 1))
const lastRow = computed(() => Math.min(currentPage.value * itemsPerPage.value, totalItems.value))

watch([searchQuery, itemsPerPage], () => { currentPage.value = 1 })
const prevPage = () => { if (currentPage.value > 1) currentPage.value-- }
const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++ }

// ── Navegación ──────────────────────────────────────────────────────────────
const goBack = () => {
  if (window.history.length > 1) { router.back(); return }
  router.push('/dashboard-admin')
}

// ── Modal AÑADIR ─────────────────────────────────────────────────────────────
const openAddModal = () => {
  addForm.value = { name: '' }
  addError.value = ''
  addSuccess.value = ''
  isAddModalOpen.value = true
}

const closeAddModal = () => {
  isAddModalOpen.value = false
  addError.value = ''
  addSuccess.value = ''
  isSaving.value = false
}

const saveFuncionario = async () => {
  if (!addForm.value.name.trim()) {
    addError.value = 'El nombre no puede estar vacío.'
    return
  }
  isSaving.value = true
  addError.value = ''
  addSuccess.value = ''
  try {
const { data } = await api.post('/employees', {
      name: addForm.value.name.trim(),
    })
    funcionarios.value.push({
      id: data.id,
      name: data.name,
      email: '',
      phone: '',
      role: 'EMPLOYEE',
      verified: true,
      active: data.active,
    })
    addSuccess.value = 'Funcionario añadido correctamente.'
    setTimeout(() => closeAddModal(), 900)
  } catch (error) {
    const msg = error.response?.data?.message
    addError.value = Array.isArray(msg) ? msg.join(', ') : msg || 'No se pudo añadir el funcionario.'
  } finally {
    isSaving.value = false
  }
}

// ── Modal EDITAR ─────────────────────────────────────────────────────────────
const openEditModal = (func) => {
  selectedFuncionario.value = func
  editForm.value = { id: func.id, name: func.name, active: func.active }
  editError.value = ''
  editSuccess.value = ''
  isEditModalOpen.value = true
}

const closeEditModal = () => {
  isEditModalOpen.value = false
  editError.value = ''
  editSuccess.value = ''
  isSaving.value = false
  selectedFuncionario.value = null
}

const saveEdit = async () => {
  if (!editForm.value.name.trim()) {
    editError.value = 'El nombre no puede estar vacío.'
    return
  }
  isSaving.value = true
  editError.value = ''
  editSuccess.value = ''
  try {
    const { data } = await api.patch(`/employees/${editForm.value.id}`, {
      name: editForm.value.name.trim(),
      active: editForm.value.active,
    })
    const updated = { ...selectedFuncionario.value, name: data.name, active: data.active }
    funcionarios.value = funcionarios.value.map((f) => (f.id === updated.id ? updated : f))
    editSuccess.value = 'Funcionario actualizado correctamente.'
    setTimeout(() => closeEditModal(), 900)
  } catch (error) {
    const msg = error.response?.data?.message
    editError.value = Array.isArray(msg) ? msg.join(', ') : msg || 'No se pudo actualizar el funcionario.'
  } finally {
    isSaving.value = false
  }
}

// ── Modal ELIMINAR ────────────────────────────────────────────────────────────
const openDeleteConfirm = (func) => {
  selectedFuncionario.value = func
  deleteError.value = ''
  isDeleteConfirmOpen.value = true
}

const closeDeleteConfirm = () => {
  isDeleteConfirmOpen.value = false
  deleteError.value = ''
  isConflict.value = false
  selectedFuncionario.value = null
}

const confirmDelete = async () => {
  if (!selectedFuncionario.value?.id) return
  isDeleting.value = true
  deleteError.value = ''
  isConflict.value = false
  try {
    await api.delete(`/employees/${selectedFuncionario.value.id}`)
    funcionarios.value = funcionarios.value.filter((f) => f.id !== selectedFuncionario.value.id)
    closeDeleteConfirm()
  } catch (error) {
    const status = error.response?.status
    const msg = error.response?.data?.message
    if (status === 409) {
      isConflict.value = true
      deleteError.value = 'Este funcionario tiene viajes registrados y no puede eliminarse. Puedes desactivarlo en su lugar.'
    } else {
      deleteError.value = Array.isArray(msg) ? msg.join(', ') : msg || 'No se pudo eliminar el funcionario.'
    }
  } finally {
    isDeleting.value = false
  }
}

const deactivateFuncionario = async () => {
  if (!selectedFuncionario.value?.id) return
  isDeleting.value = true
  deleteError.value = ''
  try {
    await api.patch(`/employees/${selectedFuncionario.value.id}`, { active: false })
    funcionarios.value = funcionarios.value.map((f) =>
      f.id === selectedFuncionario.value.id ? { ...f, active: false } : f
    )
    closeDeleteConfirm()
  } catch (error) {
    const msg = error.response?.data?.message
    deleteError.value = Array.isArray(msg) ? msg.join(', ') : msg || 'No se pudo desactivar el funcionario.'
  } finally {
    isDeleting.value = false
  }
}


onMounted(() => { loadFuncionarios() })
</script>

<template>
  <div class="h-screen min-h-0 overflow-hidden bg-background flex flex-col">
    <!-- ── Encabezado ── -->
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

      <main class="flex-1 min-h-0 py-6 pl-4 pr-4 md:pr-8 overflow-y-auto flex flex-col">
        <div class="w-full flex flex-col">

          <!-- Botón Volver (mismo patrón que otros apartados) -->
          <div class="mb-4 pl-0 pr-4 md:pr-8">
            <button @click="goBack" class="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary transition-colors">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Volver
            </button>
          </div>

          <div class="bg-white rounded-[2rem] border-2 border-slate-300 shadow-sm flex flex-col overflow-hidden">

            <!-- ── Barra superior: título + botón añadir ── -->
            <div class="px-4 sm:px-6 lg:px-10 md:pr-10 pt-6 lg:pt-8 pb-4">
              <div class="flex flex-col items-center gap-4">
                <h1 class="text-xl sm:text-2xl md:text-3xl font-titles font-extrabold text-slate-900 tracking-tight text-center">
                  Administración de Funcionarios
                </h1>
                <div class="flex items-center gap-3 w-full justify-end">
                  <!-- Buscador -->
                  <div class="relative w-[200px] hidden sm:block">
                    <input
                      v-model="searchQuery"
                      type="text"
                      placeholder="Buscar funcionario"
                      class="w-full bg-white border border-slate-300 rounded-[0.65rem] px-4 py-2 pr-10 text-sm focus:outline-none focus:border-primary shadow-sm text-slate-600 placeholder:text-slate-400 font-medium"
                    />
                    <svg class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <!-- Botón Añadir -->
                  <button
                    @click="openAddModal"
                    class="flex items-center gap-2 bg-[#0B2545] hover:bg-[#133A6D] text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-all hover:-translate-y-0.5 active:scale-95 shadow-sm whitespace-nowrap"
                  >
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Añadir funcionario
                  </button>
                </div>
              </div>
              <!-- Buscador móvil -->
              <div class="relative mt-3 sm:hidden">
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Buscar funcionario"
                  class="w-full bg-white border border-slate-300 rounded-[0.65rem] px-4 py-2 pr-10 text-sm focus:outline-none focus:border-primary shadow-sm text-slate-600 placeholder:text-slate-400 font-medium"
                />
                <svg class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <!-- ── Tabla ── -->
            <div class="px-4 sm:px-6 lg:px-10 md:pr-10 overflow-x-auto">
              <p v-if="loadError" class="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ loadError }}</p>

              <div v-if="isLoading" class="flex items-center justify-center py-24 gap-3">
                <svg class="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span class="text-sm text-slate-500">Cargando funcionarios...</span>
              </div>

              <table v-else class="w-full border-collapse min-w-[500px]">
                <thead>
                  <tr>
                    <th class="border border-[#7EA0C4] py-4 px-4 text-center font-body text-[1.05rem] font-medium text-slate-700 bg-white">Nombre</th>
                    <th class="border border-[#7EA0C4] py-4 px-4 text-center font-body text-[1.05rem] font-medium text-slate-700 bg-white w-52">Estado</th>
                    <th class="border border-[#7EA0C4] py-4 px-4 text-center font-body text-[1.05rem] font-medium text-slate-700 bg-white w-72">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="pagedFuncionarios.length === 0">
                    <td colspan="3" class="border border-[#D3DCE6] py-16 text-center text-slate-400 text-sm">
                      No hay funcionarios para mostrar.
                    </td>
                  </tr>
                  <tr
                    v-for="func in pagedFuncionarios"
                    :key="func.id"
                    class="bg-white hover:bg-slate-50/60 transition-colors"
                  >
                    <!-- Nombre -->
                    <td class="border border-[#D3DCE6] py-4 px-4 text-slate-600 text-sm font-medium">
                      {{ func.name }}
                    </td>
                    <!-- Estado -->
                    <td class="border border-[#D3DCE6] py-4 px-4 text-center">
                      <span
                        :class="[
                          'inline-block rounded-full px-3 py-1 text-xs font-bold border',
                          func.active
                            ? 'bg-green-50 text-green-700 border-green-300'
                            : 'bg-slate-100 text-slate-500 border-slate-300'
                        ]"
                      >
                        {{ func.active ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <!-- Acciones -->
                    <td class="border border-[#D3DCE6] py-4 px-4 text-center">
                      <div class="flex items-center justify-center gap-2">
                        <!-- Editar -->
                        <button
                          @click="openEditModal(func)"
                          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[1.25rem] text-[11px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors tracking-wide"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />
                          </svg>
                          Editar
                        </button>
                        <!-- Eliminar -->
                        <button
                          @click="openDeleteConfirm(func)"
                          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[1.25rem] text-[11px] font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-colors tracking-wide"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                          </svg>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- ── Pie paginación ── -->
            <div class="px-4 sm:px-6 lg:px-10 md:pr-10 py-5 mt-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
              <div class="flex items-center gap-2">
                <span>Filas por páginas</span>
                <div class="relative">
                  <select v-model.number="itemsPerPage" class="appearance-none border border-gray-300 rounded-md px-3 py-1 pr-7 bg-white outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer text-xs">
                    <option :value="10">10</option>
                    <option :value="25">25</option>
                    <option :value="50">50</option>
                    <option :value="100">100</option>
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
        </div>
      </main>
    </div>

    <!-- ══════════════════════════════════════════════════════════════════════
         MODAL: AÑADIR FUNCIONARIO
    ═══════════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="isAddModalOpen"
          class="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center px-4 py-4"
          @click.self="closeAddModal"
        >
          <div class="w-full max-w-md rounded-[1.75rem] bg-white shadow-2xl border border-slate-200 overflow-y-auto max-h-[90vh]">
            <!-- Cabecera -->
            <div class="px-8 pt-7 pb-5 flex items-start justify-between gap-4">
              <div>
                <h2 class="text-2xl font-titles font-bold text-slate-900">Añadir funcionario</h2>
                <p class="mt-1 text-sm text-slate-500">Ingresa el nombre del nuevo funcionario.</p>
              </div>
              <button @click="closeAddModal" class="text-slate-400 hover:text-slate-700 transition-colors mt-1">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18" /><path d="M6 6l12 12" /></svg>
              </button>
            </div>

            <div class="px-8 pb-8 space-y-5">
              <p v-if="addError" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ addError }}</p>
              <p v-if="addSuccess" class="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
                <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                {{ addSuccess }}
              </p>

              <!-- Campo Nombre -->
              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 pl-1">Nombre</label>
                <input
                  v-model="addForm.name"
                  type="text"
                  placeholder="Nombre del funcionario"
                  class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none focus:border-primary transition-colors"
                  @keyup.enter="saveFuncionario"
                />
              </div>

              <div class="flex justify-end gap-3 pt-1">
                <button @click="closeAddModal" type="button" class="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-semibold hover:bg-slate-50 transition-colors text-sm">
                  Cancelar
                </button>
                <button
                  @click="saveFuncionario"
                  type="button"
                  :disabled="isSaving"
                  class="px-5 py-2.5 rounded-xl bg-[#0B2545] hover:bg-[#133A6D] text-white font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                >
                  <svg v-if="isSaving" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  {{ isSaving ? 'Añadiendo...' : 'Añadir funcionario' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- ══════════════════════════════════════════════════════════════════════
         MODAL: EDITAR FUNCIONARIO
    ═══════════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="isEditModalOpen"
          class="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center px-4 py-4"
          @click.self="closeEditModal"
        >
          <div class="w-full max-w-md rounded-[1.75rem] bg-white shadow-2xl border border-slate-200 overflow-y-auto max-h-[90vh]">
            <!-- Cabecera -->
            <div class="px-8 pt-7 pb-5 flex items-start justify-between gap-4">
              <div>
                <h2 class="text-2xl font-titles font-bold text-slate-900">Editar funcionario</h2>
                <p class="mt-1 text-sm text-slate-500">Modifica el nombre del funcionario.</p>
              </div>
              <button @click="closeEditModal" class="text-slate-400 hover:text-slate-700 transition-colors mt-1">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18" /><path d="M6 6l12 12" /></svg>
              </button>
            </div>

            <div class="px-8 pb-8 space-y-5">
              <p v-if="editError" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ editError }}</p>
              <p v-if="editSuccess" class="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
                <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                {{ editSuccess }}
              </p>

              <!-- Campo Nombre -->
              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 pl-1">Nombre</label>
                <input
                  v-model="editForm.name"
                  type="text"
                  placeholder="Nombre del funcionario"
                  class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none focus:border-primary transition-colors"
                  @keyup.enter="saveEdit"
                />
              </div>

              <!-- Campo Estado -->
              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 pl-1">Estado</label>
                <select
                  v-model="editForm.active"
                  class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none focus:border-primary transition-colors bg-white"
                >
                  <option :value="true">Activo</option>
                  <option :value="false">Inactivo</option>
                </select>
              </div>

              <div class="flex justify-end gap-3 pt-1">
                <button @click="closeEditModal" type="button" class="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-semibold hover:bg-slate-50 transition-colors text-sm">
                  Cancelar
                </button>
                <button
                  @click="saveEdit"
                  type="button"
                  :disabled="isSaving"
                  class="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                >
                  <svg v-if="isSaving" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  {{ isSaving ? 'Guardando...' : 'Guardar cambios' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- ══════════════════════════════════════════════════════════════════════
         MODAL: CONFIRMAR ELIMINACIÓN
    ═══════════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="isDeleteConfirmOpen"
          class="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center px-4 py-4"
          @click.self="closeDeleteConfirm"
        >
          <div class="w-full max-w-sm rounded-[1.75rem] bg-white shadow-2xl border border-slate-200 p-8">
            <!-- Icono de advertencia -->
            <div class="flex flex-col items-center text-center gap-4">
              <div class="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 shrink-0">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>

              <div>
                <h2 class="text-xl font-titles font-extrabold text-slate-800">¿Eliminar funcionario?</h2>
                <p class="text-sm text-slate-500 mt-2 max-w-xs">
                  Estás a punto de eliminar a
                  <span class="font-bold text-slate-700">{{ selectedFuncionario?.name }}</span>.
                </p>
                <p class="text-sm text-slate-500 mt-2 max-w-xs">
                  ⚠️ Esta acción es <span class="font-bold text-red-600">irreversible</span> y
                  <span class="font-bold text-red-600">solo se puede realizar una vez</span>.
                  No podrás recuperar los datos del funcionario una vez eliminado.
                </p>
              </div>
            </div>

            <div v-if="deleteError" class="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 text-center">
              {{ deleteError }}
            </div>

            <div class="flex gap-3 mt-6">
              <button
                @click="closeDeleteConfirm"
                :disabled="isDeleting"
                type="button"
                class="flex-1 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-semibold hover:bg-slate-50 transition-colors text-sm disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                v-if="isConflict"
                @click="deactivateFuncionario"
                :disabled="isDeleting"
                type="button"
                class="flex-1 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                <svg v-if="isDeleting" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                {{ isDeleting ? 'Desactivando...' : 'Desactivar' }}
              </button>
              <button
                v-else
                @click="confirmDelete"
                :disabled="isDeleting"
                type="button"
                class="flex-1 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                <svg v-if="isDeleting" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                {{ isDeleting ? 'Eliminando...' : 'Sí, eliminar' }}
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

  </div>
</template>
