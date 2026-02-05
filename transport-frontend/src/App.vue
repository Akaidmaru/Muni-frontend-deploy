<script setup>
<<<<<<< HEAD
import Navbar from './components/Navbar.vue'
import Footer from './components/Footer.vue'
import WhatsAppFAB from './components/WhatsAppFAB.vue'
</script>

<template>
  <div class="min-h-screen bg-background font-sans flex flex-col">
    <Navbar v-if="!['/clientes', '/registro'].includes($route.path)" />
    <main class="flex-grow">
      <RouterView />
    </main>
    <Footer v-if="!['/clientes', '/registro'].includes($route.path)" />
    
    <!-- WhatsApp FAB - visible en todas las páginas -->
    <WhatsAppFAB />
  </div>
</template>
=======
import HelloWorld from './components/HelloWorld.vue'
import TheWelcome from './components/TheWelcome.vue'
import ApiTest from './components/ApiTest.vue'
</script>

<template>
  <header>
    <img alt="Vue logo" class="logo" src="./assets/logo.svg" width="125" height="125" />

    <div class="wrapper">
      <HelloWorld msg="You did it!" />
    </div>
  </header>

  <main>
    <TheWelcome />
    <ApiTest />
  </main>
</template>

<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
>>>>>>> c0cd806041ac4512d8c8764c65d7ca9ec3a15f9a
