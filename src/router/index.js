import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HomeView from '../views/HomeView.vue'
import ServicesView from '../views/ServicesView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import VerifyEmailView from '../views/VerifyEmailView.vue'
import ContactView from '../views/ContactView.vue'
import DashboardView from '../views/DashboardView.vue'
import DailyRegistrationDriverView from '../views/DailyRegistrationDriverView.vue'
import DailyRegistrationMaintenanceView from '../views/DailyRegistrationMaintenanceView.vue'
import DailyRegistrationFuncionarioView from '../views/DailyRegistrationFuncionarioView.vue'
import TravelHistoryView from '../views/TravelHistoryView.vue'
import TravelHistoryFuncionarioView from '../views/TravelHistoryFuncionarioView.vue'
import TravelHistoryAdminView from '../views/TravelHistoryAdminView.vue'
import AdminDestinyView from '../views/AdminDestinyView.vue'
import AdminUsersView from '../views/AdminUsersView.vue'
import AdminVehiclesView from '../views/AdminVehiclesView.vue'
import AdminReportsView from '../views/AdminReportsView.vue'
import AdminMaintenanceView from '../views/AdminMaintenanceView.vue'
import AdminMaintenanceDailyView from '../views/AdminMaintenanceDailyView.vue'
import AdminMaintenanceWeeklyView from '../views/AdminMaintenanceWeeklyView.vue'
import AdminMaintenanceWeeklyHistory from '../views/AdminMaintenanceWeeklyHistory.vue'
import AdminUserRoleSetupView from '../views/AdminUserRoleSetupView.vue'
import AccessDeniedView from '../views/AccessDeniedView.vue'
import DashboardAdminView from '../views/DashboardAdminView.vue'
import DashboardPacienteView from '../views/DashboardPacienteView.vue'
import AdminRegistrationHubView from '../views/AdminRegistrationHubView.vue'
import AdminMaintenanceHubView from '../views/AdminMaintenanceHubView.vue'
import AdminMaintenanceStatsView from '../views/AdminMaintenanceStatsView.vue'
import AdminFuncionarioView from '../views/AdminFuncionarioView.vue'
import AdminDocumentosView from '../views/AdminDocumentosView.vue'
import AdminCombustibleView from '../views/AdminCombustibleView.vue'

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
            path: '/verificar-correo',
            name: 'verify-email',
            component: VerifyEmailView
        },
        {
            path: '/restablecer-contrasena',
            name: 'reset-password',
            component: () => import('../views/ResetPasswordView.vue')
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
            meta: { requiresAuth: true, roles: ['DRIVER', 'EMPLOYEE', 'ADMIN'] }
        },

        // ── Rutas del conductor ───────────────────────────────
        {
            path: '/registro-diario',
            name: 'daily-registration-driver',
            component: DailyRegistrationDriverView,
            meta: { requiresAuth: true, roles: ['DRIVER', 'ADMIN'] }
        },
        {
            path: '/registro-diario-mantencion',
            name: 'daily-registration-maintenance',
            component: DailyRegistrationMaintenanceView,
            meta: { requiresAuth: true, roles: ['DRIVER', 'ADMIN'] }
        },
        {
            path: '/historial-viajes',
            name: 'travel-history',
            component: TravelHistoryView,
            meta: { requiresAuth: true, roles: ['DRIVER', 'ADMIN'] }
        },

        // ── Rutas del funcionario ─────────────────────────────
        {
            path: '/registro-diario-funcionario',
            name: 'daily-registration-funcionario',
            component: DailyRegistrationFuncionarioView,
            meta: { requiresAuth: true, roles: ['EMPLOYEE', 'ADMIN'] }
        },
        {
            path: '/historial-viajes-funcionario',
            name: 'travel-history-funcionario',
            component: TravelHistoryFuncionarioView,
            meta: { requiresAuth: true, roles: ['EMPLOYEE', 'ADMIN'] }
        },

        // ── Rutas del admin ───────────────────────────────────
        {
            path: '/dashboard-admin',
            name: 'dashboard-admin',
            component: DashboardAdminView,
            meta: { requiresAuth: true, roles: ['ADMIN'] }
        },
        {
            path: '/historial-viajes-admin',
            name: 'travel-history-admin',
            component: TravelHistoryAdminView,
            meta: { requiresAuth: true, roles: ['ADMIN'] }
        },
        {
            path: '/admin/registro',
            name: 'admin-registro-hub',
            component: AdminRegistrationHubView,
            meta: { requiresAuth: true, roles: ['ADMIN'] }
        },
        {
            path: '/admin/gestion-usuarios',
            name: 'admin-users',
            component: AdminUsersView,
            meta: { requiresAuth: true, roles: ['ADMIN'] }
        },
        {
            path: '/admin/vehiculos',
            name: 'admin-vehicles',
            component: AdminVehiclesView,
            meta: { requiresAuth: true, roles: ['ADMIN'] }
        },
        {
            path: '/admin/gestion-usuarios/roles-iniciales',
            name: 'admin-user-role-setup',
            component: AdminUserRoleSetupView,
            meta: { requiresAuth: true, roles: ['ADMIN'] }
        },
        {
            path: '/admin/reportes',
            name: 'admin-reports',
            component: AdminReportsView,
            meta: { requiresAuth: true, roles: ['ADMIN'] }
        },
        {
            path: '/admin/reportes/:id',
            name: 'admin-report-detail',
            component: () => import('../views/AdminReportDetailView.vue'),
            meta: { requiresAuth: true, roles: ['ADMIN'] }
        },
        {
            path: '/admin/mantencion-vehicular',
            name: 'admin-maintenance',
            component: AdminMaintenanceHubView,
            meta: { requiresAuth: true, roles: ['ADMIN'] }
        },
        {
            path: '/admin/mantencion-vehicular/estadisticas',
            name: 'admin-maintenance-estadisticas',
            component: AdminMaintenanceStatsView,
            meta: { requiresAuth: true, roles: ['ADMIN'] }
        },
        {
            path: '/admin/mantencion-vehicular/diario',
            name: 'admin-maintenance-daily',
            component: AdminMaintenanceDailyView,
            meta: { requiresAuth: true, roles: ['ADMIN'] }
        },
        {
            path: '/admin/mantencion-vehicular/mensual',
            name: 'admin-maintenance-monthly',
            component: AdminMaintenanceWeeklyView,
            meta: { requiresAuth: true, roles: ['ADMIN'] }
        },
        {
            path: '/admin/mantencion-vehicular/historial-mensual',
            name: 'admin-maintenance-monthly-history',
            component: AdminMaintenanceWeeklyHistory,
            meta: { requiresAuth: true, roles: ['ADMIN'] }

        },
        {
            path: '/admin/mantencion-vehicular/semanal',
            redirect: { name: 'admin-maintenance-monthly' },
        },
        {
            path: '/admin/mantencion-vehicular/historial-semanal',
            redirect: { name: 'admin-maintenance-monthly-history' },
        },
        {
            path: '/admin/destinos',
            name: 'admin-destinations',
            component: AdminDestinyView,
            meta: { requiresAuth: true, roles: ['ADMIN'] }
        },
        {
            path: '/admin/funcionarios',
            name: 'admin-funcionarios',
            component: AdminFuncionarioView,
            meta: { requiresAuth: true, roles: ['ADMIN'] }
        },
        {
            path: '/admin/documentos',
            name: 'admin-documentos',
            component: AdminDocumentosView,
            meta: { requiresAuth: true, roles: ['ADMIN'] }
        },
        {
            path: '/admin/combustible',
            name: 'admin-combustible',
            component: AdminCombustibleView,
            meta: { requiresAuth: true, roles: ['ADMIN'] }
        },

        // ── Rutas del paciente ────────────────────────────────
        {
            path: '/dashboard-paciente',
            name: 'dashboard-paciente',
            component: DashboardPacienteView,
            meta: { requiresAuth: true, roles: ['PATIENT', 'ADMIN'] }
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
router.beforeEach(async (to) => {
    const auth = useAuthStore()

    // Cargar sesión si hay token guardado
    if (!auth.isAuthenticated) {
        auth.loadFromStorage()
    }

    if (auth.isAuthenticated) {
        const syncResult = await auth.syncCurrentUser()
        if (!syncResult.success && to.name !== 'login') {
            return { name: 'login' }
        }
    }

    // Si la ruta requiere autenticación
    if (to.meta.requiresAuth) {
        if (!auth.isAuthenticated) {
            return { name: 'login' }
        }

        // Si la ruta requiere roles específicos
        if (to.meta.roles && !to.meta.roles.includes(auth.userRole)) {
            return { name: 'access-denied' }
        }
    }

    // Si el usuario ya está autenticado e intenta ir al login
    if (to.name === 'login' && auth.isAuthenticated) {
        const roleRoutes = {
            DRIVER: 'dashboard',
            EMPLOYEE: 'dashboard',
            ADMIN: 'dashboard-admin',
        }
        return { name: roleRoutes[auth.userRole] || 'dashboard' }
    }

    return true
})

export default router
