<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
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
          .map((truck) => ({
            id: truck.id,
            plate: truck.plate,
            mileage:
              typeof truck?.mileage === "number"
                ? truck.mileage
                : truck?.mileage
                ? Number(truck.mileage)
                : null,
          }))
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
const plateSelectRef = ref(null);
const selectedPlateStable = ref("");
const confirmed = ref(false);
const suggestedMileage = ref(0);
const selectedTruckId = ref(null);
const alreadyRegisteredToday = ref(false);
const existingMaintenanceRecordId = ref(null);

// ── Date ──────────────────────────────────────────────────────────────
const currentDate = computed(() => {
  const t = new Date();
  return `${String(t.getDate()).padStart(2, "0")}/${String(t.getMonth() + 1).padStart(2, "0")}/${t.getFullYear()}`;
});

const maintenanceForm = ref(null);
const maintenanceFormError = ref("");
const maintenanceFormSuccess = ref("");
const formErrors = ref([]);

const isSaveDisabled = computed(() => {
  if (!maintenanceForm.value) return true;
  const form = maintenanceForm.value;
  if (!form.licMunicipal.trim()) return true;
  if (!form.kilometraje.trim()) return true;
  if (!form.annex.revisionTecnica) return true;
  if (!form.annex.permisoCirculacion) return true;
  if (!form.annex.seguroObligatorio) return true;
  if (form.items.some(item => item.type !== 'section' && (!item.exists || !item.state))) return true;
  return false;
});

const createDefaultMaintenanceForm = (mileage = "") => ({
  conductor: auth.fullName || "",
  identificationVehicle: selectedPlate.value || "",
  licMunicipal: "",
  inspectionDate: currentDate.value,
  inspectionTime: getCurrentTime(),
  kilometraje:
    mileage !== null && mileage !== undefined ? String(mileage) : "",
  items: [
    { id: "systemLights", label: "1. SISTEMA DE LUCES", type: "section" },
    { id: "estacionamiento", label: "Estacionamiento", exists: "", state: "", note: "", hasError: false },
    { id: "bajas", label: "Bajas", exists: "", state: "", note: "", hasError: false },
    { id: "altas", label: "Altas", exists: "", state: "", note: "", hasError: false },
    { id: "frenos", label: "Frenos (Debe incluir tercera luz)", exists: "", state: "", note: "", hasError: false },
    { id: "marchaAtras", label: "Marcha atrás", exists: "", state: "", note: "", hasError: false },
    { id: "virajeDerecha", label: "Viraje derecha", exists: "", state: "", note: "", hasError: false },
    { id: "virajeIzquierda", label: "Viraje izquierda", exists: "", state: "", note: "", hasError: false },
    { id: "patente", label: "Patente", exists: "", state: "", note: "", hasError: false },
    { id: "balizas", label: "Balizas (Solo ambulancias)", exists: "", state: "", note: "", hasError: false },
    { id: "systemBrakes", label: "2. SISTEMA DE FRENOS", type: "section" },
    { id: "frenoMano", label: "De mano", exists: "", state: "", note: "", hasError: false },
    { id: "pedal", label: "Pedal", exists: "", state: "", note: "", hasError: false },
    { id: "systemTires", label: "3. NEUMÁTICOS", type: "section" },
    { id: "delanteroDerecho", label: "Delantero derecho", exists: "", state: "", note: "", hasError: false },
    { id: "delanteroIzquierdo", label: "Delantero izquierdo", exists: "", state: "", note: "", hasError: false },
    { id: "traseroDerecho", label: "Trasero derecho", exists: "", state: "", note: "", hasError: false },
    { id: "traseroIzquierdo", label: "Trasero izquierdo", exists: "", state: "", note: "", hasError: false },
    { id: "repuesto", label: "Repuesto", exists: "", state: "", note: "", hasError: false },
    { id: "systemEngine", label: "4. NIVELES/MOTOR", type: "section" },
    { id: "nivelAceiteMotor", label: "Nivel aceite motor", exists: "", state: "", note: "", hasError: false },
    { id: "nivelAceiteRadiador", label: "Nivel aceite radiador", exists: "", state: "", note: "", hasError: false },
    { id: "nivelLiquidoFrenos", label: "Nivel líquido frenos", exists: "", state: "", note: "", hasError: false },
    { id: "correas", label: "Correas", exists: "", state: "", note: "", hasError: false },
    { id: "bateria", label: "Batería", exists: "", state: "", note: "", hasError: false },
    { id: "systemAccessories", label: "5. ACCESORIOS Y DOCUMENTOS", type: "section" },
    { id: "extintor", label: "Extintor", exists: "", state: "", note: "", hasError: false },
    { id: "botiquin", label: "Botiquín", exists: "", state: "", note: "", hasError: false },
    { id: "gataManivela", label: "Gata y manivela", exists: "", state: "", note: "", hasError: false },
    { id: "triangulo", label: "Triángulo", exists: "", state: "", note: "", hasError: false },
    { id: "llaveRueda", label: "Llave de rueda", exists: "", state: "", note: "", hasError: false },
  ],
  annex: {
    revisionTecnica: "",
    permisoCirculacion: "",
    seguroObligatorio: "",
  },
});

