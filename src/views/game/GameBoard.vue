<template>
  <div v-if="loading" class="loading-overlay">
    <div class="loading-spinner">加载中...</div>
  </div>
  
  <div class="game-board fixed inset-0 bg-gradient-to-br from-bg-secondary to-bg-primary overflow-hidden flex flex-col">
    <!-- 顶部信息栏 - 减小高度和间距 -->
    <div class="top-bar flex flex-col items-center p-2">
      <!-- 顶部操作栏 -->
      <div class="w-full flex items-center mb-2">
        <!-- 左侧金币显示 -->
        <div class="coin-display flex items-center scale-90">
          <svg class="w-8 h-8 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
          </svg>
          <span class="text-2xl text-yellow-400 ml-1">{{ coins }}</span>
          <span class="text-yellow-400 ml-1">+5</span>
        </div>

        <!-- 中间酒馆等级 -->
        <div class="tavern-info scale-90">
          <!-- 星级图标 -->
          <div class="stars flex items-center justify-center">
            <svg class="w-8 h-8 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
            </svg>
          </div>
          <!-- 星级数字 -->
          <div class="text-white text-sm mt-1">
            {{ gameState.tavernTier }}/{{ gameState.maxTavernTier }}
          </div>
        </div>

        <!-- 右侧菜单按钮 -->
        <div class="menu-btn scale-90">
          <button class="w-10 h-10 flex items-center justify-center bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors">
            <svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 商店卡牌 - 减小尺寸 -->
      <div class="shop-cards flex justify-center gap-2 mb-2 scale-90">
        <div 
          v-for="i in 3" 
          :key="i"
          class="shop-slot w-32 h-44 border-2 border-dashed border-gray-600 rounded-lg"
          :class="{ 'border-blue-400': gameState.shopFrozen }"
        >
          <div class="w-full h-full flex items-center justify-center text-gray-500">
            <svg class="w-12 h-12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- 操作按钮 - 减小尺寸 -->
      <div class="shop-actions flex justify-between items-center w-full px-4 scale-90">
        <!-- 升级酒馆按钮 -->
        <button 
          class="action-icon-btn"
          @click="upgradeTavern"
          :disabled="gameState.coins < getUpgradeCost(gameState.tavernTier)"
        >
          <svg class="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"/>
          </svg>
          <span class="cost">{{ getUpgradeCost(gameState.tavernTier) }}</span>
        </button>

        <!-- 刷新商店按钮 -->
        <button 
          class="action-icon-btn"
          @click="refreshShop"
          :disabled="gameState.coins < 1"
        >
          <svg class="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
          <span class="cost">1</span>
        </button>

        <!-- 冻结商店按钮 -->
        <button 
          class="action-icon-btn"
          @click="freezeShop"
          :class="{ 'active': gameState.shopFrozen }"
        >
          <svg class="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 战场区域 - 自适应高度 -->
    <div class="battlefield-container flex-1 relative">
      <!-- 左侧玩家列表 -->
      <div class="player-list-container">
        <div class="player-list flex flex-col gap-1">
          <div 
            v-for="player in gameState.players" 
            :key="player.id"
            class="player-avatar relative cursor-pointer group"
            :class="{ 
              'ring-1 ring-yellow-400': player.id === gameState.currentPlayer?.id,
              'opacity-50': player.eliminated
            }"
            @click="showPlayerInfo(player)"
          >
            <!-- 玩家头像 -->
            <div class="w-full h-full rounded-full bg-gray-800/50 flex items-center justify-center">
              <svg class="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
              </svg>
            </div>

            <!-- 生命值指示器 -->
            <div class="absolute -bottom-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
              {{ player.health }}
            </div>

            <!-- 悬停提示 -->
            <div class="absolute left-full ml-2 bg-gray-800/90 rounded-lg p-2 invisible group-hover:visible whitespace-nowrap z-10">
              <div class="text-white text-sm">{{ player.username }}</div>
              <div class="text-red-500 text-xs">生命值: {{ player.health }}/40</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 战场区域 -->
      <div class="battle-field-wrapper h-full flex items-center justify-center">
        <div class="battle-field flex flex-col gap-4 scale-90">
          <!-- 上排随从位置 -->
          <div class="minion-row flex justify-center gap-4">
            <div 
              v-for="i in 3" 
              :key="`top-${i}`"
              class="minion-slot"
              @drop="handleDrop($event, `top-${i}`)"
              @dragover.prevent
              :class="{ 'valid-target': isValidDropTarget(`top-${i}`) }"
            >
              <game-card 
                v-if="gameState.board[`top-${i}`]" 
                :card="gameState.board[`top-${i}`]"
                :draggable="gameState.phase === 'preparation'"
                @dragstart="handleDragStart($event, gameState.board[`top-${i}`])"
              />
            </div>
          </div>

          <!-- 下排随从位置 -->
          <div class="minion-row flex justify-center gap-4">
            <div 
              v-for="i in 3" 
              :key="`bottom-${i}`"
              class="minion-slot"
              @drop="handleDrop($event, `bottom-${i}`)"
              @dragover.prevent
              :class="{ 'valid-target': isValidDropTarget(`bottom-${i}`) }"
            >
              <game-card 
                v-if="gameState.board[`bottom-${i}`]" 
                :card="gameState.board[`bottom-${i}`]"
                :draggable="gameState.phase === 'preparation'"
                @dragstart="handleDragStart($event, gameState.board[`bottom-${i}`])"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部操作区 - 减小高度 -->
    <div class="bottom-bar flex items-center justify-between p-2">
      <!-- 英雄技能 -->
      <div class="hero-power">
        <button 
          class="hero-power-btn"
          @click="useHeroPower"
          :disabled="!canUseHeroPower || gameState.phase !== 'preparation'"
        >
          <svg class="w-10 h-10 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM13 16h-2v2h2v-2zm0-6h-2v4h2v-4z"/>
          </svg>
          <div class="power-cost">{{ gameState.hero?.powerCost || 2 }}</div>
        </button>
      </div>

      <!-- 手牌区域 -->
      <div class="hand-cards flex justify-center gap-2">
        <div 
          v-for="card in gameState.handCards" 
          :key="card.id"
          class="hand-card"
          :draggable="gameState.phase === 'preparation'"
          @dragstart="handleDragStart($event, card)"
        >
          <game-card :card="card" />
        </div>
      </div>

      <!-- 玩家信息 - 移到右侧 -->
      <div class="player-info relative">
        <div class="w-12 h-12 rounded-full bg-gray-800/50 flex items-center justify-center">
          <svg class="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
          </svg>
        </div>
        <!-- 生命值指示器 -->
        <div class="health-indicator">
          {{ gameState.currentPlayer?.health || 40 }}
        </div>
      </div>
    </div>

    <!-- 玩家信息弹窗 -->
    <el-dialog
      v-model="playerInfoVisible"
      :title="selectedPlayer?.username || '玩家信息'"
      width="300px"
    >
      <div class="flex flex-col items-center">
        <!-- 头像 -->
        <div class="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mb-4">
          <svg class="w-16 h-16 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
          </svg>
        </div>

        <!-- 玩家信息 -->
        <div class="w-full space-y-2">
          <div class="flex justify-between items-center">
            <span class="text-gray-400">生命值</span>
            <span class="text-red-500">{{ selectedPlayer?.health }}/40</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-400">酒馆等级</span>
            <span class="text-yellow-400">{{ selectedPlayer?.tavernTier || 1 }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-400">随从数量</span>
            <span class="text-blue-400">{{ getPlayerMinionCount(selectedPlayer) }}</span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import GameCard from '../../components/game/GameCard.vue'
import { useWebSocket } from '@/composables/useWebSocket'
import { ElMessage, ElDialog } from 'element-plus'

const router = useRouter()
const route = useRoute()
const gameStore = useGameStore()
const wsService = useWebSocket()

// 添加响应式状态
const loading = ref(true)
const gameState = ref({
  coins: 3,
  tavernTier: 1,
  maxTavernTier: 6,
  phase: 'preparation',
  turn: 1,
  shopCards: [],
  handCards: [],
  board: {},
  players: [],
  currentPlayer: null,
  shopFrozen: false,
  hero: null
})

// 计算属性
const coins = computed(() => gameState.value.coins)
const canUseHeroPower = computed(() => {
  return gameState.value.coins >= (gameState.value.hero?.powerCost || 2)
})

// 拖拽处理
const handleDragStart = (event, card) => {
  event.dataTransfer.setData('cardId', card.id)
  event.dataTransfer.setData('cardType', card.type)
}

const handleDrop = (event, position) => {
  const cardId = event.dataTransfer.getData('cardId')
  const cardType = event.dataTransfer.getData('cardType')
  
  if (cardType === 'minion') {
    gameStore.moveMinion(cardId, position)
  } else {
    gameStore.placeMinion(cardId, position)
  }
}

const isValidDropTarget = (position) => {
  return !gameState.value.board[position] && gameState.value.phase === 'preparation'
}

// 游戏操作方法
const buyCard = (card) => {
  if (gameState.value.coins >= 3) {
    gameStore.buyMinion(card.id)
  } else {
    ElMessage.warning('金币不足')
  }
}

const useHeroPower = () => {
  if (canUseHeroPower.value) {
    gameStore.useHeroPower()
  }
}

const refreshShop = () => {
  if (gameState.value.coins >= 1) {
    gameStore.refreshShop()
  } else {
    ElMessage.warning('金币不足')
  }
}

const upgradeTavern = () => {
  const cost = getUpgradeCost(gameState.value.tavernTier)
  if (gameState.value.coins >= cost) {
    gameStore.upgradeTavern()
  } else {
    ElMessage.warning('金币不足')
  }
}

const freezeShop = () => {
  gameStore.toggleShopFreeze()
}

// 获取升级费用
const getUpgradeCost = (currentTier) => {
  const costs = [0, 5, 7, 8, 9, 10]
  return costs[currentTier - 1] || 0
}

// 格式化阶段显示
const formatPhase = (phase) => {
  const phases = {
    'preparation': '准备阶段',
    'combat': '战斗阶段'
  }
  return phases[phase] || phase
}

// 添加玩家信息弹窗相关状态
const playerInfoVisible = ref(false)
const selectedPlayer = ref(null)

// 显示玩家信息
const showPlayerInfo = (player) => {
  selectedPlayer.value = player
  playerInfoVisible.value = true
}

// 获取玩家随从数量
const getPlayerMinionCount = (player) => {
  if (!player?.board) return 0
  return Object.values(player.board).filter(Boolean).length
}

// 初始化游戏数据
const initializeGameData = async () => {
  try {
    loading.value = true
    const roomId = route.params.roomId
    
    // 从 localStorage 获取游戏数据
    const savedGameData = localStorage.getItem(`game_${roomId}`)
    if (!savedGameData) {
      ElMessage.error('未找到游戏数据')
      router.replace(`/game/${roomId}`)
      return
    }

    const data = JSON.parse(savedGameData)
    gameState.value = {
      ...gameState.value,
      ...data,
      board: data.board || {},
      shopCards: data.shopCards || [],
      handCards: data.handCards || [],
      players: data.players || []
    }

    // 初始化游戏状态
    gameStore.initializeGame(data)
    
    loading.value = false
  } catch (error) {
    console.error('初始化游戏数据失败:', error)
    ElMessage.error('初始化游戏失败')
    router.replace(`/game/${route.params.roomId}`)
  }
}

onMounted(async () => {
  await initializeGameData()
  
  // 监听游戏状态更新
  wsService.socket?.on('gameStateUpdate', (data) => {
    gameState.value = {
      ...gameState.value,
      ...data
    }
  })
  
  // 监听回合开始
  wsService.socket?.on('turnStart', (data) => {
    gameStore.startNewTurn(data)
  })
  
  // 监听战斗开始
  wsService.socket?.on('combatStart', (data) => {
    gameStore.startCombat(data)
  })
  
  // 监听战斗结束
  wsService.socket?.on('combatEnd', (data) => {
    gameStore.endCombat(data)
  })
})

onBeforeUnmount(() => {
  // 清理事件监听
  const events = ['gameStateUpdate', 'turnStart', 'combatStart', 'combatEnd']
  events.forEach(event => {
    wsService.socket?.off(event)
  })
  
  // 清理游戏数据
  const roomId = route.params.roomId
  localStorage.removeItem(`game_${roomId}`)
})
</script>

<style scoped>
/* 基础样式 */
.game-board {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 顶部区域 */
.top-bar {
  flex-shrink: 0;
  height: auto;
  min-height: 180px;
}

/* 战场区域 */
.battlefield-container {
  flex: 1;
  min-height: 0; /* 允许内容自适应 */
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 底部区域 */
.bottom-bar {
  flex-shrink: 0;
  height: auto;
  min-height: 60px;
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
}

/* 卡牌尺寸调整 */
.minion-slot, .card-slot, .hand-card {
  width: 100px; /* 减小卡牌尺寸 */
  height: 140px;
}

/* 玩家列表调整 */
.player-list {
  width: 28px; /* 减小头像尺寸 */
}

.player-avatar {
  width: 24px;
  height: 24px;
}

/* 其他样式保持不变，但移除所有固定高度和最小高度 */
.battle-field {
  padding: 1rem;
}

.minion-row {
  gap: 0.5rem;
}

/* 使用 transform: scale() 统一缩小元素 */
.scale-90 {
  transform: scale(0.9);
  transform-origin: center center;
}

/* 添加加载样式 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.loading-spinner {
  color: white;
  font-size: 1.5rem;
}

.player-list {
  width: 24px; /* 减小宽度 */
  display: flex;
  flex-direction: column;
  gap: 2px; /* 减小间距 */
}

.player-avatar {
  width: 24px; /* 减小头像尺寸 */
  height: 24px;
  transition: all 0.2s ease;
}

.player-avatar:hover {
  transform: scale(1.1);
  z-index: 1;
}

.player-avatar .ring-yellow-400 {
  box-shadow: 0 0 0 1px rgba(250, 204, 21, 0.5);
}

/* 确保弹窗内容居中 */
:deep(.el-dialog__body) {
  padding: 20px;
}

.top-bar {
  position: relative;
}

.tavern-info {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.3);
  padding: 0.5rem;
  border-radius: 0.5rem;
  backdrop-filter: blur(4px);
  min-width: 60px;
  text-align: center;
  z-index: 10;
}

.coin-display {
  z-index: 20;
}

.menu-btn {
  position: fixed;
  right: 1rem;
  top: 1rem;
  z-index: 30;
}

.menu-btn button {
  backdrop-filter: blur(4px);
}

.menu-btn button:hover {
  transform: scale(1.05);
}

.shop-cards {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.shop-slot {
  transition: all 0.3s ease;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
}

.shop-slot:hover {
  border-color: #4CAF50;
  background: rgba(76, 175, 80, 0.1);
}

.battlefield-container {
  width: 100%;
  min-height: calc(100vh - 400px); /* 减去顶部和底部区域的高度 */
  position: relative;
}

.player-list-container {
  position: fixed;
  left: 0; /* 改为 0，完全贴近左边 */
  top: 50%;
  transform: translateY(-50%);
  z-index: 20;
  background: rgba(0, 0, 0, 0.2);
  padding: 4px;
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
  backdrop-filter: blur(4px);
}

.battle-field-wrapper {
  width: 100%;
  height: 100%;
  padding: 2rem;
}

.battle-field {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 1rem;
  backdrop-filter: blur(4px);
}

.minion-row {
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.minion-slot {
  width: 120px;
  height: 160px;
  border: 2px dashed rgba(102, 102, 102, 0.5);
  border-radius: 8px;
  transition: all 0.3s;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
}

.minion-slot.valid-target {
  border-color: #4CAF50;
  background: rgba(76, 175, 80, 0.1);
}

.card-slot {
  width: 120px;
  height: 160px;
  position: relative;
  transition: all 0.3s;
}

.card-slot.frozen {
  box-shadow: 0 0 10px #00BCD4;
}

.card-slot .cost {
  position: absolute;
  top: -10px;
  right: -10px;
  background: #FFD700;
  color: #000;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  padding: 4px;
}

.hero-power-btn {
  @apply rounded-full p-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50;
  position: relative;
}

.hero-power-btn .power-cost {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #FFD700;
  color: #000;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.action-icon-btn {
  @apply relative flex items-center justify-center w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 disabled:opacity-50;
  transition: all 0.3s ease;
}

.action-icon-btn .cost {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #FFD700;
  color: #000;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.action-icon-btn.active {
  @apply bg-blue-600;
}

.action-icon-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.coin-display {
  background: rgba(0, 0, 0, 0.3);
  padding: 0.5rem 1rem;
  border-radius: 1rem;
  backdrop-filter: blur(4px);
}

.top-bar {
  position: relative;
}

.tavern-info {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.3);
  padding: 0.5rem;
  border-radius: 0.5rem;
  backdrop-filter: blur(4px);
  min-width: 60px;
  text-align: center;
  z-index: 10;
}

.coin-display {
  z-index: 20;
}

.menu-btn {
  position: fixed;
  right: 1rem;
  top: 1rem;
  z-index: 30;
}

.menu-btn button {
  backdrop-filter: blur(4px);
}

.menu-btn button:hover {
  transform: scale(1.05);
}

.shop-cards {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.shop-slot {
  transition: all 0.3s ease;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
}

.shop-slot:hover {
  border-color: #4CAF50;
  background: rgba(76, 175, 80, 0.1);
}

.bottom-bar {
  position: relative;
}

.hand-cards {
  flex: 1;
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin: 0 1rem;
}

.hand-card {
  width: 120px;
  height: 160px;
  position: relative;
  transition: all 0.3s;
}

.hand-card:hover {
  transform: scale(1.05);
}

.player-info {
  flex-shrink: 0;
  width: 48px;
  cursor: pointer;
  transition: transform 0.2s ease;
  position: relative;
}

.health-indicator {
  position: absolute;
  bottom: -6px;
  right: -12px; /* 调整位置，因为文本变短了 */
  background: #ef4444;
  color: white;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 9999px;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.player-info:hover {
  transform: scale(1.1);
}
</style> 