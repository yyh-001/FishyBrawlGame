<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="handleClose"
    title="匹配对战"
    :width="isMobile ? '90%' : '400px'"
    :close-on-click-modal="false"
    :show-close="!isMatching"
    class="matchmaking-dialog"
  >
    <div class="text-center">
      <div v-if="isMatching" class="mb-6">
        <div class="matching-animation mb-4">
          <div class="spinner">
            <div class="double-bounce1"></div>
            <div class="double-bounce2"></div>
          </div>
          <div class="text-lg font-bold text-primary mt-2">
            {{ estimatedTime }}s
          </div>
          <div class="text-sm text-gray-500">预计等待时间</div>
        </div>
        <p class="text-lg font-medium text-primary mb-2">正在匹配对手...</p>
        <p class="text-sm text-gray-500">
          已等待 {{ formatTime(waitTime) }}
        </p>
      </div>
      <div v-else>
        <p class="text-lg text-primary mb-4">
          房间内所有玩家已准备完成
        </p>
        <p class="text-sm text-gray-500 mb-6">
          即将开始匹配对手...
        </p>
      </div>
    </div>
    <template #footer>
      <div class="flex justify-center">
        <button 
          v-if="isMatching"
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
import { ref, onUnmounted, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useMatchStore } from '@/stores/match'
import { useRouter } from 'vue-router'

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  roomId: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:visible'])
const matchStore = useMatchStore()
const router = useRouter()

const isMatching = ref(false)
const waitTime = ref(0)
const loading = ref(false)
const estimatedTime = ref(30)
let timer = null

// 添加移动端检测
const isMobile = computed(() => window.innerWidth <= 768)

// 开始匹配
const startMatching = async () => {
  try {
    loading.value = true
    const response = await matchStore.startMatch(props.roomId)
    if (response.code === 200) {
      isMatching.value = true
      waitTime.value = 0
      estimatedTime.value = response.data?.estimatedTime || 30
      startTimer()
      ElMessage.success('开始匹配')
    }
  } catch (error) {
    console.error('Start matching failed:', error)
    ElMessage.error(error.message || '开始匹配失败')
    emit('update:visible', false)
  } finally {
    loading.value = false
  }
}

// 取消匹配
const cancelMatching = async () => {
  try {
    loading.value = true
    await matchStore.cancelMatch()
    stopMatching()
    ElMessage.success('已取消匹配')
  } catch (error) {
    console.error('Cancel matching failed:', error)
    ElMessage.error(error.message || '取消匹配失败')
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

// 当弹窗显示时自动开始匹配
watch(() => props.visible, (val) => {
  if (val) {
    startMatching()
  }
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.matching-animation {
  position: relative;
  width: 100px;
  height: 100px;
  margin: 0 auto;
}

.spinner {
  width: 100%;
  height: 100%;
  position: relative;
  margin: 0 auto;
}

.double-bounce1, .double-bounce2 {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: var(--primary-color);
  opacity: 0.6;
  position: absolute;
  top: 0;
  left: 0;
  animation: sk-bounce 2.0s infinite ease-in-out;
}

.double-bounce2 {
  animation-delay: -1.0s;
}

@keyframes sk-bounce {
  0%, 100% { 
    transform: scale(0.0);
  } 50% { 
    transform: scale(1.0);
  }
}

/* 移动端样式优化 */
@media (max-width: 768px) {
  .matchmaking-dialog :deep(.el-dialog) {
    margin: 20vh auto !important;
  }

  .matchmaking-dialog :deep(.el-dialog__body) {
    padding: 1rem !important;
  }
}
</style> 