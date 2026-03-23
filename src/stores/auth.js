import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/axios'

export const useAuthStore = defineStore('auth', () => {
    // ── State ──────────────────────────────────────────────────────────────
    const token = ref(null)
    const user = ref(null) // { id, email, name, role }
    const role = ref(null) // 'ADMIN' | 'PATIENT' | 'DRIVER' | 'EMPLOYEE'
    const VALID_ROLES = ['ADMIN', 'PATIENT', 'DRIVER', 'EMPLOYEE']

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
            PATIENT: 'PATIENT',
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
            const message = Array.isArray(backendMessage)
                ? backendMessage.join(', ')
                : backendMessage || 'Credenciales incorrectas'
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
        login,
        logout,
    }
})
