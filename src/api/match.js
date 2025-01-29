import { wsService } from '@/services/websocket'

export const matchApi = {
  // 获取房间列表
  getRooms() {
    return wsService.getRooms()
      .then(data => ({
        data: { 
          code: 200, 
          data: data.rooms || []  // 确保返回正确的数据结构
        }
      }))
      .catch(error => {
        throw new Error(error.message)
      })
  },

  // 创建房间
  createRoom(data) {
    return wsService.createRoom(data.name)
      .then(data => ({
        data: { code: 200, data }
      }))
      .catch(error => {
        throw new Error(error.message)
      })
  },

  // 加入房间
  joinRoom(roomId) {
    return wsService.joinRoom(roomId)
      .then(data => ({
        data: { code: 200, data }
      }))
      .catch(error => {
        throw new Error(error.message)
      })
  },

  // 离开房间
  leaveRoom() {
    return wsService.leaveRoom()
      .then(data => ({
        data: { code: 200, data }
      }))
      .catch(error => {
        throw new Error(error.message)
      })
  },

  // 准备/取消准备
  ready(roomId) {
    return wsService.toggleReady()
      .then(data => ({
        data: { code: 200, data }
      }))
      .catch(error => {
        throw new Error(error.message)
      })
  },

  // 取消准备 (使用 toggleReady)
  cancelReady(roomId) {
    return this.ready(roomId)
  },

  // 获取房间详情 (通过 joinRoom 获取)
  getRoomDetail(roomId) {
    return this.joinRoom(roomId)
  },

  // 开始游戏
  startGame(roomId) {
    return wsService.startGame(roomId)
      .then(data => ({
        data: { code: 200, data }
      }))
      .catch(error => {
        throw new Error(error.message)
      })
  },

  // 修改开始匹配方法，添加房间ID参数
  startMatch(roomId) {
    return wsService.startMatch(roomId)
      .then(data => ({
        data: { code: 200, data }
      }))
      .catch(error => {
        throw new Error(error.message)
      })
  }
} 