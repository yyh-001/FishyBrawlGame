import { api } from './interceptors'

export const gameApi = {
  // 获取游戏状态
  getGameState(roomId) {
    return api.get(`/game/${roomId}/state`)
  },

  // 执行操作
  performAction(roomId, action) {
    return api.post(`/game/${roomId}/action`, action)
  },

  // 投降
  surrender(roomId) {
    return api.post(`/game/${roomId}/surrender`)
  },

  // 获取游戏历史
  getHistory(roomId) {
    return api.get(`/game/${roomId}/history`)
  }
} 