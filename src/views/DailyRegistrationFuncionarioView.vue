<script setup>
import { ref, computed, nextTick, onMounted } from "vue";
import logoCompleto from "@/assets/images/Logo-completo.png";
import DashboardSidebar from "@/components/DashboardSidebar.vue";
import { useAuthStore } from "@/stores/auth";
import UserMenu from "@/components/UserMenu.vue";
import api from "@/services/axios";

const auth = useAuthStore();
const isLoadingRows = ref(false);
const rowsError = ref("");

// ── Date & Time ────────────────────────────────────────────────────────
const currentDate = computed(() => {
  const t = new Date();
  return `${String(t.getDate()).padStart(2, "0")}/${String(t.getMonth() + 1).padStart(2, "0")}/${t.getFullYear()}`;
});

// ── Rows (registros del funcionario) ──────────────────────────────────
const rows = ref([]);

const loadRows = async () => {
  isLoadingRows.value = true;
  rowsError.value = "";

  try {
    const { data } = await api.get("/trip-history", {
      params: {
        page: 1,
        pageSize: 200,
      },
    });

    const payloadItems = Array.isArray(data?.items)
      ? data.items.filter((trip) => trip?.status === "COMPLETED")
      : [];

    rows.value = payloadItems.map((trip) => ({
      id: trip.id,
      historyId: trip.id,
      status: trip.status || "DRIVER_FILLING",
      horaInicio: trip.startTime || "",
      horaFinal: trip.endTime || "",
      patente: trip.truck?.plate || "",
      destino: trip.destination?.name || "",
      firma: "",
      paciente: trip.patient || null,
      patientOptions: Array.isArray(trip.destination?.patients)
        ? trip.destination.patients
        : [],
      firmaPaciente: "",
      firmaPacienteUrl: "",
      isSaved: trip.status === "COMPLETED",
      isSaving: false,
    }));
    currentPage.value = 1;
  } catch (error) {
    const backendMessage = error.response?.data?.message;
    rowsError.value = Array.isArray(backendMessage)
      ? backendMessage.join(", ")
      : backendMessage || "No se pudieron cargar los viajes del funcionario.";
    rows.value = [];
  } finally {
    isLoadingRows.value = false;
  }
};

const saveRow = async (row) => {
  if (row.status !== "COMPLETED") {
    alert("Este viaje debe estar finalizado por el conductor para completarse.");
    return false;
  }

  if (!row.paciente || !row.firma || !row.firmaPaciente) {
    alert(
      "Antes de guardar, seleccione paciente, autorice su firma y adjunte la evidencia del paciente.",
    );
    return false;
  }

  row.isSaving = true;

  try {
    await api.patch(`/trip-history/${row.historyId}/patient`, {
      patientId: Number(row.paciente.id),
    });

    row.status = "COMPLETED";
    row.isSaved = true;
    return true;
  } catch (error) {
    const backendMessage = error.response?.data?.message;
    alert(
      Array.isArray(backendMessage)
        ? backendMessage.join(", ")
        : backendMessage || "No se pudo guardar el paciente para este viaje.",
    );
    return false;
  } finally {
    row.isSaving = false;
  }
};

// ── Paciente modal ────────────────────────────────────────────────────
const patientModal = ref({ open: false, row: null, search: "" });

const openPatientModal = (row) => {
  patientModal.value = { open: true, row, search: "" };
};

const closePatientModal = () => {
  patientModal.value.open = false;
};

const filteredPatients = computed(() =>
  (patientModal.value.row?.patientOptions || []).filter((p) =>
    p.name.toLowerCase().includes(patientModal.value.search.toLowerCase()),
  ),
);

const getPatientAvatarLabel = (name) => {
  const parts = String(name || "")
    .trim()
    .split(" ")
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  if (parts.length === 1) {
    return parts[0][0].toUpperCase();
  }

  return "?";
};

const selectPatient = (patient) => {
  if (patientModal.value.row) patientModal.value.row.paciente = patient;
  closePatientModal();
};

// ── Firma funcionario (confirmación previa) ──────────────────────────
const signatureModal = ref({ open: false, row: null });

const openSignatureModal = (row) => {
  signatureModal.value = { open: true, row };
};

