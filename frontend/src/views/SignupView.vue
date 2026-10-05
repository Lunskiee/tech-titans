<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '../components/AuthLayout.vue'
import signupImg from '../assets/image_1.png'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const errorMessage = ref('')
const loading = ref(false)

const togglePassword = () => {
  showPassword.value = !showPassword.value
}

// Password strength: only the 8 character minimum is required, the rest is guidance
const strength = computed(() => {
  const p = password.value
  if (!p) return { level: 0, label: '' }
  let score = 0
  if (p.length >= 8) score++
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) score++
  if (/\d/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++
  if (p.length < 8) return { level: 1, label: 'Too short' }
  if (score <= 2) return { level: 2, label: 'Okay' }
  return { level: 3, label: 'Strong' }
})

const passwordsMismatch = computed(
  () => confirmPassword.value !== '' && confirmPassword.value !== password.value
)

const handleSignup = async () => {
  errorMessage.value = ''

  if (password.value.length < 8) {
    errorMessage.value = 'Password must be at least 8 characters.'
    return
  }
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match.'
    return
  }

  loading.value = true
  const result = await auth.register({
    fullName: name.value,
    email: email.value,
    password: password.value
  })

  if (!result.ok) {
    loading.value = false
    errorMessage.value = result.error
    return
  }

  // Account created: sign in right away so the new user lands inside the app
  const login = await auth.login(email.value, password.value)
  loading.value = false
  router.push(login.ok ? '/products' : '/login')
}
</script>

<template>
  <AuthLayout>
    <template #illustration>
      <img :src="signupImg" alt="Warehouse Signup Illustration" class="illustration-image" />
    </template>

    <template #default>
      <div class="signup-header">
        <h2 class="title">Create an Account</h2>
        <p class="subtitle">It only takes a minute to get started</p>
      </div>

      <form @submit.prevent="handleSignup" class="auth-form" data-testid="signup-form">
        <p v-if="errorMessage" class="form-error" role="alert" data-testid="signup-error">{{ errorMessage }}</p>

        <div class="input-group">
          <label for="name">Name</label>
          <input 
            id="name" 
            v-model="name" 
            type="text" 
            placeholder="Enter Name" 
            autocomplete="name"
            required 
            data-testid="signup-name-input"
          />
        </div>

        <div class="input-group">
          <label for="email">Email</label>
          <input 
            id="email" 
            v-model="email" 
            type="email" 
            placeholder="Enter Email" 
            autocomplete="email"
            required 
            data-testid="signup-email-input"
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
              autocomplete="new-password"
              required 
              data-testid="signup-password-input"
            />
            <button 
              type="button" 
              class="eye-button" 
              @click="togglePassword"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              data-testid="signup-toggle-password-button"
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

          <!-- Strength meter -->
          <div v-if="password" class="strength" data-testid="signup-password-strength">
            <div class="strength-bars">
              <span :class="{ on: strength.level >= 1 }" :data-level="strength.level"></span>
              <span :class="{ on: strength.level >= 2 }" :data-level="strength.level"></span>
              <span :class="{ on: strength.level >= 3 }" :data-level="strength.level"></span>
            </div>
            <small :class="`level-${strength.level}`">{{ strength.label }}</small>
          </div>
          <small v-else class="hint">Use at least 8 characters.</small>
        </div>

        <div class="input-group">
          <label for="confirmPassword">Confirm Password</label>
          <input 
            id="confirmPassword" 
            v-model="confirmPassword" 
            :type="showPassword ? 'text' : 'password'" 
            placeholder="Re-enter Password" 
            autocomplete="new-password"
            :class="{ invalid: passwordsMismatch }"
            required 
            data-testid="signup-confirm-password-input"
          />
          <small v-if="passwordsMismatch" class="field-error" data-testid="signup-mismatch">Passwords do not match.</small>
        </div>

        <button 
          type="submit" 
          class="auth-button"
          :disabled="loading"
          data-testid="signup-submit-button"
        >
          {{ loading ? 'Creating account...' : 'Sign Up' }}
        </button>
      </form>

      <div class="footer-link">
        You have an account? 
        <router-link to="/login" data-testid="signup-login-link">Sign In here</router-link>
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

.signup-header {
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

/* Password strength + hints */
.hint {
  font-size: 12px;
  color: #a0aec0;
}

.field-error {
  font-size: 12px;
  font-weight: 500;
  color: #b91c1c;
}

.strength {
  display: flex;
  align-items: center;
  gap: 10px;
}

.strength-bars {
  display: flex;
  gap: 4px;
  flex: 1;
}

.strength-bars span {
  height: 4px;
  flex: 1;
  border-radius: 2px;
  background-color: #e2e8f0;
  transition: background-color 0.2s ease;
}

.strength-bars span.on[data-level="1"] { background-color: #ef4444; }
.strength-bars span.on[data-level="2"] { background-color: #f59e0b; }
.strength-bars span.on[data-level="3"] { background-color: #22c55e; }

.strength small { font-size: 12px; font-weight: 600; }
.level-1 { color: #ef4444; }
.level-2 { color: #d97706; }
.level-3 { color: #16a34a; }

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

.auth-button:hover:not(:disabled) {
  background-color: #54598a;
}

.auth-button:disabled {
  opacity: 0.7;
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