<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import logoCompleto from '@/assets/images/Logo-completo.png'
import DashboardSidebar from '@/components/DashboardSidebar.vue'
import UserMenu from '@/components/UserMenu.vue'
import { useRouter } from 'vue-router'
import api from '@/services/axios'

const router = useRouter()

// --- 1. CONFIGURACIÓN GLOBAL & TÍTULO DINÁMICO ---
const mesesAnio = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const diasSemana = ['Sab/Dom_1', 'Sab/Dom_2', 'Sab/Dom_3', 'Sab/Dom_4', 'Sab/Dom_5'];

const currentDateStr = ref(new Date().toISOString().slice(0, 7)); // YYYY-MM

const tituloMesPrincipal = computed(() => {
  const [year, month] = currentDateStr.value.split('-').map(Number);
  return `CHECK LIST MANTENCIONES INTERNAS ${mesesAnio[month - 1].toUpperCase()} ${year}`;
});

const formatDateSafe = (value) => {
  if (!value) return 'N/D'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/D'
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

const getStatusByExpiry = (value) => {
  if (!value) return 'No tiene'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No tiene'

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const expiry = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  return expiry >= today ? 'Vigente' : 'Vencido'
}

// --- 2. ESTADO DEL SELECTOR DE CAMIÓN ---
const trucks = ref([])
const selectedTruckId = ref(null)
const isLoadingTrucks = ref(false)
const isLoadingTruckData = ref(false)
const truckLoadError = ref('')

// --- 3. DATOS DEL VEHÍCULO (desde BD) ---
const datosVehiculo = ref({ modelo: 'N/D', patente: 'N/D', kilometraje: 'N/D', marca: 'N/D', anio: 'N/D', asientos: 'N/D' })
const docsBackend = ref({
  permisoCirculacion: { estado: 'N/D', vencimiento: 'N/D' },
  revisionTecnica:    { estado: 'N/D', vencimiento: 'N/D' },
  emisionContaminantes: { estado: 'N/D', vencimiento: 'N/D' },
  seguroObligatorio:  { estado: 'N/D', vencimiento: 'N/D' },
})

// Ítems para tablas largas
const itemsLuces = ['Luces Bajas', 'Luces Altas', 'Luz retroceso', 'Luz freno', '3ra Luz freno', 'Intermitentes', 'Luz interior'];
const itemsMecanica = [
  'Cambio aceite caja', 'Revisión de frenos', 'Aire acondicionado', 'Cambio agua verde', 'Revisión filtros',
  'Revisión batería', 'Revisión cables eléctricos', 'Revisión motor', 'Revisión embrague', 'Niveles hidráulicos',
  'Niveles de aceite', 'Cambio aceite motor', 'Frenos', 'Freno de mano', 'Limpia parabrisas', 'Vidrios laterales',
  'Tuercas', 'Puertas', 'Manillas de puertas', 'Parachoques', 'Nivel de agua', 'Nivel de aceite', 'Espejos',
  'Cierre centralizado', 'Cinturón de seguridad', 'Aseo interior/exterior', 'Neumático delantero derecho',
  'Neumático delantero izquierdo', 'Neumático trasero derecho', 'Neumático trasero izquierdo'
];
const itemsAccesorios = ['Botiquín', 'Triangulo', 'Gata', 'Extintor', 'Llave de rueda', 'Neumático repuesto'];

// --- 4. ESTADO DE REGISTROS (EDITABLE) ---
const registros = ref({
  luces: {},
  mecanica: {},
  accesorios: {},
  sanitizacion: Array.from({ length: 5 }, () => ({
    fecha: '',
    observacion: ''
  }))
});

const inicializarSeccion = (items, target) => {
  items.forEach(item => {
    registros.value[target][item] = { ...Object.fromEntries(diasSemana.map(dia => [dia, ''])), observacion: '' };
  });
};
inicializarSeccion(itemsLuces, 'luces');
inicializarSeccion(itemsMecanica, 'mecanica');
inicializarSeccion(itemsAccesorios, 'accesorios');



// --- 6. MAPEO: nombre del ítem semanal → itemCode diario ---
const itemCodeMap = {
  'Luces Bajas':                   'bajas',
  'Luces Altas':                   'altas',
  'Luz retroceso':                 'marchaAtras',
  'Luz freno':                     'frenos',
  '3ra Luz freno':                 'frenos',
  'Intermitentes':                 'virajeDerecha',
  'Frenos':                        'pedal',
  'Freno de mano':                 'frenoMano',
  'Nivel de agua':                 'nivelAceiteRadiador',
  'Nivel de aceite':               'nivelAceiteMotor',
  'Niveles de aceite':             'nivelAceiteMotor',
  'Revisión batería':              'bateria',
  'Neumático delantero derecho':   'delanteroDerecho',
  'Neumático delantero izquierdo': 'delanteroIzquierdo',
  'Neumático trasero derecho':     'traseroDerecho',
  'Neumático trasero izquierdo':   'traseroIzquierdo',
  'Botiquín':                      'botiquin',
  'Triangulo':                     'triangulo',
  'Gata':                          'gataManivela',
  'Extintor':                      'extintor',
  'Llave de rueda':                'llaveRueda',
  'Neumático repuesto':            'repuesto',
}

// --- 7. CARGAR TODOS LOS CAMIONES (ADMIN) ---
const loadTrucks = async () => {
  isLoadingTrucks.value = true
  try {
    const { data } = await api.get('/trucks')
    trucks.value = Array.isArray(data) ? data : []
  } catch (err) {
    const msg = err?.response?.data?.message
    truckLoadError.value = Array.isArray(msg) ? msg.join(', ') : msg || 'Error al cargar camiones.'
    trucks.value = []
  } finally {
    isLoadingTrucks.value = false
  }
}

// --- 8. ELIMINADA LÓGICA SEMANAL ANTIGUA ---

// --- 9. CARGAR DATOS DEL CAMIÓN + REGISTROS SEMANALES ---
const loadTruckData = async (truckId) => {
  if (!truckId) return
  isLoadingTruckData.value = true
  truckLoadError.value = ''

  // Resetear tablas antes de cargar
  inicializarSeccion(itemsLuces,    'luces')
  inicializarSeccion(itemsMecanica, 'mecanica')
  inicializarSeccion(itemsAccesorios, 'accesorios')
  registros.value.sanitizacion = Array.from({ length: 5 }, () => ({ fecha: '', observacion: '' }))

  try {
    // 9a. Datos básicos del camión
    const { data: truck } = await api.get(`/trucks/${truckId}`)
    datosVehiculo.value = {
      modelo:      truck.model    || 'N/D',
      patente:     truck.plate    || 'N/D',
      kilometraje: truck.mileage != null ? `${truck.mileage.toLocaleString('es-CL')} km` : 'N/D',
      marca:    truck.brand || 'N/D',
      anio:     truck.year != null ? String(truck.year) : 'N/D',
      asientos: truck.seatCount != null ? String(truck.seatCount) : 'N/D',
    }

    docsBackend.value = {
      permisoCirculacion: {
        estado: getStatusByExpiry(truck.circulationPermitExpiresAt),
        vencimiento: formatDateSafe(truck.circulationPermitExpiresAt),
      },
      revisionTecnica: {
        estado: getStatusByExpiry(truck.technicalReviewExpiresAt),
        vencimiento: formatDateSafe(truck.technicalReviewExpiresAt),
      },
      emisionContaminantes: {
        estado: getStatusByExpiry(truck.emissionsExpiresAt),
        vencimiento: formatDateSafe(truck.emissionsExpiresAt),
      },
      seguroObligatorio: {
        estado: getStatusByExpiry(truck.insuranceExpiresAt),
        vencimiento: formatDateSafe(truck.insuranceExpiresAt),
      },
    }

    // 9b. Registros de mantenimiento del camión (ordenados DESC por fecha)
    const { data: records } = await api.get(`/vehicle-maintenance-records/truck/${truckId}`)

    if (!records || records.length === 0) return

    // Último registro → estados documentos
    // 9c. Poblar tablas mapeando cada registro a uno de los 5 fines de semana del mes seleccionado
    records.forEach(record => {
      const recordDate = new Date(record.inspectionDate)
      
      // Filtrar sólo registros del mes seleccionado
      const recYYYYMM = recordDate.getUTCFullYear() + '-' + String(recordDate.getUTCMonth() + 1).padStart(2, '0');
      if (recYYYYMM !== currentDateStr.value) return;

      // Calcular a qué fin de semana del mes pertenece (1 al 5)
      const firstDay = new Date(Date.UTC(recordDate.getUTCFullYear(), recordDate.getUTCMonth(), 1));
      const firstDayOfWeek = firstDay.getUTCDay() === 0 ? 7 : firstDay.getUTCDay();
      const dateNum = recordDate.getUTCDate();
      const weekOfMonthNum = Math.ceil((dateNum + firstDayOfWeek - 1) / 7);
      
      const dayName = `Sab/Dom_${Math.min(weekOfMonthNum, 5)}`;
      const byCode = new Map((record.maintenanceItems || []).map(i => [i.itemCode, i]))

      const populateSection = (items, section) => {
        items.forEach(itemName => {
          const code = itemCodeMap[itemName]
          if (!code || !byCode.has(code)) return
          const dbItem = byCode.get(code)
          if (registros.value[section][itemName]) {
            registros.value[section][itemName][dayName] = dbItem.status || '-'
          }
        })
      }

      populateSection(itemsLuces,      'luces')
      populateSection(itemsMecanica,   'mecanica')
      populateSection(itemsAccesorios, 'accesorios')
    })

  } catch (err) {
    const msg = err?.response?.data?.message
    truckLoadError.value = Array.isArray(msg) ? msg.join(', ') : msg || 'No se pudieron cargar los datos del vehículo.'
  } finally {
    isLoadingTruckData.value = false
  }
}

const onTruckSelect = async () => {
  if (selectedTruckId.value) {
    await loadTruckData(Number(selectedTruckId.value))
  } else {
    // Resetear si se deselecciona
    datosVehiculo.value = { modelo: 'N/D', patente: 'N/D', kilometraje: 'N/D', marca: 'N/D', anio: 'N/D', asientos: 'N/D' }
    docsBackend.value = {
      permisoCirculacion:   { estado: 'N/D', vencimiento: 'N/D' },
      revisionTecnica:      { estado: 'N/D', vencimiento: 'N/D' },
      emisionContaminantes: { estado: 'N/D', vencimiento: 'N/D' },
      seguroObligatorio:    { estado: 'N/D', vencimiento: 'N/D' },
    }
    inicializarSeccion(itemsLuces,      'luces')
    inicializarSeccion(itemsMecanica,   'mecanica')
    inicializarSeccion(itemsAccesorios, 'accesorios')
  }
}

// --- 10. ACCIONES ---
const guardarFormulario = () => {
  console.log("Guardando datos...", registros.value);
  alert("¡Cambios guardados con éxito!");
  router.push('/admin/mantencion-vehicular/historial-semanal');
};

const cancelarEdicion = () => {
  router.push('/admin/mantencion-vehicular/historial-semanal');
};

const changeMonth = (delta) => {
  const d = new Date(currentDateStr.value + '-01T12:00:00');
  d.setMonth(d.getMonth() + delta);
  currentDateStr.value = d.toISOString().slice(0, 7);
};

// Re-cargar datos del vehículo al cambiar de mes

watch(currentDateStr, (newVal) => {
  if (selectedTruckId.value) {
    loadTruckData(selectedTruckId.value);
  } else {
    // Si no hay vehículo, al menos limpiamos las tablas para que no queden sucias si no las habían guardado.
  }
});

onMounted(() => {
  loadTrucks()
})
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex flex-col font-sans">
    <header class="bg-white shadow-sm border-b border-gray-200 px-4 py-4 flex items-center justify-between sticky top-0 z-40">
      <router-link to="/"><img :src="logoCompleto" alt="Logo" class="h-16 w-auto object-contain" /></router-link>
      <UserMenu />
    </header>

    <div class="flex flex-1 overflow-hidden">
      <DashboardSidebar />
      
      <main class="flex-1 py-6 px-4 sm:py-10 sm:px-6 overflow-y-auto overflow-x-hidden bg-slate-50 min-w-0">
        <div class="max-w-6xl mx-auto bg-white rounded-2xl sm:rounded-3xl border border-slate-300 shadow-sm p-4 sm:p-10 overflow-x-hidden">

          <h1 class="text-2xl font-bold text-center text-slate-900 mb-8 uppercase tracking-wide">{{ tituloMesPrincipal }}</h1>

          <section class="flex flex-col gap-10 mb-12">
            <div>
              <h2 class="text-sm font-bold text-slate-800 mb-3 underline">Condiciones mínimas y obligatorias de vehículo.</h2>
              <div class="overflow-x-auto border border-slate-300 rounded-lg shadow-sm w-full">
                <table class="w-full whitespace-nowrap sm:whitespace-normal text-center border-collapse text-sm min-w-[600px] sm:min-w-full">
                  <thead class="bg-slate-50 border-b border-slate-300 text-slate-700 font-bold">
                    <tr>
                      <th class="p-3 border-r border-slate-300 w-48">Marca (Selector)</th>
                      <th class="p-3 border-r border-slate-300">Modelo</th>
                      <th class="p-3 border-r border-slate-300">Año <span class="font-normal text-slate-400 text-xs">(pendiente)</span></th>
                      <th class="p-3 border-r border-slate-300">Patente</th>
                      <th class="p-3">C/asientos <span class="font-normal text-slate-400 text-xs">(pendiente)</span></th>
                    </tr>
                  </thead>
                  <tbody class="text-slate-600 bg-white">
                    <tr>
                      <td class="p-3 border-r border-slate-200">
                        <select
                          id="truck-selector"
                          v-model="selectedTruckId"
                          @change="onTruckSelect"
                          :disabled="isLoadingTrucks || isLoadingTruckData"
                          class="w-full border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option :value="null">-- Seleccione --</option>
                          <option v-for="truck in trucks" :key="truck.id" :value="truck.id">
                            {{ truck.plate }} - {{ truck.model }}
                          </option>
                        </select>
                        <p v-if="truckLoadError" class="mt-1 text-[10px] text-red-600">{{ truckLoadError }}</p>
                      </td>
                      <td class="p-3 border-r border-slate-200 font-semibold text-slate-700">{{ datosVehiculo.modelo }}</td>
                      <td class="p-3 border-r border-slate-200 text-slate-400 italic">{{ datosVehiculo.anio }}</td>
                      <td class="p-3 border-r border-slate-200 font-semibold text-slate-700">{{ datosVehiculo.patente }}</td>
                      <td class="p-3 text-slate-400 italic">{{ datosVehiculo.asientos }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <div class="overflow-x-auto border border-slate-300 rounded-lg shadow-sm w-full">
                <table class="w-full whitespace-nowrap sm:whitespace-normal text-center border-collapse text-sm min-w-[500px] sm:min-w-full">
                  <thead class="bg-slate-50 border-b border-slate-300 text-slate-700 font-bold">
                    <tr>
                      <th class="p-3 border-r border-slate-300 w-1/3">Doc. obligatoria</th>
                      <th class="p-3 border-r border-slate-300 w-1/3">Estado</th>
                      <th class="p-3 w-1/3">Vencimiento</th>
                    </tr>
                  </thead>
                  <tbody class="text-slate-600 bg-white">
                    <tr v-for="(val, key) in docsBackend" :key="key" class="border-b border-slate-200 last:border-0 hover:bg-slate-50">
                      <td class="p-3 border-r border-slate-200 text-left pl-6 capitalize font-medium">
                        {{ key.replace(/([A-Z])/g, ' $1') }}
                      </td>
                      <td class="p-3 border-r border-slate-200">
                        <span :class="['inline-block px-3 py-0.5 rounded-full text-xs font-bold', ['Vigente','Aprobado','Bueno'].includes(val.estado) ? 'bg-emerald-100 text-emerald-700' : val.estado === 'N/D' ? 'bg-slate-100 text-slate-400' : 'bg-amber-100 text-amber-700']">{{ val.estado }}</span>
                      </td>
                      <td class="p-3 text-slate-500">{{ val.vencimiento }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section v-for="sec in [{t:'Check list. Normas y Seguridad de Vehículo', i:itemsLuces, r:'luces'}, {t:'Revisión mecánica de vehículo', i:itemsMecanica, r:'mecanica'}, {t:'Accesorios', i:itemsAccesorios, r:'accesorios'}]" :key="sec.t" class="mb-12">
            <h2 class="text-sm font-bold text-slate-800 mb-3 underline">{{ sec.t }}</h2>
            <div class="overflow-x-auto border border-slate-300 rounded-lg shadow-sm w-full">
              <table class="w-full table-fixed text-center border-collapse text-xs min-w-[900px] sm:min-w-full">
                <thead class="bg-slate-50 border-b border-slate-300 text-slate-700 font-bold">
                  <tr>
                    <th class="p-3 border-r border-slate-300 w-1/4">Descripción</th>
                    <th v-for="dia in diasSemana" :key="dia" class="p-3 border-r border-slate-300 w-[10%]">{{ dia.split('_')[0] }}</th>
                    <th class="p-3 w-1/4">Observación</th>
                  </tr>
                </thead>
                <tbody class="text-slate-600 bg-white">
                  <tr v-for="item in sec.i" :key="item" class="border-b border-slate-200 last:border-0 hover:bg-slate-50 transition-colors">
                    <td class="p-3 border-r border-slate-200 text-left pl-6 font-medium text-slate-700">{{ item }}</td>
                    <td v-for="dia in diasSemana" :key="dia" class="p-1.5 border-r border-slate-200 text-center align-middle">
                      <!-- Dato de la BD (Bueno / Regular / Malo) → badge de sólo lectura -->
                      <template v-if="registros[sec.r][item][dia] && !['Si','No'].includes(registros[sec.r][item][dia])">
                        <span :class="[
                          'inline-block px-2 py-0.5 rounded-full text-[10px] font-bold',
                          registros[sec.r][item][dia] === 'Bueno'   ? 'bg-emerald-100 text-emerald-700' :
                          registros[sec.r][item][dia] === 'Regular' ? 'bg-amber-100 text-amber-700'   :
                          registros[sec.r][item][dia] === 'Malo'    ? 'bg-red-100 text-red-600'        :
                          'bg-slate-100 text-slate-500'
                        ]">{{ registros[sec.r][item][dia] }}</span>
                      </template>
                      <!-- Selección manual (Checkbox) -->
                      <template v-else>
                        <div class="flex justify-center items-center">
                          <label class="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox"
                              :checked="registros[sec.r][item][dia] === 'Si'"
                              @change="registros[sec.r][item][dia] = $event.target.checked ? 'Si' : ''"
                              class="sr-only peer"
                            >
                            <div class="w-5 h-5 bg-white border-2 border-slate-300 rounded-md peer peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all flex items-center justify-center">
                              <svg v-if="registros[sec.r][item][dia] === 'Si'" class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="4"><polyline points="20 6 9 17 4 12"/></svg>
                            </div>
                          </label>
                        </div>
                      </template>
                    </td>
                    <td class="p-1.5 bg-slate-50/40">
                      <textarea 
                        v-model="registros[sec.r][item].observacion" 
                        placeholder="Ingrese observación si requiere..." 
                        rows="1" 
                        class="w-full bg-transparent border-none focus:ring-0 text-[11px] resize-none text-slate-500 italic placeholder:text-slate-300 p-2"
                      ></textarea>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="mb-14">
            <h2 class="text-lg font-bold text-slate-900 underline tracking-tight text-center w-full mb-8">Sanitización Vehículo</h2>
            <div class="max-w-3xl mx-auto flex flex-col items-start px-2 sm:px-0">
              
              <div class="flex items-center gap-2 bg-white p-1 rounded-full shadow-sm border border-slate-200 mb-3">
                <button @click="changeMonth(-1)" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all active:scale-95">←</button>
                <div class="relative flex items-center">
                  <input 
                    type="month" 
                    v-model="currentDateStr" 
                    class="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 uppercase cursor-pointer py-0 px-2"
                  />
                </div>
                <button @click="changeMonth(1)" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all active:scale-95">→</button>
              </div>
              
              <div class="border border-slate-300 rounded overflow-x-auto shadow-sm w-full">
                <table class="w-full text-center border-collapse text-sm min-w-[500px] sm:min-w-full">
                  <thead class="bg-white border-b border-slate-300 text-slate-800 font-bold">
                    <tr>
                      <th class="p-4 border-r border-slate-300 w-1/3 text-base">Fecha</th>
                      <th class="p-4 w-2/3 text-base text-left pl-6">Observación</th>
                    </tr>
                  </thead>
                  <tbody class="text-slate-600 bg-white">
                    <tr v-for="(row, i) in registros.sanitizacion" :key="'sani-'+i" class="border-b border-slate-200 last:border-0 hover:bg-slate-50">
                      <td class="p-0 border-r border-slate-200">
                        <input 
                          :type="row.fecha ? 'date' : 'text'"
                          onfocus="this.type='date'"
                          @blur="$event.target.type = row.fecha ? 'date' : 'text'"
                          placeholder="Seleccione fecha"
                          v-model="row.fecha" 
                          class="w-full text-center border-none focus:ring-0 bg-transparent text-sm p-3.5"
                        />
                      </td>
                      <td class="p-0">
                        <textarea 
                          v-model="row.observacion" 
                          rows="1"
                          class="w-full h-full border-none focus:ring-0 bg-transparent text-sm p-3.5 resize-none align-middle"
                        ></textarea>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <footer class="flex flex-col sm:flex-row justify-between items-center mt-8 sm:mt-12 pt-8 border-t-2 border-slate-200 gap-4">
            <button @click="guardarFormulario" class="w-full sm:w-auto bg-red-800 hover:bg-red-900 text-white px-12 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 order-1 sm:order-none">
              Continuar
            </button>
            <button @click="cancelarEdicion" class="w-full sm:w-auto bg-slate-700 hover:bg-slate-800 text-white px-12 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 order-2 sm:order-none">
              Cancelar
            </button>
          </footer>

        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* Estética de campos editables */
textarea, input { outline: none; }
textarea:focus, input:focus { background-color: rgba(248, 250, 252, 1); }

/* Scrollbar sutil para mejorar la experiencia */
main::-webkit-scrollbar { width: 6px; }
main::-webkit-scrollbar-track { background: transparent; }
main::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
</style>
