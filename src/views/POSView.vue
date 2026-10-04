<script setup>
import { ref, computed } from 'vue'
import NotificationBell from '../components/NotificationBell.vue'
import logoImg from '../assets/logo.svg'
import { useInventoryStore } from '../stores/counter'
import { useNotificationStore } from '../stores/notifications'

const store = useInventoryStore()
const notifications = useNotificationStore()

const searchQuery = ref('')
const categoryFilter = ref('all')
const cart = ref([])            // [{ productId, quantity }]
const cashReceived = ref('')
const checkoutError = ref('')
const receipt = ref(null)

const money = (n) => `$${Number(n).toFixed(2)}`

// ---------- Product catalog (left side) ----------
const catalog = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  return store.detailedProducts.filter(p => {
    const matchesCategory = categoryFilter.value === 'all' || p.categoryId === categoryFilter.value
    const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    return matchesCategory && matchesSearch
  })
})

// ---------- Cart (right side) ----------
const cartLines = computed(() =>
  cart.value
    .map(item => {
      const product = store.detailedProducts.find(p => p.id === item.productId)
      if (!product) return null
      return {
        ...product,
        quantity: item.quantity,
        lineTotal: Math.round(product.unitPrice * item.quantity * 100) / 100
      }
    })
    .filter(Boolean)
)

const cartTotal = computed(() =>
  Math.round(cartLines.value.reduce((sum, l) => sum + l.lineTotal, 0) * 100) / 100
)

const change = computed(() => {
  if (cashReceived.value === '' || cashReceived.value === null) return null
  return Math.round((Number(cashReceived.value) - cartTotal.value) * 100) / 100
})

const addToCart = (product) => {
  checkoutError.value = ''
  const line = cart.value.find(i => i.productId === product.id)
  if (line) {
    if (line.quantity + 1 > product.stockQuantity) {
      checkoutError.value = `Only ${product.stockQuantity} of ${product.name} in stock.`
      return
    }
    line.quantity += 1
  } else if (product.stockQuantity > 0) {
    cart.value.push({ productId: product.id, quantity: 1 })
  }
}

const setQuantity = (line, value) => {
  checkoutError.value = ''
  const qty = Number(value)
  const item = cart.value.find(i => i.productId === line.id)
  if (!item) return
  if (!qty || qty <= 0) return removeFromCart(line.id)
  if (qty > line.stockQuantity) {
    checkoutError.value = `Only ${line.stockQuantity} of ${line.name} in stock.`
    item.quantity = line.stockQuantity
    return
  }
  item.quantity = qty
}

const changeQuantity = (line, delta) => setQuantity(line, line.quantity + delta)

const removeFromCart = (productId) => {
  cart.value = cart.value.filter(i => i.productId !== productId)
}

const clearCart = () => {
  cart.value = []
  cashReceived.value = ''
  checkoutError.value = ''
}

// ---------- Checkout ----------
const charge = () => {
  checkoutError.value = ''
  if (cartLines.value.length === 0) {
    checkoutError.value = 'Add at least one item to the cart.'
    return
  }
  if (change.value !== null && change.value < 0) {
    checkoutError.value = 'Cash received is less than the total.'
    return
  }

  const result = store.checkout(cart.value.map(i => ({ productId: i.productId, quantity: i.quantity })))
  if (!result.ok) {
    checkoutError.value = result.error
    return
  }

  // Keep a snapshot for the receipt before clearing the cart
  receipt.value = {
    orderId: result.orderId,
    date: new Date(),
    lines: cartLines.value.map(l => ({
      name: l.name, quantity: l.quantity, unitAbbr: l.unitAbbr,
      unitPrice: l.unitPrice, lineTotal: l.lineTotal
    })),
    total: result.total,
    received: cashReceived.value === '' ? null : Number(cashReceived.value),
    change: change.value
  }
  clearCart()

  // Notifications: sale completed, then warn about anything that is now running low
  notifications.notifySale(result.total, receipt.value.lines.length)
  notifications.checkLowStock(
    store.detailedProducts.map(p => ({ name: p.name, stock: p.stockQuantity })),
    10
  )
}

