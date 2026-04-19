<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import logoCompleto from '@/assets/images/Logo-completo.png'
import DashboardSidebar from '@/components/DashboardSidebar.vue'
import UserMenu from '@/components/UserMenu.vue'
import api from '@/services/axios'

const router = useRouter()

// ── Estado principal ────────────────────────────────────────────────────────
const users = ref([])
const isLoading = ref(false)
const loadError = ref('')

const searchQuery = ref('')
const roleFilter = ref('ALL')
const statusFilter = ref('ALL')
const itemsPerPage = ref(10)
const currentPage = ref(1)

// ── Modales ─────────────────────────────────────────────────────────────────
const isEditModalOpen = ref(false)
const isViewModalOpen = ref(false)
const isPasswordModalOpen = ref(false)
const isSaving = ref(false)
const saveError = ref('')
const saveSuccess = ref('')
const selectedUser = ref(null)

const editForm = ref({ id: null, name: '', rut: '', role: 'EMPLOYEE', phone: '', email: '' })

const passwordForm = ref({ newPassword: '', confirmPassword: '' })
const passwordError = ref('')
const passwordSuccess = ref('')
const showNewPwd = ref(false)
const showConfirmPwd = ref(false)

// ── Constantes ──────────────────────────────────────────────────────────────
const ROLE_OPTIONS = [
  { value: 'PENDING_APPROVAL', label: 'Pendiente aprobación' },
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'DRIVER', label: 'Conductor' },
  { value: 'EMPLOYEE', label: 'Funcionario' },
]

const STATUS_OPTIONS = [
  { value: 'VERIFIED', label: 'Verificado' },
  { value: 'UNVERIFIED', label: 'Sin verificar' },
  { value: 'PENDING_APPROVAL', label: 'Pendiente aprobación' },
]

const roleLabelMap = {
  PENDING_APPROVAL: 'Pendiente aprobación',
  ADMIN: 'Administrador',
  DRIVER: 'Conductor',
  EMPLOYEE: 'Funcionario',
}
const formatRoleLabel = (role) => roleLabelMap[role] || role || 'Sin rol'

const statusConfig = {
  VERIFIED:         { label: 'Verificado',          dot: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' },
  UNVERIFIED:       { label: 'Sin verificar',       dot: '#94a3b8', bg: '#f8fafc', border: '#e2e8f0', text: '#475569' },
  PENDING_APPROVAL: { label: 'Pendiente aprobación', dot: '#f59e0b', bg: '#fff7ed', border: '#fed7aa', text: '#b45309' },
}
const getStatusCfg = (s) => statusConfig[s] || statusConfig.UNVERIFIED

// ── Helpers ─────────────────────────────────────────────────────────────────
const normalize = (v) =>
  String(v || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const mapUserFromApi = (u) => ({
  id: u?.id ?? null,
  name: u?.name || 'Sin nombre',
  rut: u?.rut || '',
  role: u?.role || 'Sin rol',
  phone: u?.phone || '',
  email: u?.email || '',
  status:
    u?.role === 'PENDING_APPROVAL'
      ? 'PENDING_APPROVAL'
      : u?.isVerified
        ? 'VERIFIED'
        : 'UNVERIFIED',
  isVerified: u?.isVerified ?? false,
  createdAt: u?.createdAt || null,
  canEdit: u?.role !== 'ADMIN',
})

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ── Carga de datos ──────────────────────────────────────────────────────────
const loadUsers = async () => {
  isLoading.value = true
  loadError.value = ''
  try {
    const { data } = await api.get('/users', { params: { page: 1, pageSize: 200 } })
    const payload = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : []
    users.value = payload.map(mapUserFromApi)
  } catch (error) {
    const msg = error.response?.data?.message
    if (error.response?.status === 401) loadError.value = 'Tu sesión ya no es válida.'
    else if (error.response?.status === 403) loadError.value = 'No tienes permisos para gestionar usuarios.'
    else loadError.value = Array.isArray(msg) ? msg.join(', ') : msg || 'No se pudieron cargar los usuarios.'
    users.value = []
  } finally {
    isLoading.value = false
  }
}

// ── Filtrado y paginación ───────────────────────────────────────────────────
const filteredUsers = computed(() => {
  const q = normalize(searchQuery.value)
  return users.value.filter((u) => {
    const matchRole = roleFilter.value === 'ALL' || u.role === roleFilter.value
    const matchStatus = statusFilter.value === 'ALL' || u.status === statusFilter.value
    const matchSearch =
      !q ||
      normalize(u.name).includes(q) ||
      normalize(u.email).includes(q) ||
      normalize(u.phone).includes(q) ||
      normalize(u.rut).includes(q)
    return matchRole && matchStatus && matchSearch
  })
})

const totalItems = computed(() => filteredUsers.value.length)
const totalPages = computed(() => Math.max(Math.ceil(totalItems.value / itemsPerPage.value), 1))
const pagedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredUsers.value.slice(start, start + itemsPerPage.value)
})
const firstRow = computed(() => (totalItems.value === 0 ? 0 : (currentPage.value - 1) * itemsPerPage.value + 1))
const lastRow = computed(() => Math.min(currentPage.value * itemsPerPage.value, totalItems.value))

