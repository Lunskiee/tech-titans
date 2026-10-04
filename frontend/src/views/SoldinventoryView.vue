<script setup>
import { ref, computed } from 'vue'
import { useInventoryStore } from '../stores/counter'
import { useNotificationStore } from '../stores/notifications'

const store = useInventoryStore()
const notifications = useNotificationStore()

const showModal = ref(false)
const saleProductId = ref(null)
const saleQuantity = ref(1)
const formError = ref('')

const money = (n) => `$${Number(n || 0).toFixed(2)}`
const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'

const sellableProducts = computed(() =>
  (store.detailedProducts || []).filter(p => p.stockQuantity > 0)
)

const selectedProduct = computed(() =>
  sellableProducts.value.find(p => p.id === saleProductId.value) || null
)

const totalPreview = computed(() =>
  selectedProduct.value ? (selectedProduct.value.unitPrice || 0) * (Number(saleQuantity.value) || 0) : 0
)

const openModal = () => {
  saleProductId.value = sellableProducts.value[0]?.id ?? null
  saleQuantity.value = 1
  formError.value = ''
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  formError.value = ''
}

const handleSaveSale = () => {
  const soldTotal = totalPreview.value
  const soldName = selectedProduct.value?.name
  const result = store.recordSale({
    productId: saleProductId.value,
    quantity: saleQuantity.value
  })
  
  if (!result || !result.ok) {
    formError.value = result?.error || 'Failed to record sale.'
    return
  }
  
  notifications.notifySale(soldTotal, 1)
  if (soldName) {
    notifications.checkLowStock(
      (store.detailedProducts || []).map(p => ({ name: p.name, stock: p.stockQuantity })),
      10
    )
  }
  closeModal()
}

const voidSale = (sale) => {
  if (sale?.id) store.voidSale(sale.id)
}
</script>

<template>
  <div class="sold-view">
    <div class="summary-grid">
      <div class="summary-card" data-testid="summary-transactions">
        <p class="summary-label">Transactions</p>
        <p class="summary-value">{{ store.salesSummary?.transactions ?? 0 }}</p>
      </div>
      <div class="summary-card" data-testid="summary-items-sold">
        <p class="summary-label">Items Sold</p>
        <p class="summary-value">{{ store.salesSummary?.itemsSold ?? 0 }}</p>
      </div>
      <div class="summary-card" data-testid="summary-revenue">
        <p class="summary-label">Total Revenue</p>
        <p class="summary-value">{{ money(store.salesSummary?.revenue) }}</p>
      </div>
    </div>

    <div class="action-bar">
      <button class="btn-add" @click="openModal" data-testid="record-sale-button">
        + Record Sale
      </button>
    </div>

    <div class="table-card">
      <table data-testid="sold-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>SKU</th>
            <th>Items</th>
            <th>Qty Sold</th>
            <th>Unit Price</th>
            <th>Total</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="sale in store.salesList" :key="sale.id" data-testid="sale-row">
            <td>{{ formatDate(sale.date) }}</td>
            <td>{{ sale.sku || 'N/A' }}</td>
            <td class="font-medium">{{ sale.name || 'Unknown Item' }}</td>
            <td>{{ sale.quantity }} {{ sale.unitAbbr || '' }}</td>
            <td>{{ money(sale.unitPrice) }}</td>
            <td class="font-medium">{{ money(sale.total) }}</td>
            <td class="action-cells">
              <button class="btn-delete" @click="voidSale(sale)" data-testid="sale-void-button">Void</button>
            </td>
          </tr>
          <tr v-if="(store.salesList || []).length === 0">
            <td colspan="7" class="empty-state" data-testid="empty-sold-message">
              No sales recorded yet.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal" data-testid="sale-modal-overlay">
      <div class="modal-card" data-testid="sale-modal">
        <div class="modal-header">
          <h3 data-testid="sale-modal-title">Record Sale</h3>
          <button type="button" class="btn-close" @click="closeModal">✕</button>
        </div>

        <form @submit.prevent="handleSaveSale" novalidate>
          <div v-if="sellableProducts.length === 0" class="form-error" data-testid="sale-no-stock">
            No products in stock to sell.
          </div>
          <div v-if="formError" class="form-error" data-testid="sale-form-error">{{ formError }}</div>

          <div class="form-group">
            <label>Product *</label>
            <select v-model="saleProductId" class="form-input" data-testid="sale-product-select">
              <option v-for="p in sellableProducts" :key="p.id" :value="p.id">
                {{ p.name }} ({{ p.stockQuantity }} {{ p.unitAbbr || 'pcs' }} left)
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Quantity *</label>
            <input
              v-model.number="saleQuantity"
              type="number"
              min="0"
              step="any"
              class="form-input"
              data-testid="sale-quantity-input"
            />
          </div>

          <div class="total-preview" data-testid="sale-total-preview">
            Total: <strong>{{ money(totalPreview) }}</strong>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-cancel" @click="closeModal" data-testid="sale-modal-cancel-button">Cancel</button>
            <button type="submit" class="btn-save" :disabled="sellableProducts.length === 0" data-testid="sale-modal-save-button">
              Save Sale
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sold-view { padding: 0; }
.action-bar { display: flex; gap: 16px; margin-bottom: 24px; }
.btn-add { background: #1e1b4b; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; }
.summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
.summary-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px 20px; }
.summary-label { margin: 0 0 6px; font-size: 0.8rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.03em; }
.summary-value { margin: 0; font-size: 1.5rem; font-weight: 700; color: #1e1b4b; }
.table-card { background: #fff; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden; }
table { width: 100%; border-collapse: collapse; text-align: left; }
th { background: #8b89b8; color: #fff; padding: 12px 16px; font-size: 0.85rem; }
td { padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 0.9rem; color: #374151; vertical-align: middle; }
.font-medium { font-weight: 600; color: #111827; }
.action-cells { display: flex; gap: 8px; }
.btn-delete { background: #ef4444; border: none; padding: 6px 16px; border-radius: 4px; color: #fff; cursor: pointer; font-weight: 600; }
.btn-delete:hover { background: #dc2626; }
.empty-state { text-align: center; color: #6b7280; padding: 32px; font-style: italic; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.4); display: flex; align-items: center; justify-content: center; z-index: 50; }
.modal-card { background: #fff; border-radius: 8px; width: 420px; padding: 24px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15); }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.modal-header h3 { font-size: 1.1rem; font-weight: 600; margin: 0; }
.btn-close { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #6b7280; }
.form-group { margin-bottom: 16px; display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 0.85rem; font-weight: 600; color: #374151; }
.form-input { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.9rem; outline: none; }
.form-input:focus { border-color: #5d5b8d; }
.form-error { background: #fef2f2; color: #b91c1c; border: 1px solid #fca5a5; border-radius: 6px; padding: 8px 12px; margin-bottom: 16px; font-size: 0.85rem; }
.total-preview { background: #f3f4f6; border-radius: 6px; padding: 10px 12px; font-size: 0.95rem; color: #374151; }
.modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
.btn-cancel { background: #f3f4f6; border: 1px solid #d1d5db; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
.btn-save { background: #1e1b4b; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; }
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
</style>