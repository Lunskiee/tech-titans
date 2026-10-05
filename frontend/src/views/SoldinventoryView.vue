<script setup>
import { useInventoryStore } from '../stores/inventory'

const store = useInventoryStore()

const money = (n) => `$${Number(n || 0).toFixed(2)}`
const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'

// Voiding cancels the sale and puts the items back in stock
const voidSale = (sale) => {
  if (sale?.id) store.voidSale(sale.id)
}
</script>

<template>
  <div class="sold-view">
    <!-- Warns when changes cannot be saved (e.g. browser storage is full) -->
    <p v-if="store.storageError" class="banner" role="alert" data-testid="storage-error">
      {{ store.storageError }}
    </p>

    <!-- Summary cards -->
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

    <!-- Sales history (created by POS / Sales) -->
    <div class="table-card">
      <table data-testid="sold-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Order</th>
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
            <td data-testid="sale-order-id">#{{ sale.orderId }}</td>
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
            <td colspan="8" class="empty-state" data-testid="empty-sold-message">
              No sales yet. Complete a sale in
              <router-link to="/pos" class="empty-link">POS / Sales</router-link>
              and it will show up here.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.sold-view { padding: 0; }
.banner { margin: 0 0 16px; padding: 10px 14px; background: #fef2f2; color: #b91c1c; border: 1px solid #fca5a5; border-radius: 6px; font-size: 0.9rem; font-weight: 500; }
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
.empty-link { color: #4338ca; font-weight: 600; font-style: normal; }
</style>