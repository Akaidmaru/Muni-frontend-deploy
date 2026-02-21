<script setup>
import { MapPin, Phone, Mail } from 'lucide-vue-next'
</script>

<template>
  <div class="min-h-screen bg-background">
     <!-- Map Section -->
     <div class="h-64 sm:h-80 md:h-96 w-full relative bg-gray-300">
         <iframe 
           src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14986.993779836562!2d-70.151!3d-20.213!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjDCsDEyJzQ2LjgiUyA3MMKwMDknMDMuNiJX!5e0!3m2!1sen!2scl!4v1600000000000!5m2!1sen!2scl" 
           width="100%" 
           height="100%" 
           style="border:0;" 
           allowfullscreen="" 
           loading="lazy" 
           referrerpolicy="no-referrer-when-downgrade"
           class="absolute inset-0 grayscale opacity-90"
         ></iframe>
         
         <div class="absolute inset-0 bg-primary/10 mix-blend-multiply pointer-events-none"></div>
     </div>

     <!-- Contact Info Section -->
     <div class="container mx-auto px-4 -mt-20 relative z-10 pb-12">
        <div class="bg-white rounded-lg shadow-xl p-8 max-w-lg mx-auto md:ml-auto md:mr-12">
            <!-- H1 equivalent #0F0F0F Inter -->
            <h1 class="text-h1 font-titles font-semibold text-text-title mb-6">Contáctanos</h1>
            
            <div class="space-y-6">
                <!-- Address -->
                <div class="flex items-start gap-4">
                    <div class="bg-background-alt p-3 rounded-full shrink-0">
                        <MapPin class="w-6 h-6 text-text-main" />
                    </div>
                    <div>
                        <!-- H3/H4 equivalent usage for headers inside card -->
                        <h3 class="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-1 font-body">Dirección</h3>
                        <p class="text-text-main font-medium font-body text-body">Baquedano 958, Iquique</p>
                    </div>
                </div>

                <!-- Phone -->
                <div class="flex items-start gap-4">
                     <div class="bg-background-alt p-3 rounded-full shrink-0">
                        <Phone class="w-6 h-6 text-text-main" />
                    </div>
                    <div>
                        <h3 class="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-1 font-body">Teléfono</h3>
                         <p class="text-text-main font-medium font-body text-body">+569 59706398</p>
                    </div>
                </div>

                <!-- Email -->
                 <div class="flex items-start gap-4">
                     <div class="bg-background-alt p-3 rounded-full shrink-0">
                        <Mail class="w-6 h-6 text-text-main" />
                    </div>
                    <div>
                        <h3 class="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-1 font-body">Email</h3>
                         <p class="text-text-main font-medium font-body text-body break-all">trans.floresvargas@gmail.com</p>
                    </div>
                </div>
            </div>
        </div>
     </div>
  </div>
</template>
