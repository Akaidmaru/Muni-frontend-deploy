<script setup>
import whatsappIcon from '@/assets/images/icon-whatsapp.png'

// Número de WhatsApp (puedes cambiarlo según necesites)
const whatsappNumber = '56959706398' // Formato: código país + número sin espacios ni símbolos
const message = 'Hola, me gustaría obtener más información sobre sus servicios de transporte.'

const openWhatsApp = () => {
  const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
  window.open(url, '_blank')
}
</script>

<template>
  <button
    @click="openWhatsApp"
    class="fixed right-6 top-1/2 -translate-y-1/2 flex items-center justify-center z-50 hover:scale-110 transition-all duration-300 ease-out group bg-transparent border-none p-0"
    aria-label="Contactar por WhatsApp"
  >
    <img 
      :src="whatsappIcon" 
      alt="WhatsApp" 
      class="w-12 h-12 group-hover:scale-110 transition-transform duration-300 drop-shadow-md"
    />
  </button>
</template>

<style scoped>
button {
  background: transparent !important;
  background-color: transparent !important;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  padding: 0 !important;
  -webkit-appearance: none;
  appearance: none;
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
