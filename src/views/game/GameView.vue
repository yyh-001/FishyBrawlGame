<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 relative overflow-hidden">
    <!-- 背景卡牌动画 -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div v-for="i in 12" :key="i" 
        class="card absolute"
        :style="{ 
          left: `${Math.random() * 100}%`, 
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 8}s`,
          animationDuration: `${15 + Math.random() * 15}s`,
          width: `${80 + Math.random() * 40}px`,
          height: `${120 + Math.random() * 40}px`,
          opacity: 0.1 + Math.random() * 0.1
        }"
      ></div>
    </div>

    <!-- 游戏内容 -->
    <div class="relative z-10 min-h-screen flex flex-col">
      <!-- 顶部信息栏 -->
      <header class="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div class="container mx-auto px-8 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <h1 class="text-xl font-bold text-white">对战中</h1>
              <span class="text-white/60">
                回合 {{ currentTurn }}
              </span>
            </div>
            <button 
              class="btn btn-danger"
              @click="handleSurrender"
              :disabled="loading"
            >
              投降
            </button>
          </div>
        </div>
      </header>

      <!-- 游戏区域 -->
      <main class="flex-grow container mx-auto px-8 py-8">
        <!-- TODO: 添加游戏界面 -->
        <div class="text-center text-white">
          游戏界面开发中...
        </div>
      </main>
    </div>

    <!-- 游戏结束弹窗 -->
    <el-dialog
      v-model="showGameOver"
      title="游戏结束"
      width="400px"
      :close-on-click-modal="false"
      :show-close="false"
    >
      <div class="text-center">
        <h3 class="text-2xl font-bold mb-4">
          {{ gameResult === 'win' ? '胜利！' : '失败！' }}
        </h3>
        <p class="text-gray-500 mb-6">
          {{ gameResult === 'win' ? '恭喜你获得胜利！' : '再接再厉！' }}
        </p>
        <div class="flex justify-center space-x-4">
          <button 
            class="btn btn-primary"
            @click="handleBackToLobby"
          >
            返回大厅
          </button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useGameStore } from '@/stores/game'
import { wsService } from '@/services/websocket'

const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()

const roomId = route.params.roomId
const currentTurn = ref(1)
const showGameOver = ref(false)
const gameResult = ref(null)
const loading = ref(false)

// 获取游戏状态
const fetchGameState = async () => {
  try {
    const response = await gameStore.getGameState(roomId)
    if (response.code === 200) {
      currentTurn.value = response.data.currentTurn
    }
  } catch (error) {
    console.error('Fetch game state failed:', error)
  }
}

// 投降
const handleSurrender = async () => {
  try {
    await ElMessageBox.confirm('确定要投降吗？', '提示', {
      type: 'warning'
    })
    
    loading.value = true
    const response = await gameStore.surrender(roomId)
    if (response.code === 200) {
      ElMessage.success('已投降')
      gameResult.value = 'lose'
      showGameOver.value = true
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Surrender failed:', error)
    }
  } finally {
    loading.value = false
  }
}

// 返回大厅
const handleBackToLobby = () => {
  router.push('/')
}

// WebSocket 消息处理
const handleGameUpdate = (payload) => {
  if (payload.roomId === roomId) {
    currentTurn.value = payload.currentTurn
    // TODO: 更新游戏状态
  }
}

const handleGameOver = (payload) => {
  if (payload.roomId === roomId) {
    gameResult.value = payload.result
    showGameOver.value = true
  }
}

// 设置 WebSocket 监听
const setupWebSocket = () => {
  wsService.on('game_update', handleGameUpdate)
  wsService.on('game_over', handleGameOver)
}

// 清理 WebSocket 监听
const cleanupWebSocket = () => {
  wsService.off('game_update', handleGameUpdate)
  wsService.off('game_over', handleGameOver)
}

onMounted(() => {
  fetchGameState()
  setupWebSocket()
})

onUnmounted(() => {
  cleanupWebSocket()
})
</script>

<style scoped>
.card {
  background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
  border-radius: 10px;
  backdrop-filter: blur(2px);
  border: 1px solid rgba(255,255,255,0.1);
  animation: cardFloat linear infinite;
  transform-origin: center;
}

@keyframes cardFloat {
  0% {
    transform: translate(0, 0) rotate(0deg);
  }
  100% {
    transform: translate(calc(100vw + 200px), calc(100vh + 200px)) rotate(360deg);
  }
}
</style> 