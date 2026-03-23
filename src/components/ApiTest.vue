<template>
  <div>
    <h2>Prueba de conexión al backend</h2>
    <button @click="testApi">Probar conexión</button>
    <div v-if="result">
      <strong>Respuesta:</strong>
      <pre>{{ result }}</pre>
    </div>
    <div v-if="error">
      <strong>Error:</strong>
      <pre>{{ error }}</pre>
    </div>
  </div>
</template>

<script>
import api from '../services/axios';

export default {
  name: 'ApiTest',
  data() {
    return {
      result: null,
      error: null,
    };
  },
  methods: {
    async testApi() {
      this.result = null;
      this.error = null;
      try {
        // Cambia el endpoint por uno público si /users requiere autenticación
        const res = await api.get('/users');
        this.result = JSON.stringify(res.data, null, 2);
      } catch (err) {
        this.error = err.message || err.toString();
      }
    },
  },
};
</script>
