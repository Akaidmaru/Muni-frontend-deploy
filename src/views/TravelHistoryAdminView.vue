<script setup>
import { ref, computed, onMounted, onBeforeUnmount, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSidebarStore } from '@/stores/sidebar'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import ExcelJS from 'exceljs'
import logoCompleto from '@/assets/images/Logo-completo.png'
import DashboardSidebar from '@/components/DashboardSidebar.vue'
import TripHistoryTable from '@/components/TripHistoryTable.vue'
import TripRouteMap from '@/components/TripRouteMap.vue'
import UserMenu from '@/components/UserMenu.vue'
import api from '@/services/axios'

const router = useRouter()
const travels = ref([])
const isLoadingTravels = ref(false)
const travelsError = ref('')
const totalItems = ref(0)
const totalPages = ref(1)
const adminDrivers = ref([])
const adminEmployees = ref([])
const adminDestinations = ref([])
const adminTrucksByDriver = ref({})

const isFilterOpen = ref(false)
const sidebarStore = useSidebarStore()
watch(isFilterOpen, (v) => {
  sidebarStore.setMobileFiltersOverlayOpen(!!v)
}, { immediate: true })
onUnmounted(() => {
  sidebarStore.setMobileFiltersOverlayOpen(false)
})

const itemsPerPage = ref(100)
const currentPage = ref(1)

const filters = ref({
  from: '',
  to: '',
  searchBy: 'destination',
  searchValue: '',
  license: '',
})

const appliedFilters = ref({ ...filters.value })

const formatDate = (value) => {
  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) return ''

  const day = String(parsedDate.getUTCDate()).padStart(2, '0')
  const month = String(parsedDate.getUTCMonth() + 1).padStart(2, '0')
  const year = parsedDate.getUTCFullYear()
  return `${day}/${month}/${year}`
}

