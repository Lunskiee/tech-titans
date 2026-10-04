<script setup>
import { ref, computed } from 'vue'
import NotificationBell from '../components/NotificationBell.vue'
import logoImg from '../assets/logo.svg'

// Categories State
const categories = ref([
  { id: 1, name: 'Electronics', description: 'Gadgets, peripherals, and electronic hardware', itemCount: 2 },
  { id: 2, name: 'Accessories', description: 'Cables, adapters, and setup additions', itemCount: 1 },
  { id: 3, name: 'Office Supplies', description: 'Stationery and daily office essentials', itemCount: 0 },
])

const searchQuery = ref('')
const showModal = ref(false)
const categoryNameInput = ref('')
const categoryDescInput = ref('')
const selectedCategoryId = ref(null)

// Filter categories live
const filteredCategories = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return categories.value
  return categories.value.filter(
    c => c.name.toLowerCase().includes(query) || c.description.toLowerCase().includes(query)
  )
})

// Modal Actions
const openAddModal = () => {
  selectedCategoryId.value = null
  categoryNameInput.value = ''
  categoryDescInput.value = ''
  showModal.value = true
}

const openEditModal = (cat) => {
  selectedCategoryId.value = cat.id
  categoryNameInput.value = cat.name
  categoryDescInput.value = cat.description
  showModal.value = true
}

const handleSaveCategory = () => {
  if (!categoryNameInput.value.trim()) return

  if (selectedCategoryId.value) {
    // Edit existing category
    const index = categories.value.findIndex(c => c.id === selectedCategoryId.value)
    if (index !== -1) {
      categories.value[index].name = categoryNameInput.value.trim()
      categories.value[index].description = categoryDescInput.value.trim()
    }
  } else {
    // Add new category
    categories.value.push({
      id: Date.now(),
      name: categoryNameInput.value.trim(),
      description: categoryDescInput.value.trim() || 'No description provided.',
      itemCount: 0
    })
  }
  showModal.value = false
}

const deleteCategory = (id) => {
  categories.value = categories.value.filter(c => c.id !== id)
}
</script>

