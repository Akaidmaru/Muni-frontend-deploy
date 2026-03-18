import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useTripsStore = defineStore('trips', () => {
    // Array para almacenar los viajes completados (mockeo temporal para Historial)
    const completedTrips = ref([])

    /**
     * Añade un viaje al historial si cumple con los requerimientos mínimos.
     * @param {Object} tripObj Objeto con la información completa del viaje
     */
    function addCompletedTrip(tripObj) {
        // Asegurarse de que el objeto tiene fecha y patente
        if (!tripObj || !tripObj.date || !tripObj.licensePlate) {
            console.error('Viaje inválido:', tripObj)
            return
        }

        completedTrips.value.push({
            // Datos comunes
            date: tripObj.date,
            licensePlate: tripObj.licensePlate,
            startTime: tripObj.startTime || '00:00',
            endTime: tripObj.endTime || '00:00',
            destination: tripObj.destination || 'Sin destino',
            
            // Datos de conductores (Registro Diario)
            startKm: tripObj.startKm || null,
            endKm: tripObj.endKm || null,
            official: tripObj.official || null,
            signature: Boolean(tripObj.signature), // Simular firma
            
            // Datos de funcionarios (Registro Funcionario)
            patient: tripObj.patient || null,
            patientSignature: Boolean(tripObj.patientSignature),
        })
    }

    return {
        completedTrips,
        addCompletedTrip
    }
})
