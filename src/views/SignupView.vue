<script setup>
import { ref } from 'vue'
import AuthLayout from '../components/AuthLayout.vue'
import signupImg from '../assets/image_1.png'

const name = ref('')
const email = ref('')
const password = ref('')
const showPassword = ref(false)

const togglePassword = () => {
  showPassword.value = !showPassword.value
}

const handleSignup = () => {
  console.log('Signing up...', name.value, email.value)
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
      </div>

      <form @submit.prevent="handleSignup" class="auth-form">
        <div class="input-group">
          <label for="name">Name</label>
          <input 
            id="name" 
            v-model="name" 
            type="text" 
            placeholder="Enter Name" 
            required 
          />
        </div>

        <div class="input-group">
          <label for="email">Email</label>
          <input 
            id="email" 
            v-model="email" 
            type="email" 
            placeholder="Enter Email" 
            required 
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
            />
            <button 
              type="button" 
              class="eye-button" 
              @click="togglePassword"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
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

        <button type="submit" class="auth-button">Sign Up</button>
      </form>

      <div class="footer-link">
        You have an account? <router-link to="/login">Sign In here</router-link>
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

/* Header Section */
.signup-header {
  text-align: left;
  margin-top: -16px;
  margin-bottom: 28px;
}

.title {
  font-size: 32px;
  font-weight: 700;
  color: #1F2344;
  margin: 0;
  line-height: 1.1;
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

/* Footer Link */
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