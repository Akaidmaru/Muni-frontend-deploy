<script setup>
import { Check } from 'lucide-vue-next'

defineProps({
  title: String,
  icon: Object, 
  image: String,
  description: String,
  features: Array
})
</script>

<template>
  <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden flex flex-col h-full hover:shadow-[0_20px_60px_rgba(59,130,246,0.3)] hover:-translate-y-4 hover:scale-105 hover:border-blue-400 transition-all duration-500 ease-out transform">
    <!-- Icon & Title Header -->
    <div class="p-6 md:p-8 flex flex-col items-center text-center">
      <div class="w-16 h-16 bg-blue-100/50 rounded-full flex items-center justify-center mb-4 text-black">
        <component :is="icon" class="w-8 h-8 md:w-10 md:h-10 opacity-100" stroke-width="1.5" />
      </div>
      <!-- H3/H4 equivalent: Medium, 25px, #2A2A2A -->
      <h3 class="text-h3 font-titles font-medium text-text-subtitle">{{ title }}</h3>
    </div>

    <!-- Image -->
    <div class="w-full h-48 md:h-64 overflow-hidden px-4">
      <div class="w-full h-full rounded-xl bg-gray-200 relative overflow-hidden group">
         <img v-if="image" :src="image" :alt="title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
         <div v-else class="w-full h-full bg-slate-200 flex items-center justify-center text-gray-400">
            Imagen Referencial
         </div>
      </div>
    </div>

    <!-- Content -->
    <div class="p-6 md:p-8 flex-1 flex flex-col">
      <!-- Body text: Montserrat, 16px, #5A5A5A -->
      <p class="text-text-secondary font-body text-body text-center mb-6 leading-relaxed">
        {{ description }}
      </p>

      <ul class="space-y-3 mt-auto">
        <li v-for="(feature, index) in features" :key="index" class="flex items-start gap-3">
          <Check class="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <span class="text-text-secondary font-body text-sm-body md:text-body">{{ feature }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>
