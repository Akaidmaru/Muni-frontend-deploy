<script setup>
import { Users, Package } from 'lucide-vue-next'
import ServiceCard from '../components/ServiceCard.vue'
import servicePassengerImg from '@/assets/images/service-passenger.png'
import serviceCargoImg from '@/assets/images/service-cargo.png'
import clientIquiqueImg from '@/assets/images/client-iquique.png'
import whatsappIcon from '@/assets/images/icon-whatsapp.png'
import heroBgImg from '@/assets/images/hero-bg.png'

// Mock Clients Data
const clients = [
  { name: 'Municipalidad de Iquique', logo: clientIquiqueImg },
  // Add more mocks if needed
]
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Hero Section with Truck Background -->
    <div class="relative h-[500px] w-full mb-12">
       <img :src="heroBgImg" alt="Fondo Camión" class="w-full h-full object-cover" />
       
       <!-- Overlay Card -->
       <div class="absolute inset-0 flex items-center justify-center px-4">
           <div class="bg-white p-8 md:p-12 rounded-lg shadow-2xl max-w-2xl text-center">
               <p class="text-text-secondary font-body text-body leading-relaxed mb-6">
                 Nuestro compromiso es con la confianza. Somos una empresa que ofrece servicios de transporte de carga y pasajeros, con el enfoque de ofrecer siempre altos estándares de calidad en logística.
               </p>
               <router-link 
                 to="/contacto"
                 class="inline-block bg-primary hover:bg-primary-hover text-white font-button text-btn font-bold px-8 py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-1 active:scale-95 transform"
               >
                 Cuéntanos tu necesidad
               </router-link>
           </div>
       </div>
    </div>

    <!-- Services Section -->
    <div class="bg-white py-12">
      <div class="container mx-auto px-4 md:px-8">
         <div class="text-center mb-10">
            <h2 class="text-h1 font-titles font-semibold text-text-title mb-2">Nuestros servicios</h2>
            <p class="text-text-secondary font-body text-body">Soluciones de transporte confiables y eficientes</p>
         </div>

         <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <ServiceCard 
            title="Transporte de pasajeros" 
            :icon="Users"
            description="Ofrecemos servicios de transporte de pasajeros con vehículos modernos y cómodos."
            :features="['Flota moderna y bien mantenida', 'Conductores profesionales', 'Seguro de viajeros incluido']"
            :image="servicePassengerImg"
          />

          <ServiceCard 
            title="Transporte de carga" 
            :icon="Package"
            description="Servicios especializados en transporte de carga y logística. Movemos tu mercancía de manera segura y eficiente a cualquier destino nacional."
            :features="['Carga completa y consolidada', 'Rastreo GPS en tiempo real', 'Seguro de mercancía']"
            :image="serviceCargoImg"
          />
        </div>
      </div>
    </div>

    <!-- Clients Section -->
    <div class="py-16 bg-background-alt">
       <div class="container mx-auto px-4 text-center">
           <h2 class="text-h1 font-titles font-semibold text-text-title mb-2">Nuestros clientes</h2>
           <p class="text-text-secondary font-body text-body mb-10">Empresas que confían en nuestros servicios</p>
           
           <div class="flex flex-wrap justify-center items-center gap-12grayscale hover:grayscale-0 transition-all duration-300">
               <!-- Client Logo Card -->
               <div class="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow flex items-center justify-center h-48 w-96 max-w-full">
                  <img :src="clients[0].logo" alt="Municipalidad de Iquique" class="max-h-32 object-contain" />
               </div>
           </div>
       </div>
    </div>
  </div>
</template>
