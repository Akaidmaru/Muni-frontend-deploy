<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import logoCompleto from '@/assets/images/Logo-completo.png'
import DashboardSidebar from '@/components/DashboardSidebar.vue'
import UserMenu from '@/components/UserMenu.vue'
import api from '@/services/axios'

const router = useRouter()

const filterPatente = ref('')
const filterFecha = ref('')
const searchQuery = ref('')

const itemsPerPage = ref(100)
const currentPage = ref(1)

const isExportingPdf = ref(false)
const exportPdfError = ref('')

const minorIncidents = ref(0)
const topCategories = ref('Sin incidencias registradas')
const isLoading = ref(false)
const isLoadingKpis = ref(false)
const loadError = ref('')
const allRecords = ref([])
const outOfServiceCount = computed(() => 0)
const openAlertsModal = () => {
  console.info('[AdminMaintenanceWeeklyHistory] openAlertsModal called')
}

const normalizeValue = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const isRegularState = (value) => normalizeValue(value) === 'regular'
const isBadState = (value) => normalizeValue(value) === 'malo'
const isGoodState = (value) => {
  const normalized = normalizeValue(value)
  return normalized === 'bueno' || normalized === 'vigente' || normalized === 'aprobado'
}

const getDocumentStatusByExpiry = (expiryDate) => {
  if (!expiryDate) return 'No tiene'

  const date = new Date(expiryDate)
  if (Number.isNaN(date.getTime())) return 'No tiene'

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const expiry = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  return expiry >= today ? 'Vigente' : 'Vencido'
}

const formatDate = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '00-00-0000'

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

const formatMonthKey = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

const formatMonthLabel = (monthKey) => {
  if (!monthKey) return ''
  const [year, month] = monthKey.split('-').map(Number)
  const date = new Date(year, (month || 1) - 1, 1)
  const formatted = date.toLocaleDateString('es-CL', {
    month: 'long',
    year: 'numeric',
  })
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

const pluralize = (count, singular, plural) =>
  `${count} ${count === 1 ? singular : plural}`

const buildFaultSummary = (maintenanceItems = []) => {
  let badCount = 0
  let regularCount = 0

  maintenanceItems.forEach((item) => {
    if (isBadState(item?.status)) badCount += 1
    else if (isRegularState(item?.status)) regularCount += 1
  })

  const lines = []
  if (badCount > 0) lines.push(pluralize(badCount, 'Item Malo', 'Items Malos'))
  if (regularCount > 0) lines.push(pluralize(regularCount, 'Regular', 'Regulares'))

  return lines.join('\n') || 'Sin fallos'
}

const deriveStatus = (record) => {
  const hasProblematicChecklist = (record?.monthlyMaintenanceItems || record?.dailyMaintenanceItems || record?.maintenanceItems || []).some(
    (item) => isBadState(item?.status) || isRegularState(item?.status),
  )

  const hasProblematicDocs = [
    getDocumentStatusByExpiry(record?.truck?.technicalReviewExpiresAt),
    getDocumentStatusByExpiry(record?.truck?.circulationPermitExpiresAt),
    getDocumentStatusByExpiry(record?.truck?.insuranceExpiresAt),
    getDocumentStatusByExpiry(record?.truck?.emissionsExpiresAt),
  ].some((status) => !isGoodState(status))

  return hasProblematicChecklist || hasProblematicDocs ? 'Pendiente' : 'Revisado'
}

const statusClass = (status) =>
  status === 'Revisado' ? 'bg-[#1b2e4b] text-white' : 'bg-[#E85D26] text-white'

const categoryLabelMap = {
  systemLights: 'Luces',
  systemBrakes: 'Frenos',
  systemTires: 'NeumÃ¡ticos',
  systemEngine: 'Motor',
  systemAccessories: 'Accesorios',
}

const mapCategoryLabel = (category) =>
  categoryLabelMap[category] || category || 'Sin categorÃ­a'

const mapRecordFromApi = (record) => ({
  id: record.id,
  date: `01-${record.monthKey?.split('-')?.[1] || '00'}-${record.monthKey?.split('-')?.[0] || '0000'}`,
  monthKey: record.monthKey || formatMonthKey(record.inspectionDate),
  plate: record.truck?.plate || 'Sin patente',
  driver: record.truck?.brand || record.truck?.model || 'CamiÃ³n mensual',
  faultSummary: buildFaultSummary(record.monthlyMaintenanceItems || record.dailyMaintenanceItems || record.maintenanceItems || []),
  status: deriveStatus(record),
  maintenanceItems: record.monthlyMaintenanceItems || record.dailyMaintenanceItems || record.maintenanceItems || [],
  truck: record.truck || null,
  truckId: record.truck?.id ?? record.truckId ?? null,
  hasActions: true,
})

const filteredRecords = computed(() => {
  const normalizedSearch = normalizeValue(searchQuery.value)

  return allRecords.value.filter((record) => {
    const matchesPlate = !filterPatente.value || record.plate === filterPatente.value
    const matchesDate = !filterFecha.value || record.monthKey === filterFecha.value
    const matchesSearch =
      !normalizedSearch ||
      normalizeValue(record.driver).includes(normalizedSearch) ||
      normalizeValue(record.plate).includes(normalizedSearch) ||
      normalizeValue(record.faultSummary).includes(normalizedSearch)

    return matchesPlate && matchesDate && matchesSearch
  })
})

const totalItems = computed(() => filteredRecords.value.length)

const records = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredRecords.value.slice(start, end)
})

