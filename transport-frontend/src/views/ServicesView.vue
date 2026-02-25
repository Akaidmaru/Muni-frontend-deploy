<script setup>
import { Users, Package } from 'lucide-vue-next'
import ServiceCard from '../components/ServiceCard.vue'
import servicePassengerImg from '@/assets/images/service-passenger.png'
import serviceCargoImg from '@/assets/images/service-cargo.png'
</script>

<template>
  <div class="min-h-screen bg-background pb-12">
    <!-- Header -->
    <div class="pt-8 pb-4 text-center relative">
      <!-- H1/H2 equivalent: SemiBold, 40px, #0F0F0F -->
      <h1 class="text-h1 font-titles font-semibold text-text-title mb-2">Nuestros servicios</h1>
      <p class="text-text-secondary font-body text-body">Soluciones de transporte confiables y eficientes</p>
      

    </div>

    <div class="container mx-auto px-4 md:px-8 mt-8">
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
</template>
