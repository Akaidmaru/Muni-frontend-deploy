<script setup>
import whatsappIcon from '@/assets/images/icon-whatsapp.png'

// Número de WhatsApp (puedes cambiarlo según necesites)
const whatsappNumber = '56912345678' // Formato: código país + número sin espacios ni símbolos
const message = 'Hola, me gustaría obtener más información sobre sus servicios de transporte.'

const openWhatsApp = () => {
  const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
  window.open(url, '_blank')
}
</script>

<template>
  <button
    @click="openWhatsApp"
    class="fixed right-6 top-1/2 -translate-y-1/2 w-13 h-13 bg-[#25D366] rounded-full shadow-lg flex items-center justify-center z-50 hover:bg-[#20BA5A] hover:scale-110 hover:shadow-[0_10px_40px_rgba(37,211,102,0.5)] transition-all duration-300 ease-out group"
    aria-label="Contactar por WhatsApp"
  >
    <img 
      :src="whatsappIcon" 
      alt="WhatsApp" 
      class="w-7 h-7 group-hover:scale-110 transition-transform duration-300"
    />
    
    <!-- Pulse animation ring -->
    <span class="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20"></span>
  </button>
</template>

<style scoped>
/* Animación de pulso personalizada para el anillo */
@keyframes ping {
  75%, 100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

.animate-ping {
  animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
}

/* Responsive: ajustar posición en móviles */
@media (max-width: 640px) {
  button {
    right: 1rem;
    bottom: 1rem;
    width: 3.5rem;
    height: 3.5rem;
  }
  
  button img {
    width: 2rem;
    height: 2rem;
  }
}
</style>
