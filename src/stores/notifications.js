import { defineStore } from 'pinia'
import { io } from 'socket.io-client'
import { ref } from 'vue'
import api from '@/services/axios'
import { useAuthStore } from '@/stores/auth'

export const useNotificationStore = defineStore('notifications', () => {
    const notifications = ref([])
    const socket = ref(null)
    const readNotificationIds = ref(new Set())
    const NOTIFICATION_TTL_MS = 3 * 24 * 60 * 60 * 1000
    let cleanupTimer = null

    const getStorageScope = () => {
        const authStore = useAuthStore()

        if (authStore.user?.id) {
            return String(authStore.user.id)
        }

        try {
            const savedUserRaw = localStorage.getItem('user')
            if (savedUserRaw) {
                const savedUser = JSON.parse(savedUserRaw)
                if (savedUser?.id) {
                    return String(savedUser.id)
                }
                if (savedUser?.email) {
                    return String(savedUser.email)
                }
            }
        } catch {
            // Fallback below.
        }

        return 'anonymous'
    }

    const getNotificationsStorageKey = () => `notifications-v1:${getStorageScope()}`
    const getReadNotificationsStorageKey = () => `notifications-read-ids-v1:${getStorageScope()}`

    const resolveApiUrl = () =>
        import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000'

    const buildCreatedMessage = (data) => {
        const title = data?.title || 'Sin titulo'
        return `Nuevo reporte recibido: ${title}`
    }

    const buildExpiryMessage = (data) => {
        const when = data?.daysUntilExpiry === 1 ? 'mañana' : 'en 7 días'
        const label = data?.documentLabel || data?.documentType || 'Documento'
        const plate = data?.plate || 'desconocido'
        const expires = data?.expiresAt || ''
        return `Camión ${plate}: ${label} vence ${when}${expires ? ` (${expires})` : ''}`
    }

    const buildUpdatedMessage = (data) => {
        const statusLabels = {
            OPEN: 'Nuevo',
            IN_REVIEW: 'En progreso',
            RESOLVED: 'Resuelto',
        }

        const statusText = statusLabels[data?.status] || data?.status || 'Sin estado'
        const title = data?.title || 'Sin titulo'
        const noteText = data?.note ? ` Nota: ${data.note}` : ''

        return `Reporte "${title}" actualizado a "${statusText}".${noteText}`
    }

    const loadReadNotifications = () => {
        try {
            const raw = localStorage.getItem(getReadNotificationsStorageKey())
            const ids = raw ? JSON.parse(raw) : []
            readNotificationIds.value = new Set(Array.isArray(ids) ? ids.map(String) : [])
        } catch {
            readNotificationIds.value = new Set()
        }
    }

    const persistReadNotifications = () => {
        localStorage.setItem(
            getReadNotificationsStorageKey(),
            JSON.stringify(Array.from(readNotificationIds.value)),
        )
    }

    const persistNotifications = () => {
        const payload = notifications.value.map((notification) => ({
            ...notification,
            at: notification.at instanceof Date ? notification.at.toISOString() : notification.at,
            expiresAt:
                notification.expiresAt instanceof Date
                    ? notification.expiresAt.toISOString()
                    : notification.expiresAt,
        }))

        localStorage.setItem(getNotificationsStorageKey(), JSON.stringify(payload))
    }

    const loadPersistedNotifications = () => {
        try {
            const raw = localStorage.getItem(getNotificationsStorageKey())
            const stored = raw ? JSON.parse(raw) : []

            if (!Array.isArray(stored)) {
                return
            }

            notifications.value = stored
                .map((notification) => ({
                    ...notification,
                    at: notification.at ? new Date(notification.at) : new Date(),
                    expiresAt: notification.expiresAt
                        ? new Date(notification.expiresAt)
                        : new Date(Date.now() + NOTIFICATION_TTL_MS),
                    read: Boolean(notification.read),
                }))
                .filter((notification) => !isExpiredNotification(notification))

            notifications.value.forEach((notification) => {
                if (notification.read) {
                    markAsReadId(notification.id)
                }
            })
        } catch {
            notifications.value = []
        }
    }

    const markAsReadId = (id) => {
        if (!id) {
            return
        }

        readNotificationIds.value.add(String(id))
    }

    const isReadId = (id) => {
        if (!id) {
            return false
        }

        return readNotificationIds.value.has(String(id))
    }

    const getNotificationTimestamp = (notification) => {
        const value = notification?.at || notification?.createdAt || Date.now()
        const timestamp = new Date(value).getTime()
        return Number.isNaN(timestamp) ? Date.now() : timestamp
    }

    const isExpiredNotification = (notification, now = Date.now()) =>
        now - getNotificationTimestamp(notification) >= NOTIFICATION_TTL_MS

    const pruneExpiredNotifications = () => {
        const now = Date.now()
        const beforeLength = notifications.value.length

        notifications.value = notifications.value.filter(
            (notification) => !isExpiredNotification(notification, now),
        )

        if (notifications.value.length !== beforeLength) {
            const activeIds = new Set(notifications.value.map((notification) => String(notification.id)))
            readNotificationIds.value = new Set(
                Array.from(readNotificationIds.value).filter((id) => activeIds.has(String(id))),
            )
            persistReadNotifications()
            persistNotifications()
        }
    }

    const startExpirationCleanup = () => {
        stopExpirationCleanup()
        cleanupTimer = window.setInterval(() => {
            pruneExpiredNotifications()
        }, 60 * 1000)
    }

    const stopExpirationCleanup = () => {
        if (cleanupTimer) {
            window.clearInterval(cleanupTimer)
            cleanupTimer = null
        }
    }

    const hasNotification = (id) =>
        notifications.value.some((item) => String(item.id) === String(id))

    const createNotificationId = (data) => {
        if (data?.timelineEntryId) {
            return `timeline-${data.timelineEntryId}`
        }

        const reportId = data?.reportId || 'unknown'
        const updatedAt = data?.updatedAt || data?.createdAt || Date.now()
        return `report-${reportId}-${updatedAt}`
    }

    async function hydrateFromReportsHistory() {
        try {
            const { data } = await api.get('/reports/me')
            const reports = Array.isArray(data) ? data : []

            const historicalNotifications = reports.flatMap((report) => {
                const timeline = Array.isArray(report.timeline) ? report.timeline : []

                return timeline
                    .filter((entry) => entry.eventType !== 'CREATED')
                    .map((entry) => ({
                        id: `timeline-${entry.id}`,
                        reportId: report.id,
                        type: 'report-updated',
                        message: buildUpdatedMessage({
                            title: report.title,
                            status: entry.newStatus,
                            note: entry.note,
                        }),
                        read: isReadId(`timeline-${entry.id}`),
                        at: entry.createdAt ? new Date(entry.createdAt) : new Date(),
                        expiresAt: entry.createdAt
                            ? new Date(new Date(entry.createdAt).getTime() + NOTIFICATION_TTL_MS)
                            : new Date(Date.now() + NOTIFICATION_TTL_MS),
                    }))
            })

            historicalNotifications.forEach((notification) => {
                if (!hasNotification(notification.id)) {
                    notifications.value.push(notification)
                }
            })

            notifications.value.sort((a, b) => new Date(b.at) - new Date(a.at))
            pruneExpiredNotifications()
            persistNotifications()
        } catch {
            // Si falla esta carga, el canal en tiempo real sigue funcionando.
        }
    }

    function connect(token) {
        if (!token) {
            return
        }

        if (socket.value?.connected) {
            return
        }

        loadReadNotifications()
        loadPersistedNotifications()
        pruneExpiredNotifications()

        socket.value = io(resolveApiUrl(), {
            auth: { token }
        })

        void hydrateFromReportsHistory()
        startExpirationCleanup()

        socket.value.on('report:created', (data) => {
            const notificationId = createNotificationId(data)
            if (hasNotification(notificationId)) {
                return
            }

            addNotification({
                id: notificationId,
                reportId: data.reportId,
                message: buildCreatedMessage(data),
                type: 'report-created',
                expiresAt: new Date(Date.now() + NOTIFICATION_TTL_MS),
            })
        })

        socket.value.on('report:updated', (data) => {
            const notificationId = createNotificationId(data)
            if (hasNotification(notificationId)) {
                return
            }

            addNotification({
                id: notificationId,
                reportId: data.reportId,
                message: buildUpdatedMessage(data),
                type: 'report-updated',
                expiresAt: new Date(Date.now() + NOTIFICATION_TTL_MS),
            })
        })

        socket.value.on('truck:expiry', (data) => {
            const notificationId = data?.notificationId
            if (!notificationId || hasNotification(notificationId)) {
                return
            }

            addNotification({
                id: notificationId,
                truckId: data.truckId,
                type: 'truck-expiry',
                message: buildExpiryMessage(data),
                expiresAt: new Date(Date.now() + NOTIFICATION_TTL_MS),
            })
        })
    }

    function addNotification(notif) {
        const currentId = String(notif.id)

        if (hasNotification(currentId)) {
            return
        }

        notifications.value.unshift({
            ...notif,
            read: isReadId(currentId),
            at: notif.at || new Date(),
            expiresAt: notif.expiresAt || new Date(Date.now() + NOTIFICATION_TTL_MS),
        })

        pruneExpiredNotifications()
        persistNotifications()
    }

    function markAllRead() {
        notifications.value.forEach((n) => {
            n.read = true
            markAsReadId(n.id)
        })

        persistReadNotifications()
        persistNotifications()
    }

    function disconnect() {
        stopExpirationCleanup()
        socket.value?.disconnect()
        socket.value = null
    }

    return { notifications, connect, markAllRead, disconnect }
})