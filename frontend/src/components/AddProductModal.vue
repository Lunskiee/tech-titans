<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  isOpen: Boolean,
  categories: {
    type: Array,
    default: () => ['Electronics', 'Accessories', 'Office Supplies']
  },
  productToEdit: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'save'])

const fileInputRef = ref(null)

const form = ref({
  id: null,
  name: '',
  sku: '#INV-9004',
  category: 'Electronics',
  unitType: 'Pieces (pcs)',
  quantity: 0,
  price: '0.00',
  image: null
})

const resetForm = () => {
  form.value = {
    id: null,
    name: '',
    sku: `#INV-${Math.floor(1000 + Math.random() * 9000)}`,
    category: props.categories[0] || 'Electronics',
    unitType: 'Pieces (pcs)',
    quantity: 0,
    price: '0.00',
    image: null
  }
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const removeImage = () => {
  form.value.image = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const handleClose = () => {
  resetForm()
  emit('close')
}

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    if (props.productToEdit) {
      form.value = {
        id: props.productToEdit.id,
        name: props.productToEdit.name,
        sku: props.productToEdit.sku,
        category: props.productToEdit.category,
        unitType: props.productToEdit.unit === 'box' ? 'Boxes (box)' : 'Pieces (pcs)',
        quantity: props.productToEdit.stock,
        price: props.productToEdit.price,
        image: props.productToEdit.image
      }
    } else {
      resetForm()
    }
  }
})

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      form.value.image = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const handleSubmit = () => {
  emit('save', { ...form.value })
  resetForm()
  emit('close')
}
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="handleClose" data-testid="product-modal-overlay">
    <div class="modal-card" data-testid="product-modal">
      <div class="modal-header">
        <h3 data-testid="product-modal-title">{{ form.id ? 'Edit Product' : 'Add Product' }}</h3>
        <button type="button" class="close-btn" @click="handleClose" data-testid="product-modal-close-button">&times;</button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-body" data-testid="product-form">
        <div class="form-row">
          <label>Product Name</label>
          <input 
            v-model="form.name" 
            type="text" 
            placeholder="Enter product name" 
            required 
            data-testid="product-name-input"
          />
        </div>

        <div class="form-row">
          <label>SKU / Item Code</label>
          <input 
            v-model="form.sku" 
            type="text" 
            disabled 
            class="disabled-input" 
            data-testid="product-sku-input"
          />
        </div>

        <div class="form-row">
          <label>Category</label>
          <select v-model="form.category" data-testid="product-category-select">
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>

        <div class="form-row">
          <label>Unit Type</label>
          <select v-model="form.unitType" data-testid="product-unit-select">
            <option>Pieces (pcs)</option>
            <option>Boxes (box)</option>
          </select>
        </div>

        <hr class="divider" />

        <div class="grid-2">
          <div class="form-group">
            <label>In Stock Quantity</label>
            <input 
              v-model="form.quantity" 
              type="number" 
              min="0" 
              required 
              data-testid="product-quantity-input"
            />
          </div>
          <div class="form-group">
            <label>Unit Price ($)</label>
            <input 
              v-model="form.price" 
              type="text" 
              placeholder="0.00" 
              required 
              data-testid="product-price-input"
            />
          </div>
        </div>

        <div class="form-group">
          <label>Product Thumbnail</label>
          
          <div v-if="form.image" class="preview-container" data-testid="product-image-preview-container">
            <img :src="form.image" class="image-preview" alt="Thumbnail Preview" data-testid="product-image-preview" />
            <div class="preview-actions">
              <label class="btn-change">
                Change
                <input 
                  ref="fileInputRef" 
                  type="file" 
                  @change="handleFileUpload" 
                  accept="image/*" 
                  class="hidden-input" 
                  data-testid="product-image-change-input"
                />
              </label>
              <button 
                type="button" 
                class="btn-remove-img" 
                @click="removeImage"
                data-testid="product-image-remove-button"
              >
                Remove Image
              </button>
            </div>
          </div>

          <label v-else class="drop-zone" data-testid="product-image-dropzone">
            <svg class="cloud-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 16l-4-4-4 4M12 12v9" />
              <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
            </svg>
            <span>Drag & drop image here, or click to browse files</span>
            <input 
              ref="fileInputRef" 
              type="file" 
              @change="handleFileUpload" 
              accept="image/*" 
              class="hidden-input" 
              data-testid="product-image-upload-input"
            />
          </label>
        </div>

        <div class="modal-footer">
          <button 
            type="button" 
            class="btn-cancel" 
            @click="handleClose"
            data-testid="product-modal-cancel-button"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            class="btn-save"
            data-testid="product-modal-save-button"
          >
            {{ form.id ? 'Update Product' : 'Save Product' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.4); display: flex; align-items: center; justify-content: center; z-index: 50; }
.modal-card { background: #fff; width: 500px; border-radius: 8px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15); overflow: hidden; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-bottom: 1px solid #e5e7eb; }
.modal-header h3 { font-size: 1.1rem; font-weight: 700; color: #1f2937; }
.close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #6b7280; }

.modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 12px; }
.form-row { display: flex; justify-content: space-between; align-items: center; }
.form-row label, .form-group label { font-size: 0.85rem; font-weight: 600; color: #374151; }
.form-row input, .form-row select, .form-group input { width: 60%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.875rem; box-sizing: border-box; }

.disabled-input { background-color: #e5e7eb; color: #6b7280; }
.divider { border: 0; border-top: 1px solid #e5e7eb; margin: 8px 0; }

.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.grid-2 input { width: 100%; margin-top: 4px; }

.drop-zone { margin-top: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 16px; border: 2px dashed #9ca3af; border-radius: 6px; background: #f9fafb; cursor: pointer; text-align: center; font-size: 0.8rem; color: #4b5563; min-height: 100px; }
.cloud-icon { width: 36px; height: 36px; stroke: #9ca3af; margin-bottom: 8px; }

.preview-container { margin-top: 6px; display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border: 1px solid #d1d5db; border-radius: 6px; background: #f9fafb; }
.image-preview { max-height: 60px; width: 60px; border-radius: 6px; object-fit: cover; border: 1px solid #e5e7eb; }
.preview-actions { display: flex; gap: 8px; }

.btn-change { padding: 6px 12px; background: #e0e7ff; color: #3730a3; border-radius: 4px; font-size: 0.8rem; font-weight: 600; cursor: pointer; }
.btn-remove-img { padding: 6px 12px; background: #fef2f2; color: #dc2626; border: 1px solid #fca5a5; border-radius: 4px; font-size: 0.8rem; font-weight: 600; cursor: pointer; }
.btn-remove-img:hover { background: #fee2e2; }

.hidden-input { display: none; }

.modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; }
.btn-cancel { padding: 8px 16px; background: #fff; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; }
.btn-save { padding: 8px 20px; background: #5d5b8d; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
.btn-save:hover { background: #4c4a75; }
</style>