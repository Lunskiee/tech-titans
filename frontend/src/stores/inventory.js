import { ref, reactive, computed, watch, nextTick } from 'vue'
import { useNotificationStore } from './notifications'
import { useAuthStore } from './auth'
import { useActivityStore } from './activity'

// One shared source of truth for Products, Units, Categories, POS and Sold Inventory.
// Saved in this browser's localStorage. Swap the actions for API calls when you add a backend.
const STORAGE_KEY = 'vaulto-inventory'
export const LOW_STOCK_LEVEL = 10

const load = () => {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return data && data.version === 1 ? data : null
  } catch {
    return null
  }
}

const saved = load()
const notifications = useNotificationStore()
const auth = useAuthStore()
const activity = useActivityStore()

const round2 = (n) => Math.round(Number(n) * 100) / 100
const round3 = (n) => Math.round(Number(n) * 1000) / 1000
const same = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase()

// ---------- State ----------
const units = ref(
  saved?.units || [
    { id: 1, name: 'Pieces', abbreviation: 'pcs', description: 'Individual standalone items' },
    { id: 2, name: 'Box', abbreviation: 'box', description: 'Packaged boxed inventory items' },
    { id: 3, name: 'Kilograms', abbreviation: 'kg', description: 'Weight measurement for bulk inventory' },
    { id: 4, name: 'Liters', abbreviation: 'L', description: 'Liquid volume measurement' },
  ]
)

const categories = ref(
  saved?.categories || [
    { id: 1, name: 'Electronics', description: 'Gadgets, peripherals, and electronic hardware' },
    { id: 2, name: 'Accessories', description: 'Cables, adapters, and setup additions' },
    { id: 3, name: 'Office Supplies', description: 'Stationery and daily office essentials' },
  ]
)

const products = ref(
  saved?.products || [
    { id: 1, sku: '#INV-9001', name: 'Wireless Keyboard', categoryId: 1, unitId: 1, price: 28, stock: 30, image: null },
    { id: 2, sku: '#INV-9002', name: 'Ergonomic Mouse', categoryId: 1, unitId: 1, price: 25, stock: 20, image: null },
    { id: 3, sku: '#INV-9003', name: 'USB-C Hub', categoryId: 2, unitId: 1, price: 45, stock: 15, image: null },
  ]
)

// One row per item sold. Items from the same checkout share an orderId.
const sales = ref(saved?.sales || [])
const lastOrderId = ref(saved?.lastOrderId || 1000)

// Message shown by pages when the browser could not save (empty when everything is saved)
const storageError = ref('')

// ---------- Derived data ----------
// Products with their category and unit filled in (what Products, POS and Sold Inventory read)
const detailedProducts = computed(() =>
  products.value.map((p) => {
    const category = categories.value.find((c) => c.id === p.categoryId)
    const unit = units.value.find((u) => u.id === p.unitId)
    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      image: p.image || null,
      categoryId: p.categoryId,
      categoryName: category?.name || 'Uncategorized',
      unitId: p.unitId,
      unitName: unit?.name || '',
      unitAbbr: unit?.abbreviation || '',
      unitPrice: Number(p.price),
      stockQuantity: Number(p.stock),
    }
  })
)

const salesList = computed(() => [...sales.value].sort((a, b) => new Date(b.date) - new Date(a.date)))

const salesSummary = computed(() => ({
  transactions: new Set(sales.value.map((s) => s.orderId)).size,
  itemsSold: round3(sales.value.reduce((n, s) => n + Number(s.quantity), 0)),
  revenue: round2(sales.value.reduce((n, s) => n + Number(s.total), 0)),
}))

// ---------- Notifications ----------
// Raises "low stock" alerts for anything at or below the level (already-unread alerts are not repeated)
const checkLowStock = () =>
  notifications.checkLowStock(
    detailedProducts.value.map((p) => ({ name: p.name, stock: p.stockQuantity })),
    LOW_STOCK_LEVEL
  )

// ---------- Products ----------
const skuExists = (sku, exceptId = null) =>
  products.value.some((p) => p.id !== exceptId && same(p.sku, sku))

const addProduct = ({ sku, name, categoryId, unitId, price, stock, image = null }) => {
  if (!String(name || '').trim()) return { ok: false, error: 'Product name is required.' }
  if (!String(sku || '').trim()) return { ok: false, error: 'SKU is required.' }
  if (skuExists(sku)) return { ok: false, error: `The SKU ${sku} is already used by another product.` }

  products.value.push({
    id: Date.now(),
    sku: String(sku).trim(),
    name: String(name).trim(),
    categoryId,
    unitId,
    price: round2(price),
    stock: round3(stock),
    image,
  })
  activity.log({
    type: 'product_add',
    message: `Added product "${String(name).trim()}" (${String(sku).trim()})`,
    actor: auth.user,
  })
  checkLowStock()
  return { ok: true }
}

