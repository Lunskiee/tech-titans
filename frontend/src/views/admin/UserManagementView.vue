<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()

const search = ref('')
const roleFilter = ref('all')

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
</script>

<template>
  <div class="page">
    <h1>User Management</h1>

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
      />
      <select v-model="roleFilter" class="filter-select">
        <option value="all">All roles</option>
        <option value="admin">Admins</option>
        <option value="staff">Staff</option>
      </select>
    </div>

    <!-- Table -->
    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Role</th>
            <th>Joined</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in filtered" :key="u.id">
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
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="5" class="empty">
              {{ users.length === 0 ? 'No accounts yet.' : 'No users match your search.' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 20px; }
h1 { color: #1e1b4b; margin: 0; }

.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
.card { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
.label { color: #6b7280; font-size: 14px; margin: 0; }
.value { color: #1e1b4b; font-size: 28px; font-weight: 700; margin: 8px 0 0; }

.toolbar { display: flex; gap: 12px; }
.search-input { width: 360px; max-width: 100%; padding: 10px 16px; border-radius: 6px; border: 1px solid #d1d5db; outline: none; font-size: 0.9rem; background: #fff; }
.search-input:focus { border-color: #5d5b8d; }
.filter-select { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; font-size: 0.9rem; }

.table-card { background: #fff; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden; }
table { width: 100%; border-collapse: collapse; text-align: left; }
th { background: #8b89b8; color: #fff; padding: 12px 16px; font-size: 0.85rem; }
td { padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 0.9rem; color: #374151; vertical-align: middle; }

.user-cell { display: flex; align-items: center; gap: 10px; }
.avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
.avatar.initial { display: flex; align-items: center; justify-content: center; background: #8b8bc7; color: #fff; font-weight: 700; font-size: 0.85rem; }
.name { font-weight: 600; color: #111827; }
.you { font-size: 0.7rem; font-weight: 700; background: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 999px; }

.badge { padding: 3px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 700; }
.badge.admin { background: #ede9fe; color: #6d28d9; }
.badge.staff { background: #dbeafe; color: #1d4ed8; }

.empty { text-align: center; color: #6b7280; padding: 32px; font-style: italic; }
</style>