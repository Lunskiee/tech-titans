<script setup>
import logoSvg from '../assets/logo.svg'
</script>

<template>
  <div class="auth-container">
    <div class="left-panel">
      <div class="top-bar">
        <img :src="logoSvg" alt="VAULTO Logo" class="brand-logo-img" />
      </div>
      
      <div class="illustration-box">
        <slot name="illustration"></slot>
      </div>

      <div class="bottom-bar"></div>
    </div>

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

.left-panel {
  width: 60%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #656BA1;
}

.top-bar {
  height: 55px;
  padding: 0 35px;
  display: flex;
  align-items: center;
  background-color: #656BA1;
  flex-shrink: 0;
}

.brand-logo-img {
  height: 38px;
  width: auto;
  display: block;
}

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

.bottom-bar {
  height: 70px;
  background-color: #656BA1;
  flex-shrink: 0;
}

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