<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="handleClose"
    title="匹配对战"
    width="400px"
    :close-on-click-modal="false"
    :show-close="!isMatching"
  >
    <div class="text-center">
      <div v-if="isMatching" class="mb-6">
        <div class="w-24 h-24 mx-auto mb-4 text-primary animate-swim">
          <div class="text-2xl font-bold">{{ estimatedTime }}s</div>
          <div class="text-sm text-gray-500">预计等待时间</div>
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
          :disabled="loading"
        >
          {{ loading ? '请稍候...' : '开始匹配' }}
        </button>
        <button 
          v-else
          class="btn btn-secondary w-32"
          @click="cancelMatching"
          :disabled="loading"
        >
          {{ loading ? '请稍候...' : '取消匹配' }}
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useMatchStore } from '@/stores/match'

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:visible'])
const matchStore = useMatchStore()

const isMatching = ref(false)
const waitTime = ref(0)
const loading = ref(false)
const estimatedTime = ref(30)
let timer = null

const startMatching = async () => {
  try {
    loading.value = true
    const response = await matchStore.startMatch()
    if (response.code === 200) {
      isMatching.value = true
      waitTime.value = 0
      estimatedTime.value = response.data.estimatedTime || 30
      startTimer()
      ElMessage.success('开始匹配')
    }
  } catch (error) {
    console.error('Start matching failed:', error)
  } finally {
    loading.value = false
  }
}

const cancelMatching = async () => {
  try {
    loading.value = true
    await matchStore.cancelMatch()
    stopMatching()
    ElMessage.success('已取消匹配')
  } catch (error) {
    console.error('Cancel matching failed:', error)
  } finally {
    loading.value = false
  }
}

const handleClose = (val) => {
  if (isMatching.value) {
    ElMessage.warning('请先取消匹配')
    return
  }
  emit('update:visible', val)
}

const startTimer = () => {
  timer = setInterval(() => {
    waitTime.value++
  }, 1000)
}

const stopMatching = () => {
  isMatching.value = false
  clearInterval(timer)
  waitTime.value = 0
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