const closeSignatureModal = () => {
  signatureModal.value.open = false;
};

const confirmSignatureForRow = () => {
  const row = signatureModal.value.row;
  if (!row) return;

  // El backend usa el campo como booleano (presencia/ausencia de firma).
  const signatureValue =
    auth.fullName || auth.user?.email || "Firma registrada";
  row.firma = signatureValue;

  closeSignatureModal();
};

// ── Evidencia paciente (confirmación/adjunto) ───────────────────────
const evidenceModal = ref({ open: false, row: null, file: null, fileUrl: "" });
const evidenceFileInput = ref(null);

/* ── Cámara / captura con getUserMedia (desactivado por ahora; reactivar más adelante) ──
const cameraVideoRef = ref(null);
const cameraStream = ref(null);
const cameraError = ref("");

const stopCameraStream = () => {
  const stream = cameraStream.value;
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    cameraStream.value = null;
  }
  if (cameraVideoRef.value) {
    cameraVideoRef.value.srcObject = null;
  }
  cameraError.value = "";
};

const startEvidenceCamera = async () => {
  cameraError.value = "";
  stopCameraStream();

  if (!navigator.mediaDevices?.getUserMedia) {
    cameraError.value =
      "Este navegador no permite usar la cámara aquí. Pruebe con HTTPS o elija un archivo desde su dispositivo.";
    return;
  }

  try {
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
    } catch {
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
    }
    cameraStream.value = stream;
    await nextTick();
    if (cameraVideoRef.value) {
      cameraVideoRef.value.srcObject = stream;
    }
  } catch {
    cameraError.value =
      "No se pudo acceder a la cámara. Acepte el permiso cuando el navegador lo solicite, o elija una imagen desde archivos.";
  }
};

const captureEvidencePhoto = () => {
  const video = cameraVideoRef.value;
  if (!video || !video.videoWidth) {
    cameraError.value = "Espere un momento a que la cámara muestre imagen y vuelva a intentar.";
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.drawImage(video, 0, 0);

  canvas.toBlob(
    (blob) => {
      if (!blob) return;
      const name = `evidencia-paciente-${Date.now()}.jpg`;
      const file = new File([blob], name, { type: "image/jpeg" });

      if (evidenceModal.value.fileUrl && !evidenceModal.value.row?.isSaved) {
        URL.revokeObjectURL(evidenceModal.value.fileUrl);
      }

      evidenceModal.value.file = file;
      evidenceModal.value.fileUrl = URL.createObjectURL(file);
      stopCameraStream();
    },
    "image/jpeg",
    0.92,
  );
};

onBeforeUnmount(() => {
  stopCameraStream();
});
*/

// Sin cámara activa: no-op para que open/close evidencia y selección de archivo sigan funcionando.
const stopCameraStream = () => {};

const openEvidenceModal = (row) => {
  stopCameraStream();
  if (evidenceModal.value.fileUrl && !evidenceModal.value.row?.isSaved) {
    URL.revokeObjectURL(evidenceModal.value.fileUrl);
  }
  evidenceModal.value = { open: true, row, file: null, fileUrl: "" };
  nextTick(() => {
    if (evidenceFileInput.value) evidenceFileInput.value.value = "";
  });
};

const closeEvidenceModal = () => {
  stopCameraStream();
  if (evidenceModal.value.fileUrl && !evidenceModal.value.row?.isSaved) {
    URL.revokeObjectURL(evidenceModal.value.fileUrl);
  }
  evidenceModal.value.open = false;
  evidenceModal.value.row = null;
  evidenceModal.value.file = null;
  evidenceModal.value.fileUrl = "";
};

const onEvidenceFileChange = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  stopCameraStream();

  // Reemplazar preview anterior
  if (evidenceModal.value.fileUrl) {
    URL.revokeObjectURL(evidenceModal.value.fileUrl);
  }

  evidenceModal.value.file = file;
  evidenceModal.value.fileUrl = URL.createObjectURL(file);
};

