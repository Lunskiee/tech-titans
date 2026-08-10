import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// IMPORTANT: Import your CSS file here so Vite bundles it globally
import './assets/auth-styles.css'

const app = createApp(App)
app.use(router)
app.mount('#app')