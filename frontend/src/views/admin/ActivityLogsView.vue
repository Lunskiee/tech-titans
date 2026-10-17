<script setup>
import { ref, computed } from 'vue'
import { useActivityStore } from '../../stores/activity'

const activity = useActivityStore()

// What each kind of entry is called, which group it belongs to, and its badge color
const TYPES = {
  login: { label: 'Login', group: 'Accounts', color: 'blue' },
  logout: { label: 'Logout', group: 'Accounts', color: 'gray' },
  register: { label: 'New account', group: 'Accounts', color: 'purple' },
  password_change: { label: 'Password', group: 'Accounts', color: 'amber' },
  user_create: { label: 'User added', group: 'Accounts', color: 'green' },
  user_edit: { label: 'User edited', group: 'Accounts', color: 'blue' },
  user_delete: { label: 'User deleted', group: 'Accounts', color: 'red' },
  sale: { label: 'Sale', group: 'Sales', color: 'green' },
  sale_void: { label: 'Void', group: 'Sales', color: 'red' },
  product_add: { label: 'Product added', group: 'Products', color: 'green' },
  product_edit: { label: 'Product edited', group: 'Products', color: 'blue' },
  product_delete: { label: 'Product deleted', group: 'Products', color: 'red' },
  category_add: { label: 'Category added', group: 'Categories', color: 'green' },
  category_edit: { label: 'Category edited', group: 'Categories', color: 'blue' },
  category_delete: { label: 'Category deleted', group: 'Categories', color: 'red' },
}
const GROUPS = ['Accounts', 'Sales', 'Products', 'Categories']
const info = (type) => TYPES[type] || { label: type, group: 'Other', color: 'gray' }

const search = ref('')
const userFilter = ref('all')
const groupFilter = ref('all')
const limit = ref(50)

const entries = computed(() => activity.entries || [])

// Everyone who appears in the log (for the "User" filter)
const people = computed(() => {
  const map = new Map()
  for (const e of entries.value) {
    const key = e.actorId ?? e.actorName
    if (!map.has(key)) map.set(key, { key, name: e.actorName })
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
})

const filtered = computed(() => {
  const q = search.value.toLowerCase().trim()
  return entries.value.filter((e) => {
    const matchesUser = userFilter.value === 'all' || (e.actorId ?? e.actorName) === userFilter.value
    const matchesGroup = groupFilter.value === 'all' || info(e.type).group === groupFilter.value
    const matchesSearch =
      !q ||
      e.message.toLowerCase().includes(q) ||
      e.actorName.toLowerCase().includes(q) ||
      (e.actorEmail || '').toLowerCase().includes(q)
    return matchesUser && matchesGroup && matchesSearch
  })
})

const visible = computed(() => filtered.value.slice(0, limit.value))

const formatDate = (ts) =>
  new Date(ts).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
</script>

<template>
  <div class="page">
    <h1>Activity Logs</h1>
    <p class="sub">Who did what, newest first. Logging started when this feature was added.</p>

    <!-- Filters -->
    <div class="toolbar">
      <input
        v-model="search"
        type="text"
        placeholder="Search by person or details..."
        class="search-input"
        data-testid="activity-search-input"
      />
      <select v-model="userFilter" class="filter-select" data-testid="activity-user-filter">
        <option value="all">All users</option>
        <option v-for="p in people" :key="p.key" :value="p.key">{{ p.name }}</option>
      </select>
      <select v-model="groupFilter" class="filter-select" data-testid="activity-group-filter">
        <option value="all">All activity</option>
        <option v-for="g in GROUPS" :key="g" :value="g">{{ g }}</option>
      </select>
    </div>

    <!-- Table -->
    <div class="table-card">
      <table data-testid="activity-table">
        <thead>
          <tr>
            <th>When</th>
            <th>User</th>
            <th>Action</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in visible" :key="e.id" data-testid="activity-row">
            <td class="nowrap">{{ formatDate(e.createdAt) }}</td>
            <td>
              <div class="person">
                <span class="name">{{ e.actorName }}</span>
                <span v-if="e.actorEmail" class="email">{{ e.actorEmail }}</span>
              </div>
            </td>
            <td><span class="badge" :class="info(e.type).color">{{ info(e.type).label }}</span></td>
            <td>{{ e.message }}</td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="4" class="empty">
              {{ entries.length === 0 ? 'No activity yet. Logins, sales and product changes will show up here.' : 'Nothing matches your filters.' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="filtered.length > 0" class="footer">
      <span class="count">Showing {{ visible.length }} of {{ filtered.length }}</span>
      <button v-if="visible.length < filtered.length" class="btn-more" @click="limit += 50">Show more</button>
    </div>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 16px; }
h1 { color: #1e1b4b; margin: 0; }
.sub { margin: -8px 0 0; color: #6b7280; font-size: 0.9rem; }

.toolbar { display: flex; gap: 12px; flex-wrap: wrap; }
.search-input { width: 320px; max-width: 100%; padding: 10px 16px; border-radius: 6px; border: 1px solid #d1d5db; outline: none; font-size: 0.9rem; background: #fff; }
.search-input:focus { border-color: #5d5b8d; }
.filter-select { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; font-size: 0.9rem; }

.table-card { background: #fff; border-radius: 8px; border: 1px solid #e5e7eb; overflow-x: auto; }
table { width: 100%; border-collapse: collapse; text-align: left; }
th { background: #8b89b8; color: #fff; padding: 12px 16px; font-size: 0.85rem; white-space: nowrap; }
td { padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 0.9rem; color: #374151; vertical-align: middle; }
.nowrap { white-space: nowrap; color: #6b7280; }

.person { display: flex; flex-direction: column; }
.name { font-weight: 600; color: #111827; }
.email { font-size: 0.75rem; color: #9ca3af; }

.badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 700; white-space: nowrap; }
.badge.blue { background: #dbeafe; color: #1d4ed8; }
.badge.green { background: #dcfce7; color: #166534; }
.badge.red { background: #fee2e2; color: #b91c1c; }
.badge.amber { background: #fef3c7; color: #92400e; }
.badge.purple { background: #ede9fe; color: #6d28d9; }
.badge.gray { background: #f3f4f6; color: #4b5563; }

.empty { text-align: center; color: #6b7280; padding: 32px; font-style: italic; }

.footer { display: flex; justify-content: space-between; align-items: center; }
.count { color: #6b7280; font-size: 0.85rem; }
.btn-more { background: #fff; border: 1px solid #d1d5db; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; color: #374151; }
.btn-more:hover { background: #f9fafb; }
</style>