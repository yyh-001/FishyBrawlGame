import { defineStore } from 'pinia'
import { ref } from 'vue'
import { matchApi } from '@/api/match'
import { wsService } from '@/services/websocket'

export const useMatchStore = defineStore('match', () => {
  const loading = ref(false)

  const matchingModalVisible = ref(false)
  const currentRoomId = ref('')
  
  const setMatchingModalVisible = (visible) => {
    matchingModalVisible.value = visible
  }

  // 获取房间列表
  const getRooms = async () => {
    try {
      const response = await matchApi.getRooms()
      if (response?.data?.code === 200) {
        return response.data
      }
      throw new Error(response?.data?.message || '获取房间列表失败')
    } catch (error) {
      console.error('Get rooms failed:', error)
      throw error
    }
  }

  // 创建房间
  const createRoom = async (data) => {
    try {
      const response = await matchApi.createRoom(data)
      if (response?.data?.code === 200) {
        return response.data
      }
      throw new Error(response?.data?.message || '创建房间失败')
    } catch (error) {
      console.error('Create room failed:', error)
      throw error
    }
  }

  // 快速匹配
  const quickMatch = async () => {
    try {
      const response = await matchApi.quickMatch()
      if (response?.data?.code === 200) {
        return response.data
      }
      throw new Error(response?.data?.message || '开始匹配失败')
    } catch (error) {
      console.error('Quick match failed:', error)
      throw error
    }
  }

  // 取消匹配
  const cancelMatch = async () => {
    try {
      const response = await matchApi.cancelMatch()
      if (response?.data?.code === 200) {
        return response.data
      }
      throw new Error(response?.data?.message || '取消匹配失败')
    } catch (error) {
      console.error('Cancel match failed:', error)
      throw error
    }
  }

  // 加入房间
  const joinRoom = async (roomId) => {
    try {
      const response = await matchApi.joinRoom(roomId)
      if (response?.data?.code === 200) {
        return response.data
      }
      throw new Error(response?.data?.message || '加入房间失败')
    } catch (error) {
      console.error('Join room failed:', error)
      throw error
    }
  }

  // 获取房间详情
  const getRoomDetail = (roomId) => {
    return new Promise((resolve, reject) => {
      if (!wsService.socket?.connected) {
        console.error('WebSocket 未连接')
        reject(new Error('WebSocket 未连接'))
        return
      }

      console.log('正在获取房间详情:', roomId)
      wsService.socket.emit('getCurrentRoom', (response) => {
        console.log('获取房间详情响应:', response)
        if (response.success) {
          console.log('获取房间详情成功:', response.data)
          resolve({
            code: 200,
            data: response.data
          })
        } else {
          console.error('获取房间详情失败:', response.error)
          reject(new Error(response.error))
        }
      })
    })
  }

  // 准备
  const ready = (roomId) => {
    return new Promise((resolve, reject) => {
      if (!wsService.socket?.connected) {
        reject(new Error('WebSocket 未连接'))
        return
      }

      wsService.socket.emit('ready', { roomId }, (response) => {
        if (response.success) {
          resolve(response)
        } else {
          reject(new Error(response.error))
        }
      })
    })
  }

  // 取消准备
  const cancelReady = async (roomId) => {
    try {
      const response = await matchApi.cancelReady(roomId)
      if (response?.data?.code === 200) {
        return response.data
      }
      throw new Error(response?.data?.message || '取消准备失败')
    } catch (error) {
      console.error('Cancel ready failed:', error)
      throw error
    }
  }

  // 开始游戏
  const startGame = async (roomId) => {
    try {
      const response = await matchApi.startGame(roomId)
      if (response?.data?.code === 200) {
        return response.data
      }
      throw new Error(response?.data?.message || '开始游戏失败')
    } catch (error) {
      console.error('Start game failed:', error)
      throw error
    }
  }

  // 修改开始匹配方法，添加房间ID参数
  const startMatch = async (roomId) => {
    try {
      const response = await matchApi.startMatch(roomId)
      if (response?.data?.code === 200) {
        return response.data
      }
      throw new Error(response?.data?.message || '开始匹配失败')
    } catch (error) {
      console.error('Start match failed:', error)
      throw error
    }
  }

  // 离开房间
  const leaveRoom = () => {
    return new Promise((resolve, reject) => {
      if (!wsService.socket?.connected) {
        reject(new Error('WebSocket 未连接'))
        return
      }

      wsService.socket.emit('leaveRoom', {}, (response) => {
        if (response.success) {
          resolve(response)
        } else {
          reject(new Error(response.error))
        }
      })
    })
  }

  return {
    loading,
    getRooms,
    createRoom,
    quickMatch,
    cancelMatch,
    joinRoom,
    leaveRoom,
    ready,
    cancelReady,
    startGame,
    matchingModalVisible,
    setMatchingModalVisible,
    startMatch,
    currentRoomId,
    getRoomDetail
  }
}) 