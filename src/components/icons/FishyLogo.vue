<template>
  <svg class="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- 鱼身 -->
    <path 
      d="M160 100C160 120 140 150 100 150C60 150 40 120 40 100C40 80 60 50 100 50C140 50 160 80 160 100Z" 
      class="fill-current"
      opacity="0.9"
    />
    <!-- 鱼尾 -->
    <path 
      d="M40 100C40 100 20 80 30 60C30 60 40 80 40 100C40 120 30 140 30 140C20 120 40 100 40 100Z" 
      class="fill-current"
      opacity="0.8"
    />
    <!-- 鱼鳍 -->
    <path 
      d="M100 50C100 50 120 30 140 40C140 40 120 50 100 50Z" 
      class="fill-current"
      opacity="0.8"
    />
    <path 
      d="M100 150C100 150 120 170 140 160C140 160 120 150 100 150Z" 
      class="fill-current"
      opacity="0.8"
    />
    <!-- 鱼眼 -->
    <circle cx="120" cy="100" r="10" class="fill-current" opacity="0.95" />
    <circle cx="123" cy="97" r="3" fill="white" opacity="0.9" />
  </svg>
</template>

<script setup>
// 添加动画效果
const props = defineProps({
  animate: {
    type: Boolean,
    default: true
  }
})
</script>

<style scoped>
svg {
  filter: drop-shadow(0 0 8px currentColor);
}

@keyframes swim {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(5px); }
}

.animate-swim {
  animation: swim 3s ease-in-out infinite;
}
</style> 