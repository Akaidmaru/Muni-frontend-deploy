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
const itemsPerPage = ref(10)
const currentPage = ref(1)

// ── Estado del modal de asignación de rol ───────────────────────────────────
const isRoleModalOpen = ref(false)
const isSaving = ref(false)
const saveError = ref('')
const saveSuccess = ref('')
const selectedUser = ref(null)
const selectedRole = ref('DRIVER')

const ROLE_OPTIONS = [
  { value: 'DRIVER', label: 'Conductor' },
  { value: 'EMPLOYEE', label: 'Funcionario' },
  { value: 'ADMIN', label: 'Administrador' },
]

// ── Helpers ─────────────────────────────────────────────────────────────────
const normalize = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const mapUserFromApi = (user) => ({
  id: user?.id ?? null,
  name: user?.name || 'Sin nombre',
  rut: user?.rut || '',
  email: user?.email || '',
  phone: user?.phone || '',
  isVerified: user?.isVerified ?? false,
  createdAt: user?.createdAt || null,
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
    // Trae usuarios NO verificados (pendientes de asignación de rol)
    const { data } = await api.get('/users/verified', { params: { status: 'false' } })
    users.value = Array.isArray(data) ? data.map(mapUserFromApi) : []
  } catch (error) {
    const backendMessage = error.response?.data?.message
    if (error.response?.status === 401) {
      loadError.value = 'Tu sesión ya no es válida. Cierra sesión y vuelve a entrar.'
    } else if (error.response?.status === 403) {
      loadError.value = 'No tienes permisos para ver esta sección.'
    } else {
      loadError.value = Array.isArray(backendMessage)
        ? backendMessage.join(', ')
        : backendMessage || 'No se pudieron cargar los usuarios pendientes.'
    }
    users.value = []
  } finally {
    isLoading.value = false
  }
}

// ── Filtrado y paginación ───────────────────────────────────────────────────
const filteredUsers = computed(() => {
  const q = normalize(searchQuery.value)
  if (!q) return users.value
  return users.value.filter(
    (u) =>
      normalize(u.name).includes(q) ||
      normalize(u.email).includes(q) ||
      normalize(u.rut).includes(q) ||
      normalize(u.phone).includes(q),
  )
})

const totalItems = computed(() => filteredUsers.value.length)
const totalPages = computed(() => Math.max(Math.ceil(totalItems.value / itemsPerPage.value), 1))

const pagedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredUsers.value.slice(start, start + itemsPerPage.value)
})

const firstRow = computed(() =>
  totalItems.value === 0 ? 0 : (currentPage.value - 1) * itemsPerPage.value + 1,
)
const lastRow = computed(() => Math.min(currentPage.value * itemsPerPage.value, totalItems.value))

watch([searchQuery, itemsPerPage], () => { currentPage.value = 1 })

const prevPage = () => { if (currentPage.value > 1) currentPage.value -= 1 }
const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value += 1 }

// ── Navegación ──────────────────────────────────────────────────────────────
const goBack = () => {
  if (window.history.length > 1) { router.back(); return }
  router.push('/admin/gestion-usuarios')
}

// ── Modal de asignación de rol ──────────────────────────────────────────────
const openRoleModal = (user) => {
  selectedUser.value = user
  selectedRole.value = 'DRIVER'
  saveError.value = ''
  saveSuccess.value = ''
  isRoleModalOpen.value = true
}

const closeRoleModal = () => {
  isRoleModalOpen.value = false
  isSaving.value = false
  saveError.value = ''
  saveSuccess.value = ''
  selectedUser.value = null
}

const assignRole = async () => {
  if (!selectedUser.value?.id || !selectedRole.value) return

  isSaving.value = true
  saveError.value = ''
  saveSuccess.value = ''

  try {
    await api.patch(`/users/${selectedUser.value.id}`, { role: selectedRole.value })
    // Quita al usuario de la lista local (ya tiene rol asignado)
    users.value = users.value.filter((u) => u.id !== selectedUser.value.id)
    saveSuccess.value = `Rol asignado correctamente.`
    setTimeout(() => closeRoleModal(), 900)
  } catch (error) {
    const backendMessage = error.response?.data?.message
    saveError.value = Array.isArray(backendMessage)
      ? backendMessage.join(', ')
      : backendMessage || 'No se pudo asignar el rol.'
  } finally {
    isSaving.value = false
  }
}

