<template>
  <div class="space-y-4">
    <!-- 顶部操作栏 -->
    <div class="flex items-center gap-4">
      <h3 class="text-xl font-bold text-white">游戏房间</h3>
      <button 
        class="btn btn-secondary btn-icon"
        @click="fetchRooms"
        :disabled="loading"
      >
        <el-icon :class="{ 'animate-spin': loading }">
          <Refresh />
        </el-icon>
      </button>
    </div>

    <!-- 房间列表 -->
    <div v-if="rooms.length > 0" class="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      <div 
        v-for="room in rooms" 
        :key="room.roomId"
        class="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-colors"
      >
        <!-- 房间信息 -->
        <div class="flex justify-between items-start mb-4">
          <div>
            <h4 class="text-lg font-medium text-white mb-1">{{ room.name }}</h4>
            <p class="text-sm text-white/60">
              玩家数: {{ room.players }}/{{ room.maxPlayers }}
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
        
        <!-- 加入按钮 -->
        <button 
          class="btn btn-primary btn-full"
          @click="handleJoinRoom(room)"
          :disabled="loading || room.status !== 'waiting' || room.players >= room.maxPlayers"
        >
          <el-icon class="mr-1">
            <ArrowRight />
          </el-icon>
          加入房间
        </button>
      </div>
    </div>

    <!-- 空状态 -->
    <div 
      v-else 
      class="bg-white/10 backdrop-blur-sm rounded-lg p-8 text-center"
    >
      <el-icon class="text-4xl text-white/60 mb-4">
        <Box />
      </el-icon>
      <p class="text-white/60 mb-4">暂无房间</p>
      <button 
        class="btn btn-primary"
        @click="showCreateRoom = true"
      >
        <el-icon class="mr-1">
          <Plus />
        </el-icon>
        创建房间
      </button>
    </div>

    <!-- 创建房间弹窗 -->
    <el-dialog
      v-model="showCreateRoom"
      title="创建房间"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form 
        ref="formRef"
        :model="roomForm"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="房间名称" prop="name">
          <el-input 
            v-model="roomForm.name" 
            placeholder="请输入房间名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="flex justify-end gap-2">
          <button 
            class="btn btn-secondary"
            @click="handleCancel"
            :disabled="creating"
          >
            取消
          </button>
          <button 
            class="btn btn-primary"
            :disabled="creating"
            @click="handleCreateRoom"
          >
            <el-icon v-if="creating" class="animate-spin mr-1">
              <Loading />
            </el-icon>
            {{ creating ? '创建中...' : '创建' }}
          </button>
        </div>
      </template>
    </el-dialog>

    <!-- 房间详情弹窗 -->
    <room-detail
      v-model:visible="showRoomDetail"
      :room-id="currentRoomId"
      :initial-room-data="currentRoomData"
      @refresh="fetchRooms"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading, Refresh, Plus, ArrowRight, Box } from '@element-plus/icons-vue'
import { useMatchStore } from '@/stores/match'
import RoomDetail from './RoomDetail.vue'
import { wsService } from '@/services/websocket'

const matchStore = useMatchStore()
const rooms = ref([])
const loading = ref(false)
const showCreateRoom = ref(false)
const creating = ref(false)
const showRoomDetail = ref(false)
const currentRoomId = ref(null)
const currentRoomData = ref(null)
let refreshTimer = null

const formRef = ref(null)

const roomForm = ref({
  name: '',
  maxPlayers: 8  // 默认固定为8人
})

const rules = {
  name: [
    { required: true, message: '请输入房间名称', trigger: 'blur' },
    { min: 1, max: 50, message: '长度在1-50个字符之间', trigger: 'blur' }
  ]
  // 移除 maxPlayers 的验证规则
}

// 获取房间列表
const fetchRooms = async () => {
  loading.value = true
  try {
    if (!wsService.connected.value) {
      await new Promise(resolve => setTimeout(resolve, 1000)) // 等待连接建立
    }
    const response = await matchStore.getRooms()
    rooms.value = response.data
  } catch (error) {
    console.error('Fetch rooms failed:', error)
    ElMessage.error(error.message || '获取房间列表失败')
  } finally {
    loading.value = false
  }
}

