<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import logoCompleto from '@/assets/images/Logo-completo.png'
import DashboardSidebar from '@/components/DashboardSidebar.vue'
import UserMenu from '@/components/UserMenu.vue'
import api from '@/services/axios'

const router = useRouter()

/** Tipos alineados al backend */
const DOCUMENT_ROWS = [
  { kind: 'CIRCULATION_PERMIT', label: 'Permiso de circulación' },
  { kind: 'INSURANCE', label: 'SOAP' },
  { kind: 'TECHNICAL_REVIEW', label: 'Revisión técnica' },
  { kind: 'EMISSIONS', label: 'Emisión de contaminantes' },
]

/** Año corriente: documentación organizada según el año actual */
const currentDocumentationYear = computed(() => new Date().getFullYear())
const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024

const DOCUMENT_FILE_ACCEPT =
  'application/pdf,.pdf,image/png,.png,image/jpeg,.jpg,.jpeg,image/webp,.webp'

const vehicles = ref([])
const selectedTruckId = ref('')
const docsList = ref([])
const isLoading = ref(false)
const loadError = ref('')
const docsError = ref('')
const uploadingKind = ref(null)
const deletingId = ref(null)
const isAddModalOpen = ref(false)
const addFormKind = ref('CIRCULATION_PERMIT')
const addFileInput = ref(null)

/** Mismo patrón que AdminMaintenanceWeeklyView (éxito / error) */
const alertModal = ref({
  open: false,
  title: '',
  message: '',
  isError: false,
})

const closeAlertModal = () => {
  alertModal.value = { open: false, title: '', message: '', isError: false }
}

function showAlert(title, message, isError = false) {
  alertModal.value = { open: true, title, message, isError }
}

/** Mismo patrón que AdminMaintenanceWeeklyHistory (eliminar registro) */
const deleteModal = ref({ open: false, docId: null })

const openDeleteModal = (docId) => {
  if (docId == null || docId === undefined) return
  deleteModal.value = { open: true, docId: Number(docId) }
}

const closeDeleteModal = () => {
  if (deletingId.value != null) return
  deleteModal.value = { open: false, docId: null }
}

const itemsPerPage = ref(100)
const currentPage = ref(1)

const sortedVehicles = computed(() =>
  [...vehicles.value].sort((a, b) =>
    String(a.plate || '').localeCompare(String(b.plate || ''), undefined, {
      sensitivity: 'base',
    })
  )
)

const docsByKind = computed(() => {
  const m = {}
  for (const d of docsList.value) {
    m[d.documentType] = d
  }
  return m
})

const totalItems = computed(() => DOCUMENT_ROWS.length)
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value) || 1)
const firstVisibleRow = computed(() =>
  totalItems.value === 0 ? 0 : (currentPage.value - 1) * itemsPerPage.value + 1
)
const lastVisibleRow = computed(() =>
  Math.min(currentPage.value * itemsPerPage.value, totalItems.value)
)

const goToPreviousPage = () => {
  if (currentPage.value > 1) currentPage.value--
}
const goToNextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++
}

async function loadVehicles() {
  isLoading.value = true
  loadError.value = ''
  try {
    const { data } = await api.get('/trucks')
    vehicles.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error(e)
    loadError.value = 'No se pudieron cargar los vehículos.'
    vehicles.value = []
  } finally {
    isLoading.value = false
  }
}

async function loadDocuments() {
  docsError.value = ''
  const id = Number(selectedTruckId.value)
  if (!id) {
    docsList.value = []
    return
  }
  try {
    const { data } = await api.get(`/trucks/${id}/documents`)
    docsList.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error(e)
    docsList.value = []
    docsError.value = 'No se pudieron cargar los documentos.'
  }
}

watch(selectedTruckId, () => {
  currentPage.value = 1
  loadDocuments()
})

