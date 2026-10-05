<script setup>
import { ref, computed, inject, onMounted } from 'vue'
import AddProductModal from '../components/AddProductModal.vue'
import { useInventoryStore, LOW_STOCK_LEVEL } from '../stores/inventory'

const store = useInventoryStore()

const showModal = ref(false)
const showFilterDropdown = ref(false)
const selectedCategory = ref('All')
const pageMessage = ref('')

// Inject searchQuery from the parent layout component
const searchQuery = inject('searchQuery', ref(''))

const selectedProductToEdit = ref(null)

// Categories and units come from the shared store
const categoryNames = computed(() => (store.categories || []).map(c => c.name))
const filterCategories = computed(() => ['All', ...categoryNames.value])

// Formatted row data for table layout
const rows = computed(() =>
  (store.detailedProducts || []).map(p => ({
    id: p.id,
    sku: p.sku || '',
    name: p.name || '',
    category: p.categoryName || '',
    stock: p.stockQuantity ?? 0,
    unit: p.unitAbbr || '',
    price: Number(p.unitPrice || 0).toFixed(2),
    image: p.image || null
  }))
)

// Check stock on page load
onMounted(() => {
  if (typeof store.checkLowStock === 'function') {
    store.checkLowStock()
  }
})

// Filtered products calculation
const filteredProducts = computed(() => {
  const query = (searchQuery.value || '').toLowerCase().trim()
  return rows.value.filter(p => {
    const matchesCategory = selectedCategory.value === 'All' || p.category === selectedCategory.value
    const matchesSearch = !query ||
      p.name.toLowerCase().includes(query) ||
      p.sku.toLowerCase().includes(query)

    return matchesCategory && matchesSearch
  })
})

const selectFilter = (category) => {
  selectedCategory.value = category
  showFilterDropdown.value = false
}

const openAddModal = () => {
  pageMessage.value = ''
  selectedProductToEdit.value = null
  showModal.value = true
}

const openEditModal = (product) => {
  pageMessage.value = ''
  selectedProductToEdit.value = product
  showModal.value = true
}

const resolveUnit = (unitType = '') => {
  const t = String(unitType).trim().toLowerCase()
  const units = store.units || []
  const exact = units.find(u => t === u.abbreviation.toLowerCase() || t === u.name.toLowerCase())
  if (exact) return exact
  return (
    units.find(u =>
      (u.abbreviation.length > 1 && t.includes(u.abbreviation.toLowerCase())) ||
      t.includes(u.name.toLowerCase())
    ) || units[0]
  )
}

const handleSaveProduct = (productData) => {
  showModal.value = false
  pageMessage.value = ''

  const category = (store.categories || []).find(c => c.name === productData.category)
  const unit = resolveUnit(productData.unitType)

  if (!category) {
    pageMessage.value = 'Choose a category that exists on the Categories page.'
    return
  }
  if (!unit) {
    pageMessage.value = 'Add at least one unit on the Units page first.'
    return
  }

  const price = Math.max(0, Number(String(productData.price).replace(/[^0-9.]/g, '')) || 0)
  const stock = Math.max(0, Number(productData.quantity) || 0)

  const payload = {
    name: productData.name,
    categoryId: category.id,
    unitId: unit.id,
    price,
    stock,
    image: productData.image
  }

  const result = productData.id
    ? store.updateProduct(productData.id, payload)
    : store.addProduct({ sku: productData.sku, ...payload })

  if (result && !result.ok) pageMessage.value = result.error
}

const deleteProduct = (id) => {
  if (typeof store.removeProduct === 'function') {
    store.removeProduct(id)
  }
}
</script>

