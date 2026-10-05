<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '../stores/notifications'
import { useAuthStore } from '../stores/auth'
import { useSettingsStore } from '../stores/settings'
import { rememberPassword } from '../utils/credentials'

const router = useRouter()
const auth = useAuthStore()
const settings = useSettingsStore()

const tabs = [
  { key: 'profile', label: 'Profile' },
  { key: 'business', label: 'Business' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'security', label: 'Security' },
]
const activeTab = ref('profile')
const savedMessage = ref('')
const errorMessage = ref('')

// Profile form starts from the account you signed up with / logged in as
const profile = reactive({
  fullName: auth.user?.fullName || '',
  email: auth.user?.email || '',
  phone: auth.user?.phone || '',
})

// Live preview of the initial while typing the name
const initialPreview = () => profile.fullName.trim().charAt(0).toUpperCase() || '?'

// ---------- Profile picture ----------
const fileInput = ref(null)

const pickPicture = () => fileInput.value?.click()

// Shrink to a small square so it fits in browser storage
const resizeImage = (dataUrl, size = 256) =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = size
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, size, size)
      const scale = Math.max(size / img.width, size / img.height)
      const w = img.width * scale
      const h = img.height * scale
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = reject
    img.src = dataUrl
  })

// Saves only the picture, using the details already stored on the account
const saveAvatar = (url) => {
  const result = auth.updateProfile({
    fullName: auth.user.fullName,
    email: auth.user.email,
    phone: auth.user.phone,
    avatarUrl: url,
  })
  if (!result.ok) {
    errorMessage.value = result.error
    return false
  }
  return true
}

const onPictureSelected = (event) => {
  const file = event.target.files[0]
  event.target.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) {
    errorMessage.value = 'Please choose an image file (JPG, PNG, or WebP).'
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    errorMessage.value = 'Image must be 5 MB or smaller.'
    return
  }
  errorMessage.value = ''
  const reader = new FileReader()
  reader.onload = async () => {
    try {
      const small = await resizeImage(reader.result)
      if (saveAvatar(small)) flash('Profile picture updated.')
    } catch {
      errorMessage.value = 'That image could not be read. Try a different one.'
    }
  }
  reader.readAsDataURL(file)
}

const removePicture = () => {
  if (saveAvatar('')) flash('Profile picture removed.')
}

// ---------- Other settings ----------
const business = reactive({
  storeName: 'Vaulto Store',
  address: '',
  currency: settings.business.currency, // shared: drives the money format in Products, POS and Sold Inventory
  lowStockThreshold: 10,
})

// Shared with the bell, so these toggles control which alerts appear
const notifications = useNotificationStore().preferences

const password = reactive({ current: '', next: '', confirm: '' })
const show = reactive({ current: false, next: false, confirm: false }) // show/hide for each password field

const flash = (msg) => {
  errorMessage.value = ''
  savedMessage.value = msg
  setTimeout(() => (savedMessage.value = ''), 2500)
}

const switchTab = (key) => {
  activeTab.value = key
  savedMessage.value = ''
  errorMessage.value = ''
}

const saveProfile = () => {
  const result = auth.updateProfile({
    fullName: profile.fullName,
    email: profile.email,
    phone: profile.phone,
    avatarUrl: auth.user?.avatarUrl || '',
  })
  if (!result.ok) {
    errorMessage.value = result.error
    return
  }
  flash('Profile saved.')
}

const saveBusiness = () => {
  if (!business.storeName.trim()) {
    errorMessage.value = 'Store name is required.'
    return
  }
  settings.update({ currency: business.currency })
  flash('Business settings saved.')
}

const saveNotifications = () => flash('Notification preferences saved.')