<template>
  <div class="dashboard-container">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="brand">
        <img :src="logoImg" alt="Vaulto Logo" class="brand-logo" />
      </div>

      <nav class="nav-section">
        <p class="section-title">Platform</p>
        <router-link to="/products" class="nav-item">All Products</router-link>
        <router-link to="/categories" class="nav-item active">Categories</router-link>
        <router-link to="/units" class="nav-item">Units</router-link>

        <p class="section-title">Transaction & Records</p>
        <router-link to="/sold" class="nav-item">Sold Inventory</router-link>
        <router-link to="/pos" class="nav-item">POS / Sales</router-link>
        <router-link to="/memos" class="nav-item">Memos</router-link>
        <router-link to="/contacts" class="nav-item">Contacts</router-link>

        <p class="section-title">Others</p>
        <router-link to="/settings" class="nav-item">Settings</router-link>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Topbar -->
      <header class="topbar">
        <div class="page-title">&lt; Categories</div>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search category name or description..." 
          class="search-input" 
          data-testid="category-search-input"
        />
        <div class="user-profile">
          <NotificationBell />
          <div class="avatar"></div>
          <span class="user-name">Sarah Geronimo</span>
        </div>
      </header>

      <!-- Content Area -->
      <div class="content-body">
        <div class="action-bar">
          <button 
            class="btn-add" 
            @click="openAddModal" 
            data-testid="add-category-button"
          >
            + Add Category
          </button>
        </div>

        <!-- Data Table -->
        <div class="table-card">
          <table data-testid="categories-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Description</th>
                <th>Total Items</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="cat in filteredCategories" :key="cat.id" data-testid="category-row">
                <td class="font-medium">{{ cat.name }}</td>
                <td>{{ cat.description }}</td>
                <td>{{ cat.itemCount }} items</td>
                <td class="action-cells">
                  <button class="btn-edit" @click="openEditModal(cat)" data-testid="category-edit-button">Edit</button>
                  <button class="btn-delete" @click="deleteCategory(cat.id)" data-testid="category-delete-button">Delete</button>
                </td>
              </tr>
              <tr v-if="filteredCategories.length === 0">
                <td colspan="4" class="empty-state" data-testid="empty-categories-message">
                  No categories found.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" data-testid="category-modal-overlay">
      <div class="modal-card" data-testid="category-modal">
        <div class="modal-header">
          <h3 data-testid="category-modal-title">{{ selectedCategoryId ? 'Edit Category' : 'Add Category' }}</h3>
          <button class="btn-close" @click="showModal = false">✕</button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label>Category Name *</label>
            <input 
              v-model="categoryNameInput" 
              type="text" 
              placeholder="e.g., Audio Gear" 
              class="form-input" 
              data-testid="category-name-input"
            />
          </div>

          <div class="form-group">
            <label>Description</label>
            <textarea 
              v-model="categoryDescInput" 
              placeholder="Brief description of this category..." 
              rows="3" 
              class="form-input" 
              data-testid="category-description-input"
            ></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="showModal = false" data-testid="category-modal-cancel-button">Cancel</button>
          <button class="btn-save" @click="handleSaveCategory" data-testid="category-modal-save-button">Save Category</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-container { display: flex; width: 100vw; height: 100vh; background: #f3f4f6; }

/* Sidebar */
.sidebar { width: 240px; background: #5d5b8d; color: #fff; padding: 20px 0; display: flex; flex-direction: column; }
.brand { padding: 0 24px 16px; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; }
.brand-logo { height: 48px; width: auto; max-width: 100%; display: block; object-fit: contain; }
.nav-section { padding: 16px 12px; }
.section-title { font-size: 0.75rem; text-transform: uppercase; color: #a5a3cf; margin: 16px 12px 8px; }
.nav-item { display: block; padding: 10px 12px; color: #d1d0e6; text-decoration: none; border-radius: 6px; font-size: 0.9rem; }
.nav-item.active, .nav-item:hover { background: #4c4a75; color: #fff; }

/* Main Area */
.main-content { flex: 1; display: flex; flex-direction: column; }
.topbar { height: 64px; background: #5d5b8d; display: flex; align-items: center; justify-content: space-between; padding: 0 32px; color: #fff; }
.page-title { font-weight: 600; font-size: 1.1rem; }
.search-input { width: 400px; padding: 8px 16px; border-radius: 6px; border: none; outline: none; font-size: 0.9rem; }
.user-profile { display: flex; align-items: center; gap: 12px; }
.avatar { width: 32px; height: 32px; border-radius: 50%; background: #d1d5db; }

/* Content */
.content-body { padding: 32px; }
.action-bar { display: flex; gap: 16px; margin-bottom: 24px; }
.btn-add { background: #1e1b4b; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; }

/* Table */
.table-card { background: #fff; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden; }
table { width: 100%; border-collapse: collapse; text-align: left; }
th { background: #8b89b8; color: #fff; padding: 12px 16px; font-size: 0.85rem; }
td { padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 0.9rem; color: #374151; vertical-align: middle; }
.font-medium { font-weight: 600; color: #111827; }

.action-cells { display: flex; gap: 8px; }
.btn-edit { background: #a5b4fc; border: none; padding: 6px 16px; border-radius: 4px; color: #1e1b4b; cursor: pointer; font-weight: 600; }
.btn-edit:hover { background: #818cf8; color: #fff; }
.btn-delete { background: #ef4444; border: none; padding: 6px 16px; border-radius: 4px; color: #fff; cursor: pointer; font-weight: 600; }
.btn-delete:hover { background: #dc2626; }
.empty-state { text-align: center; color: #6b7280; padding: 32px; font-style: italic; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.4); display: flex; align-items: center; justify-content: center; z-index: 50; }
.modal-card { background: #fff; border-radius: 8px; width: 420px; padding: 24px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15); }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.modal-header h3 { font-size: 1.1rem; font-weight: 600; margin: 0; }
.btn-close { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #6b7280; }
.form-group { margin-bottom: 16px; display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 0.85rem; font-weight: 600; color: #374151; }
.form-input { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.9rem; outline: none; }
.form-input:focus { border-color: #5d5b8d; }
.modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
.btn-cancel { background: #f3f4f6; border: 1px solid #d1d5db; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
.btn-save { background: #1e1b4b; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; }
</style>