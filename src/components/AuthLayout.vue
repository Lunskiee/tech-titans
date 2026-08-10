<script setup>
import logoSvg from '../assets/logo.svg'
</script>

<template>
  <div class="auth-container">
    <!-- Left Side -->
    <div class="left-panel">
      <div class="top-bar">
        <img :src="logoSvg" alt="VAULTO Logo" class="brand-logo-img" />
      </div>
      
      <!-- Illustration Area -->
      <div class="illustration-box">
        <slot name="illustration"></slot>
      </div>

      <!-- Bottom Purple Bar -->
      <div class="bottom-bar"></div>
    </div>

    <!-- Right Side (Form) -->
    <div class="right-panel">
      <div class="form-wrapper">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-container {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: #ffffff;
}

/* Left Panel Container */
.left-panel {
  width: 60%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #656BA1;
}

/* Top Header */
.top-bar {
  height: 55px;
  padding: 0 35px;
  display: flex;
  align-items: center;
  background-color: #656BA1;
  flex-shrink: 0;
}

/* Logo Image Styling */
.brand-logo-img {
  height: 38px;
  width: auto;
  display: block;
}

/* Middle Light Box */
.illustration-box {
  flex: 1;
  background-color: #f2f4f8; 
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

:deep(.illustration-box img) {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* Bottom Purple Footer Bar */
.bottom-bar {
  height: 70px;
  background-color: #656BA1;
  flex-shrink: 0;
}

/* Right Panel Form Container */
.right-panel {
  width: 40%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-wrapper {
  width: 100%;
  max-width: 380px;
  padding: 0 20px;
}
</style>