<script setup>
import { ref, computed } from 'vue'
import AuthLayout from '../components/AuthLayout.vue'
import warehouseImg from '../assets/image_0.png'
import { useAuthStore } from '../stores/auth'
import { rememberPassword } from '../utils/credentials'

const auth = useAuthStore()

const step = ref('email') // 'email' | 'reset' | 'done'
const email = ref('')
const code = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirm = ref(false)
const errorMessage = ref('')
const loading = ref(false)

// Demo only: no email server, so the code is shown on screen
const demoCode = ref('')
const demoMinutes = ref(10)

const passwordsMismatch = computed(
  () => confirmPassword.value !== '' && confirmPassword.value !== newPassword.value
)

const togglePassword = () => {
  showPassword.value = !showPassword.value
}

const toggleConfirm = () => {
  showConfirm.value = !showConfirm.value
}

const sendCode = async () => {
  errorMessage.value = ''
  loading.value = true
  try {
    const result = await auth.requestPasswordReset(email.value)
    if (!result.ok) {
      errorMessage.value = result.error
      return
    }
    demoCode.value = result.code
    demoMinutes.value = result.minutes
    code.value = ''
    step.value = 'reset'
  } catch {
    errorMessage.value = 'Something went wrong. Please try again.'
  } finally {
    loading.value = false
  }
}

const submitReset = async () => {
  errorMessage.value = ''

  if (newPassword.value.length < 8) {
    errorMessage.value = 'New password must be at least 8 characters.'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match.'
    return
  }

  loading.value = true
  try {
    const result = await auth.resetPassword(email.value, code.value, newPassword.value)
    if (!result.ok) {
      errorMessage.value = result.error
      return
    }
    // Ask the browser's password manager to update the saved password right away
    rememberPassword({ email: email.value, password: newPassword.value })
    step.value = 'done'
  } catch {
    errorMessage.value = 'Something went wrong. Please try again.'
  } finally {
    loading.value = false
  }
}

const useDifferentEmail = () => {
  errorMessage.value = ''
  demoCode.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  step.value = 'email'
}
</script>

