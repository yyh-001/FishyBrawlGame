<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    :title="room?.name || '房间详情'"
    :width="isMobile ? '95%' : '600px'"
    :close-on-click-modal="false"
    @close="handleClose"
    class="room-detail-dialog"
  >
    <div v-if="room" class="space-y-6">
      <!-- 房间信息 -->
      <div class="flex justify-between items-center">
        <div class="space-y-1">
          <h3 class="text-lg font-medium text-white">{{ room.name }}</h3>
          <p class="text-sm text-white/60">
            玩家数: {{ room.players?.length || 0 }}/{{ room.maxPlayers }}
          </p>
        </div>
        <span 
          class="px-3 py-1 rounded-full text-sm"
          :class="[
            room.status === 'waiting' 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-yellow-500/20 text-yellow-400'
          ]"
        >
          {{ room.status === 'waiting' ? '等待中' : '游戏中' }}
        </span>
      </div>

      <!-- 玩家列表 -->
      <div class="space-y-2">
        <h4 class="text-sm font-medium text-white/80">玩家列表</h4>
        <div class="grid grid-cols-2 gap-4">
          <div 
            v-for="player in room.players" 
            :key="player.userId"
            class="bg-white/10 rounded-lg p-3 flex items-center justify-between"
          >
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <span class="text-sm font-medium text-white">
                  {{ player.username[0]?.toUpperCase() }}
                </span>
              </div>
              <div>
                <p class="text-sm font-medium text-white">{{ player.username }}</p>
                <p class="text-xs text-white/60">Rating: {{ player.rating || 1000 }}</p>
              </div>
            </div>
            <el-tag 
              size="small"
              :type="player.ready ? 'success' : 'info'"
            >
              {{ player.isCreator ? '房主' : (player.ready ? '已准备' : '未准备') }}
            </el-tag>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex justify-end space-x-4">
        <button 
          class="btn btn-secondary"
          @click="handleLeave"
          :disabled="loading"
        >
          {{ loading ? '请稍候...' : '离开房间' }}
        </button>
        
        <!-- 所有玩家都显示准备按钮 -->
        <button 
          class="btn"
          :class="[isReady ? 'btn-secondary' : 'btn-primary']"
          @click="handleReady"
          :disabled="loading || (isCreator && !canCreatorReady)"
        >
          <el-icon v-if="loading" class="animate-spin mr-1">
            <Loading />
          </el-icon>
          {{ loading ? '请稍候...' : (isReady ? '取消准备' : '准备') }}
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-else-if="loading" class="py-12 text-center">
      <el-icon class="animate-spin text-2xl text-white/60">
        <Loading />
      </el-icon>
    </div>

    <!-- 添加匹配弹窗 -->
    <matchmaking-modal
      v-model:visible="showMatchingModal"
      :room-id="props.roomId"
    />
  </el-dialog>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { useMatchStore } from '@/stores/match'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { wsService } from '@/services/websocket'
import MatchmakingModal from './MatchmakingModal.vue'

const props = defineProps({
  visible: Boolean,
  roomId: String,
  initialRoomData: Object
})

const emit = defineEmits(['update:visible', 'refresh'])

const matchStore = useMatchStore()
const authStore = useAuthStore()
const room = ref(null)
const loading = ref(false)
const router = useRouter()
let refreshTimer = null

// 添加匹配弹窗控制
const showMatchingModal = ref(false)

// 获取房间详情
const fetchRoomDetail = async () => {
  console.log('📡 开始获取房间详情, roomId:', props.roomId)
  if (!props.roomId) {
    console.warn('⚠️ 没有房间ID，取消获取详情')
    return
  }
  
  try {
    if (props.initialRoomData) {
      console.log('📦 使用初始房间数据:', props.initialRoomData)
      room.value = props.initialRoomData
      return
    }

    console.log('🔄 请求房间详情...')
    const response = await matchStore.getRoomDetail(props.roomId)
    if (response.code === 200) {
      console.log('✅ 获取房间详情成功:', response.data)
      room.value = response.data
      
      // 检查游戏是否可以开始
      const allReady = room.value.players.every(p => p.ready || p.isCreator)
      if (allReady && room.value.players.length >= 2) {
        console.log('🎮 所有玩家已准备，准备开始游戏')
        ElMessage.success('所有玩家已准备，游戏即将开始')
        router.push(`/game/${props.roomId}`)
      }
    }
  } catch (error) {
    console.error('❌ 获取房间详情失败:', error)
    ElMessage.error(error.message || '获取房间信息失败')
    handleClose()
  }
}

