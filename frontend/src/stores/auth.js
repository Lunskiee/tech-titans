import { ref, reactive, computed } from 'vue'
import { useActivityStore } from './activity'

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

const activity = useActivityStore()

// ---------- Roles (decided by the email domain) ----------
const ADMIN_DOMAIN = '@admin.com'
const STAFF_DOMAIN = '@staff.com'
const roleFromEmail = (email) => {
  const mail = String(email || '').trim().toLowerCase()
  if (mail.endsWith(ADMIN_DOMAIN) || mail.startsWith('admin@') || mail.includes('admin') || mail === 'admin@vaulto.com') {
    return 'admin'
  }
  return 'staff'
}
const allowedDomain = (email) => {
  const mail = String(email || '').trim().toLowerCase()
  return mail.endsWith(ADMIN_DOMAIN) || mail.endsWith(STAFF_DOMAIN) || mail.endsWith('@vaulto.com')
}

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

// ---------- Who is logged in (remembered per TAB) ----------
// Each browser tab keeps its own login, so one tab can be admin and another staff
// without switching each other. Closing the tab logs that tab out.
const readSession = () => {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY))
  } catch {
    return null
  }
}
const writeSession = (id) => {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(id))
  } catch {
    /* ignore */
  }
}
const clearSession = () => {
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch {
    /* ignore */
  }
}

