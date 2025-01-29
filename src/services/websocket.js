import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { io } from 'socket.io-client'
import { useFriendStore } from '@/stores/friend'

class WebSocketService {
  constructor() {
    this.socket = null
    this.connected = ref(false)
    this.currentRoom = ref(null)
    this.connectPromise = null
    this.roomListCallbacks = new Set()
    this.onConnectCallbacks = new Set()
  }

  // 修改连接回调的处理方法
  onConnect(callback) {
    if (typeof callback !== 'function') {
      console.warn('onConnect 必须传入一个函数')
      return
    }

    this.onConnectCallbacks.add(callback)
    
    // 如果已经连接，使用 nextTick 异步执行回调
    if (this.socket?.connected) {
      Promise.resolve().then(() => {
        try {
          callback()
        } catch (error) {
          console.error('执行连接回调失败:', error)
        }
      })
    }
  }

  // 修改移除回调的方法
  offConnect(callback) {
    if (!callback) return
    this.onConnectCallbacks.delete(callback)
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
        
        // 设置好友事件监听
        this.setupFriendEvents()
        
        resolve()
        this.connectPromise = null
        
        // 使用 Promise.all 执行所有回调
        Promise.all(
          Array.from(this.onConnectCallbacks).map(callback => 
            Promise.resolve().then(() => {
              try {
                return callback()
              } catch (error) {
                console.error('执行连接回调失败:', error)
                return null
              }
            })
          )
        ).catch(error => {
          console.error('执行连接回调时发生错误:', error)
        })
        
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
        console.log('🎮 收到readyStateChanged事件:', data)
        try {
          if (!data) {
            console.warn('⚠️ 收到空的准备状态数据')
            return
          }

          // 如果有 changedPlayer 字段
          if (data.changedPlayer) {
            const readyStatus = data.changedPlayer.ready ? '准备' : '取消准备'
            console.log('🎮 准备状态更新:', {
              roomId: data.roomId,
              player: data.changedPlayer,
              ready: data.changedPlayer.ready,
              allReady: data.allReady
            })
            ElMessage.info(`${data.changedPlayer.username} ${readyStatus}`)
          }
          // 如果有 player 字段
          else if (data.player) {
            const readyStatus = data.player.ready ? '准备' : '取消准备'
            console.log('🎮 准备状态更新:', {
              roomId: data.roomId,
              player: data.player,
              ready: data.player.ready,
              allReady: data.allReady
            })
            ElMessage.info(`${data.player.username} ${readyStatus}`)
          }
          // 如果只有玩家列表
          else if (data.players) {
            console.log('🎮 房间玩家状态更新:', {
              roomId: data.roomId,
              players: data.players,
              allReady: data.allReady
            })
          }
          // 其他情况
          else {
            console.warn('⚠️ 未知的准备状态数据格式:', data)
          }
        } catch (error) {
          console.error('❌ 处理准备状态变更事件失败:', error, {
            data
          })
        }
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

      console.log('🎮 发送准备状态切换请求:', {
        roomId: this.currentRoom.value
      })

      this.socket.emit('toggleReady', { roomId: this.currentRoom.value }, (response) => {
        console.log('✅ 准备状态切换响应:', response)
        if (response.success) {
          resolve(response.data)
        } else {
          console.error('❌ 准备状态切换失败:', response.error)
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

  // 添加开始匹配方法
  startMatch(roomId) {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('WebSocket 未连接'))
        return
      }

      console.log('🎮 发送开始匹配请求:', { roomId })
      this.socket.emit('startMatch', { roomId }, (response) => {
        console.log('✅ 开始匹配响应:', response)
        if (response.error) {
          reject(new Error(response.error))
        } else {
          resolve(response)
        }
      })
    })
  }

  // 添加匹配成功事件监听
  onMatchSuccess(callback) {
    this.socket?.on('matchSuccess', (data) => {
      console.log('🎯 匹配成功:', data)
      callback(data)
    })
  }

  // 添加匹配失败事件监听
  onMatchFailed(callback) {
    this.socket?.on('matchFailed', (data) => {
      console.log('❌ 匹配失败:', data)
      callback(data)
    })
  }

  // 添加匹配取消事件监听
  onMatchCanceled(callback) {
    this.socket?.on('matchCanceled', (data) => {
      console.log('⚠️ 匹配取消:', data)
      callback(data)
    })
  }

  // 移除匹配相关的事件监听
  offMatchEvents() {
    if (this.socket) {
      this.socket.off('matchSuccess')
      this.socket.off('matchFailed')
      this.socket.off('matchCanceled')
    }
  }

  // 添加好友相关方法
  getFriends() {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        console.warn('⚠️ WebSocket未连接，无法获取好友列表')
        reject(new Error('WebSocket 未连接'))
        return
      }

