import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

const STORAGE_KEY = 'vehicle-out-of-service-alerts'

const readStoredAlerts = () => {
    if (typeof window === 'undefined') {
        return []
    }

    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return []

        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}

export const useVehicleAlertsStore = defineStore('vehicle-alerts', () => {
    const alerts = ref(readStoredAlerts())

    const persist = () => {
        if (typeof window === 'undefined') return
        localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts.value))
    }

    const syncFromStorage = () => {
        alerts.value = readStoredAlerts()
    }

    const criticalAlerts = computed(() =>
        [...alerts.value].sort(
            (a, b) =>
                new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime(),
        ),
    )

    const outOfServiceCount = computed(() => criticalAlerts.value.length)

    const addOutOfServiceAlert = ({
        plate,
        driver,
        reason,
        category,
        reportedAt = new Date().toISOString(),
    }) => {
        alerts.value.unshift({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            plate,
            driver,
            reason,
            category,
            reportedAt,
        })
        persist()
    }

    return {
        alerts,
        criticalAlerts,
        outOfServiceCount,
        syncFromStorage,
        addOutOfServiceAlert,
    }
})
