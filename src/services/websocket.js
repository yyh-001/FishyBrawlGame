import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { io } from 'socket.io-client'

class WebSocketService {
  constructor() {
    this.socket = null
    this.connected = ref(false)
    this.currentRoom = ref(null)
    this.connectPromise = null
    this.roomListCallbacks = new Set()
  }

  connect(token) {
    if (this.socket?.connected) {
      console.log('WebSocket 已连接')
      return Promise.resolve()
    }

    if (this.connectPromise) {
      console.log('WebSocket 正在连接中...')
      return this.connectPromise
    }

    console.log('开始建立 WebSocket 连接...')
    this.connectPromise = new Promise((resolve, reject) => {
      this.socket = io(import.meta.env.VITE_API_BASE_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000
      })

      this.socket.on('connect', () => {
        console.log('✅ WebSocket 连接成功')
        this.connected.value = true
        resolve()
        this.connectPromise = null
        
        if (this.currentRoom.value) {
          console.log(`尝试重新加入房间: ${this.currentRoom.value}`)
          this.joinRoom(this.currentRoom.value)
        }
      })

      this.socket.on('connect_error', (error) => {
        console.error('❌ WebSocket 连接错误:', error.message)
        this.connected.value = false
        reject(error)
        this.connectPromise = null
        ElMessage.error(error.message || '连接失败')
      })

      this.socket.on('disconnect', (reason) => {
        console.log('⚠️ WebSocket 断开连接, 原因:', reason)
        this.connected.value = false
      })

      // 房间事件监听
      this.socket.on('roomListUpdated', () => {
        console.log('🔄 房间列表更新事件触发')
        console.log('正在通知', this.roomListCallbacks.size, '个监听器')
        this.roomListCallbacks.forEach(callback => callback())
      })

      this.socket.on('playerJoined', (data) => {
        console.log('👥 收到playerJoined事件:', data)
        try {
          // 直接使用 newPlayer 中的信息
          const username = data.newPlayer?.username || '未知玩家'
          ElMessage.success(`${username} 加入了房间`)
          
          // 触发房间列表更新
          this.roomListCallbacks.forEach(callback => callback())
        } catch (error) {
          console.error('解析玩家加入信息失败:', error)
          ElMessage.info('有新玩家加入房间')
        }
      })

      this.socket.on('playerLeft', (data) => {
        console.log('👋 收到playerLeft事件:', data)
        try {
          // 直接使用事件数据中的用户名
          const username = data.username || '未知玩家'
          ElMessage.info(`${username} 离开了房间`)
          
          // 触发房间列表更新
          this.roomListCallbacks.forEach(callback => callback())
        } catch (error) {
          console.error('解析玩家离开信息失败:', error)
          ElMessage.info('有玩家离开了房间')
        }
      })

      this.socket.on('roomDeleted', (data) => {
        console.log('🗑️ 房间已删除:', data.roomId)
        if (this.currentRoom.value === data.roomId) {
          this.currentRoom.value = null
          ElMessage.warning('房间已被解散')
        }
      })

      this.socket.on('readyStateChanged', (data) => {
        const readyStatus = data.player.ready ? '准备' : '取消准备'
        console.log('🎮 准备状态更新:', {
          roomId: data.roomId,
          player: data.player,
          ready: data.player.ready,
          allReady: data.allReady
        })
        ElMessage.info(`${data.player.username} ${readyStatus}`)
      })
    })

    return this.connectPromise
  }

  // 确保连接已建立
  ensureConnected() {
    if (this.socket?.connected) {
      return Promise.resolve()
    }
    return this.connectPromise || Promise.reject(new Error('WebSocket 未连接'))
  }

  // 房间操作方法
  getRooms() {
    return this.ensureConnected().then(() => {
      console.log('📋 获取房间列表...')
      return new Promise((resolve, reject) => {
        this.socket.emit('getRooms', (response) => {
          if (response.success) {
            console.log('✅ 获取房间列表成功:', response.data)
            resolve(response.data)
          } else {
            console.error('❌ 获取房间列表失败:', response.error)
            reject(new Error(response.error))
          }
        })
      })
    })
  }

  createRoom(name) {
    return this.ensureConnected().then(() => {
      console.log('🏠 创建房间:', name)
      return new Promise((resolve, reject) => {
        this.socket.emit('createRoom', { name }, (response) => {
          if (response.success) {
            console.log('✅ 创建房间成功:', response.data)
            this.currentRoom.value = response.data.roomId
            resolve(response.data)
          } else {
            console.error('❌ 创建房间失败:', response.error)
            reject(new Error(response.error))
          }
        })
      })
    })
  }

  joinRoom(roomId) {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('WebSocket 未连接'))
        return
      }

      // 从 localStorage 获取用户信息
      const userInfo = JSON.parse(localStorage.getItem('userInfo'))
      if (!userInfo) {
        reject(new Error('用户信息不存在'))
        return
      }

      // 构建玩家信息
      const playerInfo = {
        userId: userInfo.userId,
        username: userInfo.username,
        rating: userInfo.rating || 1000
      }

      this.socket.emit('joinRoom', { 
        roomId,
        player: playerInfo
      }, (response) => {
        if (response.success) {
          this.currentRoom.value = roomId
          resolve(response.data)
        } else {
          reject(new Error(response.error))
        }
      })
    })
  }

  leaveRoom() {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('WebSocket 未连接'))
        return
      }

      // 如果当前不在任何房间中，直接返回成功
      if (!this.currentRoom.value) {
        resolve({ message: '您已不在房间中' })
        return
      }

      // 发送离开房间事件
      this.socket.emit('leaveRoom', {}, (response) => {
        if (response.success) {
          // 清除当前房间状态
          this.currentRoom.value = null
          resolve(response.data)
        } else {
          // 如果返回房间不存在的错误，也视为成功离开
          if (response.error === '房间不存在') {
            this.currentRoom.value = null
            resolve({ message: '房间已不存在' })
          } else {
            reject(new Error(response.error))
          }
        }
      })
    })
  }

  toggleReady() {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected || !this.currentRoom.value) {
        reject(new Error('未在房间中'))
        return
      }

      this.socket.emit('toggleReady', { roomId: this.currentRoom.value }, (response) => {
        if (response.success) {
          resolve(response.data)
        } else {
          reject(new Error(response.error))
        }
      })
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.connected.value = false
      this.currentRoom.value = null
    }
  }

  // 添加房间列表更新监听方法
  onRoomListUpdate(callback) {
    console.log('➕ 添加房间列表更新监听器')
    this.roomListCallbacks.add(callback)
  }

  // 移除房间列表更新监听方法
  offRoomListUpdate(callback) {
    console.log('➖ 移除房间列表更新监听器')
    this.roomListCallbacks.delete(callback)
  }
}

// 创建单例实例
const wsService = new WebSocketService()

// 提供一个组合式函数来访问 WebSocket 服务
const useWebSocketService = () => wsService

const connectWebSocket = (token) => wsService.connect(token)
const disconnectWebSocket = () => wsService.disconnect()

export {
  wsService,
  useWebSocketService,
  connectWebSocket,
  disconnectWebSocket
} 