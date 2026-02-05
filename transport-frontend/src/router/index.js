import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ServicesView from '../views/ServicesView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import ContactView from '../views/ContactView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
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
        }
    ]
})

export default router