const roleOptions = computed(() => ROLE_OPTIONS)

watch([searchQuery, roleFilter, statusFilter, itemsPerPage], () => { currentPage.value = 1 })
const prevPage = () => { if (currentPage.value > 1) currentPage.value-- }
const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++ }

// ── Navegación ──────────────────────────────────────────────────────────────
const goBack = () => {
  if (window.history.length > 1) { router.back(); return }
  router.push('/dashboard-admin')
}

// ── Modal VER ───────────────────────────────────────────────────────────────
const openViewModal = (user) => {
  selectedUser.value = user
  isViewModalOpen.value = true
}
const closeViewModal = () => { isViewModalOpen.value = false; selectedUser.value = null }

// ── Modal EDITAR ─────────────────────────────────────────────────────────────
const openEditModal = (user) => {
  if (!user?.canEdit) return
  selectedUser.value = user
  editForm.value = {
    id: user.id,
    name: user.name || '',
    rut: user.rut || '',
    role: user.role || 'EMPLOYEE',
    phone: user.phone || '',
    email: user.email || '',
  }
  saveError.value = ''
  saveSuccess.value = ''
  isEditModalOpen.value = true
}
const closeEditModal = () => {
  isEditModalOpen.value = false
  isSaving.value = false
  saveError.value = ''
  saveSuccess.value = ''
  selectedUser.value = null
}

const saveUser = async () => {
  if (!editForm.value.id) return
  isSaving.value = true
  saveError.value = ''
  saveSuccess.value = ''
  try {
    const payload = {
      name: editForm.value.name.trim() || undefined,
      role: editForm.value.role || undefined,
      phone: editForm.value.phone.trim() || undefined,
      email: editForm.value.email.trim() || undefined,
    }
    const { data } = await api.patch(`/users/${editForm.value.id}`, payload)
    const updated = mapUserFromApi({ ...selectedUser.value, ...data })
    users.value = users.value.map((u) => (u.id === updated.id ? updated : u))
    saveSuccess.value = 'Cambios guardados correctamente.'
    setTimeout(() => closeEditModal(), 800)
  } catch (error) {
    const msg = error.response?.data?.message
    saveError.value = Array.isArray(msg) ? msg.join(', ') : msg || 'No se pudo guardar el usuario.'
  } finally {
    isSaving.value = false
  }
}

// ── Modal CAMBIAR CONTRASEÑA ─────────────────────────────────────────────────
const openPasswordModal = (user) => {
  selectedUser.value = user
  passwordForm.value = { newPassword: '', confirmPassword: '' }
  passwordError.value = ''
  passwordSuccess.value = ''
  showNewPwd.value = false
  showConfirmPwd.value = false
  isPasswordModalOpen.value = true
}
const closePasswordModal = () => {
  isPasswordModalOpen.value = false
  passwordError.value = ''
  passwordSuccess.value = ''
  selectedUser.value = null
}

const savePassword = async () => {
  passwordError.value = ''
  passwordSuccess.value = ''
  if (passwordForm.value.newPassword.length < 6) {
    passwordError.value = 'La contraseña debe tener al menos 6 caracteres.'
    return
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordError.value = 'Las contraseñas no coinciden.'
    return
  }
  isSaving.value = true
  try {
    await api.patch(`/users/${selectedUser.value.id}`, {
      password: passwordForm.value.newPassword,
    })
    passwordSuccess.value = 'Contraseña actualizada correctamente.'
    setTimeout(() => closePasswordModal(), 900)
  } catch (error) {
    const msg = error.response?.data?.message
    passwordError.value = Array.isArray(msg) ? msg.join(', ') : msg || 'No se pudo actualizar la contraseña.'
  } finally {
    isSaving.value = false
  }
}

