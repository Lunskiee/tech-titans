<script setup>
import { ref, computed } from 'vue'
import logoImg from '../assets/logo.svg'

// Initial Units Data
const units = ref([
  { id: 1, name: 'Pieces', abbreviation: 'pcs', description: 'Individual standalone items' },
  { id: 2, name: 'Box', abbreviation: 'box', description: 'Packaged boxed inventory items' },
  { id: 3, name: 'Kilograms', abbreviation: 'kg', description: 'Weight measurement for bulk inventory' },
  { id: 4, name: 'Liters', abbreviation: 'L', description: 'Liquid volume measurement' },
])

const searchQuery = ref('')
const showModal = ref(false)
const unitNameInput = ref('')
const unitAbbrInput = ref('')
const unitDescInput = ref('')
const selectedUnitId = ref(null)

// Live search filter
const filteredUnits = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return units.value
  return units.value.filter(
    u => u.name.toLowerCase().includes(query) || 
         u.abbreviation.toLowerCase().includes(query) || 
         u.description.toLowerCase().includes(query)
  )
})

// Modal Actions
const openAddModal = () => {
  selectedUnitId.value = null
  unitNameInput.value = ''
  unitAbbrInput.value = ''
  unitDescInput.value = ''
  showModal.value = true
}

const openEditModal = (unit) => {
  selectedUnitId.value = unit.id
  unitNameInput.value = unit.name
  unitAbbrInput.value = unit.abbreviation
  unitDescInput.value = unit.description
  showModal.value = true
}

const handleSaveUnit = () => {
  if (!unitNameInput.value.trim() || !unitAbbrInput.value.trim()) return

  if (selectedUnitId.value) {
    // Edit existing unit
    const index = units.value.findIndex(u => u.id === selectedUnitId.value)
    if (index !== -1) {
      units.value[index].name = unitNameInput.value.trim()
      units.value[index].abbreviation = unitAbbrInput.value.trim()
      units.value[index].description = unitDescInput.value.trim()
    }
  } else {
    // Add new unit
    units.value.push({
      id: Date.now(),
      name: unitNameInput.value.trim(),
      abbreviation: unitAbbrInput.value.trim(),
      description: unitDescInput.value.trim() || 'No description provided.'
    })
  }
  showModal.value = false
}

const deleteUnit = (id) => {
  units.value = units.value.filter(u => u.id !== id)
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
        <router-link to="/categories" class="nav-item">Categories</router-link>
        <router-link to="/units" class="nav-item active">Units</router-link>

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
        <div class="page-title">&lt; Units</div>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search unit name, symbol, or description..." 
          class="search-input" 
          data-testid="unit-search-input"
        />
        <div class="user-profile">
          <span class="bell-icon">🔔</span>
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
            data-testid="add-unit-button"
          >
            + Add Unit
          </button>
        </div>

        <!-- Data Table -->
        <div class="table-card">
          <table data-testid="units-table">
            <thead>
              <tr>
                <th>Unit Name</th>
                <th>Abbreviation</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="unit in filteredUnits" :key="unit.id" data-testid="unit-row">
                <td class="font-medium">{{ unit.name }}</td>
                <td><span class="badge">{{ unit.abbreviation }}</span></td>
                <td>{{ unit.description }}</td>
                <td class="action-cells">
                  <button class="btn-edit" @click="openEditModal(unit)" data-testid="unit-edit-button">Edit</button>
                  <button class="btn-delete" @click="deleteUnit(unit.id)" data-testid="unit-delete-button">Delete</button>
                </td>
              </tr>
              <tr v-if="filteredUnits.length === 0">
                <td colspan="4" class="empty-state" data-testid="empty-units-message">
                  No units found.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" data-testid="unit-modal-overlay">
      <div class="modal-card" data-testid="unit-modal">
        <div class="modal-header">
          <h3 data-testid="unit-modal-title">{{ selectedUnitId ? 'Edit Unit' : 'Add Unit' }}</h3>
          <button class="btn-close" @click="showModal = false">✕</button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label>Unit Name *</label>
            <input 
              v-model="unitNameInput" 
              type="text" 
              placeholder="e.g., Kilograms" 
              class="form-input" 
              data-testid="unit-name-input"
            />
          </div>

          <div class="form-group">
            <label>Abbreviation / Symbol *</label>
            <input 
              v-model="unitAbbrInput" 
              type="text" 
              placeholder="e.g., kg" 
              class="form-input" 
              data-testid="unit-abbr-input"
            />
          </div>

          <div class="form-group">
            <label>Description</label>
            <textarea 
              v-model="unitDescInput" 
              placeholder="Brief description of this unit..." 
              rows="3" 
              class="form-input" 
              data-testid="unit-description-input"
            ></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="showModal = false" data-testid="unit-modal-cancel-button">Cancel</button>
          <button class="btn-save" @click="handleSaveUnit" data-testid="unit-modal-save-button">Save Unit</button>
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
.badge { background: #e0e7ff; color: #3730a3; padding: 4px 10px; border-radius: 4px; font-weight: 600; font-size: 0.8rem; }

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