<script setup>
import { ref, computed, onMounted } from "vue";
import logoCompleto from "@/assets/images/Logo-completo.png";
import DashboardSidebar from "@/components/DashboardSidebar.vue";
import { useAuthStore } from "@/stores/auth";
import { useTripsStore } from "@/stores/trips";
import UserMenu from "@/components/UserMenu.vue";
import api from "@/services/axios";

const auth = useAuthStore();
const tripsStore = useTripsStore();
const tripActionError = ref("");

const destinations = ref([]);
const isLoadingDestinations = ref(false);
const destinationsError = ref("");

const loadDestinations = async () => {
  isLoadingDestinations.value = true;
  destinationsError.value = "";

  try {
    const { data } = await api.get("/destinations/active");
    destinations.value = Array.isArray(data)
      ? data
          .filter((destination) => destination?.id && destination?.name)
          .map((destination) => ({
            id: destination.id,
            name: destination.name,
          }))
      : [];
  } catch (error) {
    const backendMessage = error.response?.data?.message;
    destinationsError.value = Array.isArray(backendMessage)
      ? backendMessage.join(", ")
      : backendMessage || "No se pudieron cargar los destinos.";
    destinations.value = [];
  } finally {
    isLoadingDestinations.value = false;
  }
};

const employees = ref([]);
const isLoadingEmployees = ref(false);
const employeesError = ref("");

const loadEmployees = async () => {
  isLoadingEmployees.value = true;
  employeesError.value = "";

  try {
    const { data } = await api.get("/users/by-roles", {
      params: { roles: "EMPLOYEE" },
    });

    employees.value = Array.isArray(data)
      ? data
          .filter((user) => user?.id)
          .map((user) => ({
            id: user.id,
            name: user.name || user.email || `Funcionario ${user.id}`,
          }))
      : [];
  } catch (error) {
    const backendMessage = error.response?.data?.message;
    employeesError.value = Array.isArray(backendMessage)
      ? backendMessage.join(", ")
      : backendMessage || "No se pudieron cargar los funcionarios.";
    employees.value = [];
  } finally {
    isLoadingEmployees.value = false;
  }
};

// ── User (desde auth store) ───────────────────────────────────────────

// ── License plates (desde API) ───────────────────────────────────────
const licensePlates = ref([]);
const isLoadingPlates = ref(false);
const platesError = ref("");

const loadAssignedTrucks = async () => {
  isLoadingPlates.value = true;
  platesError.value = "";

  try {
    const { data } = await api.get("/users/me/trucks");
    licensePlates.value = Array.isArray(data)
      ? data
          .filter((truck) => truck?.id && truck?.plate)
          .map((truck) => ({ id: truck.id, plate: truck.plate }))
      : [];
  } catch (error) {
    const backendMessage = error.response?.data?.message;
    platesError.value = Array.isArray(backendMessage)
      ? backendMessage.join(", ")
      : backendMessage || "No se pudieron cargar las patentes asignadas.";
    licensePlates.value = [];
  } finally {
    isLoadingPlates.value = false;
  }
};

const selectedPlate = ref("");
const confirmed = ref(false);

// ── Date ──────────────────────────────────────────────────────────────
const currentDate = computed(() => {
  const t = new Date();
  return `${String(t.getDate()).padStart(2, "0")}/${String(t.getMonth() + 1).padStart(2, "0")}/${t.getFullYear()}`;
});