const confirmEvidenceForRow = () => {
  const row = evidenceModal.value.row;
  if (!row) return;

  if (!evidenceModal.value.file) {
    alert("Por favor seleccione una evidencia (foto o archivo).");
    return;
  }

  const newUrl = evidenceModal.value.fileUrl;
  const oldUrl = row.firmaPacienteUrl;
  if (oldUrl && oldUrl !== newUrl) {
    URL.revokeObjectURL(oldUrl);
  }

  row.firmaPaciente = evidenceModal.value.file.name;
  row.firmaPacienteUrl = newUrl;

  // La URL pasa a la fila: vaciar el modal sin revocar (closeEvidenceModal revocaría la preview).
  evidenceModal.value.file = null;
  evidenceModal.value.fileUrl = "";

  closeEvidenceModal();
};

// ── Pagination ────────────────────────────────────────────────────────
const currentPage = ref(1);
const rowsPerPage = ref(100);
const totalRows = computed(() => rows.value.length);

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value;
  const end = start + rowsPerPage.value;
  return rows.value.slice(start, end);
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(totalRows.value / rowsPerPage.value)),
);

const paginationLabel = computed(() => {
  if (totalRows.value === 0) {
    return "0-0 de 0";
  }

  const start = (currentPage.value - 1) * rowsPerPage.value + 1;
  const end = Math.min(currentPage.value * rowsPerPage.value, totalRows.value);
  return `${start}-${end} de ${totalRows.value}`;
});

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--;
};
const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++;
};