const plateOptions = computed(() =>
  [...new Set(allRecords.value.map((record) => record.plate).filter(Boolean))].sort(),
)

const monthOptions = computed(() =>
  [...new Set(allRecords.value.map((record) => record.monthKey).filter(Boolean))]
    .sort((a, b) => b.localeCompare(a))
    .map((value) => ({ value, label: formatMonthLabel(value) })),
)

const statusOptions = ['Revisado', 'Pendiente']

const updateStats = () => {
  const problematicItems = []

  allRecords.value.forEach((record) => {
    ;(record.maintenanceItems || []).forEach((item) => {
      if (isBadState(item?.status) || isRegularState(item?.status)) {
        problematicItems.push(item)
      }
    })
  })

  minorIncidents.value = problematicItems.length

  if (problematicItems.length === 0) {
    topCategories.value = 'Sin incidencias registradas'
    return
  }

  const counts = new Map()
  problematicItems.forEach((item) => {
    const label = mapCategoryLabel(item?.category)
    counts.set(label, (counts.get(label) || 0) + 1)
  })

  topCategories.value = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([label, count]) => `${label} (${count})`)
    .join('\n')
}

const normalizeBackendMessage = (message) =>
  String(Array.isArray(message) ? message.join(', ') : message || '').toLowerCase()

const isIncompatibleEndpointError = (error) => {
  const status = error?.response?.status
  const backendMessage = normalizeBackendMessage(error?.response?.data?.message)
  return status === 400 && backendMessage.includes('numeric string is expected')
}

const loadRecords = async () => {
  isLoading.value = true
  loadError.value = ''

  try {
    const endpoints = [
      '/monthly-maintenance-records/admin',
      '/daily-maintenance-records/admin',
      '/vehicle-maintenance-records',
      '/vehicle-maintenance-records/admin',
      '/vehicle-maintenance-records/admin/history',
    ]

    let responseData = null
    let lastError = null

    for (const endpoint of endpoints) {
      try {
        const { data } = await api.get(endpoint)
        responseData = data
        break
      } catch (error) {
        lastError = error
        if (error.response?.status !== 404 && !isIncompatibleEndpointError(error)) {
          throw error
        }
      }
    }

    if (!responseData && lastError) {
      throw Object.assign(new Error('No compatible endpoint found'), {
        response: { status: 404, data: { message: 'No compatible endpoint found' } },
      })
    }

    allRecords.value = Array.isArray(responseData) ? responseData.map(mapRecordFromApi) : []
    updateStats()
  } catch (error) {
    const backendMessage = error.response?.data?.message
    if (error.response?.status === 401) {
      loadError.value = 'Tu sesión no está autorizada en este momento. Cierra sesión y vuelve a ingresar para cargar el historial mensual.'
    } else if (error.response?.status === 403) {
      loadError.value = 'No tienes permisos para ver este historial.'
    } else if (error.response?.status === 404 || isIncompatibleEndpointError(error)) {
      loadError.value = 'El backend en ejecución aún no expone un endpoint compatible para historial mensual.'
    } else {
      loadError.value = Array.isArray(backendMessage)
        ? backendMessage.join(', ')
        : backendMessage || 'No se pudo cargar el historial mensual.'
    }
    allRecords.value = []
    updateStats()
  } finally {
    isLoading.value = false
  }
}
const editRecord = (record) => {
  if (!record.truckId || !record.monthKey) return
  router.push({
    name: 'admin-maintenance-monthly',
    query: {
      truckId: String(record.truckId),
      month: record.monthKey,
      source: 'admin-maintenance-monthly-history',
    },
  })
}

