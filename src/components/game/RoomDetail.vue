<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    :title="room?.name || '房间详情'"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
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
        <button 
          v-if="!isCreator"
          class="btn btn-primary"
          @click="handleReady"
          :disabled="loading"
        >
          {{ isReady ? '取消准备' : '准备' }}
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-else-if="loading" class="py-12 text-center">
      <el-icon class="animate-spin text-2xl text-white/60">
        <Loading />
      </el-icon>
    </div>
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

// 获取房间详情
const fetchRoomDetail = async () => {
  console.log('📡 开始获取房间详情, roomId:', props.roomId)
  if (!props.roomId) {
    console.warn('⚠️ 没有房间ID，取消获取详情')
    return
  }
  
  loading.value = true
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
  } finally {
    loading.value = false
  }
}

// 判断当前用户是否为房主
const isCreator = computed(() => {
  if (!room.value || !authStore.user) return false
  return room.value.createdBy === authStore.user.userId
})

// 获取当前用户的准备状态
const isReady = computed(() => {
  if (!room.value || !authStore.user) return false
  const currentPlayer = room.value.players.find(p => p.userId === authStore.user.userId)
  return currentPlayer?.ready || false
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

// 准备
const handleReady = async () => {
  if (isCreator.value) return // 房主无需准备
  
  try {
    loading.value = true
    await matchStore.ready(props.roomId)
    await fetchRoomDetail()
  } catch (error) {
    console.error('Ready failed:', error)
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
    if (room.value) {
      console.log('✅ 更新房间玩家列表')
      // 更新玩家列表
      room.value = {
        ...room.value,
        players: data.players || [...room.value.players, data.newPlayer]
      }
      console.log('更新后的房间数据:', room.value)
    }
  })

  // 玩家离开事件
  wsService.socket.on('playerLeft', (data) => {
    console.log('👋 收到playerLeft事件:', data)
    if (room.value) {
      console.log('✅ 更新房间玩家列表')
      room.value = {
        ...room.value,
        players: data.players || room.value.players.filter(p => p.userId !== data.userId)
      }
      console.log('更新后的房间数据:', room.value)
    }
  })

  // 准备状态改变事件
  wsService.socket.on('readyStateChanged', (data) => {
    console.log('🎮 收到readyStateChanged事件:', data)
    if (room.value) {
      console.log('✅ 更新玩家准备状态')
      const playerIndex = room.value.players.findIndex(p => p.userId === data.player.userId)
      if (playerIndex !== -1) {
        room.value.players[playerIndex].ready = data.player.ready
        console.log('更新后的玩家状态:', room.value.players[playerIndex])
      }
    }
  })

  // 房间删除事件
  wsService.socket.on('roomDeleted', (data) => {
    console.log('🗑️ 收到roomDeleted事件:', data)
    handleClose()
    ElMessage.warning('房间已被解散')
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
</style> 