const formatDisplayDate = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return currentDate.value;

  return `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}/${date.getFullYear()}`;
};

const populateMaintenanceFormFromRecord = (record) => {
  const form = createDefaultMaintenanceForm(record?.currentMileage ?? "");
  const itemsByCode = new Map(
    (record?.maintenanceItems || []).map((item) => [item.itemCode, item]),
  );

  form.identificationVehicle = selectedPlate.value || form.identificationVehicle;
  form.licMunicipal = record?.municipalLicense || "";
  form.inspectionDate = formatDisplayDate(record?.inspectionDate);
  form.inspectionTime = record?.inspectionTime || getCurrentTime();
  form.kilometraje =
    record?.currentMileage !== null && record?.currentMileage !== undefined
      ? String(record.currentMileage)
      : "";
  form.annex.revisionTecnica = record?.technicalReviewStatus || "";
  form.annex.permisoCirculacion = record?.circulationPermitStatus || "";
  form.annex.seguroObligatorio = record?.insuranceStatus || "";
  form.items = form.items.map((item) => {
    if (item.type === "section") return item;

    const existingItem = itemsByCode.get(item.id);
    if (!existingItem) return item;

    return {
      ...item,
      exists: existingItem.exists || "",
      state: existingItem.status || "",
      note: existingItem.notes || "",
      hasError: false,
    };
  });

  maintenanceForm.value = form;
};

