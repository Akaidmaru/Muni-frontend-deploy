<script setup>
import { MapPin, Phone, Mail } from 'lucide-vue-next'
</script>

<template>
  <footer class="bg-gray-100 pt-16 border-t border-gray-200 flex flex-col">
    <div class="container mx-auto px-4">
      <div class="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-[auto_auto_1fr_auto] gap-6 lg:gap-8 mb-12">
        
        <!-- Column 1: Logo -->
        <div class="flex flex-col items-center md:items-start">
             <div class="mb-4">
                <img src="@/assets/images/Logo-recortado.png" alt="Transportes Flores Vargas" class="h-16 w-auto object-contain" />
             </div>
        </div>

        <!-- Column 2: Links (moved to the left, right after logo) -->
        <div class="flex items-center justify-center">
            <ul class="space-y-3 font-body text-text-secondary text-center">
                <li><a href="#" class="inline-block hover:text-primary transition-all duration-300 hover:underline hover:scale-105 decoration-2 underline-offset-4">Nosotros</a></li>
                <li><a href="#" class="inline-block hover:text-primary transition-all duration-300 hover:underline hover:scale-105 decoration-2 underline-offset-4">Quiénes somos</a></li>
                <li><a href="#" class="inline-block hover:text-primary transition-all duration-300 hover:underline hover:scale-105 decoration-2 underline-offset-4">Por qué elegirnos</a></li>
                <li><a href="#" class="inline-block hover:text-primary transition-all duration-300 hover:underline hover:scale-105 decoration-2 underline-offset-4">Preguntas frecuentes</a></li>
            </ul>
        </div>

        <!-- Column 3: Map (expanded horizontally) -->
        <div class="md:col-span-2 lg:col-span-1 rounded-lg overflow-hidden h-48 bg-gray-200 relative">
             <iframe 
               src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3747.8891234567!2d-70.1492345!3d-20.2194444!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x915214d0d0d0d0d0%3A0x0!2sBaquedano%20958%2C%20Iquique!5e0!3m2!1ses!2scl!4v1620000000000!5m2!1ses!2scl" 
               width="100%" 
               height="100%" 
               style="border:0;" 
               allowfullscreen="" 
               loading="lazy" 
               referrerpolicy="no-referrer-when-downgrade"
               class="absolute inset-0 opacity-90 hover:opacity-100 transition-opacity"
             ></iframe>
        </div>

        <!-- Column 4: Contact -->
        <div>
            <h3 class="text-h1 font-titles font-semibold text-text-title text-xl mb-6">Contáctanos</h3>
            <ul class="space-y-4">
                <li class="flex items-start gap-3 text-text-secondary font-body">
                    <img src="@/assets/images/icon-location.png" class="w-5 h-5 mt-1 shrink-0 object-contain" alt="Ubicación" />
                    <span>Baquedano 958, Iquique</span>
                </li>
                 <li class="flex items-start gap-3 text-text-secondary font-body">
                    <img src="@/assets/images/whatsapp-bn.png" class="w-5 h-5 mt-1 shrink-0 object-contain" alt="WhatsApp" />
                    <span>+569 59706398</span>
                 </li>
                 <li class="flex items-start gap-3 text-text-secondary font-body">
                    <img src="@/assets/images/icon-email.png" class="w-5 h-5 mt-1 shrink-0 object-contain" alt="Email" />
                    <span>trans.floresvargas@gmail.com</span>
                 </li>
            </ul>
        </div>

      </div>
    </div>

    <!-- Copyright (Full Width) -->
    <div class="bg-black w-full border-t border-gray-800 py-6 mt-8 text-center">
      <p class="font-legal text-legal text-gray-300">
        &copy; {{ new Date().getFullYear() }} Transportes Flores Vargas SPA. Todos los derechos reservados.
      </p>
    </div>
  </footer>
</template>
