<template>
  <div v-if="loadingStore.isLoading" class="global-loading">
    <div class="loading-content">
      <el-icon class="loading-icon"><Loading /></el-icon>
      <span class="loading-text">{{ loadingStore.loadingText }}</span>
    </div>
  </div>
</template>

<script setup>
import { useLoadingStore } from '@/stores/loading'
import { Loading } from '@element-plus/icons-vue'

const loadingStore = useLoadingStore()
</script>

<style lang="scss" scoped>
.global-loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(2px);

  .loading-content {
    background: var(--bg-primary);
    padding: 2rem;
    border-radius: 0.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  }

  .loading-icon {
    font-size: 2rem;
    color: var(--primary-color);
    animation: spin 1s linear infinite;
  }

  .loading-text {
    color: var(--text-secondary);
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
}
</style> 