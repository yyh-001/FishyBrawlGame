<script setup>
import { useThemeStore } from '@/stores/theme'
import GlobalLoading from '@/components/common/GlobalLoading.vue'
import NetworkStatus from '@/components/common/NetworkStatus.vue'

const themeStore = useThemeStore()
</script>

<template>
  <div class="min-h-screen w-full overflow-hidden" :data-theme="themeStore.theme">
    <NetworkStatus />
    <GlobalLoading />
    <router-view></router-view>
  </div>
</template>

<style>
/* 重置默认样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 修复滚动条导致的宽度问题 */
:root {
  overflow-y: auto;
  overflow-x: hidden;
}

:root body {
  position: absolute;
  width: 100%;
  overflow: hidden;
}

html, body {
  margin: 0;
  padding: 0;
  min-height: 100vh;
  max-width: 100vw;
  overflow: hidden;
}

#app {
  position: relative;
  min-height: 100vh;
  width: 100vw;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 确保所有直接子元素也是全宽的 */
#app > * {
  width: 100vw;
  max-width: 100vw;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}

/* 移除任何可能的滚动条 */
::-webkit-scrollbar {
  display: none;
}

* {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
