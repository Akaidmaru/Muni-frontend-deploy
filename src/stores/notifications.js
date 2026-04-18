import { defineStore } from 'pinia'
import { io } from 'socket.io-client'
import { ref } from 'vue'

export const useNotificationStore = defineStore('notifications', () => {
    const notifications = ref([])
    const socket = ref(null)

    function connect(token) {
        socket.value = io(import.meta.env.VITE_API_URL, {
            auth: { token }
        })

        socket.value.on('new-report', (data) => {
            addNotification({
                id: data.reportId,
                message: `Nuevo reporte: ${data.description}`,
                type: 'new-report'
            })
        })

        socket.value.on('report-resolved', (data) => {
            addNotification({
                id: data.reportId,
                message: 'Tu reporte fue resuelto ✅',
                type: 'resolved'
            })
        })
    }

    function addNotification(notif) {
        notifications.value.unshift({ ...notif, read: false, at: new Date() })
    }

    function markAllRead() {
        notifications.value.forEach(n => n.read = true)
    }

    function disconnect() {
        socket.value?.disconnect()
    }

    return { notifications, connect, markAllRead, disconnect }
})