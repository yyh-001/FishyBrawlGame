import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { gameApi } from '@/api/game'

export const useGameStore = defineStore('game', () => {
  const gameState = ref(null)
  const players = ref([])
  const currentTurn = ref(null)
  const loading = ref(false)

  // 计算属性
  const isMyTurn = computed(() => {
    // TODO: 实现回合判断逻辑
    return false
  })

  // 获取游戏状态
  const getGameState = async (roomId) => {
    loading.value = true
    try {
      const response = await gameApi.getGameState(roomId)
      if (response?.data?.code === 200) {
        gameState.value = response.data.data.state
        players.value = response.data.data.players
        currentTurn.value = response.data.data.currentTurn
        return response.data
      }
      throw new Error(response?.data?.message || '获取游戏状态失败')
    } finally {
      loading.value = false
    }
  }

  // 执行操作
  const performAction = async (roomId, action) => {
    loading.value = true
    try {
      const response = await gameApi.performAction(roomId, action)
      if (response?.data?.code === 200) {
        return response.data
      }
      throw new Error(response?.data?.message || '操作失败')
    } finally {
      loading.value = false
    }
  }

  // 投降
  const surrender = async (roomId) => {
    loading.value = true
    try {
      const response = await gameApi.surrender(roomId)
      if (response?.data?.code === 200) {
        return response.data
      }
      throw new Error(response?.data?.message || '投降失败')
    } finally {
      loading.value = false
    }
  }

  return {
    gameState,
    players,
    currentTurn,
    loading,
    isMyTurn,
    getGameState,
    performAction,
    surrender
  }
}) 