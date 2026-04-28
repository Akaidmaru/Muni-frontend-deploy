<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import Chart from 'chart.js/auto'
import logoCompleto from '@/assets/images/Logo-completo.png'
import DashboardSidebar from '@/components/DashboardSidebar.vue'
import UserMenu from '@/components/UserMenu.vue'
import api from '@/services/axios'

const router = useRouter()

// ── State ──────────────────────────────────────────────────────────────────
const isLoading = ref(false)
const trucks = ref([])
const maintenanceRecords = ref([])
const allTrips = ref([])
const outOfServiceAlerts = ref([])

// Driver modal
const driverModalOpen = ref(false)
const driverModalSearch = ref('')
const selectedDriver = ref(null)
const dbDrivers = ref([])

// Chart instances
let chartFailures = null
let chartDestinations = null
let chartInactivity = null
let chartDriverWork = null

// Canvas refs
const canvasFailures = ref(null)
const canvasDestinations = ref(null)
const canvasInactivity = ref(null)
const canvasDriverWork = ref(null)

// ── KPI Computed ───────────────────────────────────────────────────────────
const fleetAvailability = computed(() => {
  if (!trucks.value.length) return 0
  const outIds = new Set(outOfServiceAlerts.value.map(a => a.truckId ?? a.truck?.id))
  const available = trucks.value.filter(t => !outIds.has(t.id)).length
  return Math.round((available / trucks.value.length) * 100)
})

const upcomingExpiries = computed(() => {
  const now = new Date()
  const in30 = new Date(); in30.setDate(now.getDate() + 30)
  let count = 0
  trucks.value.forEach(t => {
    ;[t.circulationPermitExpiresAt, t.technicalReviewExpiresAt, t.emissionsExpiresAt, t.insuranceExpiresAt]
      .forEach(d => { if (d) { const e = new Date(d); if (e >= now && e <= in30) count++ } })
  })
  return count
})

const safetyAlerts = computed(() =>
  maintenanceRecords.value.filter(r => {
    const items = r.maintenanceItems || r.dailyMaintenanceItems || []
    return items.some(i => (i.status || '').toLowerCase() === 'malo')
  }).length
)

const weeklyChecklistPct = computed(() => {
  if (!trucks.value.length) return 0
  const now = new Date()
  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0,0,0,0)
  const weekRecords = maintenanceRecords.value.filter(r => new Date(r.date || r.inspectionDate) >= startOfWeek)
  const uniqueTrucks = new Set(weekRecords.map(r => r.truckId ?? r.truck?.id))
  return Math.round((uniqueTrucks.size / trucks.value.length) * 100)
})

// ── KPI helpers ────────────────────────────────────────────────────────────
const kpiVariant = (pct) => pct > 60 ? 'green' : pct >= 40 ? 'amber' : 'red'

const kpiClasses = {
  green: { card: 'border-green-200 bg-green-50', num: 'text-green-700', icon: 'text-green-600 bg-green-100' },
  amber: { card: 'border-amber-200 bg-amber-50', num: 'text-amber-600', icon: 'text-amber-600 bg-amber-100' },
  red:   { card: 'border-red-200 bg-red-50',   num: 'text-red-700',   icon: 'text-red-600 bg-red-100'   },
}

// ── Driver modal ───────────────────────────────────────────────────────────
const modalFilteredDrivers = computed(() => {
  const q = driverModalSearch.value.toLowerCase()
  if (!q) return dbDrivers.value
  return dbDrivers.value.filter(d =>
    (d.name || '').toLowerCase().includes(q) ||
    (d.email || '').toLowerCase().includes(q)
  )
})

const selectDriver = async (driver) => {
  selectedDriver.value = driver
  await nextTick()
  buildDriverWorkChart()
}

// ── Driver trips for current month ─────────────────────────────────────────
const driverMonthTrips = computed(() => {
  if (!selectedDriver.value) return []
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  return allTrips.value.filter(t => {
    const driverMatch = (t.driverId === selectedDriver.value.id) ||
                        (t.driver?.id === selectedDriver.value.id) ||
                        (t.driver === selectedDriver.value.name)
    const dateMatch = new Date(t.rawDate || t.date) >= startOfMonth
    return driverMatch && dateMatch
  })
})