const viewModal = ref({ open: false, record: null })
const closeViewModal = () => { viewModal.value = { open: false, record: null } }

const viewRecord = (record) => {
  if (!record || !record.maintenanceItems) return

  const groupedItems = [...groupItemsByCategory(record.maintenanceItems)].map(
    ([section, items]) => {
      // Collect unique item names preserving insertion order
      const itemNames = [...new Set(items.map((i) => i.itemName || i.itemCode || 'Ítem'))]
      // Collect unique week indices (1-5), sorted numerically
      const weekIndices = [...new Set(
        items.map((i) => i.weekIndex ?? i.week ?? null).filter((w) => w !== null)
      )].sort((a, b) => Number(a) - Number(b))
      const hasWeeks = weekIndices.length > 0

      // Build a pivot: pivot[itemName][weekIndex] = status string
      // The backend stores checkbox answers as status: 'Si' | '' and state as 'Bueno' | 'Regular' | 'Malo'
      const pivot = {}
      items.forEach((item) => {
        const name = item.itemName || item.itemCode || 'Ítem'
        const week = Number(item.weekIndex ?? item.week ?? 1)
        if (!pivot[name]) pivot[name] = {}
        pivot[name][week] = item.status || ''
      })

      return {
        section,
        itemNames,
        weekIndices: hasWeeks ? weekIndices : [1],
        pivot,
        hasWeeks,
        // legacy flat rows kept for fallback
        rows: items.map((item) => ({
          label: item.itemName || item.itemCode || 'Ítem',
          status: item.status || '—',
          note: item.notes || '—',
        })),
      }
    },
  )

  viewModal.value = {
    open: true,
    record: {
      ...record,
      monthLabel: formatMonthLabel(record.monthKey),
      items: groupedItems,
      annex: {
        revisionTecnica: getDocumentStatusByExpiry(record.truck?.technicalReviewExpiresAt),
        permisoCirculacion: getDocumentStatusByExpiry(record.truck?.circulationPermitExpiresAt),
        seguroObligatorio: getDocumentStatusByExpiry(record.truck?.insuranceExpiresAt),
        emisionContaminantes: getDocumentStatusByExpiry(record.truck?.emissionsExpiresAt),
      },
    },
  }
}

const groupItemsByCategory = (items = []) => {
  const groups = new Map()
  items.forEach((item) => {
    const title = mapCategoryLabel(item.category)
    if (!groups.has(title)) groups.set(title, [])
    groups.get(title).push(item)
  })
  return groups
}

