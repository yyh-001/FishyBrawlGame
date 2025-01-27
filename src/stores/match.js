import { defineStore } from 'pinia'
import { ref } from 'vue'
import { matchApi } from '@/api/match'

export const useMatchStore = defineStore('match', () => {
  const loading = ref(false)

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

  // 离开房间
  const leaveRoom = async (roomId) => {
    try {
      const response = await matchApi.leaveRoom(roomId)
      if (response?.data?.code === 200) {
        return response.data
      }
      throw new Error(response?.data?.message || '离开房间失败')
    } catch (error) {
      console.error('Leave room failed:', error)
      throw error
    }
  }

  // 准备
  const ready = async (roomId) => {
    try {
      const response = await matchApi.ready(roomId)
      if (response?.data?.code === 200) {
        return response.data
      }
      throw new Error(response?.data?.message || '准备失败')
    } catch (error) {
      console.error('Ready failed:', error)
      throw error
    }
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

  return {
    loading,
    getRooms,
    createRoom,
    quickMatch,
    cancelMatch,
    joinRoom,
    leaveRoom,
    ready,
    cancelReady
  }
}) 