<template>
  <div class="products-view">
    <p v-if="pageMessage" class="banner" role="alert" data-testid="products-message">
      {{ pageMessage }}
      <button class="banner-close" @click="pageMessage = ''" aria-label="Dismiss">✕</button>
    </p>

    <div class="action-bar">
      <button 
        class="btn-add" 
        @click="openAddModal" 
        data-testid="add-product-button"
      >
        + Add Product
      </button>

      <div class="filter-wrapper">
        <button 
          class="btn-filter" 
          @click="showFilterDropdown = !showFilterDropdown"
          data-testid="filter-dropdown-button"
        >
          ⊞ Filter by Category: <strong>{{ selectedCategory }}</strong>
        </button>

        <div v-if="showFilterDropdown" class="filter-dropdown" data-testid="filter-dropdown-list">
          <div 
            v-for="cat in filterCategories" 
            :key="cat" 
            class="filter-item"
            :class="{ active: selectedCategory === cat }"
            @click="selectFilter(cat)"
            data-testid="filter-category-item"
          >
            {{ cat === 'All' ? 'All Categories' : cat }}
          </div>
        </div>
      </div>
    </div>

    <div class="table-card">
      <table data-testid="products-table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Image</th>
            <th>Items</th>
            <th>Category</th>
            <th>In Stock</th>
            <th>Unit Price</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filteredProducts" :key="item.id" data-testid="product-row">
            <td>{{ item.sku }}</td>
            <td>
              <img v-if="item.image" :src="item.image" class="table-thumbnail" alt="Product Image" />
              <div v-else class="no-image">-</div>
            </td>
            <td>{{ item.name }}</td>
            <td>{{ item.category }}</td>
            <td :class="{ 'low-stock': item.stock <= LOW_STOCK_LEVEL }" data-testid="product-stock">
              {{ item.stock }} {{ item.unit }}
              <span v-if="item.stock <= 0" class="stock-tag out">Out</span>
              <span v-else-if="item.stock <= LOW_STOCK_LEVEL" class="stock-tag low">Low</span>
            </td>
            <td>${{ item.price }}</td>
            <td class="action-cells">
              <button class="btn-edit" @click="openEditModal(item)" data-testid="product-edit-button">Edit</button>
              <button class="btn-delete" @click="deleteProduct(item.id)" data-testid="product-delete-button">Delete</button>
            </td>
          </tr>
          <tr v-if="filteredProducts.length === 0">
            <td colspan="7" class="empty-state" data-testid="empty-products-message">
              No products found matching your search or category filter.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AddProductModal 
      :isOpen="showModal" 
      :categories="categoryNames"
      :productToEdit="selectedProductToEdit"
      @close="showModal = false" 
      @save="handleSaveProduct" 
    />
  </div>
</template>

<style scoped>
.products-view { padding: 24px; }
.banner { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin: 0 0 16px; padding: 10px 14px; background: #fef2f2; color: #b91c1c; border: 1px solid #fca5a5; border-radius: 6px; font-size: 0.9rem; font-weight: 500; }
.banner-close { background: none; border: none; color: #b91c1c; cursor: pointer; font-size: 1rem; }
.action-bar { display: flex; gap: 16px; margin-bottom: 24px; position: relative; }
.btn-add { background: #1e1b4b; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; }
.filter-wrapper { position: relative; }
.btn-filter { background: #fff; border: 1px solid #d1d5db; padding: 10px 16px; border-radius: 6px; cursor: pointer; color: #374151; font-size: 0.9rem; }
.btn-filter:hover { background: #f9fafb; }
.filter-dropdown { position: absolute; top: 110%; left: 0; background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 200px; z-index: 10; overflow: hidden; }
.filter-item { padding: 10px 16px; cursor: pointer; font-size: 0.875rem; color: #374151; transition: background 0.15s; }
.filter-item:hover { background: #f3f4f6; }
.filter-item.active { background: #eef2ff; color: #4338ca; font-weight: 600; }
.table-card { background: #fff; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden; }
table { width: 100%; border-collapse: collapse; text-align: left; }
th { background: #8b89b8; color: #fff; padding: 12px 16px; font-size: 0.85rem; }
td { padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 0.9rem; color: #374151; vertical-align: middle; }
.table-thumbnail { width: 40px; height: 40px; border-radius: 6px; object-fit: cover; border: 1px solid #e5e7eb; }
.no-image { color: #9ca3af; text-align: center; width: 40px; }
.low-stock { color: #92400e; font-weight: 600; }
.stock-tag { margin-left: 6px; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; }
.stock-tag.low { background: #fef3c7; color: #92400e; }
.stock-tag.out { background: #fee2e2; color: #b91c1c; }
.action-cells { display: flex; gap: 8px; }
.btn-edit { background: #a5b4fc; border: none; padding: 6px 16px; border-radius: 4px; color: #1e1b4b; cursor: pointer; font-weight: 600; }
.btn-edit:hover { background: #818cf8; color: #fff; }
.btn-delete { background: #ef4444; border: none; padding: 6px 16px; border-radius: 4px; color: #fff; cursor: pointer; font-weight: 600; }
.btn-delete:hover { background: #dc2626; }
.empty-state { text-align: center; color: #6b7280; padding: 32px; font-style: italic; }
</style>