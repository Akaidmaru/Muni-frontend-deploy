import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HomeView from '../views/HomeView.vue'
import ServicesView from '../views/ServicesView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import ContactView from '../views/ContactView.vue'
import DashboardView from '../views/DashboardView.vue'
import DailyRegistrationView from '../views/DailyRegistrationView.vue'
import DailyRegistrationFuncionarioView from '../views/DailyRegistrationFuncionarioView.vue'
import TravelHistoryView from '../views/TravelHistoryView.vue'
import AccessDeniedView from '../views/AccessDeniedView.vue'
import DashboardAdminView from '../views/DashboardAdminView.vue'
import DashboardPacienteView from '../views/DashboardPacienteView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        // ── Páginas públicas ──────────────────────────────────
        {
            path: '/',
            name: 'home',
            component: HomeView
        },
        {
            path: '/servicios',
            name: 'services',
            component: ServicesView
        },
        {
            path: '/clientes',
            name: 'login',
            component: LoginView
        },
        {
            path: '/registro',
            name: 'register',
            component: RegisterView
        },
        {
            path: '/contacto',
            name: 'contact',
            component: ContactView
        },

        // ── Dashboard: redirige según rol ─────────────────────
        {
            path: '/dashboard',
            name: 'dashboard',
            component: DashboardView,
            meta: { requiresAuth: true, roles: ['conductor', 'funcionario', 'admin'] }
        },

        // ── Rutas del conductor ───────────────────────────────
        {
            path: '/registro-diario',
            name: 'daily-registration',
            component: DailyRegistrationView,
            meta: { requiresAuth: true, roles: ['conductor', 'admin'] }
        },
        {
            path: '/historial-viajes',
            name: 'travel-history',
            component: TravelHistoryView,
            meta: { requiresAuth: true, roles: ['conductor', 'funcionario', 'admin'] }
        },

        // ── Rutas del funcionario ─────────────────────────────
        {
            path: '/registro-diario-funcionario',
            name: 'daily-registration-funcionario',
            component: DailyRegistrationFuncionarioView,
            meta: { requiresAuth: true, roles: ['funcionario', 'admin'] }
        },

        // ── Rutas del admin ───────────────────────────────────
        {
            path: '/dashboard-admin',
            name: 'dashboard-admin',
            component: DashboardAdminView,
            meta: { requiresAuth: true, roles: ['admin'] }
        },

        // ── Rutas del paciente ────────────────────────────────
        {
            path: '/dashboard-paciente',
            name: 'dashboard-paciente',
            component: DashboardPacienteView,
            meta: { requiresAuth: true, roles: ['paciente', 'admin'] }
        },

        // ── Acceso denegado ───────────────────────────────────
        {
            path: '/acceso-denegado',
            name: 'access-denied',
            component: AccessDeniedView
        }
    ]
})

// ── Navigation Guard ──────────────────────────────────────────────────────
router.beforeEach((to, from, next) => {
    const auth = useAuthStore()

    // Cargar sesión si hay token guardado
    if (!auth.isAuthenticated) {
        auth.loadFromStorage()
    }

    // Si la ruta requiere autenticación
    if (to.meta.requiresAuth) {
        if (!auth.isAuthenticated) {
            return next({ name: 'login' })
        }

        // Si la ruta requiere roles específicos
        if (to.meta.roles && !to.meta.roles.includes(auth.userRole)) {
            return next({ name: 'access-denied' })
        }
    }

    // Si el usuario ya está autenticado e intenta ir al login
    if (to.name === 'login' && auth.isAuthenticated) {
        const roleRoutes = {
            conductor: 'dashboard',
            funcionario: 'dashboard',
            admin: 'dashboard-admin',
            paciente: 'dashboard-paciente',
        }
        return next({ name: roleRoutes[auth.userRole] || 'dashboard' })
    }

    next()
})

export default router