      console.log('👥 正在获取好友列表...')
      this.socket.emit('getFriends', (response) => {
        if (response.success) {
          console.log('✅ 获取好友列表成功:', response.data)
          resolve(response)
        } else {
          console.error('❌ 获取好友列表失败:', response.error)
          reject(new Error(response.error))
        }
      })
    })
  }

  sendFriendRequest({ toUserId, message }) {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        console.error('❌ WebSocket 实例不存在');
        reject(new Error('WebSocket 未初始化'));
        return;
      }

      if (!this.socket.connected) {
        console.error('❌ WebSocket 未连接');
        reject(new Error('WebSocket 未连接'));
        return;
      }

      if (!toUserId?.trim()) {
        console.error('❌ 目标用户ID为空');
        reject(new Error('目标用户ID不能为空'));
        return;
      }

      console.log('📨 发送好友请求:', { 
        toUserId: toUserId.trim(), 
        message: message?.trim() || '请求添加您为好友',
        socketId: this.socket.id,
        connected: this.socket.connected
      });

      this.socket.emit('sendFriendRequest', {
        toUserId: toUserId.trim(),
        message: message?.trim() || '请求添加您为好友'
      }, (response) => {
        console.log('✅ 好友请求响应:', response);
        if (response.success) {
          resolve(response);
        } else {
          console.error('❌ 好友请求失败:', response.error);
          reject(new Error(response.error));
        }
      });
    });
  }

  handleFriendRequest({ requestId, action }) {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('WebSocket 未连接'))
        return
      }

      this.socket.emit('handleFriendRequest', {
        requestId,
        action
      }, (response) => {
        if (response.success) {
          resolve(response)
        } else {
          reject(new Error(response.error))
        }
      })
    })
  }

  removeFriend({ friendId }) {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        console.warn('⚠️ WebSocket未连接，无法删除好友')
        reject(new Error('WebSocket 未连接'))
        return
      }

      console.log('🗑️ 删除好友:', { friendId })
      this.socket.emit('removeFriend', { friendId }, (response) => {
        if (response.success) {
          console.log('✅ 删除好友成功:', response.data)
          resolve(response)
        } else {
          console.error('❌ 删除好友失败:', response.error)
          reject(new Error(response.error))
        }
      })
    })
  }

  // 添加好友相关事件监听
  setupFriendEvents() {
    if (!this.socket) {
        console.error('❌ WebSocket 实例不存在，无法设置好友事件');
        return;
    }

    // 移除可能存在的旧监听器
    this.socket.off('friendRequestReceived');
    this.socket.off('friendRequestHandled');
    this.socket.off('friendRemoved');
    this.socket.off('friendStatusChanged');

    // 接收好友请求
    this.socket.on('friendRequestReceived', (data) => {
        console.log('📨 收到好友请求:', {
            ...data,
            socketId: this.socket.id,
            timestamp: new Date().toISOString()
        });
        
        const store = useFriendStore();
        store.getFriendRequests();
        
        // 使用更醒目的通知
        ElMessage({
            message: `收到来自 ${data.fromUser.username} 的好友请求`,
            type: 'info',
            duration: 5000,
            showClose: true
        });
    });

    // 好友请求处理结果
    this.socket.on('friendRequestHandled', async (data) => {
      console.log('✅ 好友请求处理结果:', data)
      const store = useFriendStore()
      
      // 刷新好友列表
      await store.getFriends()
      
      const action = data.status === 'accepted' ? '接受' : '拒绝'
      ElMessage.success(`${data.toUser.username} ${action}了您的好友请求`)
    })

    // 被好友删除
    this.socket.on('friendRemoved', (data) => {
      console.log('❌ 被好友删除:', {
        userId: data.userId,
        username: data.username,
        timestamp: new Date().toISOString()
      })
      const store = useFriendStore()
      store.getFriends()
      ElMessage.warning(`${data.username} 将您从好友列表中移除`)
    })

    // 好友状态变更
    this.socket.on('friendStatusChanged', async (data) => {
        console.log('👤 好友状态变更:', data);
        const store = useFriendStore();
        
        // 使用 store 的方法更新状态
        store.updateFriendStatus(data.userId, data.status);
        
        // 触发状态变更通知
        ElMessage({
            message: `${data.username} ${data.status === 'online' ? '上线了' : '离线了'}`,
            type: data.status === 'online' ? 'success' : 'info',
            duration: 3000
        });
    });

    console.log('✅ 好友事件监听器设置完成');
  }

  // 添加获取好友请求的方法
  getFriendRequests() {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        console.warn('⚠️ WebSocket未连接，无法获取好友请求列表')
        reject(new Error('WebSocket 未连接'))
        return
      }

      console.log('📋 正在获取好友请求列表...')
      this.socket.emit('getFriendRequests', (response) => {
        if (response.success) {
          console.log('✅ 获取好友请求列表成功:', response.data)
          resolve(response)
        } else {
          console.error('❌ 获取好友请求列表失败:', response.error)
          reject(new Error(response.error))
        }
      })
    })
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