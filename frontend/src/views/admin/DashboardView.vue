<script setup>
import { computed } from 'vue'
import { useInventoryStore, LOW_STOCK_LEVEL } from '../../stores/inventory'
import { useSettingsStore } from '../../stores/settings'

const store = useInventoryStore()
const settings = useSettingsStore()

// Uses the currency chosen in Settings > Business
const money = (n) => settings.format(n ?? 0)

const products = computed(() => store.detailedProducts || [])
const categories = computed(() => store.categories || [])
const sales = computed(() => store.salesList || [])

/* ---------- Stock counts ---------- */
const outOfStock = computed(
  () => products.value.filter((p) => (p.stockQuantity ?? 0) <= 0).length
)
const lowStock = computed(
  () =>
    products.value.filter((p) => {
      const s = p.stockQuantity ?? 0
      return s > 0 && s <= LOW_STOCK_LEVEL
    }).length
)
const inStock = computed(() => products.value.length - outOfStock.value - lowStock.value)

/* ---------- Stat cards ---------- */
const stats = computed(() => [
  {
    label: 'Total sales',
    value: money(store.salesSummary?.revenue),
    hint: 'All time',
  },
  {
    label: 'Orders',
    value: String(store.salesSummary?.transactions ?? 0),
    hint: `${store.salesSummary?.itemsSold ?? 0} items sold`,
  },
  {
    label: 'Products',
    value: String(products.value.length),
    hint: `${categories.value.length} ${categories.value.length === 1 ? 'category' : 'categories'}`,
  },
  {
    label: 'Low stock items',
    value: String(lowStock.value + outOfStock.value),
    hint: `${outOfStock.value} out of stock`,
  },
])

/* ---------- Sales for the last 7 days ---------- */
const salesData = computed(() => {
  const today = new Date()
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i)
    days.push({
      key: d.toDateString(),
      day: d.toLocaleDateString(undefined, { weekday: 'short' }),
      value: 0,
    })
  }
  for (const s of sales.value) {
    if (!s.date) continue
    const entry = days.find((d) => d.key === new Date(s.date).toDateString())
    if (entry) entry.value += Number(s.total) || 0
  }
  return days.map((d) => ({ ...d, value: Math.round(d.value * 100) / 100 }))
})

const weekTotal = computed(() => salesData.value.reduce((n, d) => n + d.value, 0))

/* ---------- Line chart math ---------- */
const W = 600
const H = 220
const PAD = 32

const maxSales = computed(() => Math.max(...salesData.value.map((d) => d.value), 0) || 1)

const points = computed(() =>
  salesData.value.map((d, i) => ({
    x: PAD + (i * (W - PAD * 2)) / (salesData.value.length - 1),
    y: H - PAD - (d.value / maxSales.value) * (H - PAD * 2),
    ...d,
  }))
)

const linePoints = computed(() => points.value.map((p) => `${p.x},${p.y}`).join(' '))

const areaPath = computed(() => {
  const first = points.value[0]
  const last = points.value[points.value.length - 1]
  const line = points.value.map((p) => `L ${p.x} ${p.y}`).join(' ')
  return `M ${first.x} ${H - PAD} ${line} L ${last.x} ${H - PAD} Z`
})

/* ---------- Products per category (from the Categories page) ---------- */
const categoryBars = computed(() =>
  categories.value
    .map((c) => ({
      name: c.name,
      value: products.value.filter((p) => p.categoryName === c.name).length,
    }))
    .sort((a, b) => b.value - a.value)
)
const maxCategory = computed(() => Math.max(...categoryBars.value.map((c) => c.value), 0))

/* ---------- Stock donut ---------- */
const R = 40
const C = 2 * Math.PI * R

const stockStatus = computed(() => [
  { label: 'In stock', value: inStock.value, color: '#5d5b8d' },
  { label: 'Low stock', value: lowStock.value, color: '#f59e0b' },
  { label: 'Out of stock', value: outOfStock.value, color: '#ef4444' },
])

const donutSegments = computed(() => {
  const total = products.value.length
  let acc = 0
  return stockStatus.value.map((s) => {
    const dash = total ? (s.value / total) * C : 0
    const seg = { ...s, dash, offset: -acc }
    acc += dash
    return seg
  })
})

