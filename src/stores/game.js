import { defineStore } from 'pinia'
import { ref } from 'vue'
import { wsService } from '@/services/websocket'

export const useGameStore = defineStore('game', () => {
  // 游戏状态
  const gameState = ref({
    coins: 3,
    tavernTier: 1,
    maxTavernTier: 6,
    turn: 1,
    phase: 'preparation', // preparation | combat
    shopCards: [],
    handCards: [],
    board: {},
    players: [],
    currentPlayer: null,
    hero: null
  })

  // 初始化游戏
  const initializeGame = async (gameData) => {
    if (gameData) {
      gameState.value = {
        ...gameState.value,
        ...gameData
      }
    }
  }

  // 购买随从
  const buyMinion = async (minionId) => {
    if (gameState.value.coins >= 3) {
      wsService.emit('game:buyMinion', { minionId })
    }
  }

  // 放置随从
  const placeMinion = async (minionId, position) => {
    wsService.emit('game:placeMinion', { minionId, position })
  }

  // 使用英雄技能
  const useHeroPower = async () => {
    wsService.emit('game:useHeroPower')
  }

  // 刷新商店
  const refreshShop = async () => {
    if (gameState.value.coins >= 1) {
      wsService.emit('game:refreshShop')
    }
  }

  // 升级酒馆
  const upgradeTavern = async () => {
    const cost = getUpgradeCost(gameState.value.tavernTier)
    if (gameState.value.coins >= cost) {
      wsService.emit('game:upgradeTavern')
    }
  }

  // 获取升级费用
  const getUpgradeCost = (currentTier) => {
    const costs = [0, 5, 7, 8, 9, 10]
    return costs[currentTier - 1] || 0
  }

  // 更新游戏状态
  const updateGameState = (newState) => {
    gameState.value = {
      ...gameState.value,
      ...newState
    }
  }

  // 开始新回合
  const startNewTurn = (data) => {
    const { coins, shopCards, turn } = data
    gameState.value = {
      ...gameState.value,
      coins,
      shopCards,
      turn,
      phase: 'preparation'
    }
  }

  // 开始战斗
  const startCombat = (data) => {
    gameState.value.phase = 'combat'
    // 可以添加其他战斗相关的状态更新
  }

  // 结束战斗
  const endCombat = (data) => {
    const { damages, eliminations } = data
    
    // 更新玩家生命值和淘汰状态
    gameState.value.players = gameState.value.players.map(player => {
      const damage = damages[player.userId] || 0
      return {
        ...player,
        health: Math.max(0, player.health - damage),
        eliminated: eliminations.includes(player.userId)
      }
    })
  }

  // 移动随从
  const moveMinion = (minionId, position) => {
    wsService.emit('game:moveMinion', { minionId, position })
  }

  // 冻结/解冻商店
  const toggleShopFreeze = () => {
    wsService.emit('game:toggleShopFreeze')
  }

  return {
    gameState,
    initializeGame,
    buyMinion,
    placeMinion,
    useHeroPower,
    refreshShop,
    upgradeTavern,
    updateGameState,
    startNewTurn,
    startCombat,
    endCombat,
    moveMinion,
    toggleShopFreeze,
    getUpgradeCost
  }
}) 