const formatDateIso = (value) => {
  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) return ''

  const year = parsedDate.getUTCFullYear()
  const month = String(parsedDate.getUTCMonth() + 1).padStart(2, '0')
  const day = String(parsedDate.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const mapTravelFromApi = (travel) => ({
  id: travel.id,
  truckId: travel.truck?.id ?? null,
  destinationId: travel.destination?.id ?? null,
  driverId: travel.driver?.id ?? null,
  employeeId: travel.employee?.id ?? null,
  status: travel.status || 'DRIVER_FILLING',
  date: formatDate(travel.date),
  dateIso: formatDateIso(travel.date),
  licensePlate: travel.truck?.plate || '-',
  startTime: travel.startTime || '--:--',
  endTime: travel.endTime || '--:--',
  destination: travel.destination?.name || 'Sin destino',
  startKm: travel.startKm != null ? Math.floor(Number(travel.startKm)) : null,
  endKm: travel.endKm != null ? Math.floor(Number(travel.endKm)) : null,
  driver: travel.driver?.name || travel.driver?.email || 'Sin conductor',
  official: travel.employee?.name || travel.employee?.email || 'Sin funcionario',
  signature: Boolean(travel.signatureUrl || travel.signatureDataUrl),
  signatureUrl: travel.signatureUrl || null,
  signatureDataUrl: travel.signatureDataUrl || null,
  patient: travel.patient?.name || '-',
  evidence:
    travel.evidenceUrl ||
    travel.evidence?.url ||
    travel.evidence ||
    null,
})

const buildUpdateTripPayload = (editedTrip) => {
  const payload = {}

  if (editedTrip.date) {
    payload.date = editedTrip.date
  }

  if (editedTrip.startTime && editedTrip.startTime !== '--:--') {
    payload.startTime = editedTrip.startTime
  }

  if (editedTrip.endTime && editedTrip.endTime !== '--:--') {
    payload.endTime = editedTrip.endTime
  }

  if (editedTrip.status) {
    payload.status = editedTrip.status
  }

  if (editedTrip.startKm !== '' && editedTrip.startKm !== null && editedTrip.startKm !== undefined) {
    payload.startKm = Number(editedTrip.startKm)
  }

  if (editedTrip.endKm !== '' && editedTrip.endKm !== null && editedTrip.endKm !== undefined) {
    payload.endKm = Number(editedTrip.endKm)
  }

  if (editedTrip.truckId !== '' && editedTrip.truckId !== null && editedTrip.truckId !== undefined) {
    payload.truckId = Number(editedTrip.truckId)
  }

  if (editedTrip.destinationId !== '' && editedTrip.destinationId !== null && editedTrip.destinationId !== undefined) {
    payload.destinationId = Number(editedTrip.destinationId)
  }

  if (editedTrip.driverId != null && editedTrip.driverId !== '' && !Number.isNaN(Number(editedTrip.driverId))) {
    payload.driverId = Number(editedTrip.driverId)
  }

  if (editedTrip.employeeId != null && editedTrip.employeeId !== '' && !Number.isNaN(Number(editedTrip.employeeId))) {
    payload.employeeId = Number(editedTrip.employeeId)
  }

  return payload
}

const loadAdminEditCatalogs = async () => {
  try {
    const [driversRes, destinationsRes, employeesRes] = await Promise.all([
      api.get('/users/by-roles', {
        params: {
          roles: 'DRIVER',
        },
      }),
      api.get('/destinations'),
      // TripHistory.employeeId apunta a la tabla Employee (no a User/rol EMPLOYEE)
      api.get('/employees/all'),
    ])

    const driversPayload = Array.isArray(driversRes?.data) ? driversRes.data : []
    const destinationsPayload = Array.isArray(destinationsRes?.data) ? destinationsRes.data : []
    const employeesPayload = Array.isArray(employeesRes?.data) ? employeesRes.data : []

    adminDrivers.value = driversPayload.map((driver) => ({
      id: driver.id,
      name: driver.name || '',
      email: driver.email || '',
    }))

    adminEmployees.value = employeesPayload.map((e) => ({
      id: e.id,
      name: e.name || '',
      email: e.email || '',
    }))

    adminDestinations.value = destinationsPayload.map((destination) => ({
      id: destination.id,
      name: destination.name,
    }))

    const { data: unassignedData } = await api.get('/trucks/unassigned')
    const unassignedTrucks = Array.isArray(unassignedData)
      ? unassignedData.map((truck) => ({ id: truck.id, plate: truck.plate }))
      : []

    const trucksEntries = await Promise.all(
      adminDrivers.value.map(async (driver) => {
        const { data } = await api.get(`/users/${driver.id}/trucks`)
        const assignedTrucks = Array.isArray(data)
          ? data.map((truck) => ({ id: truck.id, plate: truck.plate }))
          : []

        return [driver.id, assignedTrucks.length > 0 ? assignedTrucks : unassignedTrucks]
      }),
    )

    adminTrucksByDriver.value = Object.fromEntries(trucksEntries)
  } catch (error) {
    console.error('No se pudieron cargar catalogos de edición admin', error)
  }
}

const loadTravels = async () => {
  isLoadingTravels.value = true
  travelsError.value = ''

  try {
    const { data } = await api.get('/trip-history/admin', {
      params: {
        page: currentPage.value,
        pageSize: Number(itemsPerPage.value),
        from: appliedFilters.value.from || undefined,
        to: appliedFilters.value.to || undefined,
        license: appliedFilters.value.license || undefined,
        ...(appliedFilters.value.searchValue ? {
          [appliedFilters.value.searchBy === 'official' ? 'name' : appliedFilters.value.searchBy]: appliedFilters.value.searchValue
        } : {}),
      },
    })

    const payloadItems = Array.isArray(data?.items) ? data.items : []

    travels.value = payloadItems.map(mapTravelFromApi)

    totalItems.value = Number(data?.total) || 0
    totalPages.value = Math.max(Number(data?.totalPages) || 1, 1)
    currentPage.value = Number(data?.page) || 1
  } catch (error) {
    const backendMessage = error.response?.data?.message
    travelsError.value = Array.isArray(backendMessage)
      ? backendMessage.join(', ')
      : backendMessage || 'No se pudo cargar el historial de viajes.'
    travels.value = []
    totalItems.value = 0
    totalPages.value = 1
  } finally {
    isLoadingTravels.value = false
  }
}

const uniquePlates = computed(() => {
  const plates = new Set(travels.value.map((travel) => travel.licensePlate))
  return [...plates]
})

// Normalize string: lowercase + remove diacritics (tildes, etc.)
const normalize = (str) =>
  (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const filteredTravels = computed(() => {
  const { searchBy, searchValue } = appliedFilters.value
  if (!searchValue) return travels.value

  const needle = normalize(searchValue)

  return travels.value.filter(trip => {
    let haystack = ''
    if (searchBy === 'destination') haystack = trip.destination
    else if (searchBy === 'driver') haystack = trip.driver
    else if (searchBy === 'official') haystack = trip.official
    return normalize(haystack).includes(needle)
  })
})

const firstVisibleRow = computed(() => {
  if (totalItems.value === 0) return 0
  return (currentPage.value - 1) * Number(itemsPerPage.value) + 1
})

const lastVisibleRow = computed(() => {
  if (totalItems.value === 0) return 0
  return Math.min(currentPage.value * Number(itemsPerPage.value), totalItems.value)
})

const tripStatusLabel = (status) => {
  if (status === 'COMPLETED') return 'Completado'
  if (status === 'EMPLOYEE_SIGNED') return 'Firmado (func.)'
  return 'En transcurso'
}

const goToPreviousPage = () => {
  if (currentPage.value <= 1 || isLoadingTravels.value) return
  currentPage.value -= 1
}

const goToNextPage = () => {
  if (currentPage.value >= totalPages.value || isLoadingTravels.value) return
  currentPage.value += 1
}

const applyFilters = () => {
  appliedFilters.value = { ...filters.value }
  currentPage.value = 1
  loadTravels()
}

const clearFilters = () => {
  filters.value = { from: '', to: '', searchBy: filters.value.searchBy, searchValue: '', license: '' }
  appliedFilters.value = { ...filters.value }
  currentPage.value = 1
  loadTravels()
}

const activeFilterChips = computed(() => {
  const chips = []
  if (filters.value.from) chips.push({ label: 'Desde', value: filters.value.from, field: 'from' })
  if (filters.value.to) chips.push({ label: 'Hasta', value: filters.value.to, field: 'to' })
  if (filters.value.searchValue) {
    const label = filters.value.searchBy === 'destination' ? 'Destino' : filters.value.searchBy === 'driver' ? 'Conductor' : 'Funcionario'
    chips.push({ label, value: filters.value.searchValue, field: 'searchValue' })
  }
  if (filters.value.license) chips.push({ label: 'Patente', value: filters.value.license, field: 'license' })
  return chips
})

const removeFilter = (field) => {
  if (field === 'from') filters.value.from = ''
  else if (field === 'to') filters.value.to = ''
  else if (field === 'searchValue') filters.value.searchValue = ''
  else if (field === 'license') filters.value.license = ''
  applyFilters()
}

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
    return
  }
  router.push('/dashboard-admin')
}

const handleEditTrip = (trip) => {
  // handled locally in TripHistoryTable
}

const isDeleteModalOpen = ref(false)
const tripToDelete = ref(null)