onMounted(() => {
  loadRows();
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
    <div class="flex flex-1 overflow-hidden">
      <DashboardSidebar />

      <main class="flex-1 py-10 px-6 overflow-hidden flex items-start justify-center">
        <div class="flex gap-6 w-full max-w-5xl h-full min-h-0">
          <div
            class="bg-white rounded-3xl border-2 border-slate-300 shadow-sm overflow-hidden flex-1 flex flex-col"
          >
            <!-- Encabezado -->
            <div class="px-8 pt-8 pb-4">
              <h1
                class="text-3xl font-titles font-bold text-text-title text-center mb-6"
              >
                Registro diario
              </h1>

              <div class="flex items-center justify-between mb-3">
                <span class="font-titles font-semibold text-text-title">
                  Funcionario: <span class="text-primary">{{ auth.fullName || auth.user?.email || 'Usuario' }}</span>
                </span>
                <span class="text-gray-500 font-body text-sm">{{
                  currentDate
                }}</span>
              </div>
            </div>

            <!-- Tabla -->
            <div class="overflow-x-auto px-12 md:px-16 relative mt-6 pb-6">
              <table class="history-table w-full text-sm font-body">
                <thead>
                  <tr
                    class="border-b border-gray-200 text-text-title font-semibold"
                  >
                    <th
                      class="px-2 py-3 text-center align-middle w-14"
                      rowspan="2"
                      title="Guardar registro del viaje"
                    >
                      <span class="font-semibold text-text-title"
                        >Estado</span
                      >
                    </th>
                    <th class="px-4 py-3 text-center border-l border-gray-200" colspan="2">
                      Hora
                    </th>
                    <th
                      class="px-4 py-3 text-center border-l border-gray-200"
                      rowspan="2"
                    >
                      Patente
                    </th>
                    <th
                      class="px-4 py-3 text-center border-l border-gray-200"
                      rowspan="2"
                    >
                      Destino
                    </th>
                    <th
                      class="px-4 py-3 text-center border-l border-gray-200"
                      rowspan="2"
                    >
                      Firma Funcionario
                    </th>
                    <th
                      class="px-4 py-3 text-center border-l border-gray-200"
                      rowspan="2"
                    >
                      Paciente
                    </th>
                    <th
                      class="px-4 py-3 text-center border-l border-gray-200"
                      rowspan="2"
                    >
                      Evidencia
                    </th>
                  </tr>
                  <tr
                    class="border-b border-gray-200 text-text-title text-xs"
                  >
                    <th class="px-4 py-1 text-center border-l border-gray-200">
                      Inicio
                    </th>
                    <th class="px-4 py-1 text-center border-l border-gray-200">
                      Final
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="isLoadingRows">
                    <td colspan="8" class="px-6 py-12 text-center text-text-secondary">
                      Cargando viajes...
                    </td>
                  </tr>

                  <tr v-else-if="rowsError">
                    <td colspan="8" class="px-6 py-12 text-center text-red-600">
                      {{ rowsError }}
                    </td>
                  </tr>

                  <tr
                    v-for="row in paginatedRows"
                    v-show="!isLoadingRows && !rowsError"
                    :key="row.id"
                    class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <!-- Guardar -->
                    <td class="px-2 py-3 text-center align-middle w-14">
                      <button
                        v-if="!row.isSaved"
                        type="button"
                        @click="saveRow(row)"
                        title="Guardar registro del viaje"
                        class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#215179] hover:bg-blue-900 text-white shadow-sm transition-colors"
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
                      </button>
                      <span
                        v-else
                        class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-50 text-green-600 border border-green-200"
                        title="Viaje guardado"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="w-5 h-5"
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

                    <!-- Hora Inicio -->
                    <td
                      class="px-2 py-3 text-center min-w-[120px] border-l border-gray-200"
                    >
                      <span
                        class="block w-full text-center font-body text-sm"
                        :class="row.horaInicio ? 'text-text-title' : 'text-gray-400'"
                      >
                        {{ row.horaInicio || '--:--' }}
                      </span>
                    </td>

                    <!-- Hora Final -->
                    <td
                      class="px-2 py-3 text-center border-l border-gray-200 min-w-[120px]"
                    >
                      <span
                        class="block w-full text-center font-body text-sm"
                        :class="row.horaFinal ? 'text-text-title' : 'text-gray-400'"
                      >
                        {{ row.horaFinal || '--:--' }}
                      </span>
                    </td>

                    <!-- Patente -->
                    <td class="px-4 py-3 border-l border-gray-200 text-center">
                      <span class="text-sm font-body" :class="row.patente ? 'text-text-title' : 'text-gray-400'">
                        {{ row.patente || 'Patente' }}
                      </span>
                    </td>

                    <!-- Destino -->
                    <td class="px-4 py-3 border-l border-gray-200 text-center">
                      <span class="text-sm font-body" :class="row.destino ? 'text-text-title' : 'text-gray-400'">
                        {{ row.destino || 'Destino' }}
                      </span>
                    </td>

                    <!-- Firma -->
                    <td class="px-4 py-3 border-l border-gray-200 text-center">
                      <div class="flex flex-col gap-2 items-center">
                        <input
                          v-if="row.firma"
                          type="text"
                          v-model="row.firma"
                          disabled
                          class="bg-transparent outline-none text-sm w-full max-w-[14rem] font-body text-center disabled:text-gray-400"
                        />

                        <button
                          v-else
                          type="button"
                          @click="openSignatureModal(row)"
                          :disabled="row.isSaved"
                          class="w-full flex items-center justify-center gap-2 px-2 py-1.5 rounded-lg border border-[#215179]/20 bg-[#215179]/5 text-[#215179] text-xs font-bold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#215179]/10"
                          title="Autorizar el uso de su firma para este viaje"
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
                              d="M12 8v4l3 3"
                            />
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Pendiente por firmar
                        </button>
                      </div>
                    </td>

                    <!-- Paciente -->
                    <td class="px-4 py-3 border-l border-gray-200 text-center">
                      <button
                        type="button"
                        @click="openPatientModal(row)"
                        :disabled="row.isSaved"
                        class="flex items-center justify-center gap-2 w-full text-sm outline-none group"
                        :class="[
                          row.paciente ? 'text-text-title' : 'text-gray-300',
                          row.isSaved ? 'disabled:opacity-50 disabled:cursor-not-allowed' : '',
                        ]"
                      >
                        <span class="truncate max-w-[10rem]">{{
                          row.paciente ? row.paciente.name : "Nombre Apellido"
                        }}</span>
                        <svg
                          class="w-3 h-3 text-gray-400 shrink-0 group-hover:text-primary transition-colors"
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
                    </td>

                    <!-- Firma Paciente -->
                    <td class="px-4 py-3 border-l border-gray-200 text-center">
                      <div class="flex flex-col gap-2 items-center">
                        <button
                          v-if="!row.firmaPaciente"
                          type="button"
                          @click="openEvidenceModal(row)"
                          :disabled="row.isSaved"
                          class="w-full flex items-center justify-center gap-2 px-2 py-1.5 rounded-lg border border-[#215179]/20 bg-[#215179]/5 text-[#215179] text-xs font-bold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#215179]/10"
                          title="Adjunte evidencia (foto o archivo) de la visita al paciente"
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
                              d="M7 16V8a2 2 0 012-2h6a2 2 0 012 2v8m-10 0h10m-10 0l-2 2m12-2l2 2"
                            />
                          </svg>
                          Pendiente por adjuntar evidencia
                        </button>

                        <div
                          v-else
                          class="w-full flex flex-col items-center justify-center gap-1"
                        >
                          <div
                            class="w-full flex items-center justify-center gap-2"
                          >
                            <img
                              v-if="row.firmaPacienteUrl"
                              :src="row.firmaPacienteUrl"
                              alt="Evidencia del paciente"
                              class="w-9 h-9 object-cover rounded-lg border border-gray-200 shrink-0"
                            />
                            <span
                              class="text-xs text-text-secondary font-body truncate text-center"
                              :class="
                                row.firmaPacienteUrl
                                  ? 'max-w-[8rem]'
                                  : 'max-w-[10rem]'
                              "
                            >
                              {{ row.firmaPaciente }}
                            </span>
                          </div>
                          <button
                            v-if="!row.isSaved"
                            type="button"
                            @click="openEvidenceModal(row)"
                            class="text-xs text-primary font-body underline"
                          >
                            Cambiar evidencia
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-if="!isLoadingRows && !rowsError && paginatedRows.length === 0" class="px-8 pb-8 text-center text-text-secondary">
              No hay viajes disponibles para registrar paciente.
            </div>

            <!-- Pagination -->
            <div
              class="px-8 py-4 flex md:hidden items-center justify-between border-t border-gray-100"
            >
              <!-- Scroll indicator (visual) -->
              <div class="flex items-center gap-2">
                <button
                  class="text-gray-400 hover:text-primary transition-colors"
                >
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <div class="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-primary rounded-full"
                    style="width: 50%"
                  ></div>
                </div>
                <button
                  class="text-gray-400 hover:text-primary transition-colors"
                >
                  <svg
                    class="w-4 h-4"
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
                </button>
              </div>

              <!-- Rows per page + page nav -->
              <div class="flex items-center gap-6">
                <div class="flex items-center gap-2">
                  <span class="text-sm text-text-secondary font-body"
                    >Filas por páginas</span
                  >
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

                <span class="text-sm text-text-secondary font-body">{{
                  paginationLabel
                }}</span>

                <div class="flex items-center gap-1">
                  <button
                    @click="prevPage"
                    :disabled="currentPage === 1"
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <button
                    @click="nextPage"
                    :disabled="currentPage >= totalPages"
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg
                      class="w-4 h-4"
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
      <div
        v-if="patientModal.open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div class="absolute inset-0 bg-black/40" @click="closePatientModal" />
        <div
          class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 overflow-hidden"
        >
          <!-- Header -->
          <div
            class="flex items-center justify-between px-5 py-4 border-b border-gray-100"
          >
            <h3 class="font-titles font-semibold text-text-title">
              Buscar paciente
            </h3>
            <button
              @click="closePatientModal"
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

          <!-- Search -->
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
              :class="{
                'bg-blue-50': patientModal.row?.paciente?.id === patient.id,
              }"
            >
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors"
                :class="
                  patientModal.row?.paciente?.id === patient.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-500 group-hover:bg-primary group-hover:text-white'
                "
              >
                {{ getPatientAvatarLabel(patient.name) }}
              </div>
              <span
                class="text-sm font-body transition-colors"
                :class="
                  patientModal.row?.paciente?.id === patient.id
                    ? 'text-primary font-semibold'
                    : 'text-text-title'
                "
                >{{ patient.name }}</span
              >
            </li>
            <li
              v-if="filteredPatients.length === 0"
              class="px-5 py-6 text-center text-sm text-gray-400"
            >
              Sin resultados para "{{ patientModal.search }}"
            </li>
          </ul>
        </div>
      </div>
    </transition>

    <!-- ═══════════════════════════════════════ -->
    <!-- MODAL: Confirmar firma                -->
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
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          class="absolute inset-0 bg-black/40"
          @click="closeSignatureModal"
        />

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

          <!-- Título -->
          <h3
            class="font-titles font-bold text-text-title text-center text-2xl mb-5"
          >
            Confirmar firma
          </h3>

          <!-- Texto -->
          <p
            class="text-base text-text-secondary font-body text-center mb-8"
          >
            ¿Usted realizó dicho viaje?
            <br />
            Una vez que confirme, se registrará su firma para este viaje realizado.
          </p>

          <!-- Botones -->
          <div class="flex gap-4 justify-center">
            <button
              @click="confirmSignatureForRow"
              class="px-8 py-3 bg-[#9B2335] hover:bg-red-800 text-white font-bold rounded-lg shadow transition-all duration-200"
            >
              Confirmar
            </button>
            <button
              @click="closeSignatureModal"
              class="px-8 py-3 bg-[#215179] hover:bg-blue-900 text-white font-bold rounded-lg shadow transition-all duration-200"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ═══════════════════════════════════════ -->
    <!-- MODAL: Adjuntar evidencia del paciente -->
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
        v-if="evidenceModal.open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div class="absolute inset-0 bg-black/40" @click="closeEvidenceModal" />

        <div
          class="relative bg-white rounded-2xl w-full max-w-lg z-10 p-10 shadow-[0_30px_80px_-5px_rgba(0,0,0,0.5),0_0_0_1px_rgba(0,0,0,0.06)]"
        >
          <!-- X -->
          <button
            @click="closeEvidenceModal"
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
            Adjuntar evidencia
          </h3>

          <!-- Texto -->
          <p class="text-base text-text-secondary font-body text-center mb-6">
            Adjunte una foto o evidencia que confirme la visita al paciente.
          </p>

          <!-- Selector de archivo -->
          <div class="mb-6">
            <p class="text-xs text-text-secondary font-body mb-2 text-center">
              Elegir imagen desde archivos
            </p>
            <input
              ref="evidenceFileInput"
              type="file"
              accept="image/*"
              @change="onEvidenceFileChange"
              :disabled="evidenceModal.row?.isSaved"
              class="w-full text-sm font-body border border-gray-200 rounded-xl bg-gray-50 px-4 py-3 outline-none focus:border-primary"
            />
          </div>

          <!--
            Cámara con getUserMedia (reactivar junto al bloque comentado en <script>).
            <p class="text-xs text-gray-400 font-body text-center mb-3">o</p>
            <div class="mb-6">
              <p class="text-xs text-text-secondary font-body mb-2 text-center">
                Tomar foto con la cámara
              </p>
              <div class="flex flex-col sm:flex-row gap-3 justify-center">
                <button type="button" @click="startEvidenceCamera" ...>Activar cámara</button>
                <button type="button" @click="captureEvidencePhoto" ...>Capturar foto</button>
                <button type="button" @click="stopCameraStream" ...>Cerrar cámara</button>
              </div>
              <p v-if="cameraError" class="mt-3 text-xs text-red-600 font-body text-center">{{ cameraError }}</p>
              <div v-if="cameraStream" class="mt-4 ...">
                <video ref="cameraVideoRef" class="max-h-56 w-full object-contain" autoplay playsinline muted />
              </div>
            </div>
          -->

          <!-- Preview -->
          <div v-if="evidenceModal.fileUrl" class="flex justify-center mb-8">
            <img
              :src="evidenceModal.fileUrl"
              alt="Vista previa de evidencia"
              class="w-32 h-32 object-cover rounded-lg border border-gray-200"
            />
          </div>

          <!-- Botones -->
          <div class="flex gap-4 justify-center">
            <button
              @click="confirmEvidenceForRow"
              :disabled="!evidenceModal.file || evidenceModal.row?.isSaved"
              class="px-8 py-3 bg-[#9B2335] hover:bg-red-800 text-white font-bold rounded-lg shadow transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Confirmar
            </button>
            <button
              @click="closeEvidenceModal"
              class="px-8 py-3 bg-[#215179] hover:bg-blue-900 text-white font-bold rounded-lg shadow transition-all duration-200"
            >
              Cancelar
            </button>
          </div>
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
