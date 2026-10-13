import { reactive, computed, watch } from 'vue'
import { useAuthStore } from './auth'

// Business settings are saved per account, so each login has its own.
const KEY_PREFIX = 'vaulto-settings'

// Locale used to format each currency (decides the symbol and separators)
const LOCALES = { PHP: 'en-PH', USD: 'en-US', EUR: 'en-IE' }

const DEFAULTS = {
  currency: 'PHP',
  storeName: 'Vaulto Store',
  address: '',
  lowStockThreshold: 10,
}

const auth = useAuthStore()
const keyFor = (id) => `${KEY_PREFIX}:${id}`

const load = (id) => {
  if (!id) return {}
  try {
    return JSON.parse(localStorage.getItem(keyFor(id))) || {}
  } catch {
    return {}
  }
}

const business = reactive({ ...DEFAULTS })

// Load the logged-in account's settings now, and again whenever the account changes
const loadFor = (id) => Object.assign(business, DEFAULTS, load(id))
loadFor(auth.user?.id)
watch(() => auth.user?.id, (id) => loadFor(id))

const locale = computed(() => LOCALES[business.currency] || 'en-US')

// Formats a number as money in the chosen currency, e.g. ₱28.00, $28.00 or €28.00
// Note: this changes the symbol only. It does not convert amounts between currencies.
const format = (amount) =>
  new Intl.NumberFormat(locale.value, { style: 'currency', currency: business.currency }).format(Number(amount) || 0)

const update = (patch) => Object.assign(business, patch)

// Save to the logged-in account only
watch(
  business,
  () => {
    const id = auth.user?.id
    if (!id) return
    try {
      localStorage.setItem(keyFor(id), JSON.stringify(business))
    } catch {
      /* storage unavailable */
    }
  },
  { deep: true }
)

const store = reactive({ business, format, update })

// One shared store for the whole app
export const useSettingsStore = () => store