// Obtains current time HH:MM
const getCurrentTime = () => {
  const t = new Date();
  return `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
};

// ── Step 1 → 2 ────────────────────────────────────────────────────────
const handleConfirm = () => {
  if (!selectedPlate.value) return;
  tripActionError.value = "";
  trips.value = [newTrip()];
  confirmed.value = true;
};
// ── Cambiar patente modales ───────────────────────────────────────────
const changePlateModal = ref({ step: 0 }); // 0=cerrado, 1=confirmar, 2=motivo
const changePlateReason = ref("");

const openChangePlate = () => {
  changePlateReason.value = "";
  changePlateModal.value.step = 1;
};

const confirmStep1 = () => {
  changePlateModal.value.step = 2;
};

const cancelStep1 = () => {
  changePlateModal.value.step = 0;
};

const confirmStep2 = () => {
  // TODO: enviar motivo al backend → POST /api/plate-change-reasons
  // { plate: selectedPlate.value, reason: changePlateReason.value, date: currentDate }
  console.log("Motivo cambio de patente:", changePlateReason.value);
  changePlateModal.value.step = 0;
  confirmed.value = false;
  selectedPlate.value = "";
  trips.value = [];
};

const cancelStep2 = () => {
  // Cancela: NO redirige al selector de patente
  changePlateModal.value.step = 0;
};

// ── Detener viaje modal ──────────────────────────────────────────────
const stopTripModal = ref({ open: false, trip: null });

const openStopTrip = (trip) => {
  stopTripModal.value = { open: true, trip };
};

const confirmStopTrip = async () => {
  const trip = stopTripModal.value.trip;
  if (trip) {
    tripActionError.value = "";

    try {
      if (!trip.historyId) {
        tripActionError.value =
          "Este viaje no tiene ID en base de datos. Inícielo nuevamente para poder finalizarlo.";
        return;
      }

      const endTime = getCurrentTime();
      const { data } = await api.patch(
        `/trip-history/${trip.historyId}/finish`,
        {
          endTime,
        },
      );
      trip.endTime = data?.endTime || endTime;

      trip.status = "done";

      // Enviar viaje completado al store para mostrar en el historial
      tripsStore.addCompletedTrip({
        date: currentDate.value,
        licensePlate: selectedPlate.value,
        startTime: trip.startTime,
        endTime: trip.endTime,
        destination: getDestinationNameById(trip.destination),
        startKm: null,
        endKm: null,
        official: trip.employee ? trip.employee.name : null,
        signature: true,
      });
    } catch (error) {
      const backendMessage = error.response?.data?.message;
      tripActionError.value = Array.isArray(backendMessage)
        ? backendMessage.join(", ")
        : backendMessage || "No se pudo finalizar el viaje.";
      return;
    }
  }
  stopTripModal.value = { open: false, trip: null };
};

const cancelStopTrip = () => {
  stopTripModal.value = { open: false, trip: null };
};

// ── Trips ─────────────────────────────────────────────────────────────
let tripCounter = 1;
const newTrip = () => ({
  id: tripCounter++,
  destination: null,
  employee: null, // { id, name }
  historyId: null,
  startTime: null,
  endTime: null,
  isSaving: false,
  status: "idle", // 'idle' | 'running' | 'done'
});

const trips = ref([]);

const addTrip = () => trips.value.push(newTrip());
const canStartTrip = (trip) => Boolean(trip.destination && trip.employee);

const getDestinationNameById = (destinationId) => {
  const destination = destinations.value.find(
    (dest) => dest.id === destinationId,
  );
  return destination?.name || "Sin destino";
};

const startTrip = async (trip) => {
  if (!canStartTrip(trip) || trip.isSaving) return;

  const startTime = getCurrentTime();
  tripActionError.value = "";
  trip.isSaving = true;

  try {
    const { data } = await api.post("/trip-history/start", {
      plate: selectedPlate.value,
      destinationId: Number(trip.destination),
      employeeId: Number(trip.employee.id),
      startTime,
    });

    const createdHistoryId = Number(data?.id);
    if (!Number.isInteger(createdHistoryId) || createdHistoryId <= 0) {
      throw new Error(
        "La respuesta del backend no contiene un ID de viaje válido.",
      );
    }

    trip.historyId = createdHistoryId;
    trip.startTime = data.startTime || startTime;
    trip.status = "running";
  } catch (error) {
    const backendMessage = error.response?.data?.message;
    tripActionError.value = Array.isArray(backendMessage)
      ? backendMessage.join(", ")
      : backendMessage || "No se pudo iniciar el viaje.";
  } finally {
    trip.isSaving = false;
  }
};

// ── Funcionario modal ─────────────────────────────────────────────────
const empModal = ref({ open: false, trip: null, search: "" });

const openEmpModal = (trip) => {
  empModal.value = { open: true, trip, search: "" };
};

const closeEmpModal = () => {
  empModal.value.open = false;
};

const filteredEmployees = computed(() =>
  employees.value.filter((e) =>
    e.name.toLowerCase().includes(empModal.value.search.toLowerCase()),
  ),
);

const getEmployeeAvatarLabel = (name) => {
  const parts = String(name || "")
    .trim()
    .split(" ")
    .filter(Boolean);
  if (parts.length >= 2) return parts[1].charAt(0).toUpperCase();
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return "?";
};

const selectEmployee = (emp) => {
  if (empModal.value.trip) empModal.value.trip.employee = emp;
  closeEmpModal();
};

onMounted(() => {
  loadAssignedTrucks();
  loadEmployees();
  loadDestinations();
});
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b border-gray-200">
      <div class="px-4 py-4 flex items-center justify-between">
        <router-link to="/" class="flex items-center">
          <img
            :src="logoCompleto"
            alt="Transportes Flores Vargas"
            class="h-16 w-auto object-contain hover:opacity-80 transition-opacity"
          />
        </router-link>
        <!-- User Menu -->
        <UserMenu />
      </div>
    </div>

    <!-- Body -->
    <div class="flex flex-1">
      <DashboardSidebar />

      <main class="flex-1 py-10 px-6 overflow-hidden flex items-start justify-center">
        <!-- ═══════════════════════════════════ -->
        <!-- PASO 1 – Seleccionar patente        -->
        <!-- ═══════════════════════════════════ -->
        <div v-if="!confirmed" class="w-full max-w-xl">
          <div
            class="bg-white rounded-3xl border-2 border-slate-300 p-8 md:p-12 shadow-sm"
          >
            <h1
              class="text-3xl font-titles font-bold text-text-title text-center mb-16"
            >
              Registro diario
            </h1>

            <div class="flex justify-between items-center mb-12 px-4">
              <span class="font-body text-text-title font-medium text-lg">{{
                auth.fullName
              }}</span>
              <span class="font-body text-gray-500 font-medium text-lg">{{
                currentDate
              }}</span>
            </div>

            <div class="max-w-xs mx-auto mb-12">
              <div class="relative">
                <select
                  v-model="selectedPlate"
                  class="w-full px-6 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-primary focus:border-primary font-body text-sm bg-white appearance-none cursor-pointer text-center"
                  :class="selectedPlate ? 'text-text-title' : 'text-gray-400'"
                  :disabled="isLoadingPlates || licensePlates.length === 0"
                >
                  <option value="" disabled>
                    {{
                      isLoadingPlates
                        ? "Cargando patentes..."
                        : licensePlates.length === 0
                          ? "No tiene patentes asignadas"
                          : "Seleccione la patente asignada"
                    }}
                  </option>
                  <option
                    v-for="lp in licensePlates"
                    :key="lp.id"
                    :value="lp.plate"
                    class="text-text-title"
                  >
                    {{ lp.plate }}
                  </option>
                </select>
                <div
                  class="absolute inset-y-0 right-4 flex items-center pointer-events-none"
                >
                  <svg
                    class="h-4 w-4 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
              <p
                v-if="platesError"
                class="mt-2 text-xs text-red-600 text-center"
              >
                {{ platesError }}
              </p>
            </div>

            <div class="flex justify-center">
              <button
                @click="handleConfirm"
                :disabled="!selectedPlate || isLoadingPlates"
                class="px-12 py-3 bg-[#215179] hover:bg-blue-900 text-white font-bold rounded-xl shadow-md transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>

        <!-- ═══════════════════════════════════ -->
        <!-- PASO 2 – Tabla de viajes            -->
        <!-- ═══════════════════════════════════ -->
        <div v-else class="flex gap-6 w-full max-w-5xl h-full min-h-0">
          <div
            class="bg-white rounded-3xl border-2 border-slate-300 shadow-sm overflow-hidden flex-1 flex flex-col"
          >
            <!-- Encabezado de la tarjeta -->
            <div class="px-8 pt-8 pb-4">
              <h1
                class="text-3xl font-titles font-bold text-text-title text-center mb-6"
              >
                Registro diario
              </h1>

              <div class="flex items-center justify-between mb-3">
                <span class="font-titles font-semibold text-text-title">
                  Patente: <span class="text-primary">{{ selectedPlate }}</span>
                </span>
                <span class="text-gray-500 font-body text-sm">{{
                  currentDate
                }}</span>
              </div>

              <div class="mb-4">
                <button
                  @click="openChangePlate"
                  class="px-5 py-2 bg-[#215179] hover:bg-blue-900 text-white text-sm font-bold rounded-lg shadow transition-all duration-200"
                >
                  Cambiar patente
                </button>
              </div>
              <p v-if="tripActionError" class="text-sm text-red-600 font-body">
                {{ tripActionError }}
              </p>
            </div>

            <!-- Tabla -->
            <div class="overflow-x-auto px-12 md:px-16 relative mt-6 pb-6">
              <table class="history-table w-full text-sm font-body">
                <thead>
                  <tr
                    class="border-b border-gray-200 text-text-title font-semibold"
                  >
                    <th class="px-6 py-3 text-center w-24">Viaje</th>
                    <th class="px-6 py-3 text-center border-l border-gray-200">
                      Destino
                    </th>
                    <th class="px-6 py-3 text-center border-l border-gray-200">
                      Funcionario
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="trip in trips"
                    :key="trip.id"
                    class="border-b border-gray-100 transition-colors"
                    :class="{
                      'bg-green-50': trip.status === 'running',
                      'bg-gray-50': trip.status === 'done',
                    }"
                  >
                    <!-- Viaje: botón acción -->
                    <td class="px-6 py-4 text-center">
                      <!-- Iniciar -->
                      <button
                        v-if="trip.status === 'idle'"
                        @click="startTrip(trip)"
                        :disabled="!canStartTrip(trip) || trip.isSaving"
                        title="Iniciar viaje"
                        class="inline-flex items-center justify-center w-9 h-9 rounded-full text-white shadow transition-all duration-200"
                        :class="
                          !canStartTrip(trip) || trip.isSaving
                            ? 'bg-green-300 cursor-not-allowed'
                            : 'bg-green-500 hover:bg-green-600 hover:scale-110'
                        "
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>
                      <!-- Finalizar -->
                      <button
                        v-else-if="trip.status === 'running'"
                        @click="openStopTrip(trip)"
                        title="Finalizar viaje"
                        class="inline-flex items-center justify-center w-9 h-9 rounded-full bg-red-500 hover:bg-red-600 text-white shadow transition-all duration-200 hover:scale-110"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M6 6h12v12H6z" />
                        </svg>
                      </button>
                      <!-- Completado -->
                      <span
                        v-else
                        class="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gray-200 text-gray-400"
                        title="Viaje finalizado"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </span>
                    </td>

                    <!-- Destino: select -->
                    <td class="px-6 py-4 border-l border-gray-200">
                      <select
                        v-model.number="trip.destination"
                        :disabled="
                          trip.status === 'done' ||
                          isLoadingDestinations ||
                          destinations.length === 0
                        "
                        class="w-full bg-transparent outline-none cursor-pointer font-body text-sm disabled:text-gray-400"
                        :class="
                          trip.destination ? 'text-text-title' : 'text-gray-300'
                        "
                      >
                        <option :value="null" disabled>
                          {{
                            isLoadingDestinations
                              ? "Cargando destinos..."
                              : destinations.length === 0
                                ? "No hay destinos disponibles"
                                : "Nombre del destino"
                          }}
                        </option>
                        <option
                          v-for="dest in destinations"
                          :key="dest.id"
                          :value="dest.id"
                          class="text-text-title"
                        >
                          {{ dest.name }}
                        </option>
                      </select>
                      <p
                        v-if="destinationsError"
                        class="mt-2 text-xs text-red-600"
                      >
                        {{ destinationsError }}
                      </p>
                    </td>

                    <!-- Funcionario: abre modal de búsqueda -->
                    <td class="px-6 py-4 border-l border-gray-200">
                      <button
                        v-if="trip.status !== 'done'"
                        type="button"
                        @click="openEmpModal(trip)"
                        class="flex items-center justify-between w-full text-sm outline-none group"
                        :class="
                          trip.employee ? 'text-text-title' : 'text-gray-300'
                        "
                      >
                        <span>{{
                          trip.employee ? trip.employee.name : "Nombre Apellido"
                        }}</span>
                        <svg
                          class="w-3 h-3 text-gray-400 ml-2 shrink-0 group-hover:text-primary transition-colors"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                          />
                        </svg>
                      </button>
                      <span v-else class="text-sm text-gray-400">
                        {{ trip.employee ? trip.employee.name : "—" }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Footer: agregar viaje -->
            <div class="px-8 py-4 flex justify-end border-t border-gray-100">
              <button
                @click="addTrip"
                class="flex items-center gap-2 px-5 py-2 bg-[#215179] hover:bg-blue-900 text-white text-sm font-bold rounded-lg shadow transition-all duration-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2.5"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Agregar viaje
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- ═══════════════════════════════════════ -->
    <!-- MODAL PASO 1: ¿Está seguro?             -->
    <!-- ═══════════════════════════════════════ -->
    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="changePlateModal.step === 1"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div class="absolute inset-0 bg-black/40" @click="cancelStep1" />
        <div
          class="relative bg-white rounded-2xl w-full max-w-lg z-10 p-10 shadow-[0_30px_80px_-5px_rgba(0,0,0,0.5),0_0_0_1px_rgba(0,0,0,0.06)]"
        >
          <!-- X -->
          <button
            @click="cancelStep1"
            class="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              class="w-5 h-5"
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
          </button>
          <!-- Título -->
          <h3
            class="font-titles font-bold text-text-title text-center text-2xl mb-5"
          >
            Cambiar patente
          </h3>
          <!-- Texto -->
          <p class="text-base text-text-secondary font-body text-center mb-8">
            ¿Está seguro de cambiar de patente?
          </p>
          <!-- Botones -->
          <div class="flex gap-4 justify-center">
            <button
              @click="confirmStep1"
              class="px-8 py-3 bg-[#9B2335] hover:bg-red-800 text-white font-bold rounded-lg shadow transition-all duration-200"
            >
              Confirmar
            </button>
            <button
              @click="cancelStep1"
              class="px-8 py-3 bg-[#215179] hover:bg-blue-900 text-white font-bold rounded-lg shadow transition-all duration-200"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ═══════════════════════════════════════ -->
    <!-- MODAL PASO 2: Motivo del cambio         -->
    <!-- ═══════════════════════════════════════ -->
    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="changePlateModal.step === 2"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div class="absolute inset-0 bg-black/40" @click="cancelStep2" />
        <div
          class="relative bg-white rounded-2xl w-full max-w-lg z-10 p-10 shadow-[0_30px_80px_-5px_rgba(0,0,0,0.5),0_0_0_1px_rgba(0,0,0,0.06)]"
        >
          <!-- X -->
          <button
            @click="cancelStep2"
            class="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              class="w-5 h-5"
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
          </button>
          <!-- Título -->
          <h3
            class="font-titles font-bold text-text-title text-center text-2xl mb-5"
          >
            Cambiar patente
          </h3>
          <!-- Textarea -->
          <textarea
            v-model="changePlateReason"
            placeholder="Por favor especifique el motivo del cambio de la patente."
            rows="5"
            class="w-full text-sm font-body border border-gray-200 rounded-xl bg-gray-50 px-4 py-3 outline-none focus:border-primary resize-none mb-8 placeholder-gray-400"
          />
          <!-- Botones -->
          <div class="flex gap-4 justify-center">
            <button
              @click="confirmStep2"
              :disabled="!changePlateReason.trim()"
              class="px-8 py-3 bg-[#9B2335] hover:bg-red-800 text-white font-bold rounded-lg shadow transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Confirmar
            </button>
            <button
              @click="cancelStep2"
              class="px-8 py-3 bg-[#215179] hover:bg-blue-900 text-white font-bold rounded-lg shadow transition-all duration-200"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ═══════════════════════════════════════ -->
    <!-- MODAL: Detener viaje                    -->
    <!-- ═══════════════════════════════════════ -->
    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="stopTripModal.open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div class="absolute inset-0 bg-black/40" @click="cancelStopTrip" />
        <div
          class="relative bg-white rounded-2xl w-full max-w-lg z-10 p-10 shadow-[0_30px_80px_-5px_rgba(0,0,0,0.5),0_0_0_1px_rgba(0,0,0,0.06)]"
        >
          <!-- X -->
          <button
            @click="cancelStopTrip"
            class="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              class="w-5 h-5"
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
          </button>
          <!-- Título -->
          <h3
            class="font-titles font-bold text-text-title text-center text-2xl mb-5"
          >
            Detener viaje
          </h3>
          <!-- Texto -->
          <p class="text-base text-text-secondary font-body text-center mb-8">
            ¿Está seguro de finalizar el viaje?
          </p>
          <!-- Botones -->
          <div class="flex gap-4 justify-center">
            <button
              @click="confirmStopTrip"
              class="px-8 py-3 bg-[#9B2335] hover:bg-red-800 text-white font-bold rounded-lg shadow transition-all duration-200"
            >
              Confirmar
            </button>
            <button
              @click="cancelStopTrip"
              class="px-8 py-3 bg-[#215179] hover:bg-blue-900 text-white font-bold rounded-lg shadow transition-all duration-200"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ═══════════════════════════════════════ -->
    <!-- MODAL: Buscar funcionario               -->
    <!-- ═══════════════════════════════════════ -->
    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="empModal.open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/40" @click="closeEmpModal" />

        <!-- Panel -->
        <div
          class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 overflow-hidden"
        >
          <!-- Header del modal -->
          <div
            class="flex items-center justify-between px-5 py-4 border-b border-gray-100"
          >
            <h3 class="font-titles font-semibold text-text-title">
              Buscar funcionario
            </h3>
            <button
              @click="closeEmpModal"
              class="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                class="w-5 h-5"
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
            </button>
          </div>

          <!-- Barra de búsqueda -->
          <div class="px-4 py-3 border-b border-gray-100">
            <div class="relative">
              <svg
                class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                />
              </svg>
              <input
                v-model="empModal.search"
                placeholder="Escriba el nombre..."
                class="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary transition-colors"
                autofocus
              />
            </div>
          </div>

          <!-- Lista de resultados -->
          <ul class="max-h-60 overflow-y-auto divide-y divide-gray-50">
            <li
              v-if="isLoadingEmployees"
              class="px-5 py-6 text-center text-sm text-gray-400"
            >
              Cargando funcionarios...
            </li>
            <li
              v-else-if="employeesError"
              class="px-5 py-6 text-center text-sm text-red-600"
            >
              {{ employeesError }}
            </li>
            <li
              v-else
              v-for="emp in filteredEmployees"
              :key="emp.id"
              @click="selectEmployee(emp)"
              class="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-blue-50 transition-colors group"
              :class="{ 'bg-blue-50': empModal.trip?.employee?.id === emp.id }"
            >
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors"
                :class="
                  empModal.trip?.employee?.id === emp.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-500 group-hover:bg-primary group-hover:text-white'
                "
              >
                {{ getEmployeeAvatarLabel(emp.name) }}
              </div>
              <span
                class="text-sm font-body transition-colors"
                :class="
                  empModal.trip?.employee?.id === emp.id
                    ? 'text-primary font-semibold'
                    : 'text-text-title'
                "
                >{{ emp.name }}</span
              >
            </li>
            <li
              v-if="
                !isLoadingEmployees &&
                !employeesError &&
                filteredEmployees.length === 0
              "
              class="px-5 py-6 text-center text-sm text-gray-400"
            >
              Sin resultados para "{{ empModal.search }}"
            </li>
          </ul>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.history-table {
  border-collapse: separate;
  border-spacing: 0;
}

.history-table thead th {
  border: 1px solid #555 !important;
  padding: 10px 12px !important;
  letter-spacing: 0.02em;
  background: #fff !important;
}

.history-table tbody td {
  border: 1px solid #d1d1d1 !important;
  padding: 12px 8px;
}
</style>