// Obtains current time HH:MM
const getCurrentTime = () => {
  const t = new Date();
  return `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
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

const loadMileageSuggestionByPlate = async (plate) => {
  const foundTruck = licensePlates.value.find((t) => t.plate === plate);
  const fallbackTruckId = foundTruck ? foundTruck.id : null;

  try {
    const { data } = await api.get(`/vehicle-maintenance-records/mileage-suggestion/plate/${encodeURIComponent(plate)}`);
    suggestedMileage.value = data.suggestedMileage || 0;
    selectedTruckId.value = data.truckId || fallbackTruckId;
    if (maintenanceForm.value) {
      maintenanceForm.value.kilometraje = String(suggestedMileage.value);
    }
    return suggestedMileage.value;
  } catch (error) {
    suggestedMileage.value = 0;
    selectedTruckId.value = fallbackTruckId;
    if (maintenanceForm.value) {
      maintenanceForm.value.kilometraje = "";
    }
    return 0;
  }
};

const checkDailyMaintenanceByDriverAndTruck = async () => {
  if (!auth.user?.id || !selectedTruckId.value) return false;

  alreadyRegisteredToday.value = false;
  existingMaintenanceRecordId.value = null;

  try {
    const { data } = await api.get(
      `/vehicle-maintenance-records/driver/${auth.user.id}/truck/${selectedTruckId.value}/date`,
      {
        params: { date: getLocalDateParam() },
      },
    );

    if (data) {
      alreadyRegisteredToday.value = true;
      existingMaintenanceRecordId.value = data.id || null;
      populateMaintenanceFormFromRecord(data);
      return true;
    }

    alreadyRegisteredToday.value = false;
    return false;
  } catch {
    alreadyRegisteredToday.value = false;
    return false;
  }
};

const onPlateChange = async (event) => {
  const plate = event?.target?.value || selectedPlate.value;
  selectedPlate.value = plate;
  selectedPlateStable.value = plate;

  if (!plate) {
    alreadyRegisteredToday.value = false;
    selectedTruckId.value = null;
    suggestedMileage.value = 0;
    return;
  }

  alreadyRegisteredToday.value = false;
  await loadMileageSuggestionByPlate(plate);
};

const handleConfirm = async () => {
  await nextTick();
  let plate = selectedPlateStable.value || selectedPlate.value;

  // Fallback para el primer clic: tomar el valor directo del select si v-model aun no sincroniza
  if (!plate && plateSelectRef.value?.value) {
    plate = plateSelectRef.value.value;
    selectedPlate.value = plate;
    selectedPlateStable.value = plate;
    await nextTick();
  }

  if (!plate) return;
  tripActionError.value = "";

  // Asegura datos del vehículo en este mismo click (evita depender del watcher)
  await loadMileageSuggestionByPlate(plate);

  await checkDailyMaintenanceByDriverAndTruck();
  if (!alreadyRegisteredToday.value) {
    maintenanceForm.value = createDefaultMaintenanceForm(suggestedMileage.value);
  }
  confirmed.value = true;
};

const statusOptions = ["Bueno", "Regular", "Malo"];
const existenceOptions = ["Si", "No"];

const validateItem = (item) => {
  if (item.type === "section") return;
  item.hasError = !item.exists || !item.state;
};

const toggleExists = (item, value) => {
  if (item.type === "section") return;
  item.exists = item.exists === value ? "" : value;
  validateItem(item);
};

const toggleState = (item, value) => {
  if (item.type === "section") return;
  item.state = item.state === value ? "" : value;
  validateItem(item);
};

const buildAnnexAlertReason = (form) => {
  const alertLines = [];

  if (["Vencido", "No tiene"].includes(form.annex.revisionTecnica)) {
    alertLines.push(`Revisión técnica: ${form.annex.revisionTecnica}`);
  }
  if (["Vencido", "No tiene"].includes(form.annex.permisoCirculacion)) {
    alertLines.push(`Permiso de circulación: ${form.annex.permisoCirculacion}`);
  }
  if (["Vencido", "No tiene"].includes(form.annex.seguroObligatorio)) {
    alertLines.push(`Seguro obligatorio: ${form.annex.seguroObligatorio}`);
  }

  return alertLines.join("\n");
};

const saveMaintenanceForm = async () => {
  maintenanceFormError.value = "";
  maintenanceFormSuccess.value = "";
  formErrors.value = [];
  let hasErrors = false;

  // Validate required fields
  if (!maintenanceForm.value.licMunicipal.trim()) {
    formErrors.value.push("Por favor ingrese la licencia municipal.");
    hasErrors = true;
  }
  if (!maintenanceForm.value.kilometraje.trim()) {
    formErrors.value.push("Por favor ingrese el kilometraje.");
    hasErrors = true;
  }

  // Validate table items (already updated in real-time, but check again)
  maintenanceForm.value.items.forEach(item => {
    if (item.type === "section") return;
    if (!item.exists || !item.state) {
      item.hasError = true;
      hasErrors = true;
    }
  });

  // Validate annex
  if (!maintenanceForm.value.annex.revisionTecnica) {
    formErrors.value.push("Por favor seleccione el estado de la Revisión Técnica.");
    hasErrors = true;
  }
  if (!maintenanceForm.value.annex.permisoCirculacion) {
    formErrors.value.push("Por favor seleccione el estado del Permiso de Circulación.");
    hasErrors = true;
  }
  if (!maintenanceForm.value.annex.seguroObligatorio) {
    formErrors.value.push("Por favor seleccione el estado del Seguro Obligatorio.");
    hasErrors = true;
  }

  if (hasErrors) {
    if (maintenanceForm.value.items.some(item => item.hasError)) {
      formErrors.value.push("Por favor complete todos los campos obligatorios marcados en rojo.");
    }
    return;
  }

  if (!selectedTruckId.value) {
    maintenanceFormError.value = "No se pudo identificar el camión seleccionado.";
    return;
  }

  if (!auth.user?.id) {
    maintenanceFormError.value = "No se pudo identificar el conductor autenticado.";
    return;
  }

  const maintenanceItems = maintenanceForm.value.items
    .filter((item) => item.type !== "section")
    .map((item) => ({
      itemCode: item.id,
      itemName: item.label,
      category: item.id,
      exists: item.exists,
      status: item.state,
      notes: item.note || undefined,
    }));

  const payload = {
    truckId: selectedTruckId.value,
    driverId: auth.user?.id,
    inspectionDate: getLocalDateParam(),
    inspectionTime: maintenanceForm.value.inspectionTime,
    municipalLicense: maintenanceForm.value.licMunicipal,
    currentMileage: Number(maintenanceForm.value.kilometraje),
    technicalReviewStatus: maintenanceForm.value.annex.revisionTecnica,
    circulationPermitStatus: maintenanceForm.value.annex.permisoCirculacion,
    insuranceStatus: maintenanceForm.value.annex.seguroObligatorio,
    maintenanceItems,
  };

  try {
    if (existingMaintenanceRecordId.value) {
      await api.patch(
        `/vehicle-maintenance-records/${existingMaintenanceRecordId.value}`,
        payload,
      );
    } else {
      const { data } = await api.post("/vehicle-maintenance-records", payload);
      existingMaintenanceRecordId.value = data?.id || null;
    }

    const annexAlertReason = buildAnnexAlertReason(maintenanceForm.value);
    if (annexAlertReason) {
      vehicleAlertsStore.addOutOfServiceAlert({
        plate: maintenanceForm.value.identificationVehicle,
        driver: auth.fullName || auth.user?.email || "Conductor sin nombre",
        reason: annexAlertReason,
        category: "Checklist",
      });
    }

    maintenanceFormSuccess.value = existingMaintenanceRecordId.value
      ? "Formulario de mantenimiento actualizado correctamente."
      : "Formulario de mantenimiento guardado correctamente.";
    router.push({
      name: 'daily-registration-driver',
      query: { plate: maintenanceForm.value.identificationVehicle }
    });
  } catch (error) {
    const backendMessage = error.response?.data?.message;
    maintenanceFormError.value = Array.isArray(backendMessage)
      ? backendMessage.join(", ")
      : backendMessage || "No se pudo guardar el registro de mantenimiento.";
  }
};



// --- Signature Canvas Logic ---
const signatureCanvas = ref(null);
let isDrawing = false;
let ctx = null;
const signatureError = ref("");
let hasSignature = false;

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
  
  hasSignature = false;
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
  hasSignature = true;
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
  hasSignature = false;
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
  if (!hasSignature) {
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
  const trip = stopTripModal.value.trip;
  if (trip) {
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
  patients: [],
  signature: false,
  signatureDataUrl: null,
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

onMounted(async () => {
  await loadAssignedTrucks();
  loadEmployees();
  loadDestinations();

  if (plateFromRoute.value) {
    selectedPlate.value = plateFromRoute.value;
    selectedPlateStable.value = plateFromRoute.value;
    await handleConfirm();
  }
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
                  ref="plateSelectRef"
                  v-model="selectedPlate"
                  @change="onPlateChange"
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
                :disabled="isLoadingPlates"
                class="px-12 py-3 bg-[#215179] hover:bg-blue-900 text-white font-bold rounded-xl shadow-md transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>

        <!-- ═══════════════════════════════════ -->
        <!-- PASO 2 – Formulario de mantenimiento -->
        <!-- ═══════════════════════════════════ -->
        <div v-else class="flex gap-6 w-full max-w-5xl h-full min-h-0">
          <div class="bg-white rounded-3xl border-2 border-slate-300 shadow-sm overflow-hidden flex-1 flex flex-col">
            <div class="px-8 pt-8 pb-4">
              <h1 class="text-3xl font-titles font-bold text-text-title text-center mb-6">
                Registro de mantención diaria vehicular
              </h1>

              <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                <span class="font-titles font-semibold text-text-title">
                  Conductor: <span class="text-primary">{{ maintenanceForm?.conductor }}</span>
                </span>
                <span class="text-gray-500 font-body text-sm">{{ currentDate }}</span>
              </div>


              <p v-if="maintenanceFormError" class="text-sm text-red-600 font-body">
                {{ maintenanceFormError }}
              </p>
              <p v-if="maintenanceFormSuccess" class="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
                {{ maintenanceFormSuccess }}
              </p>

              <div v-if="formErrors.length > 0" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div class="flex items-center gap-2 mb-2">
                  <svg class="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <h3 class="text-red-800 font-medium">Errores en el formulario</h3>
                </div>
                <ul class="text-red-700 text-sm">
                  <li v-for="error in formErrors" :key="error">{{ error }}</li>
                </ul>
              </div>
            </div>

            <div class="overflow-x-auto px-8 md:px-12 pb-6">
              <div class="grid gap-4 md:grid-cols-3 mb-8">
                <div>
                  <label class="block text-[11px] font-bold text-gray-500 mb-2">Patente</label>
                  <input
                    type="text"
                    v-model="maintenanceForm.identificationVehicle"
                    readonly
                    class="w-full rounded-xl border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-text-title"
                  />
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-gray-500 mb-2">LIC-MUNICIPAL</label>
                  <input
                    type="text"
                    v-model="maintenanceForm.licMunicipal"
                    placeholder="Ingrese la Lic-municipal"
                    class="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-text-title outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-gray-500 mb-2">Kilometraje</label>
                  <input
                    type="text"
                    v-model="maintenanceForm.kilometraje"
                    readonly
                    placeholder="Kilometraje actual desde backend"
                    class="w-full rounded-xl border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-text-title outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div class="grid gap-4 md:grid-cols-2 mb-8">
                <div>
                  <label class="block text-[11px] font-bold text-gray-500 mb-2">Fecha inspección</label>
                  <input
                    type="text"
                    v-model="maintenanceForm.inspectionDate"
                    readonly
                    class="w-full rounded-xl border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-text-title"
                  />
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-gray-500 mb-2">Hora inspección</label>
                  <input
                    type="text"
                    v-model="maintenanceForm.inspectionTime"
                    readonly
                    class="w-full rounded-xl border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-text-title"
                  />
                </div>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full text-sm text-left border-collapse border border-slate-200">
                  <thead class="bg-gray-100 text-gray-700">
                    <tr>
                      <th class="border border-slate-200 px-3 py-3">Item</th>
                      <th class="border border-slate-200 px-3 py-3">Existe</th>
                      <th class="border border-slate-200 px-3 py-3">Estado</th>
                      <th class="border border-slate-200 px-3 py-3">Observación</th>
                    </tr>
                  </thead>
                  <tbody>
                    <template v-for="item in maintenanceForm.items" :key="item.id">
                      <tr
                        v-if="item.type === 'section'"
                        class="bg-slate-100 text-sm font-semibold text-text-title"
                      >
                        <td class="border border-slate-200 px-3 py-3" colspan="4">
                          {{ item.label }}
                        </td>
                      </tr>
                      <tr
                        v-else
                        :class="item.hasError ? 'bg-red-50 border-red-300' : 'odd:bg-white even:bg-slate-50'"
                        class="border border-slate-200"
                      >
                        <td class="border border-slate-200 px-3 py-3 text-sm text-text-title flex items-center gap-2">
                          {{ item.label }}
                          <svg v-if="item.hasError" class="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" title="Este campo es obligatorio para continuar, por favor elija las opciones correspondientes">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </td>
                        <td class="border border-slate-200 px-3 py-3">
                          <div class="flex items-center gap-6">
                            <label class="flex items-center gap-2 text-sm cursor-pointer">
                              <input
                                type="checkbox"
                                class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                :checked="item.exists === 'Si'"
                                @change="toggleExists(item, 'Si')"
                                :disabled="item.exists !== '' && item.exists !== 'Si'"
                              />
                              Sí
                            </label>
                            <label class="flex items-center gap-2 text-sm cursor-pointer">
                              <input
                                type="checkbox"
                                class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                :checked="item.exists === 'No'"
                                @change="toggleExists(item, 'No')"
                                :disabled="item.exists !== '' && item.exists !== 'No'"
                              />
                              No
                            </label>
                          </div>
                        </td>
                        <td class="border border-slate-200 px-3 py-3">
                          <div class="grid grid-cols-3 gap-3">
                            <label class="flex items-center gap-2 text-sm cursor-pointer">
                              <input
                                type="checkbox"
                                class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                :checked="item.state === 'Bueno'"
                                @change="toggleState(item, 'Bueno')"
                                :disabled="item.state !== '' && item.state !== 'Bueno'"
                              />
                              Bueno
                            </label>
                            <label class="flex items-center gap-2 text-sm cursor-pointer">
                              <input
                                type="checkbox"
                                class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                :checked="item.state === 'Regular'"
                                @change="toggleState(item, 'Regular')"
                                :disabled="item.state !== '' && item.state !== 'Regular'"
                              />
                              Regular
                            </label>
                            <label class="flex items-center gap-2 text-sm cursor-pointer">
                              <input
                                type="checkbox"
                                class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                :checked="item.state === 'Malo'"
                                @change="toggleState(item, 'Malo')"
                                :disabled="item.state !== '' && item.state !== 'Malo'"
                              />
                              Malo
                            </label>
                          </div>
                        </td>
                        <td class="border border-slate-200 px-3 py-3">
                          <label
                            class="mb-1 block text-left text-sm font-bold text-text-title"
                          >
                            Observación
                          </label>
                          <input
                            type="text"
                            v-model="item.note"
                            placeholder="Observación"
                            class="w-full rounded-xl border border-gray-300 px-2 py-1 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          />
                        </td>
                      </tr>
                    </template>
                  </tbody>
                </table>
              </div>

              <div class="mt-8">
                <h2 class="text-xl font-titles font-bold text-text-title mb-4">ANEXO II. Fechas de Vencimiento Documentación</h2>
                <div class="grid gap-4 md:grid-cols-3">
                  <div>
                    <label class="block text-[11px] font-bold text-gray-500 mb-2">REVISIÓN TÉCNICA</label>
                    <select
                      v-model="maintenanceForm.annex.revisionTecnica"
                      class="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    >
                      <option value="" disabled>Seleccione una opción</option>
                      <option value="Vencido">Vencido</option>
                      <option value="Vigente">Vigente</option>
                      <option value="No tiene">No tiene</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-[11px] font-bold text-gray-500 mb-2">PERMISO DE CIRCULACIÓN</label>
                    <select
                      v-model="maintenanceForm.annex.permisoCirculacion"
                      class="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    >
                      <option value="" disabled>Seleccione una opción</option>
                      <option value="Vencido">Vencido</option>
                      <option value="Vigente">Vigente</option>
                      <option value="No tiene">No tiene</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-[11px] font-bold text-gray-500 mb-2">SEGURO OBLIGATORIO</label>
                    <select
                      v-model="maintenanceForm.annex.seguroObligatorio"
                      class="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    >
                      <option value="" disabled>Seleccione una opción</option>
                      <option value="Vencido">Vencido</option>
                      <option value="Vigente">Vigente</option>
                      <option value="No tiene">No tiene</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div class="px-8 py-4 flex flex-col gap-3 md:flex-row justify-between border-t border-gray-100">
              <button
                @click="confirmed = false"
                class="w-full md:w-auto px-5 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-all duration-200"
              >
                Volver
              </button>
              <button
                type="button"
                @click="saveMaintenanceForm"
                class="w-full md:w-auto px-5 py-3 bg-[#215179] hover:bg-blue-900 text-white font-bold rounded-xl transition-all duration-200"
              >
                Guardar formulario
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
</style>