const roleLabelOf = (val) => ROLE_OPTIONS.find((r) => r.value === val)?.label || val

onMounted(() => { loadUsers() })
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

      <main class="flex-1 min-h-0 py-6 pl-3 pr-4 md:pl-4 md:pr-8 overflow-y-auto flex items-start justify-center">
        <div class="w-full max-w-6xl">
          <div class="mb-4 pl-0">
            <button @click="goBack" class="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary transition-colors">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Volver
            </button>
          </div>
          <div class="bg-white rounded-[2rem] border-2 border-slate-300 shadow-sm flex flex-col overflow-hidden min-h-[78vh]">

            <!-- ── Barra superior ── -->
            <div class="px-10 pt-8 pb-4 flex items-center justify-end gap-4">


              <!-- Buscador -->
              <div class="relative w-[260px]">
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

            <!-- ── Título + badge ── -->
            <div class="px-10 pt-1 pb-5 flex flex-col items-center gap-2">
              <h1 class="text-4xl font-titles font-extrabold text-slate-900 text-center">Roles iniciales</h1>
              <p class="text-sm text-slate-500 text-center max-w-lg leading-relaxed">
                Usuarios registrados que aún no tienen un rol asignado. Asígnales el rol apropiado para que puedan acceder al sistema.
              </p>
              <!-- Badge contador -->
              <div v-if="!isLoading && !loadError" class="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                {{ totalItems }} {{ totalItems === 1 ? 'usuario pendiente' : 'usuarios pendientes' }}
              </div>
            </div>

            <!-- ── Tabla ── -->
            <div class="flex-1 px-10 min-h-0 overflow-auto">
              <p v-if="loadError" class="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {{ loadError }}
              </p>

              <!-- Loading spinner -->
              <div v-if="isLoading" class="flex items-center justify-center py-24 gap-3">
                <svg class="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span class="text-sm text-slate-500">Cargando usuarios pendientes...</span>
              </div>

              <table v-else class="w-full border-collapse min-w-[860px]">
                <thead>
                  <tr>
                    <th class="w-16 border border-[#7EA0C4] py-3 px-2 bg-white"></th>
                    <th class="border border-[#7EA0C4] py-4 px-6 text-center font-body text-[1.05rem] font-medium text-slate-700">Nombre</th>
                    <th class="border border-[#7EA0C4] py-4 px-6 text-center font-body text-[1.05rem] font-medium text-slate-700">RUT</th>
                    <th class="border border-[#7EA0C4] py-4 px-6 text-center font-body text-[1.05rem] font-medium text-slate-700">Correo</th>
                    <th class="border border-[#7EA0C4] py-4 px-6 text-center font-body text-[1.05rem] font-medium text-slate-700">Teléfono</th>
                    <th class="border border-[#7EA0C4] py-4 px-6 text-center font-body text-[1.05rem] font-medium text-slate-700">Registrado</th>
                  </tr>
                </thead>

                <tbody>
                  <tr v-if="pagedUsers.length === 0">
                    <td colspan="6" class="border border-[#D3DCE6] py-16 text-center text-slate-400 text-sm">
                      <div class="flex flex-col items-center gap-3">
                        <svg class="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>No hay usuarios pendientes de asignación de rol.</span>
                      </div>
                    </td>
                  </tr>

                  <tr
                    v-for="user in pagedUsers"
                    :key="user.id"
                    class="bg-white hover:bg-amber-50/40 transition-colors"
                  >
                    <!-- Acción: botón asignar rol -->
                    <td class="border border-[#D3DCE6] py-3 px-2 align-middle">
                      <div class="flex flex-col items-center gap-2 pt-1">
                        <button
                          @click="openRoleModal(user)"
                          class="text-amber-500 hover:text-amber-600 transition-colors"
                          title="Asignar rol inicial"
                        >
                          <!-- Icono de etiqueta/asignación -->
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                            <line x1="7" y1="7" x2="7.01" y2="7" />
                          </svg>
                        </button>
                      </div>
                    </td>

                    <td class="border border-[#D3DCE6] py-5 px-6 text-center text-slate-600 text-sm font-medium">
                      {{ user.name }}
                    </td>
                    <td class="border border-[#D3DCE6] py-5 px-6 text-center text-slate-400 text-sm">
                      {{ user.rut || '—' }}
                    </td>
                    <td class="border border-[#D3DCE6] py-5 px-6 text-center text-slate-400 text-sm">
                      {{ user.email || '—' }}
                    </td>
                    <td class="border border-[#D3DCE6] py-5 px-6 text-center text-slate-400 text-sm">
                      {{ user.phone || '—' }}
                    </td>
                    <td class="border border-[#D3DCE6] py-5 px-6 text-center text-slate-400 text-sm">
                      {{ formatDate(user.createdAt) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- ── Pie de tabla: paginación ── -->
            <div class="px-10 py-5 mt-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
              <div class="flex items-center gap-2">
                <span>Filas por páginas</span>
                <div class="relative">
                  <select
                    v-model.number="itemsPerPage"
                    class="appearance-none border border-gray-300 rounded-md px-3 py-1 pr-7 bg-white outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer text-xs"
                  >
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
                  <button
                    @click="prevPage"
                    :disabled="currentPage <= 1"
                    class="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6" /></svg>
                  </button>
                  <button
                    @click="nextPage"
                    :disabled="currentPage >= totalPages"
                    class="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>

    <!-- ── Modal asignación de rol ── -->
    <Teleport to="body">
      <div
        v-if="isRoleModalOpen"
        class="fixed inset-0 z-[60] bg-black/35 flex items-center justify-center px-4 py-4"
        @click.self="closeRoleModal"
      >
        <div class="w-full max-w-lg rounded-[1.75rem] bg-white shadow-2xl border border-slate-200 overflow-y-auto max-h-[90vh]">
          <!-- Cabecera del modal -->
          <div class="px-8 pt-7 pb-5 flex items-start justify-between gap-4">
            <div>
              <h2 class="text-2xl font-titles font-bold text-slate-900">Asignar rol inicial</h2>
              <p class="mt-1.5 text-sm text-slate-500 leading-snug">
                Selecciona el rol que corresponde a
                <span class="font-semibold text-slate-700">{{ selectedUser?.name }}</span>.
              </p>
            </div>
            <button @click="closeRoleModal" class="text-slate-400 hover:text-slate-700 transition-colors">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18" /><path d="M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="px-8 pb-8">
            <!-- Feedback -->
            <p v-if="saveError" class="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {{ saveError }}
            </p>
            <p v-if="saveSuccess" class="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
              <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {{ saveSuccess }}
            </p>

            <!-- Info del usuario -->
            <div class="mb-5 bg-slate-50 rounded-xl border border-slate-200 px-5 py-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p class="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Correo</p>
                <p class="text-slate-700 font-medium break-all">{{ selectedUser?.email || '—' }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">RUT</p>
                <p class="text-slate-700 font-medium">{{ selectedUser?.rut || '—' }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Teléfono</p>
                <p class="text-slate-700 font-medium">{{ selectedUser?.phone || '—' }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Registrado</p>
                <p class="text-slate-700 font-medium">{{ formatDate(selectedUser?.createdAt) }}</p>
              </div>
            </div>

            <!-- Selector de rol -->
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 pl-1">
                Rol a asignar
              </label>
              <div class="flex gap-3 flex-wrap">
                <button
                  v-for="option in ROLE_OPTIONS"
                  :key="option.value"
                  @click="selectedRole = option.value"
                  :class="[
                    'flex-1 min-w-[120px] px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all duration-150',
                    selectedRole === option.value
                      ? 'border-primary bg-primary text-white shadow-md'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-primary/50 hover:bg-slate-50'
                  ]"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>

            <!-- Acciones -->
            <div class="mt-7 flex justify-end gap-3">
              <button
                @click="closeRoleModal"
                type="button"
                class="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                @click="assignRole"
                type="button"
                :disabled="isSaving || !!saveSuccess"
                class="px-5 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg v-if="isSaving" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {{ isSaving ? 'Asignando...' : `Asignar como ${roleLabelOf(selectedRole)}` }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