/* ---------- Top selling products (from real sales + All Products) ---------- */
const topProducts = computed(() => {
  const map = new Map()
  for (const s of sales.value) {
    const key = s.sku || s.name
    const row = map.get(key) || {
      key,
      sku: s.sku,
      name: s.name,
      unitAbbr: s.unitAbbr,
      sold: 0,
      revenue: 0,
    }
    row.sold += Number(s.quantity) || 0
    row.revenue += Number(s.total) || 0
    map.set(key, row)
  }

  return [...map.values()]
    .sort((a, b) => b.sold - a.sold || b.revenue - a.revenue)
    .slice(0, 5)
    .map((r) => {
      // Match back to the product in All Products to show its image, category and stock
      const p = r.sku ? products.value.find((x) => x.sku === r.sku) : undefined
      return {
        ...r,
        name: p?.name || r.name || 'Unknown item',
        category: p?.categoryName || '—',
        image: p?.image || null,
        stock: p ? p.stockQuantity : null,
        unit: p?.unitAbbr || r.unitAbbr || '',
      }
    })
})

/* ---------- Recent sales ---------- */
const recentSales = computed(() => {
  const orders = new Map()
  for (const s of sales.value) {
    const o = orders.get(s.orderId) || { orderId: s.orderId, date: s.date, total: 0, items: 0 }
    o.total += Number(s.total) || 0
    o.items += 1
    orders.set(s.orderId, o)
  }
  return [...orders.values()]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)
})

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : ''
</script>

<template>
  <div class="page">
    <h1>Admin Dashboard</h1>

    <!-- Stat cards -->
    <div class="cards">
      <div v-for="s in stats" :key="s.label" class="card">
        <p class="label">{{ s.label }}</p>
        <p class="value">{{ s.value }}</p>
        <p class="hint">{{ s.hint }}</p>
      </div>
    </div>

    <!-- Row: sales line chart + stock donut -->
    <div class="row two-one">
      <div class="panel">
        <h2>Sales (last 7 days)</h2>
        <svg :viewBox="`0 0 ${W} ${H}`" class="line-chart">
          <line
            v-for="n in 4" :key="n"
            :x1="PAD" :x2="W - PAD"
            :y1="PAD + ((n - 1) * (H - PAD * 2)) / 3"
            :y2="PAD + ((n - 1) * (H - PAD * 2)) / 3"
            stroke="#e5e7eb" stroke-width="1"
          />
          <path :d="areaPath" fill="#5d5b8d" opacity="0.12" />
          <polyline :points="linePoints" fill="none" stroke="#5d5b8d" stroke-width="3" stroke-linejoin="round" />
          <g v-for="p in points" :key="p.key">
            <circle :cx="p.x" :cy="p.y" r="4" fill="#fff" stroke="#5d5b8d" stroke-width="2">
              <title>{{ p.day }}: {{ money(p.value) }}</title>
            </circle>
            <text :x="p.x" :y="H - 8" text-anchor="middle" font-size="12" fill="#6b7280">{{ p.day }}</text>
          </g>
          <text
            v-if="weekTotal === 0"
            :x="W / 2" :y="H / 2 - 16"
            text-anchor="middle" font-size="14" fill="#9ca3af"
          >No sales in the last 7 days</text>
        </svg>
      </div>

      <div class="panel">
        <h2>Stock status</h2>
        <div class="donut-wrap">
          <svg viewBox="0 0 100 100" class="donut">
            <circle cx="50" cy="50" :r="R" fill="none" stroke="#f3f4f6" stroke-width="14" />
            <circle
              v-for="s in donutSegments" :key="s.label"
              cx="50" cy="50" :r="R" fill="none"
              :stroke="s.color" stroke-width="14"
              :stroke-dasharray="`${s.dash} ${C - s.dash}`"
              :stroke-dashoffset="s.offset"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <ul class="legend">
            <li v-for="s in stockStatus" :key="s.label">
              <span class="dot" :style="{ background: s.color }"></span>
              {{ s.label }} <strong>{{ s.value }}</strong>
            </li>
          </ul>
        </div>
        <p v-if="products.length === 0" class="empty">No products yet.</p>
      </div>
    </div>

    <!-- Row: category bars + top products -->
    <div class="row one-two">
      <div class="panel">
        <h2>Products by category</h2>
        <p v-if="categoryBars.length === 0" class="empty">No categories yet. Add one on the Categories page.</p>
        <div v-for="c in categoryBars" :key="c.name" class="bar-row">
          <span class="bar-name" :title="c.name">{{ c.name }}</span>
          <div class="bar-track">
            <div
              class="bar-fill"
              :style="{ width: maxCategory ? (c.value / maxCategory) * 100 + '%' : '0%' }"
            ></div>
          </div>
          <span class="bar-value">{{ c.value }}</span>
        </div>
      </div>

      <div class="panel">
        <h2>Top selling products</h2>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Units sold</th>
              <th>Revenue</th>
              <th>In stock</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in topProducts" :key="p.key">
              <td>
                <div class="product-cell">
                  <img v-if="p.image" :src="p.image" alt="" class="thumb" />
                  <span v-else class="thumb initial">{{ (p.name || '?').charAt(0).toUpperCase() }}</span>
                  <span>{{ p.name }}</span>
                </div>
              </td>
              <td>{{ p.category }}</td>
              <td>{{ p.sold }} {{ p.unit }}</td>
              <td>{{ money(p.revenue) }}</td>
              <td>{{ p.stock === null ? 'Removed' : `${p.stock} ${p.unit}` }}</td>
            </tr>
            <tr v-if="topProducts.length === 0">
              <td colspan="5" class="empty">
                No sales yet. Complete a sale in
                <router-link to="/pos" class="link">POS / Sales</router-link>
                and your best sellers will show up here.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Recent sales -->
    <div class="panel">
      <h2>Recent sales</h2>
      <ul class="activity">
        <li v-for="o in recentSales" :key="o.orderId">
          <span>Order #{{ o.orderId }} · {{ o.items }} {{ o.items === 1 ? 'item' : 'items' }}</span>
          <span class="right">
            <strong>{{ money(o.total) }}</strong>
            <span class="time">{{ formatDate(o.date) }}</span>
          </span>
        </li>
        <li v-if="recentSales.length === 0" class="empty-row">No sales yet.</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 20px; }