// ── Driver ranking table ───────────────────────────────────────────────────
const getDriverDisplayName = (trip) => {
  // Prefer employee (the person who registered the trip)
  if (trip.employee && typeof trip.employee === 'object') {
    return trip.employee.name || trip.employee.email || 'Desconocido'
  }
  if (trip.driverName && typeof trip.driverName === 'string' && !trip.driverName.startsWith('{')) return trip.driverName
  const d = trip.driver
  if (!d) return 'Desconocido'
  if (typeof d === 'object') return d.name || d.email || 'Desconocido'
  if (typeof d === 'string' && d.startsWith('{')) {
    try { const p = JSON.parse(d); return p.name || p.email || 'Desconocido' } catch {}
  }
  return d || 'Desconocido'
}

const driverRanking = computed(() => {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthTrips = allTrips.value.filter(t => new Date(t.rawDate || t.date) >= startOfMonth)

  const byDriver = {}
  monthTrips.forEach(trip => {
    const key = getDriverDisplayName(trip)
    if (!byDriver[key]) byDriver[key] = { name: key, totalMinutes: 0, trips: [] }
    byDriver[key].trips.push(trip)
    if (trip.startTime && trip.endTime && trip.startTime !== '--:--' && trip.endTime !== '--:--') {
      const [sh, sm] = trip.startTime.split(':').map(Number)
      const [eh, em] = trip.endTime.split(':').map(Number)
      const mins = (eh * 60 + em) - (sh * 60 + sm)
      if (mins > 0) byDriver[key].totalMinutes += mins
    }
  })

  return Object.values(byDriver).map(d => {
    const totalH = d.totalMinutes / 60
    const workDays = new Set(d.trips.map(t => t.dateIso || t.date)).size || 1
    const dailyH = totalH / workDays
    const weeklyH = dailyH * 5
    const restH = Math.max(0, (dailyH * workDays * 0.25))
    return {
      name: d.name,
      totalTrips: d.trips.length,
      dailyHours: totalH > 0 ? dailyH.toFixed(1) : '—',
      weeklyHours: totalH > 0 ? weeklyH.toFixed(1) : '—',
      restTime: totalH > 0 ? restH.toFixed(1) + 'h' : '—',
    }
  }).sort((a, b) => b.totalTrips - a.totalTrips).slice(0, 15)
})

// ── Chart builders ─────────────────────────────────────────────────────────
const buildFailuresChart = () => {
  if (!canvasFailures.value) return
  if (chartFailures) chartFailures.destroy()

  const now = new Date()
  const weeksInMonth = Math.ceil(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() / 7)
  const weekData = Array(weeksInMonth).fill(0)

  maintenanceRecords.value.forEach(r => {
    const d = new Date(r.date || r.inspectionDate)
    if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
      const w = Math.min(Math.floor((d.getDate() - 1) / 7), weeksInMonth - 1)
      // Count items with 'Malo' or 'Regular' status as failures
      const items = r.maintenanceItems || r.dailyMaintenanceItems || []
      const badCount = items.filter(i => {
        const s = (i.status || '').toLowerCase()
        return s === 'malo' || s === 'regular'
      }).length
      weekData[w] += badCount || (r.status === 'PENDING' ? 1 : 0)
    }
  })

  chartFailures = new Chart(canvasFailures.value, {
    type: 'bar',
    data: {
      labels: Array.from({ length: weeksInMonth }, (_, i) => `Semana ${i + 1}`),
      datasets: [{ label: 'Fallos', data: weekData, backgroundColor: '#215179', borderRadius: 5 }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f3f4f6' } },
        x: { grid: { display: false } },
      },
    },
  })
}

const buildDestinationsChart = () => {
  if (!canvasDestinations.value) return
  if (chartDestinations) chartDestinations.destroy()

  const counts = {}
  allTrips.value.forEach(t => {
    // destination is an object { id, name } from the backend
    const dest = t.destination?.name || t.destination || 'Sin destino'
    counts[dest] = (counts[dest] || 0) + 1
  })
  const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 7)
  if (!sorted.length) sorted.push(['Sin datos', 1])

  chartDestinations = new Chart(canvasDestinations.value, {
    type: 'doughnut',
    data: {
      labels: sorted.map(([n]) => n),
      datasets: [{
        data: sorted.map(([, c]) => c),
        backgroundColor: ['#215179','#3b8e53','#E85D26','#7EA0C4','#A61919','#6B7280','#D97706'],
        borderWidth: 2, borderColor: '#fff',
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 }, padding: 8 } } },
      cutout: '55%',
    },
  })
}