// 判断当前用户是否为房主
const isCreator = computed(() => {
  if (!room.value || !authStore.user) {
    console.log('⚠️ 房间或用户信息不存在，无法判断房主状态')
    return false
  }
  const isCreator = room.value.createdBy === authStore.user.userId
  console.log('🎯 房主状态检查:', {
    roomCreator: room.value.createdBy,
    currentUser: authStore.user.userId,
    isCreator
  })
  return isCreator
})

// 获取当前用户的准备状态
const isReady = computed(() => {
  if (!room.value || !authStore.user) {
    console.log('⚠️ 房间或用户信息不存在')
    return false
  }
  const currentPlayer = room.value.players.find(p => p.userId === authStore.user.userId)
  console.log('👤 当前玩家状态:', {
    userId: authStore.user.userId,
    player: currentPlayer,
    ready: currentPlayer?.ready
  })
  return currentPlayer?.ready || false
})

// 添加房主是否可以准备的计算属性
const canCreatorReady = computed(() => {
  if (!room.value || !room.value.players) return false
  
  // 检查所有非房主玩家是否都已准备
  const nonCreatorPlayers = room.value.players.filter(player => !player.isCreator)
  const allNonCreatorReady = nonCreatorPlayers.every(player => player.ready)
  
  console.log('🎮 检查房主是否可以准备:', {
    totalPlayers: room.value.players.length,
    nonCreatorPlayers: nonCreatorPlayers.length,
    allNonCreatorReady
  })
  
  return allNonCreatorReady && nonCreatorPlayers.length > 0
})

// 离开房间
const handleLeave = async () => {
  try {
    loading.value = true
    const response = await matchStore.leaveRoom()
    
    // 无论房间是否存在，都关闭弹窗并刷新列表
    handleClose()
    emit('refresh')
    
    // 显示相应的提示信息
    if (response.data.message) {
      ElMessage.info(response.data.message)
    } else {
      ElMessage.success('已离开房间')
    }
  } catch (error) {
    console.error('Leave room failed:', error)
    // 如果是房间不存在的错误，也关闭弹窗
    if (error.message === '房间不存在') {
      handleClose()
      emit('refresh')
      ElMessage.info('房间已不存在')
    } else {
      ElMessage.error(error.message || '离开房间失败')
    }
  } finally {
    loading.value = false
  }
}

