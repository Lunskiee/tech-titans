<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '../components/AuthLayout.vue'
import illustrationImg from '../assets/image_0.png'

const router = useRouter()

const email = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)

const handleResetPassword = async () => {
  if (newPassword.value !== confirmPassword.value) {
    alert('Passwords do not match!')
    return
  }

  isLoading.value = true
  try {
    alert('Password updated successfully!')
    router.push('/login')
  } catch (error) {
    alert('Failed to reset password. Please try again.')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <AuthLayout>
    <template #illustration>
      <img :src="illustrationImg" alt="Vaulto Inventory Illustration" />
    </template>

    <div class="auth-card">
      <h2 class="auth-title">Reset Password</h2>
      <p class="auth-subtitle">
        Enter your registered email and choose a new password for your account.
      </p>

      <form @submit.prevent="handleResetPassword" class="auth-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            placeholder="Enter Email"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="newPassword">New Password</label>
          <input
            id="newPassword"
            v-model="newPassword"
            type="password"
            required
            placeholder="Enter New Password"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            required
            placeholder="Confirm New Password"
            class="form-input"
          />
        </div>

        <button type="submit" :disabled="isLoading" class="btn-primary">
          {{ isLoading ? 'Resetting...' : 'Reset Password' }}
        </button>
      </form>

      <div class="auth-footer">
        <span>Back to </span>
        <router-link to="/login" class="auth-link">Sign In here</router-link>
      </div>
    </div>
  </AuthLayout>
</template>

<style scoped>
@import '../assets/auth-styles.css';

.auth-card {
  width: 100%;
}

.auth-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.auth-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: #f3f4f6;
  border: 1px solid transparent;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  outline: none;
  transition: all 0.2s ease;
}

.form-input:focus {
  background-color: #ffffff;
  border-color: #656ba1;
}

.btn-primary {
  width: 100%;
  padding: 0.75rem;
  background-color: #656ba1;
  color: #ffffff;
  font-weight: 600;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  margin-top: 0.5rem;
  transition: background-color 0.2s ease;
}

.btn-primary:hover {
  background-color: #525785;
}

.auth-footer {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.875rem;
  color: #6b7280;
}

.auth-link {
  color: #656ba1;
  font-weight: 600;
  text-decoration: none;
}

.auth-link:hover {
  text-decoration: underline;
}
</style>