const updateProduct = (id, patch) => {
  const product = products.value.find((p) => p.id === id)
  if (!product) return { ok: false, error: 'Product not found.' }
  if (patch.name !== undefined) product.name = String(patch.name).trim()
  if (patch.categoryId !== undefined) product.categoryId = patch.categoryId
  if (patch.unitId !== undefined) product.unitId = patch.unitId
  if (patch.price !== undefined) product.price = round2(patch.price)
  if (patch.stock !== undefined) product.stock = round3(patch.stock)
  if (patch.image !== undefined) product.image = patch.image
  activity.log({
    type: 'product_edit',
    message: `Edited product "${product.name}" (${product.sku})`,
    actor: auth.user,
  })
  checkLowStock()
  return { ok: true }
}

const removeProduct = (id) => {
  const product = products.value.find((p) => p.id === id)
  products.value = products.value.filter((p) => p.id !== id)
  if (product) {
    activity.log({
      type: 'product_delete',
      message: `Deleted product "${product.name}" (${product.sku})`,
      actor: auth.user,
    })
  }
  return { ok: true }
}

// ---------- Units ----------
const addUnit = ({ name, abbreviation, description = '' }) => {
  if (!String(name || '').trim() || !String(abbreviation || '').trim()) {
    return { ok: false, error: 'Unit name and abbreviation are required.' }
  }
  if (units.value.some((u) => same(u.name, name) || same(u.abbreviation, abbreviation))) {
    return { ok: false, error: 'A unit with that name or abbreviation already exists.' }
  }
  units.value.push({
    id: Date.now(),
    name: String(name).trim(),
    abbreviation: String(abbreviation).trim(),
    description: String(description).trim(),
  })
  return { ok: true }
}

const updateUnit = (id, { name, abbreviation, description = '' }) => {
  const unit = units.value.find((u) => u.id === id)
  if (!unit) return { ok: false, error: 'Unit not found.' }
  if (!String(name || '').trim() || !String(abbreviation || '').trim()) {
    return { ok: false, error: 'Unit name and abbreviation are required.' }
  }
  if (units.value.some((u) => u.id !== id && (same(u.name, name) || same(u.abbreviation, abbreviation)))) {
    return { ok: false, error: 'Another unit already uses that name or abbreviation.' }
  }
  unit.name = String(name).trim()
  unit.abbreviation = String(abbreviation).trim()
  unit.description = String(description).trim()
  return { ok: true }
}

const removeUnit = (id) => {
  const unit = units.value.find((u) => u.id === id)
  if (!unit) return { ok: false, error: 'Unit not found.' }
  const used = products.value.filter((p) => p.unitId === id).length
  if (used) {
    return { ok: false, error: `"${unit.name}" is used by ${used} product${used > 1 ? 's' : ''}. Change those products first.` }
  }
  units.value = units.value.filter((u) => u.id !== id)
  return { ok: true }
}

// ---------- Categories ----------
const addCategory = ({ name, description = '' }) => {
  if (!String(name || '').trim()) return { ok: false, error: 'Category name is required.' }
  if (categories.value.some((c) => same(c.name, name))) return { ok: false, error: 'That category already exists.' }
  categories.value.push({ id: Date.now(), name: String(name).trim(), description: String(description).trim() })
  activity.log({
    type: 'category_add',
    message: `Added category "${String(name).trim()}"`,
    actor: auth.user,
  })
  return { ok: true }
}

const updateCategory = (id, { name, description = '' }) => {
  const category = categories.value.find((c) => c.id === id)
  if (!category) return { ok: false, error: 'Category not found.' }
  if (!String(name || '').trim()) return { ok: false, error: 'Category name is required.' }
  if (categories.value.some((c) => c.id !== id && same(c.name, name))) {
    return { ok: false, error: 'Another category already uses that name.' }
  }
  category.name = String(name).trim()
  category.description = String(description).trim()
  activity.log({
    type: 'category_edit',
    message: `Edited category "${category.name}"`,
    actor: auth.user,
  })
  return { ok: true }
}

const removeCategory = (id) => {
  const category = categories.value.find((c) => c.id === id)
  if (!category) return { ok: false, error: 'Category not found.' }
  const used = products.value.filter((p) => p.categoryId === id).length
  if (used) {
    return { ok: false, error: `"${category.name}" is used by ${used} product${used > 1 ? 's' : ''}. Move those products first.` }
  }
  categories.value = categories.value.filter((c) => c.id !== id)
  activity.log({
    type: 'category_delete',
    message: `Deleted category "${category.name}"`,
    actor: auth.user,
  })
  return { ok: true }
}

