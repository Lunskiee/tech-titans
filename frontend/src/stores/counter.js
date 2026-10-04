import { reactive, computed, toRefs, watch } from 'vue'

const STORAGE_KEY = 'vaulto-inventory'

const defaults = () => ({
  units: [
    { id: 1, name: 'Pieces', abbreviation: 'pcs', description: 'Individual standalone items' },
    { id: 2, name: 'Box', abbreviation: 'box', description: 'Packaged boxed inventory items' },
    { id: 3, name: 'Kilograms', abbreviation: 'kg', description: 'Weight measurement for bulk inventory' },
    { id: 4, name: 'Liters', abbreviation: 'L', description: 'Liquid volume measurement' }
  ],
  categories: [
    { id: 1, name: 'Electronics', description: 'Gadgets, peripherals, and electronic hardware' },
    { id: 2, name: 'Accessories', description: 'Cables, adapters, and setup additions' },
    { id: 3, name: 'Office Supplies', description: 'Stationery and daily office essentials' }
  ],
  products: [
    { id: 1, sku: '#INV-9001', name: 'Wireless Keyboard', categoryId: 1, unitId: 1, stockQuantity: 30, unitPrice: 28.0, image: null },
    { id: 2, sku: '#INV-9002', name: 'Ergonomic Mouse', categoryId: 1, unitId: 1, stockQuantity: 20, unitPrice: 25.0, image: null },
    { id: 3, sku: '#INV-9003', name: 'USB-C Hub', categoryId: 2, unitId: 1, stockQuantity: 15, unitPrice: 45.0, image: null }
  ],
  sales: []
})

const load = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (saved?.units && saved?.categories && saved?.products) {
      // Merge with defaults so older saved data (without "sales") still works
      return { ...defaults(), ...saved }
    }
  } catch { /* ignore corrupt data */ }
  return defaults()
}

const nextId = (list) => Math.max(0, ...list.map(i => i.id)) + 1
const same = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase()
const ok = (data = {}) => ({ ok: true, ...data })
const fail = (error) => ({ ok: false, error })

// ---------- State (shared by every page) ----------
const state = reactive(load())

// Save to localStorage automatically whenever anything changes
watch(state, () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch { /* storage full or unavailable */ }
}, { deep: true })

// ---------- Getters ----------
const getUnit = (id) => state.units.find(u => u.id === id)
const getCategory = (id) => state.categories.find(c => c.id === id)

const categoriesWithCount = computed(() =>
  state.categories.map(cat => ({
    ...cat,
    itemCount: state.products.filter(p => p.categoryId === cat.id).length
  }))
)

const unitsWithCount = computed(() =>
  state.units.map(unit => ({
    ...unit,
    itemCount: state.products.filter(p => p.unitId === unit.id).length
  }))
)

const detailedProducts = computed(() =>
  state.products.map(product => {
    const cat = state.categories.find(c => c.id === product.categoryId)
    const unit = state.units.find(u => u.id === product.unitId)
    return {
      ...product,
      categoryName: cat ? cat.name : 'Uncategorized',
      unitAbbr: unit ? unit.abbreviation : '?'
    }
  })
)

const lowStockProducts = computed(() => state.products.filter(p => p.stockQuantity <= 5))

// Newest sales first
const salesList = computed(() =>
  [...state.sales].sort((a, b) => new Date(b.date) - new Date(a.date))
)

const salesSummary = computed(() => ({
  // Sales from one POS checkout share an orderId and count as one transaction
  transactions: new Set(state.sales.map(s => s.orderId ?? `sale-${s.id}`)).size,
  itemsSold: state.sales.reduce((sum, s) => sum + s.quantity, 0),
  revenue: state.sales.reduce((sum, s) => sum + s.total, 0)
}))

// ---------- Actions ----------
const resetData = () => Object.assign(state, defaults())

const nextSku = () => {
  const nums = state.products.map(p => parseInt(p.sku.replace(/\D/g, ''), 10) || 0)
  return `#INV-${Math.max(9000, ...nums) + 1}`
}

// Products
const addProduct = (product) => {
  state.products.push({
    image: null,
    ...product,
    id: nextId(state.products),
    sku: product.sku || nextSku(),
    stockQuantity: Number(product.stockQuantity) || 0,
    unitPrice: Number(product.unitPrice) || 0
  })
  return ok()
}

const updateProduct = (id, changes) => {
  const product = state.products.find(p => p.id === id)
  if (!product) return fail('Product not found.')
  Object.assign(product, changes)
  product.stockQuantity = Number(product.stockQuantity) || 0
  product.unitPrice = Number(product.unitPrice) || 0
  return ok()
}

const deleteProduct = (id) => {
  state.products = state.products.filter(p => p.id !== id)
  return ok()
}

// Categories
const addCategory = ({ name, description }) => {
  name = name.trim()
  if (!name) return fail('Category name is required.')
  if (state.categories.some(c => same(c.name, name))) return fail(`"${name}" already exists.`)
  state.categories.push({ id: nextId(state.categories), name, description: description?.trim() || 'No description provided.' })
  return ok()
}