const handleDeleteTrip = (trip) => {
  tripToDelete.value = trip
  isDeleteModalOpen.value = true
}

const confirmDeleteTrip = async () => {
  if (!tripToDelete.value) return
  try {
    await api.delete(`/trip-history/${tripToDelete.value.id}`)
    travels.value = travels.value.filter(t => t.id !== tripToDelete.value.id)
    totalItems.value = Math.max(0, totalItems.value - 1)
    travelsError.value = ''
  } catch (err) {
    const backendMessage = err?.response?.data?.message
    travelsError.value = Array.isArray(backendMessage)
      ? backendMessage.join(', ')
      : backendMessage || 'No se pudo eliminar el viaje.'
  } finally {
    isDeleteModalOpen.value = false
    tripToDelete.value = null
  }
}

const cancelDeleteTrip = () => {
  isDeleteModalOpen.value = false
  tripToDelete.value = null
}

const tripTable = ref(null)
const isSaveModalOpen = ref(false)
const tripToSave = ref(null)

const tripToSaveDriverName = computed(() => {
  if (!tripToSave.value) return ''
  return adminDrivers.value.find(d => d.id === tripToSave.value.driverId)?.name || tripToSave.value.driver || ''
})

const tripToSaveDestinationName = computed(() => {
  if (!tripToSave.value) return ''
  return adminDestinations.value.find(d => d.id === tripToSave.value.destinationId)?.name || tripToSave.value.destination || ''
})

const tripToSaveDisplayDate = computed(() => {
  const d = tripToSave.value?.date
  if (!d) return ''
  const parts = d.split('-')
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
  return d
})

const handleSaveTripRequest = (editedTrip) => {
  tripToSave.value = editedTrip
  isSaveModalOpen.value = true
}

const confirmSaveTrip = async () => {
  if (!tripToSave.value) return

  try {
    const payload = buildUpdateTripPayload(tripToSave.value)
    const { data } = await api.patch(`/trip-history/${tripToSave.value.id}`, payload)

    const index = travels.value.findIndex(t => t.id === tripToSave.value.id)
    if (index !== -1) {
      travels.value[index] = mapTravelFromApi(data)
    }

    travelsError.value = ''
  } catch (err) {
    const backendMessage = err?.response?.data?.message
    travelsError.value = Array.isArray(backendMessage)
      ? backendMessage.join(', ')
      : backendMessage || 'No se pudo guardar el viaje.'
    console.error('Error saving trip', err)
  } finally {
    isSaveModalOpen.value = false
    tripToSave.value = null
    if (tripTable.value) {
      tripTable.value.cancelEditing()
    }
  }
}

const cancelSaveTrip = () => {
  isSaveModalOpen.value = false
  tripToSave.value = null
}

const selectedTripForMap = ref(null)
const selectedTripRoute = ref(null)
const isLoadingTripRoute = ref(false)
const tripRouteError = ref('')

const loadTripRoute = async (trip) => {
  if (!trip?.id) {
    selectedTripRoute.value = null
    tripRouteError.value = 'No se pudo identificar el viaje.'
    return
  }

  isLoadingTripRoute.value = true
  tripRouteError.value = ''

  try {
    const { data } = await api.get(`/trip-history/${trip.id}/map-route`)
    selectedTripRoute.value = {
      snappedPoints: Array.isArray(data?.snappedPoints) ? data.snappedPoints : [],
    }
  } catch (error) {
    const backendMessage = error.response?.data?.message
    tripRouteError.value = Array.isArray(backendMessage)
      ? backendMessage.join(', ')
      : backendMessage || 'No se pudo cargar la ruta del viaje.'
    selectedTripRoute.value = null
  } finally {
    isLoadingTripRoute.value = false
  }
}

const handleViewMap = (trip) => {
  selectedTripForMap.value = trip
  selectedTripRoute.value = null
  tripRouteError.value = ''
  void loadTripRoute(trip)
}

const loadImageElement = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('No se pudo cargar la firma.'))
    image.src = src
  })

const getImageExtensionFromDataUrl = (dataUrl) => {
  const mimeType = dataUrl?.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/)?.[1]

  if (mimeType === 'image/png') return 'png'
  return 'jpeg'
}

const getSignatureImageData = async (signatureUrl) => {
  if (!signatureUrl) return null
  if (signatureUrl.startsWith('data:image/')) return signatureUrl

  try {
    const image = await loadImageElement(signatureUrl)
    const canvas = document.createElement('canvas')
    const safeWidth = Math.max(image.naturalWidth || image.width || 1, 1)
    const safeHeight = Math.max(image.naturalHeight || image.height || 1, 1)

    canvas.width = safeWidth
    canvas.height = safeHeight

    const context = canvas.getContext('2d')
    if (!context) return null

    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, safeWidth, safeHeight)
    context.drawImage(image, 0, 0, safeWidth, safeHeight)

    return canvas.toDataURL('image/png')
  } catch (error) {
    console.error('No se pudo cargar la firma para exportar', signatureUrl, error)
    return null
  }
}

const resizeSignatureDataUrl = async (dataUrl) => {
  if (!dataUrl) return null

  try {
    const image = await loadImageElement(dataUrl)
    const maxWidth = 220
    const maxHeight = 80
    const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1)
    const width = Math.max(Math.round(image.width * scale), 1)
    const height = Math.max(Math.round(image.height * scale), 1)
    const canvas = document.createElement('canvas')

    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    if (!context) return dataUrl

    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, width, height)
    context.drawImage(image, 0, 0, width, height)

    return canvas.toDataURL('image/png')
  } catch (error) {
    console.error('No se pudo redimensionar la firma para exportar', error)
    return dataUrl
  }
}

