<template>
  <div class="min-h-screen bg-gradient-to-br from-bg-secondary to-bg-primary">
    <!-- 主要内容区域 -->
    <div class="container mx-auto px-4 py-8">
      <room-list />
    </div>

    <!-- 社交悬浮按钮 -->
    <div 
      class="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2"
      :class="{ 'bottom-6 right-6 translate-y-0': isMobile }"
    >
      <el-button
        type="primary"
        class="social-btn !w-12 !h-12 !rounded-full flex items-center justify-center"
        :class="{ 'active': showSocialDrawer }"
        @click="showSocialDrawer = !showSocialDrawer"
      >
        <el-badge 
          :value="friendRequests.length" 
          :hidden="!friendRequests.length"
        >
          <el-icon class="text-xl">
            <UserFilled />
          </el-icon>
        </el-badge>
      </el-button>
    </div>

    <!-- 社交抽屉 -->
    <el-drawer
      v-model="showSocialDrawer"
      title="社交"
      :size="isMobile ? '90%' : '400px'"
      :with-header="false"
      direction="rtl"
      class="social-drawer"
    >
      <div class="h-full bg-bg-primary p-4 space-y-4">
        <!-- 好友列表 -->
        <div class="bg-white/5 backdrop-blur-sm rounded-lg p-4">
          <friend-list />
        </div>

        <!-- 好友请求 -->
        <div class="bg-white/5 backdrop-blur-sm rounded-lg p-4">
          <friend-requests />
        </div>

        <!-- 添加好友按钮 -->
        <el-button 
          type="primary" 
          class="w-full"
          @click="showAddFriendDialog = true"
        >
          添加好友
        </el-button>
      </div>
    </el-drawer>

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
        <div class="dialog-footer">
          <el-button @click="showAddFriendDialog = false">取消</el-button>
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { UserFilled } from '@element-plus/icons-vue'
import RoomList from '@/components/game/RoomList.vue'
import FriendList from '@/components/friend/FriendList.vue'
import FriendRequests from '@/components/friend/FriendRequests.vue'
import { useFriendStore } from '@/stores/friend'
import { useAuthStore } from '@/stores/auth'
import { wsService } from '@/services/websocket'

const friendStore = useFriendStore()
const authStore = useAuthStore()
const loading = ref(false)
const showAddFriendDialog = ref(false)
const showSocialDrawer = ref(false)
const formRef = ref(null)

const friendForm = ref({
  userId: '',
  message: '你好，我想添加你为好友'
})

// 从 store 获取好友请求列表
const friendRequests = computed(() => friendStore.friendRequests)

const validateUserId = (rule, value, callback) => {
  if (value?.trim() === authStore.user?.userId) {
    callback(new Error('不能向自己发送好友请求'))
  } else {
    callback()
  }
}

const rules = {
  userId: [
    { required: true, message: '请输入用户ID', trigger: 'blur' },
    { validator: validateUserId, trigger: 'blur' }
  ],
  message: [
    { required: true, message: '请输入留言', trigger: 'blur' },
    { max: 100, message: '留言长度不能超过100个字符', trigger: 'blur' }
  ]
}

// 添加移动端检测
const isMobile = computed(() => window.innerWidth <= 768)

// 处理添加好友
const handleAddFriend = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    loading.value = true
    
    const response = await friendStore.sendFriendRequest({
      toUserId: friendForm.value.userId,
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
    // 使用不同的提示样式
    if (['已经是您的好友', '已经发送过好友请求'].some(msg => error.message.includes(msg))) {
      ElMessage.warning(error.message)
    } else {
      ElMessage.error(error.message || '发送好友请求失败')
    }
  } finally {
    loading.value = false
  }
}

// 修改初始化函数
const initFriendData = async () => {
  try {
    if (!wsService.connected.value) {
      console.warn('WebSocket 未连接，跳过初始化好友数据')
      return
    }

    console.log('开始初始化好友数据...')
    await Promise.all([
      friendStore.getFriends(),
      friendStore.getFriendRequests()
    ])
    console.log('好友数据初始化完成')
  } catch (error) {
    console.error('初始化好友数据失败:', error)
  }
}

// 组件挂载时注册连接回调
onMounted(() => {
  console.log('注册 WebSocket 连接回调')
  wsService.onConnect(initFriendData)
  
  // 确保设置好友事件监听
  if (wsService.socket?.connected) {
    console.log('WebSocket 已连接，设置好友事件监听')
    wsService.setupFriendEvents()
  }
})

// 组件卸载时移除回调
onUnmounted(() => {
  console.log('移除 WebSocket 连接回调')
  wsService.offConnect(initFriendData)
})
</script>

<style scoped>
.social-btn {
  transition: all 0.3s ease;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.social-btn:hover,
.social-btn.active {
  transform: scale(1.1);
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.2);
}

.social-drawer :deep(.el-drawer__body) {
  padding: 0;
  background: var(--bg-primary);
}

/* 移动端样式 */
@media (max-width: 768px) {
  .add-friend-dialog :deep(.el-dialog) {
    margin: 20vh auto !important;
  }

  .add-friend-dialog :deep(.el-dialog__body) {
    padding: 1rem !important;
  }
}
</style> 