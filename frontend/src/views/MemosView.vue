<script setup>
import { ref, computed } from 'vue'
import { useNotificationStore } from '../stores/notifications'

const notifications = useNotificationStore()

// Initial Memos Data
const memos = ref([
  { id: 1, title: 'Restock fast-moving items', date: '2026-10-02', priority: 'High', message: 'Reorder pcs and box items before the weekend rush.' },
  { id: 2, title: 'Supplier price update', date: '2026-10-01', priority: 'Normal', message: 'Kilogram rates increased by 5% starting next month.' },
  { id: 3, title: 'Inventory count schedule', date: '2026-09-28', priority: 'Low', message: 'Monthly stock count happens every last Friday.' },
])

const searchQuery = ref('')
const showModal = ref(false)
const titleInput = ref('')
const dateInput = ref('')
const priorityInput = ref('Normal')
const messageInput = ref('')
const selectedMemoId = ref(null)

// Live search filter
const filteredMemos = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return memos.value
  return memos.value.filter(
    m => m.title.toLowerCase().includes(query) ||
         m.message.toLowerCase().includes(query) ||
         m.priority.toLowerCase().includes(query)
  )
})

// Modal Actions
const openAddModal = () => {
  selectedMemoId.value = null
  titleInput.value = ''
  dateInput.value = new Date().toISOString().slice(0, 10)
  priorityInput.value = 'Normal'
  messageInput.value = ''
  showModal.value = true
}

const openEditModal = (memo) => {
  selectedMemoId.value = memo.id
  titleInput.value = memo.title
  dateInput.value = memo.date
  priorityInput.value = memo.priority
  messageInput.value = memo.message
  showModal.value = true
}

const handleSaveMemo = () => {
  if (!titleInput.value.trim()) return

  if (selectedMemoId.value) {
    const index = memos.value.findIndex(m => m.id === selectedMemoId.value)
    if (index !== -1) {
      memos.value[index].title = titleInput.value.trim()
      memos.value[index].date = dateInput.value
      memos.value[index].priority = priorityInput.value
      memos.value[index].message = messageInput.value.trim()
    }
  } else {
    memos.value.unshift({
      id: Date.now(),
      title: titleInput.value.trim(),
      date: dateInput.value,
      priority: priorityInput.value,
      message: messageInput.value.trim() || 'No message provided.'
    })
    if (priorityInput.value === 'High') {
      notifications.notify({
        type: 'memo',
        title: 'New high priority memo',
        message: titleInput.value.trim(),
        to: '/memos'
      })
    }
  }
  showModal.value = false
}

const deleteMemo = (id) => {
  memos.value = memos.value.filter(m => m.id !== id)
}
</script>

<template>
  <div class="memos-page">
    <!-- Action Bar & Search -->
    <div class="action-bar">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search memo title, message, or priority..."
        class="search-input"
        data-testid="memo-search-input"
      />
      <button class="btn-add" @click="openAddModal" data-testid="add-memo-button">
        + Add Memo
      </button>
    </div>

    <!-- Data Table -->
    <div class="table-card">
      <table data-testid="memos-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Date</th>
            <th>Priority</th>
            <th>Message</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="memo in filteredMemos" :key="memo.id" data-testid="memo-row">
            <td class="font-medium">{{ memo.title }}</td>
            <td>{{ memo.date }}</td>
            <td><span class="badge" :class="memo.priority.toLowerCase()">{{ memo.priority }}</span></td>
            <td>{{ memo.message }}</td>
            <td class="action-cells">
              <button class="btn-edit" @click="openEditModal(memo)" data-testid="memo-edit-button">Edit</button>
              <button class="btn-delete" @click="deleteMemo(memo.id)" data-testid="memo-delete-button">Delete</button>
            </td>
          </tr>
          <tr v-if="filteredMemos.length === 0">
            <td colspan="5" class="empty-state" data-testid="empty-memos-message">
              No memos found.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" data-testid="memo-modal-overlay">
      <div class="modal-card" data-testid="memo-modal">
        <div class="modal-header">
          <h3 data-testid="memo-modal-title">{{ selectedMemoId ? 'Edit Memo' : 'Add Memo' }}</h3>
          <button class="btn-close" @click="showModal = false">✕</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>Title *</label>
            <input v-model="titleInput" type="text" placeholder="e.g., Restock reminder" class="form-input" data-testid="memo-title-input" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Date</label>
              <input v-model="dateInput" type="date" class="form-input" data-testid="memo-date-input" />
            </div>
            <div class="form-group">
              <label>Priority</label>
              <select v-model="priorityInput" class="form-input" data-testid="memo-priority-input">
                <option>Low</option>
                <option>Normal</option>
                <option>High</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Message</label>
            <textarea v-model="messageInput" placeholder="Write your memo..." rows="3" class="form-input" data-testid="memo-message-input"></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="showModal = false" data-testid="memo-modal-cancel-button">Cancel</button>
          <button class="btn-save" @click="handleSaveMemo" data-testid="memo-modal-save-button">Save Memo</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.memos-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Action Bar */