const loadSignatureImages = async (travelsList) => {
  const imageEntries = await Promise.all(
    travelsList.map(async (travel) => [
      travel.id,
      await resizeSignatureDataUrl(
        await getSignatureImageData(travel.signatureDataUrl || travel.signatureUrl),
      ),
    ]),
  )

  return new Map(imageEntries)
}

const downloadBlobFile = (blob, filename) => {
  const downloadUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  window.setTimeout(() => {
    window.URL.revokeObjectURL(downloadUrl)
  }, 1000)
}

const buildPdfDocument = (signatureImages = new Map()) => {
  const pdfTravels = [...filteredTravels.value]
  const doc = new jsPDF('landscape')
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(33, 33, 33)
  doc.text('Historial de Viajes', pageWidth / 2, 18, { align: 'center' })

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120, 120, 120)
  const now = new Date().toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  doc.text(`Generado: ${now}`, pageWidth - 14, 14, { align: 'right' })

  doc.setDrawColor(85, 85, 85)
  doc.setLineWidth(0.4)
  doc.line(14, 28, pageWidth - 14, 28)

  autoTable(doc, {
    startY: 32,
    head: [
      [
        { content: 'Fecha',       rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'Patente',     rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'Hora',        colSpan: 2, styles: { halign: 'center' } },
        { content: 'Destino',     rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'Estado',      rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'Kilometraje', colSpan: 2, styles: { halign: 'center' } },
        { content: 'Conductor',   rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'Funcionario', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'Firma',       rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
      ],
      [
        { content: 'Inicio', styles: { halign: 'center' } },
        { content: 'Final',  styles: { halign: 'center' } },
        { content: 'Inicio', styles: { halign: 'center' } },
        { content: 'Final',  styles: { halign: 'center' } },
      ],
    ],
    body: pdfTravels.map((travel) => [
      travel.date,
      travel.licensePlate,
      travel.startTime  ?? '-',
      travel.endTime    ?? '-',
      travel.destination,
      tripStatusLabel(travel.status),
      travel.startKm != null ? Math.floor(travel.startKm) : '-',
      travel.endKm   != null ? Math.floor(travel.endKm)   : '-',
      travel.driver,
      travel.official,
      '',
    ]),
    styles: {
      fontSize: 8,
      cellPadding: 2,
      minCellHeight: 22,
      valign: 'middle',
      halign: 'center',
      lineColor: [209, 209, 209],
      lineWidth: 0.3,
      textColor: [33, 33, 33],
      font: 'helvetica',
    },
    headStyles: {
      fillColor: [33, 37, 60],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      lineColor: [85, 85, 85],
      lineWidth: 0.4,
      minCellHeight: 6,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [247, 248, 250],
    },
    columnStyles: {
      0:  { cellWidth: 22 },
      1:  { cellWidth: 22 },
      2:  { cellWidth: 18 },
      3:  { cellWidth: 18 },
      4:  { cellWidth: 32 },
      5:  { cellWidth: 26 },
      6:  { cellWidth: 18 },
      7:  { cellWidth: 18 },
      8:  { cellWidth: 30 },
      9:  { cellWidth: 30 },
      10: { cellWidth: 28 },
    },
    didDrawCell: (data) => {
      if (data.section !== 'body' || data.column.index !== 10) return

      const travel = pdfTravels[data.row.index]
      if (!travel) return

      const signatureDataUrl = signatureImages.get(travel.id)
      if (!signatureDataUrl) {
        doc.setFontSize(7)
        doc.setTextColor(150, 150, 150)
        doc.text('Sin firma', data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2, { align: 'center', baseline: 'middle' })
        return
      }

      try {
        const padding = 2
        doc.addImage(
          signatureDataUrl,
          getImageExtensionFromDataUrl(signatureDataUrl).toUpperCase(),
          data.cell.x + padding,
          data.cell.y + padding,
          Math.max(data.cell.width - padding * 2, 8),
          Math.max(data.cell.height - padding * 2, 8),
        )
      } catch (imageError) {
        doc.setFontSize(7)
        doc.setTextColor(150, 150, 150)
        doc.text('Sin firma', data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2, { align: 'center', baseline: 'middle' })
      }
    },
    didDrawPage: (data) => {
      const pageCount = doc.internal.getNumberOfPages()
      const currentPageNum = doc.internal.getCurrentPageInfo().pageNumber
      doc.setFontSize(7)
      doc.setTextColor(150, 150, 150)
      doc.text(
        `Página ${currentPageNum} de ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 6,
        { align: 'center' }
      )
    },
  })

  return doc
}

const exportToPDF = async () => {
  try {
    const signatureImages = await loadSignatureImages(filteredTravels.value)
    const doc = buildPdfDocument(signatureImages)
    const blob = doc.output('blob')
    downloadBlobFile(blob, 'historial_viajes.pdf')
  } catch (error) {
    console.error('No se pudo exportar el PDF', error)
    try {
      const fallbackDoc = buildPdfDocument()
      const fallbackBlob = fallbackDoc.output('blob')
      downloadBlobFile(fallbackBlob, 'historial_viajes.pdf')
    } catch (fallbackError) {
      console.error('No se pudo exportar el PDF sin firmas', fallbackError)
    }
  }
}

const exportToExcel = async () => {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Historial')
  const signatureImages = await loadSignatureImages(filteredTravels.value)

  worksheet.columns = [
    { header: 'Fecha', key: 'date', width: 14 },
    { header: 'Patente', key: 'licensePlate', width: 14 },
    { header: 'Salida', key: 'startTime', width: 12 },
    { header: 'Llegada', key: 'endTime', width: 12 },
    { header: 'Destino', key: 'destination', width: 28 },
    { header: 'Estado', key: 'status', width: 18 },
    { header: 'Km Inicial', key: 'startKm', width: 14 },
    { header: 'Km Final', key: 'endKm', width: 14 },
    { header: 'Conductor', key: 'driver', width: 24 },
    { header: 'Funcionario', key: 'official', width: 24 },
    { header: 'Firma', key: 'signature', width: 24 },
  ]

  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFA22026' },
  }
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' }
  worksheet.views = [{ state: 'frozen', ySplit: 1 }]

  filteredTravels.value.forEach((travel) => {
    worksheet.addRow({
      date: travel.date,
      licensePlate: travel.licensePlate,
      startTime: travel.startTime,
      endTime: travel.endTime,
      destination: travel.destination,
      status: tripStatusLabel(travel.status),
      startKm: travel.startKm != null ? Math.floor(travel.startKm) : '-',
      endKm: travel.endKm   != null ? Math.floor(travel.endKm)   : '-',
      driver: travel.driver,
      official: travel.official,
      signature: '',
    })
  })

  worksheet.eachRow((row, rowNumber) => {
    row.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true }
    if (rowNumber > 1) {
      row.height = 52
    }
  })

  for (let index = 0; index < filteredTravels.value.length; index += 1) {
    const travel = filteredTravels.value[index]
    const rowNumber = index + 2
    const signatureDataUrl = signatureImages.get(travel.id)

    if (!signatureDataUrl) {
      worksheet.getCell(`K${rowNumber}`).value = 'Sin firma'
      worksheet.getCell(`K${rowNumber}`).alignment = {
        vertical: 'middle',
        horizontal: 'center',
      }
      continue
    }

    const imageId = workbook.addImage({
      base64: signatureDataUrl,
      extension: getImageExtensionFromDataUrl(signatureDataUrl),
    })

    worksheet.addImage(imageId, {
      tl: { col: 10.08, row: rowNumber - 0.92 },
      ext: { width: 130, height: 42 },
      editAs: 'oneCell',
    })
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const downloadUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = 'historial_viajes.xlsx'
  link.click()
  window.URL.revokeObjectURL(downloadUrl)
}

onMounted(() => {
  void loadAdminEditCatalogs()
  loadTravels()
})

onBeforeUnmount(() => {
})

watch(itemsPerPage, () => {
  currentPage.value = 1
  loadTravels()
})

watch(currentPage, () => {
  loadTravels()
})
</script>

<template>
  <div class="h-screen min-h-0 overflow-hidden bg-background flex flex-col">
    <!-- Header -->
    <div class="shrink-0 bg-white shadow-sm border-b border-gray-200">
      <div class="px-4 py-4 flex items-center justify-between">
        <router-link to="/" class="flex items-center">
          <img :src="logoCompleto" alt="Transportes Flores Vargas" class="h-16 w-auto object-contain hover:opacity-80 transition-opacity" />
        </router-link>
        <UserMenu />
      </div>
    </div>

    <!-- Body -->
    <div class="flex flex-1 min-h-0 overflow-hidden min-w-0 relative">
      <DashboardSidebar />

      <!-- Main content -->
      <main class="flex-1 min-h-0 pt-4 pb-10 pl-4 pr-2 sm:pr-3 overflow-y-auto flex flex-col min-w-0 relative">
        <div class="w-full mb-3 pl-0 shrink-0">
          <button
            @click="selectedTripForMap ? selectedTripForMap = null : goBack()"
            class="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary transition-colors"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Volver
          </button>
        </div>
        
        <div class="flex gap-6 w-full min-w-0 relative">

          <!-- MAIN TABLE VIEW -->
          <div v-if="!selectedTripForMap" :class="[
            'bg-white rounded-3xl border-2 border-slate-300 shadow-sm flex-1 flex flex-col transition-all duration-300 relative min-w-0 overflow-hidden',
            isFilterOpen ? 'md:max-w-[calc(100%-24rem)]' : 'w-full'
          ]">
            <div class="flex flex-col md:flex-row items-center justify-center p-4 sm:p-8 pb-4 sm:pb-6 relative min-h-[4rem] sm:min-h-[5rem] gap-4 md:gap-0">
               <h1 class="text-xl sm:text-2xl md:text-3xl font-titles font-bold text-text-title text-center m-0 md:absolute md:left-1/2 md:-translate-x-1/2 md:top-6 order-1 md:order-none">Historial de viajes</h1>

               <div class="flex justify-center items-center gap-3 z-10 w-full md:w-auto md:absolute md:right-6 md:top-6 order-2 md:order-none">
                 <button @click="exportToPDF" class="bg-[#A22026] hover:bg-red-800 text-white font-semibold py-2 px-5 rounded-xl shadow transition-colors outline-none focus:ring-2 focus:ring-red-500 text-sm">
                   PDF
                 </button>
                 <button @click="exportToExcel" class="bg-[#1D6F42] hover:bg-green-800 text-white font-semibold py-2 px-5 rounded-xl shadow transition-colors outline-none focus:ring-2 focus:ring-green-500 text-sm">
                   Excel
                 </button>
                 <button
                         @click="isFilterOpen = !isFilterOpen"
                         class="p-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors outline-none focus:ring-2 focus:ring-primary border border-gray-300"
                         :title="isFilterOpen ? 'Cerrar filtros' : 'Abrir filtros'">
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                     <line x1="8" y1="5" x2="8" y2="19"></line>
                     <line x1="16" y1="5" x2="16" y2="19"></line>
                     <line x1="5" y1="10" x2="11" y2="10"></line>
                     <line x1="13" y1="14" x2="19" y2="14"></line>
                   </svg>
                 </button>
               </div>
            </div>

            <div class="custom-scrollbar w-full overflow-x-auto px-3 sm:px-8 md:px-12 lg:px-16 md:pr-10 relative mt-4 sm:mt-6 pb-6 min-w-0">
              <div class="min-w-[1200px]">
                <TripHistoryTable 
                  ref="tripTable"
                  :trips="filteredTravels"
                  role="admin"
                  :isLoading="isLoadingTravels"
                  :error="travelsError"
                  :adminDrivers="adminDrivers"
                  :adminDestinations="adminDestinations"
                  :adminEmployees="adminEmployees"
                  :adminTrucksByDriver="adminTrucksByDriver"
                  @edit-trip="handleEditTrip"
                  @delete-trip="handleDeleteTrip"
                  @request-save-trip="handleSaveTripRequest"
                  @view-map="handleViewMap"
                />
              </div>
            </div>

            <div class="px-3 sm:px-8 md:px-12 lg:px-16 md:pr-10 py-4 bg-white flex flex-wrap justify-between items-center gap-2 text-xs font-medium text-gray-500 border-t border-gray-200 mt-auto rounded-b-3xl">
              <div class="flex items-center gap-2">
                <span>Filas por paginas</span>
                <div class="relative">
                  <select v-model.number="itemsPerPage" class="appearance-none border border-gray-300 rounded-md px-3 py-1.5 pr-8 bg-white outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer">
                    <option :value="10">10</option>
                    <option :value="50">50</option>
                    <option :value="100">100</option>
                  </select>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>
              <div class="font-semibold content-center pl-10">
                {{ firstVisibleRow }}-{{ lastVisibleRow }} de {{ totalItems }}
              </div>
              <div class="flex items-center gap-1">
                <button @click="goToPreviousPage" :disabled="currentPage <= 1 || isLoadingTravels" class="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 disabled:opacity-40 transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <button @click="goToNextPage" :disabled="currentPage >= totalPages || isLoadingTravels" class="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 disabled:opacity-40 transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              </div>
            </div>
          </div>

          <!-- MAP VIEW CARD -->
          <div v-else class="bg-white rounded-3xl border-2 border-slate-300 shadow-sm flex-1 flex flex-col overflow-hidden transition-all duration-300 relative w-full p-8 hidden-scroll">
            <div class="flex flex-col h-full min-h-0">
              <div class="relative w-full mb-6 shrink-0 flex flex-col sm:block items-center gap-1 sm:gap-0">
                <h2 class="text-2xl font-bold font-titles text-center text-text-title w-full">Ruta de viaje</h2>
                <div class="sm:absolute sm:top-1 sm:right-0 font-bold font-titles text-[15px] sm:text-lg text-text-title tracking-tight text-center sm:text-right">
                  Patente: <span class="text-[#215179]">{{ selectedTripForMap.licensePlate }}</span>
                </div>
              </div>
              <div class="flex items-end justify-between mb-4 text-sm font-medium text-gray-600">
                <div>
                  Puntos trazados: <span class="font-bold text-text-title">{{ selectedTripRoute?.snappedPoints?.length || 0 }}</span>
                </div>
              </div>
              <div class="flex-1 rounded-xl w-full h-full min-h-0 overflow-hidden shadow-inner bg-slate-100 relative">
                <TripRouteMap v-if="selectedTripRoute" :snapped-points="selectedTripRoute.snappedPoints" />
                <div v-else class="absolute inset-0 flex items-center justify-center text-center px-6">
                  <div>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <span class="text-gray-500 font-semibold text-lg">
                      {{ isLoadingTripRoute ? 'Cargando ruta...' : 'Mapa no disponible' }}
                    </span>
                    <p class="text-gray-500 text-sm mt-1">
                      {{ isLoadingTripRoute ? 'Recuperando puntos GPS y trazado...' : (tripRouteError || 'Selecciona un viaje para ver su recorrido.') }}
                    </p>
                  </div>
                </div>
              </div>
              <div v-if="tripRouteError" class="mt-4 text-sm text-red-600 font-medium">
                {{ tripRouteError }}
              </div>
            </div>
          </div>

        <!-- Backdrop móvil -->
        <div v-if="isFilterOpen" class="fixed inset-0 bg-black/30 z-40 sm:hidden" @click="isFilterOpen = false" />

        <Transition name="slide">
          <div v-show="isFilterOpen" class="fixed inset-x-0 bottom-0 top-[88px] z-50 sm:fixed md:relative md:inset-x-auto md:bottom-auto md:top-0 md:max-h-[calc(100vh-220px)] md:w-[22rem] md:self-start md:mt-0 md:z-20 bg-[#EBEBEB] md:rounded-[2rem] rounded-t-[2rem] border border-gray-300 shadow-sm flex flex-col p-6 md:shrink-0 overflow-y-auto">
            <div class="flex w-full min-h-[2.5rem] items-center mb-6 mt-2">
              <div class="w-10 shrink-0 sm:w-0 sm:min-w-0" aria-hidden="true" />
              <h2 class="text-2xl font-titles font-extrabold text-[#1b2533] flex-1 text-center">Filtros</h2>
              <button
                type="button"
                @click.stop="isFilterOpen = false"
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-700 sm:hidden touch-manipulation hover:bg-black/[0.06] active:bg-black/10"
                title="Cerrar filtros"
                aria-label="Cerrar filtros"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <line x1="8" y1="5" x2="8" y2="19"></line>
                  <line x1="16" y1="5" x2="16" y2="19"></line>
                  <line x1="5" y1="10" x2="11" y2="10"></line>
                  <line x1="13" y1="14" x2="19" y2="14"></line>
                </svg>
              </button>
            </div>

               <div class="flex flex-col gap-4 mb-6 mt-2 relative">
                 <!-- Chips de Filtros Activos -->
                 <div v-if="activeFilterChips.length > 0" class="flex flex-wrap items-center gap-2 bg-gray-100/50 p-3 rounded-[1.5rem] border border-gray-200">
                   <div v-for="chip in activeFilterChips" :key="chip.field" class="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full text-[10px] font-bold text-gray-600 shadow-sm border border-gray-100">
                      <span class="text-gray-400 font-medium">{{ chip.label }}:</span> {{ chip.value }}
                      <button @click="removeFilter(chip.field)" class="ml-1 hover:text-red-500 transition-colors">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                    <button @click="clearFilters" class="ml-auto text-[#A61919] hover:text-red-800 font-bold text-[11px] px-3 py-1.5 bg-white border border-gray-200 rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1.5">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      Limpiar Todo
                    </button>
                 </div>
               </div>

                <div class="flex flex-col gap-5 mt-4">
                  <!-- Date Range -->
                  <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col relative w-full">
                      <div class="z-10 bg-[#EBEBEB] w-fit px-1 absolute -top-2 left-2 text-[10px] text-gray-500 font-bold ml-1 mb-0.5">Desde</div>
                      <div class="relative w-full">
                        <input type="date" v-model="filters.from" class="text-[11px] px-3 py-2.5 pr-10 w-full rounded-xl border border-[#b2b2b2] bg-transparent text-gray-600 outline-none focus:border-primary hover:border-gray-500 transition-colors appearance-none" />
                        <svg width="14" height="14" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                      </div>
                    </div>
                    <div class="flex flex-col relative w-full">
                      <div class="text-[10px] text-gray-500 font-bold ml-1 mb-0.5 z-10 bg-[#EBEBEB] w-fit px-1 absolute -top-2 left-2">Hasta</div>
                      <div class="relative w-full">
                        <input type="date" v-model="filters.to" class="text-[11px] px-3 py-2.5 pr-10 w-full rounded-xl border border-[#b2b2b2] bg-transparent text-gray-600 outline-none focus:border-primary hover:border-gray-500 transition-colors appearance-none" />
                        <svg width="14" height="14" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                      </div>
                    </div>
                  </div>

                  <!-- Buscar por -->
                  <div class="flex flex-col relative mt-2">
                    <div class="text-[10px] text-gray-500 font-bold ml-1 mb-0.5 z-10 bg-[#EBEBEB] w-fit px-1 absolute -top-2 left-2">Tipo de búsqueda</div>
                    <div class="relative">
                      <select v-model="filters.searchBy" class="px-3 py-2.5 text-[11px] w-full rounded-xl border border-[#b2b2b2] bg-transparent text-gray-600 outline-none hover:border-gray-500 focus:border-primary transition-colors appearance-none cursor-pointer">
                        <option value="destination">Destino</option>
                        <option value="driver">Conductor</option>
                        <option value="official">Funcionario</option>
                      </select>
                      <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                      </div>
                    </div>
                  </div>

                  <!-- Valor búsqueda -->
                  <div class="flex flex-col relative mt-2">
                    <div class="text-[10px] text-gray-500 font-bold ml-1 mb-0.5 z-10 bg-[#EBEBEB] w-fit px-1 absolute -top-2 left-2">Búsqueda</div>
                    <div class="relative">
                      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                      </div>
                      <input type="text" v-model="filters.searchValue" placeholder="Escribe el nombre..." class="pl-8 pr-3 py-2.5 text-[11px] w-full rounded-xl border border-[#b2b2b2] bg-transparent text-gray-700 outline-none hover:border-gray-500 focus:border-primary transition-colors focus:ring-1 focus:ring-primary placeholder-gray-400" />
                    </div>
                  </div>

                  <!-- Patente -->
                  <div class="flex flex-col relative mt-2">
                    <div class="text-[10px] text-gray-500 font-bold ml-1 mb-0.5 z-10 bg-[#EBEBEB] w-fit px-1 absolute -top-2 left-2">Patentes</div>
                    <div class="relative">
                      <select v-model="filters.license" class="px-3 py-2.5 pr-8 text-[11px] w-full rounded-xl border border-[#b2b2b2] bg-transparent text-gray-500 outline-none hover:border-gray-500 focus:border-primary transition-colors focus:ring-1 focus:ring-primary appearance-none cursor-pointer">
                        <option value="">Selecciona la patente...</option>
                        <option v-for="plate in uniquePlates" :key="plate" :value="plate">{{ plate }}</option>
                      </select>
                      <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                      </div>
                    </div>
                  </div>

                  <!-- Aplicar button -->
                  <div class="mt-4 flex justify-end">
                    <button @click="applyFilters" class="px-6 py-2 bg-[#A61919] text-white text-xs rounded-xl font-bold shadow-sm hover:bg-red-800 transition-all w-full">
                      Aplicar
                    </button>
                  </div>
                </div>
            </div>
          </Transition>
        </div>
      </main>
    </div>

    <!-- Modals -->
    <Teleport to="body">
      <div v-if="isSaveModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div class="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-200">
          <div class="relative p-6 pt-8 pb-8">
            <button @click="cancelSaveTrip" class="absolute right-4 top-4 text-gray-400 hover:text-gray-700 border border-gray-200 rounded p-0.5 outline-none transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h3 class="text-xl font-titles font-bold text-gray-900 mb-1 text-center">Guardar cambios</h3>
            <p class="text-sm text-gray-500 mb-5 text-center">¿Está seguro de guardar los siguientes cambios?</p>
            <div class="bg-gray-50 rounded-2xl border border-gray-200 p-4 mb-6">
              <div class="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
                <div class="flex gap-1"><span class="font-semibold text-gray-500 shrink-0">Fecha:</span><span>{{ tripToSaveDisplayDate }}</span></div>
                <div class="flex gap-1"><span class="font-semibold text-gray-500 shrink-0">Patente:</span><span>{{ tripToSave?.licensePlate || '-' }}</span></div>
                <div class="flex gap-1"><span class="font-semibold text-gray-500 shrink-0">Hora inicio:</span><span>{{ tripToSave?.startTime || '-' }}</span></div>
                <div class="flex gap-1"><span class="font-semibold text-gray-500 shrink-0">Hora final:</span><span>{{ tripToSave?.endTime || '-' }}</span></div>
                <div class="flex gap-1 col-span-2"><span class="font-semibold text-gray-500 shrink-0">Destino:</span><span>{{ tripToSaveDestinationName || '-' }}</span></div>
                <div class="flex gap-1"><span class="font-semibold text-gray-500 shrink-0">Estado:</span><span>{{ tripToSave ? tripStatusLabel(tripToSave.status) : '' }}</span></div>
                <div class="flex gap-1"><span class="font-semibold text-gray-500 shrink-0">Km inicio:</span><span>{{ tripToSave?.startKm ?? '-' }}</span></div>
                <div class="flex gap-1"><span class="font-semibold text-gray-500 shrink-0">Km final:</span><span>{{ tripToSave?.endKm ?? '-' }}</span></div>
                <div class="flex gap-1 col-span-2"><span class="font-semibold text-gray-500 shrink-0">Conductor:</span><span>{{ tripToSaveDriverName || '-' }}</span></div>
                <div class="flex gap-1 col-span-2"><span class="font-semibold text-gray-500 shrink-0">Funcionario:</span><span>{{ tripToSave?.official || '-' }}</span></div>
              </div>
            </div>
            <div class="flex justify-center gap-6 font-titles font-bold tracking-wide">
              <button @click="confirmSaveTrip" class="px-6 py-2.5 bg-[#A61919] text-white text-xs rounded-xl shadow-sm hover:bg-red-800 transition-all flex-1 max-w-[140px]">Confirmar</button>
              <button @click="cancelSaveTrip" class="px-6 py-2.5 bg-[#215179] text-white text-xs rounded-xl shadow-sm hover:bg-blue-900 transition-all flex-1 max-w-[140px]">Cancelar</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="isDeleteModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div class="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200">
          <div class="relative p-6 pt-8 pb-8">
            <button @click="cancelDeleteTrip" class="absolute right-4 top-4 text-gray-400 hover:text-gray-700 border border-gray-200 rounded p-0.5 outline-none transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div class="flex justify-center mb-4"><div class="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div></div>
            <h3 class="text-xl font-titles font-bold text-gray-900 mb-2 text-center">Eliminar registro</h3>
            <p class="text-base text-gray-600 mb-1 text-center">¿Está seguro de que desea eliminar este registro?</p>
            <p class="text-base text-red-600 font-semibold mb-5 text-center">Esta acción es irreversible.</p>
            <div class="bg-red-50 rounded-2xl border border-red-100 p-4 mb-6 text-lg flex flex-col gap-1.5">
              <div class="flex gap-1"><span class="font-semibold text-gray-500 shrink-0">Fecha:</span><span>{{ tripToDelete?.date || '-' }}</span></div>
              <div class="flex gap-1"><span class="font-semibold text-gray-500 shrink-0">Patente:</span><span>{{ tripToDelete?.licensePlate || '-' }}</span></div>
              <div class="flex gap-1"><span class="font-semibold text-gray-500 shrink-0">Destino:</span><span>{{ tripToDelete?.destination || '-' }}</span></div>
              <div class="flex gap-1"><span class="font-semibold text-gray-500 shrink-0">Conductor:</span><span>{{ tripToDelete?.driver || '-' }}</span></div>
            </div>
            <div class="flex justify-center gap-6 font-titles font-bold tracking-wide">
              <button @click="confirmDeleteTrip" class="px-6 py-2.5 bg-[#A61919] text-white text-sm rounded-xl shadow-sm hover:bg-red-800 transition-all flex-1 max-w-[140px]">Confirmar</button>
              <button @click="cancelDeleteTrip" class="px-6 py-2.5 bg-[#215179] text-white text-sm rounded-xl shadow-sm hover:bg-blue-900 transition-all flex-1 max-w-[140px]">Cancelar</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.slide-enter-active, .slide-leave-active { transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1); }
.slide-enter-from, .slide-leave-to { transform: translateX(100%); opacity: 0; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

input[type="date"]::-webkit-calendar-picker-indicator { opacity: 0; cursor: pointer; z-index: 10; position: absolute; right: 8px; width: 24px; height: 24px; }

/* Misma barra que en Registro → Vehículos / tablas con overflow-auto en admin */
.custom-scrollbar::-webkit-scrollbar { height: 8px; width: 8px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.15); border-radius: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 0, 0, 0.3); }

.overflow-auto::-webkit-scrollbar { width: 8px; height: 8px; }
.overflow-auto::-webkit-scrollbar-track { background: transparent; }
.overflow-auto::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.1); border-radius: 4px; }
.overflow-auto::-webkit-scrollbar-thumb:hover { background: rgba(0, 0, 0, 0.2); }
</style>