const changePassword = async () => {
  if (!password.current || !password.next || !password.confirm) {
    errorMessage.value = 'Fill in all password fields.'
    return
  }
  if (password.next.length < 8) {
    errorMessage.value = 'New password must be at least 8 characters.'
    return
  }
  if (password.next !== password.confirm) {
    errorMessage.value = 'New password and confirmation do not match.'
    return
  }
  const result = await auth.changePassword(password.current, password.next)
  if (!result.ok) {
    errorMessage.value = result.error
    return
  }
  // The new password is now the current one, so it replaces the old one in that field
  const newPassword = password.next
  password.current = newPassword
  password.next = password.confirm = ''
  flash('Password updated.')

  // Ask the browser's password manager (Google, Edge) to save the new password right away
  rememberPassword({ email: auth.user?.email, password: newPassword, name: auth.user?.fullName })
}

const handleLogout = () => {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="settings-view">
    <!-- Tabs -->
    <div class="tabs" data-testid="settings-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab"
        :class="{ active: activeTab === tab.key }"
        @click="switchTab(tab.key)"
        :data-testid="`settings-tab-${tab.key}`"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="settings-card">
      <p v-if="savedMessage" class="msg success" data-testid="settings-success">{{ savedMessage }}</p>
      <p v-if="errorMessage" class="msg error" data-testid="settings-error">{{ errorMessage }}</p>

      <!-- Profile -->
      <section v-if="activeTab === 'profile'">
        <h3>Profile</h3>
        <p class="hint">Your name and contact details shown across Vaulto.</p>

        <div class="picture-row">
          <button class="avatar-large" @click="pickPicture" title="Change profile picture" data-testid="profile-avatar">
            <img v-if="auth.user?.avatarUrl" :src="auth.user.avatarUrl" alt="Profile picture" class="avatar-img" />
            <span v-else>{{ initialPreview() }}</span>
          </button>
          <div class="picture-actions">
            <button class="btn-upload" @click="pickPicture" data-testid="upload-picture-button">
              {{ auth.user?.avatarUrl ? 'Change picture' : 'Upload picture' }}
            </button>
            <button v-if="auth.user?.avatarUrl" class="btn-remove" @click="removePicture" data-testid="remove-picture-button">Remove</button>
            <small>JPG, PNG or WebP. It's cropped to a square automatically.</small>
          </div>
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="file-hidden"
            @change="onPictureSelected"
            data-testid="profile-picture-input"
          />
        </div>

        <div class="form-group">
          <label>Full name *</label>
          <input v-model="profile.fullName" type="text" class="form-input" data-testid="profile-name-input" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Email *</label>
            <input v-model="profile.email" type="email" class="form-input" data-testid="profile-email-input" />
          </div>
          <div class="form-group">
            <label>Phone</label>
            <input v-model="profile.phone" type="text" class="form-input" data-testid="profile-phone-input" />
          </div>
        </div>
        <button class="btn-save" @click="saveProfile" data-testid="save-profile-button">Save profile</button>
      </section>

      <!-- Business -->
      <section v-if="activeTab === 'business'">
        <h3>Business</h3>
        <p class="hint">Details used on receipts and stock alerts.</p>
        <div class="form-group">
          <label>Store name *</label>
          <input v-model="business.storeName" type="text" class="form-input" data-testid="business-name-input" />
        </div>
        <div class="form-group">
          <label>Address</label>
          <textarea v-model="business.address" rows="2" class="form-input" placeholder="Street, city, province" data-testid="business-address-input"></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Currency</label>
            <select v-model="business.currency" class="form-input" data-testid="business-currency-input">
              <option value="PHP">Philippine Peso (₱)</option>
              <option value="USD">US Dollar ($)</option>
              <option value="EUR">Euro (€)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Low stock alert at</label>
            <input v-model.number="business.lowStockThreshold" type="number" min="0" class="form-input" data-testid="business-threshold-input" />
          </div>
        </div>
        <button class="btn-save" @click="saveBusiness" data-testid="save-business-button">Save business settings</button>
      </section>

      <!-- Notifications -->
      <section v-if="activeTab === 'notifications'">
        <h3>Notifications</h3>
        <p class="hint">Choose what Vaulto alerts you about.</p>
        <label class="toggle-row">
          <span><strong>Low stock</strong><small>When an item drops below your alert level</small></span>
          <input v-model="notifications.lowStock" type="checkbox" data-testid="toggle-low-stock" />
        </label>
        <label class="toggle-row">
          <span><strong>New sale</strong><small>Each time a sale is completed in POS</small></span>
          <input v-model="notifications.newSale" type="checkbox" data-testid="toggle-new-sale" />
        </label>
        <label class="toggle-row">
          <span><strong>Daily summary</strong><small>Sales and stock totals at the end of the day</small></span>
          <input v-model="notifications.dailySummary" type="checkbox" data-testid="toggle-daily-summary" />
        </label>
        <label class="toggle-row">
          <span><strong>Memo reminders</strong><small>High priority memos you haven't read</small></span>
          <input v-model="notifications.memoReminders" type="checkbox" data-testid="toggle-memo-reminders" />
        </label>
        <button class="btn-save" @click="saveNotifications" data-testid="save-notifications-button">Save preferences</button>
      </section>

      <!-- Security -->
      <section v-if="activeTab === 'security'">
        <h3>Security</h3>
        <p class="hint">Use at least 8 characters for your new password.</p>

        <form @submit.prevent="changePassword">
          <!-- Lets the browser's password manager fill the right saved password -->
          <input
            type="text"
            :value="auth.user?.email"
            autocomplete="username"
            class="sr-only"
            tabindex="-1"
            aria-hidden="true"
            readonly
          />

          <div class="form-group">
            <label for="current-password">Current password</label>
            <div class="pw-field">
              <input
                id="current-password"
                v-model="password.current"
                :type="show.current ? 'text' : 'password'"
                autocomplete="current-password"
                class="form-input"
                data-testid="current-password-input"
              />
              <button
                type="button"
                class="pw-toggle"
                @click="show.current = !show.current"
                :aria-label="show.current ? 'Hide current password' : 'Show current password'"
                data-testid="toggle-current-password-button"
              >{{ show.current ? 'Hide' : 'Show' }}</button>
            </div>
            <small class="field-note">For your safety your saved password is never displayed. Type it to confirm it's you.</small>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="new-password">New password</label>
              <div class="pw-field">
                <input
                  id="new-password"
                  v-model="password.next"
                  :type="show.next ? 'text' : 'password'"
                  autocomplete="new-password"
                  class="form-input"
                  data-testid="new-password-input"
                />
                <button
                  type="button"
                  class="pw-toggle"
                  @click="show.next = !show.next"
                  :aria-label="show.next ? 'Hide new password' : 'Show new password'"
                  data-testid="toggle-new-password-button"
                >{{ show.next ? 'Hide' : 'Show' }}</button>
              </div>
            </div>
            <div class="form-group">
              <label for="confirm-password">Confirm new password</label>
              <div class="pw-field">
                <input
                  id="confirm-password"
                  v-model="password.confirm"
                  :type="show.confirm ? 'text' : 'password'"
                  autocomplete="new-password"
                  class="form-input"
                  data-testid="confirm-password-input"
                />
                <button
                  type="button"
                  class="pw-toggle"
                  @click="show.confirm = !show.confirm"
                  :aria-label="show.confirm ? 'Hide confirmation' : 'Show confirmation'"
                  data-testid="toggle-confirm-password-button"
                >{{ show.confirm ? 'Hide' : 'Show' }}</button>
              </div>
            </div>
          </div>

          <button type="submit" class="btn-save" data-testid="change-password-button">Update password</button>
        </form>

        <hr />
        <a href="#" class="logout-link" @click.prevent="handleLogout" data-testid="logout-link">Log out</a>
      </section>
    </div>
  </div>
</template>

<style scoped>
.settings-view {
  padding: 0;
}

/* Profile picture */
.picture-row { display: flex; align-items: center; gap: 20px; margin-bottom: 24px; }
.avatar-large { position: relative; width: 88px; height: 88px; border-radius: 50%; border: 3px solid #e0e7ff; background: #8b89b8; color: #fff; font-size: 2rem; font-weight: 700; display: flex; align-items: center; justify-content: center; overflow: hidden; cursor: pointer; padding: 0; flex-shrink: 0; }
.avatar-large:hover { border-color: #a5b4fc; }
.avatar-large:focus-visible { outline: 3px solid #5d5b8d; outline-offset: 2px; }
.picture-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
.picture-actions small { flex-basis: 100%; font-size: 0.8rem; color: #6b7280; }
.btn-upload { background: #a5b4fc; border: none; padding: 8px 16px; border-radius: 6px; color: #1e1b4b; cursor: pointer; font-weight: 600; }
.btn-upload:hover { background: #818cf8; color: #fff; }
.btn-remove { background: #f3f4f6; border: 1px solid #d1d5db; padding: 8px 16px; border-radius: 6px; color: #b91c1c; cursor: pointer; font-weight: 600; }
.file-hidden { display: none; }
.avatar-img { width: 100%; height: 100%; object-fit: cover; display: block; }

/* Tabs */
.tabs { display: flex; gap: 4px; margin-bottom: 20px; border-bottom: 1px solid #d1d5db; }
.tab { background: none; border: none; padding: 10px 18px; font-size: 0.9rem; font-weight: 600; color: #6b7280; cursor: pointer; border-bottom: 3px solid transparent; margin-bottom: -1px; }
.tab:hover { color: #1e1b4b; }
.tab.active { color: #1e1b4b; border-bottom-color: #5d5b8d; }

/* Card */
.settings-card { background: #fff; border-radius: 8px; border: 1px solid #e5e7eb; padding: 28px; max-width: 680px; }
.settings-card h3 { margin: 0 0 4px; font-size: 1.1rem; color: #111827; }
.hint { margin: 0 0 22px; font-size: 0.85rem; color: #6b7280; }

.msg { padding: 10px 14px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; margin: 0 0 18px; }
.msg.success { background: #dcfce7; color: #166534; }
.msg.error { background: #fee2e2; color: #b91c1c; }

/* Forms */
.form-group { margin-bottom: 16px; display: flex; flex-direction: column; gap: 6px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-group label { font-size: 0.85rem; font-weight: 600; color: #374151; }
.form-input { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.9rem; outline: none; font-family: inherit; }
.form-input:focus { border-color: #5d5b8d; }
.btn-save { background: #1e1b4b; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; margin-top: 8px; }
.btn-save:hover { background: #2e2a6b; }

/* Password fields */
.pw-field { position: relative; display: flex; }
.pw-field .form-input { width: 100%; box-sizing: border-box; padding-right: 64px; }
.pw-toggle { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #4338ca; font-weight: 600; font-size: 0.8rem; cursor: pointer; }
.field-note { font-size: 0.8rem; color: #6b7280; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); opacity: 0; }

/* Toggles */
.toggle-row { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 14px 0; border-bottom: 1px solid #e5e7eb; cursor: pointer; }
.toggle-row span { display: flex; flex-direction: column; gap: 2px; }
.toggle-row strong { font-size: 0.9rem; color: #111827; }
.toggle-row small { font-size: 0.8rem; color: #6b7280; }
.toggle-row input { width: 18px; height: 18px; accent-color: #5d5b8d; cursor: pointer; }
.toggle-row + .btn-save { margin-top: 22px; }

hr { border: none; border-top: 1px solid #e5e7eb; margin: 28px 0 18px; }
.logout-link { color: #ef4444; font-weight: 600; font-size: 0.9rem; text-decoration: none; cursor: pointer; }
.logout-link:hover { text-decoration: underline; }
</style>