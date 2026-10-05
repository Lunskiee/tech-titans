import { reactive, computed, watch } from 'vue'

// Currency chosen in Settings > Business, shared by Products, POS and Sold Inventory.
const STORAGE_KEY = 'vaulto-settings'

// Locale used to format each currency (decides the symbol and separators)
const LOCALES = { PHP: 'en-PH', USD: 'en-US', EUR: 'en-IE' }

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
  } catch {
    return {}
  }
}

const business = reactive({ currency: 'PHP', ...load() })

const locale = computed(() => LOCALES[business.currency] || 'en-US')

// Formats a number as money in the chosen currency, e.g. ₱28.00, $28.00 or €28.00
// Note: this changes the symbol only. It does not convert amounts between currencies.
const format = (amount) =>
  new Intl.NumberFormat(locale.value, { style: 'currency', currency: business.currency }).format(Number(amount) || 0)

const update = (patch) => Object.assign(business, patch)

watch(
  business,
  () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(business))
    } catch {
      /* storage unavailable */
    }
  },
  { deep: true }
)

const store = reactive({ business, format, update })

// One shared store for the whole app
export const useSettingsStore = () => store