// ---------- Sales ----------
// items: [{ productId, quantity }]. Either every item sells or nothing changes.
const checkout = (items) => {
  if (!Array.isArray(items) || !items.length) return { ok: false, error: 'Add at least one item.' }

  const wanted = new Map()
  for (const item of items) {
    const qty = Number(item.quantity)
    if (!(qty > 0)) return { ok: false, error: 'Quantity must be greater than zero.' }
    wanted.set(item.productId, (wanted.get(item.productId) || 0) + qty)
  }

  const lines = []
  for (const [productId, qty] of wanted) {
    const product = products.value.find((p) => p.id === productId)
    if (!product) return { ok: false, error: 'A product in this sale no longer exists.' }
    if (qty > Number(product.stock)) return { ok: false, error: `Only ${product.stock} of ${product.name} in stock.` }
    lines.push({ product, qty })
  }

  const orderId = ++lastOrderId.value
  const date = new Date().toISOString()
  let total = 0

  lines.forEach(({ product, qty }, i) => {
    const lineTotal = round2(Number(product.price) * qty)
    total += lineTotal
    product.stock = round3(Number(product.stock) - qty)
    sales.value.push({
      id: `${orderId}-${i + 1}`,
      orderId,
      date,
      productId: product.id,
      sku: product.sku,
      name: product.name,
      quantity: qty,
      unitAbbr: units.value.find((u) => u.id === product.unitId)?.abbreviation || '',
      unitPrice: Number(product.price),
      total: lineTotal,
      // Which account made this sale
      soldById: auth.user?.id ?? null,
      soldByName: auth.user?.fullName || 'Unknown',
    })
  })

  activity.log({
    type: 'sale',
    message: `Completed sale #${orderId} (${lines.length} ${lines.length === 1 ? 'item' : 'items'})`,
    actor: auth.user,
    amount: round2(total),
  })
  checkLowStock()
  return { ok: true, orderId, total: round2(total) }
}

// Single-item sale (kept for compatibility; the POS page uses checkout)
const recordSale = ({ productId, quantity }) => checkout([{ productId, quantity }])

// Cancels a sale and puts the items back in stock
const voidSale = (id) => {
  const index = sales.value.findIndex((s) => s.id === id)
  if (index === -1) return { ok: false, error: 'Sale not found.' }
  const sale = sales.value[index]
  const product = products.value.find((p) => p.id === sale.productId)
  if (product) product.stock = round3(Number(product.stock) + Number(sale.quantity))
  sales.value.splice(index, 1)
  activity.log({
    type: 'sale_void',
    message: `Voided sale #${sale.orderId}: ${sale.name} × ${sale.quantity}`,
    actor: auth.user,
    amount: sale.total,
  })
  return { ok: true }
}

// ---------- Saving ----------
// While another tab's changes are being loaded in, do not save them straight back
let applyingExternal = false

// Keep everything after a page refresh
watch(
  [units, categories, products, sales, lastOrderId],
  () => {
    if (applyingExternal) return
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: 1,
          units: units.value,
          categories: categories.value,
          products: products.value,
          sales: sales.value,
          lastOrderId: lastOrderId.value,
        })
      )
      storageError.value = ''
    } catch (error) {
      // Storage full or unavailable (large product images are the usual cause)
      console.warn('Could not save to localStorage:', error)
      storageError.value =
        'Browser storage is full, so recent changes will be lost on reload. Use smaller product images.'
    }
  },
  { deep: true }
)

// When another tab changes the inventory (for example a staff tab makes a sale),
// load it here so this tab stays up to date and never overwrites it.
window.addEventListener('storage', (event) => {
  if (event.key !== STORAGE_KEY) return
  const data = load()
  if (!data) return
  applyingExternal = true
  units.value = data.units || []
  categories.value = data.categories || []
  products.value = data.products || []
  sales.value = data.sales || []
  lastOrderId.value = data.lastOrderId || 1000
  nextTick(() => {
    applyingExternal = false
  })
})

const store = reactive({
  units,
  categories,
  products,
  sales,
  storageError,
  detailedProducts,
  salesList,
  salesSummary,
  checkLowStock,
  addProduct,
  updateProduct,
  removeProduct,
  addUnit,
  updateUnit,
  removeUnit,
  addCategory,
  updateCategory,
  removeCategory,
  checkout,
  recordSale,
  voidSale,
})

// One shared store for the whole app
export const useInventoryStore = () => store