// Older versions kept the login in localStorage, shared by every tab. Remove that leftover.
try {
  localStorage.removeItem(SESSION_KEY)
} catch {
  /* ignore */
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

const DEFAULT_ACCOUNTS = [
  {
    id: 1001,
    fullName: 'Admin User',
    email: 'admin@vaulto.com',
    phone: '09123456789',
    avatarUrl: '',
    passwordHash: 'a24c95b0267b48042a9c4a38bf7ec0226abeb4be8a28755365b3a0db8dfe7262', // 1001:password123
    savedPassword: 'password123',
    createdAt: new Date().toISOString(),
  },
  {
    id: 1002,
    fullName: 'Admin',
    email: 'admin@admin.com',
    phone: '09111222333',
    avatarUrl: '',
    passwordHash: 'f45ec04f37b0eef8778e7a94315d126800f2243ae9094bd8ef5d8f69ee3d829e', // 1002:password123
    savedPassword: 'password123',
    createdAt: new Date().toISOString(),
  },
  {
    id: 1003,
    fullName: 'Staff User',
    email: 'staff@staff.com',
    phone: '09444555666',
    avatarUrl: '',
    passwordHash: '8ae533bb982a64a9950f1d83e6854c9b1505ddf8177bb9a08a368327231f69eb', // 1003:password123
    savedPassword: 'password123',
    createdAt: new Date().toISOString(),
  },
]

const loadAccounts = () => {
  const stored = read(ACCOUNTS_KEY, null)
  if (!stored || !Array.isArray(stored) || stored.length === 0) {
    write(ACCOUNTS_KEY, DEFAULT_ACCOUNTS)
    return [...DEFAULT_ACCOUNTS]
  }
  const hasVaultoAdmin = stored.some(a => a.email === 'admin@vaulto.com')
  if (!hasVaultoAdmin) {
    stored.push(DEFAULT_ACCOUNTS[0])
    write(ACCOUNTS_KEY, stored)
  }
  return stored
}

const accounts = ref(loadAccounts())
const sessionId = ref(readSession())

// Reload accounts from storage so this tab never works with out-of-date data.
// (The logged-in account is NOT reloaded: it belongs to this tab only.)
const refresh = () => {
  accounts.value = loadAccounts()
}

// Keep this tab in sync when another tab or window registers or changes a password
window.addEventListener('storage', (event) => {
  if (event.key === null || event.key === ACCOUNTS_KEY) refresh()
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

  activity.log({
    type: 'register',
    message: `Created a ${roleFromEmail(mail)} account`,
    actor: { id, fullName: name, email: mail },
  })
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
  writeSession(account.id)
  activity.log({ type: 'login', message: 'Logged in', actor: account })
  return { ok: true }
}

const logout = () => {
  const account = currentAccount.value
  if (account) activity.log({ type: 'logout', message: 'Logged out', actor: account })
  sessionId.value = null
  clearSession()
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

  const saved = savePassword(account.id, await hash(`${account.id}:${newPassword}`), newPassword)
  if (saved.ok) activity.log({ type: 'password_change', message: 'Changed their password', actor: account })
  return saved
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
  const saved = savePassword(account.id, newHash, newPassword)
  if (saved.ok) activity.log({ type: 'password_change', message: 'Changed their password', actor: account })
  return saved
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
  activity.log({ type: 'password_change', message: 'Reset their password', actor: account })
  return { ok: true }
}

// ---------- Admin: manage users (create, edit, delete) ----------
// Only an admin can use these. The role always comes from the email domain.
const requireAdmin = () => {
  refresh()
  const me = currentAccount.value
  if (!me || roleFromEmail(me.email) !== 'admin') return { error: 'Only admins can manage users.' }
  return { me }
}

const createUser = async ({ fullName, email, phone = '', password }) => {
  if (!hashAvailable()) return NO_CRYPTO

  const name = String(fullName || '').trim()
  const mail = normalizeEmail(email)
  if (!name || !mail || !password) return { ok: false, error: 'Name, email and password are required.' }
  if (!validEmail(mail)) return { ok: false, error: 'Enter a valid email address.' }
  if (!allowedDomain(mail)) {
    return { ok: false, error: `Use an email ending in ${STAFF_DOMAIN} or ${ADMIN_DOMAIN}.` }
  }
  if (password.length < 8) return { ok: false, error: 'Password must be at least 8 characters.' }

  const guard = requireAdmin()
  if (guard.error) return { ok: false, error: guard.error }
  if (accounts.value.some(a => a.email === mail)) return { ok: false, error: 'An account with this email already exists.' }

  let id = Date.now()
  while (accounts.value.some(a => a.id === id)) id += 1
  const passwordHash = await hash(`${id}:${password}`)

  refresh() // another tab may have changed accounts while we were hashing
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
    accounts.value.pop()
    return { ok: false, error: SAVE_FAILED }
  }

  activity.log({
    type: 'user_create',
    message: `Added ${roleFromEmail(mail)} user "${name}" (${mail})`,
    actor: guard.me,
  })
  return { ok: true }
}

// password is optional: leave it empty to keep the user's current password
const updateUser = async (id, { fullName, email, phone = '', password = '' }) => {
  const name = String(fullName || '').trim()
  const mail = normalizeEmail(email)
  const newPassword = String(password || '')
  if (!name || !mail) return { ok: false, error: 'Name and email are required.' }
  if (!validEmail(mail)) return { ok: false, error: 'Enter a valid email address.' }
  if (newPassword && newPassword.length < 8) return { ok: false, error: 'New password must be at least 8 characters.' }
  if (newPassword && !hashAvailable()) return NO_CRYPTO

  const newHash = newPassword ? await hash(`${id}:${newPassword}`) : null

  const guard = requireAdmin()
  if (guard.error) return { ok: false, error: guard.error }

  const account = accounts.value.find(a => a.id === id)
  if (!account) return { ok: false, error: 'User not found.' }
  if (accounts.value.some(a => a.email === mail && a.id !== id)) {
    return { ok: false, error: 'Another account already uses this email.' }
  }
  // The email decides the role, so it cannot be changed into a different account type
  if (roleFromEmail(mail) !== roleFromEmail(account.email)) {
    return { ok: false, error: `The email decides the account type, so it can't be changed between ${STAFF_DOMAIN} and ${ADMIN_DOMAIN}.` }
  }

  const before = {
    fullName: account.fullName,
    email: account.email,
    phone: account.phone,
    passwordHash: account.passwordHash,
    savedPassword: account.savedPassword,
  }
  account.fullName = name
  account.email = mail
  account.phone = String(phone || '').trim()
  if (newHash) {
    account.passwordHash = newHash
    account.savedPassword = newPassword
  }

  if (!saveAccounts()) {
    Object.assign(account, before)
    return { ok: false, error: SAVE_FAILED }
  }

  activity.log({
    type: 'user_edit',
    message: `Edited user "${name}" (${mail})${newHash ? ' and set a new password' : ''}`,
    actor: guard.me,
  })
  return { ok: true }
}

// Admins cannot delete their own account
const deleteUser = (id) => {
  const guard = requireAdmin()
  if (guard.error) return { ok: false, error: guard.error }
  if (guard.me.id === id) return { ok: false, error: 'You cannot delete your own account.' }

  const index = accounts.value.findIndex(a => a.id === id)
  if (index === -1) return { ok: false, error: 'User not found.' }
  const account = accounts.value[index]

  accounts.value.splice(index, 1)
  if (!saveAccounts()) {
    accounts.value.splice(index, 0, account) // put it back, nothing was saved
    return { ok: false, error: SAVE_FAILED }
  }

  // Remove that user's personal settings, alerts and any pending password reset.
  // Their past sales and activity stay in the records.
  try {
    localStorage.removeItem(`vaulto-settings:${id}`)
    localStorage.removeItem(`vaulto-notifications:${id}`)
    const resets = read(RESET_KEY, {})
    delete resets[account.email]
    write(RESET_KEY, resets)
  } catch {
    /* ignore */
  }

  activity.log({
    type: 'user_delete',
    message: `Deleted user "${account.fullName}" (${account.email})`,
    actor: guard.me,
  })
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
  createUser,
  updateUser,
  deleteUser,
})

// One shared store for the whole app
export const useAuthStore = () => store