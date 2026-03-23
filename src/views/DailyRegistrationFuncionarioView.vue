<script setup>
import { ref, computed } from 'vue'
import logoCompleto from '@/assets/images/Logo-completo.png'
import DashboardSidebar from '@/components/DashboardSidebar.vue'
import { useAuthStore } from '@/stores/auth'
import { useTripsStore } from '@/stores/trips'
import UserMenu from '@/components/UserMenu.vue'

const auth = useAuthStore()
const tripsStore = useTripsStore()

// ── Mock data (reemplazar con API) ────────────────────────────────────
const mockPatients = [
  { id: 1,  name: 'Paciente 1'  },
  { id: 2,  name: 'Paciente 2'  },
  { id: 3,  name: 'Paciente 3'  },
  { id: 4,  name: 'Paciente 4'  },
  { id: 5,  name: 'Paciente 5'  },
  { id: 6,  name: 'Paciente 6'  },
  { id: 7,  name: 'Paciente 7'  },
  { id: 8,  name: 'Paciente 8'  },
  { id: 9,  name: 'Paciente 9'  },
  { id: 10, name: 'Paciente 10' },
]

// Patente asignada (viene del backend, mock por ahora)
const assignedPlate = ref('Patente 1')

// ── Date & Time ────────────────────────────────────────────────────────
const currentDate = computed(() => {
  const t = new Date()
  return `${String(t.getDate()).padStart(2,'0')}/${String(t.getMonth()+1).padStart(2,'0')}/${t.getFullYear()}`
})

const getCurrentTime = () => {
  const t = new Date()
  return `${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}`
}

// ── Rows (registros del funcionario) ──────────────────────────────────
let rowCounter = 1
const newRow = () => ({
  id:          rowCounter++,
  horaInicio:  '',
  horaFinal:   '',
  patente:     '',
  destino:     '',
  firma:       '',
  paciente:    null,
  firmaPaciente: '',
})

const rows = ref([newRow()])
const addRow = () => rows.value.push(newRow())

const saveRow = (row) => {
  if (!row.horaInicio || !row.horaFinal || !row.patente || !row.destino) {
    alert('Por favor complete todos los campos obligatorios del viaje antes de guardar.')
    return
  }
  
  tripsStore.addCompletedTrip({
    date: currentDate.value,
    licensePlate: row.patente,
    startTime: row.horaInicio,
    endTime: row.horaFinal,
    destination: row.destino,
    patient: row.paciente ? row.paciente.name : null,
    patientSignature: Boolean(row.firmaPaciente),
    signature: Boolean(row.firma),
  })
  
  // Opcional: Marcar la fila como guardada para UI feedback
  row.isSaved = true
}

// ── Paciente modal ────────────────────────────────────────────────────
const patientModal = ref({ open: false, row: null, search: '' })

const openPatientModal = (row) => {
  patientModal.value = { open: true, row, search: '' }
}

const closePatientModal = () => {
  patientModal.value.open = false
}

const filteredPatients = computed(() =>
  mockPatients.filter(p =>
    p.name.toLowerCase().includes(patientModal.value.search.toLowerCase())
  )
)

const selectPatient = (patient) => {
  if (patientModal.value.row) patientModal.value.row.paciente = patient
  closePatientModal()
}

// ── Pagination ────────────────────────────────────────────────────────
const currentPage  = ref(1)
const rowsPerPage  = ref(100)
const totalRows    = ref(200) // mock total

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value
  const end   = start + rowsPerPage.value
  return rows.value.slice(start, end)
})

const totalPages = computed(() => Math.max(1, Math.ceil(totalRows.value / rowsPerPage.value)))

const paginationLabel = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value + 1
  const end   = Math.min(currentPage.value * rowsPerPage.value, totalRows.value)
  return `${start}-${end} de ${totalRows.value}`
})

