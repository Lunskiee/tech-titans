<script setup>
import { ref, computed, watch, inject } from 'vue'
import AddProductModal from '../components/AddProductModal.vue'
import { useNotificationStore } from '../stores/notifications'

const notifications = useNotificationStore()

const showModal = ref(false)
const showFilterDropdown = ref(false)
const selectedCategory = ref('All')

// Inject searchQuery from the parent layout component
const searchQuery = inject('searchQuery', ref(''))

const selectedProductToEdit = ref(null)

// Shared Categories List
const categories = ref(['Electronics', 'Accessories', 'Office Supplies'])

// Products List
const products = ref([
  { id: 1, sku: '#INV-9001', name: 'Wireless Keyboard', category: 'Electronics', stock: 30, unit: 'pcs', price: '28.00', image: null },
  { id: 2, sku: '#INV-9002', name: 'Ergonomic Mouse', category: 'Electronics', stock: 20, unit: 'pcs', price: '25.00', image: null },
  { id: 3, sku: '#INV-9003', name: 'USB-C Hub', category: 'Accessories', stock: 15, unit: 'pcs', price: '45.00', image: null },
])

// Alert when any product is at or below low-stock level
const LOW_STOCK_LEVEL = 10
watch(
  products,
  () => notifications.checkLowStock(products.value, LOW_STOCK_LEVEL),
  { deep: true, immediate: true }
)

// Filter options: 'All' + current categories list
const filterCategories = computed(() => ['All', ...categories.value])

// Combined Filtered products list (Category + Search Query)
const filteredProducts = computed(() => {
  return products.value.filter(p => {
    const matchesCategory = selectedCategory.value === 'All' || p.category === selectedCategory.value
    const query = (searchQuery.value || '').toLowerCase().trim()
    
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

// Open modal for adding
const openAddModal = () => {
  selectedProductToEdit.value = null
  showModal.value = true
}

// Open modal for editing
const openEditModal = (product) => {
  selectedProductToEdit.value = product
  showModal.value = true
}

// Product Handlers
const handleSaveProduct = (productData) => {
  const formattedPrice = Number(productData.price.toString().replace('$', '')).toFixed(2)

  if (productData.id) {
    const index = products.value.findIndex(p => p.id === productData.id)
    if (index !== -1) {
      products.value[index] = {
        ...products.value[index],
        name: productData.name,
        category: productData.category,
        stock: productData.quantity,
        unit: productData.unitType.includes('box') ? 'box' : 'pcs',
        price: formattedPrice,
        image: productData.image
      }
    }
  } else {
    products.value.push({
      id: Date.now(),
      sku: productData.sku,
      name: productData.name,
      category: productData.category,
      stock: productData.quantity,
      unit: productData.unitType.includes('box') ? 'box' : 'pcs',
      price: formattedPrice,
      image: productData.image
    })
  }
  showModal.value = false
}

const deleteProduct = (id) => {
  products.value = products.value.filter(p => p.id !== id)
}
</script>

<template>
  <div class="products-view">
    <div class="action-bar">
      <button 
        class="btn-add" 
        @click="openAddModal" 
        data-testid="add-product-button"
      >
        + Add Product
      </button>
      
      <!-- Filter Dropdown -->
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

    <!-- Data Table -->
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
            <td>{{ item.stock }} {{ item.unit }}</td>
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

    <!-- Modal Component -->
    <AddProductModal 
      :isOpen="showModal" 
      :categories="categories"
      :productToEdit="selectedProductToEdit"
      @close="showModal = false" 
      @save="handleSaveProduct" 
    />
  </div>
</template>

<style scoped>
.products-view {
  padding: 24px;
}

.action-bar { 
  display: flex; 
  gap: 16px; 
  margin-bottom: 24px; 
  position: relative; 
}

.btn-add { 
  background: #1e1b4b; 
  color: #fff; 
  border: none; 
  padding: 10px 20px; 
  border-radius: 6px; 
  cursor: pointer; 
  font-weight: 600; 
}

/* Filter Styling */
.filter-wrapper { position: relative; }
.btn-filter { background: #fff; border: 1px solid #d1d5db; padding: 10px 16px; border-radius: 6px; cursor: pointer; color: #374151; font-size: 0.9rem; }
.btn-filter:hover { background: #f9fafb; }
.filter-dropdown { position: absolute; top: 110%; left: 0; background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 200px; z-index: 10; overflow: hidden; }
.filter-item { padding: 10px 16px; cursor: pointer; font-size: 0.875rem; color: #374151; transition: background 0.15s; }
.filter-item:hover { background: #f3f4f6; }
.filter-item.active { background: #eef2ff; color: #4338ca; font-weight: 600; }

/* Table */
.table-card { background: #fff; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden; }
table { width: 100%; border-collapse: collapse; text-align: left; }
th { background: #8b89b8; color: #fff; padding: 12px 16px; font-size: 0.85rem; }
td { padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 0.9rem; color: #374151; vertical-align: middle; }

.table-thumbnail { width: 40px; height: 40px; border-radius: 6px; object-fit: cover; border: 1px solid #e5e7eb; }
.no-image { color: #9ca3af; text-align: center; width: 40px; }

.action-cells { display: flex; gap: 8px; }
.btn-edit { background: #a5b4fc; border: none; padding: 6px 16px; border-radius: 4px; color: #1e1b4b; cursor: pointer; font-weight: 600; }
.btn-edit:hover { background: #818cf8; color: #fff; }
.btn-delete { background: #ef4444; border: none; padding: 6px 16px; border-radius: 4px; color: #fff; cursor: pointer; font-weight: 600; }
.btn-delete:hover { background: #dc2626; }

.empty-state { text-align: center; color: #6b7280; padding: 32px; font-style: italic; }
</style>