h1 { color: #1e1b4b; margin: 0; }
h2 { color: #1e1b4b; font-size: 1rem; margin: 0 0 16px; }

.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
.card, .panel { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; min-width: 0; }
.label { color: #6b7280; font-size: 14px; margin: 0; }
.value { color: #1e1b4b; font-size: 28px; font-weight: 700; margin: 8px 0 4px; }
.hint { color: #9ca3af; font-size: 13px; margin: 0; }

.row { display: grid; gap: 16px; }
.row.two-one { grid-template-columns: 2fr 1fr; }
.row.one-two { grid-template-columns: 1fr 2fr; }
@media (max-width: 1000px) {
  .row.two-one, .row.one-two { grid-template-columns: 1fr; }
}

.line-chart { width: 100%; height: auto; }

.donut-wrap { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
.donut { width: 140px; height: 140px; }
.legend { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; font-size: 14px; color: #374151; }
.dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 6px; }

.bar-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; font-size: 14px; }
.bar-name { width: 110px; color: #374151; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bar-track { flex: 1; height: 10px; background: #f3f4f6; border-radius: 999px; overflow: hidden; }
.bar-fill { height: 100%; background: #5d5b8d; border-radius: 999px; transition: width 0.3s; }
.bar-value { width: 32px; text-align: right; color: #6b7280; }

table { width: 100%; border-collapse: collapse; }
th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #374151; }
th { color: #6b7280; font-weight: 600; }
.product-cell { display: flex; align-items: center; gap: 10px; }
.thumb { width: 32px; height: 32px; border-radius: 6px; object-fit: cover; border: 1px solid #e5e7eb; flex-shrink: 0; }
.thumb.initial { display: flex; align-items: center; justify-content: center; background: #e0e7ff; color: #5d5b8d; font-weight: 700; border: none; }

.empty { color: #6b7280; font-style: italic; font-size: 14px; text-align: center; padding: 16px 0; margin: 0; }
td.empty { padding: 24px 8px; }
.link { color: #4338ca; font-weight: 600; font-style: normal; }

.activity { list-style: none; padding: 0; margin: 0; }
.activity li { display: flex; justify-content: space-between; gap: 12px; padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; color: #374151; }
.activity li:last-child { border-bottom: none; }
.activity .right { display: flex; gap: 16px; align-items: center; }
.activity .empty-row { justify-content: center; color: #6b7280; font-style: italic; }
.time { color: #9ca3af; }
</style>