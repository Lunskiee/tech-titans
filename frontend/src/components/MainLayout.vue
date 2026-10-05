<script setup>
import { ref, computed, provide } from 'vue'
import { useRoute } from 'vue-router'
import logoImg from '../assets/logo.svg'
import NotificationBell from './NotificationBell.vue'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const auth = useAuthStore()

// Dynamically sets title based on route meta or path
const pageTitle = computed(() => route.meta.title || route.name)

// Check if current route is All Products
const isProductsPage = computed(() => route.path === '/products' || route.name === 'products')

// Shared search query accessible across child views
const searchQuery = ref('')
provide('searchQuery', searchQuery)
</script>

<template>
  <div class="dashboard-container">
    <!-- Persistent Sidebar -->
    <aside class="sidebar">
      <div class="brand">
        <img :src="logoImg" alt="Vaulto Logo" class="brand-logo" />
      </div>

      <nav class="nav-section">
        <p class="section-title">Platform</p>
        <router-link to="/products" class="nav-item">All Products</router-link>
        <router-link to="/categories" class="nav-item">Categories</router-link>

        <p class="section-title">Transaction & Records</p>
        <router-link to="/sold" class="nav-item">Sold Inventory</router-link>
        <router-link to="/pos" class="nav-item">POS / Sales</router-link>
        <router-link to="/memos" class="nav-item">Memos</router-link>
        <router-link to="/contacts" class="nav-item">Contacts</router-link>

        <p class="section-title">Others</p>
        <router-link to="/settings" class="nav-item">Settings</router-link>
      </nav>
    </aside>

    <!-- Main Content Shell -->
    <main class="main-content">
      <!-- Persistent Topbar -->
      <header class="topbar">
        <div class="page-title">&lt; {{ pageTitle }}</div>

        <!-- Search Input - Rendered ONLY on All Products page -->
        <input 
          v-if="isProductsPage"
          v-model="searchQuery" 
          type="text" 
          placeholder="Search by product name or SKU..." 
          class="search-input" 
          data-testid="product-search-input"
        />

        <div class="user-profile" :class="{ 'ml-auto': !isProductsPage }">
          <NotificationBell />
          <div class="avatar" data-testid="topbar-avatar">
            <img v-if="auth.user?.avatarUrl" :src="auth.user.avatarUrl" alt="Profile" class="avatar-img" />
            <span v-else>{{ auth.initial }}</span>
          </div>
          <span class="user-name" data-testid="topbar-user-name">{{ auth.user?.fullName }}</span>
        </div>
      </header>

      <!-- Active view component loads here -->
      <div class="content-body">
        <router-view />
      </div>
    </main>
  </div>
</template>

<style scoped>
.dashboard-container { display: flex; width: 100vw; height: 100vh; background: #f3f4f6; }

/* Sidebar */
.sidebar { width: 240px; background: #5d5b8d; color: #fff; padding: 20px 0; display: flex; flex-direction: column; flex-shrink: 0; }
.brand { padding: 0 24px 16px; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; }
.brand-logo { height: 48px; width: auto; max-width: 100%; display: block; object-fit: contain; }
.nav-section { padding: 16px 12px; }
.section-title { font-size: 0.75rem; text-transform: uppercase; color: #a5a3cf; margin: 16px 12px 8px; }
.nav-item { display: block; padding: 10px 12px; color: #d1d0e6; text-decoration: none; border-radius: 6px; font-size: 0.9rem; }
.nav-item.router-link-active, .nav-item:hover { background: #4c4a75; color: #fff; }

/* Main Area */
.main-content { flex: 1; display: flex; flex-direction: column; overflow-y: auto; }
.topbar { height: 64px; flex-shrink: 0; background: #5d5b8d; display: flex; align-items: center; justify-content: space-between; padding: 0 32px; color: #fff; }
.page-title { font-weight: 600; font-size: 1.1rem; }

/* Search Bar Styling */
.search-input { width: 380px; padding: 8px 16px; border-radius: 6px; border: none; outline: none; font-size: 0.9rem; background: #ffffff; color: #1f2937; }
.search-input::placeholder { color: #9ca3af; }

.user-profile { display: flex; align-items: center; gap: 12px; }
.ml-auto { margin-left: auto; }
.avatar { width: 32px; height: 32px; border-radius: 50%; background: #d1d5db; color: #1e1b4b; font-weight: 700; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.avatar-img { width: 100%; height: 100%; object-fit: cover; }
.user-name { font-weight: 500; }

.content-body { padding: 32px; }
</style>