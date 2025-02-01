<template>
  <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center">
    <!-- 背景遮罩 -->
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="handleBackdropClick"></div>
    
    <!-- 对话框内容 -->
    <div class="relative bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6 border border-gray-700" @click.stop>
      <!-- 标题 -->
      <div class="text-lg font-medium mb-6 text-center text-white">匹配中</div>

      <div class="text-center space-y-4">
        <!-- 匹配动画 -->
        <div class="flex justify-center">
          <el-icon class="text-4xl animate-spin text-blue-400">
            <Loading />
          </el-icon>
        </div>

        <!-- 匹配状态 -->
        <p class="text-lg text-white">
          正在寻找对手...
          <span class="text-sm text-gray-400">
            已等待 {{ formatTime(waitTime) }}
          </span>
        </p>

        <!-- 取消按钮 -->
        <el-button 
          type="danger" 
          @click="handleCancel"
          :loading="loading"
          class="!bg-red-500 hover:!bg-red-600 border-none"
        >
          取消匹配
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useWebSocketService } from '@/services/websocket'
import { ElMessage, ElIcon } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { useResponsive } from '@/composables/useResponsive'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'cancel'])

const router = useRouter()
const wsService = useWebSocketService()
const { isMobile } = useResponsive()

const loading = ref(false)
const waitTime = ref(0)
const isMatching = ref(false)
let timer = null

// 格式化等待时间
const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// 开始计时
const startTimer = () => {
  console.log('开始计时器')
  timer = setInterval(() => {
    waitTime.value++
    console.log('等待时间:', formatTime(waitTime.value))
  }, 1000)
}

// 停止计时
const stopTimer = () => {
  console.log('停止计时器')
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  waitTime.value = 0
}

// 处理取消匹配
const handleCancel = async () => {
  try {
    if (loading.value) {
      console.log('正在取消匹配中，忽略重复操作')
      return
    }
    
    if (!isMatching.value) {
      console.log('未在匹配状态，直接关闭')
      emit('update:visible', false)
      return
    }
    
    console.log('开始取消匹配...')
    loading.value = true
    await wsService.cancelMatching()
    console.log('取消匹配成功')
    isMatching.value = false
    emit('update:visible', false)
    emit('cancel')
  } catch (error) {
    console.error('取消匹配失败:', error)
    ElMessage.error(error.message || '取消匹配失败')
  } finally {
    loading.value = false
  }
}

// 监听匹配成功
const handleMatchFound = async (data) => {
  console.log('收到匹配成功事件:', data)
  if (data.success) {
    console.log('匹配成功，准备跳转到房间:', data.roomId)
    isMatching.value = false
    ElMessage.success(data.message || '匹配成功')
    emit('update:visible', false)
    
    try {
      // 等待房间状态就绪
      await wsService.waitForRoomReady(data.roomId, 10000, 5)
      
      // 跳转到游戏页面
      await router.push({
        name: 'Game',
        params: { roomId: data.roomId }
      })
    } catch (error) {
      console.error('跳转游戏页面失败:', error)
      ElMessage.error(error.message === '等待房间就绪超时' ? 
        '房间加载超时，请重新匹配' : 
        '进入游戏失败，请重试'
      )
      // 返回大厅
      router.push({ name: 'Home' })
    }
  }
}

// 处理背景点击
const handleBackdropClick = () => {
  console.log('点击背景遮罩')
  if (!loading.value) {
    console.log('触发取消匹配')
    handleCancel()
  } else {
    console.log('正在加载中，忽略背景点击')
  }
}

onMounted(() => {
  console.log('匹配模态框组件挂载')
  if (props.visible) {
    console.log('初始状态为可见，启动计时器')
    isMatching.value = true
    startTimer()
  }
  console.log('注册匹配成功事件监听')
  wsService.socket?.on('matchFound', handleMatchFound)
})

onUnmounted(() => {
  console.log('匹配模态框组件卸载')
  stopTimer()
  console.log('移除匹配成功事件监听')
  wsService.socket?.off('matchFound', handleMatchFound)
})

// 监听 visible 变化
watch(() => props.visible, (newVal) => {
  console.log('可见性变更:', newVal)
  if (newVal) {
    console.log('显示匹配模态框，启动计时器')
    isMatching.value = true
    startTimer()
  } else {
    console.log('隐藏匹配模态框，停止计时器')
    isMatching.value = false
    stopTimer()
  }
})
</script>

<style scoped>
:deep(.el-button.el-button--danger) {
  color: white;
}

:deep(.el-button.el-button--danger:focus) {
  background-color: rgb(239 68 68);
  border-color: transparent;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style> 