const buildMonthlyChecklistPdfBlob = async (record) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()

  try { doc.addImage(logoCompleto, 'PNG', 14, 8, 28, 13) } catch (_) {}

  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(33, 33, 33)
  doc.text('Registro de Mantención Mensual Vehicular', 50, 16)

  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120, 120, 120)
  const now = new Date().toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  doc.text(`Generado: ${now}`, pageWidth - 14, 10, { align: 'right' })

  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.4)
  doc.line(14, 25, pageWidth - 14, 25)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(20, 20, 20)
  doc.text('DATOS DEL REGISTRO', 14, 32)

  const labelX1 = 14
  const valX1 = 52
  const labelX2 = 105
  const valX2 = 143

  const headerRows = [
    { y: 40, l1: 'Mes:', v1: formatMonthLabel(record.monthKey), l2: 'Patente:', v2: record.plate || '—' },
    { y: 47, l1: 'Marca:', v1: record.driver || '—', l2: 'Estado:', v2: record.status || '—' },
  ]

  headerRows.forEach(({ y, l1, v1, l2, v2 }) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(60, 60, 60)
    doc.text(l1, labelX1, y)
    doc.text(l2, labelX2, y)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(20, 20, 20)
    doc.text(v1, valX1, y)
    doc.text(v2, valX2, y)
  })

  // Helper: convert a status string into styled cell content for PDF
  const renderStatusCell = (status) => {
    if (!status) return { content: '\u2014', styles: { textColor: [180, 180, 180], halign: 'center' } }
    if (status === 'Si') return { content: '\u2713', styles: { textColor: [22, 163, 74], fontStyle: 'bold', halign: 'center', fontSize: 11 } }
    if (status === 'Bueno') return { content: 'Bueno', styles: { textColor: [22, 163, 74], fontStyle: 'bold', halign: 'center' } }
    if (status === 'Regular') return { content: 'Regular', styles: { textColor: [217, 119, 6], fontStyle: 'bold', halign: 'center' } }
    if (status === 'Malo') return { content: 'Malo', styles: { textColor: [220, 38, 38], fontStyle: 'bold', halign: 'center' } }
    return { content: status, styles: { textColor: [100, 100, 100], halign: 'center' } }
  }

  const tableBody = []

  for (const [section, items] of groupItemsByCategory(record.maintenanceItems)) {
    // Unique item names and sorted week indices for this section
    const itemNames = [...new Set(items.map((i) => i.itemName || i.itemCode || 'Item'))]
    const weekIndices = [...new Set(
      items.map((i) => i.weekIndex ?? i.week ?? null).filter((w) => w !== null)
    )].sort((a, b) => Number(a) - Number(b))

    const hasWeeks = weekIndices.length > 0
    const colCount = hasWeeks ? weekIndices.length + 1 : 2

    // Section header spanning all columns
    tableBody.push([{
      content: section,
      colSpan: colCount,
      styles: { fillColor: [27, 46, 75], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, cellPadding: { top: 3, bottom: 3, left: 4, right: 4 } },
    }])

    // Sub-header row: Descripcion + one "Sab/Dom" per week
    if (hasWeeks) {
      tableBody.push([
        { content: 'Descripci\u00f3n', styles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: 'bold', halign: 'left' } },
        ...weekIndices.map(() => ({
          content: 'Sab/Dom',
          styles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: 'bold', halign: 'center' },
        })),
      ])
    }

    // Build pivot: pivot[itemName][weekIndex] = status string
    const pivot = {}
    items.forEach((item) => {
      const name = item.itemName || item.itemCode || 'Item'
      const week = Number(item.weekIndex ?? item.week ?? 1)
      if (!pivot[name]) pivot[name] = {}
      pivot[name][week] = item.status || ''
    })

    // One data row per unique item name
    itemNames.forEach((name) => {
      if (hasWeeks) {
        tableBody.push([
          { content: name, styles: { halign: 'left', textColor: [51, 65, 85] } },
          ...weekIndices.map((week) => renderStatusCell(pivot[name]?.[week] || '')),
        ])
      } else {
        const anyItem = items.find((i) => (i.itemName || i.itemCode) === name)
        tableBody.push([
          { content: name, styles: { halign: 'left', textColor: [51, 65, 85] } },
          renderStatusCell(anyItem?.status || ''),
        ])
      }
    })
  }

  autoTable(doc, {
    startY: 54,
    head: [],
    body: tableBody,
    styles: { fontSize: 7, cellPadding: 2.5, lineColor: [209, 209, 209], lineWidth: 0.3, textColor: [33, 33, 33] },
    alternateRowStyles: { fillColor: [247, 248, 250] },
    columnStyles: { 0: { cellWidth: 70 } },
    tableWidth: 'auto',
  })

  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i += 1) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 6, { align: 'center' })
  }

  return doc.output('blob')
}

