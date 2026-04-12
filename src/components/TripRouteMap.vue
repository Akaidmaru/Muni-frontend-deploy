<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  rawPoints: {
    type: Array,
    default: () => [],
  },
  snappedPoints: {
    type: Array,
    default: () => [],
  },
})

const mapContainer = ref(null)
const statusMessage = ref('')
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
const GOOGLE_MAPS_MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID'

let mapInstance = null
let snappedPolyline = null
let rawPointMarkers = []
let rawPointInfoWindow = null
let startMarker = null
let endMarker = null
let markerLibraryPromise = null

const loadGoogleMapsApi = () => {
  if (!GOOGLE_MAPS_API_KEY) {
    return Promise.reject(
      new Error('Falta VITE_GOOGLE_MAPS_API_KEY para renderizar Google Maps.'),
    )
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google.maps)
  }

  if (window.__googleMapsApiPromise) {
    return window.__googleMapsApiPromise
  }

  window.__googleMapsApiPromise = new Promise((resolve, reject) => {
    const callbackName = `__googleMapsInit_${Date.now()}`

    window[callbackName] = () => {
      resolve(window.google.maps)
      delete window[callbackName]
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      GOOGLE_MAPS_API_KEY,
    )}&callback=${callbackName}&loading=async&v=weekly`
    script.async = true
    script.defer = true
    script.onerror = () => {
      delete window[callbackName]
      reject(new Error('No se pudo cargar el SDK de Google Maps.'))
    }

    document.head.appendChild(script)
  })

  return window.__googleMapsApiPromise
}

const loadMarkerLibrary = async () => {
  if (!window.google?.maps?.importLibrary) {
    throw new Error('No se pudo cargar la librería de marcadores de Google Maps.')
  }

  if (!markerLibraryPromise) {
    markerLibraryPromise = window.google.maps.importLibrary('marker')
  }

  return markerLibraryPromise
}

const toLatLng = (points) =>
  points
    .filter(
      (point) =>
        Number.isFinite(Number(point?.latitude)) &&
        Number.isFinite(Number(point?.longitude)),
    )
    .map((point) => ({
      lat: Number(point.latitude),
      lng: Number(point.longitude),
    }))

const fitBoundsIfPossible = (layers) => {
  const allLatLngs = layers.flatMap((layer) => layer ?? [])
  if (!mapInstance || !window.google?.maps) return

  if (allLatLngs.length === 0) {
    mapInstance.setCenter({ lat: -33.4489, lng: -70.6693 })
    mapInstance.setZoom(11)
    return
  }

  const bounds = new window.google.maps.LatLngBounds()
  allLatLngs.forEach((point) => bounds.extend(point))
  mapInstance.fitBounds(bounds, 32)
}

const clearLayers = () => {
  rawPointInfoWindow?.close()

  rawPointMarkers.forEach((marker) => {
    if (typeof marker.setMap === 'function') {
      marker.setMap(null)
    } else {
      marker.map = null
    }
  })
  snappedPolyline?.setMap(null)

  if (startMarker) {
    if (typeof startMarker.setMap === 'function') {
      startMarker.setMap(null)
    } else {
      startMarker.map = null
    }
  }

  if (endMarker) {
    if (typeof endMarker.setMap === 'function') {
      endMarker.setMap(null)
    } else {
      endMarker.map = null
    }
  }

  snappedPolyline = null
  rawPointMarkers = []
  startMarker = null
  endMarker = null
}

const redrawRoute = async () => {
  if (!mapInstance || !window.google?.maps) return

  clearLayers()

  const rawLatLngs = toLatLng(props.rawPoints)
  const snappedLatLngs = toLatLng(props.snappedPoints)

  const primaryLatLngs = snappedLatLngs.length > 0 ? snappedLatLngs : rawLatLngs
  const allBoundsSources = [rawLatLngs, snappedLatLngs].filter((points) => points.length > 0)

  if (rawLatLngs.length > 0) {
    rawPointMarkers = rawLatLngs.map((position, index) => {
      const marker = new window.google.maps.Marker({
        position,
        map: mapInstance,
        clickable: true,
        title: `GPS real ${index + 1}`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 4,
          fillColor: '#DC2626',
          fillOpacity: 0.85,
          strokeColor: '#ffffff',
          strokeOpacity: 1,
          strokeWeight: 1,
        },
      })

      marker.addListener('click', () => {
        const latitude = Number(position.lat).toFixed(6)
        const longitude = Number(position.lng).toFixed(6)
        const content =
          `<div style="font-size:12px;line-height:1.45">` +
          `<strong>Punto GPS real ${index + 1}</strong><br/>` +
          `Lat: ${latitude}<br/>` +
          `Lng: ${longitude}` +
          `</div>`

        rawPointInfoWindow?.setContent(content)
        rawPointInfoWindow?.open({
          map: mapInstance,
          anchor: marker,
        })
      })

      return marker
    })
  }

  if (snappedLatLngs.length > 0) {
    snappedPolyline = new window.google.maps.Polyline({
      path: snappedLatLngs,
      geodesic: true,
      strokeColor: '#215179',
      strokeOpacity: 0.95,
      strokeWeight: 5,
      map: mapInstance,
    })
  }

  if (primaryLatLngs.length > 0) {
    const firstPoint = primaryLatLngs[0]
    const lastPoint = primaryLatLngs[primaryLatLngs.length - 1]
    const { AdvancedMarkerElement, PinElement } = await loadMarkerLibrary()

    const startPin = new PinElement({
      background: '#22C55E',
      borderColor: '#16A34A',
      glyphColor: '#ffffff',
      scale: 1,
    })

    startMarker = new AdvancedMarkerElement({
      position: firstPoint,
      title: 'Inicio',
      map: mapInstance,
      content: startPin,
    })

    const endPin = new PinElement({
      background: '#DC2626',
      borderColor: '#9B2335',
      glyphColor: '#ffffff',
      scale: 1,
    })

    endMarker = new AdvancedMarkerElement({
      position: lastPoint,
      title: 'Fin',
      map: mapInstance,
      content: endPin,
    })
  }

  fitBoundsIfPossible(allBoundsSources)
}

onMounted(async () => {
  if (!mapContainer.value) return

  statusMessage.value = ''

  try {
    const maps = await loadGoogleMapsApi()

    mapInstance = new maps.Map(mapContainer.value, {
      center: { lat: -33.4489, lng: -70.6693 },
      zoom: 11,
      mapId: GOOGLE_MAPS_MAP_ID,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    })

    rawPointInfoWindow = new maps.InfoWindow()

    await redrawRoute()
  } catch (error) {
    console.error(error)
    statusMessage.value =
      error instanceof Error ? error.message : 'No se pudo inicializar Google Maps.'
  }
})

watch(
  () => [props.rawPoints, props.snappedPoints],
  () => {
    void redrawRoute()
  },
  { deep: true },
)

onBeforeUnmount(() => {
  clearLayers()
  rawPointInfoWindow = null
  mapInstance = null
})
</script>

<template>
  <div class="h-full w-full rounded-xl overflow-hidden bg-slate-100 relative">
    <div ref="mapContainer" class="h-full w-full" />
    <div
      v-if="statusMessage"
      class="absolute inset-0 flex items-center justify-center p-6 text-center text-sm font-medium text-red-700 bg-white/80"
    >
      {{ statusMessage }}
    </div>
  </div>
</template>