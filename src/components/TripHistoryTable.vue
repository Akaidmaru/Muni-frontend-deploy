<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  trips: {
    type: Array,
    required: true
  },
  role: {
    type: String,
    default: 'driver' // 'driver', 'admin'
  },
  // --- Admin/Global Props ---
  isLoading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  // --- Driver Props ---
  destinations: {
    type: Array,
    default: () => []
  },
  isLoadingDestinations: {
    type: Boolean,
    default: false
  },
  destinationsError: {
    type: String,
    default: ''
  },
  adminDrivers: {
    type: Array,
    default: () => []
  },
  adminDestinations: {
    type: Array,
    default: () => []
  },
  adminTrucksByDriver: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits([
  'start-trip',
  'stop-trip',
  'open-employee',
  'open-signature',
  // Admin specific events
  'edit-trip',
  'delete-trip',
  'request-save-trip',
  'view-map'
]);

const editingTripId = ref(null);
const editingTripData = ref({});
const OTHER_DESTINATION_VALUE = '__other__';

const startEditing = (trip) => {
  editingTripId.value = trip.id;
  editingTripData.value = { ...trip };
  editingTripData.value.date = trip.dateIso || '';

  if (editingTripData.value.driverId) {
    const trucks = getDriverTrucks(editingTripData.value.driverId);
    const hasCurrentTruck = trucks.some(
      (truck) => truck.id === editingTripData.value.truckId,
    );

    if (!hasCurrentTruck) {
      editingTripData.value.truckId = null;
      editingTripData.value.licensePlate = '';
    }
  }
};

const cancelEditing = () => {
  editingTripId.value = null;
  editingTripData.value = {};
};

const saveEditing = () => {
  if (!isAdminEditComplete.value) return;
  emit('request-save-trip', editingTripData.value);
};

defineExpose({
  cancelEditing
});

const canStartTrip = (trip) => {
  const hasDestination =
    trip.destination === OTHER_DESTINATION_VALUE
      ? Boolean(trip.customDestination?.trim())
      : Boolean(trip.destination);

  return Boolean(hasDestination && trip.employee);
};

// Cross-browser fix: remove readonly on focus prevents Firefox & Chrome
// from showing autocomplete history suggestions
const makeEditable = (e) => e.target.removeAttribute('readonly');

const getDriverTrucks = (driverId) => {
  if (!driverId) return [];
  return props.adminTrucksByDriver[driverId] || [];
};

const onAdminDriverChange = () => {
  const trucks = getDriverTrucks(editingTripData.value.driverId);
  const hasCurrentTruck = trucks.some((truck) => truck.id === editingTripData.value.truckId);

  if (!hasCurrentTruck) {
    editingTripData.value.truckId = null;
    editingTripData.value.licensePlate = '';
  }
};

const onAdminTruckChange = () => {
  const selectedTruck = getDriverTrucks(editingTripData.value.driverId).find(
    (truck) => truck.id === editingTripData.value.truckId,
  );
  editingTripData.value.licensePlate = selectedTruck?.plate || '';
};

const onAdminDestinationChange = () => {
  const selectedDestination = props.adminDestinations.find(
    (destination) => destination.id === editingTripData.value.destinationId,
  );
  editingTripData.value.destination = selectedDestination?.name || '';
};

const hasValue = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') {
    const trimmedValue = value.trim();
    return trimmedValue.length > 0 && trimmedValue !== '--:--';
  }
  return true;
};

const isValidNumberField = (value) => {
  if (!hasValue(value)) return false;
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue);
};

const isAdminEditComplete = computed(() => {
  const current = editingTripData.value;
  return (
    hasValue(current.date) &&
    hasValue(current.driverId) &&
    hasValue(current.truckId) &&
    hasValue(current.destinationId) &&
    hasValue(current.startTime) &&
    hasValue(current.endTime) &&
    hasValue(current.status) &&
    isValidNumberField(current.startKm) &&
    isValidNumberField(current.endKm)
  );
});
</script>

