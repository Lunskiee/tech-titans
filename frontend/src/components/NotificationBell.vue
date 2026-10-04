<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '../stores/notifications'

const store = useNotificationStore()
const router = useRouter()
const open = ref(false)
const root = ref(null)

const toggle = () => (open.value = !open.value)

const openItem = (n) => {
  store.markRead(n.id)
  if (n.to) {
    open.value = false
    router.push(n.to)
  }
}

const timeAgo = (ts) => {
  const mins = Math.floor((Date.now() - ts) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// Close when clicking outside or pressing Escape
const onClickOutside = (e) => {
  if (root.value && !root.value.contains(e.target)) open.value = false
}
const onKey = (e) => {
  if (e.key === 'Escape') open.value = false
}
onMounted(() => {
  document.addEventListener('click', onClickOutside)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div ref="root" class="bell-wrap">
    <button class="bell-btn" @click="toggle" aria-label="Notifications" data-testid="notification-bell">
      🔔
      <span v-if="store.unreadCount" class="bell-badge" data-testid="notification-badge">
        {{ store.unreadCount > 9 ? '9+' : store.unreadCount }}
      </span>
    </button>

    <div v-if="open" class="panel" data-testid="notification-panel">
      <div class="panel-header">
        <strong>Notifications</strong>
        <div class="panel-actions">
          <button @click="store.markAllRead()" :disabled="!store.unreadCount" data-testid="mark-all-read">Mark all read</button>
          <button @click="store.clearAll()" :disabled="!store.items.length" data-testid="clear-all">Clear</button>
        </div>
      </div>

      <ul v-if="store.items.length" class="list">
        <li
          v-for="n in store.items"
          :key="n.id"
          class="item"
          :class="{ unread: !n.read }"
          data-testid="notification-item"
        >
          <button class="item-main" @click="openItem(n)">
            <span class="dot" :class="n.type"></span>
            <span class="text">
              <span class="title">{{ n.title }}</span>
              <span class="message">{{ n.message }}</span>
              <span class="time">{{ timeAgo(n.createdAt) }}</span>
            </span>
          </button>
          <button class="item-remove" @click="store.remove(n.id)" aria-label="Dismiss notification">✕</button>
        </li>
      </ul>
      <p v-else class="empty" data-testid="notification-empty">You're all caught up. New alerts will show here.</p>
    </div>
  </div>
</template>

<style scoped>
.bell-wrap { position: relative; }
.bell-btn { position: relative; background: none; border: none; font-size: 1.1rem; cursor: pointer; padding: 6px; line-height: 1; border-radius: 6px; }
.bell-btn:hover { background: rgba(255, 255, 255, 0.12); }
.bell-badge { position: absolute; top: -2px; right: -4px; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9px; background: #ef4444; color: #fff; font-size: 0.7rem; font-weight: 700; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }

.panel { position: absolute; right: 0; top: calc(100% + 10px); width: 340px; max-height: 420px; background: #fff; color: #111827; border-radius: 8px; border: 1px solid #e5e7eb; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.18); z-index: 60; display: flex; flex-direction: column; overflow: hidden; }
.panel-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; border-bottom: 1px solid #e5e7eb; font-size: 0.9rem; }
.panel-actions { display: flex; gap: 10px; }
.panel-actions button { background: none; border: none; color: #5d5b8d; font-size: 0.8rem; font-weight: 600; cursor: pointer; padding: 0; }
.panel-actions button:disabled { color: #9ca3af; cursor: default; }

.list { list-style: none; margin: 0; padding: 0; overflow-y: auto; }
.item { display: flex; align-items: flex-start; border-bottom: 1px solid #f3f4f6; }
.item.unread { background: #f5f5ff; }
.item-main { flex: 1; display: flex; gap: 10px; text-align: left; background: none; border: none; padding: 12px 8px 12px 14px; cursor: pointer; font-family: inherit; }
.item-main:hover { background: #eef0ff; }
.dot { width: 9px; height: 9px; border-radius: 50%; margin-top: 6px; flex-shrink: 0; background: #a5b4fc; }
.dot.low_stock { background: #ef4444; }
.dot.sale { background: #22c55e; }
.dot.memo { background: #f59e0b; }
.text { display: flex; flex-direction: column; gap: 2px; }
.title { font-size: 0.85rem; font-weight: 600; color: #111827; }
.message { font-size: 0.82rem; color: #4b5563; }
.time { font-size: 0.75rem; color: #9ca3af; }
.item-remove { background: none; border: none; color: #9ca3af; cursor: pointer; padding: 10px 12px; font-size: 0.85rem; }
.item-remove:hover { color: #ef4444; }
.empty { margin: 0; padding: 28px 16px; text-align: center; color: #6b7280; font-size: 0.85rem; }
</style>