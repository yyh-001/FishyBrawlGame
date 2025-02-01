<template>
  <div class="game-board min-h-screen bg-gradient-to-br from-bg-secondary to-bg-primary">
    <!-- 顶部信息栏 -->
    <div class="top-bar flex justify-between items-center p-4">
      <!-- 左侧操作按钮组 -->
      <div class="actions flex items-center gap-4">
        <button 
          class="action-btn"
          @click="refreshShop"
          :disabled="gameState.coins < 1"
        >
          刷新 (1金币)
        </button>
        <button 
          class="action-btn"
          @click="upgradeTavern"
          :disabled="gameState.coins < getUpgradeCost(gameState.tavernTier)"
        >
          升级 ({{ getUpgradeCost(gameState.tavernTier) }}金币)
        </button>
        <button 
          class="action-btn"
          @click="freezeShop"
        >
          {{ gameState.shopFrozen ? '解冻商店' : '冻结商店' }}
        </button>
      </div>
      
      <!-- 左侧金币显示 -->
      <div class="coin-display flex items-center">
        <img src="@/assets/icons/coin.png" class="w-8 h-8 mr-2" />
        <span class="text-2xl text-yellow-400">{{ coins }}</span>
      </div>
      
      <!-- 中间酒馆等级 -->
      <div class="tavern-tier flex items-center">
        <div class="stars flex">
          <img 
            v-for="i in gameState.maxTavernTier" 
            :key="i"
            :src="i <= gameState.tavernTier ? '@/assets/icons/star-filled.png' : '@/assets/icons/star-empty.png'"
            class="w-6 h-6"
          />
        </div>
        <span class="ml-2 text-white">{{ gameState.tavernTier }}/{{ gameState.maxTavernTier }}</span>
      </div>

      <!-- 右侧回合信息 -->
      <div class="turn-info text-white">
        回合 {{ gameState.turn }}
        <div class="text-sm">{{ formatPhase(gameState.phase) }}</div>
      </div>
    </div>

    <!-- 商店区域 -->
    <div class="shop-area flex justify-center gap-4 p-4">
      <div 
        v-for="card in gameState.shopCards" 
        :key="card.id"
        class="card-slot"
        @click="buyCard(card)"
        draggable
        @dragstart="handleDragStart($event, card)"
        :class="{ 'frozen': gameState.shopFrozen }"
      >
        <game-card :card="card" />
        <div class="cost">3</div>
      </div>
    </div>

    <!-- 战场区域 -->
    <div class="battlefield grid grid-cols-2 gap-4 p-4">
      <!-- 左侧玩家列表 -->
      <div class="player-list flex flex-col gap-2">
        <div 
          v-for="player in gameState.players" 
          :key="player.id"
          class="player-avatar flex items-center p-2 bg-gray-800 rounded"
          :class="{ 
            'border-2 border-yellow-400': player.id === gameState.currentPlayer?.id,
            'opacity-50': player.eliminated
          }"
        >
          <img :src="player.avatar" class="w-8 h-8 rounded-full" />
          <span class="ml-2 text-white">{{ player.username }}</span>
          <span class="ml-auto text-red-500">{{ player.health }}</span>
        </div>
      </div>

      <!-- 右侧战场 -->
      <div class="battle-field">
        <!-- 上排随从位置 -->
        <div class="minion-row flex justify-center gap-4 mb-4">
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

    <!-- 底部操作区 -->
    <div class="bottom-bar flex items-center justify-between p-4">
      <!-- 英雄技能 -->
      <div class="hero-power">
        <button 
          class="hero-power-btn"
          @click="useHeroPower"
          :disabled="!canUseHeroPower || gameState.phase !== 'preparation'"
        >
          <img :src="gameState.hero?.powerIcon" class="w-12 h-12" />
          <div class="power-cost">{{ gameState.hero?.powerCost || 2 }}</div>
        </button>
      </div>

      <!-- 手牌区域 -->
      <div class="hand-cards flex gap-4">
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

      <!-- 玩家信息 -->
      <div class="player-info flex items-center">
        <img :src="gameState.currentPlayer?.avatar" class="w-12 h-12 rounded-full" />
        <div class="ml-2">
          <div class="text-white">{{ gameState.currentPlayer?.username }}</div>
          <div class="text-red-500">HP: {{ gameState.currentPlayer?.health }}/40</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useGameStore } from '@/stores/game'
import GameCard from '@/components/game/GameCard.vue'
import { useWebSocket } from '@/composables/useWebSocket'

const gameStore = useGameStore()
const route = useRoute()
const { gameState, getUpgradeCost } = gameStore
const wsService = useWebSocket()

// 计算属性
const canUseHeroPower = computed(() => {
  return gameState.value.coins >= (gameState.value.hero?.powerCost || 2)
})

// 拖拽处理
const handleDragStart = (event, card) => {
  event.dataTransfer.setData('cardId', card.id)
  event.dataTransfer.setData('cardType', card.type) // 'minion' | 'hand'
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

// 购买卡牌
const buyCard = (card) => {
  gameStore.buyMinion(card.id)
}

// 使用英雄技能
const useHeroPower = () => {
  gameStore.useHeroPower()
}

// 刷新商店
const refreshShop = () => {
  gameStore.refreshShop()
}

// 升级酒馆
const upgradeTavern = () => {
  gameStore.upgradeTavern()
}

// 冻结商店
const freezeShop = () => {
  gameStore.toggleShopFreeze()
}

// 格式化阶段显示
const formatPhase = (phase) => {
  const phases = {
    'preparation': '准备阶段',
    'combat': '战斗阶段'
  }
  return phases[phase] || phase
}

// 初始化游戏数据
const initializeGameData = () => {
  const roomId = route.params.roomId
  const savedGameData = localStorage.getItem(`game_${roomId}`)
  if (savedGameData) {
    const gameData = JSON.parse(savedGameData)
    gameStore.initializeGame(gameData)
  }
}

onMounted(async () => {
  initializeGameData()
  
  // 监听游戏状态更新
  wsService.on('gameStateUpdate', (data) => {
    gameStore.updateGameState(data)
  })
  
  // 监听回合开始
  wsService.on('turnStart', (data) => {
    gameStore.startNewTurn(data)
  })
  
  // 监听战斗开始
  wsService.on('combatStart', (data) => {
    gameStore.startCombat(data)
  })
  
  // 监听战斗结束
  wsService.on('combatEnd', (data) => {
    gameStore.endCombat(data)
  })
})

onBeforeUnmount(() => {
  wsService.off('gameStateUpdate')
  wsService.off('turnStart')
  wsService.off('combatStart')
  wsService.off('combatEnd')
  
  // 清理游戏数据
  const roomId = route.params.roomId
  localStorage.removeItem(`game_${roomId}`)
})
</script>

<style scoped>
.minion-slot {
  width: 120px;
  height: 160px;
  border: 2px dashed #666;
  border-radius: 8px;
  transition: all 0.3s;
}

.minion-slot.valid-target {
  border-color: #4CAF50;
  background-color: rgba(76, 175, 80, 0.1);
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

.action-btn {
  @apply px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed;
}
</style> 