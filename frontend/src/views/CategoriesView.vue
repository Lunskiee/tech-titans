<script setup>
import { ref, computed } from 'vue'
import { useInventoryStore } from '../stores/inventory'

const store = useInventoryStore()

const searchQuery = ref('')
const showModal = ref(false)
const categoryNameInput = ref('')
const categoryDescInput = ref('')
const selectedCategoryId = ref(null)
const formError = ref('')    // shown inside the modal
const pageMessage = ref('')  // shown above the table (e.g. delete blocked)

// "Total Items" is counted live from the products in the store,
// so adding a product on the Products page updates this automatically.
const categoriesWithCount = computed(() =>
  store.categories.map(cat => ({
    ...cat,
    itemCount: store.detailedProducts.filter(p => p.categoryName === cat.name).length
  }))
)

// Filter categories live
const filteredCategories = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return categoriesWithCount.value
  return categoriesWithCount.value.filter(
    c => c.name.toLowerCase().includes(query) ||
         (c.description || '').toLowerCase().includes(query)
  )
})

// Modal Actions
const openAddModal = () => {
  selectedCategoryId.value = null
  categoryNameInput.value = ''
  categoryDescInput.value = ''
  formError.value = ''
  pageMessage.value = ''
  showModal.value = true
}

const openEditModal = (cat) => {
  selectedCategoryId.value = cat.id
  categoryNameInput.value = cat.name
  categoryDescInput.value = cat.description === 'No description provided.' ? '' : (cat.description || '')
  formError.value = ''
  pageMessage.value = ''
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  formError.value = ''
}

const handleSaveCategory = () => {
  formError.value = ''
  const name = categoryNameInput.value.trim()
  const description = categoryDescInput.value.trim() || 'No description provided.'

  if (!name) {
    formError.value = 'Category name is required.'
    return
  }

  // Products are matched to categories by name, so names must be unique
  const duplicate = store.categories.some(
    c => c.id !== selectedCategoryId.value && c.name.trim().toLowerCase() === name.toLowerCase()
  )
  if (duplicate) {
    formError.value = `"${name}" already exists.`
    return
  }

  const result = selectedCategoryId.value
    ? store.updateCategory(selectedCategoryId.value, { name, description })
    : store.addCategory({ name, description })

  if (result && result.ok === false) {
    formError.value = result.error
    return
  }
  closeModal()
}

const deleteCategory = (cat) => {
  pageMessage.value = ''

  // Don't delete a category that products still use
  if (cat.itemCount > 0) {
    pageMessage.value = `Cannot delete "${cat.name}". It is used by ${cat.itemCount} product${cat.itemCount === 1 ? '' : 's'}.`
    return
  }

  const result = store.removeCategory(cat.id)
  if (result && result.ok === false) pageMessage.value = result.error
}
</script>

<template>
  <div class="categories-page">
    <p v-if="pageMessage" class="banner" role="alert" data-testid="categories-message">
      {{ pageMessage }}
      <button class="banner-close" @click="pageMessage = ''" aria-label="Dismiss">✕</button>
    </p>

    <!-- Action Bar & Search -->
    <div class="action-bar">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search category name or description..."
        class="search-input"
        data-testid="category-search-input"
      />
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
            <td>{{ cat.itemCount }} {{ cat.itemCount === 1 ? 'item' : 'items' }}</td>
            <td class="action-cells">
              <button class="btn-edit" @click="openEditModal(cat)" data-testid="category-edit-button">Edit</button>
              <button class="btn-delete" @click="deleteCategory(cat)" data-testid="category-delete-button">Delete</button>
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

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal" data-testid="category-modal-overlay">
      <div class="modal-card" data-testid="category-modal">
        <div class="modal-header">
          <h3 data-testid="category-modal-title">{{ selectedCategoryId ? 'Edit Category' : 'Add Category' }}</h3>
          <button class="btn-close" @click="closeModal">✕</button>
        </div>

        <div class="modal-body">
          <p v-if="formError" class="form-error" data-testid="category-form-error">{{ formError }}</p>

          <div class="form-group">
            <label>Category Name *</label>
            <input
              v-model="categoryNameInput"
              type="text"
              placeholder="e.g., Audio Gear"
              class="form-input"
              data-testid="category-name-input"
              @keyup.enter="handleSaveCategory"
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
          <button class="btn-cancel" @click="closeModal" data-testid="category-modal-cancel-button">Cancel</button>
          <button class="btn-save" @click="handleSaveCategory" data-testid="category-modal-save-button">Save Category</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.categories-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Messages */
.banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin: 0;
  padding: 10px 14px;
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fca5a5;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
}
.banner-close { background: none; border: none; color: #b91c1c; cursor: pointer; font-size: 1rem; }
.form-error {
  margin: 0 0 16px;
  padding: 8px 12px;
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fca5a5;
  border-radius: 6px;
  font-size: 0.85rem;
}

/* Action Bar */
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
.search-input {
  width: 360px;
  padding: 10px 16px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  outline: none;
  font-size: 0.9rem;
  background: #fff;
}
.search-input:focus { border-color: #5d5b8d; }
.btn-add {
  background: #1e1b4b;
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

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