<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 relative overflow-hidden">
    <!-- 背景卡牌动画 -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div v-for="i in 12" :key="i" 
        class="card absolute"
        :style="{ 
          left: `${Math.random() * 100}%`, 
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 8}s`,
          animationDuration: `${15 + Math.random() * 15}s`,
          width: `${80 + Math.random() * 40}px`,
          height: `${120 + Math.random() * 40}px`,
          opacity: 0.1 + Math.random() * 0.1
        }"
      ></div>
    </div>

    <!-- 原有内容，添加 relative z-10 确保在背景之上 -->
    <div class="relative z-10">
      <!-- 顶部导航栏 -->
      <header class="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div class="container mx-auto px-8 py-5 border-x border-white/20">
          <div class="flex items-center justify-between">
            <!-- Logo和标题 -->
            <div class="flex items-center space-x-6">
              <h1 class="text-2xl font-bold text-white">Fishy Brawl</h1>
            </div>

            <!-- 右侧用户区域 -->
            <div class="flex items-center space-x-4">
              <!-- Steam 风格的用户信息下拉菜单 -->
              <el-dropdown trigger="click" class="steam-dropdown">
                <div class="steam-user-info">
                  <div class="steam-avatar">
                    <div class="steam-avatar-inner">
                      {{ userInitial }}
                    </div>
                  </div>
                  <div class="steam-user-details">
                    <div class="steam-username">{{ username }}</div>
                    <div class="steam-level">
                      <span class="level-tag">Lv.{{ userLevel }}</span>
                      <span class="rating">Rating: {{ userRating }}</span>
                    </div>
                  </div>
                  <el-icon class="text-white/60 ml-2"><ArrowDown /></el-icon>
                </div>

                <template #dropdown>
                  <el-dropdown-menu class="steam-dropdown-menu">
                    <el-dropdown-item class="steam-dropdown-item">
                      <div class="flex items-center space-x-2">
                        <el-icon><User /></el-icon>
                        <span>个人资料</span>
                      </div>
                    </el-dropdown-item>
                    <el-dropdown-item class="steam-dropdown-item">
                      <div class="flex items-center space-x-2">
                        <el-icon><Trophy /></el-icon>
                        <span>对战记录</span>
                      </div>
                    </el-dropdown-item>
                    <el-dropdown-item class="steam-dropdown-item">
                      <div class="flex items-center space-x-2">
                        <el-icon><Setting /></el-icon>
                        <span>设置</span>
                      </div>
                    </el-dropdown-item>
                    <el-dropdown-item divided class="steam-dropdown-item" @click="handleLogout">
                      <div class="flex items-center space-x-2 text-red-400">
                        <el-icon><SwitchButton /></el-icon>
                        <span>退出登录</span>
                      </div>
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </div>
      </header>

      <!-- 主要内容区域 -->
      <main class="container mx-auto px-8 py-8 min-h-[calc(100vh-84px)] flex flex-col">
        <!-- 欢迎卡片 -->
        <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mt-12">
          <div>
            <h2 class="text-3xl font-bold text-white mb-2">
              欢迎回来，{{ username }}
            </h2>
            <p class="text-white/80">
              您的当前积分：
              <span class="text-blue-400 font-semibold">{{ userRating }}</span>
            </p>
          </div>
        </div>

        <!-- 数据统计卡片 -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-colors">
            <h3 class="text-white/60 text-sm font-medium mb-2">对战次数</h3>
            <p class="text-3xl font-bold text-blue-400">{{ stats.totalGames }}</p>
          </div>
          <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-colors">
            <h3 class="text-white/60 text-sm font-medium mb-2">胜率</h3>
            <p class="text-3xl font-bold text-blue-400">{{ stats.winRate }}%</p>
          </div>
          <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-colors">
            <h3 class="text-white/60 text-sm font-medium mb-2">最高积分</h3>
            <p class="text-3xl font-bold text-blue-400">{{ stats.highestRating }}</p>
          </div>
        </div>

        <!-- 开始匹配按钮 -->
        <div class="flex-grow flex items-center justify-center mt-8 mb-16">
          <button 
            class="transform hover:scale-110 transition-all duration-300 bg-blue-600 hover:bg-blue-700 text-white px-16 py-4 rounded-xl font-medium text-xl shadow-lg hover:shadow-2xl"
            @click="handleStartMatch"
          >
            开始匹配
          </button>
        </div>

        <!-- 匹配对战弹窗 -->
        <matching-modal 
          v-model:visible="showMatchingModal"
          @cancel="handleCancelMatching"
        />
      </main>
    </div>

    <!-- Steam 风格的社交面板 -->
    <div 
      class="fixed right-4 bottom-4 z-50 flex flex-col items-end"
      v-click-outside="closeSocialPanel"
    >
      <!-- 组队按钮 -->
      <button
        class="steam-social-btn mb-2 group"
        @click="handleCreateRoom"
      >
        <el-icon class="text-xl">
          <Plus />
        </el-icon>
        <span class="ml-2">组队</span>
      </button>

      <!-- 社交按钮 -->
      <button
        class="steam-social-btn mb-2 group"
        :class="{ 'active': showSocialPanel }"
        @click="showSocialPanel = !showSocialPanel"
      >
        <el-badge 
          :value="friendRequests.length" 
          :hidden="!friendRequests.length"
          :max="99"
          class="mr-2"
        >
          <el-icon class="text-xl">
            <UserFilled />
          </el-icon>
        </el-badge>
        <span class="ml-2">好友</span>
      </button>

      <!-- Steam 风格的社交面板 -->
      <div 
        v-show="showSocialPanel"
        class="steam-panel"
      >
        <!-- 状态选择器 -->
        <div class="steam-panel-header">
          <div class="flex items-center">
            <div class="w-8 h-8 rounded bg-white/10 flex items-center justify-center mr-2">
              {{ userInitial }}
            </div>
            <div class="flex-1">
              <div class="text-sm font-medium text-white">{{ username }}</div>
              <div class="steam-user-id" @click="copyUserId">
                <span class="text-xs text-white/80">UID: {{ userId }}</span>
                <el-icon class="text-white/60 text-xs copy-icon hover:text-white/90">
                  <CopyDocument />
                </el-icon>
              </div>
            </div>
          </div>
        </div>

        <!-- 好友列表 -->
        <div class="steam-panel-content">
          <div class="friend-category">
            <friend-list />
          </div>

          <div v-if="friendRequests.length > 0" class="friend-category">
            <div class="friend-category-header">
              好友请求 ({{ friendRequests.length }})
            </div>
            <friend-requests />
          </div>
        </div>

        <!-- 底部操作栏 -->
        <div class="steam-panel-footer">
          <el-button 
            type="primary" 
            size="small"
            @click="showAddFriendDialog = true"
          >
            添加好友
          </el-button>
        </div>
      </div>
    </div>

    <!-- 添加好友弹窗 -->
    <el-dialog
      v-model="showAddFriendDialog"
      title="添加好友"
      :width="isMobile ? '90%' : '400px'"
      class="add-friend-dialog"
    >
      <el-form 
        ref="formRef"
        :model="friendForm"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="用户ID" prop="userId">
          <el-input 
            v-model="friendForm.userId" 
            placeholder="请输入要添加的用户ID"
          />
        </el-form-item>
        <el-form-item label="留言" prop="message">
          <el-input 
            v-model="friendForm.message" 
            type="textarea"
            placeholder="请输入留言"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="showAddFriendDialog = false">
            取消
          </el-button>
          <el-button 
            type="primary"
            @click="handleAddFriend"
            :loading="loading"
          >
            发送请求
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useFriendStore } from '@/stores/friend'
import { useWebSocketService } from '@/services/websocket'
import { useMatchStore } from '@/stores/match'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UserFilled, ArrowDown, User, Trophy, Setting, SwitchButton, CopyDocument, Plus } from '@element-plus/icons-vue'
import MatchmakingModal from '@/components/game/MatchmakingModal.vue'
import FriendList from '@/components/friend/FriendList.vue'
import FriendRequests from '@/components/friend/FriendRequests.vue'
import { useResponsive } from '@/composables/useResponsive'
import MatchingModal from '@/components/game/MatchingModal.vue'

const router = useRouter()
const wsService = useWebSocketService()
const authStore = useAuthStore()
const friendStore = useFriendStore()
const matchStore = useMatchStore()
const currentRoomId = ref('')

// 用户相关的计算属性
const username = computed(() => {
  const user = authStore.user
  return user ? user.username : '玩家'
})

const userInitial = computed(() => {
  const name = username.value
  return name ? name[0]?.toUpperCase() : 'U'
})

const userRating = computed(() => {
  const user = authStore.user
  return user ? user.rating : 1000
})

const showMatchingModal = ref(false)

// 计算统计数据
const stats = computed(() => {
  const user = authStore.user
  return {
    totalGames: user?.totalGames || 0,
    winRate: user?.winRate || 0,
    highestRating: user?.highestRating || userRating.value
  }
})

// 添加社交相关的状态
const showSocialPanel = ref(false)
const showAddFriendDialog = ref(false)
const loading = ref(false)
const formRef = ref(null)

// 用于防止重复处理邀请
const processingInvites = ref(new Set())

// 从 store 获取好友请求列表
const friendRequests = computed(() => friendStore.friendRequests)

// 计算在线和离线好友
const onlineFriends = computed(() => 
  friendStore.friends.filter(f => f.status === 'online' || f.status === 'in_game')
)
const offlineFriends = computed(() => 
  friendStore.friends.filter(f => f.status === 'offline')
)

// 添加用户等级计算
const userLevel = computed(() => {
  const rating = userRating.value
  return Math.floor((rating - 1000) / 100) + 1
})

// 添加用户ID计算属性
const userId = computed(() => {
  const user = authStore.user
  return user ? user.userId : ''
})

// 添加复制 UID 方法
const copyUserId = async () => {
  try {
    await navigator.clipboard.writeText(userId.value)
    ElMessage.success('用户ID已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    // 使用备用方法
    const textarea = document.createElement('textarea')
    textarea.value = userId.value
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      ElMessage.success('用户ID已复制到剪贴板')
    } catch (err) {
      ElMessage.error('复制失败，请手动复制')
    } finally {
      document.body.removeChild(textarea)
    }
  }
}

// 当社交面板显示时获取数据
watch(showSocialPanel, async (newVal) => {
  if (newVal) {
    try {
      // 等待 WebSocket 连接
      if (!wsService.connected.value) {
        console.log('等待 WebSocket 连接...')
        let retryCount = 0
        const maxRetries = 10

        while (!wsService.connected.value && retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 500))
          retryCount++
          console.log(`尝试第 ${retryCount} 次连接...`)
        }

        if (!wsService.connected.value) {
          throw new Error('WebSocket 连接超时')
          return
        }
      }

      console.log('社交面板打开，开始获取好友数据...')
      await Promise.all([
        friendStore.getFriends(),
        friendStore.getFriendRequests()
      ])
      console.log('好友数据获取完成')
    } catch (error) {
      console.error('获取好友数据失败:', error)
      ElMessage.error('获取好友数据失败，请重试')
    }
  }
})

// 关闭社交面板时清空数据
watch(showSocialPanel, (newVal) => {
  if (!newVal) {
    // 清空好友列表和请求列表
    friendStore.$reset()
  }
})

const { isMobile } = useResponsive()

// 开始匹配
const startMatching = async () => {
  try {
    console.log('点击开始匹配按钮')
    await wsService.startMatching()
    console.log('匹配请求发送成功')
    showMatchingModal.value = true
  } catch (error) {
    console.error('开始匹配失败:', error)
    ElMessage.error(error.message || '开始匹配失败')
    showMatchingModal.value = false
  }
}

// 取消匹配
const handleCancelMatching = () => {
  console.log('取消匹配')
  showMatchingModal.value = false
  ElMessage.info('已取消匹配')
}

// 修改匹配按钮的点击处理
const handleStartMatch = () => {
  console.log('准备开始匹配')
  startMatching()
}

// 监听匹配状态
watch(showMatchingModal, (newVal) => {
  if (!newVal) {
    currentRoomId.value = ''
  }
})

const rules = {
  userId: [
    { required: true, message: '请输入用户ID', trigger: 'blur' }
  ],
  message: [
    { required: true, message: '请输入留言', trigger: 'blur' },
    { max: 100, message: '留言长度不能超过100个字符', trigger: 'blur' }
  ]
}

// 处理添加好友
const handleAddFriend = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    loading.value = true
    
    const response = await friendStore.sendFriendRequest({
      toUserId: friendForm.value.userId.trim(),
      message: friendForm.value.message
    })
    
    if (response.success && response.data.requestSent) {
      showAddFriendDialog.value = false
      // 重置表单
      friendForm.value = {
        userId: '',
        message: '你好，我想添加你为好友'
      }
    }
  } catch (error) {
    console.error('添加好友失败:', error)
    if (['已经是您的好友', '已经发送过好友请求'].some(msg => error.message.includes(msg))) {
      ElMessage.warning(error.message)
    } else {
      ElMessage.error(error.message || '发送好友请求失败')
    }
  } finally {
    loading.value = false
  }
}

// 验证用户ID
const validateUserId = (rule, value, callback) => {
  const currentUserId = authStore.user?.userId
  if (!value?.trim()) {
    callback(new Error('请输入用户ID'))
  } else if (value.trim() === currentUserId) {
    callback(new Error('不能向自己发送好友请求'))
  } else {
    callback()
  }
}

// 处理登出
const handleLogout = () => {
  authStore.logout()
  ElMessage.success('已退出登录')
  router.push('/login')
}

// 处理创建房间
const handleCreateRoom = async () => {
  try {
    const response = await wsService.createQuickRoom()
    console.log('创建房间成功:', response)
    
    // 确保房间数据格式正确
    const roomData = {
      _id: response.roomId,
      roomId: response.roomId,
      name: response.name,
      players: response.players || [],
      maxPlayers: response.maxPlayers,
      status: response.status,
      createdBy: response.createdBy,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt
    }

    console.log('准备跳转到房间:', roomData)

    // 直接跳转到房间页面，并传递房间数据
    router.push({
      name: 'RoomDetail',
      params: {
        roomId: response.roomId,
      },
      query: {
        roomData: encodeURIComponent(JSON.stringify(roomData))
      }
    })
  } catch (error) {
    console.error('创建房间失败:', error)
    ElMessage.error(error.message || '创建房间失败')
  }
}

// 设置 WebSocket 事件监听
const setupWebSocketEvents = () => {
  // 先清理可能存在的旧监听器
  cleanupWebSocketEvents()

  // 如果已连接，直接设置事件监听
  if (wsService.socket?.connected) {
    setupEvents()
  }

  // 监听连接成功事件
  wsService.onConnect(() => {
    console.log('WebSocket 连接成功，设置事件监听')
    setupEvents()
  })
}

// 实际设置事件的函数
const setupEvents = () => {
  console.log('设置大厅页面 WebSocket 事件监听')

  // 监听房间邀请
  wsService.socket.on('roomInvitation', handleRoomInvitation)
}

// 处理房间邀请
const handleRoomInvitation = (data) => {
  console.log('收到房间邀请:', data)
  
  // 检查是否正在处理该邀请
  if (processingInvites.value.has(data.roomId)) {
    console.log('该邀请正在处理中，忽略重复邀请:', data.roomId)
    return
  }
  
  // 标记该邀请正在处理
  processingInvites.value.add(data.roomId)

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
          const response = await wsService.handleRoomInvitation({
            roomId: data.roomId,
            accept
          })
          
          if (accept && response.success) {
            console.log('准备跳转到房间:', {
              roomId: data.roomId,
              roomData: data.roomData
            })

            // 如果接受邀请，跳转到房间
            router.push({
              name: 'RoomDetail',
              params: { roomId: data.roomId },
              query: { 
                roomData: encodeURIComponent(JSON.stringify(data.roomData))
              }
            })
          }
        } catch (error) {
          console.error('处理房间邀请失败:', {
            error,
            data,
            routerError: error.message.includes('No match for') ? '路由匹配失败' : '其他错误'
          })
          ElMessage.error(error.message || '处理邀请失败')
        } finally {
          // 处理完成后移除标记
          processingInvites.value.delete(data.roomId)
        }
      }
    }
  )
}

// 清理 WebSocket 事件监听
const cleanupWebSocketEvents = () => {
  console.log('清理大厅页面 WebSocket 事件监听')
  if (wsService.socket) {
    wsService.socket.off('roomInvitation', handleRoomInvitation)
  }
  // 移除连接成功的回调
  wsService.offConnect(setupEvents)
  // 清理处理中的邀请记录
  processingInvites.value.clear()
}

// 组件挂载时设置事件监听
onMounted(() => {
  console.log('HomeView 组件挂载')
  setupWebSocketEvents()
})

// 组件卸载时清理事件监听
onUnmounted(() => {
  console.log('HomeView 组件卸载')
  cleanupWebSocketEvents()
})
</script>

<style scoped>
.el-dropdown-menu {
  @apply bg-white/20 backdrop-blur-sm border-white/10;
}

.el-dropdown-item {
  @apply text-white hover:bg-white/10;
}

/* 添加按钮悬浮动画 */
@keyframes float {
  0%, 100% {
    transform: translateY(0) scale(1.1);
  }
  50% {
    transform: translateY(-10px) scale(1.1);
  }
}

button:hover {
  animation: float 2s ease-in-out infinite;
}

/* 调整下拉菜单样式 */
:deep(.el-dropdown-menu) {
  @apply p-2 min-w-[120px];
}

:deep(.el-dropdown-menu__item) {
  @apply px-4 py-2 text-base rounded-lg;
}

/* 卡牌背景动画 */
.card {
  background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
  border-radius: 10px;
  backdrop-filter: blur(2px);
  border: 1px solid rgba(255,255,255,0.1);
  animation: cardFloat linear infinite;
  transform-origin: center;
}

@keyframes cardFloat {
  0% {
    transform: translate(0, 0) rotate(0deg);
  }
  100% {
    transform: translate(calc(100vw + 200px), calc(100vh + 200px)) rotate(360deg);
  }
}

/* 移动端优化 */
@media (max-width: 768px) {
  .card {
    animation-duration: 20s !important;
  }

  @keyframes cardFloat {
    0% {
      transform: translate(0, 0) rotate(0deg);
    }
    100% {
      transform: translate(calc(100vw + 100px), calc(50vh + 100px)) rotate(360deg);
    }
  }
}

/* 确保内容区域的背景模糊效果 */
.bg-white\/10 {
  backdrop-filter: blur(8px);
}

/* Steam 风格的社交按钮 */
.steam-social-btn {
  @apply flex items-center px-4 py-2 rounded bg-gray-800/90 text-white/90 
         hover:bg-gray-700/90 transition-colors relative;
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.steam-social-btn.active {
  @apply bg-gray-700/90;
}

/* Steam 风格的面板 */
.steam-panel {
  @apply absolute bottom-12 right-0 w-80 bg-gray-900/95 rounded-lg overflow-hidden
         border border-gray-700/50 shadow-xl;
  backdrop-filter: blur(12px);
}

.steam-panel-header {
  @apply p-3 border-b border-gray-700/50 bg-gray-800/50;
}

.steam-panel-content {
  @apply p-2 max-h-[400px] overflow-y-auto;
}

.steam-panel-footer {
  @apply p-3 border-t border-gray-700/50 bg-gray-800/50;
}

/* 好友分类 */
.friend-category {
  @apply mb-4 last:mb-0;
}

.friend-category-header {
  @apply text-xs text-gray-400 px-2 py-1 bg-gray-800/50 rounded mb-1;
}

/* 滚动条样式 */
.steam-panel-content {
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.2) transparent;
}

.steam-panel-content::-webkit-scrollbar {
  width: 6px;
}

.steam-panel-content::-webkit-scrollbar-track {
  background: transparent;
}

.steam-panel-content::-webkit-scrollbar-thumb {
  @apply bg-white/20 rounded;
}

/* 移动端样式优化 */
@media (max-width: 768px) {
  .add-friend-dialog :deep(.el-dialog) {
    margin: 20vh auto !important;
  }

  .add-friend-dialog :deep(.el-dialog__body) {
    padding: 1rem !important;
  }
}

/* Steam 风格的用户信息 */
.steam-user-info {
  @apply flex items-center px-3 py-2 rounded bg-gray-800/90 
         hover:bg-gray-700/90 transition-colors cursor-pointer;
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.steam-avatar {
  @apply relative mr-3;
}

.steam-avatar-inner {
  @apply w-10 h-10 rounded bg-gray-700/90 flex items-center justify-center
         text-lg font-medium text-white border-2 border-gray-600/50;
}

.steam-user-details {
  @apply flex flex-col min-w-[120px];
}

.steam-username {
  @apply text-white font-medium text-sm;
}

.steam-level {
  @apply flex items-center space-x-2 text-xs;
}

.level-tag {
  @apply px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400;
}

.rating {
  @apply text-gray-400;
}

/* Steam 风格的下拉菜单 */
.steam-dropdown-menu {
  @apply !bg-gray-800/95 !border-gray-700/50;
  backdrop-filter: blur(12px);
  min-width: 200px;
}

.steam-dropdown-item {
  @apply text-white/90 hover:!bg-gray-700/90;
  line-height: 2;
}

:deep(.el-dropdown-menu__item.is-disabled) {
  @apply text-white/30;
}

:deep(.el-dropdown-menu__item--divided) {
  @apply border-gray-700/50;
}

:deep(.el-dropdown-menu__item--divided::before) {
  @apply bg-gray-800/95;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .steam-user-info {
    @apply px-2 py-1;
  }

  .steam-avatar-inner {
    @apply w-8 h-8 text-base;
  }

  .steam-username {
    @apply text-xs;
  }

  .steam-level {
    @apply text-[10px];
  }
}

/* 添加 UID 样式 */
.steam-user-id {
  @apply flex items-center cursor-pointer hover:text-white/90 transition-colors;
}

.steam-user-id:hover .copy-icon {
  @apply text-white/90;
}

.copy-icon {
  @apply text-xs transition-colors;
}
</style> 