function isAllowedDocumentFile(file) {
  if (!file) return false
  const allowedMime = new Set([
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
  ])
  const t = (file.type || '').toLowerCase().trim()
  const extOk = /\.(pdf|png|jpe?g|webp)$/i.test(file.name || '')
  if (allowedMime.has(t)) return true
  if (t === '' || t === 'application/octet-stream') return extOk
  return extOk
}

async function uploadDocument(truckId, kind, file) {
  if (!isAllowedDocumentFile(file)) {
    showAlert(
      'Atención',
      'Selecciona un archivo PDF, PNG, JPEG o WEBP.',
      true
    )
    return
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    showAlert('Error', 'El archivo no puede superar los 20 MB.', true)
    return
  }
  uploadingKind.value = kind
  try {
    const fd = new FormData()
    fd.append('documentType', kind)
    fd.append('file', file)
    await api.post(`/trucks/${truckId}/documents`, fd)
    await loadDocuments()
    isAddModalOpen.value = false
    showAlert('Éxito', 'Archivo subido exitosamente.', false)
  } catch (e) {
    console.error(e)
    const msg =
      e.response?.data?.message ||
      (Array.isArray(e.response?.data?.message)
        ? e.response.data.message.join(', ')
        : null) ||
      'No se pudo subir el archivo.'
    showAlert(
      'Error',
      typeof msg === 'string' ? msg : 'No se pudo subir el archivo.',
      true
    )
  } finally {
    uploadingKind.value = null
  }
}

/** Título del tipo (ej. Permiso de circulación): azul al cargar documento */
function tipoLabelClass(loaded) {
  return [
    'text-sm font-body font-medium leading-snug transition-colors',
    loaded ? 'text-[#1F4E79]' : 'text-[#939393]',
  ]
}

function onViewDocument(kind) {
  const doc = docsByKind.value[kind]
  if (!selectedTruckId.value || !doc) return
  api
    .get(`/trucks/${selectedTruckId.value}/documents/${kind}/url`)
    .then(({ data }) => {
      if (data?.url) {
        window.open(data.url, '_blank', 'noopener,noreferrer')
      }
    })
    .catch((e) => {
      console.error(e)
      const msg = e.response?.data?.message || 'No se pudo abrir el documento.'
      showAlert(
        'Error',
        typeof msg === 'string' ? msg : 'No se pudo abrir el documento.',
        true
      )
    })
}

async function confirmDeleteDocument() {
  const docId = deleteModal.value.docId
  const id = Number(selectedTruckId.value)
  if (!id || docId == null) {
    closeDeleteModal()
    return
  }
  deletingId.value = docId
  try {
    await api.delete(`/trucks/${id}/documents/${docId}`)
    await loadDocuments()
    deleteModal.value = { open: false, docId: null }
    showAlert('Éxito', 'El documento se eliminó correctamente.', false)
  } catch (e) {
    console.error(e)
    const msg =
      e.response?.data?.message || 'No se pudo eliminar el documento.'
    deleteModal.value = { open: false, docId: null }
    showAlert(
      'Error',
      typeof msg === 'string' ? msg : 'No se pudo eliminar el documento.',
      true
    )
  } finally {
    deletingId.value = null
  }
}

function openAddModal() {
  const id = Number(selectedTruckId.value)
  if (!id) {
    showAlert('Atención', 'Selecciona una patente primero.', true)
    return
  }
  addFormKind.value = 'CIRCULATION_PERMIT'
  isAddModalOpen.value = true
}

function closeAddModal() {
  isAddModalOpen.value = false
}

function submitAddModal() {
  const id = Number(selectedTruckId.value)
  const el = addFileInput.value
  const file = el?.files?.[0]
  if (!file) {
    showAlert(
      'Atención',
      'Selecciona un archivo (PDF, PNG, JPEG o WEBP).',
      true
    )
    return
  }
  uploadDocument(id, addFormKind.value, file).then(() => {
    if (el) el.value = ''
  })
}

onMounted(async () => {
  await loadVehicles()
})
</script>

