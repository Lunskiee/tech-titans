<script setup>
import { ref } from 'vue'

const users = ref([
  { id: 1, name: 'Sarah Geronimo', email: 'sarah@vaulto.com', role: 'Admin' },
  { id: 2, name: 'Juan Dela Cruz', email: 'juan@vaulto.com', role: 'Staff' },
])
</script>

<template>
  <div class="page">
    <h1>User Management</h1>
    <table>
      <thead>
        <tr><th>Name</th><th>Email</th><th>Role</th></tr>
      </thead>
      <tbody>
        <tr v-for="u in users" :key="u.id">
          <td>{{ u.name }}</td>
          <td>{{ u.email }}</td>
          <td>{{ u.role }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.page { padding: 24px; }
h1 { color: #1e1b4b; margin-bottom: 16px; }
table { width: 100%; background: #fff; border-collapse: collapse; border-radius: 8px; overflow: hidden; }
th, td { text-align: left; padding: 12px 16px; border-bottom: 1px solid #e5e7eb; }
th { background: #f9fafb; color: #6b7280; font-size: 14px; }
</style>