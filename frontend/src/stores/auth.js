import { ref, reactive, computed } from 'vue'

// Demo-level auth: accounts live in this browser's localStorage.
// Replace register/login/updateProfile/changePassword with API calls when you add a backend.
const ACCOUNTS_KEY = 'vaulto-accounts'
const SESSION_KEY = 'vaulto-session'
const RESET_KEY = 'vaulto-resets'
const RESET_MINUTES = 10
const MAX_RESET_ATTEMPTS = 5

const SAVE_FAILED =
  'Could not save to this browser. Its storage may be full, so remove large product images and try again.'
const NO_CRYPTO = {
  ok: false,
  error: 'Secure features are unavailable here. Open the app at http://localhost or over https.',
}

// ---------- Roles (decided by the email domain) ----------
const ADMIN_DOMAIN = '@admin.com'
const STAFF_DOMAIN = '@staff.com'
const roleFromEmail = (email) => (String(email || '').endsWith(ADMIN_DOMAIN) ? 'admin' : 'staff')
const allowedDomain = (email) => email.endsWith(ADMIN_DOMAIN) || email.endsWith(STAFF_DOMAIN)

const read = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key))
    return value ?? fallback
  } catch {
    return fallback
  }
}

const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

// Hashing needs the browser's crypto API, which only exists on localhost or https
const hashAvailable = () => !!globalThis.crypto?.subtle

// Login checks a hash of the password
const hash = async (text) => {
  const bytes = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('')
}

const normalizeEmail = (email) => String(email || '').trim().toLowerCase()
const validEmail = (email) => /^\S+@\S+\.\S+$/.test(email)

const accounts = ref(read(ACCOUNTS_KEY, []))
const sessionId = ref(read(SESSION_KEY, null))

// Reload from storage so this tab never works with out-of-date accounts
const refresh = () => {
  accounts.value = read(ACCOUNTS_KEY, [])
  sessionId.value = read(SESSION_KEY, null)
}

// Keep this tab in sync when another tab or window registers, changes a password or logs out
window.addEventListener('storage', (event) => {
  if (event.key === null || event.key === ACCOUNTS_KEY || event.key === SESSION_KEY) refresh()
})

const saveAccounts = () => write(ACCOUNTS_KEY, accounts.value)

const currentAccount = computed(() => accounts.value.find(a => a.id === sessionId.value) || null)

// Profile of the logged-in user (password hash and saved password are never included)
const user = computed(() => {
  const account = currentAccount.value
  if (!account) return null
  const { passwordHash, savedPassword, ...profile } = account
  return { ...profile, role: roleFromEmail(profile.email) }
})

// The logged-in user's own saved password, shown only in Settings > Security
const savedPassword = computed(() => currentAccount.value?.savedPassword || '')

const isLoggedIn = computed(() => !!currentAccount.value)
const isAdmin = computed(() => user.value?.role === 'admin')
const initial = computed(() => (user.value?.fullName || '').trim().charAt(0).toUpperCase() || '?')

// Every registered account (used by Admin > User Management). No passwords of any kind.
const allUsers = computed(() =>
  accounts.value.map(({ passwordHash, savedPassword, ...profile }) => ({
    ...profile,
    role: roleFromEmail(profile.email),
  }))
)

// Saves a new password right away. If the browser cannot save it, the change is undone,
// so the screen never says "updated" while the old password is still the saved one.
const savePassword = (accountId, newHash, newPassword) => {
  refresh()
  const account = accounts.value.find(a => a.id === accountId)
  if (!account) return { ok: false, error: 'Account not found.' }

  const previousHash = account.passwordHash
  const previousSaved = account.savedPassword
  account.passwordHash = newHash
  account.savedPassword = newPassword
  if (!saveAccounts()) {
    account.passwordHash = previousHash
    account.savedPassword = previousSaved
    return { ok: false, error: SAVE_FAILED }
  }
  return { ok: true }
}

// ---------- Actions ----------
const register = async ({ fullName, email, phone = '', password }) => {
  if (!hashAvailable()) return NO_CRYPTO

  const name = String(fullName || '').trim()
  const mail = normalizeEmail(email)
  if (!name || !mail || !password) return { ok: false, error: 'Name, email and password are required.' }
  if (!validEmail(mail)) return { ok: false, error: 'Enter a valid email address.' }
  if (!allowedDomain(mail)) {
    return { ok: false, error: `Use an email ending in ${STAFF_DOMAIN} or ${ADMIN_DOMAIN}.` }
  }
  if (password.length < 8) return { ok: false, error: 'Password must be at least 8 characters.' }

  const id = Date.now()
  const passwordHash = await hash(`${id}:${password}`)

  refresh() // another tab may have registered while we were hashing
  if (accounts.value.some(a => a.email === mail)) return { ok: false, error: 'An account with this email already exists.' }

  accounts.value.push({
    id,
    fullName: name,
    email: mail,
    phone: String(phone).trim(),
    avatarUrl: '',
    passwordHash,
    savedPassword: password,
    createdAt: new Date().toISOString(),
  })

  if (!saveAccounts()) {
    accounts.value.pop() // do not keep an account that was not saved
    return { ok: false, error: SAVE_FAILED }
  }
  return { ok: true }
}

const login = async (email, password) => {
  if (!hashAvailable()) return NO_CRYPTO

  refresh()
  const account = accounts.value.find(a => a.email === normalizeEmail(email))
  if (!account || account.passwordHash !== (await hash(`${account.id}:${password}`))) {
    return { ok: false, error: 'Incorrect email or password.' }
  }

  // Accounts made before "saved password" existed get theirs filled in here, on their next login
  if (account.savedPassword !== password) {
    account.savedPassword = password
    saveAccounts()
  }

  sessionId.value = account.id
  write(SESSION_KEY, account.id)
  return { ok: true }
}