const prevPage = () => { if (currentPage.value > 1) currentPage.value-- }
const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++ }
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

    <!-- Body -->
    <div class="flex flex-1">
      <DashboardSidebar />

      <main class="flex-1 py-10 px-6 flex items-start justify-center">
        <div class="w-full max-w-5xl">
          <div class="bg-white rounded-3xl border-2 border-slate-300 shadow-sm overflow-visible">

            <!-- Encabezado -->
            <div class="px-8 pt-8 pb-4">
              <h1 class="text-3xl font-titles font-bold text-text-title text-center mb-6">Registro diario</h1>

              <div class="flex items-center justify-between mb-3">
                <span class="font-titles font-semibold text-text-title">
                  Patente: <span class="text-primary">{{ assignedPlate }}</span>
                </span>
                <span class="text-gray-500 font-body text-sm">{{ currentDate }}</span>
              </div>
            </div>

            <!-- Tabla -->
            <div class="overflow-x-auto">
              <table class="w-full text-sm font-body border-t border-gray-200">
                <thead>
                  <tr class="border-b border-gray-200 bg-gray-50 text-text-title font-semibold">
                    <th class="px-4 py-3 text-center" colspan="2">Hora</th>
                    <th class="px-4 py-3 text-left border-l border-gray-200">Patente</th>
                    <th class="px-4 py-3 text-left border-l border-gray-200">Destino</th>
                    <th class="px-4 py-3 text-left border-l border-gray-200">Firma</th>
                    <th class="px-4 py-3 text-left border-l border-gray-200">Paciente</th>
                    <th class="px-4 py-3 text-left border-l border-gray-200">Firma</th>
                  </tr>
                  <tr class="border-b border-gray-200 bg-gray-50 text-text-title text-xs">
                    <th class="px-4 py-1 text-center">Inicio</th>
                    <th class="px-4 py-1 text-center border-l border-gray-200">Final</th>
                    <th class="px-4 py-1 border-l border-gray-200"></th>
                    <th class="px-4 py-1 border-l border-gray-200"></th>
                    <th class="px-4 py-1 border-l border-gray-200"></th>
                    <th class="px-2 py-1 border-l border-gray-200 text-center w-10">Guardar</th>
                    <th class="px-4 py-1 border-l border-gray-200"></th>
                    <th class="px-4 py-1 border-l border-gray-200"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in paginatedRows"
                    :key="row.id"
                    class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <!-- Hora Inicio -->
                    <td class="px-2 py-3 text-center min-w-[120px]">
                      <div class="flex items-center justify-center gap-1">
                        <button
                          @click="row.horaInicio = getCurrentTime()"
                          :disabled="row.isSaved"
                          title="Fijar hora inicio actual"
                          class="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors disabled:opacity-50"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        </button>
                        <input
                          type="time"
                          v-model="row.horaInicio"
                          :disabled="row.isSaved"
                          class="bg-transparent outline-none text-sm text-center w-[75px] font-body disabled:text-gray-400 p-0 m-0"
                        />
                      </div>
                    </td>

                    <!-- Hora Final -->
                    <td class="px-2 py-3 text-center border-l border-gray-200 min-w-[120px]">
                      <div class="flex items-center justify-center gap-1">
                        <input
                          type="time"
                          v-model="row.horaFinal"
                          :disabled="row.isSaved"
                          class="bg-transparent outline-none text-sm text-center w-[75px] font-body disabled:text-gray-400 p-0 m-0"
                        />
                        <button
                          @click="row.horaFinal = getCurrentTime()"
                          :disabled="row.isSaved"
                          title="Fijar hora final actual"
                          class="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h12v12H6z"/></svg>
                        </button>
                      </div>
                    </td>

                    <!-- Patente -->
                    <td class="px-4 py-3 border-l border-gray-200">
                      <input
                        type="text"
                        v-model="row.patente"
                        class="bg-transparent outline-none text-sm w-full font-body"
                        placeholder="Patente"
                      />
                    </td>

                    <!-- Destino -->
                    <td class="px-4 py-3 border-l border-gray-200">
                      <input
                        type="text"
                        v-model="row.destino"
                        class="bg-transparent outline-none text-sm w-full font-body"
                        placeholder="Destino"
                      />
                    </td>

                    <!-- Firma -->
                    <td class="px-4 py-3 border-l border-gray-200">
                      <input
                        type="text"
                        v-model="row.firma"
                        class="bg-transparent outline-none text-sm w-full font-body"
                        placeholder=""
                      />
                    </td>

                    <!-- Paciente -->
                    <td class="px-4 py-3 border-l border-gray-200">
                      <button
                        type="button"
                        @click="openPatientModal(row)"
                        class="flex items-center justify-between w-full text-sm outline-none group"
                        :class="row.paciente ? 'text-text-title' : 'text-gray-300'"
                      >
                        <span>{{ row.paciente ? row.paciente.name : 'Nombre Apellido' }}</span>
                        <svg class="w-3 h-3 text-gray-400 ml-2 shrink-0 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
                        </svg>
                      </button>
                    </td>

                    <!-- Firma Paciente -->
                    <td class="px-4 py-3 border-l border-gray-200">
                      <input
                        type="text"
                        v-model="row.firmaPaciente"
                        :disabled="row.isSaved"
                        class="bg-transparent outline-none text-sm w-full font-body disabled:text-gray-400"
                        placeholder=""
                      />
                    </td>

                    <!-- Botón Guardar fila -->
                    <td class="px-2 py-3 border-l border-gray-200 text-center">
                      <button
                        v-if="!row.isSaved"
                        @click="saveRow(row)"
                        title="Guardar viaje en el historial"
                        class="inline-flex items-center justify-center w-8 h-8 rounded bg-[#215179] hover:bg-blue-900 text-white shadow-sm transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                      </button>
                      <span v-else class="inline-flex items-center justify-center w-8 h-8 text-green-600" title="Viaje guardado">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            <div class="px-8 py-4 flex items-center justify-between border-t border-gray-100">
              <!-- Scroll indicator (visual) -->
              <div class="flex items-center gap-2">
                <button class="text-gray-400 hover:text-primary transition-colors">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                </button>
                <div class="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div class="h-full bg-primary rounded-full" style="width: 50%"></div>
                </div>
                <button class="text-gray-400 hover:text-primary transition-colors">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                </button>
              </div>

              <!-- Rows per page + page nav -->
              <div class="flex items-center gap-6">
                <div class="flex items-center gap-2">
                  <span class="text-sm text-text-secondary font-body">Filas por páginas</span>
                  <select
                    v-model="rowsPerPage"
                    class="border border-gray-200 rounded-lg px-2 py-1 text-sm font-body bg-white outline-none focus:border-primary"
                  >
                    <option :value="10">10</option>
                    <option :value="25">25</option>
                    <option :value="50">50</option>
                    <option :value="100">100</option>
                  </select>
                </div>

                <span class="text-sm text-text-secondary font-body">{{ paginationLabel }}</span>

                <div class="flex items-center gap-1">
                  <button
                    @click="prevPage"
                    :disabled="currentPage === 1"
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                  </button>
                  <button
                    @click="nextPage"
                    :disabled="currentPage >= totalPages"
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>

    <!-- ═══════════════════════════════════════ -->
    <!-- MODAL: Buscar paciente                 -->
    <!-- ═══════════════════════════════════════ -->
    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="patientModal.open" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="closePatientModal" />
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 overflow-hidden">
          <!-- Header -->
          <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 class="font-titles font-semibold text-text-title">Buscar paciente</h3>
            <button @click="closePatientModal" class="text-gray-400 hover:text-gray-600 transition-colors">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Search -->
          <div class="px-4 py-3 border-b border-gray-100">
            <div class="relative">
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
              </svg>
              <input
                v-model="patientModal.search"
                placeholder="Escriba el nombre..."
                class="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary transition-colors"
                autofocus
              />
            </div>
          </div>

          <!-- List -->
          <ul class="max-h-60 overflow-y-auto divide-y divide-gray-50">
            <li
              v-for="patient in filteredPatients"
              :key="patient.id"
              @click="selectPatient(patient)"
              class="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-blue-50 transition-colors group"
              :class="{ 'bg-blue-50': patientModal.row?.paciente?.id === patient.id }"
            >
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors"
                :class="patientModal.row?.paciente?.id === patient.id
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-500 group-hover:bg-primary group-hover:text-white'"
              >
                {{ patient.id }}
              </div>
              <span
                class="text-sm font-body transition-colors"
                :class="patientModal.row?.paciente?.id === patient.id ? 'text-primary font-semibold' : 'text-text-title'"
              >{{ patient.name }}</span>
            </li>
            <li v-if="filteredPatients.length === 0" class="px-5 py-6 text-center text-sm text-gray-400">
              Sin resultados para "{{ patientModal.search }}"
            </li>
          </ul>
        </div>
      </div>
    </transition>
  </div>
</template>
