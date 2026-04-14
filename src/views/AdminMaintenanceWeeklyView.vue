<script setup>
import { ref, computed, onMounted } from 'vue'
import logoCompleto from '@/assets/images/Logo-completo.png'
import DashboardSidebar from '@/components/DashboardSidebar.vue'
import UserMenu from '@/components/UserMenu.vue'
import { useRouter } from 'vue-router'
import api from '@/services/axios'

const router = useRouter()

// --- 1. CONFIGURACIÓN GLOBAL & TÍTULO DINÁMICO ---
const mesesAnio = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

const tituloMesPrincipal = computed(() => {
  return `CHECK LIST MANTENCIONES INTERNAS ${mesesAnio[new Date().getMonth()].toUpperCase()}`;
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
  sanitizacion: diasSemana.map(dia => ({
    fecha: dia,
    ...Object.fromEntries(mesesAnio.map(mes => [mes, '']))
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

// --- 5. LÓGICA DEL CARRUSEL DE MESES ---
const mesCentroIndex = ref(new Date().getMonth());
const mesesVisibles = computed(() => {
  const centro = mesCentroIndex.value;
  const anterior = (centro - 1 + 12) % 12;
  const siguiente = (centro + 1 + 12) % 12;
  return [mesesAnio[anterior], mesesAnio[centro], mesesAnio[siguiente]];
});

const navegarMes = (direccion) => {
  mesCentroIndex.value = (mesCentroIndex.value + direccion + 12) % 12;
};

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
  } catch {
    trucks.value = []
  } finally {
    isLoadingTrucks.value = false
  }
}

// --- 8. OBTENER FECHAS Lun-Vie DE LA SEMANA ACTUAL ---
const getCurrentWeekDates = () => {
  const today = new Date()
  const dow = today.getDay() // 0=Dom…6=Sáb
  const diff = dow === 0 ? -6 : 1 - dow
  const monday = new Date(today)
  monday.setDate(today.getDate() + diff)

  return diasSemana.map((name, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return { name, date: d }
  })
}

// --- 9. CARGAR DATOS DEL CAMIÓN + REGISTROS SEMANALES ---
const loadTruckData = async (truckId) => {
  if (!truckId) return
  isLoadingTruckData.value = true
  truckLoadError.value = ''

  // Resetear tablas antes de cargar
  inicializarSeccion(itemsLuces,    'luces')
  inicializarSeccion(itemsMecanica, 'mecanica')
  inicializarSeccion(itemsAccesorios, 'accesorios')

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

    // 9c. Poblar tablas con registros de la semana actual
    const weekDates = getCurrentWeekDates()

    records.forEach(record => {
      const recordDate = new Date(record.inspectionDate)
      const matchingDay = weekDates.find(d =>
        d.date.getFullYear() === recordDate.getUTCFullYear() &&
        d.date.getMonth()    === recordDate.getUTCMonth()    &&
        d.date.getDate()     === recordDate.getUTCDate()
      )
      if (!matchingDay) return

      const dayName = matchingDay.name
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
};

const cancelarEdicion = () => {
  router.push('/admin/mantencion-vehicular');
};

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

          <h1 class="text-2xl font-bold text-center text-slate-900 mb-6 uppercase tracking-wide">{{ tituloMesPrincipal }}</h1>

          <!-- Selector de Camión -->
          <div class="mb-6">
            <h2 class="text-sm font-bold text-slate-800 mb-3 underline">Vehículo.</h2>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Seleccionar Vehículo</label>
            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 max-w-sm">
              <div class="relative flex-1">
                <select
                  id="truck-selector"
                  v-model="selectedTruckId"
                  @change="onTruckSelect"
                  :disabled="isLoadingTrucks || isLoadingTruckData"
                  class="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option :value="null">-- Seleccione un camión --</option>
                  <option v-for="truck in trucks" :key="truck.id" :value="truck.id">
                    {{ truck.plate }} — {{ truck.model }}
                  </option>
                </select>
              </div>
              <!-- Spinner carga datos -->
              <div v-if="isLoadingTruckData" class="flex items-center gap-2 text-slate-500 text-xs">
                <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Cargando...
              </div>
            </div>
            <p v-if="truckLoadError" class="mt-2 text-xs text-red-600">{{ truckLoadError }}</p>
            <p v-if="!isLoadingTrucks && trucks.length === 0" class="mt-2 text-xs text-amber-600">No hay vehículos registrados.</p>
          </div>

          <section class="flex flex-col gap-10 mb-12">
            <div>
              <h2 class="text-sm font-bold text-slate-800 mb-3 underline">Condiciones mínimas y obligatorias de vehículo.</h2>
              <div class="overflow-x-auto border border-slate-300 rounded-lg shadow-sm w-full">
                <table class="w-full whitespace-nowrap sm:whitespace-normal text-center border-collapse text-sm min-w-[600px] sm:min-w-full">
                  <thead class="bg-slate-50 border-b border-slate-300 text-slate-700 font-bold">
                    <tr>
                      <th class="p-3 border-r border-slate-300">Marca <span class="font-normal text-slate-400 text-xs">(pendiente)</span></th>
                      <th class="p-3 border-r border-slate-300">Modelo</th>
                      <th class="p-3 border-r border-slate-300">Año <span class="font-normal text-slate-400 text-xs">(pendiente)</span></th>
                      <th class="p-3 border-r border-slate-300">Patente</th>
                      <th class="p-3 border-r border-slate-300">Kilometraje</th>
                      <th class="p-3">C/asientos <span class="font-normal text-slate-400 text-xs">(pendiente)</span></th>
                    </tr>
                  </thead>
                  <tbody class="text-slate-600 bg-white">
                    <tr>
                      <td class="p-3 border-r border-slate-200 text-slate-400 italic">{{ datosVehiculo.marca }}</td>
                      <td class="p-3 border-r border-slate-200 font-semibold text-slate-700">{{ datosVehiculo.modelo }}</td>
                      <td class="p-3 border-r border-slate-200 text-slate-400 italic">{{ datosVehiculo.anio }}</td>
                      <td class="p-3 border-r border-slate-200 font-semibold text-slate-700">{{ datosVehiculo.patente }}</td>
                      <td class="p-3 border-r border-slate-200 font-semibold text-slate-700">{{ datosVehiculo.kilometraje }}</td>
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
              <table class="w-full text-center border-collapse text-xs min-w-[910px] sm:min-w-full">
                <thead class="bg-slate-50 border-b border-slate-300 text-slate-700 font-bold">
                  <tr>
                    <th class="p-3 border-r border-slate-300 min-w-[180px]">Descripción</th>
                    <th v-for="dia in diasSemana" :key="dia" class="p-3 border-r border-slate-300 w-[90px]">{{ dia }}</th>
                    <th class="p-3 min-w-[280px]">Observación</th>
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
                      <!-- Selección manual Sí / No -->
                      <template v-else>
                        <div class="flex gap-1 justify-center">
                          <button
                            @click="registros[sec.r][item][dia] = registros[sec.r][item][dia] === 'Si' ? '' : 'Si'"
                            :class="[
                              'px-2 py-0.5 rounded text-[10px] font-semibold border transition-all',
                              registros[sec.r][item][dia] === 'Si'
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-slate-300 text-slate-400 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50'
                            ]"
                          >Sí</button>
                          <button
                            @click="registros[sec.r][item][dia] = registros[sec.r][item][dia] === 'No' ? '' : 'No'"
                            :class="[
                              'px-2 py-0.5 rounded text-[10px] font-semibold border transition-all',
                              registros[sec.r][item][dia] === 'No'
                                ? 'bg-red-500 border-red-500 text-white'
                                : 'border-slate-300 text-slate-400 hover:border-red-400 hover:text-red-600 hover:bg-red-50'
                            ]"
                          >No</button>
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
            <div class="flex flex-col sm:flex-row items-center justify-between max-w-3xl mx-auto mb-4 px-2 gap-4">
              <h2 class="text-sm font-bold text-slate-800 underline uppercase tracking-tight w-full sm:w-auto text-center sm:text-left">Sanitización Vehículo</h2>
              <div class="flex items-center gap-2">
                <button @click="navegarMes(-1)" class="p-1.5 rounded-full bg-white border border-slate-300 hover:bg-blue-50 text-slate-500 hover:text-blue-600 shadow-sm transition-all active:scale-90">←</button>
                <span class="text-xs font-bold text-slate-400 w-20 text-center uppercase">Navegar Mes</span>
                <button @click="navegarMes(1)" class="p-1.5 rounded-full bg-white border border-slate-300 hover:bg-blue-50 text-slate-500 hover:text-blue-600 shadow-sm transition-all active:scale-90">→</button>
              </div>
            </div>
            
            <div class="max-w-3xl mx-auto border border-slate-300 rounded-lg overflow-x-auto shadow-sm w-full">
              <table class="w-full whitespace-nowrap sm:whitespace-normal text-center border-collapse text-sm min-w-[500px] sm:min-w-full">
                <thead class="bg-slate-50 border-b border-slate-300 text-slate-700 font-bold">
                  <tr>
                    <th class="p-3 border-r border-slate-300 w-1/4">Día de la semana</th>
                    <th v-for="mes in mesesVisibles" :key="mes" class="p-3 border-r border-slate-300 last:border-r-0 w-1/4">
                      {{ mes }}
                    </th>
                  </tr>
                </thead>
                <tbody class="text-slate-600 bg-white">
                  <tr v-for="row in registros.sanitizacion" :key="row.fecha" class="border-b border-slate-200 last:border-0 hover:bg-slate-50">
                    <td class="p-3 border-r border-slate-200 font-medium bg-slate-50/20 text-left pl-6">{{ row.fecha }}</td>
                    <td v-for="mes in mesesVisibles" :key="mes" class="p-1.5 border-r border-slate-200 last:border-r-0">
                      <input 
                        v-model="row[mes]" 
                        class="w-full text-center border-none focus:ring-0 bg-transparent text-sm p-1.5" 
                        placeholder="---"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <footer class="flex flex-col sm:flex-row justify-between items-center mt-8 sm:mt-12 pt-8 border-t-2 border-slate-200 gap-4">
            <button @click="guardarFormulario" class="w-full sm:w-auto bg-red-800 hover:bg-red-900 text-white px-12 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 order-1 sm:order-none">
              Confirmar y Guardar
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