.action-bar { 
  display: flex; 
  justify-content: space-between;
  align-items: center; 
  gap: 16px; 
}
.search-input { 
  width: 360px; 
  padding: 10px 16px; 
  border-radius: 6px; 
  border: 1px solid #d1d5db; 
  outline: none; 
  font-size: 0.9rem; 
  background: #fff;
}
.search-input:focus {
  border-color: #5d5b8d;
}
.btn-add { 
  background: #1e1b4b; 
  color: #fff; 
  border: none; 
  padding: 10px 20px; 
  border-radius: 6px; 
  cursor: pointer; 
  font-weight: 600; 
}

/* Table */
.table-card { 
  background: #fff; 
  border-radius: 8px; 
  border: 1px solid #e5e7eb; 
  overflow: hidden; 
}
table { 
  width: 100%; 
  border-collapse: collapse; 
  text-align: left; 
}
th { 
  background: #8b89b8; 
  color: #fff; 
  padding: 12px 16px; 
  font-size: 0.85rem; 
}
td { 
  padding: 12px 16px; 
  border-bottom: 1px solid #e5e7eb; 
  font-size: 0.9rem; 
  color: #374151; 
  vertical-align: middle; 
}
.font-medium { 
  font-weight: 600; 
  color: #111827; 
}
.badge { 
  padding: 4px 10px; 
  border-radius: 4px; 
  font-weight: 600; 
  font-size: 0.8rem; 
}
.badge.low { 
  background: #e0e7ff; 
  color: #3730a3; 
}
.badge.normal { 
  background: #dbeafe; 
  color: #1e40af; 
}
.badge.high { 
  background: #fee2e2; 
  color: #b91c1c; 
}

.action-cells { 
  display: flex; 
  gap: 8px; 
}
.btn-edit { 
  background: #a5b4fc; 
  border: none; 
  padding: 6px 16px; 
  border-radius: 4px; 
  color: #1e1b4b; 
  cursor: pointer; 
  font-weight: 600; 
}
.btn-edit:hover { 
  background: #818cf8; 
  color: #fff; 
}
.btn-delete { 
  background: #ef4444; 
  border: none; 
  padding: 6px 16px; 
  border-radius: 4px; 
  color: #fff; 
  cursor: pointer; 
  font-weight: 600; 
}
.btn-delete:hover { 
  background: #dc2626; 
}
.empty-state { 
  text-align: center; 
  color: #6b7280; 
  padding: 32px; 
  font-style: italic; 
}

/* Modal */
.modal-overlay { 
  position: fixed; 
  inset: 0; 
  background: rgba(0, 0, 0, 0.4); 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  z-index: 50; 
}
.modal-card { 
  background: #fff; 
  border-radius: 8px; 
  width: 420px; 
  padding: 24px; 
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15); 
}
.modal-header { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-bottom: 20px; 
}
.modal-header h3 { 
  font-size: 1.1rem; 
  font-weight: 600; 
  margin: 0; 
}
.btn-close { 
  background: none; 
  border: none; 
  font-size: 1.2rem; 
  cursor: pointer; 
  color: #6b7280; 
}
.form-group { 
  margin-bottom: 16px; 
  display: flex; 
  flex-direction: column; 
  gap: 6px; 
}
.form-row { 
  display: grid; 
  grid-template-columns: 1fr 1fr; 
  gap: 12px; 
}
.form-group label { 
  font-size: 0.85rem; 
  font-weight: 600; 
  color: #374151; 
}
.form-input { 
  padding: 8px 12px; 
  border: 1px solid #d1d5db; 
  border-radius: 6px; 
  font-size: 0.9rem; 
  outline: none; 
  font-family: inherit; 
}
.form-input:focus { 
  border-color: #5d5b8d; 
}
.modal-footer { 
  display: flex; 
  justify-content: flex-end; 
  gap: 12px; 
  margin-top: 24px; 
}
.btn-cancel { 
  background: #f3f4f6; 
  border: 1px solid #d1d5db; 
  padding: 8px 16px; 
  border-radius: 6px; 
  cursor: pointer; 
}
.btn-save { 
  background: #1e1b4b; 
  color: #fff; 
  border: none; 
  padding: 8px 16px; 
  border-radius: 6px; 
  cursor: pointer; 
  font-weight: 600; 
}
</style>