<template>
  <!-- Empty datalist suppresses browser autocomplete suggestions in Firefox & Chrome -->
  <datalist id="trip-no-suggestions"></datalist>

  <table class="history-table w-full text-sm font-body text-center" style="border-collapse: separate; border-spacing: 0;">
    <!-- HEADERS -->
    <thead class="text-[13px] text-text-title font-bold sticky top-0 bg-white z-10">
      <!-- Admin Header Row -->
      <tr v-if="role === 'admin'">
        <th rowspan="2" class="align-middle no-border-cell w-8"></th>
        <th rowspan="2" class="align-middle">Fecha</th>
        <th rowspan="2" class="align-middle">Patente</th>
        <th colspan="2">Hora</th>
        <th rowspan="2" class="align-middle">Destino</th>
        <th rowspan="2" class="align-middle">Estado</th>
        <th colspan="2">Kilometraje</th>
        <th rowspan="2" class="align-middle">Conductor</th>
        <th rowspan="2" class="align-middle">Funcionario</th>
        <th rowspan="2" class="align-middle">Firma</th>
        <th rowspan="2" class="align-middle no-border-cell w-8"></th>
      </tr>
      <tr v-if="role === 'admin'">
        <th class="text-xs font-semibold border-t-0">Inicio</th>
        <th class="text-xs font-semibold border-t-0">Final</th>
        <th class="text-xs font-semibold border-t-0">Inicio</th>
        <th class="text-xs font-semibold border-t-0">Final</th>
      </tr>
      
      <!-- Driver Header Row -->
      <tr v-if="role === 'driver'" class="border-b border-gray-200">
        <th class="px-6 py-3 text-center w-24">Viaje</th>
        <th class="px-6 py-3 text-center border-l border-gray-200">Destino</th>
        <th class="px-6 py-3 text-center border-l border-gray-200">Funcionario</th>
        <th class="px-6 py-3 text-center border-l border-gray-200">Firma</th>
        <!-- <th class="px-6 py-3 text-center border-l border-gray-200 w-48">Paciente</th> -->
      </tr>
    </thead>

    <!-- BODY -->
    <tbody class="text-center font-body">
      <!-- Loading / Error States for Admin -->
      <tr v-if="isLoading">
        <td colspan="12" class="px-3 py-20 text-center text-text-secondary font-medium">
          Cargando viajes...
        </td>
      </tr>
      <tr v-else-if="error">
        <td colspan="12" class="px-3 py-20 text-center text-red-600 font-medium">
          {{ error }}
        </td>
      </tr>

      <!-- Data Rows -->
      <tr v-else v-for="trip in trips" :key="trip.id" 
          class="border-b border-gray-100 transition-colors hover:bg-gray-50"
          :class="{
            'bg-green-50': role === 'driver' && trip.status === 'running',
            'bg-gray-50': role === 'driver' && trip.status === 'done',
          }">
        
        <!-- ADMIN COLUMNS -->
        <template v-if="role === 'admin'">
          <!-- Edit/Delete & Save/Cancel buttons slot -->
          <td class="px-2 py-5 text-gray-400 no-border-cell w-10">
            <div v-if="editingTripId === trip.id" class="flex flex-col gap-3 items-center justify-center">
              <button
                @click="saveEditing"
                :disabled="!isAdminEditComplete"
                class="transition-colors focus:outline-none"
                :class="isAdminEditComplete ? 'text-green-600 hover:text-green-700' : 'text-green-300 cursor-not-allowed'"
                :title="isAdminEditComplete ? 'Guardar cambios' : 'Completa todos los campos para guardar'"
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
              </button>
              <button @click="$emit('delete-trip', trip)" class="text-red-400 hover:text-red-600 transition-colors focus:outline-none" title="Eliminar viaje">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            <div v-else class="flex items-center justify-center">
              <button @click="startEditing(trip)" class="hover:text-primary transition-colors focus:outline-none" title="Editar viaje">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          </td>

          <template v-if="editingTripId === trip.id">
            <td class="px-2 py-5 text-gray-500 text-sm">
              <input type="date" v-model="editingTripData.date" autocomplete="off" class="w-[140px] text-center border border-gray-300 rounded px-1 py-1 text-xs outline-none focus:border-primary bg-white cursor-pointer">
            </td>
            <td class="px-2 py-5 font-semibold text-text-title">
              <select
                v-model.number="editingTripData.truckId"
                @change="onAdminTruckChange"
                :disabled="!editingTripData.driverId"
                class="w-full text-center border border-gray-300 rounded px-1 py-1 text-xs outline-none focus:border-primary bg-white cursor-pointer disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option :value="null" disabled>
                  {{ editingTripData.driverId ? 'Selecciona patente...' : 'Selecciona conductor...' }}
                </option>
                <option
                  v-for="truck in getDriverTrucks(editingTripData.driverId)"
                  :key="truck.id"
                  :value="truck.id"
                >
                  {{ truck.plate }}
                </option>
              </select>
            </td>
            <td class="px-2 py-5 text-gray-500">
              <input type="time" v-model="editingTripData.startTime" autocomplete="off" class="w-full text-center border border-gray-300 rounded px-1 py-1 text-xs outline-none focus:border-primary cursor-pointer">
            </td>
            <td class="px-2 py-5 text-gray-500">
              <input type="time" v-model="editingTripData.endTime" autocomplete="off" class="w-full text-center border border-gray-300 rounded px-1 py-1 text-xs outline-none focus:border-primary cursor-pointer">
            </td>
            <td class="px-2 py-5 text-gray-700 text-xs">
              <select
                v-model.number="editingTripData.destinationId"
                @change="onAdminDestinationChange"
                class="w-full min-w-[120px] text-center border border-gray-300 rounded px-1 py-1 text-xs outline-none focus:border-primary bg-white cursor-pointer"
              >
                <option :value="null" disabled>Selecciona destino...</option>
                <option
                  v-for="destination in adminDestinations"
                  :key="destination.id"
                  :value="destination.id"
                >
                  {{ destination.name }}
                </option>
              </select>
            </td>
            <td class="px-2 py-5 text-gray-700 text-xs">
              <select v-model="editingTripData.status" class="w-full border border-gray-300 rounded px-1 py-1 text-[11px] outline-none focus:border-primary bg-white cursor-pointer">
                <option value="DRIVER_FILLING">En transcurso</option>
                <option value="COMPLETED">Completado</option>
              </select>
            </td>
            <td class="px-2 py-5 font-medium">
              <input list="trip-no-suggestions" type="number" step="1" v-model="editingTripData.startKm" readonly @focus="makeEditable" autocomplete="off" class="w-[60px] text-center border border-gray-300 rounded px-1 py-1 text-xs outline-none focus:border-primary">
            </td>
            <td class="px-2 py-5 font-medium">
              <input list="trip-no-suggestions" type="number" step="1" v-model="editingTripData.endKm" readonly @focus="makeEditable" autocomplete="off" class="w-[60px] text-center border border-gray-300 rounded px-1 py-1 text-xs outline-none focus:border-primary">
            </td>
            <td class="px-4 py-5 text-gray-700 text-xs">
              <select
                v-model.number="editingTripData.driverId"
                @change="onAdminDriverChange"
                class="w-full min-w-[120px] text-center border border-gray-300 rounded px-1 py-1 text-xs outline-none focus:border-primary bg-white cursor-pointer"
              >
                <option :value="null" disabled>Selecciona conductor...</option>
                <option
                  v-for="driver in adminDrivers"
                  :key="driver.id"
                  :value="driver.id"
                >
                  {{ driver.name || driver.email }}
                </option>
              </select>
            </td>
            <td class="px-4 py-5 text-gray-700 text-xs">
              <input list="trip-no-suggestions" type="text" v-model="editingTripData.official" readonly @focus="makeEditable" autocomplete="off" class="w-full min-w-[120px] text-center border border-gray-300 rounded px-1 py-1 text-xs outline-none focus:border-primary">
            </td>
          </template>
          
          <template v-else>
            <td class="px-2 py-5 text-gray-500 text-sm">{{ trip.date }}</td>
            <td class="px-2 py-5 font-semibold text-text-title">{{ trip.licensePlate }}</td>
            <td class="px-2 py-5 text-gray-500">{{ trip.startTime }}</td>
            <td class="px-2 py-5 text-gray-500">{{ trip.endTime }}</td>
            <td class="px-2 py-5 text-gray-700 text-xs">{{ trip.destination }}</td>
            
            <!-- ESTADO -->
            <td class="px-2 py-5 text-gray-700 text-xs">
              {{ trip.status === 'COMPLETED' ? 'Completado' : 'En transcurso' }}
            </td>

            <td class="px-2 py-5 font-medium">{{ trip.startKm ?? '-' }}</td>
            <td class="px-2 py-5 font-medium">{{ trip.endKm ?? '-' }}</td>
            <td class="px-4 py-5 text-gray-700 text-xs">{{ trip.driver }}</td>
            <td class="px-4 py-5 text-gray-700 text-xs">{{ trip.official }}</td>
          </template>

          <td class="px-4 py-5 border-l-0 border-r-0">
            <div v-if="trip.signatureDataUrl || trip.signatureUrl" class="w-full flex justify-center">
              <a
                :href="trip.signatureUrl || trip.signatureDataUrl"
                target="_blank"
                rel="noopener noreferrer"
                title="Ver firma"
                class="inline-block"
              >
                <img
                  :src="trip.signatureDataUrl || trip.signatureUrl"
                  alt="Firma"
                  class="h-7 max-w-[90px] object-contain opacity-90"
                />
              </a>
            </div>
            <span v-else>-</span>
          </td>

          <!-- Map button slot -->
          <td class="px-2 py-5 text-gray-400 no-border-cell">
            <button @click="$emit('view-map', trip)" class="text-[#215179] hover:text-blue-900 transition-colors focus:outline-none" title="Ver en mapa">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </button>
          </td>
        </template>

        <!-- DRIVER COLUMNS -->
        <template v-if="role === 'driver'">
          <!-- Viaje: botón acción -->
          <td class="px-6 py-4 text-center">
            <!-- Iniciar -->
            <button v-if="trip.status === 'idle'" @click="$emit('start-trip', trip)"
              :disabled="!canStartTrip(trip) || trip.isSaving"
              title="Iniciar viaje"
              class="inline-flex items-center justify-center w-9 h-9 rounded-full text-white shadow transition-all duration-200"
              :class="!canStartTrip(trip) || trip.isSaving ? 'bg-green-300 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 hover:scale-110'">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </button>
            <!-- Finalizar -->
            <button v-else-if="trip.status === 'running'" @click="$emit('stop-trip', trip)"
              title="Finalizar viaje"
              class="inline-flex items-center justify-center w-9 h-9 rounded-full bg-red-500 hover:bg-red-600 text-white shadow transition-all duration-200 hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h12v12H6z"/></svg>
            </button>
            <!-- Completado -->
            <span v-else class="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gray-200 text-gray-400" title="Viaje finalizado">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            </span>
          </td>

          <!-- Destino: select -->
          <td class="px-6 py-4 border-l border-gray-200">
            <select v-model="trip.destination"
              :disabled="trip.status === 'done' || isLoadingDestinations || destinations.length === 0"
              class="w-full bg-transparent outline-none cursor-pointer font-body text-sm disabled:text-gray-400"
              :class="trip.destination ? 'text-text-title' : 'text-gray-300'">
              <option :value="null" disabled>
                {{ isLoadingDestinations ? "Cargando destinos..." : (destinations.length === 0 ? "No hay destinos disponibles" : "Nombre del destino") }}
              </option>
              <option v-for="dest in destinations" :key="dest.id" :value="dest.id" class="text-text-title">
                {{ dest.name }}
              </option>
              <option :value="OTHER_DESTINATION_VALUE" class="text-text-title">
                Otro
              </option>
            </select>
            <div v-if="trip.destination === OTHER_DESTINATION_VALUE" class="mt-2 flex items-center gap-1">
              <input
                v-model="trip.customDestination"
                type="text"
                placeholder="Ingrese nombre o dirección"
                :disabled="trip.status === 'done'"
                class="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-text-title outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-gray-100 disabled:text-gray-400"
              />
              <button
                v-if="trip.status !== 'done'"
                type="button"
                @click="trip.destination = null; trip.customDestination = ''"
                title="Quitar selección"
                class="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <p v-if="destinationsError" class="mt-2 text-xs text-red-600">{{ destinationsError }}</p>
          </td>

          <!-- Funcionario: abre modal de búsqueda -->
          <td class="px-6 py-4 border-l border-gray-200">
            <div v-if="trip.status !== 'done'" class="flex items-center gap-1">
              <button type="button" @click="$emit('open-employee', trip)"
                class="flex items-center justify-between flex-1 text-sm outline-none group"
                :class="trip.employee ? 'text-text-title' : 'text-gray-300'">
                <span>{{ trip.employee ? trip.employee.name : "Nombre Apellido" }}</span>
                <svg class="w-3 h-3 text-gray-400 ml-2 shrink-0 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
                </svg>
              </button>
              <button
                v-if="trip.employee?.id === '__other__'"
                type="button"
                @click="trip.employee = null"
                title="Quitar selección"
                class="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <span v-else class="text-sm text-gray-400">{{ trip.employee ? trip.employee.name : "—" }}</span>
          </td>

          <!-- Firma -->
          <td class="px-6 py-4 border-l border-gray-200 text-center align-middle">
            <div v-if="trip.signatureDataUrl" class="flex justify-center items-center w-full" title="Firmado">
              <img :src="trip.signatureDataUrl" alt="Firma" class="h-10 w-auto object-contain bg-white rounded shadow-sm border border-gray-100" />
            </div>
            <div v-else-if="trip.signature" class="flex flex-col items-center justify-center text-green-500" title="Firmado">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
            </div>
            <button v-else @click="$emit('open-signature', trip)"
              class="text-sm font-semibold text-[#215179] hover:text-blue-700 underline transition-colors">
              Firmar
            </button>
          </td>
        </template>
      </tr>

      <tr v-if="!isLoading && !error && trips.length === 0 && role === 'admin'">
        <td colspan="12" class="px-3 py-20 text-center text-text-secondary font-medium">
          No hay viajes que coincidan con la busqueda.
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
.history-table {
  border-collapse: separate !important;
  border-spacing: 0 !important;
}
.history-table thead th:not(.no-border-cell) {
  border: 1px solid #555 !important;
  padding: 10px 12px !important;
  letter-spacing: 0.02em;
}
.history-table tbody td:not(.no-border-cell) {
  border: 1px solid #d1d1d1 !important;
  padding: 12px 8px;
}
.history-table th.no-border-cell, .history-table td.no-border-cell, .no-border-cell {
  border: none !important;
  background: transparent !important;
}
</style>