// 修改准备处理函数
const handleReady = async () => {
  // 如果是房主，检查是否可以准备
  if (isCreator.value && !canCreatorReady.value) {
    ElMessage.warning('请等待其他玩家准备完成后再准备')
    return
  }
  
  try {
    loading.value = true
    console.log('🎮 发送准备请求...')
    const response = await matchStore.ready(props.roomId)
    console.log('✅ 准备请求响应:', response)
    
    // 使用服务器返回的状态更新
    if (response.data) {
      // 如果返回了完整的房间数据，直接更新
      if (response.data.players) {
        console.log('📦 使用服务器返回的完整房间数据更新')
        room.value = {
          ...room.value,
          players: response.data.players
        }
      } 
      // 如果返回了单个玩家的状态
      else if (response.data.changedPlayer) {
        console.log('👤 更新单个玩家状态:', response.data.changedPlayer)
        const playerIndex = room.value.players.findIndex(
          p => p.userId === response.data.changedPlayer.userId
        )
        
        if (playerIndex !== -1) {
          const updatedPlayers = [...room.value.players]
          updatedPlayers[playerIndex] = {
            ...updatedPlayers[playerIndex],
            ready: response.data.changedPlayer.ready
          }
          
          room.value = {
            ...room.value,
            players: updatedPlayers
          }
        }
      }
      // 如果只返回了准备状态
      else if (response.data.ready !== undefined) {
        console.log('🔄 更新当前玩家准备状态:', response.data.ready)
        const currentUserId = authStore.user.userId
        const playerIndex = room.value.players.findIndex(p => p.userId === currentUserId)
        
        if (playerIndex !== -1) {
          const updatedPlayers = [...room.value.players]
          updatedPlayers[playerIndex] = {
            ...updatedPlayers[playerIndex],
            ready: response.data.ready
          }
          
          room.value = {
            ...room.value,
            players: updatedPlayers
          }
        }
      }
      
      // 显示准备状态变更提示
      const currentPlayer = room.value.players.find(p => p.userId === authStore.user.userId)
      if (currentPlayer) {
        ElMessage.success(currentPlayer.ready ? '已准备' : '已取消准备')
      }
      
      console.log('🔄 房间状态已更新:', {
        players: room.value.players,
        currentPlayer: room.value.players.find(p => p.userId === authStore.user.userId)
      })
    }
  } catch (error) {
    console.error('❌ Ready failed:', error)
    ElMessage.error(error.message || '准备失败')
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  emit('update:visible', false)
}

// 自动刷新
const startAutoRefresh = () => {
  refreshTimer = setInterval(fetchRoomDetail, 3000) // 每3秒刷新一次
}

// WebSocket 事件处理
const setupWebSocketEvents = () => {
  console.log('🔌 设置房间WebSocket事件监听, roomId:', props.roomId)
  
  // 玩家加入事件
  wsService.socket.on('playerJoined', (data) => {
    console.log('👥 收到playerJoined事件:', data)
    if (room.value && data) {
      console.log('✅ 更新房间玩家列表')
      room.value = {
        ...room.value,
        players: data.players || room.value.players
      }
      console.log('更新后的房间数据:', room.value)
    }
  })

  // 玩家离开事件
  wsService.socket.on('playerLeft', (data) => {
    console.log('👋 收到playerLeft事件:', data)
    if (room.value && data) {
      console.log('✅ 更新房间玩家列表')
      
      // 如果返回了新的玩家列表
      if (data.players) {
        room.value = {
          ...room.value,
          players: data.players,
          createdBy: data.newCreator || room.value.createdBy
        }
      } else {
        // 如果只返回了离开的玩家ID
        const updatedPlayers = room.value.players
          .filter(p => p.userId !== data.userId)
          .map(p => ({
            ...p,
            // 如果是新房主，更新 isCreator 状态
            isCreator: p.userId === data.newCreator
          }))

        room.value = {
          ...room.value,
          players: updatedPlayers,
          createdBy: data.newCreator || room.value.createdBy
        }
      }
      
      console.log('更新后的房间数据:', {
        players: room.value.players,
        createdBy: room.value.createdBy,
        currentUserId: authStore.user.userId,
        isCreator: room.value.createdBy === authStore.user.userId
      })

      // 如果当前用户成为了新房主
      if (data.newCreator === authStore.user.userId) {
        // 更新当前用户的 isCreator 状态
        const currentPlayerIndex = room.value.players.findIndex(p => p.userId === authStore.user.userId)
        if (currentPlayerIndex !== -1) {
          const updatedPlayers = [...room.value.players]
          updatedPlayers[currentPlayerIndex] = {
            ...updatedPlayers[currentPlayerIndex],
            isCreator: true,
            ready: false // 房主不需要准备状态
          }
          room.value = {
            ...room.value,
            players: updatedPlayers
          }
        }
        ElMessage.success('你已成为房主')
      }
    }
  })

  // 修改准备状态改变事件处理
  wsService.socket.on('readyStateChanged', (data) => {
    console.log('🎮 收到readyStateChanged事件:', data)
    if (!room.value || !data) {
      console.warn('⚠️ 房间或数据不存在')
      return
    }

    try {
      // 根据服务器返回的数据结构进行处理
      if (data.roomId && data.players) {
        console.log('✅ 使用服务器返回的玩家列表更新')
        room.value = {
          ...room.value,
          players: data.players
        }

        // 检查是否所有玩家都已准备
        if (data.allReady) {
          console.log('🎮 所有玩家已准备，开始匹配')
          // 关闭房间详情弹窗
          handleClose()
          // 显示匹配弹窗
          showMatchingModal.value = true
        }
        // 如果是房主且其他玩家都已准备，提示房主可以准备
        else if (isCreator.value && canCreatorReady.value) {
          ElMessage.success('其他玩家已准备完成，你可以准备了')
        }

        console.log('🔄 房间状态已更新:', {
          roomId: data.roomId,
          players: room.value.players,
          currentPlayer: room.value.players.find(p => p.userId === authStore.user.userId),
          allReady: data.allReady
        })
      } else {
        console.warn('⚠️ 无效的数据格式:', data)
      }
    } catch (error) {
      console.error('❌ 处理readyStateChanged事件失败:', error, {
        data,
        room: room.value
      })
    }
  })

  // 房间删除事件
  wsService.socket.on('roomDeleted', (data) => {
    console.log('🗑️ 收到roomDeleted事件:', data)
    if (data && data.roomId === props.roomId) {
      handleClose()
      ElMessage.warning('房间已被解散')
    }
  })

  // 监听匹配成功事件
  wsService.onMatchSuccess((data) => {
    console.log('🎯 收到匹配成功事件:', data)
    // 关闭匹配弹窗
    matchStore.setMatchingModalVisible(false)
    // 跳转到游戏页面
    router.push(`/game/${data.gameId}`)
  })

  // 监听匹配失败事件
  wsService.onMatchFailed((data) => {
    console.log('❌ 收到匹配失败事件:', data)
    ElMessage.error(data.message || '匹配失败')
    matchStore.setMatchingModalVisible(false)
  })

  // 监听匹配取消事件
  wsService.onMatchCanceled((data) => {
    console.log('⚠️ 收到匹配取消事件:', data)
    ElMessage.warning(data.message || '匹配已取消')
    matchStore.setMatchingModalVisible(false)
  })
}

// 清理 WebSocket 事件
const cleanupWebSocketEvents = () => {
  console.log('🧹 清理房间WebSocket事件监听')
  if (wsService.socket) {
    wsService.socket.off('playerJoined')
    wsService.socket.off('playerLeft')
    wsService.socket.off('readyStateChanged')
    wsService.socket.off('roomDeleted')
    wsService.offMatchEvents() // 清理匹配相关事件
  }
}

onMounted(() => {
  if (props.visible) {
    fetchRoomDetail()
    setupWebSocketEvents()
  }
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
  cleanupWebSocketEvents()
})

// 监听弹窗显示状态
watch(() => props.visible, (val) => {
  if (val) {
    fetchRoomDetail()
    setupWebSocketEvents()
  } else {
    if (refreshTimer) {
      clearInterval(refreshTimer)
    }
    cleanupWebSocketEvents()
  }
})

// 监听房间ID变化
watch(() => props.roomId, (val) => {
  if (val && props.visible) {
    fetchRoomDetail()
  }
})

// 监听初始数据变化
watch(() => props.initialRoomData, (val) => {
  if (val && props.visible) {
    room.value = val
  }
})

// 添加移动端检测
const isMobile = computed(() => window.innerWidth <= 768)
</script>

<style scoped>
:deep(.el-dialog) {
  @apply bg-white/10 backdrop-blur-lg;
}

:deep(.el-dialog__header) {
  @apply text-white border-b border-white/10 mb-4;
}

:deep(.el-dialog__title) {
  @apply text-white;
}

/* 移动端样式优化 */
@media (max-width: 768px) {
  .room-detail-dialog :deep(.el-dialog) {
    margin: 10vh auto !important;
  }

  .room-detail-dialog :deep(.el-dialog__body) {
    padding: 1rem !important;
  }

  /* 调整玩家列表在移动端的布局 */
  .grid-cols-2 {
    @apply grid-cols-1;
  }

  /* 调整按钮组在移动端的布局 */
  .flex.justify-end.gap-2 {
    @apply flex-col;
  }

  .flex.justify-end.gap-2 button {
    @apply w-full mb-2 last:mb-0;
  }
}
</style> 