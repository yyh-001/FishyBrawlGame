<template>
  <div class="room-view min-h-screen">
    <div class="container mx-auto px-4 py-8">
      <div class="flex flex-col gap-6">
        <!-- 房间标题和操作按钮 -->
        <div class="room-card rounded-lg p-6">
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-2xl font-bold text-white mb-2 room-title">
                {{ room?.name || '加载中...' }}
              </h2>
              <p class="text-white/60 room-subtitle">
                房间ID: {{ roomId }}
              </p>
            </div>
            <div class="flex gap-2">
              <el-button
                type="primary"
                @click="handleReady"
                :loading="loading"
              >
                {{ isReady ? '取消准备' : '准备' }}
              </el-button>
              <el-button 
                type="danger" 
                @click="handleLeave"
              >
                退出房间
              </el-button>
            </div>
          </div>
        </div>

        <!-- 玩家列表和好友列表 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- 玩家列表 -->
          <div class="room-card rounded-lg p-6">
            <h3 class="text-lg font-bold text-white mb-4">玩家列表</h3>
            <div class="space-y-4">
              <div 
                v-for="player in room?.players" 
                :key="player.userId"
                class="player-item flex items-center justify-between rounded-lg p-4"
              >
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <span class="text-lg font-medium text-white">
                      {{ player.username[0]?.toUpperCase() }}
                    </span>
                  </div>
                  <div>
                    <p class="text-white font-medium">
                      {{ player.username }}
                      <span v-if="player.isCreator" class="text-xs text-yellow-400 ml-2">
                        (房主)
                      </span>
                    </p>
                  </div>
                </div>
                <el-tag 
                  :type="player.ready ? 'success' : 'info'"
                  size="small"
                >
                  {{ player.ready ? '已准备' : '未准备' }}
                </el-tag>
              </div>
            </div>
          </div>

          <!-- 好友列表 -->
          <div class="room-card rounded-lg p-6">
            <h3 class="text-lg font-bold text-white mb-4">邀请好友</h3>
            <div class="space-y-4">
              <div 
                v-for="friend in filteredFriends" 
                :key="friend.userId"
                class="friend-item flex items-center justify-between rounded-lg p-4"
              >
                <div class="flex items-center space-x-3">
                  <div class="w-9 h-9 rounded-full bg-gray-700/50 flex items-center justify-center">
                    <span class="text-base font-medium text-white">
                      {{ friend.username[0]?.toUpperCase() }}
                    </span>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-white">{{ friend.username }}</p>
                    <div class="flex items-center space-x-2 text-xs text-white/60">
                      <span class="w-2 h-2 rounded-full bg-green-500"></span>
                      <span>在线</span>
                    </div>
                  </div>
                </div>
                <div class="flex items-center space-x-2">
                  <el-button
                    type="primary"
                    size="small"
                    @click="handleInvite(friend)"
                    :disabled="inviteCooldowns.get(friend.userId)"
                    :loading="inviteCooldowns.get(friend.userId)"
                  >
                    {{ inviteCooldowns.get(friend.userId) ? '冷却中' : '邀请' }}
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Close, Loading, CopyDocument, Plus, User, Search } from '@element-plus/icons-vue'
import { useMatchStore } from '@/stores/match'
import { useAuthStore } from '@/stores/auth'
import { useFriendStore } from '@/stores/friend'
import MatchmakingModal from '@/components/game/MatchmakingModal.vue'
import { wsService } from '@/services/websocket'
import { useResponsive } from '@/composables/useResponsive'

const route = useRoute()
const router = useRouter()
const matchStore = useMatchStore()
const authStore = useAuthStore()
const friendStore = useFriendStore()
const { isMobile } = useResponsive()

const room = ref(null)
const loading = ref(false)
const showMatchingModal = ref(false)
const showInviteDialog = ref(false)
const inviting = ref('')
const inviteCooldowns = ref(new Map())
const INVITE_COOLDOWN = 5000
const roomId = computed(() => {
  const id = route.params.roomId
  console.log('计算 roomId:', {
    params: route.params,
    id,
    room: room.value
  })
  return id
})
const friendsLoading = ref(false)
const searchQuery = ref('')

// 获取在线好友列表
const onlineFriends = computed(() => {
  console.log('计算在线好友列表:', {
    allFriends: friendStore.friends,
    onlineFriends: friendStore.friends.filter(f => f.status === 'online'),
    currentPlayers: room.value?.players
  })

  return friendStore.friends.filter(friend => 
    // 确保好友在线且不在当前房间中
    friend.status === 'online' &&
    room.value?.players?.every(player => player.userId !== friend.userId)
  )
})

