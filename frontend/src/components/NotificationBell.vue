<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '../stores/notifications'

const router = useRouter()
const store = useNotificationStore()

const open = ref(false)
const root = ref(null)

const toggle = () => {
  open.value = !open.value
}

const timeAgo = (ts) => {
  const mins = Math.floor((Date.now() - ts) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  const days = Math.floor(hrs / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

// Clicking a notification marks it read and opens the page it points to
const openItem = (n) => {
  store.markRead(n.id)
  open.value = false
  if (n.to) router.push(n.to)
}

// Close the panel when clicking anywhere outside it
const onClickOutside = (e) => {
  if (root.value && !root.value.contains(e.target)) open.value = false
}
onMounted(() => document.addEventListener('click', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))
</script>

<template>
  <div ref="root" class="bell-wrap">
    <button
      class="bell-btn"
      @click="toggle"
      aria-label="Notifications"
      data-testid="notification-bell"
    >
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
        <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22zm7-6V11a7 7 0 0 0-5.5-6.84V3.5a1.5 1.5 0 0 0-3 0v.66A7 7 0 0 0 5 11v5l-2 2v1h18v-1l-2-2z" />
      </svg>
      <span v-if="store.unreadCount > 0" class="badge" data-testid="notification-badge">
        {{ store.unreadCount > 9 ? '9+' : store.unreadCount }}
      </span>
    </button>

    <div v-if="open" class="panel" data-testid="notification-panel">
      <div class="panel-header">
        <strong>Notifications</strong>
        <div class="header-actions">
          <button v-if="store.unreadCount > 0" class="link" @click="store.markAllRead()">Mark all read</button>
          <button v-if="store.items.length" class="link danger" @click="store.clearAll()">Clear all</button>
        </div>
      </div>

      <ul class="list">
        <li
          v-for="n in store.items"
          :key="n.id"
          class="item"
          :class="{ unread: !n.read }"
          @click="openItem(n)"
          data-testid="notification-item"
        >
          <span v-if="!n.read" class="dot"></span>
          <div class="body">
            <p class="title">{{ n.title }}</p>
            <p class="message">{{ n.message }}</p>
            <p class="time">{{ timeAgo(n.createdAt) }}</p>
          </div>
          <button class="remove" @click.stop="store.remove(n.id)" aria-label="Dismiss">✕</button>
        </li>

        <li v-if="store.items.length === 0" class="empty">You're all caught up.</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.bell-wrap { position: relative; display: flex; align-items: center; }

.bell-btn { position: relative; background: none; border: none; cursor: pointer; padding: 4px; color: #fbbf24; display: flex; align-items: center; }
.bell-btn:hover { color: #fcd34d; }

.badge { position: absolute; top: -4px; right: -6px; min-width: 18px; height: 18px; padding: 0 4px; box-sizing: border-box; border-radius: 999px; background: #ef4444; color: #fff; font-size: 0.7rem; font-weight: 700; display: flex; align-items: center; justify-content: center; }

.panel { position: absolute; top: 140%; right: 0; width: 340px; background: #fff; color: #111827; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18); z-index: 100; overflow: hidden; }
.panel-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 0.9rem; }
.header-actions { display: flex; gap: 12px; }
.link { background: none; border: none; color: #4338ca; font-size: 0.8rem; font-weight: 600; cursor: pointer; padding: 0; }
.link.danger { color: #dc2626; }

.list { list-style: none; margin: 0; padding: 0; max-height: 360px; overflow-y: auto; }
.item { display: flex; align-items: flex-start; gap: 10px; padding: 12px 16px; border-bottom: 1px solid #f3f4f6; cursor: pointer; }
.item:hover { background: #f9fafb; }
.item.unread { background: #eef2ff; }
.dot { width: 8px; height: 8px; margin-top: 6px; border-radius: 50%; background: #4338ca; flex-shrink: 0; }
.body { flex: 1; min-width: 0; }
.title { margin: 0; font-size: 0.85rem; font-weight: 600; color: #111827; }
.message { margin: 2px 0 0; font-size: 0.8rem; color: #374151; }
.time { margin: 4px 0 0; font-size: 0.72rem; color: #9ca3af; }
.remove { background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 0.85rem; }
.remove:hover { color: #dc2626; }
.empty { padding: 28px 16px; text-align: center; color: #6b7280; font-size: 0.85rem; font-style: italic; }
</style>