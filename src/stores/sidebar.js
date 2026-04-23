import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_KEY = 'muni-sidebar-open'
const DROPDOWNS_KEY = 'muni-admin-nav-dropdowns'

const DEFAULT_ADMIN_DROPDOWNS = {
  Registro: false,
  Mantenciones: false,
}

function readPersisted() {
  if (typeof sessionStorage === 'undefined') return false
  try {
    const v = sessionStorage.getItem(STORAGE_KEY)
    if (v === '1') return true
    if (v === '0') return false
  } catch {
    /* ignore */
  }
  return false
}

function readAdminDropdowns() {
  if (typeof sessionStorage === 'undefined') {
    return { ...DEFAULT_ADMIN_DROPDOWNS }
  }
  try {
    const raw = sessionStorage.getItem(DROPDOWNS_KEY)
    if (!raw) return { ...DEFAULT_ADMIN_DROPDOWNS }
    const p = JSON.parse(raw)
    return {
      Registro: Boolean(p.Registro),
      Mantenciones: Boolean(p.Mantenciones),
    }
  } catch {
    return { ...DEFAULT_ADMIN_DROPDOWNS }
  }
}

function persist(open) {
  try {
    sessionStorage.setItem(STORAGE_KEY, open ? '1' : '0')
  } catch {
    /* ignore */
  }
}

function persistAdminDropdowns(state) {
  try {
    sessionStorage.setItem(
      DROPDOWNS_KEY,
      JSON.stringify({
        Registro: state.Registro,
        Mantenciones: state.Mantenciones,
      })
    )
  } catch {
    /* ignore */
  }
}

/**
 * Estado del panel lateral (abierto/cerrado) compartido entre rutas.
 * Cada vista monta un DashboardSidebar nuevo; sin esto el menú volvería a cerrarse al navegar.
 *
 * `adminDropdowns` conserva el despliegue de "Registro" y "Mantenciones" al navegar
 * (misma razón: el componente se vuelve a montar en cada ruta).
 */
export const useSidebarStore = defineStore('sidebar', () => {
  const open = ref(readPersisted())
  const adminDropdowns = ref(readAdminDropdowns())
  /** Móvil: true cuando un panel de filtros está abierto; oculta la hamburguesa del menú. */
  const mobileFiltersOverlayOpen = ref(false)

  function setOpen(value) {
    open.value = value
    persist(value)
  }

  function toggleAdminDropdown(label) {
    if (label !== 'Registro' && label !== 'Mantenciones') return
    const next = { ...adminDropdowns.value, [label]: !adminDropdowns.value[label] }
    adminDropdowns.value = next
    persistAdminDropdowns(next)
  }

  /** Llamar al cerrar sesión para no arrastrar preferencia a otro usuario en el mismo navegador. */
  function setMobileFiltersOverlayOpen(value) {
    mobileFiltersOverlayOpen.value = Boolean(value)
  }

  function reset() {
    open.value = false
    mobileFiltersOverlayOpen.value = false
    adminDropdowns.value = { ...DEFAULT_ADMIN_DROPDOWNS }
    try {
      sessionStorage.removeItem(STORAGE_KEY)
      sessionStorage.removeItem(DROPDOWNS_KEY)
    } catch {
      /* ignore */
    }
  }

  return {
    open,
    setOpen,
    adminDropdowns,
    toggleAdminDropdown,
    mobileFiltersOverlayOpen,
    setMobileFiltersOverlayOpen,
    reset,
  }
})