<template>
  <div class="h-screen min-h-0 overflow-hidden bg-background flex flex-col font-sans">
    <div class="shrink-0 bg-white shadow-sm border-b border-gray-200">
      <div class="px-4 py-4 flex items-center justify-between">
        <router-link to="/" class="flex items-center">
          <img
            :src="logoCompleto"
            alt="Transportes Flores Vargas"
            class="h-16 w-auto object-contain hover:opacity-80 transition-opacity"
          />
        </router-link>
        <UserMenu />
      </div>
    </div>

    <div class="flex flex-1 min-h-0 overflow-hidden min-w-0">
      <DashboardSidebar />

      <main
        class="flex-1 min-h-0 pt-4 pb-10 pl-4 pr-3 sm:pr-6 lg:pr-8 overflow-y-auto flex flex-col min-w-0"
      >
        <div
          class="bg-white rounded-[2rem] border-2 border-slate-300 shadow-sm flex-1 flex flex-col overflow-hidden min-h-0 min-w-0 w-full"
        >
          <div class="px-4 sm:px-6 lg:px-8 pt-6 pb-1">
            <button
              type="button"
              @click="router.push('/admin/registro')"
              class="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary transition-colors"
            >
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                viewBox="0 0 24 24"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Volver
            </button>
          </div>
          <div
            class="flex flex-col md:flex-row items-center justify-center px-4 sm:px-8 pt-4 pb-4 sm:pb-5 relative min-h-[4rem] sm:min-h-[5rem] gap-3 md:gap-0 border-b border-slate-100"
          >
            <h1
              class="text-xl sm:text-2xl md:text-3xl font-titles font-extrabold text-slate-900 tracking-tight text-center order-1 md:absolute md:left-1/2 md:-translate-x-1/2 px-4"
            >
              Documentación del vehículo
            </h1>
          </div>

          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-8 md:px-10 py-4 border-b border-slate-100 bg-white">
            <div class="w-full sm:max-w-xs md:max-w-sm">
              <label class="sr-only" for="patente-select">Patente</label>
              <div class="relative">
                <select
                  id="patente-select"
                  v-model="selectedTruckId"
                  class="w-full appearance-none border border-slate-300 rounded-lg px-3 py-2.5 pr-10 bg-white text-sm font-medium text-slate-800 outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="">Selecciona una patente</option>
                  <option
                    v-for="v in sortedVehicles"
                    :key="v.id"
                    :value="String(v.id)"
                  >
                    {{ v.plate || '—' }}
                  </option>
                </select>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 bg-[#0B2545] hover:bg-[#133A6D] text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-all hover:-translate-y-0.5 active:scale-95 shadow-sm whitespace-nowrap shrink-0"
              @click="openAddModal"
            >
              Añadir documentación
            </button>
          </div>

          <div v-if="loadError" class="mx-4 sm:mx-8 mt-4 shrink-0 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg font-body">
            {{ loadError }}
          </div>
          <div
            v-if="docsError"
            class="mx-4 sm:mx-8 mt-4 shrink-0 bg-amber-50 border border-amber-200 text-amber-900 text-sm px-4 py-3 rounded-lg font-body"
          >
            {{ docsError }}
          </div>

          <div
            class="flex-1 w-full overflow-x-auto overflow-y-auto px-3 sm:px-6 md:px-10 relative pb-4 min-w-0 custom-scrollbar"
          >
            <table class="w-full table-fixed text-sm border-collapse min-w-[560px]">
              <colgroup>
                <col class="w-[76px]" />
                <col />
                <col class="w-[180px] sm:w-[220px] md:w-[240px]" />
              </colgroup>
              <thead class="bg-white sticky top-0 z-10">
                <tr>
                  <th
                    class="py-3 px-2 text-center font-titles font-normal text-slate-800 border border-gray-300 border-b-2 border-b-primary"
                  >
                    Año
                  </th>
                  <th
                    class="py-3 px-2 text-center font-titles font-normal text-slate-800 border border-gray-300 border-b-2 border-b-primary"
                  >
                    Tipo de documento
                  </th>
                  <th
                    class="py-3 px-2 text-center font-titles font-normal text-slate-800 border border-gray-300 border-b-2 border-b-primary"
                  >
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="isLoading">
                  <td
                    colspan="3"
                    class="py-10 text-center text-[#939393] text-sm border border-gray-300 font-body"
                  >
                    Cargando vehículos…
                  </td>
                </tr>
                <template v-else>
                  <tr
                    v-for="(row, idx) in DOCUMENT_ROWS"
                    :key="row.kind"
                    class="hover:bg-slate-50 transition-colors"
                  >
                    <td
                      v-if="idx === 0"
                      rowspan="4"
                      class="py-4 px-2 text-center align-middle text-sm font-body font-medium border border-gray-300 bg-white text-[#939393]"
                    >
                      {{ currentDocumentationYear }}
                    </td>
                    <td
                      class="py-3.5 pl-7 pr-4 text-left text-sm border border-gray-300 align-top"
                    >
                      <div class="flex flex-col gap-1 min-w-0">
                        <span :class="tipoLabelClass(!!docsByKind[row.kind])">
                          {{ row.label }}
                        </span>
                        <span
                          v-if="docsByKind[row.kind]?.originalName"
                          class="text-xs font-body font-medium text-[#1F4E79] truncate"
                          :title="docsByKind[row.kind].originalName"
                        >
                          {{ docsByKind[row.kind].originalName }}
                        </span>
                      </div>
                    </td>
                    <td
                      class="py-2.5 px-2 text-center align-middle border border-gray-300 min-w-[180px] sm:min-w-[220px]"
                    >
                      <div
                        class="flex items-center justify-center gap-1.5 flex-wrap mx-auto max-w-full px-0.5"
                      >
                        <button
                          type="button"
                          title="Abrir el documento en otra pestaña"
                          class="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-slate-600 hover:text-slate-900 transition-colors bg-white rounded-full px-2.5 py-1.5 shadow-sm border border-gray-300 disabled:opacity-50 shrink-0"
                          :disabled="!selectedTruckId || !docsByKind[row.kind]"
                          @click="onViewDocument(row.kind)"
                        >
                          <svg
                            class="w-3.5 h-3.5 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            stroke-width="2.2"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          Ver
                        </button>
                        <button
                          type="button"
                          class="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-slate-600 hover:text-[#A61919] transition-colors bg-white rounded-full px-2.5 py-1.5 shadow-sm border border-gray-300 disabled:opacity-50 shrink-0"
                          :disabled="
                            !selectedTruckId ||
                            !docsByKind[row.kind] ||
                            deletingId === docsByKind[row.kind]?.id
                          "
                          @click="openDeleteModal(docsByKind[row.kind]?.id)"
                        >
                          <svg
                            class="w-3.5 h-3.5 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            stroke-width="2.2"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>

          <div
            class="px-3 sm:px-6 md:px-10 py-4 sm:py-5 bg-white flex flex-wrap justify-between items-center gap-2 text-xs font-semibold text-slate-500 border-t border-gray-100 mt-auto rounded-b-[2rem]"
          >
            <div class="flex items-center gap-3">
              <span>Filas por páginas</span>
              <div class="relative">
                <select
                  v-model.number="itemsPerPage"
                  class="appearance-none border border-slate-300 rounded px-2 py-1 pr-6 bg-white outline-none focus:border-primary cursor-pointer text-slate-700"
                >
                  <option :value="100">100</option>
                  <option :value="50">50</option>
                  <option :value="25">25</option>
                </select>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  class="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
            <div class="flex items-center gap-6">
              <span>{{ firstVisibleRow }}-{{ lastVisibleRow }} de {{ totalItems }}</span>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  @click="goToPreviousPage"
                  :disabled="currentPage <= 1 || isLoading"
                  class="p-1 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-40 transition-colors"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  @click="goToNextPage"
                  :disabled="currentPage >= totalPages || isLoading"
                  class="p-1 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-40 transition-colors"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Modal Añadir documentación -->
    <Teleport to="body">
      <div
        v-if="isAddModalOpen"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40"
        @click.self="closeAddModal"
      >
        <div
          class="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-doc-title"
        >
          <h2
            id="add-doc-title"
            class="text-lg font-titles font-bold text-[#0B2545] mb-4"
          >
            Añadir documentación
          </h2>
          <div class="flex flex-col gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-500 mb-1"
                >Tipo de documento</label
              >
              <select
                v-model="addFormKind"
                class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary"
              >
                <option value="CIRCULATION_PERMIT">
                  Permiso de circulación
                </option>
                <option value="INSURANCE">SOAP</option>
                <option value="TECHNICAL_REVIEW">Revisión técnica</option>
                <option value="EMISSIONS">
                  Emisión de contaminantes
                </option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 mb-1"
                >Archivo PDF</label
              >
              <input
                ref="addFileInput"
                type="file"
                :accept="DOCUMENT_FILE_ACCEPT"
                class="block w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-800 file:font-semibold"
              />
            </div>
          </div>
          <div class="flex justify-end gap-2 mt-6">
            <button
              type="button"
              class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              @click="closeAddModal"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="px-4 py-2 text-sm font-bold text-white bg-[#0B2545] hover:bg-[#133A6D] rounded-lg disabled:opacity-50"
              :disabled="!!uploadingKind"
              @click="submitAddModal"
            >
              {{ uploadingKind ? 'Subiendo…' : 'Subir' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Alerta Éxito / Error (Mant. semanales) -->
    <Teleport to="body">
      <div
        v-if="alertModal.open"
        class="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      >
        <div
          class="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden border border-gray-200"
        >
          <div class="p-6 text-center">
            <div
              class="mx-auto flex h-12 w-12 items-center justify-center rounded-full mb-4"
              :class="
                alertModal.isError
                  ? 'bg-red-100 text-red-600'
                  : 'bg-emerald-100 text-emerald-600'
              "
            >
              <svg
                v-if="!alertModal.isError"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="3"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <svg
                v-else
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h3 class="text-lg font-bold text-slate-900 mb-2">
              {{ alertModal.title }}
            </h3>
            <p class="text-sm text-slate-500 mb-6">
              {{ alertModal.message }}
            </p>
            <button
              type="button"
              class="w-full inline-flex justify-center rounded-xl border border-transparent px-4 py-2 font-bold text-white shadow-sm focus:outline-none transition-colors"
              :class="
                alertModal.isError
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-[#1b2e4b] hover:bg-[#2a4365]'
              "
              @click="closeAlertModal"
            >
              Aceptar
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Confirmar eliminar (Historial mant. mensual) -->
    <Teleport to="body">
      <div
        v-if="deleteModal.open"
        class="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        @click.self="closeDeleteModal"
      >
        <div
          class="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden border border-gray-200"
        >
          <div class="p-6 text-center">
            <div
              class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4"
            >
              <svg
                class="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 class="text-lg font-bold text-slate-900 mb-2">Eliminar Registro</h3>
            <p class="text-sm text-slate-500 mb-6">
              ¿Estás seguro de que deseas eliminar este documento? Esta acción es
              totalmente irreversible.
            </p>
            <div class="flex flex-col gap-2">
              <button
                type="button"
                :disabled="deletingId != null"
                class="w-full inline-flex justify-center rounded-xl bg-red-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-red-700 focus:outline-none transition-colors disabled:opacity-50"
                @click="confirmDeleteDocument"
              >
                {{
                  deletingId != null
                    ? 'Eliminando…'
                    : 'Sí, eliminar'
                }}
              </button>
              <button
                type="button"
                :disabled="deletingId != null"
                class="w-full inline-flex justify-center rounded-xl bg-slate-100 px-4 py-2 font-bold text-slate-700 shadow-sm hover:bg-slate-200 focus:outline-none transition-colors"
                @click="closeDeleteModal"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