const updateCategory = (id, { name, description }) => {
  const cat = state.categories.find(c => c.id === id)
  if (!cat) return fail('Category not found.')
  name = name.trim()
  if (!name) return fail('Category name is required.')
  if (state.categories.some(c => c.id !== id && same(c.name, name))) return fail(`"${name}" already exists.`)
  cat.name = name
  cat.description = description?.trim() || 'No description provided.'
  return ok()
}

const deleteCategory = (id) => {
  const count = state.products.filter(p => p.categoryId === id).length
  if (count > 0) return fail(`This category is used by ${count} product${count === 1 ? '' : 's'}.`)
  state.categories = state.categories.filter(c => c.id !== id)
  return ok()
}

// Units
const addUnit = ({ name, abbreviation, description }) => {
  name = name.trim()
  abbreviation = abbreviation.trim()
  if (!name || !abbreviation) return fail('Name and abbreviation are required.')
  if (state.units.some(u => same(u.name, name))) return fail(`Unit "${name}" already exists.`)
  if (state.units.some(u => same(u.abbreviation, abbreviation))) return fail(`Abbreviation "${abbreviation}" is already taken.`)
  state.units.push({ id: nextId(state.units), name, abbreviation, description: description?.trim() || 'No description provided.' })
  return ok()
}

const updateUnit = (id, { name, abbreviation, description }) => {
  const unit = state.units.find(u => u.id === id)
  if (!unit) return fail('Unit not found.')
  name = name.trim()
  abbreviation = abbreviation.trim()
  if (!name || !abbreviation) return fail('Name and abbreviation are required.')
  if (state.units.some(u => u.id !== id && same(u.name, name))) return fail(`Unit "${name}" already exists.`)
  if (state.units.some(u => u.id !== id && same(u.abbreviation, abbreviation))) return fail(`Abbreviation "${abbreviation}" is already taken.`)
  unit.name = name
  unit.abbreviation = abbreviation
  unit.description = description?.trim() || 'No description provided.'
  return ok()
}

const deleteUnit = (id) => {
  const count = state.products.filter(p => p.unitId === id).length
  if (count > 0) return fail(`This unit is used by ${count} product${count === 1 ? '' : 's'}.`)
  state.units = state.units.filter(u => u.id !== id)
  return ok()
}

// Sales
const nextOrderId = () => Math.max(0, ...state.sales.map(s => s.orderId || 0)) + 1

const recordSale = ({ productId, quantity, orderId = null }) => {
  const product = state.products.find(p => p.id === productId)
  const qty = Number(quantity)
  if (!product) return fail('Please select a product.')
  if (!qty || qty <= 0) return fail('Quantity must be greater than 0.')
  if (qty > product.stockQuantity) return fail(`Only ${product.stockQuantity} in stock.`)

  const unit = state.units.find(u => u.id === product.unitId)
  product.stockQuantity -= qty

  // Snapshot name/price so history never changes if the product is edited later
  state.sales.push({
    id: nextId(state.sales),
    orderId,
    date: new Date().toISOString(),
    productId: product.id,
    sku: product.sku,
    name: product.name,
    unitAbbr: unit ? unit.abbreviation : '?',
    quantity: qty,
    unitPrice: product.unitPrice,
    total: Math.round(qty * product.unitPrice * 100) / 100
  })
  return ok()
}

// Removes a sale and puts the stock back (if the product still exists)
const voidSale = (id) => {
  const sale = state.sales.find(s => s.id === id)
  if (!sale) return fail('Sale not found.')
  const product = state.products.find(p => p.id === sale.productId)
  if (product) product.stockQuantity += sale.quantity
  state.sales = state.sales.filter(s => s.id !== id)
  return ok()
}

// Checks out a whole cart: items = [{ productId, quantity }]
// Everything is validated first, so a sale is never half-completed.
const checkout = (items) => {
  if (!items?.length) return fail('The cart is empty.')

  // Merge duplicate lines for the same product
  const wanted = new Map()
  for (const { productId, quantity } of items) {
    wanted.set(productId, (wanted.get(productId) || 0) + Number(quantity))
  }

  for (const [productId, qty] of wanted) {
    const product = state.products.find(p => p.id === productId)
    if (!product) return fail('A product in the cart no longer exists.')
    if (!qty || qty <= 0) return fail(`Invalid quantity for ${product.name}.`)
    if (qty > product.stockQuantity) return fail(`Only ${product.stockQuantity} of ${product.name} in stock.`)
  }

  const orderId = nextOrderId()
  let total = 0
  for (const [productId, quantity] of wanted) {
    recordSale({ productId, quantity, orderId })
    total += state.sales[state.sales.length - 1].total
  }
  return ok({ orderId, total: Math.round(total * 100) / 100 })
}

// ---------- One shared store object ----------
const store = reactive({
  ...toRefs(state), // units, categories, products, sales
  getUnit, getCategory,
  categoriesWithCount, unitsWithCount, detailedProducts, lowStockProducts,
  salesList, salesSummary,
  resetData, nextSku,
  addProduct, updateProduct, deleteProduct,
  addCategory, updateCategory, deleteCategory,
  addUnit, updateUnit, deleteUnit,
  recordSale, voidSale, checkout
})

// Same name and usage as before, so your components don't change
export const useInventoryStore = () => store