<template>
  <AuthLayout>
    <template #illustration>
      <img :src="warehouseImg" alt="Warehouse Illustration" class="illustration-image" />
    </template>

    <template #default>
      <!-- Step 1: enter email -->
      <template v-if="step === 'email'">
        <div class="page-header">
          <h2 class="title">Forgot Password?</h2>
          <p class="subtitle">Enter your email and we'll help you reset it</p>
        </div>

        <form @submit.prevent="sendCode" class="auth-form" data-testid="forgot-form">
          <p v-if="errorMessage" class="form-error" role="alert" data-testid="forgot-error">{{ errorMessage }}</p>

          <div class="input-group">
            <label for="email">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="Enter Email"
              autocomplete="email"
              required
              data-testid="forgot-email-input"
            />
          </div>

          <button type="submit" class="auth-button" :disabled="loading" data-testid="forgot-submit-button">
            {{ loading ? 'Checking...' : 'Send Reset Code' }}
          </button>
        </form>
      </template>

      <!-- Step 2: enter code and new password -->
      <template v-else-if="step === 'reset'">
        <div class="page-header">
          <h2 class="title">Reset Password</h2>
          <p class="subtitle">Enter the code and choose a new password</p>
        </div>

        <div class="demo-box" data-testid="forgot-demo-code">
          <strong>Demo mode:</strong> no email is sent. Your reset code is
          <span class="demo-code">{{ demoCode }}</span>
          <small>It works for {{ demoMinutes }} minutes.</small>
        </div>

        <form @submit.prevent="submitReset" class="auth-form" data-testid="reset-form">
          <p v-if="errorMessage" class="form-error" role="alert" data-testid="reset-error">{{ errorMessage }}</p>

          <div class="input-group">
            <label for="code">Reset Code</label>
            <input
              id="code"
              v-model="code"
              type="text"
              inputmode="numeric"
              maxlength="6"
              placeholder="6-digit code"
              autocomplete="one-time-code"
              required
              data-testid="reset-code-input"
            />
          </div>

          <div class="input-group">
            <label for="newPassword">New Password</label>
            <div class="password-wrapper">
              <input
                id="newPassword"
                v-model="newPassword"
                :type="showPassword ? 'text' : 'password'"
                placeholder="At least 8 characters"
                autocomplete="new-password"
                required
                data-testid="reset-password-input"
              />
              <button
                type="button"
                class="eye-button"
                @click="togglePassword"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                data-testid="reset-toggle-password-button"
              >
                <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                  <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                  <line x1="2" x2="22" y1="2" y2="22" />
                </svg>
              </button>
            </div>
          </div>

          <div class="input-group">
            <label for="confirmPassword">Confirm New Password</label>
            <div class="password-wrapper">
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              :type="showConfirm ? 'text' : 'password'"
              placeholder="Re-enter Password"
              autocomplete="new-password"
              :class="{ invalid: passwordsMismatch }"
              required
              data-testid="reset-confirm-input"
            />
            <button
              type="button"
              class="eye-button"
              @click="toggleConfirm"
              :aria-label="showConfirm ? 'Hide password' : 'Show password'"
              data-testid="reset-toggle-confirm-button"
            >
              <svg v-if="showConfirm" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                <line x1="2" x2="22" y1="2" y2="22" />
              </svg>
            </button>
          </div>
            <small v-if="passwordsMismatch" class="field-error">Passwords do not match.</small>
          </div>

          <button type="submit" class="auth-button" :disabled="loading" data-testid="reset-submit-button">
            {{ loading ? 'Updating...' : 'Reset Password' }}
          </button>

          <div class="link-row">
            <button type="button" class="text-link" @click="sendCode" :disabled="loading" data-testid="reset-resend-button">Send a new code</button>
            <button type="button" class="text-link" @click="useDifferentEmail" data-testid="reset-change-email-button">Use a different email</button>
          </div>
        </form>
      </template>

      <!-- Step 3: done -->
      <template v-else>
        <div class="page-header">
          <h2 class="title">Password Updated</h2>
          <p class="subtitle">You can now log in with your new password.</p>
        </div>

        <router-link
          :to="{ path: '/login', query: { email, reset: '1' } }"
          class="auth-button as-link"
          data-testid="reset-login-link"
        >Back to Log In</router-link>
      </template>

      <div v-if="step !== 'done'" class="footer-link">
        Remembered it?
        <router-link to="/login" data-testid="forgot-login-link">Back to Log In</router-link>
      </div>
    </template>
  </AuthLayout>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Commissioner:wght@400;500;600;700&display=swap');

* {
  font-family: 'Commissioner', sans-serif;
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

.page-header {
  text-align: left;
  margin-top: -16px;
  margin-bottom: 22px;
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

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-error {
  margin: 0;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 500;
  color: #b91c1c;
  background-color: #fef2f2;
  border: 1px solid #fca5a5;
  border-radius: 8px;
}

.demo-box {
  margin-bottom: 16px;
  padding: 10px 12px;
  font-size: 13px;
  color: #1e3a8a;
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.demo-code {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 3px;
  color: #1F2344;
}

.demo-box small {
  flex-basis: 100%;
  color: #475569;
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
  padding: 0 42px 0 16px;
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

.input-group input.invalid {
  border-color: #ef4444;
}

.field-error {
  font-size: 12px;
  font-weight: 500;
  color: #b91c1c;
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

.auth-button.as-link {
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  box-sizing: border-box;
}

.auth-button:hover:not(:disabled) {
  background-color: #54598a;
}

.auth-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.link-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.text-link {
  background: none;
  border: none;
  padding: 0;
  font-size: 13px;
  font-weight: 600;
  color: #4c51bf;
  cursor: pointer;
}

.text-link:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

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