<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="匹配对战"
    width="400px"
    :close-on-click-modal="false"
    :show-close="!isMatching"
  >
    <div class="text-center">
      <div v-if="isMatching" class="mb-6">
        <div class="w-24 h-24 mx-auto mb-4 text-primary animate-swim">
          <FishyLogo />
        </div>
        <p class="text-text-secondary mb-2">正在寻找对手...</p>
        <p class="text-text-secondary text-sm">
          已等待 {{ formatTime(waitTime) }}
        </p>
      </div>
      <div v-else>
        <p class="text-text-secondary mb-6">
          准备好开始一场新的对战了吗？
        </p>
      </div>
    </div>
    <template #footer>
      <div class="flex justify-center">
        <button 
          v-if="!isMatching"
          class="btn btn-primary w-32"
          @click="startMatching"
        >
          开始匹配
        </button>
        <button 
          v-else
          class="btn btn-secondary w-32"
          @click="cancelMatching"
        >
          取消匹配
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import FishyLogo from '@/components/icons/FishyLogo.vue'

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:visible'])

const isMatching = ref(false)
const waitTime = ref(0)
let timer = null

const startMatching = () => {
  isMatching.value = true
  waitTime.value = 0
  timer = setInterval(() => {
    waitTime.value++
  }, 1000)
}

const cancelMatching = () => {
  isMatching.value = false
  clearInterval(timer)
  emit('update:visible', false)
}

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script> 