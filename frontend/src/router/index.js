import { createRouter, createWebHistory } from 'vue-router'

import MainLayout from '../components/MainLayout.vue'

import LoginView from '../views/LoginView.vue'
import SignupView from '../views/SignupView.vue'
import ForgotPasswordView from '../views/ForgotPasswordView.vue'
import ProductsView from '../views/ProductsView.vue'
import CategoriesView from '../views/CategoriesView.vue'
import SoldInventoryView from '../views/SoldInventoryView.vue'
import POSView from '../views/POSView.vue'
import MemosView from '../views/MemosView.vue'
import ContactsView from '../views/ContactsView.vue'
import SettingsView from '../views/SettingsView.vue'

import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Public Routes (No persistent layout)
    { path: '/login', name: 'login', component: LoginView },
    { path: '/signup', name: 'signup', component: SignupView },
    { path: '/forgot-password', name: 'forgot-password', component: ForgotPasswordView },

    // Authenticated App Routes (Nested inside MainLayout)
    {
      path: '/',
      component: MainLayout,
      redirect: '/login', // always start at login
      children: [
        { path: 'products', name: 'products', component: ProductsView, meta: { title: 'All Products' } },
        { path: 'categories', name: 'categories', component: CategoriesView, meta: { title: 'Categories' } },
        { path: 'sold', name: 'sold', component: SoldInventoryView, meta: { title: 'Sold Inventory' } },
        { path: 'pos', name: 'pos', component: POSView, meta: { title: 'POS / Sales' } },
        { path: 'memos', name: 'memos', component: MemosView, meta: { title: 'Memos' } },
        { path: 'contacts', name: 'contacts', component: ContactsView, meta: { title: 'Contacts' } },
        { path: 'settings', name: 'settings', component: SettingsView, meta: { title: 'Settings' } }
      ]
    },

    // Anything unknown goes to login
    { path: '/:pathMatch(.*)*', redirect: '/login' }
  ]
})

// Only logged-in users can open the app pages
const publicPages = ['login', 'signup', 'forgot-password']

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!publicPages.includes(to.name) && !auth.isLoggedIn) {
    return { name: 'login' }
  }
})

export default router