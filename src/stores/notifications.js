import { ref, reactive, computed, watch } from 'vue'

const STORAGE_KEY = 'vaulto-notifications'

// Maps a notification type to the Settings toggle that controls it
const PREFERENCE_FOR_TYPE = {
  low_stock: 'lowStock',
  sale: 'newSale',
  summary: 'dailySummary',
  memo: 'memoReminders',
}

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null
  } catch {
    return null
  }
}

const saved = load()

// Same toggles as Settings > Notifications
const preferences = reactive(
  saved?.preferences || {
    lowStock: true,
    newSale: true,
    dailySummary: false,
    memoReminders: true,
  }
)

const items = ref(
  saved?.items || [
    // Sample entries so the bell isn't empty on first run. Delete these when you wire up real events.
    { id: 1, type: 'low_stock', title: 'Low stock', message: 'Box has only 4 items left.', to: '/products', read: false, createdAt: Date.now() - 1000 * 60 * 15 },
    { id: 2, type: 'memo', title: 'New memo', message: 'Restock fast-moving items (High priority).', to: '/memos', read: false, createdAt: Date.now() - 1000 * 60 * 60 * 3 },
  ]
)

const unreadCount = computed(() => items.value.filter(n => !n.read).length)

// Add a notification, but only if the user has that type turned on in Settings
const notify = ({ type, title, message, to = null }) => {
  const prefKey = PREFERENCE_FOR_TYPE[type]
  if (prefKey && !preferences[prefKey]) return
  items.value.unshift({ id: Date.now() + Math.random(), type, title, message, to, read: false, createdAt: Date.now() })
  if (items.value.length > 50) items.value.length = 50
}

const markRead = (id) => {
  const n = items.value.find(i => i.id === id)
  if (n) n.read = true
}
const markAllRead = () => items.value.forEach(n => (n.read = true))
const remove = (id) => { items.value = items.value.filter(n => n.id !== id) }
const clearAll = () => { items.value = [] }

// Helpers your pages can call
const notifySale = (total, itemCount) =>
  notify({ type: 'sale', title: 'New sale', message: `${itemCount} item(s) sold, total $${Number(total).toFixed(2)}.`, to: '/sold' })

const checkLowStock = (products, threshold = 10) => {
  products
    .filter(p => Number(p.stock) <= threshold)
    .forEach(p => {
      const alreadyAlerted = items.value.some(n => n.type === 'low_stock' && !n.read && n.message.includes(p.name))
      if (!alreadyAlerted) {
        notify({ type: 'low_stock', title: 'Low stock', message: `${p.name} has only ${p.stock} left.`, to: '/products' })
      }
    })
}

// Keep notifications after a page refresh
watch(
  [items, preferences],
  () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ items: items.value, preferences }))
    } catch {
      /* storage full or unavailable */
    }
  },
  { deep: true }
)

// reactive() unwraps the refs, so templates can use store.items and store.unreadCount directly
const store = reactive({
  preferences,
  items,
  unreadCount,
  notify,
  notifySale,
  checkLowStock,
  markRead,
  markAllRead,
  remove,
  clearAll,
})

// One shared store for the whole app (no Pinia needed)
export const useNotificationStore = () => store