const exportRecordPdf = async (record) => {
  if (isExportingPdf.value) return
  isExportingPdf.value = true
  exportPdfError.value = ''

  try {
    const blob = await buildMonthlyChecklistPdfBlob(record)
    const safePlate = (record.plate || 'sin_patente').replace(/[^a-zA-Z0-9]/g, '_')
    const safeMonth = (record.monthKey || '').replace(/[^a-zA-Z0-9]/g, '_')
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `checklist_mensual_${safePlate}_${safeMonth}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch (err) {
    exportPdfError.value = 'Error al generar el PDF. Intente nuevamente.'
    console.error('[AdminMaintenanceMonthlyHistory] Error al exportar PDF:', err)
  } finally {
    isExportingPdf.value = false
  }
}

watch([filterPatente, filterFecha, searchQuery], () => {
  currentPage.value = 1
})

onMounted(() => {
  loadRecords()
})
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col">
    <div class="bg-white shadow-sm border-b border-gray-200">
      <div class="px-4 py-4 flex items-center justify-between">
        <router-link to="/" class="flex items-center">
          <img :src="logoCompleto" alt="Transportes Flores Vargas" class="h-16 w-auto object-contain hover:opacity-80 transition-opacity" />
        </router-link>
        <UserMenu />
      </div>
    </div>

    <div class="flex flex-1 overflow-hidden min-w-0">
      <DashboardSidebar />

      <main class="flex-1 pt-4 pb-10 px-6 overflow-hidden flex flex-col items-center min-w-0">
        <div class="w-full max-w-7xl mb-3 pl-10 sm:pl-12 shrink-0">
          <button @click="router.back()" class="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary transition-colors">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Volver
          </button>
        </div>
        <div class="bg-white rounded-3xl border-2 border-slate-300 shadow-sm flex-1 flex flex-col overflow-hidden w-full max-w-7xl">
            <div class="px-10 pt-10 pb-6 flex flex-col md:flex-row items-start justify-between gap-6">
    <h1 class="text-3xl font-titles font-extrabold text-slate-900 leading-tight">
      Historial de mantenimiento<br />vehicular mensual
    </h1>

    <!-- KPIs -->
    <div class="flex flex-col sm:flex-row gap-4 shrink-0">
      <!-- Vehículos fuera de servicio -->
      <div class="rounded-2xl border-2 px-5 py-4 flex flex-col gap-3 min-w-[280px]"
          style="background-color:#FEF2F2; border-color:#FECACA; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <div class="flex items-start justify-between gap-4">
          <span class="text-sm font-titles font-bold text-slate-800 leading-tight">Vehículos fuera<br />de servicio</span>
          <span class="text-4xl font-titles font-extrabold text-slate-900 leading-none shrink-0">
            {{ isLoadingKpis ? '…' : outOfServiceCount }}
          </span>
        </div>
        <div class="flex items-center justify-between gap-2 mt-1">
          <svg class="w-5 h-5 shrink-0 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 18H5.5A1.5 1.5 0 014 16.5v-10A1.5 1.5 0 015.5 5H16a2 2 0 012 2v1m0 0h1.5a2 2 0 011.9 1.368L22 12.5V17a1 1 0 01-1 1h-1M18 8h-2M6 16.5a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0zm9 0a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0z"/>
          </svg>
          <button type="button" @click="openAlertsModal" class="text-sm text-blue-500 font-semibold hover:underline">
            Ver alertas
          </button>
        </div>
      </div>

      <!-- Incidencias menores -->
      <div class="rounded-[1.25rem] border border-[#FDBA74] px-6 py-4 flex flex-col gap-2 min-w-[280px]"
          style="background-color:#FFF7ED; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <div class="flex items-start justify-between gap-2">
          <span class="text-sm font-titles font-bold text-slate-800 leading-tight">Incidencias<br />menores:</span>
          <span class="text-4xl font-titles font-extrabold text-slate-900 leading-none shrink-0">
            {{ minorIncidents }}
          </span>
        </div>
        <div class="flex items-start gap-2 mt-2">
          <div class="shrink-0 pt-0.5">
            <svg class="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
          </div>
          <p class="text-[11px] text-slate-700 leading-snug whitespace-pre-line">
            Top categorías afectadas:<br />
            <span class="font-medium text-slate-800">{{ topCategories }}</span>
          </p>
        </div>
      </div>
    </div>
  </div>

          <div class="px-10 pb-6 flex flex-col lg:flex-row items-start lg:items-end gap-6 justify-between">
            <div class="flex items-start sm:items-end gap-3 flex-wrap">
              <div class="mb-2 text-sm text-slate-500 font-semibold mr-1">Filtrar por:</div>

              <!-- Filtro Patente -->
              <div class="w-full sm:w-auto">
                <label class="text-[11px] text-slate-400 font-semibold mb-1 block uppercase tracking-wider pl-1">Patente</label>
                <div class="relative">
                  <select v-model="filterPatente" class="appearance-none bg-white border border-slate-300 rounded-[0.5rem] px-4 py-2 pr-8 text-sm focus:outline-none focus:border-primary shadow-sm w-full sm:w-[150px] text-slate-600 font-medium">
                    <option value="">Todas</option>
                    <option v-for="plate in plateOptions" :key="plate" :value="plate">{{ plate }}</option>
                  </select>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>

              <!-- Filtro Fecha (mes/año con calendario) -->
              <div class="w-full sm:w-auto">
                <label class="text-[11px] text-slate-400 font-semibold mb-1 block uppercase tracking-wider pl-1">Fecha</label>
                <div class="relative">
                  <input
                    v-model="filterFecha"
                    type="month"
                    class="bg-white border border-slate-300 rounded-[0.5rem] px-4 py-2 text-sm focus:outline-none focus:border-primary shadow-sm w-full sm:w-[175px] text-slate-600 font-medium cursor-pointer"
                  />
                </div>
              </div>

              <!-- Buscar -->
              <div class="relative w-full sm:w-[220px]">
                <input v-model="searchQuery" type="text" placeholder="Buscar" class="w-full bg-white border border-slate-300 rounded-[0.5rem] px-4 py-2 pl-4 pr-10 text-sm focus:outline-none focus:border-primary shadow-sm text-slate-600 placeholder:text-slate-400 font-medium" />
                <svg class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <button @click="router.push('/admin/mantencion-vehicular/mensual')" class="bg-[#1b2e4b] text-white px-5 py-2.5 rounded-lg font-bold text-xs tracking-wider shadow-md hover:bg-opacity-90 transition-all flex items-center gap-2 uppercase shrink-0">
              <span>+</span> NUEVO CHECK LIST
            </button>
          </div>

          <div class="flex-1 min-h-0 overflow-x-auto overflow-y-auto px-10 pt-4">
            <p v-if="loadError" class="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {{ loadError }}
            </p>
            <table class="w-full text-sm border-collapse">
              <thead class="bg-white">
                <tr>
                  <th class="py-3 px-5 text-center font-bold text-slate-700 border border-gray-300 w-[12%]">Fecha</th>
                  <th class="py-3 px-5 text-center font-bold text-slate-700 border border-gray-300 w-[15%]">Patente</th>
                  <th class="py-3 px-5 text-center font-bold text-slate-700 border border-gray-300 w-[20%]">Conductor</th>
                  <th class="py-3 px-5 text-center font-bold text-slate-700 border border-gray-300 w-[20%]">Resumen de fallos</th>
                  <th class="py-3 px-5 text-center font-bold text-slate-700 border border-gray-300 w-[15%]">Estado</th>
                  <th class="py-3 px-5 text-center font-bold text-slate-700 border border-gray-300 w-[18%]">Registro</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="isLoading">
                  <td colspan="6" class="py-8 text-center text-slate-400 text-sm border border-gray-300">
                    Cargando registros...
                  </td>
                </tr>
                <tr v-else-if="records.length === 0">
                  <td colspan="6" class="py-8 text-center text-slate-400 text-sm border border-gray-300">
                    No hay registros disponibles.
                  </td>
                </tr>
                <tr v-else v-for="record in records" :key="record.id" class="hover:bg-slate-50 transition-colors">
                  <td class="py-5 px-5 text-center text-slate-600 font-medium text-xs border border-gray-300">{{ record.date }}</td>
                  <td class="py-5 px-5 text-center text-slate-600 font-medium text-xs border border-gray-300">{{ record.plate }}</td>
                  <td class="py-5 px-5 text-center text-slate-600 font-medium text-xs border border-gray-300">{{ record.driver }}</td>
                  <td class="py-5 px-5 text-center text-slate-600 font-medium text-xs border border-gray-300 whitespace-pre-line">{{ record.faultSummary }}</td>
                  <td class="py-5 px-5 text-center border border-gray-300">
                    <span v-if="record.status === 'Revisado'" class="inline-block px-5 py-1 rounded-full text-[11px] font-bold bg-[#1b2e4b] text-white tracking-wide">Revisado</span>
                    <span v-else-if="record.status === 'Pendiente'" class="inline-block px-5 py-1 rounded-full text-[11px] font-bold bg-[#D95F31] text-white tracking-wide">Pendiente</span>
                  </td>
                  <td class="py-5 px-5 text-center border border-gray-300">
                    <div v-if="record.hasActions" class="flex flex-wrap items-center justify-center gap-2">
                      <button type="button" @click="viewRecord(record)" class="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600 hover:text-primary transition-colors bg-slate-100 rounded-full px-4 py-1.5 border border-slate-200 shadow-sm">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                          <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                        Ver
                      </button>
                      <button type="button" @click="exportRecordPdf(record)" :disabled="isExportingPdf" class="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600 hover:text-primary transition-colors bg-slate-100 rounded-full px-4 py-1.5 border border-slate-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M6 2h9a2 2 0 012 2v16a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z"/>
                          <path stroke-linecap="round" stroke-linejoin="round" d="M13 2v6h6"/>
                        </svg>
                        Exportar PDF
                      </button>
                      <button type="button" @click="editRecord(record)" class="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600 hover:text-primary transition-colors bg-slate-100 rounded-full px-4 py-1.5 border border-slate-200 shadow-sm">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                        Editar
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="px-10 py-5 bg-white flex justify-between items-center text-xs font-semibold text-slate-500 mt-auto rounded-b-3xl">
            <div class="flex items-center gap-3">
              <span>Filas por páginas</span>
              <div class="relative">
                <select v-model.number="itemsPerPage"
                        class="appearance-none border border-slate-300 rounded px-2 py-1 pr-6 bg-white outline-none focus:border-primary cursor-pointer text-slate-700">
                  <option :value="100">100</option>
                </select>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
            <div class="flex items-center gap-6">
              <span>1-{{ itemsPerPage > totalItems ? totalItems : itemsPerPage }} de {{ totalItems }}</span>
              <div class="flex items-center gap-2">
                <button disabled class="hover:bg-slate-100 rounded p-0.5 text-slate-600 disabled:opacity-40 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <button disabled class="hover:bg-slate-100 rounded p-0.5 text-slate-600 disabled:opacity-40 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <Teleport to="body">
      <div v-if="viewModal.open" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div class="bg-white rounded-3xl shadow-xl w-full max-w-2xl border border-gray-200 overflow-hidden">
          <div class="bg-[#1b2e4b] px-6 py-5 flex items-center justify-between">
            <h3 class="text-white font-titles font-bold text-lg">Detalle del registro mensual</h3>
            <button @click="closeViewModal" class="text-white/70 hover:text-white transition-colors">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p class="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Mes</p>
                <p class="font-medium text-slate-900">{{ viewModal.record?.monthLabel || viewModal.record?.date || '—' }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Patente</p>
                <p class="font-medium text-slate-900">{{ viewModal.record?.plate || '—' }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Conductor</p>
                <p class="font-medium text-slate-900">{{ viewModal.record?.driver || '—' }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Estado</p>
                <span class="inline-block px-3 py-1 rounded-full text-xs font-bold" :class="statusClass(viewModal.record?.status)">
                  {{ viewModal.record?.status === 'Revisado' ? 'Revisado' : 'Pendiente' }}
                </span>
              </div>
            </div>

            <div>
              <p class="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Resumen de fallos</p>
              <p class="text-sm text-slate-700 whitespace-pre-line bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
                {{ viewModal.record?.faultSummary || 'Sin fallos registrados' }}
              </p>
            </div>

            <div v-if="viewModal.record?.items?.length" class="space-y-4">
              <p class="text-xs text-slate-400 font-semibold uppercase tracking-wide">Checklist de inspección</p>
              <div v-for="section in viewModal.record.items" :key="section.section">
                <p class="text-xs font-bold text-white bg-[#1b2e4b] rounded-lg px-3 py-1.5 mb-2">{{ section.section }}</p>

                <!-- Pivot table: rows = item names, cols = weeks -->
                <div class="overflow-x-auto">
                  <table v-if="section.hasWeeks" class="w-full text-xs" style="border-collapse:collapse;">
                    <thead class="bg-slate-100 text-slate-600">
                      <tr>
                        <th class="text-left px-3 py-2 border border-slate-200 font-semibold">Descripción</th>
                        <th
                          v-for="week in section.weekIndices"
                          :key="week"
                          class="text-center px-3 py-2 border border-slate-200 font-semibold min-w-[90px]"
                        >
                          Sab/Dom
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="itemName in section.itemNames" :key="itemName" class="hover:bg-slate-50">
                        <td class="px-3 py-2 border border-slate-200 text-slate-700 font-medium">{{ itemName }}</td>
                        <td
                          v-for="week in section.weekIndices"
                          :key="week"
                          class="px-2 py-2 border border-slate-200 text-center"
                        >
                          <!-- status === 'Si' → green check -->
                          <span
                            v-if="section.pivot[itemName]?.[week] === 'Si'"
                            class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500 text-white"
                          >
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                          </span>
                          <!-- status === 'Bueno' → green badge -->
                          <span
                            v-else-if="section.pivot[itemName]?.[week] === 'Bueno'"
                            class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700"
                          >Bueno</span>
                          <!-- status === 'Regular' → amber badge -->
                          <span
                            v-else-if="section.pivot[itemName]?.[week] === 'Regular'"
                            class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700"
                          >Regular</span>
                          <!-- status === 'Malo' → red badge -->
                          <span
                            v-else-if="section.pivot[itemName]?.[week] === 'Malo'"
                            class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700"
                          >Malo</span>
                          <!-- no data -->
                          <span v-else class="text-slate-300">—</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <!-- Fallback flat table (no weekIndex data) -->
                  <table v-else class="w-full text-xs" style="border-collapse:collapse;">
                    <thead class="text-slate-400 bg-slate-50">
                      <tr>
                        <th class="text-left px-2 py-1.5 border border-slate-200 w-[50%]">Ítem</th>
                        <th class="text-center px-2 py-1.5 border border-slate-200 w-[25%]">Estado</th>
                        <th class="text-left px-2 py-1.5 border border-slate-200">Observación</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="row in section.rows" :key="row.label" class="hover:bg-slate-50">
                        <td class="px-2 py-1.5 border border-slate-200 text-slate-700">{{ row.label }}</td>
                        <td class="px-2 py-1.5 border border-slate-200 text-center">
                          <span
                            v-if="row.status === 'Si'"
                            class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500 text-white"
                          >
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                          </span>
                          <span
                            v-else-if="row.status === 'Bueno'"
                            class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700"
                          >Bueno</span>
                          <span
                            v-else-if="row.status === 'Regular'"
                            class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700"
                          >Regular</span>
                          <span
                            v-else-if="row.status === 'Malo'"
                            class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700"
                          >Malo</span>
                          <span v-else class="text-slate-400">—</span>
                        </td>
                        <td class="px-2 py-1.5 border border-slate-200 text-slate-500 italic">{{ row.note || '—' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div v-if="viewModal.record?.annex" class="space-y-3">
              <p class="text-xs text-slate-400 font-semibold uppercase tracking-wide">Documentación</p>
              <div class="grid grid-cols-4 gap-2 text-xs text-center">
                <div class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  <p class="text-slate-400 mb-1">Rev. Técnica</p>
                  <span class="font-bold" :class="viewModal.record.annex.revisionTecnica === 'Vigente' ? 'text-green-600' : 'text-red-600'">
                    {{ viewModal.record.annex.revisionTecnica }}
                  </span>
                </div>
                <div class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  <p class="text-slate-400 mb-1">Permiso Circ.</p>
                  <span class="font-bold" :class="viewModal.record.annex.permisoCirculacion === 'Vigente' ? 'text-green-600' : 'text-red-600'">
                    {{ viewModal.record.annex.permisoCirculacion }}
                  </span>
                </div>
                <div class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  <p class="text-slate-400 mb-1">Seguro Oblig.</p>
                  <span class="font-bold" :class="viewModal.record.annex.seguroObligatorio === 'Vigente' ? 'text-green-600' : 'text-red-600'">
                    {{ viewModal.record.annex.seguroObligatorio }}
                  </span>
                </div>
                <div class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  <p class="text-slate-400 mb-1">Emisión Contam.</p>
                  <span class="font-bold" :class="viewModal.record.annex.emisionContaminantes === 'Vigente' ? 'text-green-600' : 'text-red-600'">
                    {{ viewModal.record.annex.emisionContaminantes }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="px-6 pb-6 flex justify-end">
            <button @click="closeViewModal" class="px-6 py-2 bg-[#215179] text-white text-sm rounded-xl font-bold hover:bg-blue-900 transition-all">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
main::-webkit-scrollbar { width: 6px; }
main::-webkit-scrollbar-track { background: transparent; }
main::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
</style>