// 加入房间
const handleJoinRoom = async (room) => {
  if (room.status !== 'waiting') {
    ElMessage.warning('该房间已开始游戏或已结束')
    return
  }
  
  if (room.players >= room.maxPlayers) {
    ElMessage.warning('房间已满')
    return
  }

  try {
    loading.value = true
    const response = await matchStore.joinRoom(room.roomId)
    if (response.code === 200) {
      if (response.data.alreadyInRoom) {
        ElMessage.info(response.message || '您已在该房间中')
      } else {
        ElMessage.success(response.message || '成功加入房间')
      }
      
      // 保存房间数据
      currentRoomId.value = response.data.roomId
      currentRoomData.value = response.data  // 保存完整的房间数据
      showRoomDetail.value = true
    }
  } catch (error) {
    console.error('Join room failed:', error)
    // 错误信息已在 interceptor 中统一处理
    if (error.code === 400) {
      switch (error.message) {
        case '您已在其他房间中':
          // 如果已在其他房间,直接显示那个房间的详情
          if (error.data?.roomId) {
            currentRoomId.value = error.data.roomId
            showRoomDetail.value = true
          }
          break
        case '您正在匹配中，无法加入房间':
          ElMessage.warning('请先取消匹配后再加入房间')
          break
      }
    } else if (error.code === 404) {
      if (error.message === '房间不存在') {
        // 房间可能已被删除,刷新列表
        fetchRooms()
      } else if (error.message === '用户不存在') {
        ElMessage.error('用户信息异常,请重新登录')
        // 可以在这里处理登出逻辑
      }
    }
  } finally {
    loading.value = false
  }
}

// 创建房间
const handleCreateRoom = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    creating.value = true
    
    // 1. 创建房间
    const createResponse = await matchStore.createRoom(roomForm.value)
    if (createResponse.code === 200) {
      // 2. 关闭创建房间弹窗并重置表单
      showCreateRoom.value = false
      roomForm.value = { name: '', maxPlayers: 8 }
      
      // 3. 直接使用创建房间返回的数据显示房间详情
      currentRoomId.value = createResponse.data.roomId
      currentRoomData.value = createResponse.data
      showRoomDetail.value = true
      
      // 4. 更新房间列表
      await fetchRooms()
      
      ElMessage.success('创建成功')
    }
  } catch (error) {
    console.error('Create room failed:', error)
    if (error.message) {
      ElMessage.error(error.message)
    }
  } finally {
    creating.value = false
  }
}

const handleCancel = () => {
  roomForm.value = { name: '', maxPlayers: 8 }
  showCreateRoom.value = false
}

// 自动刷新
const startAutoRefresh = () => {
  refreshTimer = setInterval(fetchRooms, 10000) // 每10秒刷新一次
}

// 监听房间列表更新
onMounted(() => {
  fetchRooms()
  wsService.onRoomListUpdate(fetchRooms)
  startAutoRefresh()
})

// 清理监听器
onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
  wsService.offRoomListUpdate(fetchRooms)
})
</script>

<style scoped>
.btn-icon {
  @apply w-8 h-8 p-0 flex items-center justify-center;
}

:deep(.el-dialog) {
  @apply bg-white/10 backdrop-blur-lg;
}

:deep(.el-dialog__header) {
  @apply text-white border-b border-white/10 mb-4;
}

:deep(.el-dialog__title) {
  @apply text-white;
}

:deep(.el-form-item__label) {
  @apply text-white;
}

:deep(.el-input__wrapper),
:deep(.el-select__wrapper) {
  @apply bg-white/20 border-white/10;
}

:deep(.el-input__inner) {
  @apply text-white;
}

:deep(.el-select-dropdown) {
  @apply bg-white/90 backdrop-blur-lg;
}
</style> 