// 过滤在线好友列表
const filteredFriends = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  return onlineFriends.value.filter(friend => 
    friend.username.toLowerCase().includes(query)
  )
})

// 加载好友列表
const loadFriends = async () => {
  try {
    friendsLoading.value = true
    console.log('开始加载好友列表')
    
    // 确保 WebSocket 连接正常
    if (!wsService.socket?.connected) {
      throw new Error('WebSocket 未连接')
    }
    
    await friendStore.getFriends()
    console.log('好友列表加载完成:', {
      total: friendStore.friends.length,
      online: friendStore.friends.filter(f => f.status === 'online').length,
      friends: friendStore.friends
    })
  } catch (error) {
    console.error('获取好友列表失败:', error)
    ElMessage.error(error.message || '获取好友列表失败')
  } finally {
    friendsLoading.value = false
  }
}

// 监听邀请弹窗显示状态
watch(showInviteDialog, async (newVal) => {
  if (newVal) {
    console.log('邀请弹窗打开，开始加载好友列表')
    await loadFriends()
    // 确保好友列表已加载
    if (filteredFriends.value.length === 0) {
      console.log('没有可邀请的在线好友')
    }
  }
})

// 调试用的响应性数据监听
watch(() => showInviteDialog.value, (newVal) => {
  console.log('邀请弹窗状态变化:', newVal)
})

watch(() => filteredFriends.value, (newVal) => {
  console.log('过滤后的好友列表:', newVal)
}, { immediate: true })

watch(() => inviting.value, (newVal) => {
  console.log('邀请状态变化:', newVal)
})

// 处理邀请好友
const handleInvite = async (friend) => {
  try {
    // 检查是否在冷却中
    if (inviteCooldowns.value.get(friend.userId)) {
      return
    }

    loading.value = true
    // 设置冷却状态
    inviteCooldowns.value.set(friend.userId, true)

    await wsService.inviteToRoom({
      friendId: friend.userId,
      roomId: roomId.value
    })

    ElMessage.success(`已邀请 ${friend.username} 加入房间`)
  } catch (error) {
    console.error('邀请好友失败:', error)
    ElMessage.error(error.message || '邀请失败')
  } finally {
    loading.value = false
    // 设置冷却定时器
    setTimeout(() => {
      inviteCooldowns.value.delete(friend.userId)
    }, INVITE_COOLDOWN)
  }
}

// 设置初始房间数据
const setInitialRoomData = () => {
  const roomData = route.query.roomData
  if (roomData) {
    try {
      const parsedData = JSON.parse(decodeURIComponent(roomData))
      console.log('解析房间数据:', parsedData)

      // 统一数据格式
      const normalizedData = {
        _id: parsedData._id,
        roomId: parsedData._id,
        name: parsedData.name,
        players: parsedData.players.map(player => ({
          userId: player.userId,
          username: player.username,
          ready: player.ready || false,
          isCreator: player.userId === parsedData.createdBy,
          health: player.health || 40,
          board: player.board || []
        })),
        maxPlayers: parsedData.maxPlayers,
        status: parsedData.status,
        createdBy: parsedData.createdBy,
        createdAt: parsedData.createdAt
      }

      // 验证必要字段
      if (!normalizedData._id || !normalizedData.players) {
        throw new Error('房间数据格式错误')
      }

      room.value = normalizedData

      console.log('设置初始房间数据:', {
        room: room.value,
        roomId: roomId.value,
        routeParams: route.params,
        currentUser: authStore.user,
        players: room.value?.players,
        isUserInRoom: room.value?.players?.some(p => p.userId === wsService.user?.userId)
      })

      // 如果是新加入的玩家，确保自己在玩家列表中
      if (!room.value.players.some(p => p.userId === wsService.user?.userId)) {
        room.value.players.push({
          userId: wsService.user.userId,
          username: wsService.user.username,
          ready: false,
          isCreator: false
        })
      }

    } catch (error) {
      console.error('解析房间数据失败:', {
        error,
        roomData,
        query: route.query,
        parsedData: JSON.parse(decodeURIComponent(roomData))
      })
      ElMessage.error('房间数据无效')
      router.push('/')
      return
    }
  } else {
    console.error('没有房间数据')
    router.push('/')
  }
}

// 计算当前用户是否是房主
const isCreator = computed(() => {
  return room.value?.players?.some(p => 
    p.userId === wsService.user?.userId && p.isCreator
  )
})

// 计算当前用户是否已准备
const isReady = computed(() => {
  return room.value?.players?.some(p => 
    p.userId === wsService.user?.userId && p.ready
  )
})

// 处理准备按钮点击
const handleReady = async () => {
  try {
    loading.value = true
    const response = await wsService.toggleReady(roomId.value)
    console.log('准备状态切换成功:', response)
  } catch (error) {
    console.error('准备状态切换失败:', error)
    ElMessage.error(error.message || '操作失败')
  } finally {
    loading.value = false
  }
}

