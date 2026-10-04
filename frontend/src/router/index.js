import { createRouter, createWebHistory } from 'vue-router'

import LoginView from '../views/LoginView.vue'
import SignupView from '../views/SignupView.vue'
import ForgotPasswordView from '../views/ForgotPasswordView.vue'
import ProductsView from '../views/ProductsView.vue'
import CategoriesView from '../views/CategoriesView.vue'
import UnitsView from '../views/UnitsView.vue'
import SoldInventoryView from '../views/SoldInventoryView.vue'
import POSView from '../views/POSView.vue'
import MemosView from '../views/MemosView.vue'
import ContactsView from '../views/ContactsView.vue'
import SettingsView from '../views/SettingsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/signup',
      name: 'signup',
      component: SignupView
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: ForgotPasswordView
    },
    {
      path: '/products',
      name: 'products',
      component: ProductsView
    },
    {
      path: '/categories',
      name: 'categories',
      component: CategoriesView
    },
    {
      path: '/units',
      name: 'units',
      component: UnitsView
    },
    {
      path: '/sold',
      name: 'sold',
      component: SoldInventoryView
    },
    {
      path: '/pos',
      name: 'pos',
      component: POSView
    },
    {
      path: '/memos',
      name: 'memos',
      component: MemosView
    },
    {
      path: '/contacts',
      name: 'contacts',
      component: ContactsView
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView
    },
    // Default route redirects to login
    {
      path: '/',
      redirect: '/login'
    }
  ]
})

export default router