import { ref, reactive } from 'vue'

// Activity log: who did what. Shared by the whole business and shown to admins in Admin > Activity Logs.
// Saved in this browser's localStorage. Swap for an API call when you add a backend.
const STORAGE_KEY = 'vaulto-activity'
const MAX_ENTRIES = 500

const load = () => {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

const entries = ref(load())

// Keep this tab in sync when another tab or window logs something
window.addEventListener('storage', (event) => {
  if (event.key === null || event.key === STORAGE_KEY) entries.value = load()
})

// actor: the account doing it ({ id, fullName, email }). amount is optional (used for sales).
const log = ({ type, message, actor = null, amount = null }) => {
  const current = load() // reload first so another tab's entries are not overwritten
  current.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    message,
    amount: amount === null ? null : Number(amount),
    actorId: actor?.id ?? null,
    actorName: actor?.fullName || 'Unknown',
    actorEmail: actor?.email || '',
    createdAt: Date.now(),
  })
  if (current.length > MAX_ENTRIES) current.length = MAX_ENTRIES
  entries.value = current
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
  } catch {
    /* storage full or unavailable */
  }
}

const store = reactive({ entries, log })

// One shared store for the whole app
export const useActivityStore = () => store