const buildInactivityChart = () => {
  if (!canvasInactivity.value || !trucks.value.length) return
  if (chartInactivity) chartInactivity.destroy()

  const display = trucks.value.slice(0, 6)
  const outIds = new Set(outOfServiceAlerts.value.map(a => a.truckId ?? a.truck?.id))

  const inService = display.map(truck => {
    let mins = 0
    allTrips.value.forEach(t => {
      if ((t.licensePlate === truck.plate || t.truck?.plate === truck.plate) &&
          t.startTime && t.endTime && t.startTime !== '--:--' && t.endTime !== '--:--') {
        const [sh, sm] = t.startTime.split(':').map(Number)
        const [eh, em] = t.endTime.split(':').map(Number)
        const d = (eh * 60 + em) - (sh * 60 + sm)
        if (d > 0) mins += d
      }
    })
    return parseFloat((mins / 60).toFixed(1))
  })

  const outOfService = display.map(truck => outIds.has(truck.id) ? 4 : 0)
  const available = display.map((_, i) => parseFloat(Math.max(0, 8 - inService[i] - outOfService[i]).toFixed(1)))

  chartInactivity = new Chart(canvasInactivity.value, {
    type: 'bar',
    data: {
      labels: display.map(t => t.plate),
      datasets: [
        { label: 'En servicio',       data: inService,    backgroundColor: '#215179', borderRadius: 3 },
        { label: 'Disponible sin uso', data: available,   backgroundColor: '#7EA0C4', borderRadius: 3 },
        { label: 'Fuera de servicio', data: outOfService, backgroundColor: '#A61919', borderRadius: 3 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 }, padding: 8 } } },
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: { stacked: true, beginAtZero: true, ticks: { callback: v => v + 'h' }, grid: { color: '#f3f4f6' } },
      },
    },
  })
}

const buildDriverWorkChart = () => {
  if (!canvasDriverWork.value) return
  if (chartDriverWork) chartDriverWork.destroy()

  const trips = driverMonthTrips.value
  if (!trips.length) {
    chartDriverWork = new Chart(canvasDriverWork.value, {
      type: 'line',
      data: { labels: ['Sin datos'], datasets: [{ data: [0], borderColor: '#d1d5db', label: '' }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
    })
    return
  }

  // Group by day
  const byDay = {}
  trips.forEach(t => {
    const day = t.dateIso || (t.date ? t.date.split('/').reverse().join('-') : '')
    if (!day) return
    if (!byDay[day]) byDay[day] = { worked: 0, completed: 0, running: 0 }
    byDay[day].completed++
    if (t.startTime && t.endTime && t.startTime !== '--:--' && t.endTime !== '--:--') {
      const [sh, sm] = t.startTime.split(':').map(Number)
      const [eh, em] = t.endTime.split(':').map(Number)
      const h = ((eh * 60 + em) - (sh * 60 + sm)) / 60
      if (h > 0) byDay[day].worked += h
    }
  })

  const days = Object.keys(byDay).sort().slice(-10)
  const labels = days.map(d => { const [,, day] = d.split('-'); return day })
  const worked = days.map(d => parseFloat(byDay[d].worked.toFixed(1)))
  const rest = days.map(d => parseFloat(Math.max(0, 8 - byDay[d].worked).toFixed(1)))
  const completed = days.map(d => byDay[d].completed)

  chartDriverWork = new Chart(canvasDriverWork.value, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Horas trabajadas',  data: worked,    borderColor: '#215179', backgroundColor: 'rgba(33,81,121,0.08)', tension: 0.4, pointRadius: 3, fill: true },
        { label: 'Tiempo de descanso', data: rest,     borderColor: '#7EA0C4', tension: 0.4, pointRadius: 3 },
        { label: 'Viajes completados', data: completed, borderColor: '#3b8e53', tension: 0.4, pointRadius: 3 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 }, padding: 8 } } },
      scales: {
        y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
        x: { grid: { display: false } },
      },
    },
  })
}

