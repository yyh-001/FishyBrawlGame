import { defineStore } from 'pinia'
import { ref } from 'vue'
import { wsService } from '@/services/websocket'
import { ElMessage } from 'element-plus'

export const useFriendStore = defineStore('friend', () => {
  const friends = ref([])
  const friendRequests = ref([])
  const loading = ref(false)

  // 添加重置方法
  const $reset = () => {
    friends.value = []
    friendRequests.value = []
    loading.value = false
  }

  // 获取好友列表
  const getFriends = async () => {
    try {
      if (!wsService.connected.value) {
        console.warn('WebSocket 未连接，无法获取好友列表')
        return
      }

      loading.value = true
      const response = await wsService.getFriends()
      if (response.success) {
        // 确保每个好友只有一个状态
        const uniqueFriends = response.data.friends.map(friend => ({
          ...friend,
          status: friend.status || 'offline' // 确保有状态值
        }))
        friends.value = uniqueFriends
        
        console.log('更新后的好友列表:', friends.value.map(f => ({
          username: f.username,
          status: f.status
        })))
      }
      return response
    } catch (error) {
      console.error('获取好友列表失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 更新好友状态
  const updateFriendStatus = (userId, status) => {
    const friend = friends.value.find(f => f.userId === userId)
    if (friend) {
      friend.status = status
      console.log(`更新好友 ${friend.username} 状态为 ${status}`)
    }
  }

  // 获取好友请求列表
  const getFriendRequests = async () => {
    try {
      if (!wsService.connected.value) {
        console.warn('WebSocket 未连接，无法获取好友请求列表')
        return
      }

      loading.value = true
      const response = await wsService.getFriendRequests()
      if (response.success) {
        friendRequests.value = response.data.requests
      }
      return response
    } catch (error) {
      console.error('获取好友请求列表失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 发送好友请求
  const sendFriendRequest = async ({ toUserId, message }) => {
    try {
      loading.value = true
      console.log('正在发送好友请求:', { 
        toUserId, 
        message,
        currentUserId: JSON.parse(localStorage.getItem('userInfo'))?.userId 
      })
      
      // 参数验证
      if (!toUserId?.trim()) {
        throw new Error('目标用户ID不能为空')
      }

      // 检查是否向自己发送请求
      const currentUserId = JSON.parse(localStorage.getItem('userInfo'))?.userId
      if (!currentUserId) {
        throw new Error('当前用户未登录')
      }

      if (toUserId.trim() === currentUserId) {
        throw new Error('不能向自己发送好友请求')
      }

      // 检查消息长度
      if (message && message.length > 100) {
        throw new Error('请求消息过长')
      }
      
      const response = await wsService.sendFriendRequest({ 
        toUserId: toUserId.trim(), 
        message: message?.trim() || '请求添加您为好友'
      })
      
      if (response.success) {
        console.log('✅ 好友请求发送成功:', response.data)
        ElMessage.success(response.data.message || '好友请求已发送')
      }
      return response
    } catch (error) {
      console.error('❌ 发送好友请求失败:', error)
      // 统一错误处理
      const errorMessage = error.message || '发送好友请求失败'
      ElMessage.error(errorMessage)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 处理好友请求
  const handleFriendRequest = async (requestId, action) => {
    try {
      loading.value = true
      console.log('处理好友请求:', { requestId, action })
      
      const response = await wsService.handleFriendRequest({ requestId, action })
      
      if (response.success) {
        // 从请求列表中移除已处理的请求
        friendRequests.value = friendRequests.value.filter(
          req => req.requestId !== requestId
        )
        
        // 如果接受了请求，将新好友添加到好友列表并刷新
        if (action === 'accept') {
          // 刷新好友列表以获取最新数据
          await getFriends()
          
          ElMessage.success('已接受好友请求')
        } else {
          ElMessage.success('已拒绝好友请求')
        }
      }
      return response
    } catch (error) {
      console.error('处理好友请求失败:', error)
      ElMessage.error(error.message || '处理好友请求失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  // 删除好友
  const removeFriend = async (friendId) => {
    try {
      loading.value = true
      const response = await wsService.removeFriend({ friendId })
      if (response.success) {
        // 从好友列表中移除
        friends.value = friends.value.filter(f => f.userId !== friendId)
      }
      return response
    } catch (error) {
      console.error('Remove friend failed:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  return {
    friends,
    friendRequests,
    loading,
    getFriends,
    getFriendRequests,
    sendFriendRequest,
    handleFriendRequest,
    removeFriend,
    updateFriendStatus,
    $reset
  }
}) 