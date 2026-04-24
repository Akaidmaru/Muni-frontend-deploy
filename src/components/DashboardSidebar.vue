<script setup>
import { ref, defineExpose } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSidebarStore } from '@/stores/sidebar'
import registroIcon from '@/assets/images/Registro.png'
import historialIcon from '@/assets/images/Historial.png'
import tableIcon from '@/assets/images/Images admin nabvar left/table.png'
import warningIcon from '@/assets/images/admin/warning.png'
import repairIcon from '@/assets/images/admin/repair.png'
import anadirGrupoIcon from '@/assets/images/Images admin nabvar left/anadir-grupo.png'
import camionIcon from '@/assets/images/Images admin nabvar left/camion.png'
import destinoIcon from '@/assets/images/Images admin nabvar left/destino.png'
import funcionarioIcon from '@/assets/images/Images admin nabvar left/funcionario.png'
import viajesIcon from '@/assets/images/Images admin nabvar left/agencia-de-viajes.png'
import dailyMaintenanceIcon from '@/assets/images/admin/tareas-diarias.png'
import monthlyMaintenanceIcon from '@/assets/images/admin/calendario.png'
import estadisticasIcon from '@/assets/images/Images admin nabvar left/stadistics.png'
import ReportProblemModal from './ReportProblemModal.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const sidebarStore = useSidebarStore()
const { open, adminDropdowns: openDropdowns, mobileFiltersOverlayOpen } = storeToRefs(sidebarStore)
const { setOpen, toggleAdminDropdown } = sidebarStore

defineExpose({ isOpen: open })

const allNavItems = {
  DRIVER: [
    { label: 'Registro\ndiario', path: '/registro-diario', icon: registroIcon, alt: 'Registro diario' },
    { label: 'Historial de\nviajes', path: '/historial-viajes', icon: historialIcon, alt: 'Historial de viajes' },
  ],
  EMPLOYEE: [
    { label: 'Registro\ndiario', path: '/registro-diario-funcionario', icon: registroIcon, alt: 'Registro diario' },
    { label: 'Historial de\nviajes', path: '/historial-viajes-funcionario', icon: historialIcon, alt: 'Historial de viajes' },
  ],
ADMIN: [
    {
      label: 'Registro',
      icon: tableIcon,
      alt: 'Registro',
      path: '/admin/registro',
      id: 'registro',
      subItems: [
        { label: 'Usuarios',    path: '/admin/gestion-usuarios', icon: anadirGrupoIcon, alt: 'Usuarios'      },
        { label: 'Vehículos',   path: '/admin/vehiculos',         icon: camionIcon,       alt: 'Vehículos'    },
        { label: 'Destinos',    path: '/admin/destinos',          icon: destinoIcon,      alt: 'Destinos'      },
        { label: 'Funcionario', path: '/admin/funcionarios',      icon: funcionarioIcon,  alt: 'Funcionario'   }
      ],
    },
    {
      label: 'Mantenciones',
      icon: repairIcon,
      alt: 'Mantenciones',
      path: '/admin/mantencion-vehicular',
      id: 'mantenimiento',
      subItems: [
        { label: 'Diarias', path: '/admin/mantencion-vehicular/diario', icon: dailyMaintenanceIcon, alt: 'Mantención diaria' },
        { label: 'Mensuales', path: '/admin/mantencion-vehicular/historial-mensual', icon: monthlyMaintenanceIcon, alt: 'Mantención mensual' },
      ],
    },
    { label: 'Estadísticas', path: '/admin/mantencion-vehicular/estadisticas', icon: estadisticasIcon, alt: 'Estadísticas' },
    { label: 'Historial de\nviajes', path: '/historial-viajes-admin', icon: historialIcon, alt: 'Historial de viajes' },
    { label: 'Reportes', path: '/admin/reportes', icon: warningIcon, alt: 'Reportes' },
  ],
}

const navItems = allNavItems[auth.userRole] || allNavItems.DRIVER

const isActive = (path) => route.path === path
const isNestedSubItemActive = (subItem) =>
  Array.isArray(subItem.children) && subItem.children.some((child) => route.path === child.path)

const openNestedDropdowns = ref({
  usuarios: true,
})

const toggleNestedDropdown = (key) => {
  openNestedDropdowns.value[key] = !openNestedDropdowns.value[key]
}

/** Móvil (max-width 767px): al navegar desde el menú, cerrar el panel desplegable */
function closeMenuIfMobile() {
  if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
    setOpen(false)
  }
}

const navigate = (path) => {
  router.push(path)
  closeMenuIfMobile()
}

