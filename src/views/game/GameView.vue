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
        <!-- 加载状态 -->
        <div v-if="loading" class="flex items-center justify-center h-full">
          <div class="el-loading-spinner">
            <svg class="circular" viewBox="25 25 50 50">
              <circle class="path" cx="50" cy="50" r="20" fill="none"/>
            </svg>
          </div>
          <span class="ml-2 text-white">加载中...</span>
        </div>

        <!-- 错误状态 -->
        <div v-else-if="error" class="text-center text-white">
          <p class="text-xl">{{ error }}</p>
          <el-button class="mt-4" @click="retryInitialize">重试</el-button>
        </div>

        <!-- 英雄选择阶段 -->
        <div v-else-if="gameState === 'selecting'" class="hero-selection">
          <div class="timer-container">
            <div :class="timerClass">
              <span>选择英雄: {{ formatTime(timeRemaining) }}</span>
            </div>
          </div>
          
          <h2 class="text-2xl font-bold text-center text-white mb-8">选择你的英雄</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6 px-4">
            <div 
              v-for="hero in availableHeroes" 
              :key="hero._id"
              class="hero-card"
              :class="{
                'selected': selectedHeroId === hero._id,
                'disabled': timeRemaining <= 0
              }"
              @click="handleHeroSelect(hero)"
            >
              <div class="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-all cursor-pointer border-2"
                   :class="{ 'border-yellow-500': selectedHeroId === hero._id, 'border-transparent': selectedHeroId !== hero._id }">
                <div class="hero-header flex justify-between items-center mb-2">
                  <h3 class="text-xl font-bold text-yellow-500 truncate flex-1 mr-2">{{ hero?.name || '未知英雄' }}</h3>
                  <span class="hero-health text-red-500 flex-shrink-0">❤️ {{ hero?.health || 40 }}</span>
                </div>
                <p class="text-gray-300 text-sm mb-4 h-12 line-clamp-2">
                  {{ hero?.description || '暂无描述' }}
                </p>
                <div class="hero-ability bg-gray-900/50 rounded p-3">
                  <div class="ability-header flex justify-between items-center">
                    <span class="text-green-500 font-medium truncate flex-1 mr-2">{{ hero?.ability_name || '基础技能' }}</span>
                    <span class="ability-cost text-yellow-500" v-if="hero?.ability_cost > 0">
                      💰 {{ hero.ability_cost }}
                    </span>
                  </div>
                  <p class="text-gray-400 text-sm mt-2 h-12 line-clamp-2">{{ hero?.ability_description || '暂无描述' }}</p>
                  <span class="ability-type inline-block px-2 py-1 rounded text-xs mt-2"
                        :class="hero?.ability_type === 'active' ? 'bg-blue-500' : 'bg-purple-500'">
                    {{ hero?.ability_type === 'active' ? '主动技能' : '被动技能' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div class="text-center mt-8">
            <button 
              class="confirm-button"
              :disabled="!selectedHeroId || timeRemaining <= 0"
              @click="confirmHeroSelection"
            >
              确认选择
            </button>
          </div>
        </div>

        <!-- 游戏主界面 -->
        <div v-else-if="gameState === 'playing'" class="game-board">
          <GameBoard />
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
import { ref, onMounted, onUnmounted, nextTick, onBeforeUnmount, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useGameStore } from '@/stores/game'
import { wsService } from '@/services/websocket'
import { ElLoading } from 'element-plus'
import GameBoard from './GameBoard.vue'

const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()

const roomId = route.params.roomId
const currentTurn = ref(1)
const showGameOver = ref(false)
const gameResult = ref(null)
const loading = ref(false)
const error = ref(null)
const gameState = ref('selecting')
const availableHeroes = ref([])
const selectedHeroId = ref(null)
const timeRemaining = ref(30000) // 30秒
const timerInterval = ref(null) // 用于存储定时器

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

// 开始倒计时
const startCountdown = (initialTime) => {
  // 清除可能存在的旧定时器
  if (timerInterval.value) {
    console.log('🔄 清除旧的倒计时定时器')
    clearInterval(timerInterval.value)
  }

  console.log('⏰ 开始倒计时:', {
    initialTime,
    formattedTime: formatTime(initialTime),
    timestamp: new Date().toISOString()
  })

  timeRemaining.value = initialTime
  
  // 创建新的定时器，每100ms更新一次
  timerInterval.value = setInterval(() => {
    if (timeRemaining.value <= 0) {
      console.log('⌛ 倒计时结束')
      clearInterval(timerInterval.value)
      return
    }

    // 记录重要时间点
    const oldTime = timeRemaining.value
    timeRemaining.value = Math.max(0, timeRemaining.value - 100)

    // 在关键时间点输出日志
    if (Math.floor(oldTime / 1000) !== Math.floor(timeRemaining.value / 1000)) {
      console.log('⏱️ 倒计时更新:', {
        timeRemaining: timeRemaining.value,
        formattedTime: formatTime(timeRemaining.value),
        isUrgent: timeRemaining.value <= 5000,
        timestamp: new Date().toISOString()
      })
    }
  }, 100)
}

// 初始化游戏
const initializeGame = async () => {
  try {
    loading.value = true
    console.log('🎮 初始化游戏...', {
      roomId: route.params.roomId,
      socketConnected: wsService.socket?.connected,
      timestamp: new Date().toISOString()
    })

    if (!wsService.socket?.connected) {
      throw new Error('WebSocket 未连接')
    }

    const response = await new Promise((resolve, reject) => {
      wsService.socket.emit('getAvailableHeroes', {
        roomId: route.params.roomId
      }, (response) => {
        console.log('📥 收到英雄列表响应:', {
          success: response.success,
          heroCount: response.data?.heroes?.length,
          selectionTimeLimit: response.data?.selectionTimeLimit,
          timestamp: new Date().toISOString()
        })
        if (response.success) {
          resolve(response)
        } else {
          reject(new Error(response.error))
        }
      })
    })

    console.log('✅ 获取英雄列表成功:', {
      heroCount: response.data.heroes.length,
      selectionTimeLimit: response.data.selectionTimeLimit,
      timestamp: new Date().toISOString()
    })
    
    availableHeroes.value = response.data.heroes
    
    // 开始倒计时
    startCountdown(response.data.selectionTimeLimit * 1000)
    
    console.log('✨ 游戏初始化完成', {
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ 游戏初始化失败:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    })
    ElMessage.error(error.message || '游戏初始化失败')
    error.value = error.message
  } finally {
    loading.value = false
  }
}

// 重试初始化
const retryInitialize = () => {
  error.value = null
  initializeGame()
}

// 选择英雄
const handleHeroSelect = (hero) => {
  if (timeRemaining.value <= 0) return
  selectedHeroId.value = hero._id
}

// 确认英雄选择
const confirmHeroSelection = async () => {
  if (!selectedHeroId.value || timeRemaining.value <= 0) return
  
  try {
    loading.value = true;
    console.log('确认英雄选择:', {
      roomId: route.params.roomId,
      heroId: selectedHeroId.value
    });

    // 发送英雄选择确认
    wsService.socket.emit('confirmHeroSelection', {
      roomId: route.params.roomId,
      heroId: selectedHeroId.value
    });

  } catch (error) {
    console.error('确认英雄选择失败:', error)
    ElMessage.error(error.message || '确认选择失败')
  } finally {
    loading.value = false;
  }
}

// 监听游戏事件
const setupGameEvents = () => {
  // 只保留 allHeroesSelected 监听
  wsService.socket?.on('allHeroesSelected', (data) => {
    console.log('👥 所有玩家已选择英雄:', data)
    // 可以显示倒计时
  })
}

// 投降
const handleSurrender = async () => {
  try {
    if (!confirm('确定要投降吗？')) return
    
    const response = await wsService.emit('surrender', {
      roomId: route.params.roomId
    })
    
    if (response.success) {
      router.push('/')
    }
  } catch (error) {
    console.error('投降失败:', error)
    ElMessage.error(error.message || '投降失败')
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
  try {
    if (wsService.socket) {
      wsService.socket.off('game_update', handleGameUpdate)
      wsService.socket.off('game_over', handleGameOver)
      wsService.socket.off('playerSelectedHero')
      wsService.socket.off('gameStart')
    }
  } catch (error) {
    console.error('清理WebSocket监听失败:', error)
  }
}

// 格式化时间
const formatTime = (ms) => {
  const seconds = Math.ceil(ms / 1000)
  return `${seconds}秒`
}

// 在模板中添加紧急状态样式
const timerClass = computed(() => ({
  'timer': true,
  'urgent': timeRemaining.value <= 5000 // 最后5秒显示紧急样式
}))

onMounted(() => {
  console.log('🎮 游戏视图组件挂载:', {
    roomId: route.params.roomId,
    currentRoute: route.path,
    socketConnected: wsService.socket?.connected,
    timestamp: new Date().toISOString()
  });

  // 确保 socket 连接
  if (!wsService.socket?.connected) {
    console.log('🔌 WebSocket 未连接，尝试重新连接...');
    wsService.connect();
  }

  // 加入房间的 socket room
  wsService.socket?.emit('joinRoom', {
    roomId: route.params.roomId
  }, (response) => {
    console.log('📥 加入房间响应:', response);
  });

  initializeGame();
  setupGameEvents();
  
  // 监听其他玩家选择英雄
  wsService.socket?.on('playerSelectedHero', (data) => {
    console.log('👤 其他玩家选择了英雄:', {
      data,
      timestamp: new Date().toISOString()
    });
  });

  // 监听英雄选择确认响应
  wsService.socket?.on('heroSelectionConfirmed', (data) => {
    console.log('✅ 英雄选择确认响应:', {
      success: data.success,
      data,
      timestamp: new Date().toISOString()
    });
    
    if (data.success) {
      ElMessage.success('英雄选择成功');
    }
  });

  // 监听英雄选择更新
  wsService.socket?.on('heroSelectionUpdated', (data) => {
    console.log('🔄 英雄选择状态更新:', {
      data,
      allSelected: data.allSelected,
      timestamp: new Date().toISOString()
    });
    
    if (data.allSelected) {
      ElMessage.info('所有玩家已选择英雄，即将开始游戏...');
    }
  });

  // 监听游戏开始
  wsService.socket?.on('gameStart', async (data) => {
    try {
      console.log('🎮 收到游戏开始事件:', {
        data,
        roomId: route.params.roomId,
        currentRoute: route.path,
        timestamp: new Date().toISOString()
      });
      
      // 存储游戏初始数据
      const gameData = JSON.stringify(data);
      localStorage.setItem(`game_${route.params.roomId}`, gameData);
      console.log('💾 游戏数据已保存到 localStorage:', {
        key: `game_${route.params.roomId}`,
        dataSize: gameData.length,
        timestamp: new Date().toISOString()
      });
      
      // 跳转到游戏界面
      console.log('🚀 准备跳转到游戏界面:', {
        targetPath: `/game-board/${route.params.roomId}`,
        timestamp: new Date().toISOString()
      });

      // 确保在路由跳转前等待一下
      await new Promise(resolve => setTimeout(resolve, 100));

      try {
        await router.push({
          name: 'GameBoard', // 使用命名路由
          params: { 
            roomId: route.params.roomId 
          },
          replace: true
        });
        console.log('✅ 跳转完成');
        ElMessage.success('游戏开始！');
      } catch (routerError) {
        console.error('❌ 路由跳转失败:', {
          error: routerError,
          route: {
            name: 'GameBoard',
            params: { roomId: route.params.roomId }
          }
        });
        throw routerError;
      }
    } catch (error) {
      console.error('❌ 跳转到游戏界面失败:', {
        error,
        errorMessage: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      ElMessage.error('进入游戏失败，请刷新页面重试');
    }
  });

  // 监听倒计时更新
  wsService.socket?.on('heroSelectionTimeUpdate', (data) => {
    console.log('🔄 收到服务器倒计时更新:', {
      serverTime: data.timeRemaining,
      localTime: timeRemaining.value,
      diff: Math.abs(timeRemaining.value - data.timeRemaining),
      needSync: Math.abs(timeRemaining.value - data.timeRemaining) > 1000,
      timestamp: new Date().toISOString()
    })

    // 如果服务器时间和本地时间差距超过1秒，则同步
    if (Math.abs(timeRemaining.value - data.timeRemaining) > 1000) {
      console.log('⚠️ 本地时间与服务器时间差距过大，进行同步')
      startCountdown(data.timeRemaining)
    }
  });

  // 监听英雄选择更新
  wsService.socket?.on('heroSelectionUpdated', (data) => {
    if (data.isAutoSelected && data.userId === wsService.socket?.user?._id) {
      ElMessage.info('由于未及时选择,系统已为您随机选择英雄')
      selectedHeroId.value = data.heroId
    }
  });
});

onBeforeUnmount(() => {
  // 只有在返回大厅时才触发离开房间
  if (router.currentRoute.value.name === 'lobby') {
    console.log('👋 离开房间:', {
      roomId: route.params.roomId,
      timestamp: new Date().toISOString()
    })
    wsService.leaveRoom(route.params.roomId)
  }
  
  if (timerInterval.value) {
    console.log('🧹 清理倒计时定时器', {
      timestamp: new Date().toISOString()
    })
    clearInterval(timerInterval.value)
  }
});
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

.el-loading-spinner {
  position: relative;
  display: inline-block;
  width: 42px;
  height: 42px;
}

.circular {
  height: 42px;
  width: 42px;
  animation: loading-rotate 2s linear infinite;
}

.path {
  animation: loading-dash 1.5s ease-in-out infinite;
  stroke-dasharray: 90, 150;
  stroke-dashoffset: 0;
  stroke-width: 2;
  stroke: #409eff;
  stroke-linecap: round;
}

@keyframes loading-rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes loading-dash {
  0% {
    stroke-dasharray: 1, 200;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -40px;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -120px;
  }
}

.hero-selection {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.selection-title {
  text-align: center;
  margin-bottom: 20px;
  color: #FFD700;
}

.hero-card {
  cursor: pointer;
  transition: all 0.3s ease;
  @apply w-full;
}

.hero-card > div {
  @apply h-full flex flex-col;
}

.hero-ability {
  @apply flex-1 flex flex-col;
}

.ability-type {
  @apply mt-auto;
}

.hero-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.hero-name {
  margin: 0;
  color: #FFD700;
  font-size: 1.2em;
  @apply truncate;
}

.hero-health {
  color: #ff4444;
}

.hero-description {
  color: #aaa;
  margin-bottom: 15px;
  font-size: 0.9em;
  @apply line-clamp-2;
}

.ability-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.ability-name {
  color: #4CAF50;
  font-weight: bold;
}

.ability-cost {
  color: #FFD700;
}

.ability-description {
  color: #ddd;
  font-size: 0.9em;
  margin-bottom: 8px;
  @apply line-clamp-2;
}

.ability-type {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8em;
  margin-top: 8px;
}

.ability-type.active {
  background: #2196F3;
  color: white;
}

.ability-type.passive {
  background: #9C27B0;
  color: white;
}

.confirm-button {
  display: inline-block;
  padding: 10px 30px;
  background: #4CAF50;
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 1.1em;
  cursor: pointer;
  transition: background 0.3s;
}

.confirm-button:disabled {
  background: #666;
  cursor: not-allowed;
}

.confirm-button:hover:not(:disabled) {
  background: #45a049;
}

.timer-container {
  @apply w-full flex justify-center mb-4;
}

.timer {
  @apply px-4 py-2 bg-blue-600 text-white rounded-lg text-lg font-bold transition-colors duration-200;
}

.timer.urgent {
  @apply bg-red-600 animate-pulse;
}

.game-board {
  @apply w-full h-full flex flex-col;
}
</style> 