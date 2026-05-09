import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api, { getApiBaseUrl } from '@/services/axios'
import { useSidebarStore } from '@/stores/sidebar'

export const useAuthStore = defineStore('auth', () => {
    // ── State ──────────────────────────────────────────────────────────────
    const token = ref(null)
    const user = ref(null) // { id, email, name, role }
    const role = ref(null) // 'ADMIN' | 'DRIVER' | 'EMPLOYEE' | 'DIRECTION'
    const VALID_ROLES = ['ADMIN', 'DRIVER', 'EMPLOYEE', 'DIRECTION']
    const SESSION_SYNC_INTERVAL_MS = 15000
    const lastSessionSyncAt = ref(0)
    const isSyncingSession = ref(false)
    let sessionSyncIntervalId = null
    let sessionSyncPromise = null

    // ── Getters ────────────────────────────────────────────────────────────
    const isAuthenticated = computed(() => !!token.value)
    const userRole = computed(() => role.value)
    const isConductor = computed(() => role.value === 'DRIVER')
    const isFuncionario = computed(() => role.value === 'EMPLOYEE')
    const isAdmin = computed(() => role.value === 'ADMIN')
    const isPaciente = computed(() => role.value === 'PATIENT')
    const isDireccion = computed(() => role.value === 'DIRECTION')

    const fullName = computed(() =>
        user.value ? `${user.value.name ?? ''}`.trim() : ''
    )
    const initials = computed(() => {
        if (!user.value?.name) return ''
        const parts = user.value.name.trim().split(' ').filter(Boolean)
        if (parts.length === 0) return ''
        if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? ''
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    })

    // ── Session sync interval ──────────────────────────────────────────────
    function onAppResume() {
        if (document.visibilityState === 'visible' && token.value) {
            void syncCurrentUser(true)
        }
    }

    function startSessionSync() {
        if (sessionSyncIntervalId !== null) return
        sessionSyncIntervalId = setInterval(() => {
            if (token.value) void syncCurrentUser()
        }, SESSION_SYNC_INTERVAL_MS)
        // En móvil/Capacitor los timers se pausan al quedar en segundo plano.
        // visibilitychange fuerza una verificación al retomar la app.
        document.addEventListener('visibilitychange', onAppResume)
    }

    function stopSessionSync() {
        if (sessionSyncIntervalId !== null) {
            clearInterval(sessionSyncIntervalId)
            sessionSyncIntervalId = null
        }
        document.removeEventListener('visibilitychange', onAppResume)
    }

    // ── Helpers ────────────────────────────────────────────────────────────
    function getTokenExpiryMs(jwt) {
        try {
            const payload = JSON.parse(atob(jwt.split('.')[1]))
            return typeof payload.exp === 'number' ? payload.exp * 1000 : null
        } catch {
            return null
        }
    }

    function normalizeRole(rawRole) {
        const roleMap = {
            ADMIN: 'ADMIN',
            DRIVER: 'DRIVER',
            EMPLOYEE: 'EMPLOYEE',
            DIRECTION: 'DIRECTION',
        }

        return roleMap[rawRole] ?? null
    }

    function setSession(jwt, backendUser = null, normalizedRole = null) {
        token.value = jwt
        localStorage.setItem('token', jwt)

        if (backendUser) {
            user.value = {
                id: backendUser.id,
                email: backendUser.email,
                name: backendUser.name || 'Usuario',
                role: backendUser.role,
                managedById: backendUser.managedById ?? null,
                managedByRole: backendUser.managedByRole ?? null,
            }
            localStorage.setItem('user', JSON.stringify(user.value))
        }

        if (normalizedRole) {
            role.value = normalizedRole
            localStorage.setItem('role', normalizedRole)
        }

        lastSessionSyncAt.value = Date.now()
        startSessionSync()
    }

    function buildErrorDetails(error) {
        const config = error?.config || {}
        const baseURL = config.baseURL || getApiBaseUrl() || ''
        const endpoint = config.url || ''
        const method = (config.method || 'get').toUpperCase()
        const fullUrl = endpoint.startsWith('http')
            ? endpoint
            : `${baseURL}${endpoint}`

        return {
            method,
            fullUrl,
            baseURL,
            endpoint,
            code: error?.code,
            status: error?.response?.status,
            backendMessage: error?.response?.data?.message,
            responseData: error?.response?.data,
            rawMessage: error?.message,
        }
    }

    // ── Actions ────────────────────────────────────────────────────────────

    /**
     * Intenta cargar la sesión desde localStorage al iniciar la app.
     */
    function loadFromStorage() {
        const savedToken = localStorage.getItem('token')
        const savedRole = localStorage.getItem('role')
        const savedUserRaw = localStorage.getItem('user')

        if (!savedToken) {
            return
        }

        token.value = savedToken

        if (!savedRole || !VALID_ROLES.includes(savedRole)) {
            logout()
            return
        }

        role.value = savedRole

        if (savedUserRaw) {
            try {
                user.value = JSON.parse(savedUserRaw)
            } catch {
                logout()
            }
        }

        lastSessionSyncAt.value = 0
        startSessionSync()
    }

    async function syncCurrentUser(force = false, { preventLogout = false } = {}) {
        if (!token.value) {
            return { success: false, message: 'Sin token de sesión' }
        }

        if (isSyncingSession.value) {
            return sessionSyncPromise
                ? await sessionSyncPromise
                : { success: true }
        }

        const now = Date.now()
        if (
            !force &&
            lastSessionSyncAt.value > 0 &&
            now - lastSessionSyncAt.value < SESSION_SYNC_INTERVAL_MS
        ) {
            return { success: true }
        }

        isSyncingSession.value = true
        sessionSyncPromise = (async () => {
            try {
                const { data } = await api.get('/auth/me')
                const normalizedRole = normalizeRole(data?.role)

                if (!data?.id || !data?.email || !normalizedRole) {
                    if (!preventLogout) logout()
                    return { success: false, message: 'Sesión inválida' }
                }

                setSession(token.value, data, normalizedRole)

                // Renovar el token si expira en menos de 2 horas
                const TWO_HOURS_MS = 2 * 60 * 60 * 1000
                const expiry = getTokenExpiryMs(token.value)
                if (expiry !== null && expiry - Date.now() < TWO_HOURS_MS) {
                    try {
                        const { data: refreshData } = await api.post('/auth/refresh')
                        if (refreshData?.accessToken) {
                            token.value = refreshData.accessToken
                            localStorage.setItem('token', refreshData.accessToken)
                            lastSessionSyncAt.value = Date.now()
                        }
                    } catch {
                        // El token actual sigue siendo válido — se reintenta en el próximo ciclo
                    }
                }

                return { success: true }
            } catch (error) {
                if (error.response?.status === 401) {
                    if (!preventLogout) logout()
                    return { success: false, message: 'Sesión expirada o inválida' }
                }
                // Error de red o servidor temporalmente caído — no cerrar sesión
                return { success: false, message: 'Error de conexión temporal' }
            }
        })()

        try {
            return await sessionSyncPromise
        } finally {
            isSyncingSession.value = false
            sessionSyncPromise = null
        }
    }

    /**
     * Login: llama al backend y guarda la sesión.
     */
    async function login(email, password) {
        try {
            const response = await api.post('/auth/login', { email, password })

            const jwt = response.data?.accessToken
            const backendUser = response.data?.user

            if (!jwt || !backendUser) {
                return { success: false, message: 'Respuesta inválida del servidor' }
            }

            const normalizedRole = normalizeRole(backendUser.role)
            if (!normalizedRole || !VALID_ROLES.includes(normalizedRole)) {
                return { success: false, message: 'Rol de usuario no soportado por el frontend' }
            }

            setSession(jwt, backendUser, normalizedRole)
            return { success: true }
        } catch (error) {
            const details = buildErrorDetails(error)
            console.error('[Auth] Login request failed', details)

            const backendMessage = error.response?.data?.message
            const isNetworkError =
                error.code === 'ERR_NETWORK' || !error.response
            const apiBaseUrl = getApiBaseUrl() || 'http://localhost:3000'
            const isLocal =
                typeof apiBaseUrl === 'string' &&
                (apiBaseUrl.includes('localhost') || apiBaseUrl.includes('127.0.0.1'))
            const networkHint = isLocal
                ? `No se pudo conectar con el API (${apiBaseUrl}). En local: arranca el backend y el front (Vite).`
                : `No se pudo conectar con el servidor. URL usada: ${details.fullUrl || apiBaseUrl}. Verifica que el backend este corriendo y accesible.`
            const message = Array.isArray(backendMessage)
                ? backendMessage.join(', ')
                : backendMessage ||
                (isNetworkError ? networkHint : 'Credenciales incorrectas')
            return { success: false, message }
        }
    }

    /**
     * Logout: limpia todo el estado y redirige.
     */
    function logout() {
        stopSessionSync()
        token.value = null
        user.value = null
        role.value = null
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('role')
        lastSessionSyncAt.value = 0
        useSidebarStore().reset()
    }

    return {
        // state
        token,
        user,
        role,
        // getters
        isAuthenticated,
        userRole,
        isConductor,
        isFuncionario,
        isAdmin,
        isPaciente,
        isDireccion,
        fullName,
        initials,
        // actions
        loadFromStorage,
        syncCurrentUser,
        login,
        logout,
    }
})
