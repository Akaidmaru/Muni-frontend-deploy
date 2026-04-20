<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import logoCompleto from "@/assets/images/Logo-completo.png";
import DashboardSidebar from "@/components/DashboardSidebar.vue";
import TripHistoryTable from "@/components/TripHistoryTable.vue";
import { useAuthStore } from "@/stores/auth";
import { useTripsStore } from "@/stores/trips";
import { useVehicleAlertsStore } from "@/stores/vehicleAlerts";
import UserMenu from "@/components/UserMenu.vue";
import api from "@/services/axios";

const auth = useAuthStore();
const tripsStore = useTripsStore();
const vehicleAlertsStore = useVehicleAlertsStore();
const router = useRouter();
const route = useRoute();
const tripActionError = ref("");
const gpsStatusError = ref("");

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
            patients: destination.patients || [],
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
    const { data } = await api.get("/employees");

    employees.value = Array.isArray(data)
      ? data
          .filter((employee) => employee?.id)
          .map((employee) => ({
            id: employee.id,
            name: employee.name || `Funcionario ${employee.id}`,
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
    // Intentar cargar camiones asignados al conductor
    const { data: assignedTrucks } = await api.get("/users/me/trucks");
    const trucks = Array.isArray(assignedTrucks)
      ? assignedTrucks
          .filter((truck) => truck?.id && truck?.plate)
          .map((truck) => ({ id: truck.id, plate: truck.plate }))
      : [];

    // Si el conductor tiene camiones asignados, usar esos
    if (trucks.length > 0) {
      licensePlates.value = trucks;
    } else {
      // Si no tiene, cargar camiones sin asignar
      const { data: unassignedTrucks } = await api.get("/trucks/unassigned");
      licensePlates.value = Array.isArray(unassignedTrucks)
        ? unassignedTrucks
            .filter((truck) => truck?.id && truck?.plate)
            .map((truck) => ({ id: truck.id, plate: truck.plate }))
        : [];
    }
  } catch (error) {
    const backendMessage = error.response?.data?.message;
    platesError.value = Array.isArray(backendMessage)
      ? backendMessage.join(", ")
      : backendMessage || "No se pudieron cargar las patentes.";
    licensePlates.value = [];
  } finally {
    isLoadingPlates.value = false;
  }
};

const selectedPlate = ref("");
const plateSelectRef = ref(null);
const confirmed = ref(false);
const isConfirming = ref(false);
const isFinishingTrip = ref(false);

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

const gpsTrackers = new Map();
const GPS_BATCH_SIZE = 1;
const GPS_MIN_DISTANCE_METERS = 8;
const GPS_SOFT_FLUSH_INTERVAL_MS = 25000;

const haversineMeters = (a, b) => {
  const R = 6371000;
  const phi1 = (a.latitude * Math.PI) / 180;
  const phi2 = (b.latitude * Math.PI) / 180;
  const deltaPhi = ((b.latitude - a.latitude) * Math.PI) / 180;
  const deltaLambda = ((b.longitude - a.longitude) * Math.PI) / 180;
  const h =
    Math.sin(deltaPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
};

const hasGeolocationSupport = () =>
  typeof navigator !== 'undefined' && !!navigator.geolocation;

const getGpsTracker = (historyId) => gpsTrackers.get(historyId);

const flushGpsPoints = async (historyId) => {
  const tracker = getGpsTracker(historyId);
  if (!tracker || tracker.sending || tracker.queue.length === 0) {
    return true;
  }

  const pointsToSend = tracker.queue.splice(0, tracker.queue.length);
  tracker.sending = true;

  try {
    await api.post(`/trip-history/${historyId}/points`, {
      points: pointsToSend,
    });
    return true;
  } catch (error) {
    tracker.queue.unshift(...pointsToSend);
    console.error('No se pudieron enviar los puntos GPS', error);
    return false;
  } finally {
    tracker.sending = false;
  }
};

const stopGpsTracking = (historyId) => {
  const tracker = getGpsTracker(historyId);
  if (!tracker) return;

  if (tracker.watchId !== null && hasGeolocationSupport()) {
    navigator.geolocation.clearWatch(tracker.watchId);
  }

  if (tracker.intervalId) {
    window.clearInterval(tracker.intervalId);
  }

  gpsTrackers.delete(historyId);
};

const startGpsTracking = (trip) => {
  if (!trip?.historyId || gpsTrackers.has(trip.historyId)) {
    return true;
  }

  if (!hasGeolocationSupport()) {
    gpsStatusError.value = 'Este navegador no permite capturar la ubicación GPS.';
    return false;
  }

  const tracker = {
    queue: [],
    sending: false,
    watchId: null,
    intervalId: null,
    lastCapturedPoint: null,
  };

  tracker.watchId = navigator.geolocation.watchPosition(
    (position) => {
      const latitude = Number(position.coords.latitude);
      const longitude = Number(position.coords.longitude);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return;
      }

      const lastPoint = tracker.lastCapturedPoint;
      if (lastPoint && lastPoint.latitude === latitude && lastPoint.longitude === longitude) {
        return;
      }

      if (
        lastPoint &&
        haversineMeters(lastPoint, { latitude, longitude }) < GPS_MIN_DISTANCE_METERS
      ) {
        return;
      }

      tracker.queue.push({
        latitude,
        longitude,
        capturedAt: new Date().toISOString(),
      });
      tracker.lastCapturedPoint = { latitude, longitude };

      if (tracker.queue.length >= GPS_BATCH_SIZE) {
        void flushGpsPoints(trip.historyId);
      }
    },
    (error) => {
      console.error('Error capturando GPS', error);
      gpsStatusError.value = 'No se pudo obtener la ubicación del vehículo.';
    },
    {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 10000,
    },
  );

  // Soft fallback: if distance-triggered sends do not happen for a while,
  // flush pending points to reduce data loss on unstable connections.
  tracker.intervalId = window.setInterval(() => {
    void flushGpsPoints(trip.historyId);
  }, GPS_SOFT_FLUSH_INTERVAL_MS);

  gpsTrackers.set(trip.historyId, tracker);
  return true;
};

const getLocalDateParam = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const plateFromRoute = computed(() => {
  const plate = route.query.plate;
  return Array.isArray(plate) ? plate[0] : plate || "";
});

const resolveTruckIdByPlate = async (plate) => {
  try {
    const { data } = await api.get(
      `/daily-maintenance-records/mileage-suggestion/plate/${encodeURIComponent(plate)}`,
    );
    return data?.truckId || null;
  } catch {
    return null;
  }
};

const hasMaintenanceToday = async (driverId, truckId) => {
  if (!driverId || !truckId) return false;

  try {
    const { data } = await api.get(
      `/daily-maintenance-records/driver/${driverId}/truck/${truckId}/date`,
      {
        params: { date: getLocalDateParam() },
      },
    );
    return !!data;
  } catch {
    return false;
  }
};

// ── Step 1 → 2 ────────────────────────────────────────────────────────
const handleConfirm = async () => {
  if (isConfirming.value) return;

  let plate = selectedPlate.value;
  if (!plate && plateSelectRef.value?.value) {
    plate = plateSelectRef.value.value;
    selectedPlate.value = plate;
  }

  if (!plate) return;
  tripActionError.value = "";

  isConfirming.value = true;

  try {
    const truckId = await resolveTruckIdByPlate(plate);
    const alreadyFilled = await hasMaintenanceToday(auth.user?.id, truckId);

    if (alreadyFilled) {
      selectedPlate.value = plate;
      confirmed.value = true;
      return;
    }

    await router.push({
      name: 'daily-registration-maintenance',
      query: { plate }
    });
  } finally {
    isConfirming.value = false;
  }
};
// ── Cambiar patente modales ───────────────────────────────────────────
const changePlateModal = ref({ step: 0 }); // 0=cerrado, 1=confirmar, 2=motivo
const changePlateReason = ref("");
const changePlateCategory = ref("");
const isSubmittingPlateChange = ref(false);

const openChangePlate = () => {
  changePlateReason.value = "";
  changePlateCategory.value = "";
  changePlateModal.value.step = 1;
};

const confirmStep1 = () => {
  changePlateModal.value.step = 2;
};

const cancelStep1 = () => {
  changePlateModal.value.step = 0;
};

const confirmStep2 = async () => {
  if (isSubmittingPlateChange.value) return;

  const truck = licensePlates.value.find(
    (item) => item.plate === selectedPlate.value,
  );

  if (!truck?.id) {
    tripActionError.value =
      "No se encontró el camión seleccionado para registrar el cambio.";
    return;
  }

  tripActionError.value = "";
  isSubmittingPlateChange.value = true;

  try {
    const reason =
      changePlateCategory.value === "Avería" ? "AVERIA" : "LOGISTICA";

    await api.post("/trucks/plate-change", {
      truckId: Number(truck.id),
      reason,
      observations: changePlateReason.value.trim(),
    });

    if (changePlateCategory.value === "Avería") {
      vehicleAlertsStore.addOutOfServiceAlert({
        plate: selectedPlate.value,
        driver: auth.fullName || auth.user?.email || "Conductor sin nombre",
        reason: changePlateReason.value.trim(),
        category: changePlateCategory.value,
      });
    }

    await loadAssignedTrucks();
    changePlateModal.value.step = 0;
    confirmed.value = false;
    selectedPlate.value = "";
    trips.value = [];
  } catch (error) {
    const backendMessage = error.response?.data?.message;
    tripActionError.value = Array.isArray(backendMessage)
      ? backendMessage.join(", ")
      : backendMessage || "No se pudo registrar el cambio de patente.";
  } finally {
    isSubmittingPlateChange.value = false;
  }
};

const cancelStep2 = () => {
  // Cancela: NO redirige al selector de patente
  changePlateModal.value.step = 0;
};

// --- Signature Canvas Logic ---
const signatureCanvas = ref(null);
let isDrawing = false;
let ctx = null;
const signatureError = ref("");
const hasSignature = ref(false);

const initCanvas = () => {
  if (!signatureCanvas.value) return;
  const canvas = signatureCanvas.value;
  // Fit canvas to parent container or fixed size
  canvas.width = canvas.offsetWidth || 400;
  canvas.height = 200;
  ctx = canvas.getContext("2d");
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  
  // Clear background properly
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  hasSignature.value = false;
  signatureError.value = "";
};

const getPointerPos = (e) => {
  const canvas = signatureCanvas.value;
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
};

const startDrawing = (e) => {
  if (!ctx) return;
  e.preventDefault(); // prevent scrolling on touch
  isDrawing = true;
  const pos = getPointerPos(e);
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
};

const draw = (e) => {
  if (!isDrawing || !ctx) return;
  e.preventDefault();
  const pos = getPointerPos(e);
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
  hasSignature.value = true;
};

const stopDrawing = () => {
  if (!isDrawing) return;
  isDrawing = false;
  if (ctx) ctx.closePath();
};

const clearSignature = () => {
  if (!signatureCanvas.value || !ctx) return;
  const canvas = signatureCanvas.value;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  hasSignature.value = false;
  signatureError.value = "";
};

// ── Modal de Pacientes ────────────────────────────────────────────────
const patientModal = ref({ open: false, trip: null });
const tempSelectedPatients = ref([]);

const openPatientModal = (trip) => {
  if (!trip.destination) {
    tripActionError.value = "Seleccione un destino primero para agregar pacientes.";
    return;
  }
  patientModal.value = { open: true, trip };
  tempSelectedPatients.value = [...(trip.patients || [])];
};

const closePatientModal = () => {
  patientModal.value = { open: false, trip: null };
  tempSelectedPatients.value = [];
};

const togglePatientSelection = (patientId) => {
  const index = tempSelectedPatients.value.indexOf(patientId);
  if (index === -1) {
    tempSelectedPatients.value.push(patientId);
  } else {
    tempSelectedPatients.value.splice(index, 1);
  }
};

const savePatientModal = () => {
  if (patientModal.value.trip) {
    patientModal.value.trip.patients = [...tempSelectedPatients.value];
  }
  closePatientModal();
};

const getDestinationPatients = (destId) => {
  const dest = destinations.value.find((d) => d.id === destId);
  return dest?.patients || [];
};

const getPatientNames = (trip) => {
  if (!trip.patients || trip.patients.length === 0) return "Seleccionar Pacientes";
  const allPatients = getDestinationPatients(trip.destination);
  const names = trip.patients.map((id) => allPatients.find((p) => p.id === id)?.name).filter(Boolean);
  return names.length > 0 ? names.join(", ") : "Seleccionar Pacientes";
};

const getPatientNamesAsArray = (trip) => {
  if (!trip.patients || trip.patients.length === 0) return [];
  const allPatients = getDestinationPatients(trip.destination);
  return trip.patients.map((id) => allPatients.find((p) => p.id === id)?.name).filter(Boolean);
};

// ── Modal de Firma Independiente ──────────────────────────────────────
const signatureModal = ref({ open: false, trip: null, autoConfirm: false });

const openSignatureModal = (trip, autoConfirm = false) => {
  if (stopTripModal.value.open) {
    stopTripModal.value.open = false;
  }
  signatureModal.value = { open: true, trip, autoConfirm };
  signatureError.value = "";
  nextTick(() => {
    initCanvas();
  });
};

const closeSignatureModal = () => {
  signatureModal.value = { open: false, trip: null, autoConfirm: false };
};

const saveSignatureBtn = () => {
  const trip = signatureModal.value.trip;
  if (!trip) return;
  if (!hasSignature.value) {
    signatureError.value = "Por favor firme antes de guardar.";
    return;
  }
  trip.signatureDataUrl = signatureCanvas.value.toDataURL("image/png");
  trip.signature = true;
  
  const autoConfirm = signatureModal.value.autoConfirm;
  closeSignatureModal();

  if (autoConfirm) {
    setTimeout(() => {
      openStopTrip(trip);
    }, 200);
  }
};

// ── Detener viaje modal ──────────────────────────────────────────────
const stopTripModal = ref({ open: false, trip: null });

const openStopTrip = (trip) => {
  stopTripModal.value = { open: true, trip };
};

const confirmStopTrip = async () => {
  if (isFinishingTrip.value) return;

  const trip = stopTripModal.value.trip;
  if (trip) {
    isFinishingTrip.value = true;
    tripActionError.value = "";

    try {
      if (!trip.historyId) {
        tripActionError.value =
          "Este viaje no tiene ID en base de datos. Inícielo nuevamente para poder finalizarlo.";
        return;
      }

      if (!trip.signatureDataUrl) {
        return; // Debe firmar primero
      }

      if (trip.historyId) {
        const flushed = await flushGpsPoints(trip.historyId);
        if (!flushed) {
          tripActionError.value =
            'No se pudieron enviar los últimos puntos GPS. Intenta finalizar el viaje nuevamente.';
          return;
        }
      }
      
      const endTime = getCurrentTime();
      const { data } = await api.patch(
        `/trip-history/${trip.historyId}/finish`,
        {
          endTime,
          signature: trip.signatureDataUrl,
        },
      );

      // Asignar pacientes si los hay
      /*
      if (trip.patients && trip.patients.length > 0) {
        await api.patch(`/trip-history/${trip.historyId}/patient`, {
          patientIds: trip.patients,
        });
      }
      */

      trip.endTime = data?.endTime || endTime;

      trip.status = "done";
      if (trip.historyId) {
        stopGpsTracking(trip.historyId);
      }

      // Enviar viaje completado al store para mostrar en el historial
      tripsStore.addCompletedTrip({
        date: currentDate.value,
        licensePlate: selectedPlate.value,
        startTime: trip.startTime,
        endTime: trip.endTime,
        destination: getTripDestinationLabel(trip),
        startKm: null,
        endKm: null,
        official: trip.employee ? trip.employee.name : null,
        signature: true,
      });
    } catch (error) {
      const backendMessage = error.response?.data?.message;
      const normalizedMessage = Array.isArray(backendMessage)
        ? backendMessage.join(", ")
        : backendMessage || "";

      if (normalizedMessage.includes("DRIVER_FILLING")) {
        // If backend already moved the status, reflect it locally and avoid
        // surfacing a blocking error to the user.
        trip.status = "done";
        if (trip.historyId) {
          stopGpsTracking(trip.historyId);
        }
        stopTripModal.value = { open: false, trip: null };
        return;
      }

      tripActionError.value = normalizedMessage || "No se pudo finalizar el viaje.";
      return;
    } finally {
      isFinishingTrip.value = false;
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
  customDestination: "",
  employee: null, // { id, name }
  historyId: null,
  startTime: null,
  endTime: null,
  isSaving: false,
  status: "idle", // 'idle' | 'running' | 'done'
  patients: [],
  signature: false,
  signatureDataUrl: null,
});

const trips = ref([]);

const addTrip = () => trips.value.push(newTrip());
const canStartTrip = (trip) => Boolean(trip.destination && trip.employee);

const getDestinationNameById = (destinationId) => {
  if (typeof destinationId === "string" && destinationId.trim()) {
    return destinationId;
  }

  const destination = destinations.value.find(
    (dest) => dest.id === destinationId,
  );
  return destination?.name || "Sin destino";
};

const getTripDestinationLabel = (trip) => {
  if (trip.customDestination?.trim()) {
    return trip.customDestination.trim();
  }

  return getDestinationNameById(trip.destination);
};

const startTrip = async (trip) => {
  if (!canStartTrip(trip) || trip.isSaving) return;

  const startTime = getCurrentTime();
  tripActionError.value = "";
  trip.isSaving = true;

  try {
    const trimmedCustomDestination = trip.customDestination?.trim() || "";
    const isCustomEmployee = trip.employee?.id === "__other__";
    const customEmployeeName = isCustomEmployee
      ? trip.employee?.name?.trim() || ""
      : "";
    const payload = {
      plate: selectedPlate.value,
      ...(isCustomEmployee
        ? { customEmployee: customEmployeeName }
        : { employeeId: Number(trip.employee.id) }),
      startTime,
      ...(trimmedCustomDestination
        ? { customDestination: trimmedCustomDestination }
        : { destinationId: Number(trip.destination) }),
    };

    const { data } = await api.post("/trip-history/start", payload);

    const createdHistoryId = Number(data?.id);
    if (!Number.isInteger(createdHistoryId) || createdHistoryId <= 0) {
      throw new Error(
        "La respuesta del backend no contiene un ID de viaje válido.",
      );
    }

    trip.historyId = createdHistoryId;
    trip.startTime = data.startTime || startTime;
    trip.status = "running";
    if (isCustomEmployee && customEmployeeName && Number(data?.employeeId) > 0) {
      trip.employee = {
        id: Number(data.employeeId),
        name: customEmployeeName,
      };
      await loadEmployees();
    }
    gpsStatusError.value = "";
    startGpsTracking(trip);

    if (trimmedCustomDestination) {
      await loadDestinations();
    }
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
const empModal = ref({ open: false, trip: null, search: "", isOther: false, customName: "" });

const openEmpModal = (trip) => {
  empModal.value = { open: true, trip, search: "", isOther: false, customName: "" };
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

const selectOtherEmployee = () => {
  empModal.value.isOther = true;
  empModal.value.search = "";
};

const confirmOtherEmployee = () => {
  const name = empModal.value.customName.trim();
  if (!name) return;
  if (empModal.value.trip) {
    empModal.value.trip.employee = { id: "__other__", name };
  }
  closeEmpModal();
};

// ── Modal Editar Check List ───────────────────────────────────────────
const checklistModal = ref({ open: false });
const checklistEditReason = ref('');
const checklistAccepted = ref(false);

const openChecklistModal = () => {
  if (!selectedPlate.value) return;
  checklistEditReason.value = '';
  checklistAccepted.value = false;
  checklistModal.value.open = true;
};

const cancelChecklistModal = () => {
  checklistModal.value.open = false;
};

const confirmChecklistModal = () => {
  if (!checklistEditReason.value.trim() || !checklistAccepted.value) return;
  checklistModal.value.open = false;
  router.push({
    name: "daily-registration-maintenance",
    query: { plate: selectedPlate.value },
  });
};

const goToChecklist = () => {
  openChecklistModal();
};

onMounted(async () => {
  await loadAssignedTrucks();
  loadEmployees();
  loadDestinations();

  if (plateFromRoute.value) {
    selectedPlate.value = plateFromRoute.value;
    confirmed.value = true;
  }
});

onBeforeUnmount(() => {
  for (const [historyId] of gpsTrackers.entries()) {
    stopGpsTracking(historyId);
  }
});
</script>

<template>
  <div class="h-screen bg-background flex flex-col overflow-hidden">
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
    <div class="flex flex-1 overflow-hidden min-h-0">
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
                  ref="plateSelectRef"
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
                :disabled="isLoadingPlates || isConfirming"
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

              <div class="mb-4 flex items-center justify-between gap-4">
                <button
                  @click="openChangePlate"
                  class="px-5 py-2 bg-[#215179] hover:bg-blue-900 text-white text-sm font-bold rounded-lg shadow transition-all duration-200"
                >
                  Cambiar patente
                </button>
                <button
                  @click="openChecklistModal"
                  class="px-5 py-2 bg-[#1E7F43] hover:bg-green-700 text-white text-sm font-bold rounded-lg shadow transition-all duration-200"
                >
                  Check list
                </button>
              </div>
              <p v-if="tripActionError" class="text-sm text-red-600 font-body">
                {{ tripActionError }}
              </p>
              <p v-if="gpsStatusError" class="text-sm text-amber-600 font-body mt-1">
                {{ gpsStatusError }}
              </p>
            </div>

            <!-- Tabla -->
            <div class="overflow-x-auto px-12 md:px-16 relative mt-6 pb-6">
              <TripHistoryTable 
                :trips="trips"
                role="driver"
                :destinations="destinations"
                :isLoadingDestinations="isLoadingDestinations"
                :destinationsError="destinationsError"
                @start-trip="startTrip"
                @stop-trip="openStopTrip"
                @open-employee="openEmpModal"
                @open-signature="openSignatureModal"
              />
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
    <!-- MODAL: Seleccionar Paciente(s) (COMENTADO) -->
    <!-- ═══════════════════════════════════════ -->
    <!--
    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="patientModal.open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div class="absolute inset-0 bg-black/40" @click="closePatientModal" />
        <div
          class="relative bg-white rounded-2xl w-full max-w-sm z-10 p-6 flex flex-col max-h-[80vh] shadow-[0_30px_80px_-5px_rgba(0,0,0,0.5),0_0_0_1px_rgba(0,0,0,0.06)]"
        >
          <button
            @click="closePatientModal"
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
          
          <h3 class="font-titles font-bold text-text-title text-center text-xl mb-4">
            Seleccionar Pacientes
          </h3>

          <div class="flex-1 overflow-y-auto mb-4 custom-scrollbar pr-2">
            <div v-if="getDestinationPatients(patientModal.trip?.destination).length === 0" class="text-sm text-gray-500 text-center py-4">
              Actualmente no hay pacientes registrados para este destino. 
            </div>
            <div
              v-else
              v-for="p in getDestinationPatients(patientModal.trip?.destination)"
              :key="p.id"
              class="flex items-center gap-3 p-3 mb-2 rounded-xl transition-all duration-200 cursor-pointer border border-transparent hover:bg-gray-50"
              @click="togglePatientSelection(p.id)"
            >
              <input 
                type="checkbox" 
                :checked="tempSelectedPatients.includes(p.id)"
                class="w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary cursor-pointer pointer-events-none"
              />
              <span class="text-sm font-body text-text-title font-medium flex-1">
                {{ p.name }}
              </span>
            </div>
          </div>

          <button
            @click="savePatientModal"
            class="w-full py-3 bg-[#215179] hover:bg-blue-900 text-white font-bold rounded-lg shadow transition-all duration-200"
          >
            Confirmar Selección
          </button>
        </div>
      </div>
    </transition>
    -->

    <!-- ═══════════════════════════════════════ -->
    <!-- MODAL: Editar Check List               -->
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
        v-if="checklistModal.open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div class="absolute inset-0 bg-black/40" @click="cancelChecklistModal" />
        <div
          class="relative bg-white rounded-2xl w-full max-w-lg z-10 p-10 shadow-[0_30px_80px_-5px_rgba(0,0,0,0.5),0_0_0_1px_rgba(0,0,0,0.06)]"
        >
          <!-- X -->
          <button
            @click="cancelChecklistModal"
            class="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <!-- Título -->
          <h3 class="font-titles font-bold text-text-title text-center text-2xl mb-2">
            Editar Check List
          </h3>

          <!-- Info patente/fecha -->
          <p class="text-sm font-body font-semibold text-text-title mb-1">
            Estás a punto de editar el check list para:
          </p>
          <p class="text-sm font-body text-text-title mb-1"><span class="font-semibold">Patente:</span> {{ selectedPlate }}</p>
          <p class="text-sm font-body text-text-title mb-6"><span class="font-semibold">Fecha:</span> {{ currentDate }}</p>

          <!-- Motivo -->
          <div class="mb-5">
            <label class="mb-2 block text-left text-sm font-bold text-text-title">
              Motivo de la edición <span class="text-red-600">(Requerido)</span>
            </label>
            <textarea
              v-model="checklistEditReason"
              placeholder="Por favor, especifique detalladamente por qué es necesario realizar esta edición."
              rows="4"
              class="w-full text-sm font-body border border-gray-200 rounded-xl bg-gray-50 px-4 py-3 outline-none focus:border-primary resize-none placeholder-gray-400 transition-colors"
            />
          </div>

          <!-- Checkbox responsabilidad -->
          <label class="flex items-start gap-3 mb-8 cursor-pointer group">
            <input
              type="checkbox"
              v-model="checklistAccepted"
              class="mt-0.5 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer flex-shrink-0"
            />
            <span class="text-xs font-body text-gray-600 leading-snug group-hover:text-gray-800 transition-colors">
              He verificado que la información original no estaba completa o contenía errores y asumo la responsabilidad de la edición.
            </span>
          </label>

          <!-- Botones -->
          <div class="flex gap-4 justify-center">
            <button
              @click="confirmChecklistModal"
              :disabled="!checklistEditReason.trim() || !checklistAccepted"
              class="px-8 py-3 bg-[#9B2335] hover:bg-red-800 text-white font-bold rounded-lg shadow transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Confirmar
            </button>
            <button
              @click="cancelChecklistModal"
              class="px-8 py-3 bg-[#215179] hover:bg-blue-900 text-white font-bold rounded-lg shadow transition-all duration-200"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </transition>

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
          <!-- Dropdown categoría -->
          <div class="relative mb-4">
            <select
              v-model="changePlateCategory"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm font-body outline-none focus:border-primary appearance-none cursor-pointer"
              :class="changePlateCategory ? 'text-text-title' : 'text-gray-400'"
            >
              <option value="" disabled>Seleccione el tipo de motivo</option>
              <option value="Avería">Avería</option>
              <option value="Logística">Logística</option>
            </select>
            <div class="absolute inset-y-0 right-4 flex items-center pointer-events-none">
              <svg class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <!-- Textarea -->
          <div class="mb-8">
            <label
              class="mb-2 block text-left text-sm font-bold text-text-title"
            >
              Observación
            </label>
            <textarea
              v-model="changePlateReason"
              placeholder="Por favor especifique el motivo del cambio de la patente."
              rows="5"
              class="w-full text-sm font-body border border-gray-200 rounded-xl bg-gray-50 px-4 py-3 outline-none focus:border-primary resize-none placeholder-gray-400"
            />
          </div>
          <!-- Botones -->
          <div class="flex gap-4 justify-center">
            <button
              @click="confirmStep2"
              :disabled="!changePlateCategory || !changePlateReason.trim() || isSubmittingPlateChange"
              class="px-8 py-3 bg-[#9B2335] hover:bg-red-800 text-white font-bold rounded-lg shadow transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {{ isSubmittingPlateChange ? "Guardando..." : "Confirmar" }}
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
          <h3 class="font-titles font-bold text-text-title text-center text-2xl mb-5">
            Detener viaje
          </h3>
          
          <template v-if="!stopTripModal.trip?.signatureDataUrl">
            <p class="text-base text-red-600 font-body text-center font-semibold mb-8">
              Es necesario la recolección de la firma para terminar el viaje.
            </p>
            <div class="flex gap-4 justify-center">
              <button
                @click="openSignatureModal(stopTripModal.trip, true)"
                class="px-8 py-3 bg-[#215179] hover:bg-blue-800 text-white font-bold rounded-lg shadow transition-all duration-200"
              >
                Firmar ahora
              </button>
              <button
                @click="cancelStopTrip"
                class="px-8 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold rounded-lg shadow transition-all duration-200"
              >
                Cancelar
              </button>
            </div>
          </template>

          <template v-else>
            <p class="text-base text-text-secondary font-body text-center mb-8">
              ¿Está seguro de finalizar el viaje?
            </p>
            <div class="flex gap-4 justify-center">
              <button
                @click="confirmStopTrip"
                :disabled="isFinishingTrip"
                class="px-8 py-3 bg-[#9B2335] hover:bg-red-800 text-white font-bold rounded-lg shadow transition-all duration-200"
                :class="{ 'opacity-50 cursor-not-allowed hover:bg-[#9B2335]': isFinishingTrip }"
              >
                {{ isFinishingTrip ? 'Finalizando...' : 'Confirmar' }}
              </button>
              <button
                @click="cancelStopTrip"
                class="px-8 py-3 bg-[#215179] hover:bg-blue-900 text-white font-bold rounded-lg shadow transition-all duration-200"
              >
                Cancelar
              </button>
            </div>
          </template>
        </div>
      </div>
    </transition>

    <!-- ═══════════════════════════════════════ -->
    <!-- MODAL: Firma del funcionario            -->
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
        v-if="signatureModal.open"
        class="fixed inset-0 z-[60] flex items-center justify-center p-4"
      >
        <div class="absolute inset-0 bg-black/40" @click="closeSignatureModal" />
        <div
          class="relative bg-white rounded-2xl w-full max-w-lg z-10 p-10 shadow-[0_30px_80px_-5px_rgba(0,0,0,0.5),0_0_0_1px_rgba(0,0,0,0.06)]"
        >
          <!-- X -->
          <button
            @click="closeSignatureModal"
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
          
          <h3 class="font-titles font-bold text-text-title text-center text-2xl mb-5">
            Firma del funcionario
          </h3>
          <p class="text-base text-text-secondary font-body text-center mb-4">
            Por favor, firme a continuación en el recuadro:
          </p>
          
          <!-- Canvas de firma -->
          <div class="mb-6">
            <div class="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50 touch-none relative">
              <canvas
                ref="signatureCanvas"
                class="w-full cursor-crosshair touch-none block"
                @mousedown="startDrawing"
                @mousemove="draw"
                @mouseup="stopDrawing"
                @mouseleave="stopDrawing"
                @touchstart="startDrawing"
                @touchmove="draw"
                @touchend="stopDrawing"
                @touchcancel="stopDrawing"
              ></canvas>
              <div v-if="!hasSignature" class="absolute inset-0 flex flex-col items-center justify-center font-body text-gray-300 pointer-events-none select-none">
                <svg class="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                <span>Firme aquí</span>
              </div>
            </div>
            <div class="flex justify-between items-center mt-2">
              <p v-if="signatureError" class="text-sm text-red-600 font-body m-0">
                {{ signatureError }}
              </p>
              <button
                type="button"
                @click="clearSignature"
                class="text-sm text-gray-500 hover:text-red-600 underline font-body transition-colors ml-auto"
              >
                Limpiar firma
              </button>
            </div>
          </div>
          
          <!-- Botones -->
          <div class="flex gap-4 justify-center">
            <button
              @click="saveSignatureBtn"
              class="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow transition-all duration-200"
            >
              Guardar Firma
            </button>
            <button
              @click="closeSignatureModal"
              class="px-8 py-3 bg-gray-400 hover:bg-gray-500 text-white font-bold rounded-lg shadow transition-all duration-200"
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

          <!-- Barra de búsqueda (modo lista) -->
          <div v-if="!empModal.isOther" class="px-4 py-3 border-b border-gray-100">
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

          <!-- Lista de resultados (modo lista) -->
          <ul v-if="!empModal.isOther" class="max-h-60 overflow-y-auto divide-y divide-gray-50">
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
            <!-- Opción Otro -->
            <li
              v-if="!isLoadingEmployees && !employeesError"
              @click="selectOtherEmployee"
              class="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-blue-50 transition-colors group border-t border-gray-100"
              :class="{ 'bg-blue-50': empModal.trip?.employee?.id === '__other__' }"
            >
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors"
                :class="
                  empModal.trip?.employee?.id === '__other__'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-500 group-hover:bg-primary group-hover:text-white'
                "
              >
                +
              </div>
              <span
                class="text-sm font-body transition-colors"
                :class="
                  empModal.trip?.employee?.id === '__other__'
                    ? 'text-primary font-semibold'
                    : 'text-text-title'
                "
              >Otro</span>
            </li>
          </ul>

          <!-- Input nombre personalizado (modo Otro) -->
          <div v-if="empModal.isOther" class="px-4 py-4 flex flex-col gap-3">
            <p class="text-sm text-text-secondary">Ingrese el nombre del conductor:</p>
            <input
              v-model="empModal.customName"
              type="text"
              placeholder="Nombre del conductor"
              class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
              autofocus
              @keyup.enter="confirmOtherEmployee"
            />
            <div class="flex gap-2">
              <button
                type="button"
                @click="empModal.isOther = false; empModal.customName = ''"
                class="flex-1 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Volver
              </button>
              <button
                type="button"
                @click="confirmOtherEmployee"
                :disabled="!empModal.customName.trim()"
                class="flex-1 px-3 py-2 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-40"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
</style>