// ── Load data ──────────────────────────────────────────────────────────────
const loadData = async () => {
  isLoading.value = true
  try {
    const [trucksRes, maintenanceRes, tripsRes, alertsRes, driversRes] = await Promise.allSettled([
      api.get('/trucks'),
      api.get('/daily-maintenance-records/admin'),
      api.get('/trip-history/admin', { params: { pageSize: 100, page: 1 } }),
      api.get('/trucks/out-of-service-alerts'),
      api.get('/users/by-roles', { params: { roles: 'DRIVER' } }),
    ])

    trucks.value = trucksRes.status === 'fulfilled'
      ? (Array.isArray(trucksRes.value.data) ? trucksRes.value.data : []) : []

    const mData = maintenanceRes.status === 'fulfilled' ? maintenanceRes.value.data : []
    maintenanceRecords.value = Array.isArray(mData) ? mData : (mData?.items || [])

    // Trip history returns paginated: { items, total, page, totalPages }
    const tRaw = tripsRes.status === 'fulfilled' ? tripsRes.value.data : {}
    allTrips.value = Array.isArray(tRaw) ? tRaw : (tRaw?.items || [])

    outOfServiceAlerts.value = alertsRes.status === 'fulfilled'
      ? (Array.isArray(alertsRes.value.data) ? alertsRes.value.data : []) : []

    dbDrivers.value = driversRes.status === 'fulfilled'
      ? (Array.isArray(driversRes.value.data) ? driversRes.value.data : []) : []
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await loadData()
  await nextTick()
  buildFailuresChart()
  buildDestinationsChart()
  buildInactivityChart()
  buildDriverWorkChart()
})

onBeforeUnmount(() => {
  chartFailures?.destroy()
  chartDestinations?.destroy()
  chartInactivity?.destroy()
  chartDriverWork?.destroy()
})
</script>

