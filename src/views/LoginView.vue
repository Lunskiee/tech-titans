<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '../components/AuthLayout.vue'
import warehouseImg from '../assets/image_0.png'

const router = useRouter()

const email = ref('')
const password = ref('')
const showPassword = ref(false)

const togglePassword = () => {
  showPassword.value = !showPassword.value
}

const handleLogin = () => {
  console.log('Logging in...', email.value)
  // Redirect to the products dashboard upon login
  router.push('/products')
}
</script>

<template>
  <AuthLayout>
    <template #illustration>
      <img :src="warehouseImg" alt="Warehouse Login Illustration" class="illustration-image" />
    </template>

    <template #default>
      <div class="login-header">
        <h2 class="title">Welcome!</h2>
        <p class="subtitle">Please enter your login details below</p>
      </div>

      <form @submit.prevent="handleLogin" class="auth-form" data-testid="login-form">
        <div class="input-group">
          <label for="email">Email</label>
          <input 
            id="email" 
            v-model="email" 
            type="email" 
            placeholder="Enter Email" 
            required 
            data-testid="login-email-input"
          />
        </div>

        <div class="input-group">
          <label for="password">Password</label>
          <div class="password-wrapper">
            <input 
              id="password" 
              v-model="password" 
              :type="showPassword ? 'text' : 'password'" 
              placeholder="Enter Password" 
              required 
              data-testid="login-password-input"
            />
            <button 
              type="button" 
              class="eye-button" 
              @click="togglePassword"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              data-testid="login-toggle-password-button"
            >
              <!-- Open Eye (Shown when password IS visible) -->
              <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <!-- Eye Off / Slashed Icon (Shown when password IS hidden) -->
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                <line x1="2" x2="22" y1="2" y2="22" />
              </svg>
            </button>
          </div>
        </div>

        <div class="form-actions">
          <router-link 
            to="/forgot-password" 
            class="forgot-password"
            data-testid="login-forgot-password-link"
          >
            Forgot Password?
          </router-link>
        </div>

        <button 
          type="submit" 
          class="auth-button"
          data-testid="login-submit-button"
        >
          Log In
        </button>
      </form>

      <div class="footer-link">
        Don't have an account yet? 
        <router-link 
          to="/signup"
          data-testid="login-signup-link"
        >
          Sign Up here
        </router-link>
      </div>
    </template>
  </AuthLayout>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Commissioner:wght@400;500;600;700&display=swap');

* {
  font-family: 'Commissioner', sans-serif;
}

.brand-text {
  color: #D8DAF9;
}

:deep(.illustration-container),
:deep(.illustration-wrapper),
:deep([class*="illustration"]) {
  padding: 0 !important;
  margin: 0 !important;
  width: 100% !important;
}

.illustration-image {
  width: 100% !important;
  height: auto !important;
  display: block !important;
  object-fit: cover !important;
}

.login-header {
  text-align: left;
  margin-top: -16px;
  margin-bottom: 28px;
}

.brand-logo {
  height: 40px;
  width: auto;
  margin-bottom: 16px;
  display: block;
}

.title {
  font-size: 32px;
  font-weight: 700;
  color: #1F2344;
  margin: 0 0 4px 0;
  line-height: 1.1;
}

.subtitle {
  font-size: 14px;
  font-weight: 400;
  color: #6b7280;
  margin: 0;
}

/* Form Layout */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.input-group label {
  font-size: 14px;
  font-weight: 500;
  color: #1F2344;
}

.password-wrapper {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
}

.input-group input {
  width: 100%;
  height: 44px;
  padding: 0 42px 0 16px; /* Right padding reserved for eye button */
  font-size: 14px;
  color: #1F2344;
  border: 1px solid #cdd1dc;
  border-radius: 10px;
  background-color: #f2f4f7;
  box-sizing: border-box;
  outline: none;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

.input-group input::placeholder {
  color: #a0aec0;
}

.input-group input:focus {
  border-color: #656ba1;
  background-color: #ffffff;
}

.eye-button {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #718096;
  transition: color 0.2s ease;
}

.eye-button:hover {
  color: #1F2344;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: -2px;
  margin-bottom: 2px;
}

.forgot-password {
  font-size: 13px;
  font-weight: 600;
  color: #4c51bf;
  text-decoration: none;
}

.auth-button {
  width: 100%;
  height: 48px;
  margin-top: 6px;
  font-size: 16px;
  font-weight: 600;
  background-color: #656ba1;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.auth-button:hover {
  background-color: #54598a;
}

/* Footer Link Space */
.footer-link {
  text-align: center;
  margin-top: 20px;
  font-size: 13px;
  color: #a0aec0;
}

.footer-link a {
  color: #4c51bf;
  font-weight: 600;
  text-decoration: none;
}
</style>