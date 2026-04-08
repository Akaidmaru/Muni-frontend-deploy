import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/axios'

export const useAuthStore = defineStore('auth', () => {
    // ── State ──────────────────────────────────────────────────────────────
    const token = ref(null)
    const user = ref(null) // { id, email, name, role }
    const role = ref(null) // 'ADMIN' | 'DRIVER' | 'EMPLOYEE'
    const VALID_ROLES = ['ADMIN', 'DRIVER', 'EMPLOYEE']
    const SESSION_SYNC_INTERVAL_MS = 15000
    const lastSessionSyncAt = ref(0)
    const isSyncingSession = ref(false)

    // ── Getters ────────────────────────────────────────────────────────────
    const isAuthenticated = computed(() => !!token.value)
    const userRole = computed(() => role.value)
    const isConductor = computed(() => role.value === 'DRIVER')
    const isFuncionario = computed(() => role.value === 'EMPLOYEE')
    const isAdmin = computed(() => role.value === 'ADMIN')
    const isPaciente = computed(() => role.value === 'PATIENT')

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

    // ── Helpers ────────────────────────────────────────────────────────────
    function normalizeRole(rawRole) {
        const roleMap = {
            ADMIN: 'ADMIN',
            DRIVER: 'DRIVER',
            EMPLOYEE: 'EMPLOYEE',
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
            }
            localStorage.setItem('user', JSON.stringify(user.value))
        }

        if (normalizedRole) {
            role.value = normalizedRole
            localStorage.setItem('role', normalizedRole)
        }

        lastSessionSyncAt.value = Date.now()
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
    }

    async function syncCurrentUser(force = false) {
        if (!token.value) {
            return { success: false, message: 'Sin token de sesión' }
        }

        if (isSyncingSession.value) {
            return { success: true }
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

        try {
            const { data } = await api.get('/auth/me')
            const normalizedRole = normalizeRole(data?.role)

            if (!data?.id || !data?.email || !normalizedRole) {
                logout()
                return { success: false, message: 'Sesión inválida' }
            }

            setSession(token.value, data, normalizedRole)
            return { success: true }
        } catch {
            logout()
            return { success: false, message: 'Sesión expirada o inválida' }
        } finally {
            isSyncingSession.value = false
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
            const backendMessage = error.response?.data?.message
            const isNetworkError =
                error.code === 'ERR_NETWORK' || !error.response
            const message = Array.isArray(backendMessage)
                ? backendMessage.join(', ')
                : backendMessage ||
                (isNetworkError
                    ? 'No se pudo conectar con el servidor. Verifica que el frontend esté en http://localhost:5173 y el backend en http://localhost:3000.'
                    : 'Credenciales incorrectas')
            return { success: false, message }
        }
    }

    /**
     * Logout: limpia todo el estado y redirige.
     */
    function logout() {
        token.value = null
        user.value = null
        role.value = null
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('role')
        lastSessionSyncAt.value = 0
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
        fullName,
        initials,
        // actions
        loadFromStorage,
        syncCurrentUser,
        login,
        logout,
    }
})