const navigateParent = (path, label) => {
  if (label) {
    toggleAdminDropdown(label)
  }
  if (path) {
    router.push(path)
    closeMenuIfMobile()
  }
}

const toggleOnly = (label) => {
  if (label) {
    toggleAdminDropdown(label)
  }
}

const isReportModalOpen = ref(false)

const reportProblem = () => {
  setOpen(false)
  isReportModalOpen.value = true
}
</script>

<template>
  <div
    class="fixed md:relative h-screen max-h-dvh md:h-full md:max-h-none md:min-h-0 self-stretch transition-all duration-300 ease-in-out flex flex-col z-50 shrink-0"
    :class="
      open
        ? 'w-48 flex-shrink-0 bg-white border-r border-gray-200 shadow-xl'
        : 'w-0 overflow-visible md:w-10 md:min-w-[2.5rem] md:max-w-[2.5rem] md:overflow-hidden md:border-transparent md:bg-background md:shadow-none'
    "
  >
    <!-- Overlay solo en móvil -->
    <Teleport to="body">
      <div
        v-if="open"
        class="fixed inset-0 bg-black/30 z-40 md:hidden"
        @click="setOpen(false)"
      />
    </Teleport>
    <!-- Móvil: en body con fixed para no quedar recortada por overflow-hidden de ancestros; Escritorio: al borde de la raíz w-0 -->
    <Teleport to="body">
      <button
        v-if="!open && !mobileFiltersOverlayOpen"
        type="button"
        @click="setOpen(true)"
        aria-label="Abrir menú"
        class="md:hidden fixed left-2 top-20 z-[100] flex flex-col justify-center items-center gap-[5px] w-9 h-9 rounded-md border border-gray-300 bg-white shadow-sm hover:border-primary transition-all"
      >
        <span v-for="i in 3" :key="i" class="block w-4 h-[2px] bg-gray-600 rounded-full" />
      </button>
    </Teleport>
    <button
      v-if="!open"
      type="button"
      @click="setOpen(true)"
      aria-label="Abrir menú"
      class="hidden md:flex md:relative z-50 mx-auto mt-2.5 shrink-0 flex-col justify-center items-center gap-[5px] w-9 h-9 rounded-md border border-gray-300 bg-white shadow-sm hover:border-primary transition-all"
    >
      <span v-for="i in 3" :key="i" class="block w-4 h-[2px] bg-gray-600 rounded-full" />
    </button>

    <div v-show="open" class="h-full w-full min-h-0 flex-1 min-w-0 overflow-hidden">
    <div class="flex flex-col h-full w-48 min-w-48 flex-shrink-0">
      <div class="flex justify-end px-2 pt-2">
        <button
          @click="setOpen(false)"
          aria-label="Cerrar men\xFA"
          class="w-6 h-6 rounded border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary transition-all active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <nav class="flex flex-col flex-1 overflow-y-auto">
          <template v-for="item in navItems">
            <div
              v-if="item && item.subItems"
              class="bg-gray-50 border-b border-gray-200"
            >
              <div class="flex items-center gap-3 px-3 py-3 w-full group hover:bg-gray-100 transition-colors">
                <img
                  v-if="item.icon"
                  :src="item.icon"
                  :alt="item.alt"
                  class="w-7 h-7 shrink-0 object-contain"
                />
                <button
                  @click="navigateParent(item.path, item.label)"
                  class="min-w-0 flex-1 text-left"
                >
                  <span class="text-sm font-titles font-semibold leading-snug whitespace-pre-line transition-colors"
                        :class="item.path && isActive(item.path) ? 'text-primary' : 'text-slate-700 group-hover:text-primary'">
                    {{ item.label }}
                  </span>
                </button>
                <button
                  @click="toggleOnly(item.label)"
                  class="p-1 rounded hover:bg-gray-200 transition-colors"
                >
                  <svg
                    class="w-4 h-4 text-slate-400 transition-transform duration-150 transform"
                    :class="openDropdowns[item.label] ? 'rotate-90' : '-rotate-90'"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <polyline points="9 6 15 12 9 18" />
                  </svg>
                </button>
              </div>
            </div>

            <div
              v-if="item && item.subItems && openDropdowns[item.label]"
              class="relative flex flex-col py-1 bg-white"
            >
              <template v-for="(sub, idx) in item.subItems" :key="sub.path || sub.label">
                <button
                  v-if="!sub.children"
                  @click="navigate(sub.path)"
                  class="relative flex items-center gap-2 py-3 pl-6 pr-3 w-full text-left group"
                >
                  <div v-if="idx !== 0" class="absolute left-5 top-0 h-1/2 w-px bg-gray-300" />
                  <div v-if="idx !== item.subItems.length - 1" class="absolute left-5 top-1/2 bottom-0 w-px bg-gray-300" />
                  <span class="absolute left-5 top-1/2 h-px w-4 bg-gray-300 -translate-y-1/2" />
                  <div class="relative z-10 shrink-0 ml-4">
                    <img
                      v-if="sub.icon"
                      :src="sub.icon"
                      :alt="sub.alt"
                      class="w-7 h-7 object-contain transition-transform duration-150 group-hover:scale-110"
                    />
                  </div>
                  <span
                    class="text-sm font-titles font-semibold transition-colors leading-tight"
                    :class="isActive(sub.path) ? 'text-primary font-bold' : 'text-slate-700 group-hover:text-primary'"
                  >{{ sub.label }}</span>
                </button>

                <div v-else class="relative">
                  <div v-if="idx !== 0" class="absolute left-5 top-0 h-1/2 w-px bg-gray-300" />
                  <div v-if="idx !== item.subItems.length - 1 || (openNestedDropdowns[sub.nestedKey] ?? false)" class="absolute left-5 top-1/2 bottom-0 w-px bg-gray-300" />
                  <span class="absolute left-5 top-6 h-px w-4 bg-gray-300" />
                  <button
                    @click="toggleNestedDropdown(sub.nestedKey)"
                    class="relative flex items-center gap-2 py-3 pl-6 pr-3 w-full text-left group"
                  >
                    <div class="relative z-10 shrink-0 ml-4">
                      <img
                        v-if="sub.icon"
                        :src="sub.icon"
                        :alt="sub.alt"
                        class="w-7 h-7 object-contain transition-transform duration-150 group-hover:scale-110"
                      />
                    </div>
                    <span
                      class="text-sm font-titles font-semibold transition-colors leading-tight flex-1"
                      :class="isNestedSubItemActive(sub) ? 'text-primary font-bold' : 'text-slate-700 group-hover:text-primary'"
                    >{{ sub.label }}</span>
                    <svg
                      class="w-4 h-4 text-slate-400 transition-transform duration-150"
                      :class="(openNestedDropdowns[sub.nestedKey] ?? false) ? 'rotate-90' : ''"
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    >
                      <polyline points="9 6 15 12 9 18" />
                    </svg>
                  </button>
                  <div
                    v-if="openNestedDropdowns[sub.nestedKey] ?? false"
                    class="relative pb-1"
                  >
                    <button
                      v-for="child in sub.children"
                      :key="child.path"
                      @click="navigate(child.path)"
                      class="relative flex items-center gap-2 py-2.5 pl-12 pr-3 w-full text-left group"
                    >
                      <div class="absolute left-9 top-0 h-full w-px bg-gray-200" />
                      <span class="absolute left-9 top-1/2 h-px w-4 bg-gray-200 -translate-y-1/2" />
                      <span
                        class="text-xs font-titles font-semibold transition-colors leading-tight"
                        :class="isActive(child.path) ? 'text-primary font-bold' : 'text-slate-600 group-hover:text-primary'"
                      >{{ child.label }}</span>
                    </button>
                  </div>
                </div>
              </template>
            </div>

            <button
              v-else-if="!item.subItems"
              @click="navigate(item.path)"
              class="flex items-center gap-3 px-3 py-3 w-full text-left group border-b border-gray-50 transition-all duration-150"
              :class="isActive(item.path) ? 'bg-blue-50/60' : 'hover:bg-gray-50'"
            >
              <img
                v-if="item.icon"
                :src="item.icon"
                :alt="item.alt"
                class="w-7 h-7 shrink-0 object-contain transition-transform duration-150 group-hover:scale-105"
              />
              <span
                class="text-sm font-titles font-semibold leading-snug whitespace-pre-line flex-1"
                :class="isActive(item.path) ? 'text-primary' : 'text-slate-700 group-hover:text-primary'"
              >{{ item.label }}</span>
            </button>
          </template>
        </nav>

        <div class="px-2 pb-3 pt-1 border-t border-gray-100">
          <button
            @click="reportProblem"
            class="flex items-center gap-2 px-2 py-2 rounded-lg w-full text-left text-slate-500 hover:bg-red-50 hover:text-red-600 group transition-all duration-150"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0 text-red-400 group-hover:text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span class="text-xs font-titles font-semibold">Reportar un problema</span>
          </button>
        </div>
    </div>
    </div>

    <Teleport to="body">
      <ReportProblemModal
        :isOpen="isReportModalOpen"
        @close="isReportModalOpen = false"
      />
    </Teleport>
  </div>
</template>