onMounted(() => { loadUsers() })
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col">
    <!-- ── Encabezado ── -->
    <div class="bg-white shadow-sm border-b border-gray-200">
      <div class="px-4 py-4 flex items-center justify-between">
        <router-link to="/" class="flex items-center">
          <img :src="logoCompleto" alt="Transportes Flores Vargas" class="h-16 w-auto object-contain hover:opacity-80 transition-opacity" />
        </router-link>
        <UserMenu />
      </div>
    </div>

    <div class="flex flex-1 overflow-hidden">
      <DashboardSidebar />

      <main class="flex-1 py-6 px-4 md:px-8 overflow-y-auto flex flex-col">
        <div class="w-full flex flex-col flex-1">
          <div class="mb-4 pl-10 sm:pl-12">
            <button @click="goBack" class="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary transition-colors">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Volver
            </button>
          </div>
          <div class="bg-white rounded-[2rem] border-2 border-slate-300 shadow-sm flex flex-col overflow-hidden flex-1">

            <!-- ── Barra superior ── -->
            <div class="px-4 sm:px-6 lg:px-10 pt-6 lg:pt-8 pb-4 flex flex-wrap items-center justify-end gap-3">


              <div class="flex flex-wrap items-center gap-3">
                <!-- Filtro rol -->
                <div class="relative">
                  <select
                    v-model="roleFilter"
                    class="appearance-none bg-white border border-slate-300 rounded-[0.65rem] px-4 py-2 pr-9 text-sm focus:outline-none focus:border-primary shadow-sm min-w-[160px] text-slate-600 font-medium"
                  >
                    <option value="ALL">Todos los roles</option>
                    <option v-for="role in roleOptions" :key="role.value" :value="role.value">{{ role.label }}</option>
                  </select>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9" /></svg>
                </div>

                <!-- Filtro estado -->
                <div class="relative">
                  <select
                    v-model="statusFilter"
                    class="appearance-none bg-white border border-slate-300 rounded-[0.65rem] px-4 py-2 pr-9 text-sm focus:outline-none focus:border-primary shadow-sm min-w-[150px] text-slate-600 font-medium"
                  >
                    <option value="ALL">Todos los estados</option>
                    <option v-for="s in STATUS_OPTIONS" :key="s.value" :value="s.value">{{ s.label }}</option>
                  </select>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9" /></svg>
                </div>

                <!-- Buscador -->
                <div class="relative w-[240px]">
                  <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="Buscar usuario"
                    class="w-full bg-white border border-slate-300 rounded-[0.65rem] px-4 py-2 pr-10 text-sm focus:outline-none focus:border-primary shadow-sm text-slate-600 placeholder:text-slate-400 font-medium"
                  />
                  <svg class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <!-- ── Título ── -->
            <div class="px-4 sm:px-6 lg:px-10 pt-1 pb-5">
              <h1 class="text-2xl md:text-3xl lg:text-4xl font-titles font-extrabold text-slate-900 text-center">Administración de Usuarios</h1>
            </div>

            <!-- ── Tabla ── -->
            <div class="flex-1 px-4 sm:px-6 lg:px-10 min-h-0 overflow-auto">
              <p v-if="loadError" class="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ loadError }}</p>

              <div v-if="isLoading" class="flex items-center justify-center py-24 gap-3">
                <svg class="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span class="text-sm text-slate-500">Cargando usuarios...</span>
              </div>

              <table v-else class="w-full border-collapse min-w-[1100px]">
                <thead>
                  <tr>
                    <th class="border border-[#7EA0C4] py-4 px-4 text-center font-body text-[1.05rem] font-medium text-slate-700 bg-white">Nombre</th>
                    <th class="border border-[#7EA0C4] py-4 px-4 text-center font-body text-[1.05rem] font-medium text-slate-700 bg-white">RUT</th>
                    <th class="border border-[#7EA0C4] py-4 px-4 text-center font-body text-[1.05rem] font-medium text-slate-700 bg-white">Rol</th>
                    <th class="border border-[#7EA0C4] py-4 px-4 text-center font-body text-[1.05rem] font-medium text-slate-700 bg-white">Teléfono</th>
                    <th class="border border-[#7EA0C4] py-4 px-4 text-center font-body text-[1.05rem] font-medium text-slate-700 bg-white">Correo</th>
                    <th class="border border-[#7EA0C4] py-4 px-4 text-center font-body text-[1.05rem] font-medium text-slate-700 bg-white">Estado</th>
                    <th class="border border-[#7EA0C4] py-4 px-4 text-center font-body text-[1.05rem] font-medium text-slate-700 bg-white">Seguridad</th>
                    <th class="border border-[#7EA0C4] py-4 px-4 text-center font-body text-[1.05rem] font-medium text-slate-700 bg-white">Acción</th>
                  </tr>
                </thead>

                <tbody>
                  <tr v-if="pagedUsers.length === 0">
                    <td colspan="8" class="border border-[#D3DCE6] py-16 text-center text-slate-400 text-sm">
                      No hay usuarios para mostrar.
                    </td>
                  </tr>

                  <tr
                    v-for="user in pagedUsers"
                    :key="user.id"
                    class="bg-white hover:bg-slate-50/60 transition-colors"
                  >
                    <!-- Nombre -->
                    <td class="border border-[#D3DCE6] py-4 px-4 text-center text-slate-700 text-sm font-medium">{{ user.name }}</td>
                    <!-- RUT -->
                    <td class="border border-[#D3DCE6] py-4 px-4 text-center text-slate-400 text-sm">{{ user.rut || '—' }}</td>
                    <!-- Rol -->
                    <td class="border border-[#D3DCE6] py-4 px-4 text-center text-slate-500 text-sm">{{ formatRoleLabel(user.role) }}</td>
                    <!-- Teléfono -->
                    <td class="border border-[#D3DCE6] py-4 px-4 text-center text-slate-400 text-sm">{{ user.phone || '—' }}</td>
                    <!-- Correo -->
                    <td class="border border-[#D3DCE6] py-4 px-4 text-center text-slate-400 text-sm">{{ user.email || '—' }}</td>

                    <!-- Estado: check verificado + botón llave -->
                    <td class="border border-[#D3DCE6] py-4 px-4 text-center">
                      <div class="flex items-center justify-center gap-3">
                        <!-- Check isVerified -->
                        <span
                          :title="user.isVerified ? 'Cuenta verificada' : 'Cuenta sin verificar'"
                          class="inline-flex items-center justify-center w-7 h-7 rounded-full"
                          :class="user.isVerified ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'"
                        >
                          <svg v-if="user.isVerified" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </span>

                        <!-- Llave: abrir modal cambio de contraseña -->
                        <button
                          @click="openPasswordModal(user)"
                          title="Cambiar contraseña del usuario"
                          class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-50 text-amber-500 hover:bg-amber-100 hover:text-amber-700 transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <!-- Seguridad (badge) -->
                    <td class="border border-[#D3DCE6] py-4 px-4 text-center">
                      <span
                        class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
                        :style="{
                          backgroundColor: getStatusCfg(user.status).bg,
                          borderColor: getStatusCfg(user.status).border,
                          color: getStatusCfg(user.status).text,
                        }"
                      >
                        <span
                          class="w-1.5 h-1.5 rounded-full"
                          :style="{ backgroundColor: getStatusCfg(user.status).dot }"
                        ></span>
                        {{ getStatusCfg(user.status).label }}
                      </span>
                    </td>

                    

                    <!-- Acción: Ver + Editar -->
                    <td class="border border-[#D3DCE6] py-4 px-4 text-center">
                      <div class="flex items-center justify-center gap-2">
                        <!-- Ver -->
                        <button
                          @click="openViewModal(user)"
                          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                          title="Ver resumen del usuario"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                          </svg>
                          Ver
                        </button>

                        <!-- Editar -->
                        <button
                          @click="openEditModal(user)"
                          :disabled="!user.canEdit"
                          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                          :class="user.canEdit
                            ? 'bg-primary/10 text-primary hover:bg-primary/20'
                            : 'bg-slate-100 text-slate-300 cursor-not-allowed'"
                          :title="user.canEdit ? 'Editar usuario' : 'No se puede editar un administrador'"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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

            <!-- ── Pie paginación ── -->
            <div class="px-4 sm:px-6 lg:px-10 py-5 mt-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
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
         MODAL: VER usuario
    ═══════════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div
        v-if="isViewModalOpen"
        class="fixed inset-0 z-[60] bg-black/35 flex items-center justify-center px-4"
        @click.self="closeViewModal"
      >
        <div class="w-full max-w-lg rounded-[1.75rem] bg-white shadow-2xl border border-slate-200 overflow-hidden">
          <!-- Cabecera -->
          <div class="px-8 pt-7 pb-5 flex items-start justify-between gap-4">
            <div>
              <h2 class="text-2xl font-titles font-bold text-slate-900">Resumen del usuario</h2>
              <p class="mt-1 text-sm text-slate-500">Información general de la cuenta.</p>
            </div>
            <button @click="closeViewModal" class="text-slate-400 hover:text-slate-700 transition-colors">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18" /><path d="M6 6l12 12" /></svg>
            </button>
          </div>

          <div class="px-8 pb-8 space-y-4">
            <!-- Avatar + nombre -->
            <div class="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4">
              <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                {{ (selectedUser?.name || '?').charAt(0).toUpperCase() }}
              </div>
              <div>
                <p class="text-base font-semibold text-slate-800">{{ selectedUser?.name }}</p>
                <p class="text-xs text-slate-400 mt-0.5">{{ selectedUser?.email }}</p>
              </div>
              <!-- Status badge -->
              <span
                class="ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
                :style="{
                  backgroundColor: getStatusCfg(selectedUser?.status).bg,
                  borderColor: getStatusCfg(selectedUser?.status).border,
                  color: getStatusCfg(selectedUser?.status).text,
                }"
              >
                <span class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: getStatusCfg(selectedUser?.status).dot }"></span>
                {{ getStatusCfg(selectedUser?.status).label }}
              </span>
            </div>

            <!-- Grid de datos -->
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div class="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <p class="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">RUT</p>
                <p class="text-slate-700 font-medium">{{ selectedUser?.rut || '—' }}</p>
              </div>
              <div class="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <p class="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Rol</p>
                <p class="text-slate-700 font-medium">{{ formatRoleLabel(selectedUser?.role) }}</p>
              </div>
              <div class="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <p class="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Teléfono</p>
                <p class="text-slate-700 font-medium">{{ selectedUser?.phone || '—' }}</p>
              </div>
              <div class="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <p class="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Registrado</p>
                <p class="text-slate-700 font-medium">{{ formatDate(selectedUser?.createdAt) }}</p>
              </div>
              <div class="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 col-span-2">
                <p class="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Verificación de correo</p>
                <div class="flex items-center gap-2">
                  <span
                    class="inline-flex items-center justify-center w-5 h-5 rounded-full"
                    :class="selectedUser?.isVerified ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'"
                  >
                    <svg v-if="selectedUser?.isVerified" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    <svg v-else width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </span>
                  <span class="text-slate-700 font-medium text-sm">
                    {{ selectedUser?.isVerified ? 'Correo verificado' : 'Correo sin verificar' }}
                  </span>
                </div>
              </div>
            </div>

            <div class="flex justify-end">
              <button @click="closeViewModal" class="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-semibold hover:bg-slate-50 transition-colors text-sm">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ══════════════════════════════════════════════════════════════════════
         MODAL: EDITAR usuario
    ═══════════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div
        v-if="isEditModalOpen"
        class="fixed inset-0 z-[60] bg-black/35 flex items-center justify-center px-4"
        @click.self="closeEditModal"
      >
        <div class="w-full max-w-2xl rounded-[1.75rem] bg-white shadow-2xl border border-slate-200 overflow-hidden">
          <div class="px-8 pt-7 pb-5 flex items-start justify-between gap-4">
            <div>
              <h2 class="text-2xl font-titles font-bold text-slate-900">Editar usuario</h2>
              <p class="mt-1 text-sm text-slate-500">Modifica los datos y el estado de la cuenta.</p>
            </div>
            <button @click="closeEditModal" class="text-slate-400 hover:text-slate-700 transition-colors">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18" /><path d="M6 6l12 12" /></svg>
            </button>
          </div>

          <div class="px-8 pb-8">
            <p v-if="saveError" class="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ saveError }}</p>
            <p v-if="saveSuccess" class="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
              <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
              {{ saveSuccess }}
            </p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <!-- Nombre -->
              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 pl-1">Nombre</label>
                <input v-model="editForm.name" type="text" class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none focus:border-primary" />
              </div>
              <!-- RUT (readonly) -->
              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 pl-1">RUT</label>
                <input :value="editForm.rut || 'Sin RUT registrado'" type="text" disabled class="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-400 cursor-not-allowed" />
              </div>
              <!-- Rol -->
              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 pl-1">Rol</label>
                <div class="relative">
                  <select v-model="editForm.role" class="appearance-none w-full rounded-xl border border-slate-300 px-4 py-3 pr-10 text-sm text-slate-700 outline-none focus:border-primary bg-white">
                    <option v-for="role in ROLE_OPTIONS" :key="role.value" :value="role.value">{{ role.label }}</option>
                  </select>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9" /></svg>
                </div>
              </div>
              <!-- Estado (solo lectura) -->
              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 pl-1">Estado de la cuenta</label>
                <input
                  :value="getStatusCfg(selectedUser?.status).label"
                  type="text"
                  disabled
                  class="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
              <!-- Teléfono -->
              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 pl-1">Teléfono</label>
                <input v-model="editForm.phone" type="text" class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none focus:border-primary" />
              </div>
              <!-- Correo -->
              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 pl-1">Correo</label>
                <input v-model="editForm.email" type="email" class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none focus:border-primary" />
              </div>
            </div>

            <div class="mt-7 flex justify-end gap-3">
              <button @click="closeEditModal" type="button" class="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-semibold hover:bg-slate-50 transition-colors">Cancelar</button>
              <button @click="saveUser" type="button" :disabled="isSaving" class="px-5 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">
                <svg v-if="isSaving" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                {{ isSaving ? 'Guardando...' : 'Guardar cambios' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ══════════════════════════════════════════════════════════════════════
         MODAL: CAMBIAR CONTRASEÑA (admin)
    ═══════════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div
        v-if="isPasswordModalOpen"
        class="fixed inset-0 z-[60] bg-black/35 flex items-center justify-center px-4"
        @click.self="closePasswordModal"
      >
        <div class="w-full max-w-md rounded-[1.75rem] bg-white shadow-2xl border border-slate-200 overflow-hidden">
          <div class="px-8 pt-7 pb-5 flex items-start justify-between gap-4">
            <div>
              <h2 class="text-2xl font-titles font-bold text-slate-900">Cambiar contraseña</h2>
              <p class="mt-1 text-sm text-slate-500">
                Establecer nueva contraseña para
                <span class="font-semibold text-slate-700">{{ selectedUser?.name }}</span>.
              </p>
            </div>
            <button @click="closePasswordModal" class="text-slate-400 hover:text-slate-700 transition-colors">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18" /><path d="M6 6l12 12" /></svg>
            </button>
          </div>

          <div class="px-8 pb-8 space-y-4">
            <p v-if="passwordError" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ passwordError }}</p>
            <p v-if="passwordSuccess" class="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
              <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
              {{ passwordSuccess }}
            </p>

            <!-- Nueva contraseña -->
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 pl-1">Nueva contraseña</label>
              <div class="relative">
                <input
                  v-model="passwordForm.newPassword"
                  :type="showNewPwd ? 'text' : 'password'"
                  placeholder="Mínimo 6 caracteres"
                  class="w-full rounded-xl border border-slate-300 px-4 py-3 pr-11 text-sm text-slate-700 outline-none focus:border-primary"
                />
                <button type="button" @click="showNewPwd = !showNewPwd" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <svg v-if="!showNewPwd" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                </button>
              </div>
            </div>

            <!-- Confirmar contraseña -->
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 pl-1">Confirmar contraseña</label>
              <div class="relative">
                <input
                  v-model="passwordForm.confirmPassword"
                  :type="showConfirmPwd ? 'text' : 'password'"
                  placeholder="Repite la contraseña"
                  class="w-full rounded-xl border border-slate-300 px-4 py-3 pr-11 text-sm text-slate-700 outline-none focus:border-primary"
                />
                <button type="button" @click="showConfirmPwd = !showConfirmPwd" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <svg v-if="!showConfirmPwd" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                </button>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-2">
              <button @click="closePasswordModal" type="button" class="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-semibold hover:bg-slate-50 transition-colors">Cancelar</button>
              <button @click="savePassword" type="button" :disabled="isSaving || !!passwordSuccess" class="px-5 py-2.5 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">
                <svg v-if="isSaving" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                {{ isSaving ? 'Guardando...' : 'Actualizar contraseña' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>