// 处理离开房间
const handleLeave = async () => {
  try {
    // 显示确认对话框
    await ElMessageBox.confirm(
      '确定要离开房间吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    loading.value = true
    await wsService.leaveRoom()
    ElMessage.success('已离开房间')
    router.push('/')
  } catch (error) {
    if (error === 'cancel') return
    console.error('离开房间失败:', error)
    ElMessage.error(error.message || '离开房间失败')
  } finally {
    loading.value = false
  }
}

// 监听房间解散事件
const setupRoomEvents = () => {
  wsService.socket?.on('roomDeleted', () => {
    ElMessage.warning('房间已解散')
    router.push('/')
  })

  // 监听玩家离开事件
  wsService.socket?.on('playerLeft', (data) => {
    console.log('玩家离开房间:', data)
    if (room.value) {
      room.value.players = room.value.players.filter(
        player => player.userId !== data.userId
      )
      ElMessage.info(`玩家 ${data.username} 离开了房间`)
    }
  })

  // 监听准备状态变化
  wsService.socket?.on('readyStateChanged', (data) => {
    console.log('准备状态变化:', data)
    if (room.value && data.roomId === roomId.value) {
      // 检查数据格式
      if (data.players) {
        // 如果是旧格式的数据
        room.value.players = data.players.map(p => ({
          userId: p.userId,
          username: p.username,
          ready: p.ready,
          isCreator: p.userId === room.value.createdBy
        }))
        
        // 显示准备状态变化提示
        if (data.changedPlayer) {
          const readyStatus = data.changedPlayer.ready ? '已准备' : '取消准备'
          ElMessage.info(`${data.changedPlayer.username} ${readyStatus}`)
        }
      } else if (data.player) {
        // 如果是新格式的数据
        const player = room.value.players.find(
          p => p.userId === data.player.userId
        )
        if (player) {
          player.ready = data.ready
          
          // 显示准备状态变化提示
          const readyStatus = data.ready ? '已准备' : '取消准备'
          ElMessage.info(`${data.player.username} ${readyStatus}`)
        }
      }
      
      // 如果所有玩家都准备好了
      if (data.allReady) {
        ElMessage.success('所有玩家已准备就绪')
      }
    }
  })
}

// 设置 WebSocket 事件监听
const setupWebSocketEvents = () => {
  console.log('设置房间页面 WebSocket 事件监听:', {
    socketConnected: wsService.socket?.connected,
    socketId: wsService.socket?.id,
    roomId: roomId.value
  })

  if (!wsService.socket?.connected) {
    console.error('WebSocket 未连接，无法设置事件监听')
    return
  }

  // 先清理可能存在的旧监听器
  cleanupWebSocketEvents()

  // 玩家加入事件
  wsService.socket.on('playerJoined', (data) => {
    console.log('玩家加入:', data)
    if (data.players) {
      room.value = {
        ...room.value,
        players: data.players
      }
    }
  })

  // 监听房间邀请响应
  wsService.socket.on('roomInviteResponse', (data) => {
    console.log('收到房间邀请响应:', {
      data,
      currentRoomId: roomId.value,
      inviting: inviting.value
    })
    
    if (data.roomId === roomId.value) {
      if (data.success) {
        ElMessage.success(`${data.friendName} ${data.message}`)
      } else {
        ElMessage.info(`${data.friendName} ${data.message}`)
      }
      inviting.value = ''
    }
  })

  // 监听房间邀请失败
  wsService.socket.on('roomInviteFailed', (data) => {
    console.log('收到房间邀请失败:', {
      data,
      currentRoomId: roomId.value,
      inviting: inviting.value
    })
    
    if (data.roomId === roomId.value) {
      ElMessage.error(data.message || '邀请失败')
      inviting.value = ''
    }
  })

  // 监听房间邀请
  wsService.socket.on('roomInvitation', (data) => {
    console.log('收到房间邀请:', data)
    ElMessageBox.confirm(
      `${data.inviter.username} 邀请您加入房间 "${data.roomName}"`,
      '房间邀请',
      {
        confirmButtonText: '接受',
        cancelButtonText: '拒绝',
        type: 'info',
        showClose: false,
        closeOnClickModal: false,
        closeOnPressEscape: false,
        callback: async (action) => {
          try {
            const accept = action === 'confirm'
            await wsService.handleRoomInvitation({
              roomId: data.roomId,
              accept
            })
            
            if (accept) {
              // 如果接受邀请，跳转到房间
              router.push({
                name: 'room',
                params: { roomId: data.roomId },
                query: { roomData: encodeURIComponent(JSON.stringify(data.roomData)) }
              })
            }
          } catch (error) {
            console.error('处理房间邀请失败:', error)
            ElMessage.error(error.message || '处理邀请失败')
          }
        }
      }
    )
  })

  // 监听房间数据更新
  wsService.socket?.on('roomUpdated', (data) => {
    console.log('房间数据更新:', data)
    if (data.roomId === roomId.value) {
      room.value = {
        ...room.value,
        ...data,
        players: data.players.map(player => ({
          userId: player.userId,
          username: player.username,
          ready: player.ready || false,
          isCreator: player.userId === data.createdBy,
          health: player.health || 40,
          board: player.board || []
        }))
      }
    }
  })
}

// 清理 WebSocket 事件
const cleanupWebSocketEvents = () => {
  console.log('清理房间页面 WebSocket 事件监听')
  if (wsService.socket) {
    wsService.socket.off('playerJoined')
    wsService.socket.off('playerLeft')
    wsService.socket.off('roomUpdated')
    wsService.socket.off('readyStateChanged')
    wsService.socket.off('roomDeleted')
    wsService.socket.off('roomInviteResponse')
    wsService.socket.off('roomInviteFailed')
    wsService.socket.off('roomInvitation')
  }
}

// 复制房间号
const copyRoomId = () => {
  navigator.clipboard.writeText(roomId.value)
    .then(() => {
      ElMessage.success('房间号已复制')
    })
    .catch(() => {
      ElMessage.error('复制失败')
    })
}

const init = async () => {
  try {
    console.log('RoomView 组件挂载:', {
      roomId: roomId.value,
      wsConnected: wsService.socket?.connected,
      user: authStore.user,
      wsUser: wsService.user,
      room: room.value,
      isUserInRoom: room.value?.players?.some(p => p.userId === wsService.user?.userId)
    })
    
    // 确保 WebSocket 已连接
    if (!wsService.socket?.connected) {
      ElMessage.error('网络连接异常，请刷新页面重试')
      return
    }
  
    // 确保用户已登录
    if (!authStore.user?.userId) {
      ElMessage.error('用户未登录，请重新登录')
      router.push('/login')
      return
    }
  
    // 确保 WebSocket 服务中有用户信息
    if (!wsService.user?.userId) {
      wsService.user = authStore.user
      // 再次确认用户信息已设置
      if (!wsService.user?.userId) {
        throw new Error('无法设置用户信息')
      }
    }
  
    setInitialRoomData()
    setupWebSocketEvents()
    
    // 验证房间数据
    if (!room.value?._id || !room.value?.players) {
      throw new Error('房间数据验证失败')
    }

    // 如果是新创建的房间，创建者应该在玩家列表中
    if (room.value.players.length === 0 && wsService.user?.userId) {
      room.value.players.push({
        userId: wsService.user.userId,
        username: wsService.user.username,
        ready: false,
        isCreator: true
      })
    }

    setupRoomEvents()

  } catch (error) {
    console.error('初始化失败:', {
      error,
      room: room.value,
      user: wsService.user
    })
    ElMessage.error('初始化失败，请刷新页面重试')
    router.push('/')
  }
}

// 在开发环境下启用调试按钮
const isDev = ref(false)
if (import.meta.env.DEV) {
  isDev.value = true
}

onMounted(() => {
  init()
})

onUnmounted(() => {
  console.log('RoomView 组件卸载')
  cleanupWebSocketEvents()
  wsService.socket?.off('roomDeleted')
  // 清理所有冷却定时器
  inviteCooldowns.value.clear()
})

// 监听路由变化，在离开房间页面时自动退出房间
onBeforeRouteLeave(async (to, from, next) => {
  try {
    if (wsService.socket?.connected && room.value) {
      await wsService.leaveRoom()
    }
    next()
  } catch (error) {
    console.error('自动离开房间失败:', error)
    next()
  }
})
</script>

<style scoped>
.room-view {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  min-height: 100vh;
  color: white;
}

.room-card {
  background-color: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.room-title {
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.room-subtitle {
  color: rgba(255, 255, 255, 0.6);
}

.player-item,
.friend-item {
  background-color: rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.player-item:hover,
.friend-item:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

/* 确保 Element Plus 组件样式正确 */
:deep(.el-button) {
  --el-button-bg-color: transparent;
  --el-button-border-color: rgba(255, 255, 255, 0.2);
  --el-button-hover-bg-color: rgba(255, 255, 255, 0.1);
  --el-button-hover-border-color: rgba(255, 255, 255, 0.3);
}

:deep(.el-tag) {
  --el-tag-bg-color: rgba(255, 255, 255, 0.1);
  --el-tag-border-color: transparent;
}
</style> 