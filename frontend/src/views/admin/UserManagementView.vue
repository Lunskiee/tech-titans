<script setup>
import { ref, reactive, computed } from 'vue'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()

const search = ref('')
const roleFilter = ref('all')
const message = ref('')

const users = computed(() => auth.allUsers || [])
const adminCount = computed(() => users.value.filter((u) => u.role === 'admin').length)
const staffCount = computed(() => users.value.filter((u) => u.role === 'staff').length)

const filtered = computed(() => {
  const q = search.value.toLowerCase().trim()
  return users.value.filter((u) => {
    const matchesRole = roleFilter.value === 'all' || u.role === roleFilter.value
    const matchesSearch =
      !q ||
      (u.fullName || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    return matchesRole && matchesSearch
  })
})

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—'

const flash = (msg) => {
  message.value = msg
  setTimeout(() => (message.value = ''), 2500)
}

// ---------- Add / Edit window ----------
const showModal = ref(false)
const editingId = ref(null)
const formError = ref('')
const showPassword = ref(false)
const saving = ref(false)
const form = reactive({ fullName: '', email: '', phone: '', password: '' })

const emailHint = computed(() => {
  if (editingId.value) return "The email decides the account type, so it can't be changed between @staff.com and @admin.com."
  const mail = form.email.trim().toLowerCase()
  if (mail.endsWith('@admin.com')) return 'This will be an Admin account.'
  if (mail.endsWith('@staff.com')) return 'This will be a Staff account.'
  return mail ? 'Use an email ending in @staff.com or @admin.com.' : '@admin.com makes an Admin, @staff.com makes a Staff user.'
})

const openAdd = () => {
  editingId.value = null
  Object.assign(form, { fullName: '', email: '', phone: '', password: '' })
  formError.value = ''
  showPassword.value = false
  showModal.value = true
}

const openEdit = (u) => {
  editingId.value = u.id
  Object.assign(form, { fullName: u.fullName || '', email: u.email || '', phone: u.phone || '', password: '' })
  formError.value = ''
  showPassword.value = false
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  formError.value = ''
}

const saveUser = async () => {
  formError.value = ''
  const isEdit = !!editingId.value
  saving.value = true
  const result = isEdit
    ? await auth.updateUser(editingId.value, { ...form })
    : await auth.createUser({ ...form })
  saving.value = false

  if (!result.ok) {
    formError.value = result.error
    return
  }
  closeModal()
  flash(isEdit ? 'User updated.' : 'User added.')
}

// ---------- Delete window ----------
const deleting = ref(null)
const deleteError = ref('')

const askDelete = (u) => {
  deleteError.value = ''
  deleting.value = u
}

const cancelDelete = () => {
  deleting.value = null
  deleteError.value = ''
}

const confirmDelete = () => {
  const name = deleting.value.fullName
  const result = auth.deleteUser(deleting.value.id)
  if (!result.ok) {
    deleteError.value = result.error
    return
  }
  deleting.value = null
  flash(`Deleted ${name}.`)
}
</script>

<template>
  <div class="page">
    <div class="title-row">
      <h1>User Management</h1>
      <button class="btn-add" @click="openAdd" data-testid="add-user-button">+ Add User</button>
    </div>

    <p v-if="message" class="msg success" data-testid="user-message">{{ message }}</p>

    <!-- Summary -->
    <div class="cards">
      <div class="card">
        <p class="label">Total users</p>
        <p class="value">{{ users.length }}</p>
      </div>
      <div class="card">
        <p class="label">Admins</p>
        <p class="value">{{ adminCount }}</p>
      </div>
      <div class="card">
        <p class="label">Staff</p>
        <p class="value">{{ staffCount }}</p>
      </div>
    </div>

    <!-- Search + filter -->
    <div class="toolbar">
      <input
        v-model="search"
        type="text"
        placeholder="Search by name or email..."
        class="search-input"
        data-testid="user-search-input"
      />
      <select v-model="roleFilter" class="filter-select" data-testid="user-role-filter">
        <option value="all">All roles</option>
        <option value="admin">Admins</option>
        <option value="staff">Staff</option>
      </select>
    </div>

    <!-- Table -->
    <div class="table-card">
      <table data-testid="users-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Role</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in filtered" :key="u.id" data-testid="user-row">
            <td>
              <div class="user-cell">
                <img v-if="u.avatarUrl" :src="u.avatarUrl" alt="" class="avatar" />
                <span v-else class="avatar initial">
                  {{ (u.fullName || '?').trim().charAt(0).toUpperCase() }}
                </span>
                <span class="name">{{ u.fullName }}</span>
                <span v-if="u.id === auth.user?.id" class="you">You</span>
              </div>
            </td>
            <td>{{ u.email }}</td>
            <td>{{ u.phone || '—' }}</td>
            <td>
              <span class="badge" :class="u.role">{{ u.role === 'admin' ? 'Admin' : 'Staff' }}</span>
            </td>
            <td>{{ formatDate(u.createdAt) }}</td>
            <td>
              <div class="action-cells">
                <button class="btn-edit" @click="openEdit(u)" data-testid="user-edit-button">Edit</button>
                <button
                  v-if="u.id !== auth.user?.id"
                  class="btn-delete"
                  @click="askDelete(u)"
                  data-testid="user-delete-button"
                >Delete</button>
              </div>
            </td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="6" class="empty">
              {{ users.length === 0 ? 'No accounts yet.' : 'No users match your search.' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add / Edit window -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal" data-testid="user-modal-overlay">
      <div class="modal-card" data-testid="user-modal">
        <div class="modal-header">
          <h3>{{ editingId ? 'Edit User' : 'Add User' }}</h3>
          <button class="btn-close" @click="closeModal">✕</button>
        </div>

        <form @submit.prevent="saveUser">
          <p v-if="formError" class="form-error" data-testid="user-form-error">{{ formError }}</p>

          <div class="form-group">
            <label>Full name *</label>
            <input v-model="form.fullName" type="text" class="form-input" data-testid="user-name-input" />
          </div>

          <div class="form-group">
            <label>Email *</label>
            <input v-model="form.email" type="email" class="form-input" placeholder="name@staff.com" data-testid="user-email-input" />
            <small class="field-note">{{ emailHint }}</small>
          </div>

          <div class="form-group">
            <label>Phone</label>
            <input v-model="form.phone" type="text" class="form-input" data-testid="user-phone-input" />
          </div>

          <div class="form-group">
            <label>{{ editingId ? 'New password' : 'Password *' }}</label>
            <div class="pw-field">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                class="form-input"
                :placeholder="editingId ? 'Leave blank to keep the current password' : 'At least 8 characters'"
                data-testid="user-password-input"
              />
              <button type="button" class="pw-toggle" @click="showPassword = !showPassword">
                {{ showPassword ? 'Hide' : 'Show' }}
              </button>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-cancel" @click="closeModal">Cancel</button>
            <button type="submit" class="btn-save" :disabled="saving" data-testid="user-save-button">
              {{ saving ? 'Saving...' : editingId ? 'Save changes' : 'Add user' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete window -->
    <div v-if="deleting" class="modal-overlay" @click.self="cancelDelete" data-testid="user-delete-overlay">
      <div class="modal-card" data-testid="user-delete-modal">
        <div class="modal-header">
          <h3>Delete user?</h3>
          <button class="btn-close" @click="cancelDelete">✕</button>
        </div>
        <p v-if="deleteError" class="form-error">{{ deleteError }}</p>
        <p class="confirm-text">
          <strong>{{ deleting.fullName }}</strong> ({{ deleting.email }}) will lose access, and their
          personal settings and alerts will be removed. Their past sales and activity stay in the records.
          This can't be undone.
        </p>
        <div class="modal-footer">
          <button class="btn-cancel" @click="cancelDelete">Cancel</button>
          <button class="btn-danger" @click="confirmDelete" data-testid="user-confirm-delete">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 20px; }
.title-row { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
h1 { color: #1e1b4b; margin: 0; }
.btn-add { background: #1e1b4b; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; }
.btn-add:hover { background: #2e2a6b; }

.msg { padding: 10px 14px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; margin: 0; }
.msg.success { background: #dcfce7; color: #166534; }

.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
.card { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
.label { color: #6b7280; font-size: 14px; margin: 0; }
.value { color: #1e1b4b; font-size: 28px; font-weight: 700; margin: 8px 0 0; }

.toolbar { display: flex; gap: 12px; flex-wrap: wrap; }
.search-input { width: 360px; max-width: 100%; padding: 10px 16px; border-radius: 6px; border: 1px solid #d1d5db; outline: none; font-size: 0.9rem; background: #fff; }
.search-input:focus { border-color: #5d5b8d; }
.filter-select { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; font-size: 0.9rem; }

.table-card { background: #fff; border-radius: 8px; border: 1px solid #e5e7eb; overflow-x: auto; }
table { width: 100%; border-collapse: collapse; text-align: left; }
th { background: #8b89b8; color: #fff; padding: 12px 16px; font-size: 0.85rem; white-space: nowrap; }
td { padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 0.9rem; color: #374151; vertical-align: middle; }

.user-cell { display: flex; align-items: center; gap: 10px; }
.avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
.avatar.initial { display: flex; align-items: center; justify-content: center; background: #8b8bc7; color: #fff; font-weight: 700; font-size: 0.85rem; }
.name { font-weight: 600; color: #111827; }
.you { font-size: 0.7rem; font-weight: 700; background: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 999px; }

.badge { padding: 3px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 700; }
.badge.admin { background: #ede9fe; color: #6d28d9; }
.badge.staff { background: #dbeafe; color: #1d4ed8; }

.action-cells { display: flex; gap: 8px; }
.btn-edit { background: #a5b4fc; border: none; padding: 6px 16px; border-radius: 4px; color: #1e1b4b; cursor: pointer; font-weight: 600; }
.btn-edit:hover { background: #818cf8; color: #fff; }
.btn-delete { background: #ef4444; border: none; padding: 6px 16px; border-radius: 4px; color: #fff; cursor: pointer; font-weight: 600; }
.btn-delete:hover { background: #dc2626; }

.empty { text-align: center; color: #6b7280; padding: 32px; font-style: italic; }

/* Windows */
.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.4); display: flex; align-items: center; justify-content: center; z-index: 50; }
.modal-card { background: #fff; border-radius: 8px; width: 440px; max-width: 92vw; max-height: 90vh; overflow-y: auto; padding: 24px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15); }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.modal-header h3 { font-size: 1.1rem; font-weight: 600; margin: 0; }
.btn-close { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #6b7280; }

.form-group { margin-bottom: 16px; display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 0.85rem; font-weight: 600; color: #374151; }
.form-input { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.9rem; outline: none; font-family: inherit; }
.form-input:focus { border-color: #5d5b8d; }
.field-note { font-size: 0.8rem; color: #6b7280; }
.form-error { margin: 0 0 16px; padding: 8px 12px; background: #fef2f2; color: #b91c1c; border: 1px solid #fca5a5; border-radius: 6px; font-size: 0.85rem; }

.pw-field { position: relative; display: flex; }
.pw-field .form-input { width: 100%; box-sizing: border-box; padding-right: 64px; }
.pw-toggle { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #4338ca; font-weight: 600; font-size: 0.8rem; cursor: pointer; }

.confirm-text { margin: 0; font-size: 0.9rem; color: #374151; line-height: 1.5; }

.modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
.btn-cancel { background: #f3f4f6; border: 1px solid #d1d5db; color: #374151; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; }
.btn-cancel:hover { background: #e5e7eb; }
.btn-save { background: #1e1b4b; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; }
.btn-save:hover:not(:disabled) { background: #2e2a6b; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-danger { background: #ef4444; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; }
.btn-danger:hover { background: #dc2626; }
</style>