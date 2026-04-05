<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import registroIcon from '@/assets/images/Registro.png'
import historialIcon from '@/assets/images/Historial.png'
import tableIcon from '@/assets/images/Images admin nabvar left/table.png'
import warningIcon from '@/assets/images/admin/warning.png'
import repairIcon from '@/assets/images/admin/repair.png'
import anadirGrupoIcon from '@/assets/images/Images admin nabvar left/anadir-grupo.png'
import camionIcon from '@/assets/images/Images admin nabvar left/camion.png'
import destinoIcon from '@/assets/images/Images admin nabvar left/destino.png'
import viajesIcon from '@/assets/images/Images admin nabvar left/agencia-de-viajes.png'
import ReportProblemModal from './ReportProblemModal.vue'

const router = useRouter()
const route  = useRoute()
const auth   = useAuthStore()

const open = ref(false)

// Definir items de navegación según rol
const allNavItems = {
  DRIVER: [
    { label: 'Registro\ndiario',    path: '/registro-diario',  icon: registroIcon,  alt: 'Registro diario' },
    { label: 'Historial de\nviajes', path: '/historial-viajes', icon: historialIcon, alt: 'Historial de viajes' }
  ],
  EMPLOYEE: [
    { label: 'Registro\ndiario',    path: '/registro-diario-funcionario',  icon: registroIcon,  alt: 'Registro diario' },
    { label: 'Historial de\nviajes', path: '/historial-viajes-funcionario', icon: historialIcon, alt: 'Historial de viajes' }
  ],
  ADMIN: [
    { 
      label: 'Registro', 
      icon: tableIcon,  
      alt: 'Registro',
      subItems: [
        { label: 'Usuarios', path: '/admin/gestion-usuarios', icon: anadirGrupoIcon, alt: 'Usuarios' },
        { label: 'Vehículos', path: '/admin/vehiculos', icon: camionIcon, alt: 'Vehículos' },
        { label: 'Destinos', path: '/admin/destinos', icon: destinoIcon, alt: 'Destinos' },
        { label: 'Viajes', path: '/admin/viajes', icon: viajesIcon, alt: 'Viajes' }
      ]
    },
    { label: 'Historial de\nviajes', path: '/historial-viajes-admin', icon: historialIcon, alt: 'Historial de viajes' },
    { label: 'Reportes', path: '/admin/reportes', icon: warningIcon, alt: 'Reportes' },
    { label: 'Mantenimiento\nvehicular', path: '/admin/mantencion-vehicular', icon: repairIcon, alt: 'Mantenimiento vehicular' }
  ],
}

// Usar items del rol actual, o un set por defecto
const navItems = allNavItems[auth.userRole] || allNavItems.DRIVER

const isActive = (path) => route.path === path
const isSubItemActive = (subItems) => subItems.some(sub => route.path === sub.path)

const openDropdowns = ref({
  'Registro': true // Opcional: Para que inicie abierto si estamos en una ruta de registro
})

const toggleDropdown = (label) => {
  openDropdowns.value[label] = !openDropdowns.value[label]
}

const navigate = (path) => {
  router.push(path)
  open.value = false
}

const isReportModalOpen = ref(false)

const reportProblem = () => {
  open.value = false
  isReportModalOpen.value = true
}
</script>