const logout = () => {
  sessionId.value = null
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    /* ignore */
  }
}

const updateProfile = ({ fullName, email, phone, avatarUrl }) => {
  refresh()
  const account = currentAccount.value
  if (!account) return { ok: false, error: 'You are not logged in.' }

  const name = String(fullName || '').trim()
  const mail = normalizeEmail(email)
  if (!name || !mail) return { ok: false, error: 'Name and email are required.' }
  if (!validEmail(mail)) return { ok: false, error: 'Enter a valid email address.' }
  if (accounts.value.some(a => a.email === mail && a.id !== account.id)) {
    return { ok: false, error: 'Another account already uses this email.' }
  }
  // The email decides the role, so it cannot be changed into a different account type
  if (roleFromEmail(mail) !== roleFromEmail(account.email)) {
    return { ok: false, error: `You cannot change your email to a different account type (${STAFF_DOMAIN} / ${ADMIN_DOMAIN}).` }
  }

  const before = { fullName: account.fullName, email: account.email, phone: account.phone, avatarUrl: account.avatarUrl }
  account.fullName = name
  account.email = mail
  account.phone = String(phone || '').trim()
  account.avatarUrl = avatarUrl || ''

  if (!saveAccounts()) {
    Object.assign(account, before)
    return { ok: false, error: 'Could not save. The picture may be too large, so try a smaller one.' }
  }
  return { ok: true }
}

// Asks for the current password too (kept for other pages that may use it)
const changePassword = async (currentPassword, newPassword) => {
  if (!hashAvailable()) return NO_CRYPTO

  refresh()
  const account = currentAccount.value
  if (!account) return { ok: false, error: 'You are not logged in.' }
  if ((await hash(`${account.id}:${currentPassword}`)) !== account.passwordHash) {
    return { ok: false, error: 'Current password is incorrect.' }
  }
  if (newPassword.length < 8) return { ok: false, error: 'New password must be at least 8 characters.' }
  if (newPassword === currentPassword) return { ok: false, error: 'New password must be different from the current one.' }

  return savePassword(account.id, await hash(`${account.id}:${newPassword}`), newPassword)
}

// Sets a new password for the logged-in account without retyping the old one (used by Settings > Security)
const setPassword = async (newPassword) => {
  if (!hashAvailable()) return NO_CRYPTO

  refresh()
  const account = currentAccount.value
  if (!account) return { ok: false, error: 'You are not logged in.' }
  if (String(newPassword).length < 8) return { ok: false, error: 'New password must be at least 8 characters.' }

  const newHash = await hash(`${account.id}:${newPassword}`)
  if (newHash === account.passwordHash) {
    return { ok: false, error: 'New password must be different from the current one.' }
  }
  return savePassword(account.id, newHash, newPassword)
}

// ---------- Forgot / reset password ----------
// Demo version: there is no email server, so the code is handed back to the page to display.
// With a real backend, email the code and never return it from this function.
const requestPasswordReset = async (email) => {
  if (!hashAvailable()) return NO_CRYPTO

  refresh()
  const mail = normalizeEmail(email)
  if (!validEmail(mail)) return { ok: false, error: 'Enter a valid email address.' }
  if (!accounts.value.some(a => a.email === mail)) return { ok: false, error: 'No account found with that email.' }

  const code = String((crypto.getRandomValues(new Uint32Array(1))[0] % 900000) + 100000)
  const resets = read(RESET_KEY, {})
  resets[mail] = {
    codeHash: await hash(`${mail}:${code}`),
    expiresAt: Date.now() + RESET_MINUTES * 60 * 1000,
    attempts: 0,
  }
  if (!write(RESET_KEY, resets)) return { ok: false, error: SAVE_FAILED }
  return { ok: true, code, minutes: RESET_MINUTES }
}

const resetPassword = async (email, code, newPassword) => {
  if (!hashAvailable()) return NO_CRYPTO

  refresh()
  const mail = normalizeEmail(email)
  const resets = read(RESET_KEY, {})
  const entry = resets[mail]
  const account = accounts.value.find(a => a.email === mail)

  if (!entry || !account) return { ok: false, error: 'Request a new reset code first.' }
  if (Date.now() > entry.expiresAt) {
    delete resets[mail]
    write(RESET_KEY, resets)
    return { ok: false, error: 'That code has expired. Request a new one.' }
  }
  if (entry.attempts >= MAX_RESET_ATTEMPTS) {
    delete resets[mail]
    write(RESET_KEY, resets)
    return { ok: false, error: 'Too many wrong attempts. Request a new code.' }
  }
  if (entry.codeHash !== (await hash(`${mail}:${String(code).trim()}`))) {
    entry.attempts += 1
    write(RESET_KEY, resets)
    return { ok: false, error: 'Incorrect code.' }
  }
  if (String(newPassword).length < 8) return { ok: false, error: 'New password must be at least 8 characters.' }

  // Save the new password first. Only use up the reset code once it is really saved.
  const saved = savePassword(account.id, await hash(`${account.id}:${newPassword}`), newPassword)
  if (!saved.ok) return saved

  delete resets[mail]
  write(RESET_KEY, resets)
  return { ok: true }
}

const store = reactive({
  user,
  isLoggedIn,
  isAdmin,
  initial,
  savedPassword,
  allUsers,
  register,
  login,
  logout,
  updateProfile,
  changePassword,
  setPassword,
  requestPasswordReset,
  resetPassword,
})

// One shared store for the whole app
export const useAuthStore = () => store