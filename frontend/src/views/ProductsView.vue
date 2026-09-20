<script setup>
import { ref, computed } from 'vue'
import AddProductModal from '../components/AddProductModal.vue'
import logoImg from '../assets/logo.svg'

const showModal = ref(false)
const showFilterDropdown = ref(false)
const selectedCategory = ref('All')
const searchQuery = ref('')
const selectedProductToEdit = ref(null)

const categories = ref(['Electronics', 'Accessories', 'Office Supplies'])

const products = ref([
  { id: 1, sku: '#INV-9001', name: 'Wireless Keyboard', category: 'Electronics', stock: 30, unit: 'pcs', price: '28.00', image: null },
  { id: 2, sku: '#INV-9002', name: 'Ergonomic Mouse', category: 'Electronics', stock: 20, unit: 'pcs', price: '25.00', image: null },
  { id: 3, sku: '#INV-9003', name: 'USB-C Hub', category: 'Accessories', stock: 15, unit: 'pcs', price: '45.00', image: null },
])

const filterCategories = computed(() => ['All', ...categories.value])

const filteredProducts = computed(() => {
  return products.value.filter(p => {
    const matchesCategory = selectedCategory.value === 'All' || p.category === selectedCategory.value
    const query = searchQuery.value.toLowerCase().trim()
    
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
  selectedProductToEdit.value = null
  showModal.value = true
}

const openEditModal = (product) => {
  selectedProductToEdit.value = product
  showModal.value = true
}

const handleSaveProduct = (productData) => {
  if (productData.id) {
    const index = products.value.findIndex(p => p.id === productData.id)
    if (index !== -1) {
      products.value[index] = {
        ...products.value[index],
        name: productData.name,
        category: productData.category,
        stock: productData.quantity,
        unit: productData.unitType.includes('box') ? 'box' : 'pcs',
        price: productData.price.toString().replace('$', ''),
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
      price: productData.price.toString().replace('$', ''),
      image: productData.image
    })
  }
}

const deleteProduct = (id) => {
  products.value = products.value.filter(p => p.id !== id)
}
</script>

<template>
  <div class="dashboard-container">
    <aside class="sidebar">
      <div class="brand">
        <img :src="logoImg" alt="Vaulto Logo" class="brand-logo" />
      </div>

      <nav class="nav-section">
        <p class="section-title">Platform</p>
        <router-link to="/products" class="nav-item active">All Products</router-link>
        <router-link to="/categories" class="nav-item">Categories</router-link>
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

    <main class="main-content">
      <header class="topbar">
        <div class="page-title">&lt; All Products</div>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search by product name or SKU..." 
          class="search-input" 
          data-testid="product-search-input"
        />
        <div class="user-profile">
          <span class="bell-icon">🔔</span>
          <div class="avatar"></div>
          <span class="user-name">Sarah Geronimo</span>
        </div>
      </header>

      <div class="content-body">
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
      </div>
    </main>

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
.dashboard-container { display: flex; width: 100vw; height: 100vh; background: #f3f4f6; }

.sidebar { width: 240px; background: #5d5b8d; color: #fff; padding: 20px 0; display: flex; flex-direction: column; }
.brand { padding: 0 24px 16px; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; }
.brand-logo { height: 48px; width: auto; max-width: 100%; display: block; object-fit: contain; }
.nav-section { padding: 16px 12px; }
.section-title { font-size: 0.75rem; text-transform: uppercase; color: #a5a3cf; margin: 16px 12px 8px; }
.nav-item { display: block; padding: 10px 12px; color: #d1d0e6; text-decoration: none; border-radius: 6px; font-size: 0.9rem; }
.nav-item.active, .nav-item:hover { background: #4c4a75; color: #fff; }

.main-content { flex: 1; display: flex; flex-direction: column; }
.topbar { height: 64px; background: #5d5b8d; display: flex; align-items: center; justify-content: space-between; padding: 0 32px; color: #fff; }
.page-title { font-weight: 600; font-size: 1.1rem; }
.search-input { width: 400px; padding: 8px 16px; border-radius: 6px; border: none; outline: none; font-size: 0.9rem; }
.user-profile { display: flex; align-items: center; gap: 12px; }
.avatar { width: 32px; height: 32px; border-radius: 50%; background: #d1d5db; }

.content-body { padding: 32px; }
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

.action-cells { display: flex; gap: 8px; }
.btn-edit { background: #a5b4fc; border: none; padding: 6px 16px; border-radius: 4px; color: #1e1b4b; cursor: pointer; font-weight: 600; }
.btn-edit:hover { background: #818cf8; color: #fff; }
.btn-delete { background: #ef4444; border: none; padding: 6px 16px; border-radius: 4px; color: #fff; cursor: pointer; font-weight: 600; }
.btn-delete:hover { background: #dc2626; }

.empty-state { text-align: center; color: #6b7280; padding: 32px; font-style: italic; }
</style>