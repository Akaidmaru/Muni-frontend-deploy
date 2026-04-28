<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import logoCompleto from '@/assets/images/Logo-completo.png'
import DashboardSidebar from '@/components/DashboardSidebar.vue'
import UserMenu from '@/components/UserMenu.vue'
import anadirGrupoIcon from '@/assets/images/Images admin nabvar left/anadir-grupo.png'
import camionIcon from '@/assets/images/Images admin nabvar left/camion.png'
import destinoIcon from '@/assets/images/Images admin nabvar left/destino.png'
import funcionarioIcon from '@/assets/images/Images admin nabvar left/funcionario.png'
import documentosIcon from '@/assets/images/Images admin nabvar left/enviar-archivo.png'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const adminCards = [
  { label: 'Usuarios',    icon: anadirGrupoIcon,  path: '/admin/gestion-usuarios' },
  { label: 'Vehículos',   icon: camionIcon,        path: '/admin/vehiculos'        },
  { label: 'Destinos',    icon: destinoIcon,       path: '/admin/destinos'         },
  { label: 'Funcionario', icon: funcionarioIcon,   path: '/admin/funcionarios'     },
  { label: 'Documentos',  icon: documentosIcon,    path: '/admin/documentos'       },
]

const directionCards = [
  { label: 'Conductores', icon: anadirGrupoIcon, path: '/admin/gestion-usuarios' },
  { label: 'Vehículos',   icon: camionIcon,      path: '/admin/vehiculos'        },
  { label: 'Destinos',    icon: destinoIcon,     path: '/admin/destinos'         },
]

const cards = computed(() => authStore.isDireccion ? directionCards : adminCards)
</script>

<template>
  <div class="h-screen min-h-0 overflow-hidden bg-gray-100 flex flex-col">
    <header class="shrink-0 bg-white shadow-sm border-b border-gray-200 px-4 py-4 flex items-center justify-between z-40">
      <router-link to="/"><img :src="logoCompleto" alt="Logo" class="h-16 w-auto object-contain" /></router-link>
      <UserMenu />
    </header>

    <div class="flex flex-1 min-h-0 overflow-hidden relative">
      <DashboardSidebar />

      <main class="flex-1 min-h-0 overflow-y-auto flex flex-col pl-4 pr-4 sm:pr-6 lg:pr-8 pt-4 pb-10 min-w-0">
        <div class="bg-white rounded-[2rem] border-2 border-slate-300 shadow-sm flex-1 flex flex-col overflow-hidden w-full min-w-0">
          <div class="px-6 sm:px-8 pt-6 pb-1 shrink-0">
            <button @click="router.back()" class="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary transition-colors py-1">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Volver
            </button>
          </div>
          <div class="flex-1 flex flex-col items-center justify-center px-6 py-8 sm:px-8 sm:py-10">
            <div class="w-full max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl flex flex-col gap-5">
            <button
              v-for="card in cards"
              :key="card.label"
              @click="router.push(card.path)"
              class="flex items-center gap-8 bg-white border border-gray-200 rounded-2xl px-10 py-8 lg:px-14 lg:py-10 shadow-sm hover:shadow-lg hover:border-primary transition-all duration-200 text-left group w-full"
            >
              <img :src="card.icon" :alt="card.label" class="w-16 h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 object-contain shrink-0 transition-transform duration-200 group-hover:scale-110" />
              <span class="text-2xl lg:text-3xl xl:text-4xl font-titles font-semibold text-slate-800 group-hover:text-primary transition-colors">{{ card.label }}</span>
            </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>