<template>
  <div class="h-screen min-h-0 overflow-hidden bg-gray-100 flex flex-col">
    <!-- Header -->
    <header class="shrink-0 bg-white shadow-sm border-b border-gray-200 px-4 py-4 flex items-center justify-between z-40">
      <router-link to="/"><img :src="logoCompleto" alt="Logo" class="h-16 w-auto object-contain" /></router-link>
      <UserMenu />
    </header>

    <div class="flex flex-1 min-h-0 overflow-hidden">
      <DashboardSidebar />

      <main class="flex-1 min-h-0 overflow-y-auto pt-4 pb-10 pl-4 pr-4 sm:pr-6 lg:pr-8 flex flex-col min-w-0">
        <div class="bg-white rounded-[2rem] border-2 border-slate-300 shadow-sm flex flex-1 flex-col overflow-hidden w-full min-w-0 min-h-0">
          <div class="px-4 sm:px-6 lg:px-8 pt-6 pb-1">
            <button @click="router.back()" class="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary transition-colors py-1">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Volver
            </button>
          </div>
          <div class="px-4 sm:px-6 lg:px-8 pt-4 lg:pt-6 pb-6">
            <h1 class="text-2xl sm:text-3xl font-titles font-bold text-slate-800 text-center">Estadísticas</h1>
          </div>

          <!-- Loading -->
          <div v-if="isLoading" class="flex flex-1 items-center justify-center py-20 text-slate-400 min-h-[18rem]">
            <svg class="animate-spin w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
            Cargando estadísticas...
          </div>

          <div v-else class="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-8">

          <!-- ── KPI Row ─────────────────────────────────────────────────── -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

            <!-- KPI 1: Disponibilidad de flota -->
            <div :class="['rounded-2xl border-2 p-4 flex flex-col gap-3', kpiClasses[kpiVariant(fleetAvailability)].card]">
              <p class="text-xs font-titles font-bold text-slate-600 leading-tight">Disponibilidad de flota</p>
              <div class="flex items-center gap-3">
                <!-- Icon -->
                <div :class="['w-11 h-11 rounded-xl flex items-center justify-center shrink-0', kpiClasses[kpiVariant(fleetAvailability)].icon]">
                  <!-- Check -->
                  <svg v-if="kpiVariant(fleetAvailability) === 'green'" class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                  <!-- Warning -->
                  <svg v-else-if="kpiVariant(fleetAvailability) === 'amber'" class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                  <!-- X -->
                  <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </div>
                <span :class="['text-4xl font-titles font-extrabold leading-none', kpiClasses[kpiVariant(fleetAvailability)].num]">
                  {{ fleetAvailability }}%
                </span>
              </div>
            </div>

            <!-- KPI 2: Próximos vencimientos -->
            <div class="rounded-2xl border-2 border-blue-200 bg-blue-50 p-4 flex flex-col gap-3">
              <p class="text-xs font-titles font-bold text-slate-600 leading-tight">Próximos vencimientos</p>
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 text-blue-600">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                </div>
                <div>
                  <span class="text-4xl font-titles font-extrabold text-blue-700 leading-none">{{ upcomingExpiries }}</span>
                  <p class="text-[11px] text-blue-600 font-semibold mt-0.5 leading-tight">Documentación<br>por vencer</p>
                </div>
              </div>
            </div>

            <!-- KPI 3: Alertas de seguridad -->
            <div class="rounded-2xl border-2 border-red-200 bg-red-50 p-4 flex flex-col gap-3">
              <p class="text-xs font-titles font-bold text-slate-600 leading-tight">Alertas de seguridad</p>
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center shrink-0 text-red-600">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </div>
                <div>
                  <span class="text-4xl font-titles font-extrabold text-red-700 leading-none">{{ safetyAlerts }}</span>
                  <p class="text-[11px] text-red-600 font-semibold mt-0.5 leading-tight">Fallos<br>críticos</p>
                </div>
              </div>
            </div>

            <!-- KPI 4: Check list semanal -->
            <div :class="['rounded-2xl border-2 p-4 flex flex-col gap-3', kpiClasses[kpiVariant(weeklyChecklistPct)].card]">
              <p class="text-xs font-titles font-bold text-slate-600 leading-tight">Check list semanal</p>
              <div class="flex items-center gap-3">
                <div :class="['w-11 h-11 rounded-xl flex items-center justify-center shrink-0', kpiClasses[kpiVariant(weeklyChecklistPct)].icon]">
                  <svg v-if="kpiVariant(weeklyChecklistPct) === 'green'" class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                  <svg v-else-if="kpiVariant(weeklyChecklistPct) === 'amber'" class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                  <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </div>
                <div>
                  <span :class="['text-4xl font-titles font-extrabold leading-none', kpiClasses[kpiVariant(weeklyChecklistPct)].num]">
                    {{ weeklyChecklistPct }}%
                  </span>
                  <p :class="['text-[11px] font-semibold mt-0.5', kpiClasses[kpiVariant(weeklyChecklistPct)].num]">Del mes</p>
                </div>
              </div>
            </div>

          </div>

          <!-- ── Charts Row ──────────────────────────────────────────────── -->
          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">

            <!-- Análisis de fallos -->
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col">
              <p class="text-xs font-titles font-bold text-slate-700 mb-3">Análisis de fallos</p>
              <div class="flex-1 min-h-[160px]">
                <canvas ref="canvasFailures"></canvas>
              </div>
            </div>

            <!-- Viajes por destino -->
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col">
              <p class="text-xs font-titles font-bold text-slate-700 mb-3">Viajes por destino</p>
              <div class="flex-1 min-h-[160px]">
                <canvas ref="canvasDestinations"></canvas>
              </div>
            </div>

            <!-- Tiempo de inactividad -->
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col">
              <p class="text-xs font-titles font-bold text-slate-700 mb-1">Tiempo de inactividad</p>
              <p class="text-[10px] text-slate-400 mb-2">Horas por vehículo</p>
              <div class="flex-1 min-h-[160px]">
                <canvas ref="canvasInactivity"></canvas>
              </div>
            </div>

            <!-- Trabajo conductor -->
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col">
              <p class="text-xs font-titles font-bold text-slate-700 mb-2">Trabajo conductor</p>

              <!-- Driver selector button -->
              <button
                @click="driverModalOpen = true; driverModalSearch = ''"
                class="w-full mb-3 text-left text-[11px] border border-gray-300 rounded-lg px-3 py-2 bg-white hover:border-primary transition-colors truncate"
              >
                <span :class="selectedDriver ? 'text-slate-800' : 'text-gray-400'">
                  {{ selectedDriver ? (selectedDriver.name || selectedDriver.email) : 'Seleccionar conductor...' }}
                </span>
              </button>

              <div class="flex-1 min-h-[130px]">
                <canvas ref="canvasDriverWork"></canvas>
              </div>
            </div>

          </div>

          <!-- ── Ranking mensual de conductores ─────────────────────────── -->
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="px-5 py-4 border-b border-slate-100">
              <h2 class="text-sm font-titles font-bold text-slate-800">Ranking mensual de conductores</h2>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm min-w-[600px]">
                <thead>
                  <tr class="bg-slate-50 border-b border-slate-200">
                    <th class="py-3 px-4 text-left text-xs font-bold text-slate-600 border-r border-slate-200">Conductor</th>
                    <th class="py-3 px-4 text-center text-xs font-bold text-slate-600 border-r border-slate-200">Viajes totales</th>
                    <th class="py-3 px-4 text-center text-xs font-bold text-slate-600 border-r border-slate-200">Horas diarias (P)</th>
                    <th class="py-3 px-4 text-center text-xs font-bold text-slate-600 border-r border-slate-200">Horas semanales</th>
                    <th class="py-3 px-4 text-center text-xs font-bold text-slate-600">Tiempos de descanso</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!driverRanking.length">
                    <td colspan="5" class="py-12 text-center text-slate-400 text-xs">No hay datos del mes actual.</td>
                  </tr>
                  <tr
                    v-else
                    v-for="(row, idx) in driverRanking"
                    :key="idx"
                    class="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td class="py-3 px-4 text-slate-700 font-medium text-xs border-r border-slate-100">
                      <div class="flex items-center gap-2">
                        <span class="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[9px] font-bold shrink-0">{{ idx + 1 }}</span>
                        {{ row.name }}
                      </div>
                    </td>
                    <td class="py-3 px-4 text-center text-slate-600 font-semibold text-xs border-r border-slate-100">{{ row.totalTrips }}</td>
                    <td class="py-3 px-4 text-center text-slate-600 text-xs border-r border-slate-100">{{ row.dailyHours }}</td>
                    <td class="py-3 px-4 text-center text-slate-600 text-xs border-r border-slate-100">{{ row.weeklyHours }}</td>
                    <td class="py-3 px-4 text-center text-slate-600 text-xs">{{ row.restTime }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          </div>
        </div>
      </main>
    </div>
  </div>

  <!-- ── Modal selección de conductor ───────────────────────────────────── -->
  <Teleport to="body">
    <div v-if="driverModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-gray-200">
        <div class="p-4 border-b border-gray-100">
          <h3 class="text-sm font-titles font-bold text-slate-800 mb-3">Seleccionar conductor</h3>
          <input
            v-model="driverModalSearch"
            type="text"
            placeholder="Buscar por nombre..."
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-[11px] outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <ul class="max-h-64 overflow-y-auto divide-y divide-gray-50">
          <li>
            <button
              @click="selectedDriver = null; driverModalOpen = false; buildDriverWorkChart()"
              class="w-full text-left px-4 py-2.5 text-[11px] text-slate-500 hover:bg-gray-50 transition-colors"
            >Todos los conductores</button>
          </li>
          <li v-for="d in modalFilteredDrivers" :key="d.id">
            <button
              @click="selectDriver(d); driverModalOpen = false"
              class="w-full text-left px-4 py-2.5 text-[11px] hover:bg-gray-50 transition-colors"
              :class="selectedDriver?.id === d.id ? 'font-bold text-primary' : 'text-slate-700'"
            >{{ d.name || d.email }}</button>
          </li>
          <li v-if="modalFilteredDrivers.length === 0" class="px-4 py-3 text-[11px] text-slate-400 text-center">
            Sin resultados
          </li>
        </ul>
        <div class="p-3 border-t border-gray-100">
          <button
            @click="driverModalOpen = false"
            class="w-full py-2 text-xs font-titles text-slate-600 rounded-lg hover:bg-gray-50 transition-colors"
          >Cancelar</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
