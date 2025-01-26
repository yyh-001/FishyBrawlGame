<template>
  <transition
    name="page"
    mode="out-in"
    @before-leave="beforeLeave"
    @enter="enter"
    @after-enter="afterEnter"
  >
    <slot></slot>
  </transition>
</template>

<script setup>
const beforeLeave = (el) => {
  el.style.height = el.offsetHeight + 'px'
}

const enter = (el) => {
  el.style.height = 'auto'
  const height = el.offsetHeight
  el.style.height = '0'
  // 触发重绘
  el.offsetHeight
  el.style.height = height + 'px'
}

const afterEnter = (el) => {
  el.style.height = null
}
</script>

<style lang="scss" scoped>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
  transform-origin: center top;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.page-enter-active {
  transition-delay: 0.1s;
}
</style> 