<template>
  <div :class="open ? 'relative z-40 self-start' : 'w-0 overflow-visible relative z-40 self-start'">

    <!-- ── CERRADO: solo el botón ≡ (overlay, no ocupa espacio en el flex) ── -->
    <button
      v-if="!open"
      @click="open = true"
      aria-label="Abrir menú"
      class="absolute top-3 left-3 flex flex-col justify-center items-center gap-[5px] w-9 h-9 rounded-md border border-gray-300 bg-white shadow-sm hover:border-primary hover:bg-gray-50 transition-all duration-150"
    >
      <span v-for="i in 3" :key="i" class="block w-4 h-[2px] bg-gray-600 rounded-full" />
    </button>

    <!-- ── ABIERTO: panel sidebar ── -->
    <transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 -translate-x-3"
      enter-to-class="opacity-100 translate-x-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-x-0"
      leave-to-class="opacity-0 -translate-x-3"
    >
      <div
        v-if="open"
        class="relative w-48 bg-white border-r border-gray-200 shadow-sm flex flex-col"
        style="min-height: calc(100vh - 88px);"
      >
        <!-- Botón colapsar (◁) en el borde derecho -->
        <button
          @click="open = false"
          aria-label="Cerrar menú"
          class="absolute -right-3 top-4 w-6 h-6 rounded-full bg-white border border-gray-300 shadow flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <!-- Items de navegación -->
        <nav class="flex flex-col gap-1 pt-6 px-2 flex-1 overflow-y-auto">
          <template v-for="item in navItems" :key="item.label">
            <!-- Botón Principal o Padre de Dropdown -->
            <button
              @click="item.subItems ? toggleDropdown(item.label) : navigate(item.path)"
              class="flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 w-full text-left group relative"
              :class="(item.path && isActive(item.path)) || (item.subItems && isSubItemActive(item.subItems))
                ? 'bg-blue-50 text-primary'
                : 'text-text-title hover:bg-gray-50 hover:text-primary'"
            >
              <img
                v-if="item.icon"
                :src="item.icon"
                :alt="item.alt"
                class="w-8 h-8 shrink-0 object-contain transition-transform duration-150 group-hover:scale-110"
              />
              <span
                v-else-if="item.emoji"
                class="w-8 h-8 shrink-0 flex items-center justify-center text-xl transition-transform duration-150 group-hover:scale-110"
              >
                {{ item.emoji }}
              </span>
              <span
                class="text-sm font-titles font-semibold leading-tight whitespace-pre-line flex-1"
                :class="(item.path && isActive(item.path)) || (item.subItems && isSubItemActive(item.subItems)) ? 'text-primary' : 'text-text-title'"
              >{{ item.label }}</span>
              
              <!-- Icono flecha para dropdown -->
              <svg v-if="item.subItems" 
                   xmlns="http://www.w3.org/2000/svg" 
                   class="w-4 h-4 text-gray-400 transition-transform duration-200"
                   :class="openDropdowns[item.label] ? 'rotate-180' : ''"
                   fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Contenido del Dropdown -->
            <div v-if="item.subItems && openDropdowns[item.label]" class="flex flex-col gap-1 mt-1 ml-4 border-l-2 border-gray-100 pl-2">
              <button
                v-for="sub in item.subItems"
                :key="sub.path"
                @click="navigate(sub.path)"
                class="flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150 w-full text-left group"
                :class="isActive(sub.path)
                  ? 'bg-blue-50 text-primary font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-primary'"
              >
                <img
                  v-if="sub.icon"
                  :src="sub.icon"
                  :alt="sub.alt"
                  class="w-6 h-6 shrink-0 object-contain transition-transform duration-150 group-hover:scale-110"
                />
                <span
                  class="text-xs font-titles"
                  :class="isActive(sub.path) ? 'text-primary font-semibold' : 'text-gray-600 group-hover:text-primary'"
                >{{ sub.label }}</span>
              </button>
            </div>
          </template>
        </nav>

        <!-- Reportar un problema -->
        <div class="px-2 pb-4 pt-1">
          <button
            @click="reportProblem"
            class="flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 w-full text-left text-gray-500 hover:bg-orange-50 hover:text-orange-600 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0 text-red-500 group-hover:text-orange-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span class="text-sm font-titles font-semibold">Reportar un problema</span>
          </button>
        </div>
      </div>
    </transition>

    <!-- Backdrop para cerrar al hacer click fuera -->
    <div v-if="open" class="fixed inset-0 z-[-1]" @click="open = false" />

    <Teleport to="body">
      <ReportProblemModal 
        :isOpen="isReportModalOpen" 
        @close="isReportModalOpen = false" 
      />
    </Teleport>
  </div>
</template>