const closeReceipt = () => { receipt.value = null }
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
        <router-link to="/units" class="nav-item">Units</router-link>

        <p class="section-title">Transaction & Records</p>
        <router-link to="/sold" class="nav-item">Sold Inventory</router-link>
        <router-link to="/pos" class="nav-item active">POS / Sales</router-link>
        <router-link to="/memos" class="nav-item">Memos</router-link>
        <router-link to="/contacts" class="nav-item">Contacts</router-link>

        <p class="section-title">Others</p>
        <router-link to="/settings" class="nav-item">Settings</router-link>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <header class="topbar">
        <div class="page-title">&lt; POS / Sales</div>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by product name or SKU..."
          class="search-input"
          data-testid="pos-search-input"
        />
        <div class="user-profile">
          <NotificationBell />
          <div class="avatar"></div>
          <span class="user-name">Sarah Geronimo</span>
        </div>
      </header>

      <div class="pos-layout">
        <!-- Left: products -->
        <section class="catalog">
          <div class="catalog-toolbar">
            <select v-model="categoryFilter" class="filter-select" data-testid="pos-category-filter">
              <option value="all">All categories</option>
              <option v-for="c in store.categories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>

          <div class="product-grid">
            <button
              v-for="p in catalog"
              :key="p.id"
              type="button"
              class="product-card"
              :class="{ 'out-of-stock': p.stockQuantity <= 0 }"
              :disabled="p.stockQuantity <= 0"
              @click="addToCart(p)"
              data-testid="pos-product-card"
            >
              <span class="product-name">{{ p.name }}</span>
              <span class="product-sku">{{ p.sku }} · {{ p.categoryName }}</span>
              <span class="product-price">{{ money(p.unitPrice) }} <small>/ {{ p.unitAbbr }}</small></span>
              <span class="product-stock" :class="{ low: p.stockQuantity > 0 && p.stockQuantity <= 5 }">
                {{ p.stockQuantity <= 0 ? 'Out of stock' : `${p.stockQuantity} ${p.unitAbbr} left` }}
              </span>
            </button>

            <p v-if="catalog.length === 0" class="empty-state" data-testid="pos-empty-catalog">
              No products found.
            </p>
          </div>
        </section>

        <!-- Right: cart -->
        <aside class="cart" data-testid="pos-cart">
          <div class="cart-header">
            <h3>Current Sale</h3>
            <button
              v-if="cartLines.length"
              type="button"
              class="link-btn"
              @click="clearCart"
              data-testid="pos-clear-cart"
            >Clear</button>
          </div>

          <div class="cart-lines">
            <p v-if="cartLines.length === 0" class="empty-cart" data-testid="pos-empty-cart">
              Cart is empty. Click a product to add it.
            </p>

            <div v-for="line in cartLines" :key="line.id" class="cart-line" data-testid="pos-cart-line">
              <div class="line-info">
                <span class="line-name">{{ line.name }}</span>
                <span class="line-sub">{{ money(line.unitPrice) }} / {{ line.unitAbbr }}</span>
              </div>
              <div class="qty-controls">
                <button type="button" class="qty-btn" @click="changeQuantity(line, -1)" data-testid="pos-qty-minus">−</button>
                <input
                  :value="line.quantity"
                  @change="setQuantity(line, $event.target.value)"
                  type="number"
                  min="0"
                  step="any"
                  class="qty-input"
                  data-testid="pos-qty-input"
                />
                <button type="button" class="qty-btn" @click="changeQuantity(line, 1)" data-testid="pos-qty-plus">+</button>
              </div>
              <span class="line-total">{{ money(line.lineTotal) }}</span>
              <button type="button" class="remove-btn" @click="removeFromCart(line.id)" aria-label="Remove" data-testid="pos-remove-line">✕</button>
            </div>
          </div>

          <div class="cart-footer">
            <div v-if="checkoutError" class="form-error" data-testid="pos-error">{{ checkoutError }}</div>

            <div class="total-row">
              <span>Total</span>
              <strong data-testid="pos-total">{{ money(cartTotal) }}</strong>
            </div>

            <div class="cash-row">
              <label for="cash">Cash received</label>
              <input
                id="cash"
                v-model="cashReceived"
                type="number"
                min="0"
                step="any"
                placeholder="Optional"
                class="cash-input"
                data-testid="pos-cash-input"
              />
            </div>

            <div v-if="change !== null" class="change-row" :class="{ short: change < 0 }" data-testid="pos-change">
              {{ change < 0 ? `Short by ${money(Math.abs(change))}` : `Change: ${money(change)}` }}
            </div>

            <button
              type="button"
              class="btn-charge"
              :disabled="cartLines.length === 0"
              @click="charge"
              data-testid="pos-charge-button"
            >
              Complete Sale
            </button>
          </div>
        </aside>
      </div>
    </main>

    <!-- Receipt modal -->
    <div v-if="receipt" class="modal-overlay" @click.self="closeReceipt" data-testid="pos-receipt-overlay">
      <div class="modal-card" data-testid="pos-receipt">
        <div class="modal-header">
          <h3>Sale Complete</h3>
          <button type="button" class="btn-close" @click="closeReceipt">✕</button>
        </div>

        <p class="receipt-meta">
          Order #{{ receipt.orderId }} · {{ receipt.date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) }}
        </p>

        <table class="receipt-table">
          <tbody>
            <tr v-for="(l, i) in receipt.lines" :key="i" data-testid="pos-receipt-line">
              <td>{{ l.name }}<br /><small>{{ l.quantity }} {{ l.unitAbbr }} × {{ money(l.unitPrice) }}</small></td>
              <td class="right">{{ money(l.lineTotal) }}</td>
            </tr>
          </tbody>
        </table>

        <div class="receipt-totals">
          <div class="total-row"><span>Total</span><strong data-testid="pos-receipt-total">{{ money(receipt.total) }}</strong></div>
          <div v-if="receipt.received !== null" class="receipt-small"><span>Cash received</span><span>{{ money(receipt.received) }}</span></div>
          <div v-if="receipt.change !== null" class="receipt-small"><span>Change</span><span data-testid="pos-receipt-change">{{ money(receipt.change) }}</span></div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-save" @click="closeReceipt" data-testid="pos-receipt-done">New Sale</button>
        </div>
      </div>
    </div>
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
.nav-item.active, .nav-item:hover { background: #4c4a75; color: #fff; }

/* Main Area */
.main-content { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.topbar { height: 64px; min-height: 64px; background: #5d5b8d; display: flex; align-items: center; justify-content: space-between; padding: 0 32px; color: #fff; }
.page-title { font-weight: 600; font-size: 1.1rem; }
.search-input { width: 400px; padding: 8px 16px; border-radius: 6px; border: none; outline: none; font-size: 0.9rem; }
.user-profile { display: flex; align-items: center; gap: 12px; }
.avatar { width: 32px; height: 32px; border-radius: 50%; background: #d1d5db; }

/* POS layout */
.pos-layout { flex: 1; display: flex; gap: 24px; padding: 24px 32px; min-height: 0; }
.catalog { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.catalog-toolbar { margin-bottom: 16px; }
.filter-select { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; font-size: 0.9rem; }

.product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 16px; overflow-y: auto; align-content: start; padding-bottom: 8px; }
.product-card { display: flex; flex-direction: column; gap: 6px; text-align: left; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px 16px; cursor: pointer; font: inherit; transition: border-color 0.15s, box-shadow 0.15s; }
.product-card:hover:not(:disabled) { border-color: #5d5b8d; box-shadow: 0 2px 8px rgba(93, 91, 141, 0.2); }
.product-card.out-of-stock { opacity: 0.55; cursor: not-allowed; }
.product-name { font-weight: 600; color: #111827; }
.product-sku { font-size: 0.75rem; color: #6b7280; }
.product-price { font-size: 1.1rem; font-weight: 700; color: #1e1b4b; }
.product-price small { font-weight: 400; color: #6b7280; font-size: 0.75rem; }
.product-stock { font-size: 0.8rem; color: #059669; }
.product-stock.low { color: #d97706; }
.out-of-stock .product-stock { color: #dc2626; }
.empty-state { grid-column: 1 / -1; text-align: center; color: #6b7280; padding: 32px; font-style: italic; }

/* Cart */
.cart { width: 380px; flex-shrink: 0; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; display: flex; flex-direction: column; min-height: 0; }
.cart-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #e5e7eb; }
.cart-header h3 { margin: 0; font-size: 1.05rem; }
.link-btn { background: none; border: none; color: #dc2626; cursor: pointer; font-weight: 600; font-size: 0.85rem; }
.cart-lines { flex: 1; overflow-y: auto; padding: 8px 20px; }
.empty-cart { color: #6b7280; font-style: italic; text-align: center; padding: 32px 0; font-size: 0.9rem; }
.cart-line { display: grid; grid-template-columns: 1fr auto auto auto; align-items: center; gap: 10px; padding: 12px 0; border-bottom: 1px solid #f3f4f6; }
.line-info { display: flex; flex-direction: column; min-width: 0; }
.line-name { font-weight: 600; font-size: 0.9rem; color: #111827; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.line-sub { font-size: 0.75rem; color: #6b7280; }
.qty-controls { display: flex; align-items: center; gap: 4px; }
.qty-btn { width: 26px; height: 26px; border: 1px solid #d1d5db; background: #f9fafb; border-radius: 4px; cursor: pointer; font-weight: 700; }
.qty-btn:hover { background: #e0e7ff; }
.qty-input { width: 48px; text-align: center; padding: 4px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.85rem; }
.line-total { font-weight: 600; font-size: 0.9rem; min-width: 60px; text-align: right; }
.remove-btn { background: none; border: none; color: #9ca3af; cursor: pointer; }
.remove-btn:hover { color: #dc2626; }

.cart-footer { padding: 16px 20px; border-top: 1px solid #e5e7eb; display: flex; flex-direction: column; gap: 12px; }
.total-row { display: flex; justify-content: space-between; align-items: center; font-size: 1.15rem; }
.cash-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; font-size: 0.85rem; font-weight: 600; color: #374151; }
.cash-input { width: 140px; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.9rem; }
.change-row { background: #ecfdf5; color: #047857; border-radius: 6px; padding: 8px 12px; font-weight: 600; font-size: 0.9rem; }
.change-row.short { background: #fef2f2; color: #b91c1c; }
.btn-charge { background: #1e1b4b; color: #fff; border: none; padding: 12px; border-radius: 6px; cursor: pointer; font-weight: 700; font-size: 1rem; }
.btn-charge:hover:not(:disabled) { background: #312e81; }
.btn-charge:disabled { opacity: 0.5; cursor: not-allowed; }
.form-error { background: #fef2f2; color: #b91c1c; border: 1px solid #fca5a5; border-radius: 6px; padding: 8px 12px; font-size: 0.85rem; }

/* Receipt modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.4); display: flex; align-items: center; justify-content: center; z-index: 50; }
.modal-card { background: #fff; border-radius: 8px; width: 400px; padding: 24px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15); }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.modal-header h3 { font-size: 1.1rem; font-weight: 600; margin: 0; }
.btn-close { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #6b7280; }
.receipt-meta { color: #6b7280; font-size: 0.85rem; margin: 0 0 16px; }
.receipt-table { width: 100%; border-collapse: collapse; }
.receipt-table td { padding: 8px 0; border-bottom: 1px dashed #e5e7eb; font-size: 0.9rem; vertical-align: top; }
.receipt-table small { color: #6b7280; }
.right { text-align: right; }
.receipt-totals { margin-top: 12px; display: flex; flex-direction: column; gap: 6px; }
.receipt-small { display: flex; justify-content: space-between; font-size: 0.9rem; color: #374151; }
.modal-footer { display: flex; justify-content: flex-end; margin-top: 20px; }
.btn-save { background: #1e1b4b; color: #fff; border: none; padding: 8px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; }
</style>