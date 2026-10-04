<script setup>
import { ref, computed } from 'vue'

// Initial Contacts Data
const contacts = ref([
  { id: 1, name: 'Maria Santos', company: 'Santos Trading', phone: '0917 123 4567', email: 'maria@santostrading.com', type: 'Supplier' },
  { id: 2, name: 'Juan Dela Cruz', company: 'JDC Store', phone: '0918 234 5678', email: 'juan@jdcstore.com', type: 'Customer' },
  { id: 3, name: 'Ana Reyes', company: 'Reyes Wholesale', phone: '0922 345 6789', email: 'ana@reyeswholesale.com', type: 'Supplier' },
])

const searchQuery = ref('')
const showModal = ref(false)
const nameInput = ref('')
const companyInput = ref('')
const phoneInput = ref('')
const emailInput = ref('')
const typeInput = ref('Customer')
const selectedContactId = ref(null)

// Live search filter
const filteredContacts = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return contacts.value
  return contacts.value.filter(
    c => c.name.toLowerCase().includes(query) ||
         c.company.toLowerCase().includes(query) ||
         c.phone.toLowerCase().includes(query) ||
         c.email.toLowerCase().includes(query)
  )
})

// Modal Actions
const openAddModal = () => {
  selectedContactId.value = null
  nameInput.value = ''
  companyInput.value = ''
  phoneInput.value = ''
  emailInput.value = ''
  typeInput.value = 'Customer'
  showModal.value = true
}

const openEditModal = (contact) => {
  selectedContactId.value = contact.id
  nameInput.value = contact.name
  companyInput.value = contact.company
  phoneInput.value = contact.phone
  emailInput.value = contact.email
  typeInput.value = contact.type
  showModal.value = true
}

const handleSaveContact = () => {
  if (!nameInput.value.trim()) return

  if (selectedContactId.value) {
    const index = contacts.value.findIndex(c => c.id === selectedContactId.value)
    if (index !== -1) {
      contacts.value[index].name = nameInput.value.trim()
      contacts.value[index].company = companyInput.value.trim()
      contacts.value[index].phone = phoneInput.value.trim()
      contacts.value[index].email = emailInput.value.trim()
      contacts.value[index].type = typeInput.value
    }
  } else {
    contacts.value.unshift({
      id: Date.now(),
      name: nameInput.value.trim(),
      company: companyInput.value.trim(),
      phone: phoneInput.value.trim(),
      email: emailInput.value.trim(),
      type: typeInput.value
    })
  }
  showModal.value = false
}

const deleteContact = (id) => {
  contacts.value = contacts.value.filter(c => c.id !== id)
}
</script>

<template>
  <div class="contacts-page">
    <!-- Action Bar & Search -->
    <div class="action-bar">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search name, company, phone, or email..."
        class="search-input"
        data-testid="contact-search-input"
      />
      <button class="btn-add" @click="openAddModal" data-testid="add-contact-button">
        + Add Contact
      </button>
    </div>

    <!-- Data Table -->
    <div class="table-card">
      <table data-testid="contacts-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Company</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Type</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="contact in filteredContacts" :key="contact.id" data-testid="contact-row">
            <td class="font-medium">{{ contact.name }}</td>
            <td>{{ contact.company }}</td>
            <td>{{ contact.phone }}</td>
            <td>{{ contact.email }}</td>
            <td><span class="badge" :class="contact.type.toLowerCase()">{{ contact.type }}</span></td>
            <td class="action-cells">
              <button class="btn-edit" @click="openEditModal(contact)" data-testid="contact-edit-button">Edit</button>
              <button class="btn-delete" @click="deleteContact(contact.id)" data-testid="contact-delete-button">Delete</button>
            </td>
          </tr>
          <tr v-if="filteredContacts.length === 0">
            <td colspan="6" class="empty-state" data-testid="empty-contacts-message">
              No contacts found.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" data-testid="contact-modal-overlay">
      <div class="modal-card" data-testid="contact-modal">
        <div class="modal-header">
          <h3 data-testid="contact-modal-title">{{ selectedContactId ? 'Edit Contact' : 'Add Contact' }}</h3>
          <button class="btn-close" @click="showModal = false">✕</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>Name *</label>
            <input v-model="nameInput" type="text" placeholder="Full name" class="form-input" data-testid="contact-name-input" />
          </div>

          <div class="form-group">
            <label>Company</label>
            <input v-model="companyInput" type="text" placeholder="Company or store" class="form-input" data-testid="contact-company-input" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Phone</label>
              <input v-model="phoneInput" type="text" placeholder="0917 000 0000" class="form-input" data-testid="contact-phone-input" />
            </div>
            <div class="form-group">
              <label>Type</label>
              <select v-model="typeInput" class="form-input" data-testid="contact-type-input">
                <option>Customer</option>
                <option>Supplier</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Email</label>
            <input v-model="emailInput" type="email" placeholder="name@example.com" class="form-input" data-testid="contact-email-input" />
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="showModal = false" data-testid="contact-modal-cancel-button">Cancel</button>
          <button class="btn-save" @click="handleSaveContact" data-testid="contact-modal-save-button">Save Contact</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.contacts-page {
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
.badge.customer { 
  background: #e0e7ff; 
  color: #3730a3; 
}
.badge.supplier { 
  background: #dcfce7; 
  color: #166534; 
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