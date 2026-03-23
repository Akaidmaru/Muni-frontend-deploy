import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/axios'

export const useAuthStore = defineStore('auth', () => {
    // ── State ──────────────────────────────────────────────────────────────
    const token = ref(null)
    const user = ref(null) // { name, surname, email, ... }
    const role = ref(null) // 'conductor' | 'funcionario' | 'admin' | 'paciente'

    // ── Getters ────────────────────────────────────────────────────────────
    const isAuthenticated = computed(() => !!token.value)
    const userRole = computed(() => role.value)
    const isConductor = computed(() => role.value === 'conductor')
    const isFuncionario = computed(() => role.value === 'funcionario')
    const isAdmin = computed(() => role.value === 'admin')
    const isPaciente = computed(() => role.value === 'paciente')

    const fullName = computed(() =>
        user.value ? `${user.value.name} ${user.value.surname}` : ''
    )
    const initials = computed(() =>
        user.value ? `${user.value.name[0]}${user.value.surname[0]}` : ''
    )

    // ── Helpers ────────────────────────────────────────────────────────────
    function decodeJWT(jwt) {
        try {
            const payload = JSON.parse(atob(jwt.split('.')[1]))
            return payload
        } catch {
            return null
        }
    }

    function setSession(jwt) {
        token.value = jwt
        localStorage.setItem('token', jwt)

        const payload = decodeJWT(jwt)
        if (payload) {
            role.value = payload.role || payload.rol || null
            user.value = {
                name: payload.name || payload.nombre || 'Usuario',
                surname: payload.surname || payload.apellido || '',
                email: payload.email || payload.correo || '',
            }
        }
    }

    // ── Actions ────────────────────────────────────────────────────────────

    /**
     * Intenta cargar la sesión desde localStorage al iniciar la app.
     */
    function loadFromStorage() {
        const saved = localStorage.getItem('token')
        if (saved) {
            setSession(saved)
            // Si el token no tiene un rol válido, limpiar sesión
            const validRoles = ['conductor', 'funcionario', 'admin', 'paciente']
            if (!role.value || !validRoles.includes(role.value)) {
                logout()
            }
        }
    }

    /**
     * Login: llama al backend y guarda la sesión.
     * TODO: ajustar el endpoint real cuando el backend esté listo.
     */
    async function login(email, password) {
        // ── Mock mode (quitar cuando el backend esté conectado) ────────────
        // Para probar roles sin backend, descomentar uno de los bloques:
        const MOCK_MODE = true

        if (MOCK_MODE) {
            // ── Usuarios de prueba por rol ────────────────────────────
            // Email               | Contraseña | Rol
            // conductor@test.com  | 123456     | conductor
            // funcionario@test.com| 123456     | funcionario
            // admin@test.com      | 123456     | admin
            // paciente@test.com   | 123456     | paciente
            const mockUsers = {
                'conductor@test.com': { name: 'Juan', surname: 'Pérez', role: 'conductor' },
                'funcionario@test.com': { name: 'María', surname: 'González', role: 'funcionario' },
                'admin@test.com': { name: 'Carlos', surname: 'Admin', role: 'admin' },
                'paciente@test.com': { name: 'Ana', surname: 'López', role: 'paciente' },
            }

            const mockUser = mockUsers[email.toLowerCase()]
            if (!mockUser) {
                return { success: false, message: 'Usuario no encontrado. Usa: conductor@test.com, funcionario@test.com, admin@test.com o paciente@test.com' }
            }

            const mockPayload = {
                name: mockUser.name,
                surname: mockUser.surname,
                email: email,
                role: mockUser.role,
            }
            const fakeJWT = 'header.' + btoa(JSON.stringify(mockPayload)) + '.signature'
            setSession(fakeJWT)
            return { success: true }
        }
        // ── Fin mock mode ─────────────────────────────────────────────────

        try {
            const response = await api.post('/auth/login', { email, password })
            const jwt = response.data.token
            setSession(jwt)
            return { success: true }
        } catch (error) {
            const message = error.response?.data?.message || 'Credenciales incorrectas'
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
