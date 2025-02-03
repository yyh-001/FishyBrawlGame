import { ref, computed, onMounted, onUnmounted } from 'vue'
import { GAME_CONFIG } from '@/config/gameConfig'
import { useGameStore } from '@/stores/game'

const gameStore = useGameStore()
const timeLimit = computed(() => GAME_CONFIG.TIME_LIMITS.HERO_SELECTION)
const timeRemaining = ref(timeLimit.value)

// 倒计时逻辑
let timer = null

onMounted(() => {
  timeRemaining.value = timeLimit.value
  timer = setInterval(() => {
    if (timeRemaining.value > 0) {
      timeRemaining.value--
    } else {
      clearInterval(timer)
    }
  }, 1000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<template>
  <div class="hero-selection">
    <!-- ... 其他模板内容 ... -->
    <div class="timer">
      剩余时间: {{ timeRemaining }}秒
    </div>
    <!-- ... 其他模板内容 ... -->
  </div>
</template> 